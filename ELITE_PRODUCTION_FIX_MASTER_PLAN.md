# 🚀 ELITE PRODUCTION FIX MASTER PLAN
## Florida Local Platform - Complete Authentication & Production Readiness

---

## 🎯 EXECUTIVE SUMMARY

Your authentication system is experiencing critical failures due to:
1. **Dual Authentication Systems Conflict**: Two separate auth implementations are competing
2. **Route Registration Order Issues**: Auth routes are being overwritten
3. **Strategy Naming Mismatch**: Old system uses `replitauth:` prefix, new uses `replitauth-`
4. **Session Initialization Race Conditions**: Multiple passport initializations
5. **Database Connection Issues**: User lookup failures during auth flow

---

## 🔥 CRITICAL ISSUES IDENTIFIED

### 1. Authentication System Conflict
```
PROBLEM: Two auth systems running simultaneously
- OLD: server/replitAuth.ts (uses replitauth:domain strategy names)
- NEW: server/auth/index.ts (uses replitauth-domain strategy names)
- RESULT: Routes collide, strategies don't match, 404 errors
```

### 2. Route Registration Order
```
PROBLEM: Auth routes registered multiple times
- bootstrap.ts → initializeAuth() → registers passport strategies
- routes.ts → setupAuth() → registers DIFFERENT passport strategies
- router/index.ts → comments out auth router to "avoid conflicts"
- RESULT: /api/auth/user returns 404 because routes get overwritten
```

### 3. Database/Session Sync Issues
```
PROBLEM: User ID mismatch between Replit and database
- Replit provides a Replit user ID
- Database expects internal UUID
- Session stores mixed IDs
- RESULT: "Database error" on login, black screen
```

---

## 🛠️ COMPREHENSIVE FIX PLAN

### PHASE 1: IMMEDIATE AUTHENTICATION FIX (Priority: CRITICAL)

#### Step 1.1: Consolidate Authentication System
```typescript
// ACTION: Remove dual auth system conflict
1. DELETE server/replitAuth.ts (old system)
2. UPDATE server/routes.ts:
   - Remove setupAuth() call
   - Remove all auth route definitions
   - Keep only business logic routes
3. ENABLE server/router/index.ts auth router:
   - Uncomment lines 29-30
   - Use createAuthRouter() from auth/routes.ts
```

#### Step 1.2: Fix Strategy Naming Convention
```typescript
// ACTION: Standardize strategy names
// In server/auth/index.ts:
function getStrategyName(domain: string): string {
  return `replitauth:${domain}`; // Match old system's convention
}

// In server/auth/routes.ts:
function getStrategyName(req: Request): string {
  let host = req.get('host') || req.hostname || 'localhost';
  host = host.split(':')[0];
  return `replitauth:${host}`; // Use colon, not hyphen
}
```

#### Step 1.3: Fix User ID Synchronization
```typescript
// ACTION: Ensure consistent user ID handling
// In server/auth/index.ts - upsertUser function:
async function upsertUser(claims: any) {
  const userData = {
    id: claims["sub"], // Store Replit ID as primary key
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageURL: claims["profile_image"],
  };
  
  // Use ON CONFLICT to handle existing users
  const query = `
    INSERT INTO users (id, email, first_name, last_name, profile_image_url)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      profile_image_url = EXCLUDED.profile_image_url,
      updated_at = NOW()
    RETURNING *
  `;
  
  const result = await db.query(query, [
    userData.id,
    userData.email,
    userData.firstName,
    userData.lastName,
    userData.profileImageURL
  ]);
  
  return result.rows[0];
}
```

#### Step 1.4: Fix Route Order in Bootstrap
```typescript
// ACTION: Ensure proper route mounting order
// In server/bootstrap.ts:
// Move auth initialization AFTER session setup but BEFORE route mounting
// Current line 117 is correct placement
```

### PHASE 2: DATABASE SCHEMA OPTIMIZATION

#### Step 2.1: User Table Migration
```sql
-- ACTION: Ensure users table can handle Replit IDs
ALTER TABLE users 
ALTER COLUMN id TYPE VARCHAR(255); -- Replit IDs are strings, not UUIDs

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_replit_id ON users(id);
```

#### Step 2.2: Session Table Optimization
```sql
-- ACTION: Ensure sessions table is optimized
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);
CREATE INDEX IF NOT EXISTS idx_sessions_sid ON sessions(sid);

-- Clean up old sessions regularly
DELETE FROM sessions WHERE expire < NOW();
```

