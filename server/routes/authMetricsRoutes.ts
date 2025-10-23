import { Router, Request, Response } from 'express';
import { authMetrics } from '../metrics/authMetrics';
import { getOidcCircuitBreakerStatus } from '../auth';
import { getCurrentSessionStore } from '../session';
import { logger } from '../monitoring';

const router = Router();

/**
 * GET /api/metrics/auth
 * Returns authentication metrics summary in JSON format
 */
router.get('/api/metrics/auth', (req: Request, res: Response) => {
  try {
    const metrics = authMetrics.getMetrics();
    const circuitBreakerStatus = getOidcCircuitBreakerStatus();
    const sessionStore = getCurrentSessionStore();

    const response = {
      ...metrics,
      circuitBreaker: circuitBreakerStatus,
      sessionStore: {
        type: sessionStore?.type || 'unknown',
      },
      timestamp: new Date().toISOString(),
    };

    logger.debug('📊 Auth metrics requested', {
      requestedBy: (req.user as any)?.id || 'anonymous',
      metricsCount: metrics.overview.totalMetrics,
    });

    res.json(response);
  } catch (error) {
    logger.error('❌ Failed to retrieve auth metrics:', {
      message: (error as Error).message,
    });
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/metrics/auth/prometheus
 * Returns authentication metrics in Prometheus format
 */
router.get('/api/metrics/auth/prometheus', (req: Request, res: Response) => {
  try {
    const prometheusMetrics = authMetrics.getPrometheusMetrics();

    logger.debug('📊 Prometheus auth metrics requested', {
      requestedBy: (req.user as any)?.id || 'anonymous',
    });

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(prometheusMetrics);
  } catch (error) {
    logger.error('❌ Failed to retrieve Prometheus metrics:', {
      message: (error as Error).message,
    });
    res.status(500).send('# Error retrieving metrics\n');
  }
});

/**
 * POST /api/metrics/auth/reset
 * Reset all auth metrics (admin only, useful for testing)
 */
router.post('/api/metrics/auth/reset', (req: Request, res: Response) => {
  try {
    // Optional: Add admin check here
    // if (!req.user || !(req.user as any).isAdmin) {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    authMetrics.reset();

    logger.warn('⚠️  Auth metrics manually reset', {
      resetBy: (req.user as any)?.id || 'anonymous',
    });

    res.json({
      success: true,
      message: 'Auth metrics have been reset',
    });
  } catch (error) {
    logger.error('❌ Failed to reset auth metrics:', {
      message: (error as Error).message,
    });
    res.status(500).json({
      error: 'Failed to reset metrics',
      message: (error as Error).message,
    });
  }
});

export function createAuthMetricsRouter(): Router {
  logger.info('🔧 Creating auth metrics router...');
  logger.info('   - GET /api/metrics/auth (JSON format)');
  logger.info('   - GET /api/metrics/auth/prometheus (Prometheus format)');
  logger.info('   - POST /api/metrics/auth/reset (reset metrics)');
  return router;
}
