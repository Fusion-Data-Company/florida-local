/**
 * Google My Business Error Handler and Monitoring System
 * Provides comprehensive error handling, retry logic, and monitoring for GMB operations
 */

import { storage } from "./storage";

export enum GMBErrorType {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  LOCATION_NOT_FOUND = 'LOCATION_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  SYNC_CONFLICT = 'SYNC_CONFLICT',
  DATA_VALIDATION_ERROR = 'DATA_VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface GMBError {
  type: GMBErrorType;
  message: string;
  code?: string | number;
  retryable: boolean;
  retryAfter?: number; // seconds
  originalError?: Error;
  context?: Record<string, any>;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean;
}

export class GMBErrorHandler {
  private static instance: GMBErrorHandler;
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  };

  private circuitBreaker = {
    isOpen: false,
    failures: 0,
    lastFailureTime: 0,
    threshold: 5,
    timeout: 60000 // 1 minute
  };

  public static getInstance(): GMBErrorHandler {
    if (!GMBErrorHandler.instance) {
      GMBErrorHandler.instance = new GMBErrorHandler();
    }
    return GMBErrorHandler.instance;
  }

  /**
   * Parse and classify GMB API errors
   */
  public parseGMBError(error: any): GMBError {
    // Google API error format
    if (error.response?.data?.error) {
      const gmbError = error.response.data.error;
      return this.classifyError(gmbError.code, gmbError.message, error);
    }

    // Axios error format
    if (error.response?.status) {
      return this.classifyHttpError(error.response.status, error.response.statusText, error);
    }

    // Network errors
    if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
      return {
        type: GMBErrorType.NETWORK_ERROR,
        message: 'Network connection failed',
        retryable: true,
        originalError: error
      };
    }

    // Unknown errors
    return {
      type: GMBErrorType.UNKNOWN_ERROR,
      message: error.message || 'Unknown error occurred',
      retryable: false,
      originalError: error
    };
  }

  private classifyError(code: string | number, message: string, originalError: Error): GMBError {
    switch (code) {
      case 429:
      case 'RATE_LIMIT_EXCEEDED':
        return {
          type: GMBErrorType.RATE_LIMIT_EXCEEDED,
          message: 'Rate limit exceeded. Please try again later.',
          code,
          retryable: true,
          retryAfter: this.extractRetryAfter(originalError),
          originalError
        };

      case 403:
      case 'QUOTA_EXCEEDED':
        return {
          type: GMBErrorType.QUOTA_EXCEEDED,
          message: 'API quota exceeded. Please try again tomorrow.',
          code,
          retryable: false,
          originalError
        };

      case 401:
      case 'UNAUTHENTICATED':
        return {
          type: GMBErrorType.INVALID_CREDENTIALS,
          message: 'Invalid or expired credentials.',
          code,
          retryable: false,
          originalError
        };

      case 'PERMISSION_DENIED':
        return {
          type: GMBErrorType.PERMISSION_DENIED,
          message: 'Insufficient permissions to access this resource.',
          code,
          retryable: false,
          originalError
        };

      case 404:
      case 'NOT_FOUND':
        return {
          type: GMBErrorType.LOCATION_NOT_FOUND,
          message: 'Business location not found in Google My Business.',
          code,
          retryable: false,
          originalError
        };

      case 503:
      case 'UNAVAILABLE':
        return {
          type: GMBErrorType.API_UNAVAILABLE,
          message: 'Google My Business API is temporarily unavailable.',
          code,
          retryable: true,
          retryAfter: 60,
          originalError
        };

      default:
        return {
          type: GMBErrorType.UNKNOWN_ERROR,
          message: message || 'Unknown error occurred',
          code,
          retryable: false,
          originalError
        };
    }
  }

  private classifyHttpError(status: number, statusText: string, originalError: Error): GMBError {
    switch (status) {
      case 429:
        return {
          type: GMBErrorType.RATE_LIMIT_EXCEEDED,
          message: 'Too many requests. Please slow down.',
          code: status,
          retryable: true,
          retryAfter: this.extractRetryAfter(originalError),
          originalError
        };

      case 401:
        return {
          type: GMBErrorType.TOKEN_EXPIRED,
          message: 'Authentication token has expired.',
          code: status,
          retryable: false,
          originalError
        };

      case 403:
        return {
          type: GMBErrorType.PERMISSION_DENIED,
          message: 'Access forbidden. Check API permissions.',
          code: status,
          retryable: false,
          originalError
        };

      case 404:
        return {
          type: GMBErrorType.LOCATION_NOT_FOUND,
          message: 'Resource not found.',
          code: status,
          retryable: false,
          originalError
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: GMBErrorType.API_UNAVAILABLE,
          message: 'Google services are temporarily unavailable.',
          code: status,
          retryable: true,
          retryAfter: 30,
          originalError
        };

      default:
        return {
          type: GMBErrorType.UNKNOWN_ERROR,
          message: statusText || 'HTTP error occurred',
          code: status,
          retryable: status >= 500,
          originalError
        };
    }
  }

  private extractRetryAfter(error: any): number | undefined {
    const retryAfterHeader = error.response?.headers?.['retry-after'];
    if (retryAfterHeader) {
      const retryAfter = parseInt(retryAfterHeader, 10);
      return isNaN(retryAfter) ? undefined : retryAfter;
    }
    return undefined;
  }

  /**
   * Execute function with retry logic and error handling
   */
  public async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context: Record<string, any> = {}
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      throw new Error('Circuit breaker is open. Service temporarily unavailable.');
    }

    let lastError: GMBError | null = null;
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker();
        
        // Log successful operation
        await this.logOperation({
          type: 'success',
          attempt: attempt + 1,
          context
        });
        
        return result;
      } catch (error) {
        lastError = this.parseGMBError(error);
        
        // Log error
        await this.logError(lastError, {
          attempt: attempt + 1,
          maxRetries: retryConfig.maxRetries,
          ...context
        });

        // Update circuit breaker
        this.recordFailure();
        
        // Don't retry if not retryable or max retries exceeded
        if (!lastError.retryable || attempt >= retryConfig.maxRetries) {
          break;
        }

        // Calculate delay for next retry
        const delay = this.calculateDelay(attempt, retryConfig, lastError.retryAfter);
        
        // Wait before retry
        await this.sleep(delay);
      }
    }

    // All retries exhausted
    throw lastError?.originalError || new Error('Operation failed after retries');
  }

  private calculateDelay(attempt: number, config: RetryConfig, retryAfter?: number): number {
    // Use server-suggested delay if provided
    if (retryAfter) {
      return retryAfter * 1000; // Convert to milliseconds
    }

    // Exponential backoff
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    
    // Apply jitter
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    // Cap at max delay
    return Math.min(delay, config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Circuit breaker implementation
   */
  private isCircuitBreakerOpen(): boolean {
    if (this.circuitBreaker.isOpen) {
      // Check if timeout has passed
      if (Date.now() - this.circuitBreaker.lastFailureTime > this.circuitBreaker.timeout) {
        this.resetCircuitBreaker();
        return false;
      }
      return true;
    }
    return false;
  }

  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      console.warn('GMB Circuit breaker opened due to repeated failures');
    }
  }

  private resetCircuitBreaker(): void {
    this.circuitBreaker.isOpen = false;
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.lastFailureTime = 0;
  }

  /**
   * Log error for monitoring and debugging
   */
  private async logError(error: GMBError, context: Record<string, any>): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      service: 'gmb',
      error_type: error.type,
      error_message: error.message,
      error_code: error.code,
      retryable: error.retryable,
      retry_after: error.retryAfter,
      context,
      stack: error.originalError?.stack
    };

    // Log to console (in production, this would go to a proper logging service)
    console.error('GMB Error:', JSON.stringify(logEntry, null, 2));

    // Store in database for monitoring
    try {
      await storage.createGmbSyncHistory({
        businessId: context.businessId || 'unknown',
        syncType: context.operation || 'unknown',
        status: 'error',
        errorMessage: error.message,
        errorCode: error.code?.toString(),
        details: logEntry,
        createdAt: new Date()
      });
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
    }
  }

  /**
   * Log successful operation for monitoring
   */
  private async logOperation(data: {
    type: 'success' | 'retry';
    attempt: number;
    context: Record<string, any>;
  }): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'gmb',
      type: data.type,
      attempt: data.attempt,
      context: data.context
    };

    // Log to console
    console.info('GMB Operation:', JSON.stringify(logEntry, null, 2));

    // Store success in database for monitoring
    if (data.type === 'success' && data.context.businessId) {
      try {
        await storage.createGmbSyncHistory({
          businessId: data.context.businessId,
          syncType: data.context.operation || 'unknown',
          status: 'success',
          details: logEntry,
          createdAt: new Date()
        });
      } catch (dbError) {
        console.error('Failed to log success to database:', dbError);
      }
    }
  }

  /**
   * Health check for GMB integration
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    circuitBreaker: typeof this.circuitBreaker;
    lastCheck: string;
  } {
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (this.circuitBreaker.isOpen) {
      status = 'unhealthy';
    } else if (this.circuitBreaker.failures > 0) {
      status = 'degraded';
    }

    return {
      status,
      circuitBreaker: { ...this.circuitBreaker },
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * Validate data consistency between local and GMB data
   */
  public validateDataConsistency(localData: any, gmbData: any): {
    isConsistent: boolean;
    conflicts: Array<{
      field: string;
      local: any;
      gmb: any;
      severity: 'low' | 'medium' | 'high';
    }>;
  } {
    const conflicts: Array<{
      field: string;
      local: any;
      gmb: any;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    // Check critical fields
    const criticalFields = ['name', 'address', 'phone'];
    const importantFields = ['website', 'category'];
    const minorFields = ['description'];

    for (const field of criticalFields) {
      if (localData[field] && gmbData[field] && localData[field] !== gmbData[field]) {
        conflicts.push({
          field,
          local: localData[field],
          gmb: gmbData[field],
          severity: 'high'
        });
      }
    }

    for (const field of importantFields) {
      if (localData[field] && gmbData[field] && localData[field] !== gmbData[field]) {
        conflicts.push({
          field,
          local: localData[field],
          gmb: gmbData[field],
          severity: 'medium'
        });
      }
    }

    for (const field of minorFields) {
      if (localData[field] && gmbData[field] && localData[field] !== gmbData[field]) {
        conflicts.push({
          field,
          local: localData[field],
          gmb: gmbData[field],
          severity: 'low'
        });
      }
    }

    return {
      isConsistent: conflicts.length === 0,
      conflicts
    };
  }
}

// Export singleton instance
export const gmbErrorHandler = GMBErrorHandler.getInstance();