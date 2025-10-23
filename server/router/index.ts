import { Express } from 'express';
import { logger } from '../monitoring';
import { healthCheckHandler, simpleHealthCheck } from '../health';
import { createAuthRouter } from '../auth/routes';
import { createAuthMetricsRouter } from '../routes/authMetricsRoutes';

export async function mountRoutes(app: Express): Promise<void> {
  logger.info('🛣️  Mounting routes in guaranteed order...');

  logger.info('\n=== PHASE 1: Health & System Routes ===');
  app.get('/health', simpleHealthCheck);
  app.get('/api/health', healthCheckHandler);
  logger.info('   ✅ GET /health');
  logger.info('   ✅ GET /api/health');

  logger.info('\n=== PHASE 2: Metrics Routes ===');
  logger.info('   ℹ️  App metrics already mounted by setupMetrics()');
  const authMetricsRouter = createAuthMetricsRouter();
  app.use(authMetricsRouter);
  logger.info('   ✅ Auth metrics router mounted');

  logger.info('\n=== PHASE 3: Authentication Routes ===');
  // NOTE: Passport is already initialized in bootstrap.ts before this function is called
  // Re-initializing it here would clear all registered strategies!
  // Use the new centralized auth router
  const authRouter = createAuthRouter();
  app.use(authRouter);
  logger.info('   ✅ Auth router mounted');
  
  logger.info('\n=== PHASE 4: Application Routes ===');
  logger.info('   ℹ️  Loading registerRoutes from routes.ts...');
  
  try {
    const { registerRoutes } = await import('../routes');
    await registerRoutes(app);
    logger.info('   ✅ Application routes registered');
  } catch (error) {
    logger.error('   ❌ Failed to register application routes:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  }
  
  logger.info('\n✅ All routes mounted successfully\n');
}
