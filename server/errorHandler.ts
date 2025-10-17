/**
 * Enterprise Error Handling and Monitoring System
 *
 * Features:
 * - Centralized error handling
 * - Error categorization and severity levels
 * - Automatic retry logic for transient errors
 * - Error logging with context
 * - Alert system for critical errors
 * - Performance monitoring
 * - Audit trail for all operations
 */

import type { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  RATE_LIMIT = 'rate_limit',
  INTERNAL = 'internal',
  AI_SERVICE = 'ai_service',
  EMAIL_SERVICE = 'email_service',
  SMS_SERVICE = 'sms_service',
}

export interface AppError extends Error {
  statusCode: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  isOperational: boolean;
  context?: any;
  userId?: string;
  requestId?: string;
  timestamp: Date;
}

export class OperationalError extends Error implements AppError {
  statusCode: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  isOperational = true;
  context?: any;
  userId?: string;
  requestId?: string;
  timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    category: ErrorCategory = ErrorCategory.INTERNAL,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: any
  ) {
    super(message);
    this.name = 'OperationalError';
    this.statusCode = statusCode;
    this.category = category;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error logger with structured logging
 */
class ErrorLogger {
  private errorLog: AppError[] = [];
  private maxLogSize = 1000;

  log(error: AppError): void {
    // Add to in-memory log
    this.errorLog.push(error);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Console logging with appropriate level
    const logData = {
      timestamp: error.timestamp.toISOString(),
      severity: error.severity,
      category: error.category,
      message: error.message,
      statusCode: error.statusCode,
      userId: error.userId,
      requestId: error.requestId,
      context: error.context,
      stack: error.stack,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', logData);
        this.sendAlert(error);
        break;
      case ErrorSeverity.HIGH:
        console.error('❌ HIGH SEVERITY ERROR:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️  MEDIUM SEVERITY ERROR:', logData);
        break;
      case ErrorSeverity.LOW:
        console.info('ℹ️  LOW SEVERITY ERROR:', logData);
        break;
    }

    // In production, send to external monitoring service
    // e.g., Sentry, DataDog, CloudWatch, etc.
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(error);
    }
  }

  private async sendAlert(error: AppError): Promise<void> {
    // Send alerts for critical errors
    console.log('📧 Sending alert for critical error:', error.message);

    // Send to Slack if webhook is configured
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await this.sendSlackAlert(error);
      } catch (slackError) {
        console.error('Failed to send Slack alert:', slackError);
      }
    }

    // Could add more alert channels here:
    // - PagerDuty API
    // - Email via SendGrid/Mailgun
    // - SMS via Twilio
  }

  private async sendSlackAlert(error: AppError): Promise<void> {
    const payload = {
      text: `🚨 CRITICAL ERROR ALERT`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Critical Error Detected',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Error:*\n${error.message}`,
            },
            {
              type: 'mrkdwn',
              text: `*Category:*\n${error.category}`,
            },
            {
              type: 'mrkdwn',
              text: `*User ID:*\n${error.userId || 'N/A'}`,
            },
            {
              type: 'mrkdwn',
              text: `*Request ID:*\n${error.requestId || 'N/A'}`,
            },
            {
              type: 'mrkdwn',
              text: `*Timestamp:*\n${error.timestamp.toISOString()}`,
            },
            {
              type: 'mrkdwn',
              text: `*Environment:*\n${process.env.NODE_ENV || 'unknown'}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Stack Trace:*\n\`\`\`${error.stack?.substring(0, 500) || 'N/A'}\`\`\``,
          },
        },
      ],
    };

    const response = await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.statusText}`);
    }
  }

  private sendToMonitoringService(error: AppError): void {
    // Send to Sentry with full context
    Sentry.withScope((scope) => {
      // Add user context
      if (error.userId) {
        scope.setUser({ id: error.userId });
      }

      // Add tags for filtering in Sentry
      scope.setTag('error_category', error.category);
      scope.setTag('error_severity', error.severity);
      scope.setTag('status_code', error.statusCode.toString());

      // Add extra context
      scope.setContext('error_details', {
        category: error.category,
        severity: error.severity,
        statusCode: error.statusCode,
        requestId: error.requestId,
        timestamp: error.timestamp.toISOString(),
        isOperational: error.isOperational,
      });

      // Add custom context data
      if (error.context) {
        scope.setContext('request_context', error.context);
      }

      // Set fingerprint for grouping similar errors
      scope.setFingerprint([
        error.category,
        error.message.substring(0, 100),
      ]);

      // Capture the exception
      Sentry.captureException(error);
    });
  }

  getRecentErrors(limit: number = 100): AppError[] {
    return this.errorLog.slice(-limit);
  }

  getErrorsByCategory(category: ErrorCategory): AppError[] {
    return this.errorLog.filter(e => e.category === category);
  }

  getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errorLog.filter(e => e.severity === severity);
  }

  clearLog(): void {
    this.errorLog = [];
  }

  getStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
  } {
    return {
      total: this.errorLog.length,
      bySeverity: {
        [ErrorSeverity.LOW]: this.errorLog.filter(e => e.severity === ErrorSeverity.LOW).length,
        [ErrorSeverity.MEDIUM]: this.errorLog.filter(e => e.severity === ErrorSeverity.MEDIUM).length,
        [ErrorSeverity.HIGH]: this.errorLog.filter(e => e.severity === ErrorSeverity.HIGH).length,
        [ErrorSeverity.CRITICAL]: this.errorLog.filter(e => e.severity === ErrorSeverity.CRITICAL).length,
      },
      byCategory: Object.values(ErrorCategory).reduce((acc, cat) => {
        acc[cat] = this.errorLog.filter(e => e.category === cat).length;
        return acc;
      }, {} as Record<ErrorCategory, number>),
    };
  }
}

export const errorLogger = new ErrorLogger();

/**
 * Audit trail for all operations
 */
interface AuditEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure';
  errorMessage?: string;
}

class AuditLogger {
  private auditLog: AuditEntry[] = [];
  private maxLogSize = 5000;

  log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
    const auditEntry: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...entry,
    };

    this.auditLog.push(auditEntry);

    // Keep log size manageable
    if (this.auditLog.length > this.maxLogSize) {
      this.auditLog = this.auditLog.slice(-this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Audit:', auditEntry);
    }

    // In production, send to audit database or service
    if (process.env.NODE_ENV === 'production') {
      this.persistToDatabase(auditEntry);
    }
  }

  private persistToDatabase(entry: AuditEntry): void {
    // TODO: Persist to database
    // INSERT INTO audit_logs (...)
  }

  getRecentAudits(limit: number = 100): AuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  getAuditsByUser(userId: string): AuditEntry[] {
    return this.auditLog.filter(e => e.userId === userId);
  }

  getAuditsByResource(resource: string, resourceId?: string): AuditEntry[] {
    return this.auditLog.filter(
      e => e.resource === resource && (!resourceId || e.resourceId === resourceId)
    );
  }

  clearLog(): void {
    this.auditLog = [];
  }
}

export const auditLogger = new AuditLogger();

/**
 * Performance monitoring
 */
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number): void {
    const existing = this.metrics.get(name) || [];
    existing.push(value);

    // Keep last 1000 measurements
    if (existing.length > 1000) {
      existing.shift();
    }

    this.metrics.set(name, existing);
  }

  getStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);

    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [name, _] of this.metrics) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware to track request performance
 */
export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const route = `${req.method} ${req.route?.path || req.path}`;
    performanceMonitor.recordMetric(`request.${route}`, duration);
    performanceMonitor.recordMetric(`request.all`, duration);

    // Log slow requests
    if (duration > 1000) {
      console.warn(`⏱️  Slow request: ${route} took ${duration}ms`);
    }
  });

  next();
}

/**
 * Error handling middleware
 */
export function errorHandlerMiddleware(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Generate request ID if not exists
  const requestId = (req.headers['x-request-id'] as string) || `req-${Date.now()}`;

  // Convert to AppError if not already
  let appError: AppError;
  if ('isOperational' in err) {
    appError = err as AppError;
  } else {
    appError = new OperationalError(
      err.message || 'Internal server error',
      500,
      ErrorCategory.INTERNAL,
      ErrorSeverity.HIGH
    );
  }

  // Add request context
  appError.userId = (req.user as any)?.id;
  appError.requestId = requestId;
  appError.context = {
    ...appError.context,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  // Log the error
  errorLogger.log(appError);

  // Audit failed operation
  auditLogger.log({
    userId: appError.userId,
    action: req.method,
    resource: req.path,
    result: 'failure',
    errorMessage: appError.message,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Send response
  const response = {
    error: {
      message: appError.isOperational ? appError.message : 'An unexpected error occurred',
      code: appError.category,
      requestId,
      ...(process.env.NODE_ENV === 'development' && {
        stack: appError.stack,
        context: appError.context,
      }),
    },
  };

  res.status(appError.statusCode).json(response);
}

/**
 * Async error handler wrapper
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Retry logic for transient errors
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's not a transient error
      if (error.statusCode && error.statusCode < 500) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        console.log(`⏳ Retrying operation in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Circuit breaker for external services
 */
