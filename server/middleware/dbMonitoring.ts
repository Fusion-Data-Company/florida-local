/**
 * Database Monitoring and Health Dashboard
 *
 * Provides real-time insights into database performance and health
 */

import { Request, Response } from 'express';
import { pool, getDatabaseStatus, testDatabaseConnection } from '../db';
import { checkRedisConnection, isRedisAvailable } from '../redis';

export interface DatabaseMetrics {
  connection: {
    isConnected: boolean;
    poolStats: {
      total: number;
      idle: number;
      waiting: number;
    };
    lastError: string | null;
    lastErrorTime: Date | null;
  };
  performance: {
    queryCount: number;
    averageQueryTime: number;
    slowQueries: number;
  };
  tables: {
    totalTables: number;
    totalRows: number;
    databaseSize: string;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    uptime: number;
  };
}

/**
 * Get comprehensive database metrics
 */
export async function getDatabaseMetrics(): Promise<DatabaseMetrics> {
  const dbStatus = getDatabaseStatus();

  // Connection metrics
  const connectionMetrics = {
    isConnected: dbStatus.isConnected,
    poolStats: {
      total: dbStatus.poolTotalCount,
      idle: dbStatus.poolIdleCount,
      waiting: dbStatus.poolWaitingCount
    },
    lastError: dbStatus.lastError,
    lastErrorTime: dbStatus.lastErrorTime
  };

  // Performance metrics
  const performanceMetrics = await getPerformanceMetrics();

  // Table metrics
  const tableMetrics = await getTableMetrics();

  // Health checks
  const healthMetrics = await getHealthMetrics();

  return {
    connection: connectionMetrics,
    performance: performanceMetrics,
    tables: tableMetrics,
    health: healthMetrics
  };
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics() {
  try {
    // Query PostgreSQL statistics
    const stats = await pool.query(`
      SELECT
        SUM(calls) as total_calls,
        AVG(mean_exec_time) as avg_time,
        COUNT(CASE WHEN mean_exec_time > 1000 THEN 1 END) as slow_queries
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
    `);

    const row = stats.rows[0];

    return {
      queryCount: parseInt(row?.total_calls || '0'),
      averageQueryTime: parseFloat(row?.avg_time || '0'),
      slowQueries: parseInt(row?.slow_queries || '0')
    };
  } catch (error) {
    // pg_stat_statements might not be enabled
    return {
      queryCount: 0,
      averageQueryTime: 0,
      slowQueries: 0
    };
  }
}

/**
 * Get table metrics
 */
async function getTableMetrics() {
  try {
    // Count tables
    const tableCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    // Estimate total rows (fast approximation)
    const rowCount = await pool.query(`
      SELECT SUM(n_live_tup) as total_rows
      FROM pg_stat_user_tables
    `);

    // Get database size
    const dbSize = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);

    return {
      totalTables: parseInt(tableCount.rows[0]?.count || '0'),
      totalRows: parseInt(rowCount.rows[0]?.total_rows || '0'),
      databaseSize: dbSize.rows[0]?.size || '0 MB'
    };
  } catch (error) {
    console.error('Failed to get table metrics:', error);
    return {
      totalTables: 0,
      totalRows: 0,
      databaseSize: 'unknown'
    };
  }
}

/**
 * Perform health checks
 */
async function getHealthMetrics() {
  const checks: Record<string, boolean> = {};

  // Database connectivity check
  checks.databaseConnection = await testDatabaseConnection();

  // Redis connectivity check
  checks.redisConnection = await checkRedisConnection();

  // Query performance check
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    checks.queryPerformance = Date.now() - start < 100; // < 100ms
  } catch (error) {
    checks.queryPerformance = false;
  }

  // Table integrity check
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    checks.tableIntegrity = parseInt(result.rows[0]?.count) > 0;
  } catch (error) {
    checks.tableIntegrity = false;
  }

  // Determine overall health status
  const failedChecks = Object.values(checks).filter(v => !v).length;
  let status: 'healthy' | 'degraded' | 'unhealthy';

  if (failedChecks === 0) {
    status = 'healthy';
  } else if (failedChecks <= 1) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  // Calculate uptime (simplified - would need process start time tracking)
  const uptime = process.uptime();

  return {
    status,
    checks,
    uptime
  };
}

/**
 * Health check endpoint handler
 */
export async function healthCheckHandler(req: Request, res: Response) {
  try {
    const metrics = await getDatabaseMetrics();

    const statusCode = metrics.health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      status: metrics.health.status,
      timestamp: new Date().toISOString(),
      metrics
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Detailed monitoring dashboard endpoint
 */
export async function monitoringDashboardHandler(req: Request, res: Response) {
  try {
    const metrics = await getDatabaseMetrics();

    // Add additional system metrics
    const systemMetrics = {
      nodejs: {
        version: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        platform: process.platform,
        arch: process.arch
      }
    };

    // Get recent audit logs
    const recentAudits = await pool.query(`
      SELECT event_type, COUNT(*) as count
      FROM auth_audit_logs
      WHERE created_at > NOW() - INTERVAL '1 hour'
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get recent security events
    const recentSecurityEvents = await pool.query(`
      SELECT event_type, severity, COUNT(*) as count
      FROM security_events
      WHERE created_at > NOW() - INTERVAL '24 hours'
        AND NOT resolved
      GROUP BY event_type, severity
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: metrics,
      system: systemMetrics,
      security: {
        recentAudits: recentAudits.rows,
        recentSecurityEvents: recentSecurityEvents.rows
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate monitoring dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Database statistics endpoint
 */
export async function databaseStatsHandler(req: Request, res: Response) {
  try {
    // Table sizes
    const tableSizes = await pool.query(`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC
      LIMIT 20
    `);

    // Index usage
    const indexUsage = await pool.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
      LIMIT 20
    `);

    // Active connections
    const connections = await pool.query(`
      SELECT COUNT(*) as active_connections
      FROM pg_stat_activity
      WHERE state = 'active'
    `);

    res.json({
      tableSizes: tableSizes.rows,
      indexUsage: indexUsage.rows,
      connections: connections.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get database statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