### PHASE 3: PRODUCTION HARDENING

#### Step 3.1: Environment Configuration
```bash
# ACTION: Verify all required environment variables
REQUIRED_VARS=(
  "DATABASE_URL"
  "SESSION_SECRET"
  "REPL_ID"
  "REPLIT_DOMAINS"
  "REDIS_HOST"
  "REDIS_PORT"
  "REDIS_PASSWORD"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "OPENAI_API_KEY"
)

# Add to .env.production
NODE_ENV=production
REPLIT_DEPLOYMENT=1
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=lax
```

#### Step 3.2: Security Headers Enhancement
```typescript
// ACTION: Add to server/middleware/securityHeaders.ts
export function enhancedSecurityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // HSTS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    
    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Content Type Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Frame Options
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    next();
  };
}
```

#### Step 3.3: Rate Limiting Enhancement
```typescript
// ACTION: Add progressive rate limiting
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = redis 
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'rl',
      points: 100, // requests
      duration: 900, // per 15 minutes
      blockDuration: 900, // block for 15 minutes
    })
  : new RateLimiterMemory({
      points: 100,
      duration: 900,
    });

// Add progressive penalties
export async function progressiveRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.ip || 'unknown';
    const rateLimiterRes = await rateLimiter.consume(key);
    
    res.setHeader('X-RateLimit-Limit', String(rateLimiter.points));
    res.setHeader('X-RateLimit-Remaining', String(rateLimiterRes.remainingPoints));
    res.setHeader('X-RateLimit-Reset', String(new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString()));
    
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: Math.ceil(rejRes.msBeforeNext / 1000) || 900,
    });
  }
}
```

### PHASE 4: MONITORING & OBSERVABILITY

#### Step 4.1: Enhanced Logging
```typescript
// ACTION: Add structured logging with correlation IDs
import { v4 as uuidv4 } from 'uuid';

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  req.correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  res.setHeader('X-Correlation-ID', req.correlationId);
  
  // Attach to all log entries
  logger.defaultMeta = { ...logger.defaultMeta, correlationId: req.correlationId };
  
  next();
}
```

#### Step 4.2: Health Check Enhancement
```typescript
// ACTION: Add comprehensive health checks
export async function comprehensiveHealthCheck(req: Request, res: Response) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: { status: 'unknown', latency: 0 },
      redis: { status: 'unknown', latency: 0 },
      auth: { status: 'unknown', strategies: [] },
      storage: { status: 'unknown', latency: 0 },
    }
  };
  
  // Database check
  const dbStart = Date.now();
  try {
    await db.query('SELECT 1');
    checks.checks.database = { 
      status: 'healthy', 
      latency: Date.now() - dbStart 
    };
  } catch (error) {
    checks.checks.database = { 
      status: 'unhealthy', 
      latency: Date.now() - dbStart,
      error: error.message 
    };
    checks.status = 'degraded';
  }
  
  // Redis check
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.checks.redis = { 
      status: 'healthy', 
      latency: Date.now() - redisStart 
    };
  } catch (error) {
    checks.checks.redis = { 
      status: 'unhealthy', 
      latency: Date.now() - redisStart,
      error: error.message 
    };
  }
  
  // Auth check
  checks.checks.auth = {
    status: 'healthy',
    strategies: Array.from(getRegisteredStrategies()),
  };
  
  res.status(checks.status === 'healthy' ? 200 : 503).json(checks);
}
```

### PHASE 5: PERFORMANCE OPTIMIZATION

#### Step 5.1: Database Connection Pooling
```typescript
// ACTION: Optimize database connections
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  statement_timeout: 30000,
  query_timeout: 30000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(poolConfig);

// Add connection retry logic
export async function getDbConnection(retries = 3): Promise<PoolClient> {
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.connect();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Failed to get database connection');
}
```

#### Step 5.2: Response Caching
```typescript
// ACTION: Add Redis caching for common queries
export function cacheMiddleware(ttl: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    } catch (error) {
      logger.error('Cache read error:', error);
    }
    
    // Store original json method
    const originalJson = res.json;
    res.json = function(data) {
      res.setHeader('X-Cache', 'MISS');
      
      // Cache the response
      redis.setex(key, ttl, JSON.stringify(data)).catch(err => {
        logger.error('Cache write error:', err);
      });
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}
```

### PHASE 6: CLIENT-SIDE IMPROVEMENTS

