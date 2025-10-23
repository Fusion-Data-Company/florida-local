/**
 * Enhanced Rate Limiting Service
 * 
 * Enterprise-grade rate limiting with:
 * - IP-based rate limiting
 * - User-based rate limiting
 * - Progressive penalties for violations
 * - Redis support with memory fallback
 * - Distributed rate limiting
 * - Custom rate limit rules per endpoint
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory, RateLimiterAbstract } from 'rate-limiter-flexible';
import { redis } from './redis';
import { db } from './db';
import { rateLimitViolations, securityEvents } from '../shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { logger } from './monitoring';
import { ipAccessControl } from './ipAccessControl';
import { securityNotificationService } from './securityNotificationService';

// Configuration
const RATE_LIMIT_CONFIG = {
  // Default limits
  defaultPoints: 100, // Number of requests
  defaultDuration: 60, // Per 60 seconds
  
  // Progressive penalties
  penalties: [
    { violations: 3, multiplier: 0.5, duration: 5 * 60 }, // 50% rate for 5 mins
    { violations: 5, multiplier: 0.25, duration: 15 * 60 }, // 25% rate for 15 mins
    { violations: 10, multiplier: 0, duration: 60 * 60 }, // Complete block for 1 hour
  ],
  
  // Auto-block settings
  autoBlockAfterViolations: 15,
  autoBlockDuration: 24 * 60 * 60 * 1000, // 24 hours
  
  // Endpoints with custom limits
  customLimits: {
    '/api/auth/login': { points: 5, duration: 60 },
    '/api/auth/register': { points: 3, duration: 60 },
    '/api/auth/reset-password': { points: 3, duration: 60 },
    '/api/payments': { points: 10, duration: 60 },
    '/api/ai': { points: 20, duration: 60 },
    '/api/upload': { points: 5, duration: 60 },
    '/api/export': { points: 2, duration: 60 },
  },
  
  // Bypass for trusted IPs
  trustedIPs: process.env.TRUSTED_IPS?.split(',') || [],
};

/**
 * Rate limiter factory
 */
class RateLimiterFactory {
  private static limiters: Map<string, RateLimiterAbstract> = new Map();
  
  /**
   * Get or create a rate limiter for specific configuration
   */
  static getLimiter(
    key: string,
    points: number,
    duration: number
  ): RateLimiterAbstract {
    const limiterKey = `${key}:${points}:${duration}`;
    
    if (!this.limiters.has(limiterKey)) {
      const limiter = redis
        ? new RateLimiterRedis({
            storeClient: redis,
            keyPrefix: `ratelimit:${key}`,
            points,
            duration,
            blockDuration: 0, // We handle blocking ourselves
          })
        : new RateLimiterMemory({
            keyPrefix: `ratelimit:${key}`,
            points,
            duration,
            blockDuration: 0,
          });
      
      this.limiters.set(limiterKey, limiter);
    }
    
    return this.limiters.get(limiterKey)!;
  }
}

/**
 * Enhanced Rate Limiting Service
 */
