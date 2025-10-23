import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "./redis";

// Create Redis-backed rate limiter factory
export function rateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix?: string;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: any) => string;
}) {
  // If Redis is not available, fall back to memory store
  const store = redis.status === "ready" 
    ? new RedisStore({
        client: redis,
        prefix: `rl:${options.keyPrefix || 'default'}:`,
      })
    : undefined;

  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    store,
    keyGenerator: options.keyGenerator || ((req: any) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user?.claims?.sub || req.ip || 'anonymous';
    }),
    skipFailedRequests: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    // Disable IPv6 validation since we're using user IDs primarily
    validate: false,
  });
}

// General API rate limiter (100 requests per 15 minutes)
export const generalApiRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyPrefix: "general",
});

// Strict rate limiter for auth endpoints (5 requests per 15 minutes)
export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "auth",
  message: "Too many authentication attempts, please try again later.",
});

// Business action rate limiter (50 requests per hour)
export const businessActionRateLimit = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 50,
  keyPrefix: "business",
  skipSuccessfulRequests: true,
});

// Voting rate limiter (10 votes per day)
export const votingRateLimit = rateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  keyPrefix: "voting",
  message: "You have reached your daily voting limit.",
});

// Admin action rate limiter (200 requests per hour)
export const adminActionRateLimit = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 200,
  keyPrefix: "admin",
});

// Search rate limiter (30 searches per minute)
export const searchRateLimit = rateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyPrefix: "search",
});

// Upload rate limiter (10 uploads per hour)
export const uploadRateLimit = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyPrefix: "upload",
  message: "Upload limit reached. Please try again later.",
});

// Checkout rate limiter (5 checkouts per hour)
export const checkoutRateLimit = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyPrefix: "checkout",
  message: "Too many checkout attempts. Please try again later.",
});

// Dynamic rate limiter for custom limits
export function createDynamicRateLimiter(
  keyPrefix: string,
  getLimit: (req: any) => Promise<{ windowMs: number; max: number }>
) {
  return async (req: any, res: any, next: any) => {
    try {
      const { windowMs, max } = await getLimit(req);
      const limiter = rateLimiter({
        windowMs,
        max,
        keyPrefix: `dynamic:${keyPrefix}`,
      });
      limiter(req, res, next);
    } catch (error) {
      console.error("Dynamic rate limiter error:", error);
      next();
    }
  };
}

// Rate limit status endpoint
export async function getRateLimitStatus(userId: string, keyPrefix: string): Promise<{
  limit: number;
  remaining: number;
  reset: Date;
}> {
  try {
    const key = `rl:${keyPrefix}:${userId}`;
    const count = await redis.get(key);
    const ttl = await redis.ttl(key);
    
    // Default limits based on prefix
    const limits: Record<string, number> = {
      general: 100,
      auth: 5,
      business: 50,
      voting: 10,
      admin: 200,
      search: 30,
      upload: 10,
      checkout: 5,
    };
    
    const limit = limits[keyPrefix] || 100;
    const used = parseInt(count || "0");
    const reset = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : 0));
    
    return {
      limit,
      remaining: Math.max(0, limit - used),
      reset,
    };
  } catch (error) {
    console.error("Rate limit status error:", error);
    return {
      limit: 100,
      remaining: 100,
      reset: new Date(Date.now() + 15 * 60 * 1000),
    };
  }
}
