/**
 * Enterprise Monitoring and Health Check Routes
 *
 * Comprehensive monitoring dashboard for:
 * - System health checks
 * - Performance metrics
 * - Error statistics
 * - Audit logs
 * - AI agent statistics
 * - Circuit breaker status
 * - Database connection status
 */

import type { Express, Request, Response } from 'express';
import {
  errorLogger,
  auditLogger,
  performanceMonitor,
  healthChecker,
  emailServiceCircuitBreaker,
  smsServiceCircuitBreaker,
  aiServiceCircuitBreaker,
  asyncHandler,
} from './errorHandler';
import { aiAgentOrchestrator } from './aiAgentOrchestrator';
import { emailService } from './emailService';
import { smsService } from './smsService';

const requireAdmin = (req: Request, res: Response, next: Function) => {
  const user = req.user as any;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export function registerMonitoringRoutes(app: Express) {
  /**
   * GET /api/monitoring/health
   * Comprehensive health check (PUBLIC - for load balancers)
   */
  app.get('/api/monitoring/health', asyncHandler(async (req: Request, res: Response) => {
    const health = await healthChecker.runChecks();

    res.status(health.healthy ? 200 : 503).json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: health.checks,
    });
  }));

  /**
   * GET /api/monitoring/dashboard
   * Complete monitoring dashboard
   */
  app.get('/api/monitoring/dashboard', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    const errorStats = errorLogger.getStats();
    const performanceStats = performanceMonitor.getAllStats();
    const aiStats = aiAgentOrchestrator.getStats();
    const recentErrors = errorLogger.getRecentErrors(20);
    const recentAudits = auditLogger.getRecentAudits(50);

    res.json({
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
        },
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV,
      },
      errors: {
        summary: errorStats,
        recent: recentErrors.map(e => ({
          timestamp: e.timestamp,
          severity: e.severity,
          category: e.category,
          message: e.message,
          userId: e.userId,
        })),
      },
      performance: performanceStats,
      ai: {
        queueStats: aiStats,
        models: {
          campaign_optimize: 'anthropic/claude-3.5-sonnet',
          content_generate: 'anthropic/claude-3.5-sonnet',
          segment_analyze: 'openai/gpt-4-turbo',
          subject_test: 'anthropic/claude-3.5-sonnet',
          send_time_optimize: 'openai/gpt-4-turbo',
          workflow_generate: 'anthropic/claude-3.5-sonnet',
          form_optimize: 'openai/gpt-4-turbo',
        },
      },
      circuitBreakers: {
        emailService: emailServiceCircuitBreaker.getState(),
        smsService: smsServiceCircuitBreaker.getState(),
        aiService: aiServiceCircuitBreaker.getState(),
      },
      services: {
        email: emailService.getProviderInfo(),
        sms: smsService.getProviderInfo(),
      },
      audits: {
        recent: recentAudits.map(a => ({
          timestamp: a.timestamp,
          userId: a.userId,
          action: a.action,
          resource: a.resource,
          result: a.result,
        })),
      },
    });
  }));

  /**
   * GET /api/monitoring/errors
   * Get error logs with filtering
   */
  app.get('/api/monitoring/errors', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { category, severity, limit = 100 } = req.query;

    let errors = errorLogger.getRecentErrors(Number(limit));

    if (category) {
      errors = errorLogger.getErrorsByCategory(category as any);
    }

    if (severity) {
      errors = errorLogger.getErrorsBySeverity(severity as any);
    }

    res.json({
      total: errors.length,
      errors: errors.map(e => ({
        id: e.requestId,
        timestamp: e.timestamp,
        severity: e.severity,
        category: e.category,
        message: e.message,
        statusCode: e.statusCode,
        userId: e.userId,
        context: e.context,
        stack: process.env.NODE_ENV === 'development' ? e.stack : undefined,
      })),
    });
  }));

  /**
   * GET /api/monitoring/performance
   * Get performance metrics
   */
  app.get('/api/monitoring/performance', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    const stats = performanceMonitor.getAllStats();

    res.json({
      timestamp: new Date().toISOString(),
      metrics: stats,
    });
  }));

  /**
   * GET /api/monitoring/audits
   * Get audit trail
   */
  app.get('/api/monitoring/audits', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { userId, resource, limit = 100 } = req.query;

    let audits = auditLogger.getRecentAudits(Number(limit));

    if (userId) {
      audits = auditLogger.getAuditsByUser(userId as string);
    }

    if (resource) {
      audits = auditLogger.getAuditsByResource(resource as string);
    }

    res.json({
      total: audits.length,
      audits,
    });
  }));

  /**
   * GET /api/monitoring/ai
   * Get AI agent statistics
   */
  app.get('/api/monitoring/ai', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    const stats = aiAgentOrchestrator.getStats();

    res.json({
      timestamp: new Date().toISOString(),
      queueStats: stats,
      agents: {
        campaign_optimize: {
          model: 'anthropic/claude-3.5-sonnet',
          description: 'Strategic campaign optimization and recommendations',
        },
        content_generate: {
          model: 'anthropic/claude-3.5-sonnet',
          description: 'Creative email content and copywriting',
        },
        segment_analyze: {
          model: 'openai/gpt-4-turbo',
          description: 'Customer segmentation and predictive analytics',
        },
        subject_test: {
          model: 'anthropic/claude-3.5-sonnet',
          description: 'A/B testing subject line variations',
        },
        send_time_optimize: {
          model: 'openai/gpt-4-turbo',
          description: 'Optimal send time prediction',
        },
        workflow_generate: {
          model: 'anthropic/claude-3.5-sonnet',
          description: 'Marketing automation workflow design',
        },
        form_optimize: {
          model: 'openai/gpt-4-turbo',
          description: 'Lead capture form optimization',
        },
      },
    });
  }));

  /**
   * POST /api/monitoring/errors/clear
   * Clear error logs
   */
  app.post('/api/monitoring/errors/clear', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    errorLogger.clearLog();

    res.json({
      success: true,
      message: 'Error logs cleared',
    });
  }));

  /**
   * POST /api/monitoring/audits/clear
   * Clear audit logs
   */
  app.post('/api/monitoring/audits/clear', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    auditLogger.clearLog();

    res.json({
      success: true,
      message: 'Audit logs cleared',
    });
  }));

  /**
   * POST /api/monitoring/performance/clear
   * Clear performance metrics
   */
  app.post('/api/monitoring/performance/clear', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    performanceMonitor.clearMetrics();

    res.json({
      success: true,
      message: 'Performance metrics cleared',
    });
  }));

  /**
   * POST /api/monitoring/circuit-breakers/reset
   * Reset all circuit breakers
   */
  app.post('/api/monitoring/circuit-breakers/reset', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    // Circuit breakers are automatically reset when they enter half-open state
    // This endpoint is mainly for manual intervention

    res.json({
      success: true,
      message: 'Circuit breakers will auto-reset on next success',
      current: {
        emailService: emailServiceCircuitBreaker.getState(),
        smsService: smsServiceCircuitBreaker.getState(),
        aiService: aiServiceCircuitBreaker.getState(),
      },
    });
  }));

  /**
   * GET /api/monitoring/system-info
   * Get detailed system information
   */
  app.get('/api/monitoring/system-info', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    res.json({
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        arrayBuffers: Math.round((process.memoryUsage() as any).arrayBuffers / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
        hasSendGridKey: !!process.env.SENDGRID_API_KEY,
        hasMailjetKey: !!process.env.MAILJET_API_KEY,
        hasGmailCreds: !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET),
        hasTwilioKey: !!process.env.TWILIO_ACCOUNT_SID,
      },
    });
  }));

  console.log('✅ Enterprise monitoring routes registered');
}