export class EnhancedRateLimiter {
  /**
   * Create rate limiting middleware
   */
  static createMiddleware(
    options: {
      points?: number;
      duration?: number;
      keyGenerator?: (req: Request) => string;
      skipSuccessfulRequests?: boolean;
      skipFailedRequests?: boolean;
    } = {}
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ipAddress = ipAccessControl.getClientIP(req);
        
        // Check if IP is trusted
        if (RATE_LIMIT_CONFIG.trustedIPs.includes(ipAddress)) {
          return next();
        }
        
        // Check if IP is blocked
        const ipCheck = await ipAccessControl.checkIPAccess(ipAddress);
        if (ipCheck.blocked) {
          return res.status(403).json({
            error: 'Access denied',
            reason: ipCheck.reason,
          });
        }
        
        // Get rate limit configuration
        const endpoint = req.path;
        const customLimit = (RATE_LIMIT_CONFIG.customLimits as Record<string, { points: number; duration: number }>)[endpoint];
        const points = options.points || customLimit?.points || RATE_LIMIT_CONFIG.defaultPoints;
        const duration = options.duration || customLimit?.duration || RATE_LIMIT_CONFIG.defaultDuration;
        
        // Apply progressive penalties
        const penalty = await this.getProgressivePenalty(ipAddress);
        const adjustedPoints = Math.floor(points * penalty.multiplier);
        
        if (adjustedPoints === 0) {
          await this.recordViolation(ipAddress, req.path, 'blocked_by_penalty');
          return res.status(429).json({
            error: 'Too many violations',
            message: 'Your access has been temporarily suspended due to repeated violations',
            retryAfter: penalty.duration,
          });
        }
        
        // Generate rate limit key
        const keyGenerator = options.keyGenerator || ((req: Request) => {
          const userId = (req as any).session?.userId;
          return userId ? `user:${userId}` : `ip:${ipAddress}`;
        });
        const key = keyGenerator(req);
        
        // Get rate limiter
        const limiter = RateLimiterFactory.getLimiter(
          endpoint.replace(/\//g, '_'),
          adjustedPoints,
          duration
        );
        
        // Try to consume a point
        try {
          const rateLimiterRes = await limiter.consume(key, 1);
          
          // Add rate limit headers
          res.setHeader('X-RateLimit-Limit', adjustedPoints.toString());
          res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints.toString());
          res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
          
          // Store request metadata for analysis
          await this.storeRequestMetadata(ipAddress, endpoint, true);
          
          next();
        } catch (rateLimiterRes: any) {
          // Rate limit exceeded
          await this.handleRateLimitExceeded(req, res, ipAddress, endpoint, rateLimiterRes);
        }
      } catch (error) {
        logger.error('Rate limiting error', { error });
        // On error, allow request to prevent service disruption
        next();
      }
    };
  }
  
  /**
   * Get progressive penalty for an IP
   */
  private static async getProgressivePenalty(
    ipAddress: string
  ): Promise<{ multiplier: number; duration: number }> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Count recent violations
      const violations = await db
        .select({ count: sql<number>`count(*)` })
        .from(rateLimitViolations)
        .where(
          and(
            eq(rateLimitViolations.ipAddress, ipAddress),
            gte(rateLimitViolations.createdAt, oneHourAgo)
          )
        )
        .then(r => Number(r[0]?.count || 0));
      
      // Apply progressive penalties
      for (const penalty of RATE_LIMIT_CONFIG.penalties) {
        if (violations >= penalty.violations) {
          return {
            multiplier: penalty.multiplier,
            duration: penalty.duration,
          };
        }
      }
      
      return { multiplier: 1, duration: 0 };
    } catch (error) {
      logger.error('Error getting progressive penalty', { error, ipAddress });
      return { multiplier: 1, duration: 0 };
    }
  }
  
  /**
   * Handle rate limit exceeded
   */
  private static async handleRateLimitExceeded(
    req: Request,
    res: Response,
    ipAddress: string,
    endpoint: string,
    rateLimiterRes: any
  ): Promise<void> {
    try {
      // Record violation
      await this.recordViolation(ipAddress, endpoint, 'rate_limit_exceeded');
      
      // Check for auto-block
      const shouldBlock = await this.checkAutoBlock(ipAddress);
      
      if (shouldBlock) {
        // Block the IP
        await ipAccessControl.blockIP(
          ipAddress,
          `Automatically blocked after ${RATE_LIMIT_CONFIG.autoBlockAfterViolations} rate limit violations`,
          RATE_LIMIT_CONFIG.autoBlockDuration
        );
        
        res.status(403).json({
          error: 'Access denied',
          message: 'Your IP has been blocked due to excessive rate limit violations',
        });
        return;
      }
      
      // Return rate limit error
      const retryAfter = Math.round(rateLimiterRes.msBeforeNext / 1000) || 60;
      
      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', rateLimiterRes.totalPoints?.toString() || '0');
      res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints?.toString() || '0');
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
      
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please retry after ${retryAfter} seconds`,
        retryAfter,
      });
    } catch (error) {
      logger.error('Error handling rate limit exceeded', { error });
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded',
      });
    }
  }
  
  /**
   * Record a rate limit violation
   */
  private static async recordViolation(
    ipAddress: string,
    endpoint: string,
    violationType: string
  ): Promise<void> {
    try {
      const userId = undefined; // TODO: Get from session if available
      
      await db.insert(rateLimitViolations).values({
        identifier: ipAddress,
        ipAddress,
        userId,
        endpoint,
        violationType,
        requestCount: 1,
        timeWindow: 60, // Default 60 seconds window
      });
      
      // Log security event
      await db.insert(securityEvents).values({
        eventType: 'rate_limit_violation',
        severity: 'warning',
        ipAddress,
        description: `Rate limit violation: ${violationType} on ${endpoint}`,
        metadata: { endpoint, violationType },
      });
      
      logger.warn('Rate limit violation recorded', {
        ipAddress,
        endpoint,
        violationType,
      });
    } catch (error) {
      logger.error('Error recording violation', { error });
    }
  }
  
  /**
   * Check if IP should be auto-blocked
   */
  private static async checkAutoBlock(ipAddress: string): Promise<boolean> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const violations = await db
        .select({ count: sql<number>`count(*)` })
        .from(rateLimitViolations)
        .where(
          and(
            eq(rateLimitViolations.ipAddress, ipAddress),
            gte(rateLimitViolations.createdAt, oneHourAgo)
          )
        )
        .then(r => Number(r[0]?.count || 0));
      
      if (violations >= RATE_LIMIT_CONFIG.autoBlockAfterViolations) {
        // Send notification about auto-block
        await securityNotificationService.sendSecurityAlert({
          type: 'ip_auto_blocked',
          severity: 'high',
          title: 'IP Auto-Blocked for Rate Limit Violations',
          message: `IP ${ipAddress} has been automatically blocked after ${violations} rate limit violations in the past hour.`,
          metadata: { ipAddress, violations },
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error checking auto-block', { error, ipAddress });
      return false;
    }
  }
  
  /**
   * Store request metadata for analysis
   */
  private static async storeRequestMetadata(
    ipAddress: string,
    endpoint: string,
    success: boolean
  ): Promise<void> {
    try {
      // Use Redis for high-performance storage if available
      if (redis) {
        const key = `requests:${ipAddress}:${endpoint}:${success ? 'success' : 'failed'}`;
        await redis.incr(key);
        await redis.expire(key, 3600); // Expire after 1 hour
      }
    } catch (error) {
      // Silent fail - don't disrupt request flow
      logger.debug('Error storing request metadata', { error });
    }
  }
  
  /**
   * Create custom rate limiter for specific use case
   */
  static createCustomLimiter(
    name: string,
    config: {
      points: number;
      duration: number;
      blockDuration?: number;
      execEvenly?: boolean;
    }
  ): RateLimiterAbstract {
    return redis
      ? new RateLimiterRedis({
          storeClient: redis,
          keyPrefix: `custom:${name}`,
          ...config,
        })
      : new RateLimiterMemory({
          keyPrefix: `custom:${name}`,
          ...config,
        });
  }
  
  /**
   * Reset rate limits for a key
   */
  static async reset(key: string): Promise<void> {
    try {
      if (redis) {
        const keys = await redis.keys(`ratelimit:*:${key}`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
      logger.info('Rate limits reset', { key });
    } catch (error) {
      logger.error('Error resetting rate limits', { error, key });
    }
  }
  
  /**
   * Get rate limit statistics
   */
  static async getStats(): Promise<{
    totalViolations: number;
    violationsByEndpoint: Array<{ endpoint: string; count: number }>;
    topViolators: Array<{ ipAddress: string; count: number }>;
    recentBlocks: number;
  }> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const [total, byEndpoint, topViolators, blocks] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(rateLimitViolations)
          .where(gte(rateLimitViolations.createdAt, oneDayAgo))
          .then(r => Number(r[0]?.count || 0)),
        db
          .select({
            endpoint: rateLimitViolations.endpoint,
            count: sql<number>`count(*)`,
          })
          .from(rateLimitViolations)
          .where(gte(rateLimitViolations.createdAt, oneDayAgo))
          .groupBy(rateLimitViolations.endpoint)
          .orderBy(sql`count(*) DESC`)
          .limit(10),
        db
          .select({
            ipAddress: rateLimitViolations.ipAddress,
            count: sql<number>`count(*)`,
          })
          .from(rateLimitViolations)
          .where(gte(rateLimitViolations.createdAt, oneDayAgo))
          .groupBy(rateLimitViolations.ipAddress)
          .orderBy(sql`count(*) DESC`)
          .limit(10),
        db
          .select({ count: sql<number>`count(*)` })
          .from(securityEvents)
          .where(
            and(
              eq(securityEvents.eventType, 'ip_auto_blocked'),
              gte(securityEvents.createdAt, oneDayAgo)
            )
          )
          .then(r => Number(r[0]?.count || 0)),
      ]);
      
      return {
        totalViolations: total,
        violationsByEndpoint: byEndpoint as any,
        topViolators: topViolators as any,
        recentBlocks: blocks,
      };
    } catch (error) {
      logger.error('Error getting rate limit stats', { error });
      return {
        totalViolations: 0,
        violationsByEndpoint: [],
        topViolators: [],
        recentBlocks: 0,
      };
    }
  }
}

// Export convenience middleware creators
export const rateLimitAuth = EnhancedRateLimiter.createMiddleware({
  points: 5,
  duration: 60,
});

export const rateLimitAPI = EnhancedRateLimiter.createMiddleware({
  points: 100,
  duration: 60,
});

export const rateLimitStrict = EnhancedRateLimiter.createMiddleware({
  points: 10,
  duration: 60,
});

export default EnhancedRateLimiter;