class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private threshold: number;
  private timeout: number;

  constructor(threshold: number = 5, timeout: number = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime!.getTime() > this.timeout) {
        this.state = 'half-open';
        console.log('🔄 Circuit breaker: half-open state');
      } else {
        throw new OperationalError(
          'Service temporarily unavailable',
          503,
          ErrorCategory.EXTERNAL_API,
          ErrorSeverity.HIGH
        );
      }
    }

    try {
      const result = await operation();

      if (this.state === 'half-open') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.failures >= this.threshold) {
      this.state = 'open';
      console.error(`⛔ Circuit breaker opened after ${this.failures} failures`);
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
    console.log('✅ Circuit breaker reset to closed state');
  }

  getState(): { state: string; failures: number } {
    return {
      state: this.state,
      failures: this.failures,
    };
  }
}

export const emailServiceCircuitBreaker = new CircuitBreaker(5, 60000);
export const smsServiceCircuitBreaker = new CircuitBreaker(5, 60000);
export const aiServiceCircuitBreaker = new CircuitBreaker(3, 30000);

/**
 * Health check system
 */
class HealthChecker {
  private checks: Map<string, () => Promise<boolean>> = new Map();

  register(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
  }

  async runChecks(): Promise<{
    healthy: boolean;
    checks: Record<string, { healthy: boolean; error?: string }>;
  }> {
    const results: Record<string, { healthy: boolean; error?: string }> = {};
    let allHealthy = true;

    for (const [name, check] of this.checks) {
      try {
        const healthy = await Promise.race([
          check(),
          new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          ),
        ]);

        results[name] = { healthy };
        if (!healthy) allHealthy = false;
      } catch (error: any) {
        results[name] = { healthy: false, error: error.message };
        allHealthy = false;
      }
    }

    return { healthy: allHealthy, checks: results };
  }
}

export const healthChecker = new HealthChecker();

// Health checks are registered in the main application
// See server/index.ts for implementations
