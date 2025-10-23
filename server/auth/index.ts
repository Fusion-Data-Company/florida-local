import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import { storage } from "../storage";
import { logger } from "../monitoring";
import type { AppConfig } from "../config";
import { retryExternalApi, retryDatabaseOperation } from "../utils/retry";
import { CircuitBreaker, CircuitState } from "../utils/circuitBreaker";
import { authMetrics } from "../metrics/authMetrics";
import { captureAuthError, captureCircuitBreakerEvent, trackAuthSuccess } from "../monitoring/authSentry";

const registeredStrategies = new Set<string>();

// Circuit breaker for OIDC discovery
const oidcCircuitBreaker = new CircuitBreaker<client.Configuration>({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 300000, // 5 minutes
  name: 'OIDC Discovery',
  onStateChange: (oldState, newState) => {
    captureCircuitBreakerEvent('OIDC Discovery', oldState, newState, oidcCircuitBreaker.getMetrics());

    if (newState === CircuitState.OPEN) {
      logger.error('🚨 CRITICAL ALERT: OIDC circuit breaker is OPEN - authentication may be degraded!');
    } else if (newState === CircuitState.CLOSED && oldState === CircuitState.HALF_OPEN) {
      logger.info('✅ OIDC circuit breaker recovered - authentication fully operational');
    }
  },
});

async function getOidcConfig(config: AppConfig) {
  logger.info('🔧 Fetching OIDC configuration...');
  logger.info(`   - Issuer: ${config.issuerUrl}`);
  logger.info(`   - Client ID (from config.replId): ${config.replId}`);
  logger.info(`   - Client ID (from process.env.REPL_ID): ${process.env.REPL_ID}`);

  const start = Date.now();

  try {
    // Wrap OIDC discovery with circuit breaker AND retry logic for maximum resilience
    const oidcConfig = await oidcCircuitBreaker.execute(async () => {
      return await retryExternalApi(
        'Replit OIDC Discovery',
        async () => {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('OIDC discovery timeout (10s)')), 10000);
          });

          const discoveryPromise = client.discovery(
            new URL(config.issuerUrl),
            config.replId
          );

          return await Promise.race([discoveryPromise, timeoutPromise]);
        }
      );
    });

    const duration = Date.now() - start;
    authMetrics.recordOidcOperation('discovery', 'success', duration);

    logger.info('✅ OIDC configuration retrieved successfully');
    logger.info('   - OIDC Config Details:', {
      issuer: oidcConfig[client.customFetch] ? 'has custom fetch' : 'no custom fetch',
      clientId: config.replId,
    });

    return oidcConfig;
  } catch (error) {
    const duration = Date.now() - start;
    authMetrics.recordOidcOperation('discovery', 'failure', duration, (error as Error).message);

    captureAuthError(error as Error, {
      operation: 'OIDC Discovery',
      additionalData: {
        issuer: config.issuerUrl,
        clientId: config.replId,
        duration,
      },
    });

    logger.error('❌ OIDC configuration failed after all retries:', {
      message: (error as Error).message,
      issuer: config.issuerUrl,
      clientId: config.replId,
    });
    throw new Error(`Failed to fetch OIDC configuration: ${(error as Error).message}`);
  }
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  logger.info(`🔐 Upserting user:`, {
    email: claims["email"],
    replitId: claims["sub"],
    allClaims: JSON.stringify(claims),
  });

  const start = Date.now();

  try {
    const userData = {
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"] || claims["profile_image"],
    };

    logger.info(`📝 User data to upsert:`, userData);

    // Wrap upsert in retry logic for resilience against transient DB errors
    const result = await retryDatabaseOperation(
      `upsert user ${userData.email}`,
      async () => {
        return await storage.upsertUser(userData);
      }
    );

    const duration = Date.now() - start;
    authMetrics.recordUserUpsert('success', duration, result.user.id);
    trackAuthSuccess('User Upsert', result.user.id, duration, { isNewUser: result.isNewUser });

    logger.info(`✅ User upserted successfully:`, {
      id: result.user.id,
      email: result.user.email,
      isNewUser: result.isNewUser,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    authMetrics.recordUserUpsert('failure', duration, undefined, (error as Error).message);

    captureAuthError(error as Error, {
      operation: 'User Upsert',
      userId: claims["sub"],
      additionalData: {
        email: claims["email"],
        duration,
      },
    });

    logger.error('❌ User upsert failed after all retries:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      email: claims["email"],
      userData: JSON.stringify({
        id: claims["sub"],
        email: claims["email"],
        firstName: claims["first_name"],
        lastName: claims["last_name"],
      }),
    });
    // Re-throw with more context
    throw new Error(`Failed to create/update user: ${(error as Error).message}`);
  }
}

