import { logger } from '../monitoring';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (error: Error, attempt: number) => void;
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'shouldRetry'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Retry a function with exponential backoff
 *
 * @example
 * const result = await retryWithBackoff(
 *   () => fetchUserFromDB(userId),
 *   { maxAttempts: 3, initialDelayMs: 500 }
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await fn();

      // Log successful retry if not first attempt
      if (attempt > 1) {
        logger.info('✅ Retry successful', {
          attempt,
          totalAttempts: opts.maxAttempts,
        });
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry this error
      if (options.shouldRetry && !options.shouldRetry(lastError)) {
        logger.debug('🚫 Error not retryable, throwing immediately', {
          error: lastError.message,
        });
        throw lastError;
      }

      // If this was the last attempt, throw
      if (attempt === opts.maxAttempts) {
        logger.error('❌ All retry attempts exhausted', {
          attempts: opts.maxAttempts,
          finalError: lastError.message,
        });
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs
      );

      logger.warn(`⚠️  Retry attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms`, {
        error: lastError.message,
        attempt,
        maxAttempts: opts.maxAttempts,
        delayMs: delay,
      });

      // Call onRetry callback if provided
      if (options.onRetry) {
        try {
          options.onRetry(lastError, attempt);
        } catch (callbackError) {
          logger.error('❌ onRetry callback failed:', {
            error: (callbackError as Error).message,
          });
        }
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed for unknown reason');
}

/**
 * Check if an error is retryable (network errors, timeouts, 5xx responses)
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Network errors
  if (
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('network') ||
    message.includes('socket hang up')
  ) {
    return true;
  }

  // HTTP 5xx errors
  if (message.match(/5\d{2}/)) {
    return true;
  }

  // Database connection errors
  if (
    message.includes('connection') &&
    (message.includes('lost') || message.includes('closed'))
  ) {
    return true;
  }

  return false;
}

/**
 * Retry specifically for database operations
 */
export async function retryDatabaseOperation<T>(
  operationName: string,
  fn: () => Promise<T>
): Promise<T> {
  return retryWithBackoff(fn, {
    maxAttempts: 3,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    shouldRetry: isRetryableError,
    onRetry: (error, attempt) => {
      logger.warn(`🔄 Retrying database operation: ${operationName}`, {
        attempt,
        error: error.message,
      });
    },
  });
}

/**
 * Retry specifically for external API calls (like OIDC)
 */
export async function retryExternalApi<T>(
  apiName: string,
  fn: () => Promise<T>
): Promise<T> {
  return retryWithBackoff(fn, {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    shouldRetry: (error) => {
      // Always retry network errors and timeouts
      if (isRetryableError(error)) return true;

      // For OAuth/OIDC, also retry on certain error messages
      const message = error.message.toLowerCase();
      if (
        message.includes('discovery') ||
        message.includes('well-known') ||
        message.includes('issuer')
      ) {
        return true;
      }

      return false;
    },
    onRetry: (error, attempt) => {
      logger.warn(`🔄 Retrying external API: ${apiName}`, {
        attempt,
        error: error.message,
      });
    },
  });
}
