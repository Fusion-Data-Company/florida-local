import express, { Express } from 'express';
import { createServer, Server } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import passport from 'passport';
import { initConfig, type AppConfig } from './config';
import { initSentry, initPostHog, requestLogger, setupErrorHandling, logger } from './monitoring';
import { initializeDatabasePool, connectDatabaseWithRetry } from './db';
import { initializeSession } from './session';
import { initializeAuth } from './auth';
import { mountRoutes } from './router';

export async function bootstrap(): Promise<{ app: Express; server: Server; config: AppConfig }> {
  logger.info('');
  logger.info('================================================== ');
  logger.info('🚀 BOOTSTRAPPING APPLICATION');
  logger.info('================================================== \n');
  
  const app = express();
  const server = createServer(app);

  logger.info('STEP 1: Load and validate configuration');
  logger.info('--------------------------------------------------');
  const config = initConfig();

  // CRITICAL: Trust proxy for Replit deployment
  // This is required for:
  // 1. Proper HTTPS detection (req.protocol, req.secure)
  // 2. Secure cookies to work correctly with sameSite='none'
  // 3. Correct client IP detection from X-Forwarded-For
  // Without this, session cookies won't work in OAuth flows!
  if (config.isProduction) {
    app.set('trust proxy', 1);
    logger.info('   ✅ Proxy trust configured (1 hop for Replit)');
  }
  
  logger.info('\nSTEP 2: Initialize monitoring');
  logger.info('--------------------------------------------------');
  initSentry(app);
  initPostHog();
  
  logger.info('\nSTEP 3: Configure security middleware');
  logger.info('--------------------------------------------------');
  
  const helmetConfig = config.isProduction ? {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "wss:", "ws:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com", "https://youtube.com", "https://youtu.be"],
      },
    },
    crossOriginEmbedderPolicy: false,
  } : {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "wss:", "ws:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com", "https://youtube.com", "https://youtu.be"],
      },
    },
    crossOriginEmbedderPolicy: false,
  };
  
  app.use(helmet(helmetConfig));
  logger.info('   ✅ Helmet configured');
  
  const corsOrigins = config.isProduction 
    ? config.replitDomains.map(d => `https://${d}`)
    : true;
  
  app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));
  logger.info('   ✅ CORS configured');
  logger.info(`   - Origins: ${config.isProduction ? corsOrigins : 'all (development)'}`);
  
  logger.info('\nSTEP 4: Configure body parsing');
  logger.info('--------------------------------------------------');
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  logger.info('   ✅ Body parsers configured');
  
  app.use(requestLogger);
  logger.info('   ✅ Request logger configured');
  
  logger.info('\nSTEP 5: Connect to database');
  logger.info('--------------------------------------------------');
  try {
    await initializeDatabasePool(config.databaseUrl);
    await connectDatabaseWithRetry(config.databaseUrl, 3);
  } catch (error) {
    logger.error('❌ FATAL: Database connection failed:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  }
  
  logger.info('\nSTEP 6: Setup metrics');
  logger.info('--------------------------------------------------');
  const { setupMetrics } = await import('./metrics');
  setupMetrics(app);
  logger.info('   ✅ Metrics configured');
  
  logger.info('\nSTEP 7: Initialize session store');
  logger.info('--------------------------------------------------');
  const { middleware: sessionMiddleware, storeType } = await initializeSession(config);
  app.use(sessionMiddleware);
  logger.info(`   ✅ Session middleware configured (${storeType} store)`);
  
  logger.info('\nSTEP 8: Initialize authentication');
  logger.info('--------------------------------------------------');
  await initializeAuth(config);

  // CRITICAL: Add passport middleware to Express app
  app.use(passport.initialize());
  logger.info('   ✅ Passport initialized');

  app.use(passport.session());
  logger.info('   ✅ Passport session enabled');

  // Add session extension middleware for authenticated requests
  const { autoExtendSession, checkSessionExpiry } = await import('./middleware/sessionExtension');
  app.use(autoExtendSession);
  app.use(checkSessionExpiry);
  logger.info('   ✅ Session auto-extension enabled');
  logger.info('   ✅ Session expiry warnings enabled');

  // Add OAuth state recovery middleware
  const { oauthStateRecoveryMiddleware, cleanupExpiredOAuthAttempts } = await import('./middleware/oauthStateRecovery');
  app.use(cleanupExpiredOAuthAttempts);
  app.use(oauthStateRecoveryMiddleware);
  logger.info('   ✅ OAuth state recovery enabled');

  logger.info('   ✅ Authentication system ready');

  logger.info('\nSTEP 9: Mount all routes');
  logger.info('--------------------------------------------------');
  await mountRoutes(app);
  logger.info('   ✅ Routes mounted successfully');
  
  logger.info('\nSTEP 10: Setup error handling');
  logger.info('--------------------------------------------------');
  setupErrorHandling(app);
  logger.info('   ✅ Error handlers configured');
  
  logger.info('\n================================================== ');
  logger.info('✅ BOOTSTRAP COMPLETE');
  logger.info('================================================== \n');
  
  return { app, server, config };
}