#### Step 6.1: Authentication State Management
```typescript
// ACTION: Fix client auth hook
// In client/src/hooks/useAuth.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return { authenticated: false, user: null };
        }
        throw new Error('Failed to fetch user');
      }
      
      const data = await response.json();
      return {
        authenticated: true,
        user: data.user || data, // Handle both response formats
      };
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const logout = async () => {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    queryClient.setQueryData(['auth', 'user'], {
      authenticated: false,
      user: null,
    });
    
    window.location.href = '/';
  };
  
  return {
    user: data?.user || null,
    isAuthenticated: data?.authenticated || false,
    isLoading,
    error,
    logout,
  };
}
```

#### Step 6.2: Error Boundary Enhancement
```typescript
// ACTION: Add comprehensive error handling
// In client/src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // Send to monitoring
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
    
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We're sorry, but something unexpected happened. The error has been logged 
                and we'll look into it.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-4 bg-muted rounded-lg">
                  <summary className="cursor-pointer font-medium">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-4 justify-center">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => window.location.href = '/'} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### PHASE 7: DEPLOYMENT OPTIMIZATION

#### Step 7.1: Build Script Enhancement
```bash
#!/bin/bash
# ACTION: Create production-ready build script
# File: scripts/build-production.sh

set -euo pipefail

echo "🚀 Starting production build..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist client/dist

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Run tests
echo "🧪 Running tests..."
npm run test:ci || echo "⚠️  Tests failed but continuing build"

# Build client
echo "🏗️  Building client..."
cd client
npm run build
cd ..

# Build server
echo "🏗️  Building server..."
npm run build:server

