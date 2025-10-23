// Authentication fix deployment - v2
import { bootstrap } from './bootstrap';
import { setupVite, serveStatic, log } from './vite';
import { logger } from './monitoring';
import { closeDatabaseConnection } from './db';
import { closeRedisConnections } from './redis';

async function startServer() {
  try {
    const { app, server, config } = await bootstrap();
    
    logger.info('\nSTEP 11: Setup frontend serving');
    logger.info('--------------------------------------------------');
    
    if (config.isProduction) {
      logger.info('   - Production mode: Setting up static file serving');
      serveStatic(app);
      logger.info('   ✅ Static file serving configured');
    } else {
      logger.info('   - Development mode: Setting up Vite dev server');
      await setupVite(app, server);
      logger.info('   ✅ Vite dev server configured');
    }
    
    logger.info('\nSTEP 12: Start HTTP server');
    logger.info('--------------------------------------------------');
    
    server.listen(config.port, '0.0.0.0', () => {
      logger.info('');
      logger.info('================================================== ');
      logger.info('🎉 SERVER STARTED SUCCESSFULLY');
      logger.info('================================================== ');
      logger.info(`   - Environment: ${config.nodeEnv}`);
      logger.info(`   - Port: ${config.port}`);
      logger.info(`   - URL: http://0.0.0.0:${config.port}`);
      if (config.isProduction) {
        logger.info(`   - Production URLs: ${config.replitDomains.map(d => `https://${d}`).join(', ')}`);
      }
      logger.info('================================================== \n');
    });
    
  } catch (error) {
    logger.error('');
    logger.error('================================================== ');
    logger.error('❌ SERVER STARTUP FAILED');
    logger.error('================================================== ');
    logger.error('Error:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    logger.error('================================================== \n');
    
    process.exit(1);
  }
}

async function gracefulShutdown() {
  logger.info('');
  logger.info('🛑 Graceful shutdown initiated...');
  
  try {
    await closeDatabaseConnection();
    await closeRedisConnections();
    logger.info('✅ Cleanup complete');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Shutdown error:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Promise Rejection:', {
    reason,
    promise,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
  });
  gracefulShutdown();
});

startServer();
