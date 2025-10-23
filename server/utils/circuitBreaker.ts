import { logger } from '../monitoring';

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Too many failures, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;      // Number of failures before opening
  successThreshold?: number;      // Number of successes to close from half-open
  timeout?: number;               // Time in ms before attempting recovery
  name?: string;                  // Name for logging
  onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;
}

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
}

const DEFAULT_OPTIONS = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  name: 'CircuitBreaker',
};

export class CircuitBreaker<T> {
  private options: Required<CircuitBreakerOptions>;
  private state: CircuitBreakerState;
  private cachedResult: T | null = null;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options } as Required<CircuitBreakerOptions>;
    this.state = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state.state === CircuitState.OPEN) {
      const timeSinceLastFailure = Date.now() - this.state.lastFailureTime;

      if (timeSinceLastFailure >= this.options.timeout) {
        logger.info(`🔄 ${this.options.name}: Transitioning to HALF_OPEN (timeout reached)`, {
          timeout: this.options.timeout,
          timeSinceLastFailure,
        });
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        logger.warn(`⚡ ${this.options.name}: Circuit is OPEN, using cached result`, {
          timeUntilRetry: this.options.timeout - timeSinceLastFailure,
        });

        if (this.cachedResult) {
          return this.cachedResult;
        }

        throw new Error(`Circuit breaker is OPEN for ${this.options.name}. Service unavailable.`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess(result);
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(result: T): void {
    this.state.lastSuccessTime = Date.now();
    this.cachedResult = result;

    if (this.state.state === CircuitState.HALF_OPEN) {
      this.state.successCount++;

      logger.info(`✅ ${this.options.name}: Success in HALF_OPEN (${this.state.successCount}/${this.options.successThreshold})`, {
        successCount: this.state.successCount,
        threshold: this.options.successThreshold,
      });

      if (this.state.successCount >= this.options.successThreshold) {
        logger.info(`🔓 ${this.options.name}: Circuit closing (threshold reached)`);
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.state.failureCount = 0;
    }
  }

  private onFailure(error: Error): void {
    this.state.lastFailureTime = Date.now();
    this.state.failureCount++;

    logger.warn(`❌ ${this.options.name}: Failure (${this.state.failureCount}/${this.options.failureThreshold})`, {
      error: error.message,
      failureCount: this.state.failureCount,
      threshold: this.options.failureThreshold,
    });

    if (this.state.state === CircuitState.HALF_OPEN) {
      logger.error(`🔒 ${this.options.name}: Opening circuit (failed in HALF_OPEN)`);
      this.transitionTo(CircuitState.OPEN);
    } else if (
      this.state.state === CircuitState.CLOSED &&
      this.state.failureCount >= this.options.failureThreshold
    ) {
      logger.error(`🔒 ${this.options.name}: Opening circuit (threshold reached)`, {
        failureCount: this.state.failureCount,
        threshold: this.options.failureThreshold,
      });
      this.transitionTo(CircuitState.OPEN);
    }
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state.state;

    if (oldState === newState) {
      return;
    }

    this.state.state = newState;

    // Reset counters on state change
    if (newState === CircuitState.CLOSED) {
      this.state.failureCount = 0;
      this.state.successCount = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.state.successCount = 0;
    }

    logger.info(`🔄 ${this.options.name}: State transition: ${oldState} → ${newState}`);

    // Call callback if provided
    if (this.options.onStateChange) {
      try {
        this.options.onStateChange(oldState, newState);
      } catch (error) {
        logger.error(`❌ ${this.options.name}: State change callback failed`, {
          error: (error as Error).message,
        });
      }
    }
  }

  /**
   * Get current circuit state for monitoring
   */
  getState(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
    lastSuccessTime: number;
    hasCachedResult: boolean;
  } {
    return {
      ...this.state,
      hasCachedResult: this.cachedResult !== null,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    logger.info(`🔄 ${this.options.name}: Manual reset`);
    this.state = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
    };
    this.cachedResult = null;
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics() {
    const totalRequests = this.state.failureCount + this.state.successCount;
    const failureRate = totalRequests > 0
      ? (this.state.failureCount / totalRequests) * 100
      : 0;

    return {
      state: this.state.state,
      failureCount: this.state.failureCount,
      successCount: this.state.successCount,
      totalRequests,
      failureRate: failureRate.toFixed(2) + '%',
      lastFailure: this.state.lastFailureTime
        ? new Date(this.state.lastFailureTime).toISOString()
        : null,
      lastSuccess: this.state.lastSuccessTime
        ? new Date(this.state.lastSuccessTime).toISOString()
        : null,
      hasCachedResult: this.cachedResult !== null,
    };
  }
}
