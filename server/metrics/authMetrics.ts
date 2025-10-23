import { logger } from '../monitoring';

interface AuthMetric {
  timestamp: number;
  operation: string;
  result: 'success' | 'failure';
  duration?: number;
  error?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class AuthMetricsCollector {
  private metrics: AuthMetric[] = [];
  private readonly maxMetrics = 10000; // Keep last 10k metrics in memory
  private readonly metricsWindow = 3600000; // 1 hour

  // Counters
  private loginAttempts = { success: 0, failure: 0 };
  private sessionErrors = { deserialize: 0, store: 0, expired: 0 };
  private oidcOperations = { discovery: 0, token: 0, userinfo: 0 };
  private activeSessions = new Set<string>();

  /**
   * Record a login attempt
   */
  recordLoginAttempt(result: 'success' | 'failure', duration: number, userId?: string, error?: string) {
    this.loginAttempts[result]++;

    this.addMetric({
      timestamp: Date.now(),
      operation: 'login',
      result,
      duration,
      userId,
      error,
    });

    logger.info(`📊 Auth Metric: Login ${result}`, {
      duration: `${duration}ms`,
      userId,
      totalSuccess: this.loginAttempts.success,
      totalFailure: this.loginAttempts.failure,
    });
  }

  /**
   * Record OIDC operation (discovery, token exchange, userinfo)
   */
  recordOidcOperation(
    step: 'discovery' | 'token' | 'userinfo',
    result: 'success' | 'failure',
    duration: number,
    error?: string
  ) {
    if (result === 'success') {
      this.oidcOperations[step]++;
    }

    this.addMetric({
      timestamp: Date.now(),
      operation: `oidc_${step}`,
      result,
      duration,
      error,
    });

    logger.debug(`📊 Auth Metric: OIDC ${step} ${result}`, {
      duration: `${duration}ms`,
      error,
    });
  }

  /**
   * Record session error
   */
  recordSessionError(type: 'deserialize' | 'store' | 'expired', error: string, userId?: string) {
    this.sessionErrors[type]++;

    this.addMetric({
      timestamp: Date.now(),
      operation: `session_error_${type}`,
      result: 'failure',
      error,
      userId,
    });

    logger.warn(`📊 Auth Metric: Session error (${type})`, {
      type,
      error,
      userId,
      totalErrors: this.sessionErrors[type],
    });
  }

  /**
   * Record active session
   */
  addActiveSession(sessionId: string) {
    this.activeSessions.add(sessionId);
  }

  /**
   * Remove active session
   */
  removeActiveSession(sessionId: string) {
    this.activeSessions.delete(sessionId);
  }

  /**
   * Record user upsert operation
   */
  recordUserUpsert(result: 'success' | 'failure', duration: number, userId?: string, error?: string) {
    this.addMetric({
      timestamp: Date.now(),
      operation: 'user_upsert',
      result,
      duration,
      userId,
      error,
    });

    logger.debug(`📊 Auth Metric: User upsert ${result}`, {
      duration: `${duration}ms`,
      userId,
    });
  }

  /**
   * Record user serialization
   */
  recordSerialization(result: 'success' | 'failure', userId?: string, error?: string) {
    this.addMetric({
      timestamp: Date.now(),
      operation: 'serialize',
      result,
      userId,
      error,
    });

    if (result === 'failure') {
      logger.error(`📊 Auth Metric: Serialization failed`, { userId, error });
    }
  }

  /**
   * Record user deserialization
   */
  recordDeserialization(result: 'success' | 'failure', userId?: string, error?: string) {
    this.addMetric({
      timestamp: Date.now(),
      operation: 'deserialize',
      result,
      userId,
      error,
    });

    if (result === 'failure') {
      logger.warn(`📊 Auth Metric: Deserialization failed`, { userId, error });
    }
  }

  /**
   * Add metric to collection
   */
  private addMetric(metric: AuthMetric) {
    this.metrics.push(metric);

    // Trim old metrics if we exceed max
    if (this.metrics.length > this.maxMetrics) {
      const cutoff = Date.now() - this.metricsWindow;
      this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    }
  }

  /**
   * Get metrics summary for monitoring
   */
  getMetrics() {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < this.metricsWindow);

    // Calculate success rates
    const loginSuccessRate = this.loginAttempts.success + this.loginAttempts.failure > 0
      ? (this.loginAttempts.success / (this.loginAttempts.success + this.loginAttempts.failure)) * 100
      : 100;

    // Calculate average durations
    const loginDurations = recentMetrics
      .filter(m => m.operation === 'login' && m.duration)
      .map(m => m.duration!);
    const avgLoginDuration = loginDurations.length > 0
      ? loginDurations.reduce((a, b) => a + b, 0) / loginDurations.length
      : 0;

    // Get recent errors
    const recentErrors = recentMetrics
      .filter(m => m.result === 'failure')
      .slice(-10) // Last 10 errors
      .map(m => ({
        operation: m.operation,
        error: m.error,
        timestamp: new Date(m.timestamp).toISOString(),
        userId: m.userId,
      }));

    return {
      overview: {
        activeSessions: this.activeSessions.size,
        loginSuccessRate: loginSuccessRate.toFixed(2) + '%',
        avgLoginDuration: avgLoginDuration.toFixed(0) + 'ms',
        totalMetrics: recentMetrics.length,
      },
      counters: {
        loginAttempts: this.loginAttempts,
        sessionErrors: this.sessionErrors,
        oidcOperations: this.oidcOperations,
      },
      recentErrors,
      health: {
        status: loginSuccessRate >= 95 ? 'healthy' : loginSuccessRate >= 80 ? 'degraded' : 'unhealthy',
        issues: [
          this.sessionErrors.store > 10 && 'High session store errors',
          this.sessionErrors.deserialize > 20 && 'High deserialization errors',
          loginSuccessRate < 80 && 'Low login success rate',
        ].filter(Boolean),
      },
    };
  }

