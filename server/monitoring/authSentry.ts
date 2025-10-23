import * as Sentry from '@sentry/node';
import { logger } from '../monitoring';

/**
 * Capture authentication error with full context
 */
export function captureAuthError(
  error: Error,
  context: {
    operation: string;
    userId?: string;
    sessionId?: string;
    strategyName?: string;
    additionalData?: Record<string, any>;
  }
) {
  logger.error(`❌ Auth Error: ${context.operation}`, {
    error: error.message,
    ...context,
  });

  // Only send to Sentry if DSN is configured
  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      // Set context
      scope.setContext('auth', {
        operation: context.operation,
        strategyName: context.strategyName,
        sessionId: context.sessionId ? `${context.sessionId.substring(0, 8)}...` : undefined,
        ...context.additionalData,
      });

      // Set user if available
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }

      // Tag for filtering
      scope.setTag('component', 'authentication');
      scope.setTag('operation', context.operation);

      // Set level based on severity
      if (context.operation.includes('OIDC') || context.operation.includes('critical')) {
        scope.setLevel('error');
      } else {
        scope.setLevel('warning');
      }

      // Capture the exception
      Sentry.captureException(error);
    });
  }
}

/**
 * Capture authentication warning (non-critical issues)
 */
export function captureAuthWarning(
  message: string,
  context: {
    operation: string;
    userId?: string;
    sessionId?: string;
    additionalData?: Record<string, any>;
  }
) {
  logger.warn(`⚠️  Auth Warning: ${context.operation}`, {
    message,
    ...context,
  });

  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setContext('auth', {
        operation: context.operation,
        sessionId: context.sessionId ? `${context.sessionId.substring(0, 8)}...` : undefined,
        ...context.additionalData,
      });

      if (context.userId) {
        scope.setUser({ id: context.userId });
      }

      scope.setTag('component', 'authentication');
      scope.setTag('operation', context.operation);
      scope.setLevel('warning');

      Sentry.captureMessage(message, 'warning');
    });
  }
}

/**
 * Track authentication success for monitoring
 */
export function trackAuthSuccess(
  operation: string,
  userId: string,
  duration: number,
  additionalData?: Record<string, any>
) {
  logger.info(`✅ Auth Success: ${operation}`, {
    userId,
    duration: `${duration}ms`,
    ...additionalData,
  });

  if (process.env.SENTRY_DSN) {
    // Track as breadcrumb for context in future errors
    Sentry.addBreadcrumb({
      category: 'auth',
      message: `${operation} successful`,
      level: 'info',
      data: {
        userId,
        duration,
        ...additionalData,
      },
    });
  }
}

/**
 * Set auth user context for all Sentry events in this scope
 */
export function setAuthUserContext(userId: string, email?: string, additionalData?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser({
      id: userId,
      email,
      ...additionalData,
    });
  }
}

/**
 * Clear auth user context (on logout)
 */
export function clearAuthUserContext() {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

/**
 * Capture circuit breaker state change
 */
export function captureCircuitBreakerEvent(
  serviceName: string,
  oldState: string,
  newState: string,
  metrics?: Record<string, any>
) {
  const message = `Circuit Breaker: ${serviceName} transitioned from ${oldState} to ${newState}`;

  logger.warn(message, { serviceName, oldState, newState, metrics });

  if (process.env.SENTRY_DSN && newState === 'OPEN') {
    // Only send to Sentry when circuit opens (critical event)
    Sentry.withScope((scope) => {
      scope.setContext('circuitBreaker', {
        service: serviceName,
        oldState,
        newState,
        ...metrics,
      });

      scope.setTag('component', 'circuit-breaker');
      scope.setTag('service', serviceName);
      scope.setLevel('error');

      Sentry.captureMessage(message, 'error');
    });
  }
}

/**
 * Capture session degradation event
 */
export function captureSessionDegradation(
  fromStore: string,
  toStore: string,
  reason: string,
  errorCount: number
) {
  const message = `Session store degraded from ${fromStore} to ${toStore}`;

  logger.error(message, { fromStore, toStore, reason, errorCount });

  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setContext('sessionStore', {
        from: fromStore,
        to: toStore,
        reason,
        errorCount,
      });

      scope.setTag('component', 'session-store');
      scope.setTag('degradation', 'true');
      scope.setLevel('error');

      Sentry.captureMessage(message, 'error');
    });
  }
}
