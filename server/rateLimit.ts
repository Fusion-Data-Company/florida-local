import { rateLimiter } from "./rateLimiter";

// General API rate limit: 100 requests per 15 minutes
export const generalAPIRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => {
    const user = (req as any).user;
    return user?.id || req.ip || 'anonymous';
  },
});

// Strict rate limit for sensitive operations: 10 requests per 15 minutes
export const strictRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const user = (req as any).user;
    return user?.id || req.ip || 'anonymous';
  },
});

// Business action rate limit: 30 requests per 15 minutes
export const businessActionRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => {
    const user = (req as any).user;
    return user?.id || req.ip || 'anonymous';
  },
});

// Public endpoint rate limit: 200 requests per 15 minutes
export const publicEndpointRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: (req) => req.ip || 'anonymous',
});

// Voting rate limit: 5 votes per hour
export const votingRateLimit = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const user = (req as any).user;
    return user?.id || req.ip || 'anonymous';
  },
  message: "You can only vote 5 times per hour",
});