  /**
   * Get Prometheus-style metrics
   */
  getPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    const lines: string[] = [];

    // Login attempts
    lines.push('# HELP auth_login_attempts_total Total number of login attempts');
    lines.push('# TYPE auth_login_attempts_total counter');
    lines.push(`auth_login_attempts_total{result="success"} ${this.loginAttempts.success}`);
    lines.push(`auth_login_attempts_total{result="failure"} ${this.loginAttempts.failure}`);

    // Session errors
    lines.push('# HELP auth_session_errors_total Total number of session errors');
    lines.push('# TYPE auth_session_errors_total counter');
    lines.push(`auth_session_errors_total{type="deserialize"} ${this.sessionErrors.deserialize}`);
    lines.push(`auth_session_errors_total{type="store"} ${this.sessionErrors.store}`);
    lines.push(`auth_session_errors_total{type="expired"} ${this.sessionErrors.expired}`);

    // OIDC operations
    lines.push('# HELP auth_oidc_operations_total Total number of OIDC operations');
    lines.push('# TYPE auth_oidc_operations_total counter');
    lines.push(`auth_oidc_operations_total{step="discovery"} ${this.oidcOperations.discovery}`);
    lines.push(`auth_oidc_operations_total{step="token"} ${this.oidcOperations.token}`);
    lines.push(`auth_oidc_operations_total{step="userinfo"} ${this.oidcOperations.userinfo}`);

    // Active sessions
    lines.push('# HELP auth_active_sessions_gauge Number of active sessions');
    lines.push('# TYPE auth_active_sessions_gauge gauge');
    lines.push(`auth_active_sessions_gauge ${this.activeSessions.size}`);

    return lines.join('\n');
  }

  /**
   * Reset all metrics (for testing)
   */
  reset() {
    this.metrics = [];
    this.loginAttempts = { success: 0, failure: 0 };
    this.sessionErrors = { deserialize: 0, store: 0, expired: 0 };
    this.oidcOperations = { discovery: 0, token: 0, userinfo: 0 };
    this.activeSessions.clear();
    logger.info('📊 Auth metrics reset');
  }
}

// Global singleton
export const authMetrics = new AuthMetricsCollector();

/**
 * Measure duration of async operation
 */
export async function measureAuth<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - start;

    // Record success based on operation type
    if (operation === 'login') {
      authMetrics.recordLoginAttempt('success', duration);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    // Record failure based on operation type
    if (operation === 'login') {
      authMetrics.recordLoginAttempt('failure', duration, undefined, (error as Error).message);
    }

    throw error;
  }
}