async function registerStrategy(domain: string, config: AppConfig, oidcConfig: client.Configuration) {
  const strategyName = `replitauth:${domain}`;

  if (registeredStrategies.has(strategyName)) {
    logger.debug(`   - Strategy ${strategyName} already registered, skipping`);
    return;
  }

  logger.info(`   - Registering strategy: ${strategyName}`);

  try {
    // Determine the callback URL based on domain
    let callbackURL: string;
    if (domain === 'localhost' || domain === '127.0.0.1') {
      // For localhost, use http and the configured port
      callbackURL = `http://${domain}:${config.port}/api/auth/callback`;
    } else {
      // For production Replit domains, use https
      callbackURL = `https://${domain}/api/auth/callback`;
    }

    logger.info(`   - Strategy config: callbackURL=${callbackURL}, scope="openid email profile"`);
    logger.info(`   - Using REPL_ID as client: ${config.replId}`);

    const strategy = new Strategy(
      {
        config: oidcConfig,
        callbackURL,
        scope: "openid email profile",
      },
      async (tokens: any, done: any) => {
        try {
          logger.info('🔐 Strategy verify callback started:', {
            hasClaims: !!tokens.claims(),
            domain,
          });

          const claims = tokens.claims();

          logger.info('📋 OAuth claims received:', {
            sub: claims.sub,
            email: claims.email,
            first_name: claims.first_name,
            last_name: claims.last_name,
            allClaimKeys: Object.keys(claims),
          });

          const result = await upsertUser(claims);
          const user = result.user;
          const isNewUser = result.isNewUser;

          updateUserSession(user, tokens);

          logger.info('✅ Strategy verify callback successful, calling done(null, user)', {
            userId: user.id,
            isNewUser,
          });

          // Pass the actual user object and isNewUser info separately
          done(null, user, { isNewUser });
        } catch (error) {
          logger.error('❌ Strategy verify error:', {
            message: (error as Error).message,
            stack: (error as Error).stack,
            domain,
          });
          done(error);
        }
      }
    );

    // Use the passport.use overload that accepts a name
    passport.use(strategyName, strategy);
    registeredStrategies.add(strategyName);

    logger.info(`✅ Strategy registered: ${strategyName} with callback ${callbackURL}`);
  } catch (error) {
    logger.error(`❌ Failed to register strategy ${strategyName}:`, {
      message: (error as Error).message,
    });
    throw error;
  }
}

export async function initializeAuth(config: AppConfig) {
  logger.info('🔐 Initializing authentication system...');
  
  try {
    const oidcConfig = await getOidcConfig(config);
    
    logger.info(`🔧 Registering Passport strategies for ${config.replitDomains.length} domain(s)...`);
    for (const domain of config.replitDomains) {
      await registerStrategy(domain, config, oidcConfig);
    }
    
    logger.info('🔧 Configuring Passport serialization...');
    passport.serializeUser((user: any, done) => {
      // Defensive: handle both User object and potential {user, isNewUser} wrapper
      const userId = user?.user?.id || user?.id;
      if (!userId) {
        authMetrics.recordSerialization('failure', undefined, 'No user ID found');
        logger.error('❌ Cannot serialize user - no ID found!', {
          userType: typeof user,
          userKeys: user ? Object.keys(user) : 'null',
          user: JSON.stringify(user),
        });
        return done(new Error('User ID is required for serialization'));
      }
      authMetrics.recordSerialization('success', userId);
      logger.info('✅ Serializing user for session:', {
        userId,
        email: user?.email || user?.user?.email,
        hasId: !!userId,
      });
      done(null, userId);
    });
    
    passport.deserializeUser(async (id: string, done) => {
      try {
        logger.debug('🔓 Deserializing user:', { id });

        // Attempt 1: Get user by ID with retry logic
        let user = await retryDatabaseOperation(
          `deserialize user ${id}`,
          async () => await storage.getUser(id)
        ).catch((error) => {
          logger.warn('⚠️  Failed to deserialize user by ID, will try fallback', {
            id,
            error: error.message,
          });
          authMetrics.recordSessionError('deserialize', error.message, id);
          return null;
        });

        if (user) {
          authMetrics.recordDeserialization('success', user.id);
          logger.debug('✅ User deserialized successfully by ID');
          return done(null, user);
        }

        // Attempt 2: If user not found by ID, check if ID is actually an email
        // (handles edge case where old sessions might have email as ID)
        if (id.includes('@')) {
          logger.info('🔄 ID looks like email, attempting email lookup', { possibleEmail: id });
          user = await retryDatabaseOperation(
            `deserialize user by email ${id}`,
            async () => await storage.getUserByEmail(id)
          ).catch(() => null);

          if (user) {
            authMetrics.recordDeserialization('success', user.id);
            logger.info('✅ User recovered via email lookup');
            return done(null, user);
          }
        }

        // Attempt 3: All recovery attempts failed
        authMetrics.recordDeserialization('failure', id, 'User not found');
        logger.warn('⚠️  User not found after all deserialization attempts', {
          id,
          attempts: ['by ID', 'by email (if applicable)'],
        });

        // Return false to indicate user not found (will trigger logout)
        return done(null, false);

      } catch (error) {
        authMetrics.recordDeserialization('failure', id, (error as Error).message);
        logger.error('❌ Critical deserialization error:', {
          message: (error as Error).message,
          id,
          stack: (error as Error).stack,
        });

        // Return false instead of error to prevent crashes
        // User will be logged out but app continues working
        return done(null, false);
      }
    });
    
    logger.info('✅ Authentication system initialized successfully');
    logger.info(`   - Registered strategies: ${Array.from(registeredStrategies).join(', ')}`);
    
  } catch (error) {
    logger.error('❌ Authentication initialization failed:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  }
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  logger.debug('🔓 Unauthenticated request blocked');
  res.status(401).json({ error: 'Authentication required' });
}

export function getRegisteredStrategies(): Set<string> {
  return new Set(registeredStrategies);
}

export function getOidcCircuitBreakerStatus() {
  return oidcCircuitBreaker.getMetrics();
}
