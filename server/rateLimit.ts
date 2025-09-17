import type { Request, Response, NextFunction } from 'express';

// SECURITY: Rate limiting for regular user actions
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export const createRateLimit = (config: RateLimitConfig) => {
  return (req: any, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = config.keyGenerator ? config.keyGenerator(req) : 
      (req.user?.claims?.sub || req.ip || 'anonymous');
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      const cutoff = now - (config.windowMs * 2);
      Object.keys(rateLimitStore).forEach(k => {
        if (rateLimitStore[k].resetTime < cutoff) {
          delete rateLimitStore[k];
        }
      });
    }

    // Check if key exists and if window has expired
    if (!rateLimitStore[key] || now > rateLimitStore[key].resetTime) {
      rateLimitStore[key] = {
        count: 0,
        resetTime: now + config.windowMs
      };
    }

    // Increment counter
    rateLimitStore[key].count++;

    // Check if limit exceeded
    if (rateLimitStore[key].count > config.maxRequests) {
      const resetIn = Math.ceil((rateLimitStore[key].resetTime - now) / 1000);
      return res.status(429).json({
        message: config.message || "Rate limit exceeded",
        retryAfter: resetIn,
        error: "RATE_LIMITED",
        limit: config.maxRequests,
        windowMs: config.windowMs
      });
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': (config.maxRequests - rateLimitStore[key].count).toString(),
      'X-RateLimit-Reset': rateLimitStore[key].resetTime.toString()
    });

    next();
  };
};

// Pre-configured rate limiters for different endpoints
export const votingRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 3, // 3 attempts per minute (allows for retries)
  message: "Voting rate limit exceeded. Please wait before trying again."
});

export const businessActionRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 20, // 20 business actions per 10 minutes
  message: "Business action rate limit exceeded. Please slow down."
});

export const generalAPIRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per 15 minutes (generous for normal use)
  message: "API rate limit exceeded. Please slow down your requests."
});

// Strict rate limiting for sensitive actions
export const strictRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 3, // Only 3 attempts per 5 minutes
  message: "Action rate limit exceeded. This action is restricted."
});

// Per-IP rate limiting for public endpoints
export const publicEndpointRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute per IP
  message: "Too many requests from this IP. Please slow down.",
  keyGenerator: (req: any) => req.ip || 'unknown'
});