import { Request, Response } from 'express';
import { getDatabaseStatus, testDatabaseConnection } from './db';
import { checkRedisConnection, isRedisAvailable } from './redis';
import { logger } from './monitoring';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      details?: any;
    };
    redis: {
      status: 'connected' | 'disconnected' | 'not_configured';
      available: boolean;
    };
    session: {
      status: 'active';
      store: string;
    };
  };
  errors?: string[];
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const errors: string[] = [];
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  const dbStatus = getDatabaseStatus();
  const dbHealthy = await testDatabaseConnection().catch(() => false);
  
  if (!dbHealthy) {
    errors.push('Database connection failed');
    overallStatus = 'unhealthy';
  }
  
  const redisConnected = await checkRedisConnection().catch(() => false);
  const redisAvail = isRedisAvailable();
  
  if (!redisConnected && process.env.REDIS_HOST) {
    overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
  }
  
  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: {
        status: dbHealthy ? 'connected' : (dbStatus.isConnected ? 'connected' : 'disconnected'),
        details: {
          poolIdleCount: dbStatus.poolIdleCount,
          poolTotalCount: dbStatus.poolTotalCount,
          poolWaitingCount: dbStatus.poolWaitingCount,
          lastError: dbStatus.lastError,
          lastErrorTime: dbStatus.lastErrorTime,
          reconnectAttempts: dbStatus.reconnectAttempts,
        },
      },
      redis: {
        status: process.env.REDIS_HOST 
          ? (redisConnected ? 'connected' : 'disconnected')
          : 'not_configured',
        available: redisAvail,
      },
      session: {
        status: 'active',
        store: redisConnected ? 'redis' : (dbHealthy ? 'postgresql' : 'memory'),
      },
    },
    ...(errors.length > 0 && { errors }),
  };
  
  return healthStatus;
}

export async function healthCheckHandler(req: Request, res: Response): Promise<void> {
  try {
    const health = await getHealthStatus();
    
    const statusCode = health.status === 'healthy' ? 200 : (health.status === 'degraded' ? 200 : 503);
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function simpleHealthCheck(req: Request, res: Response): Promise<void> {
  res.status(200).json({ status: 'ok' });
}
