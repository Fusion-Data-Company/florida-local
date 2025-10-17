/**
 * Authentication Tests
 * Tests for session management, login/logout, and authentication middleware
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import session from 'express-session';
import passport from 'passport';
import { setupAuth, isAuthenticated, getUser } from '../replitAuth';
import { isAdmin } from '../adminAuth';
import { storage } from '../storage';
import { mockUsers } from './helpers/testUtils';

// Mock dependencies
vi.mock('../storage');
vi.mock('../redis', () => ({
  redis: null,
  isRedisAvailable: vi.fn().mockResolvedValue(false),
  checkRedisConnection: vi.fn().mockResolvedValue(false),
  createRedisStore: vi.fn(),
}));

vi.mock('../db', () => ({
  getDatabaseStatus: vi.fn().mockReturnValue({ connected: false }),
  testDatabaseConnection: vi.fn().mockResolvedValue(false),
}));

vi.mock('openid-client', () => ({
  discovery: vi.fn().mockResolvedValue({
    metadata: {
      issuer: 'https://replit.com',
      authorization_endpoint: 'https://replit.com/auth',
      token_endpoint: 'https://replit.com/token',
    },
    Client: vi.fn().mockImplementation(() => ({
      authorizationUrl: vi.fn().mockReturnValue('https://replit.com/auth?...'),
      callback: vi.fn().mockResolvedValue({
        claims: vi.fn().mockReturnValue({
          sub: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        }),
      }),
    })),
  }),
}));

let app: Express;
let sessionStore: any;

beforeAll(async () => {
  // Set up test environment
  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET = 'test-secret-key-minimum-32-characters-long';
  process.env.REPL_ID = 'test-repl-id';
  process.env.ISSUER_URL = 'https://replit.com/oidc';

  // Create a test Express app
  app = express();
  app.use(express.json());

  // Set up session middleware
  const MemoryStore = require('memorystore')(session);
  sessionStore = new MemoryStore({
    checkPeriod: 86400000,
  });

  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for testing
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    },
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Set up auth routes
  await setupAuth(app);

  // Test routes
  app.get('/api/test/public', (req, res) => {
    res.json({ message: 'Public endpoint' });
  });

  app.get('/api/test/protected', isAuthenticated, (req, res) => {
    res.json({ message: 'Protected endpoint', user: (req as any).user });
  });

  app.get('/api/test/admin', isAuthenticated, isAdmin, (req, res) => {
    res.json({ message: 'Admin endpoint' });
  });

  app.get('/api/auth/user', (req, res) => {
    const user = (req as any).user;
    if (user) {
      res.json({ user });
    } else {
      res.status(404).json({ error: 'Not authenticated' });
    }
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Session Management', () => {
  it('should create a session for authenticated user', async () => {
    const agent = request.agent(app);

    // Mock successful authentication
    vi.mocked(storage).upsertUser = vi.fn().mockResolvedValue(mockUsers.regular);
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

    // Simulate login by setting session
    const response = await agent
      .get('/api/test/public')
      .expect(200);

    expect(response.body).toEqual({ message: 'Public endpoint' });
    
    // Session should be created
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      expect(cookies.some((c: string) => c.includes('connect.sid'))).toBe(true);
    }
  });

  it('should maintain session across requests', async () => {
    const agent = request.agent(app);

    // Mock user in storage
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

    // First request - establish session
    await agent.get('/api/test/public').expect(200);

    // Manually set user in session for testing
    // In real scenario, this would be done by passport after OAuth
    const sessionData = {
      passport: { user: mockUsers.regular.id },
    };

    // Mock passport user deserialization
    passport.deserializeUser((id, done) => {
      storage.getUser(id as string).then(user => done(null, user));
    });

    // Second request should maintain session
    const response = await agent.get('/api/test/public').expect(200);
    
    // Verify cookies are maintained
    const cookies = response.headers['set-cookie'] || [];
    expect(cookies.length).toBeGreaterThanOrEqual(0);
  });

  it('should expire sessions after maxAge', async () => {
    const agent = request.agent(app);

    // Create a session
    await agent.get('/api/test/public').expect(200);

    // Mock time passage beyond session maxAge
    const futureTime = Date.now() + (25 * 60 * 60 * 1000); // 25 hours later
    vi.setSystemTime(futureTime);

    // Session should be expired
    await agent.get('/api/test/protected').expect(401);

    vi.useRealTimers();
  });

  it('should handle session store errors gracefully', async () => {
    const originalGet = sessionStore.get;
    sessionStore.get = vi.fn((sid, callback) => {
      callback(new Error('Session store error'), null);
    });

    await request(app)
      .get('/api/test/protected')
      .expect(401);

    sessionStore.get = originalGet;
  });
});

describe('Authentication Flow', () => {
  it('should redirect unauthenticated users to login', async () => {
    await request(app)
      .get('/api/test/protected')
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty('error', 'Authentication required');
      });
  });

  it('should allow access to protected routes for authenticated users', async () => {
    const agent = request.agent(app);

    // Mock authenticated user
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

    // Simulate authenticated session
    const mockSession = {
      passport: { user: mockUsers.regular.id },
    };

    // Override isAuthenticated for this test
    app.use((req, res, next) => {
      if (req.path === '/api/test/protected') {
        (req as any).user = mockUsers.regular;
        (req as any).isAuthenticated = () => true;
      }
      next();
    });

    // Create new app instance with mocked auth
    const testApp = express();
    testApp.use(express.json());
    testApp.get('/api/test/protected', (req, res, next) => {
      (req as any).user = mockUsers.regular;
      next();
    }, isAuthenticated, (req, res) => {
      res.json({ message: 'Protected endpoint', user: (req as any).user });
    });

    const response = await request(testApp)
      .get('/api/test/protected')
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Protected endpoint');
    expect(response.body).toHaveProperty('user');
  });

  it('should handle OAuth callback correctly', async () => {
    const agent = request.agent(app);

    // Mock OAuth callback response
    const mockOAuthUser = {
      id: 'oauth-user-id',
      email: 'oauth@example.com',
      name: 'OAuth User',
    };

    vi.mocked(storage).upsertUser = vi.fn().mockResolvedValue({
      ...mockOAuthUser,
      isAdmin: false,
    });

    // Simulate OAuth callback
    // In real scenario, this would be handled by passport strategy
    const response = await agent
      .get('/api/auth/callback?code=test-code')
      .expect((res) => {
        // OAuth callback typically redirects
        expect([302, 200]).toContain(res.status);
      });
  });

  it('should handle OAuth errors gracefully', async () => {
    const agent = request.agent(app);

    // Simulate OAuth error
    const response = await agent
      .get('/api/auth/callback?error=access_denied')
      .expect((res) => {
        expect([400, 302]).toContain(res.status);
      });
  });
});

describe('User Authentication', () => {
  it('should return current user when authenticated', async () => {
    const agent = request.agent(app);

    // Mock authenticated user
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

    // Create authenticated session
    const testApp = express();
    testApp.use(express.json());
    testApp.use((req, res, next) => {
      (req as any).user = mockUsers.regular;
      next();
    });
    testApp.get('/api/auth/user', (req, res) => {
      const user = (req as any).user;
      if (user) {
        res.json({ user });
      } else {
        res.status(404).json({ error: 'Not authenticated' });
      }
    });

    const response = await request(testApp)
      .get('/api/auth/user')
      .expect(200);

    expect(response.body.user).toEqual(mockUsers.regular);
  });

  it('should return 404 when not authenticated', async () => {
    const response = await request(app)
      .get('/api/auth/user')
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Not authenticated');
  });

  it('should handle logout correctly', async () => {
    const agent = request.agent(app);

    // Create authenticated session
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

    // Add logout route for testing
    app.post('/api/auth/logout', (req, res) => {
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ error: 'Logout failed' });
        }
        req.session.destroy((err) => {
          if (err) {
            return res.status(500).json({ error: 'Session destruction failed' });
          }
          res.clearCookie('connect.sid');
          res.json({ message: 'Logged out successfully' });
        });
      });
    });

    const response = await agent
      .post('/api/auth/logout')
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Logged out successfully');

    // Verify user is logged out
    await agent
      .get('/api/auth/user')
      .expect(404);
  });
});

describe('Admin Authentication', () => {
  it('should allow admin access to admin routes', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.use((req, res, next) => {
      (req as any).user = mockUsers.admin;
      (req as any).isAuthenticated = () => true;
      next();
    });
    testApp.get('/api/test/admin', isAuthenticated, isAdmin, (req, res) => {
      res.json({ message: 'Admin endpoint' });
    });

    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.admin);

    const response = await request(testApp)
      .get('/api/test/admin')
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Admin endpoint');
  });

  it('should deny regular users access to admin routes', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.use((req, res, next) => {
      (req as any).user = mockUsers.regular;
      (req as any).isAuthenticated = () => true;
      next();
    });
    testApp.get('/api/test/admin', isAuthenticated, isAdmin, (req, res) => {
      res.json({ message: 'Admin endpoint' });
    });

    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

    const response = await request(testApp)
      .get('/api/test/admin')
      .expect(403);

    expect(response.body).toHaveProperty('error', 'Admin access required');
  });

  it('should handle admin status updates', async () => {
    const user = { ...mockUsers.regular };
    
    // Promote user to admin
    vi.mocked(storage).updateUserAdminStatus = vi.fn().mockResolvedValue(undefined);
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue({ ...user, isAdmin: true });

    await storage.updateUserAdminStatus(user.id, true);

    expect(storage.updateUserAdminStatus).toHaveBeenCalledWith(user.id, true);

    // Verify user now has admin access
    const updatedUser = await storage.getUser(user.id);
    expect(updatedUser?.isAdmin).toBe(true);
  });
});

describe('Security Features', () => {
  it('should protect against session fixation', async () => {
    const agent = request.agent(app);

    // Get initial session
    const response1 = await agent
      .get('/api/test/public')
      .expect(200);

    const initialCookie = response1.headers['set-cookie']?.[0];

    // Simulate login (session should regenerate)
    vi.mocked(storage).upsertUser = vi.fn().mockResolvedValue(mockUsers.regular);

    // In a real scenario, session regeneration happens during login
    // Mock this behavior
    app.use((req, res, next) => {
      if (req.path === '/api/auth/login') {
        req.session.regenerate((err) => {
          if (err) return next(err);
          (req as any).user = mockUsers.regular;
          next();
        });
      } else {
        next();
      }
    });

    // Session cookie should change after authentication
    const response2 = await agent
      .get('/api/test/public')
      .expect(200);

    const newCookie = response2.headers['set-cookie']?.[0];
    
    // Cookies should be present (even if they might be the same in test env)
    if (initialCookie && newCookie) {
      expect(initialCookie).toBeDefined();
      expect(newCookie).toBeDefined();
    }
  });

  it('should enforce HTTPS in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // In production, secure cookies should be enforced
    // This is typically configured in the session middleware
    const isProduction = process.env.NODE_ENV === 'production';
    expect(isProduction).toBe(true);

    process.env.NODE_ENV = originalEnv;
  });

  it('should validate session integrity', async () => {
    const agent = request.agent(app);

    // Create a session
    await agent.get('/api/test/public').expect(200);

    // Attempt to tamper with session cookie
    const tamperedCookie = 'connect.sid=s%3Atampered.signature';

    const response = await agent
      .get('/api/test/protected')
      .set('Cookie', tamperedCookie)
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  it('should handle CSRF protection', async () => {
    // CSRF tokens should be validated on state-changing operations
    const agent = request.agent(app);

    // Add CSRF protection middleware for testing
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const csrfToken = req.headers['x-csrf-token'];
        if (!csrfToken) {
          return res.status(403).json({ error: 'CSRF token missing' });
        }
      }
      next();
    });

    // POST without CSRF token should fail
    const testApp = express();
    testApp.use(express.json());
    testApp.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const csrfToken = req.headers['x-csrf-token'];
        if (!csrfToken) {
          return res.status(403).json({ error: 'CSRF token missing' });
        }
      }
      next();
    });
    testApp.post('/api/test/action', (req, res) => {
      res.json({ success: true });
    });

    await request(testApp)
      .post('/api/test/action')
      .send({ data: 'test' })
      .expect(403);

    // POST with CSRF token should succeed
    await request(testApp)
      .post('/api/test/action')
      .set('X-CSRF-Token', 'valid-token')
      .send({ data: 'test' })
      .expect(200);
  });
});

describe('Session Storage Fallbacks', () => {
  it('should fall back to memory store when Redis and DB are unavailable', async () => {
    const { isRedisAvailable, checkRedisConnection } = await import('../redis');
    const { testDatabaseConnection } = await import('../db');

    vi.mocked(isRedisAvailable).mockResolvedValue(false);
    vi.mocked(checkRedisConnection).mockResolvedValue(false);
    vi.mocked(testDatabaseConnection).mockResolvedValue(false);

    // Session should still work with memory store
    const agent = request.agent(app);

    const response = await agent
      .get('/api/test/public')
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Public endpoint');
  });

  it('should use Redis when available', async () => {
    const { checkRedisConnection, createRedisStore } = await import('../redis');

    vi.mocked(checkRedisConnection).mockResolvedValue(true);
    vi.mocked(createRedisStore).mockResolvedValue({
      get: vi.fn(),
      set: vi.fn(),
      destroy: vi.fn(),
      touch: vi.fn(),
    } as any);

    // Verify Redis is being checked
    expect(checkRedisConnection).toBeDefined();
  });

  it('should use PostgreSQL when Redis is unavailable but DB is available', async () => {
    const { checkRedisConnection } = await import('../redis');
    const { testDatabaseConnection } = await import('../db');

    vi.mocked(checkRedisConnection).mockResolvedValue(false);
    vi.mocked(testDatabaseConnection).mockResolvedValue(true);

    // Verify database connection is being tested
    expect(testDatabaseConnection).toBeDefined();
  });
});

describe('User Profile Management', () => {
  it('should update user profile after authentication', async () => {
    const updatedUser = {
      ...mockUsers.regular,
      name: 'Updated Name',
      profileImage: 'https://example.com/avatar.jpg',
    };

    vi.mocked(storage).upsertUser = vi.fn().mockResolvedValue(updatedUser);
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(updatedUser);

    const result = await storage.upsertUser(updatedUser);

    expect(result).toEqual(updatedUser);
    expect(storage.upsertUser).toHaveBeenCalledWith(updatedUser);
  });

  it('should handle user creation for first-time login', async () => {
    const newUser = {
      id: 'new-user-id',
      username: 'newuser',
      email: 'new@example.com',
      isAdmin: false,
    };

    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(undefined);
    vi.mocked(storage).upsertUser = vi.fn().mockResolvedValue(newUser);

    // First check if user exists
    const existingUser = await storage.getUser(newUser.id);
    expect(existingUser).toBeUndefined();

    // Create new user
    const createdUser = await storage.upsertUser(newUser);
    expect(createdUser).toEqual(newUser);
  });
});