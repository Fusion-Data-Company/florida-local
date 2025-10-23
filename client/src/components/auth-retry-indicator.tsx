import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface AuthRetryIndicatorProps {
  isRetrying: boolean;
  attempt?: number;
  maxAttempts?: number;
  error?: Error | null;
  onRetry?: () => void;
  operation?: string;
}

export function AuthRetryIndicator({
  isRetrying,
  attempt = 1,
  maxAttempts = 3,
  error,
  onRetry,
  operation = 'authentication',
}: AuthRetryIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isRetrying && !error) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        {isRetrying ? (
          <>
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>

            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Connecting to authentication service...
            </h3>

            <p className="text-gray-600 text-center mb-4">
              {attempt > 1 && (
                <>
                  Attempt {attempt} of {maxAttempts}
                  <br />
                </>
              )}
              Please wait while we establish a secure connection.
            </p>

            {attempt > 1 && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(attempt / maxAttempts) * 100}%` }}
                />
              </div>
            )}

            <div className="text-sm text-gray-500 text-center">
              {attempt === 1 && "This usually takes just a moment..."}
              {attempt === 2 && "Taking a bit longer than expected..."}
              {attempt >= 3 && "Almost there, thank you for your patience..."}
            </div>
          </>
        ) : error ? (
          <>
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>

            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Connection Issue
            </h3>

            <p className="text-gray-600 text-center mb-4">
              We're having trouble connecting to the authentication service.
            </p>

            {showDetails && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800 font-mono break-all">
                  {error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {showDetails ? 'Hide' : 'Show'} Technical Details
              </button>

              <a
                href="/login-error?reason=retry_exhausted"
                className="text-center text-sm text-gray-600 hover:text-gray-800 underline mt-2"
              >
                View detailed troubleshooting guide
              </a>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

interface UseAuthRetryResult {
  isRetrying: boolean;
  attempt: number;
  error: Error | null;
  retry: () => void;
  reset: () => void;
}

export function useAuthRetry(
  operation: () => Promise<void>,
  maxAttempts = 3
): UseAuthRetryResult {
  const [isRetrying, setIsRetrying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const executeWithRetry = async () => {
    setIsRetrying(true);
    setError(null);

    for (let i = 1; i <= maxAttempts; i++) {
      setAttempt(i);

      try {
        await operation();
        // Success!
        setIsRetrying(false);
        setAttempt(0);
        return;
      } catch (err) {
        const error = err as Error;

        if (i === maxAttempts) {
          // All attempts exhausted
          setError(error);
          setIsRetrying(false);
          return;
        }

        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, i - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const reset = () => {
    setIsRetrying(false);
    setAttempt(0);
    setError(null);
  };

  return {
    isRetrying,
    attempt,
    error,
    retry: executeWithRetry,
    reset,
  };
}