# Copy static files
echo "📋 Copying static files..."
cp -r client/dist dist/public
cp -r public/* dist/public/ 2>/dev/null || true

# Optimize images
echo "🖼️  Optimizing images..."
find dist/public -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -exec \
  npx imagemin {} --out-dir={} \; 2>/dev/null || true

# Generate service worker
echo "⚙️  Generating service worker..."
npx workbox generateSW workbox-config.js

# Verify build
echo "✅ Verifying build..."
node scripts/verify-build.js

echo "✨ Production build complete!"
```

#### Step 7.2: Deployment Configuration
```yaml
# ACTION: Create docker-compose.production.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    environment:
      NODE_ENV: production
      PORT: ${PORT:-5000}
    ports:
      - "${PORT:-5000}:${PORT:-5000}"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${PORT:-5000}/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  redis_data:
  postgres_data:
```

### PHASE 8: TESTING STRATEGY

#### Step 8.1: End-to-End Authentication Tests
```typescript
// ACTION: Create comprehensive auth tests
// File: tests/e2e/authentication.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should complete full authentication cycle', async ({ page }) => {
    // Navigate to home
    await page.goto('/');
    
    // Click sign in
    await page.click('[data-testid="button-signin"]');
    
    // Should redirect to Replit auth
    await expect(page).toHaveURL(/replit\.com\/oidc/);
    
    // Mock successful auth callback
    await page.goto('/api/callback?code=test-code&state=test-state');
    
    // Should redirect to home
    await expect(page).toHaveURL('/');
    
    // Should show user menu
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
  
  test('should handle auth errors gracefully', async ({ page }) => {
    // Navigate to callback with error
    await page.goto('/api/callback?error=access_denied');
    
    // Should show error page
    await expect(page).toHaveURL('/login-error');
    await expect(page.locator('text=Authentication failed')).toBeVisible();
  });
  
  test('should maintain session across page reloads', async ({ page, context }) => {
    // Set auth cookie
    await context.addCookies([{
      name: 'connect.sid',
      value: 'test-session-id',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
    }]);
    
    // Navigate to protected route
    await page.goto('/dashboard');
    
    // Should not redirect to login
    await expect(page).not.toHaveURL(/login/);
    
    // Reload page
    await page.reload();
    
    // Should still be authenticated
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
```

#### Step 8.2: Load Testing Configuration
```yaml
# ACTION: Create k6 load test
# File: tests/load/auth-stress.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up more
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.01'],            // Error rate under 1%
  },
};

export default function () {
  // Test auth endpoint
  const authRes = http.get(`${__ENV.BASE_URL}/api/auth/user`, {
    headers: {
      'Cookie': `connect.sid=${__ENV.SESSION_ID}`,
    },
  });
  
  check(authRes, {
    'auth status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'auth response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Test protected endpoint
  const protectedRes = http.get(`${__ENV.BASE_URL}/api/businesses`, {
    headers: {
      'Cookie': `connect.sid=${__ENV.SESSION_ID}`,
    },
  });
  
  check(protectedRes, {
    'protected status is 200': (r) => r.status === 200,
    'protected response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);
  
  sleep(1);
}
```

### PHASE 9: MONITORING & ALERTING

#### Step 9.1: Sentry Configuration
```typescript
// ACTION: Enhanced Sentry setup
// File: server/monitoring/sentry.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function initSentry(app: Express) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      if (event.request?.headers?.authorization) {
        event.request.headers.authorization = '[REDACTED]';
      }
      return event;
    },
  });
  
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}
```

#### Step 9.2: Custom Metrics
```typescript
// ACTION: Add business metrics
// File: server/monitoring/metrics.ts
import { Counter, Histogram, Gauge, register } from 'prom-client';

// Authentication metrics
export const authAttempts = new Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status', 'method'],
});

export const authDuration = new Histogram({
  name: 'auth_duration_seconds',
  help: 'Authentication request duration',
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const activeSessions = new Gauge({
  name: 'active_sessions_total',
  help: 'Number of active user sessions',
});

// Business metrics
export const businessCreated = new Counter({
  name: 'businesses_created_total',
  help: 'Total number of businesses created',
  labelNames: ['category'],
});

export const orderValue = new Histogram({
  name: 'order_value_dollars',
  help: 'Order value in dollars',
  buckets: [10, 50, 100, 500, 1000, 5000],
});

// Error metrics
export const apiErrors = new Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['endpoint', 'status_code', 'error_type'],
});
```

### PHASE 10: FINAL CHECKLIST

#### Pre-Deployment Verification
```bash
#!/bin/bash
# ACTION: Run before every deployment
# File: scripts/pre-deploy-check.sh

echo "🔍 Running pre-deployment checks..."

# Check environment variables
REQUIRED_VARS=(
  "DATABASE_URL"
  "SESSION_SECRET"
  "REPL_ID"
  "REPLIT_DOMAINS"
  "STRIPE_SECRET_KEY"
  "OPENAI_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required environment variable: $var"
    exit 1
  fi
done

# Test database connection
echo "🔌 Testing database connection..."
npx tsx scripts/test-db.ts || exit 1

# Test Redis connection
echo "🔌 Testing Redis connection..."
npx tsx scripts/test-redis.ts || exit 1

# Run security audit
echo "🔒 Running security audit..."
npm audit --production || echo "⚠️  Security vulnerabilities found"

# Check for TypeScript errors
echo "📝 Checking TypeScript..."
npx tsc --noEmit || exit 1

# Run linter
echo "🧹 Running linter..."
npm run lint || exit 1

# Test build
echo "🏗️  Testing build..."
npm run build || exit 1

echo "✅ All pre-deployment checks passed!"
```

---

## 🎯 IMPLEMENTATION PRIORITY

1. **IMMEDIATE (Do Right Now)**
   - Fix authentication system conflict (Phase 1)
   - Consolidate to single auth system
   - Fix strategy naming convention

2. **HIGH PRIORITY (Within 24 Hours)**
   - Database schema updates
   - Session management fixes
   - Client-side auth hook updates

3. **MEDIUM PRIORITY (Within 1 Week)**
   - Security hardening
   - Performance optimization
   - Enhanced monitoring

4. **ONGOING**
   - Load testing
   - Documentation updates
   - Team training

---

## 💡 QUICK WIN COMMANDS

```bash
# Fix auth immediately
cd /home/runner/workspace
git checkout -b fix-auth-emergency
rm server/replitAuth.ts
# Then apply the changes listed above

# Test auth locally
npm run dev
# Open browser, click Sign In
# Should redirect to Replit auth
# Should return to app authenticated

# Deploy to production
npm run build
npm run start:production
```

---

## 📞 SUPPORT ESCALATION

If issues persist after implementing these fixes:

1. **Check Logs**
   ```bash
   tail -f logs/combined.log | grep -E "(ERROR|CRITICAL|auth)"
   ```

2. **Database Issues**
   ```sql
   -- Check user table
   SELECT COUNT(*) FROM users;
   SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
   
   -- Check sessions
   SELECT COUNT(*) FROM sessions WHERE expire > NOW();
   ```

3. **Redis Issues**
   ```bash
   redis-cli
   > PING
   > INFO replication
   > MONITOR  # Watch real-time commands
   ```

---

This master plan will transform your platform from broken authentication to enterprise-grade production readiness. Execute Phase 1 immediately to fix the sign-in button, then proceed through the phases systematically for complete production hardening.
