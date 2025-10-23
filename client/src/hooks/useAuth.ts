import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/types";

export function useAuth() {
  const { data: user, isLoading, error, refetch, failureCount } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    // Enable retry for network errors (3 attempts, exponential backoff)
    retry: (failureCount, error) => {
      // Don't retry on 401 (not authenticated) - that's expected
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        if (message.includes('401')) {
          return false;
        }
      }

      // Retry up to 3 times for other errors (network issues, 500s, etc.)
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * 2 ** attemptIndex, 10000);
    },
    // Add staleTime to avoid unnecessary refetches
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch, // Allow manual refetch if needed
    isRetrying: isLoading && (failureCount ?? 0) > 0,
    retryAttempt: failureCount ?? 0,
  };
}
