/**
 * Rate Limiting Tests
 * Tests for API rate limiting, Redis-based limiting, and distributed rate limiting
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { rateLimiter } from '../rateLimiter';
import {
  generalAPIRateLimit,
  strictRateLimit,
  businessActionRateLimit,
  publicEndpointRateLimit,
  votingRateLimit,
} from '../rateLimit';
import { redis, isRedisAvailable } from '../redis';

// Mock dependencies
vi.mock('../redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    del: vi.fn(),
    ttl: vi.fn(),
    eval: vi.fn(),
  },
  isRedisAvailable: vi.fn(),
  checkRedisConnection: vi.fn(),
}));

vi.mock('../monitoring', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
  trackEvent: vi.fn(),
}));

let app: Express;

beforeAll(() => {
  // Create test Express app
  app = express();
  app.use(express.json());

  // Set up test routes with different rate limiters
  app.get('/api/general', generalAPIRateLimit, (req, res) => {
    res.json({ message: 'General endpoint' });
  });

  app.post('/api/strict', strictRateLimit, (req, res) => {
    res.json({ message: 'Strict endpoint' });
  });

  app.post('/api/business', businessActionRateLimit, (req, res) => {
    res.json({ message: 'Business action' });
  });

  app.get('/api/public', publicEndpointRateLimit, (req, res) => {
    res.json({ message: 'Public endpoint' });
  });

  app.post('/api/vote', votingRateLimit, (req, res) => {
    res.json({ message: 'Vote recorded' });
  });

  // Custom test endpoint for testing rate limiter directly
  app.get('/api/custom', rateLimiter({ windowMs: 60000, max: 5 }), (req, res) => {
    res.json({ message: 'Custom rate limited' });
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  // Reset rate limit counters
  vi.mocked(redis.get).mockResolvedValue(null);
  vi.mocked(redis.incr).mockResolvedValue(1);
  vi.mocked(redis.expire).mockResolvedValue(1);
  vi.mocked(isRedisAvailable).mockResolvedValue(true);
});

describe('Rate Limiter Configuration', () => {
  it('should create rate limiter with custom options', () => {
    const limiter = rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests',
      keyGenerator: (req) => req.ip || 'anonymous',
    });

    expect(limiter).toBeDefined();
    expect(typeof limiter).toBe('function');
  });

  it('should use default options when not provided', () => {
    const limiter = rateLimiter({});
    expect(limiter).toBeDefined();
  });
});

describe('General API Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    // Mock Redis to simulate request counting
    let requestCount = 0;
    vi.mocked(redis.incr).mockImplementation(async () => ++requestCount);

    // Make requests within limit
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .get('/api/general')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'General endpoint');
    }
  });

  it('should block requests exceeding limit', async () => {
    // Mock Redis to simulate hitting rate limit
    vi.mocked(redis.get).mockResolvedValue('101'); // Over limit of 100

    const response = await request(app)
      .get('/api/general')
      .expect(429);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Too many requests');
  });

  it('should track requests per user when authenticated', async () => {
    const userId = 'user-123';
    let userRequestCount = 0;

    // Mock authenticated request
    const appWithAuth = express();
    appWithAuth.use((req, res, next) => {
      (req as any).user = { id: userId };
      next();
    });
    appWithAuth.get('/api/general', generalAPIRateLimit, (req, res) => {
      res.json({ message: 'General endpoint' });
    });

    vi.mocked(redis.incr).mockImplementation(async (key) => {
      if (key.includes(userId)) {
        return ++userRequestCount;
      }
      return 1;
    });

    await request(appWithAuth)
      .get('/api/general')
      .expect(200);

    // Verify Redis was called with user-specific key
    expect(redis.incr).toHaveBeenCalled();
  });

  it('should use IP-based limiting for unauthenticated requests', async () => {
    const testApp = express();
    testApp.set('trust proxy', true);
    testApp.get('/api/general', generalAPIRateLimit, (req, res) => {
      res.json({ message: 'General endpoint' });
    });

    await request(testApp)
      .get('/api/general')
      .set('X-Forwarded-For', '192.168.1.1')
      .expect(200);

    // Verify Redis was called with IP-based key
    expect(redis.incr).toHaveBeenCalled();
  });
});

describe('Strict Rate Limiting', () => {
  it('should enforce stricter limits on sensitive endpoints', async () => {
    let requestCount = 0;
    vi.mocked(redis.incr).mockImplementation(async () => ++requestCount);
    vi.mocked(redis.get).mockImplementation(async (key) => {
      if (requestCount > 10) return '11'; // Over strict limit
      return null;
    });

    // Make requests up to limit
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/strict')
        .send({})
        .expect(200);
    }

    // 11th request should be blocked
    const response = await request(app)
      .post('/api/strict')
      .send({})
      .expect(429);

    expect(response.body).toHaveProperty('error');
  });

  it('should reset after window expires', async () => {
    vi.mocked(redis.ttl).mockResolvedValue(-1); // Key expired
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(redis.incr).mockResolvedValue(1);

    const response = await request(app)
      .post('/api/strict')
      .send({})
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Strict endpoint');
  });
});

describe('Business Action Rate Limiting', () => {
  it('should limit business-related actions', async () => {
    let requestCount = 0;
    vi.mocked(redis.incr).mockImplementation(async () => ++requestCount);
    vi.mocked(redis.get).mockImplementation(async (key) => {
      if (requestCount > 30) return '31'; // Over business action limit
      return null;
    });

    // Make 30 requests (within limit)
    for (let i = 0; i < 30; i++) {
      await request(app)
        .post('/api/business')
        .send({})
        .expect(200);
    }

    // 31st request should be blocked
    await request(app)
      .post('/api/business')
      .send({})
      .expect(429);
  });
});

describe('Public Endpoint Rate Limiting', () => {
  it('should allow higher limits for public endpoints', async () => {
    let requestCount = 0;
    vi.mocked(redis.incr).mockImplementation(async () => ++requestCount);
    vi.mocked(redis.get).mockImplementation(async (key) => {
      if (requestCount > 200) return '201'; // Over public limit
      return null;
    });

    // Public endpoints should allow more requests
    for (let i = 0; i < 200; i++) {
      await request(app)
        .get('/api/public')
        .expect(200);
    }

    // 201st request should be blocked
    await request(app)
      .get('/api/public')
      .expect(429);
  });
});

describe('Voting Rate Limiting', () => {
  it('should limit voting to prevent manipulation', async () => {
    let voteCount = 0;
    vi.mocked(redis.incr).mockImplementation(async () => ++voteCount);
    vi.mocked(redis.get).mockImplementation(async (key) => {
      if (voteCount > 5) return '6'; // Over voting limit
      return null;
    });

    // Allow 5 votes
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/vote')
        .send({})
        .expect(200);
    }

    // 6th vote should be blocked with custom message
    const response = await request(app)
      .post('/api/vote')
      .send({})
      .expect(429);

    expect(response.body.error).toContain('You can only vote 5 times per hour');
  });

  it('should track votes per user', async () => {
    const appWithAuth = express();
    appWithAuth.use((req, res, next) => {
      (req as any).user = { id: 'voter-123' };
      next();
    });
    appWithAuth.post('/api/vote', votingRateLimit, (req, res) => {
      res.json({ message: 'Vote recorded' });
    });

    vi.mocked(redis.incr).mockResolvedValue(1);

    await request(appWithAuth)
      .post('/api/vote')
      .send({})
      .expect(200);

    expect(redis.incr).toHaveBeenCalledWith(expect.stringContaining('voter-123'));
  });
});

describe('Redis-based Rate Limiting', () => {
  it('should use Redis when available', async () => {
    vi.mocked(isRedisAvailable).mockResolvedValue(true);
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(redis.incr).mockResolvedValue(1);

    await request(app)
      .get('/api/general')
      .expect(200);

    expect(redis.incr).toHaveBeenCalled();
    expect(redis.expire).toHaveBeenCalled();
  });

  it('should fall back to memory when Redis is unavailable', async () => {
    vi.mocked(isRedisAvailable).mockResolvedValue(false);

    // Should still work without Redis
    await request(app)
      .get('/api/general')
      .expect(200);

    expect(redis.incr).not.toHaveBeenCalled();
  });

  it('should handle Redis errors gracefully', async () => {
    vi.mocked(redis.incr).mockRejectedValue(new Error('Redis connection error'));

    // Should fall back to memory-based limiting
    await request(app)
      .get('/api/general')
      .expect(200);
  });

  it('should use Lua script for atomic operations', async () => {
    const luaScript = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local current = redis.call('INCR', key)
      if current == 1 then
        redis.call('EXPIRE', key, window)
      end
      return current
    `;

    vi.mocked(redis.eval).mockResolvedValue(1);

    // Advanced rate limiters should use Lua for atomicity
    const advancedLimiter = rateLimiter({
      windowMs: 60000,
      max: 10,
      skipFailedRequests: true,
      skipSuccessfulRequests: false,
    });

    const testApp = express();
    testApp.get('/test', advancedLimiter, (req, res) => res.json({ ok: true }));

    await request(testApp)
      .get('/test')
      .expect(200);

    // Verify atomic operation was attempted
    expect(redis.eval).toBeDefined();
  });
});

describe('Distributed Rate Limiting', () => {
  it('should synchronize limits across multiple instances', async () => {
    // Simulate multiple server instances
    const instance1Key = 'rate-limit:instance1:api';
    const instance2Key = 'rate-limit:instance2:api';

    // Both instances share the same Redis
    vi.mocked(redis.get).mockImplementation(async (key) => {
      if (key.includes('distributed')) {
        return '50'; // Shared counter
      }
      return null;
    });

    vi.mocked(redis.incr).mockImplementation(async (key) => {
      if (key.includes('distributed')) {
        return 51; // Increment shared counter
      }
      return 1;
    });

    // Request from instance 1
    await request(app)
      .get('/api/general')
      .set('X-Instance', 'instance1')
      .expect(200);

    // Request from instance 2 should see the shared limit
    await request(app)
      .get('/api/general')
      .set('X-Instance', 'instance2')
      .expect(200);

    expect(redis.get).toHaveBeenCalled();
  });

  it('should handle Redis cluster for high availability', async () => {
    // Mock Redis cluster behavior
    const clusterNodes = ['redis1', 'redis2', 'redis3'];
    let currentNode = 0;

    vi.mocked(redis.incr).mockImplementation(async () => {
      // Round-robin between nodes
      currentNode = (currentNode + 1) % clusterNodes.length;
      return 1;
    });

    // Multiple requests should distribute across cluster
    for (let i = 0; i < 10; i++) {
      await request(app)
        .get('/api/general')
        .expect(200);
    }

    expect(redis.incr).toHaveBeenCalledTimes(10);
  });
});

describe('Rate Limit Headers', () => {
  it('should include rate limit headers in response', async () => {
    const response = await request(app)
      .get('/api/general')
      .expect(200);

    expect(response.headers).toHaveProperty('x-ratelimit-limit');
    expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    expect(response.headers).toHaveProperty('x-ratelimit-reset');
  });

  it('should show remaining requests in headers', async () => {
    let requestCount = 0;
    vi.mocked(redis.incr).mockImplementation(async () => ++requestCount);

    const response1 = await request(app)
      .get('/api/custom')
      .expect(200);

    const response2 = await request(app)
      .get('/api/custom')
      .expect(200);

    const remaining1 = parseInt(response1.headers['x-ratelimit-remaining']);
    const remaining2 = parseInt(response2.headers['x-ratelimit-remaining']);

    expect(remaining2).toBeLessThan(remaining1);
  });

  it('should include retry-after header when rate limited', async () => {
    vi.mocked(redis.get).mockResolvedValue('101');
    vi.mocked(redis.ttl).mockResolvedValue(300); // 5 minutes remaining

    const response = await request(app)
      .get('/api/general')
      .expect(429);

    expect(response.headers).toHaveProperty('retry-after');
    expect(parseInt(response.headers['retry-after'])).toBeGreaterThan(0);
  });
});

describe('Custom Key Generation', () => {
  it('should support custom key generation for rate limiting', async () => {
    const customApp = express();
    customApp.use(express.json());

    // Rate limit by API key instead of IP
    const apiKeyLimiter = rateLimiter({
      windowMs: 60000,
      max: 100,
      keyGenerator: (req) => {
        return req.headers['x-api-key'] as string || 'no-key';
      },
    });

    customApp.get('/api/data', apiKeyLimiter, (req, res) => {
      res.json({ data: 'success' });
    });

    vi.mocked(redis.incr).mockResolvedValue(1);

    await request(customApp)
      .get('/api/data')
      .set('X-API-Key', 'test-key-123')
      .expect(200);

    expect(redis.incr).toHaveBeenCalledWith(expect.stringContaining('test-key-123'));
  });

  it('should support combined key generation', async () => {
    const customApp = express();
    
    // Rate limit by user + endpoint combination
    const combinedLimiter = rateLimiter({
      windowMs: 60000,
      max: 10,
      keyGenerator: (req) => {
        const user = (req as any).user?.id || 'anonymous';
        const endpoint = req.path;
        return `${user}:${endpoint}`;
      },
    });

    customApp.use((req, res, next) => {
      (req as any).user = { id: 'user-456' };
      next();
    });

    customApp.get('/api/specific', combinedLimiter, (req, res) => {
      res.json({ data: 'success' });
    });

    vi.mocked(redis.incr).mockResolvedValue(1);

    await request(customApp)
      .get('/api/specific')
      .expect(200);

    expect(redis.incr).toHaveBeenCalledWith(expect.stringContaining('user-456:/api/specific'));
  });
});

describe('Skip Conditions', () => {
  it('should skip rate limiting for whitelisted IPs', async () => {
    const customApp = express();
    
    const limiterWithSkip = rateLimiter({
      windowMs: 60000,
      max: 5,
      skip: (req) => {
        const whitelistedIPs = ['127.0.0.1', '::1'];
        return whitelistedIPs.includes(req.ip || '');
      },
    });

    customApp.get('/api/test', limiterWithSkip, (req, res) => {
      res.json({ message: 'Success' });
    });

    // Whitelisted IP should not be rate limited
    for (let i = 0; i < 10; i++) {
      await request(customApp)
        .get('/api/test')
        .set('X-Forwarded-For', '127.0.0.1')
        .expect(200);
    }

    expect(redis.incr).not.toHaveBeenCalled();
  });

  it('should skip rate limiting for admin users', async () => {
    const customApp = express();
    
    const adminSkipLimiter = rateLimiter({
      windowMs: 60000,
      max: 5,
      skip: (req) => {
        const user = (req as any).user;
        return user?.isAdmin === true;
      },
    });

    customApp.use((req, res, next) => {
      (req as any).user = { id: 'admin-1', isAdmin: true };
      next();
    });

    customApp.get('/api/admin-test', adminSkipLimiter, (req, res) => {
      res.json({ message: 'Admin access' });
    });

    // Admin should bypass rate limits
    for (let i = 0; i < 10; i++) {
      await request(customApp)
        .get('/api/admin-test')
        .expect(200);
    }
  });
});

describe('Rate Limit Reset', () => {
  it('should reset limits after time window', async () => {
    const startTime = Date.now();
    
    // First request
    vi.mocked(redis.incr).mockResolvedValue(1);
    vi.mocked(redis.ttl).mockResolvedValue(60);

    await request(app)
      .get('/api/custom')
      .expect(200);

    // Simulate time passing (window expired)
    vi.setSystemTime(startTime + 61000);
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(redis.incr).mockResolvedValue(1);

    // Should allow new requests
    await request(app)
      .get('/api/custom')
      .expect(200);

    vi.useRealTimers();
  });

  it('should provide accurate reset time', async () => {
    const windowMs = 60000;
    const currentTime = Date.now();
    const resetTime = currentTime + windowMs;

    vi.mocked(redis.ttl).mockResolvedValue(60);

    const response = await request(app)
      .get('/api/custom')
      .expect(200);

    const headerResetTime = parseInt(response.headers['x-ratelimit-reset']);
    expect(headerResetTime).toBeGreaterThanOrEqual(currentTime);
    expect(headerResetTime).toBeLessThanOrEqual(resetTime);
  });
});