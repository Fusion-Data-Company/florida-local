import session from 'express-session';
import connectPg from 'connect-pg-simple';
import memorystore from 'memorystore';
import { randomBytes } from 'crypto';
import { checkRedisConnection, createRedisStore } from '../redis';
import { testDatabaseConnection } from '../db';
import { logger } from '../monitoring';
import type { AppConfig } from '../config';
import { captureSessionDegradation } from '../monitoring/authSentry';

const MemoryStore = memorystore(session);

export interface SessionStoreResult {
  store: session.Store;
  type: 'redis' | 'postgresql' | 'memory';
}

// Global reference to current session store for runtime degradation
let currentSessionStore: {
  store: session.Store;
  type: 'redis' | 'postgresql' | 'memory';
} | null = null;

export async function createSessionStore(config: AppConfig): Promise<SessionStoreResult> {
  logger.info('🔐 Creating session store with fallback chain...');
  logger.info('   - Option 1: Redis (if configured)');
  logger.info('   - Option 2: PostgreSQL (if database available)');
  logger.info('   - Option 3: Memory (last resort)');

  const sessionTtl = 7 * 24 * 60 * 60;

  if (config.redisHost) {
    logger.info('   - Checking Redis availability...');
    try {
      const redisAvailable = await Promise.race([
        checkRedisConnection(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('Redis check timeout')), 3000)
        )
      ]);

      if (redisAvailable) {
        logger.info('   - Redis is available, creating Redis store...');
        const store = await createRedisStore(session);
        logger.info('✅ Using Redis for session storage');

        const result = { store, type: 'redis' as const };
        currentSessionStore = result;
        return result;
      }
    } catch (error) {
      logger.warn('⚠️  Redis not available:', (error as Error).message);
    }
  }

  logger.info('   - Redis not available, trying PostgreSQL...');
  try {
    const dbAvailable = await Promise.race([
      testDatabaseConnection(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Database check timeout')), 3000)
      )
    ]);

    if (dbAvailable) {
      logger.info('   - PostgreSQL is available, creating PostgreSQL session store...');
      const PgStore = connectPg(session);
      const store = new PgStore({
        conString: config.databaseUrl,
        createTableIfMissing: true,
        ttl: sessionTtl,
        tableName: 'sessions',
        schemaName: 'public',
        errorLog: (error: Error) => {
          logger.error('❌ PostgreSQL session store error:', { message: error.message });
          // Degrade to memory store if PostgreSQL errors are frequent
          degradeToMemoryStoreIfNeeded();
        },
      });

      store.on('error', (error: Error) => {
        logger.error('❌ Session store connection error:', { message: error.message });
        degradeToMemoryStoreIfNeeded();
      });

      logger.info('✅ Using PostgreSQL for session storage');

      const result = { store, type: 'postgresql' as const };
      currentSessionStore = result;
      return result;
    }
  } catch (error) {
    logger.warn('⚠️  PostgreSQL not available:', (error as Error).message);
  }

  logger.warn('⚠️  Falling back to in-memory session store (sessions will not persist across restarts)');
  const store = new MemoryStore({
    checkPeriod: 86400000,
  });

  logger.info('✅ Using Memory for session storage');

  const result = { store, type: 'memory' as const };
  currentSessionStore = result;
  return result;
}

// Track session store errors for degradation decision
let sessionStoreErrorCount = 0;
let lastErrorTime = 0;
const ERROR_THRESHOLD = 5; // Degrade after 5 errors in 1 minute
const ERROR_WINDOW_MS = 60000; // 1 minute

function degradeToMemoryStoreIfNeeded() {
  const now = Date.now();

  // Reset error count if outside the time window
  if (now - lastErrorTime > ERROR_WINDOW_MS) {
    sessionStoreErrorCount = 0;
  }

  sessionStoreErrorCount++;
  lastErrorTime = now;

  // If we've exceeded the threshold and not already using memory, degrade
  if (
    sessionStoreErrorCount >= ERROR_THRESHOLD &&
    currentSessionStore?.type !== 'memory'
  ) {
    const fromStore = currentSessionStore?.type || 'unknown';

    logger.error(`❌ Session store degradation triggered! ${sessionStoreErrorCount} errors in ${ERROR_WINDOW_MS}ms`);
    logger.warn('⚠️  Switching to in-memory session store for reliability');

    // Capture in Sentry for alerting
    captureSessionDegradation(
      fromStore,
      'memory',
      `${sessionStoreErrorCount} errors in ${ERROR_WINDOW_MS}ms`,
      sessionStoreErrorCount
    );

    // Create new memory store
    const memoryStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    currentSessionStore = { store: memoryStore, type: 'memory' };

    logger.error('🚨 ALERT: Session store degraded to memory - investigate database/redis issues!');
  }
}

export function getCurrentSessionStore(): SessionStoreResult | null {
  return currentSessionStore;
}

export function createSessionMiddleware(store: session.Store, config: AppConfig) {
  const sessionTtlMs = 7 * 24 * 60 * 60 * 1000;
  
  const cookieConfig: session.CookieOptions = {
    httpOnly: true,
    secure: config.isProduction,
    maxAge: sessionTtlMs,
    // CRITICAL: Use 'lax' for OAuth flows that return to same domain
    // 'lax' allows cookies on top-level navigation (OAuth redirects)
    // 'none' would be needed for cross-origin iframes, but not for OAuth
    sameSite: 'lax' as const,
  };
  
  // CRITICAL: Do NOT set cookie domain for OAuth flows
  // Setting domain to .replit.app breaks OAuth because:
  // 1. User visits the-florida-local.replit.app
  // 2. Cookie set with domain=.replit.app
  // 3. Redirect to replit.com (different domain!)
  // 4. Cookie not sent to replit.com (wrong domain)
  // 5. OAuth state lost → "Unable to verify authorization request state"
  //
  // Solution: Let browser set cookie domain to exact host (the-florida-local.replit.app)
  // This ensures cookies persist during same-origin OAuth callbacks

  logger.info(`🍪 Cookie domain: using default (current host only) for OAuth compatibility`);
  
  logger.info(`🔐 Session configuration:`, {
    isProduction: config.isProduction,
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    domain: cookieConfig.domain || 'default',
    store: store.constructor.name,
  });
  
  return session({
    secret: config.sessionSecret,
    store,
    resave: false,
    // CRITICAL: Must be TRUE for OAuth state persistence
    // OAuth libraries store state in session BEFORE redirecting to OAuth provider
    // With saveUninitialized: false, that session won't be saved and state verification fails
    saveUninitialized: true,
    rolling: true,
    cookie: cookieConfig,
    name: 'florida.elite.sid',
    genid: () => {
      return randomBytes(32).toString('hex');
    },
  });
}

export async function initializeSession(config: AppConfig) {
  logger.info('🔐 Initializing session management...');
  
  const { store, type } = await createSessionStore(config);
  const middleware = createSessionMiddleware(store, config);
  
  logger.info(`✅ Session initialized with ${type} store`);
  
  return {
    middleware,
    store,
    storeType: type,
  };
}
