/**
 * Health Check Endpoints
 * Provides system health status for monitoring and load balancing
 */

import { Router, type Request, type Response } from 'express';
import { healthChecker } from './errorHandler';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { redis, isRedisAvailable } from './redis';
import { emailServiceCircuitBreaker, smsServiceCircuitBreaker, aiServiceCircuitBreaker } from './errorHandler';

const router = Router();

// Register health checks
healthChecker.register('database', async () => {
  try {
    // Simple query to check database connectivity
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
});

healthChecker.register('redis', async () => {
  try {
    if (!isRedisAvailable()) {
      return false;
    }
    // Ping Redis
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
});

healthChecker.register('email_service', async () => {
  // Check circuit breaker state
  const state = emailServiceCircuitBreaker.getState();
  return state.state !== 'open';
});

healthChecker.register('sms_service', async () => {
  const state = smsServiceCircuitBreaker.getState();
  return state.state !== 'open';
});

healthChecker.register('ai_service', async () => {
  const state = aiServiceCircuitBreaker.getState();
  return state.state !== 'open';
});

/**
 * Basic health check endpoint
 * Returns 200 OK if the service is running
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Detailed health check endpoint
 * Returns health status of all dependencies
 */
router.get('/health/detailed', async (req: Request, res: Response) => {
  try {
    const healthStatus = await healthChecker.runChecks();

    const response = {
      status: healthStatus.healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: healthStatus.checks,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
        cpu: process.cpuUsage(),
      },
    };

    const statusCode = healthStatus.healthy ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Readiness check endpoint (for Kubernetes)
 * Returns 200 when the service is ready to accept traffic
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    // Check critical dependencies only (database)
    const dbHealthy = await healthChecker.checks.get('database')?.() ?? false;

    if (dbHealthy) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: 'database unavailable' });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Liveness check endpoint (for Kubernetes)
 * Returns 200 if the service process is alive
 */
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export default router;
