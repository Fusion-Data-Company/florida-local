# ⚡ QUICK FIX PRIORITY LIST
## Top 20 Actions to Reach Elite Status

**For:** Builder Agent  
**Goal:** Execute these in order for maximum impact  
**Timeline:** 12 weeks to elite status

---

## 🔴 WEEK 1-2: CRITICAL BLOCKERS

### 1. Replace MagicDataTable with TanStack Table
**File:** `client/src/components/magic/MagicDataTable.tsx`  
**Action:** Rewrite using `@tanstack/react-table` v8
```bash
# Lines of code: 450 → 150
# Features gained: Column resizing, visibility, pinning, virtualization
```

**Implementation:**
```typescript
// NEW FILE: client/src/components/elite/EliteDataTable.tsx
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
// See MCP_KNOWLEDGE_BASE_FOR_BUILDER.md Section 4.2 for complete pattern
```

---

### 2. Fix TanStack Query Configuration
**File:** `client/src/lib/queryClient.ts`  
**Current:** Broken (staleTime: Infinity, retry: false)  
**Fix:**
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,           // 5 minutes (not Infinity)
      gcTime: 1000 * 60 * 30,             // 30 minutes
      retry: 3,                           // Enable retry
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 2,
    },
  },
});

// Add devtools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// In App.tsx: <ReactQueryDevtools initialIsOpen={false} />
```

---

### 3. Add Optimistic Updates (5 Critical Mutations)
**Files to Update:**
1. Cart actions: `client/src/pages/cart.tsx`
2. Follow business: `client/src/components/business-card.tsx`
3. Like post: `client/src/components/social-feed.tsx`
4. Vote spotlight: `client/src/pages/spotlight-voting.tsx`
5. Add to favorites: `client/src/pages/marketplace.tsx`

**Pattern (apply to all 5):**
```typescript
const mutation = useMutation({
  mutationFn: (data) => apiRequest('POST', '/api/endpoint', data),
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['key'] });
    const previous = queryClient.getQueryData(['key']);
    queryClient.setQueryData(['key'], newData);
    return { previous };
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(['key'], context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] });
  },
});
```

---

### 4. Set Up Testing Infrastructure
**Commands:**
```bash
# Already installed, just need to use them
npm run test              # Run existing tests (currently 0)
npm run test:watch        # Watch mode
```

**Create these test files:**
```markdown
Priority tests to write (50 total):

Server (30 tests):
- server/__tests__/auth.test.ts (10 tests)
- server/__tests__/storage.test.ts (10 tests)
- server/__tests__/payments.test.ts (5 tests)
- server/__tests__/api-endpoints.test.ts (5 tests)

Client (20 tests):
- client/src/__tests__/cart.test.tsx (5 tests)
- client/src/__tests__/checkout.test.tsx (5 tests)
- client/src/__tests__/business-card.test.tsx (5 tests)
- client/src/__tests__/social-feed.test.tsx (5 tests)
```

**Test Template:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('ComponentName', () => {
  it('should do something', async () => {
    // Arrange
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }}});
    
    // Act
    render(<QueryClientProvider client={queryClient}><Component /></QueryClientProvider>);
    
    // Assert
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

---

### 5. Generate OpenAPI Documentation
**Install:**
```bash
npm install swagger-jsdoc swagger-ui-express @types/swagger-jsdoc @types/swagger-ui-express
```

**Create:** `server/swagger/config.ts`
```typescript
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Florida Local Elite API',
      version: '1.0.0',
    },
    servers: [
      { url: 'https://your-domain.com', description: 'Production' },
      { url: 'http://localhost:5000', description: 'Development' },
    ],
  },
  apis: ['./server/routes.ts', './server/**/*Routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

**Add to:** `server/index.ts`
```typescript
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger/config';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

**Document 10 routes first (examples in routes.ts):**
```typescript
/**
 * @openapi
 * /api/businesses:
 *   get:
 *     summary: List all businesses
 *     tags: [Businesses]
 *     responses:
 *       200:
 *         description: Success
 */
```

---

## 🟠 WEEK 3-4: HIGH PRIORITY FIXES

### 6. Resolve All 23 TODOs
**Command:**
```bash
grep -r "TODO\|FIXME" server/ --line-number
```

**Top 5 Critical TODOs to fix first:**
1. `server/errorHandler.ts` - Implement alert mechanism (Slack webhook)
2. `server/smsService.ts` - Add SMS provider failover
3. `server/failedLoginTracker.ts` - Add cron job for cleanup
4. `server/marketingRoutes.ts` - Complete email campaign scheduler
5. `server/taxService.ts` - Implement TaxJar integration

---

### 7. Uncomment Stripe Integration
**Files:**
- `server/routes.ts` (lines 14-36)
- `server/stripeConnect.ts`

**Action:**
```typescript
// 1. Uncomment Stripe import
import Stripe from "stripe";

// 2. Initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
  apiVersion: "2025-08-27.basil" 
});

// 3. Test webhook
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature']!;
  const event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  
  if (event.type === 'payment_intent.succeeded') {
    await handlePaymentSuccess(event.data.object);
  }
  
  res.json({ received: true });
});
```

---

### 8. Implement Infinite Queries (3 Pages)
**Pages to update:**
1. `client/src/pages/marketplace.tsx` - Product list
2. `client/src/pages/home.tsx` - Business feed
3. `client/src/pages/community.tsx` - Social posts

**Pattern:**
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['businesses', filters],
  queryFn: ({ pageParam = 0 }) => fetch(`/api/businesses?page=${pageParam}`).then(r => r.json()),
  getNextPageParam: (lastPage, allPages) => lastPage.length === 20 ? allPages.length : undefined,
  initialPageParam: 0,
});

const allItems = data?.pages.flatMap(page => page) ?? [];

// Infinite scroll observer
const observerRef = useCallback((node) => {
  if (node) observer.observe(node);
}, [hasNextPage, fetchNextPage]);
```

---

### 9. Add Database Indexes
**Create migration:** `migrations/20251017000000_add_performance_indexes.sql`
```sql
-- Full-text search
CREATE INDEX idx_businesses_fulltext ON businesses 
  USING gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- Composite indexes for common queries
CREATE INDEX idx_businesses_active_category_rating 
  ON businesses (is_active, category, rating DESC) WHERE is_active = true;

CREATE INDEX idx_orders_user_status_created 
  ON orders (user_id, status, created_at DESC);

CREATE INDEX idx_posts_business_created 
  ON posts (business_id, created_at DESC) WHERE is_visible = true;

CREATE INDEX idx_products_business_active 
  ON products (business_id, is_active, category) WHERE is_active = true;
```

**Run:**
```bash
npm run db:migrate
```

---

### 10. Implement Redis Caching
**Create:** `server/lib/cache.ts`
```typescript
import { getRedisClient } from '../redis';

export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const redis = getRedisClient();
  
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.error('Cache read error:', err);
  }
  
  const data = await fetcher();
  
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (err) {
    console.error('Cache write error:', err);
  }
  
  return data;
}

// Usage in routes
app.get('/api/businesses/spotlight', async (req, res) => {
  const spotlights = await cachedQuery(
    'spotlights:current',
    () => storage.getCurrentSpotlights(),
    3600 // 1 hour
  );
  res.json(spotlights);
});
```

**Apply to 5 routes:**
1. `/api/businesses/spotlight` (1 hour cache)
2. `/api/businesses/:id` (10 min cache)
3. `/api/analytics/platform` (30 min cache)
4. `/api/spotlight/trending` (15 min cache)
5. `/api/categories` (24 hour cache)

---

## 🟡 WEEK 5-6: QUALITY IMPROVEMENTS

### 11. Add API Versioning
**Create:** `server/routes/v1/index.ts`
```typescript
import express from 'express';
import { registerBusinessRoutes } from './businesses';
import { registerOrderRoutes } from './orders';
// ... all other routes

export function registerV1Routes(app: Express) {
  const router = express.Router();
  
  registerBusinessRoutes(router);
  registerOrderRoutes(router);
  // ... register all routes
  
  app.use('/api/v1', router);
}
```

**Update:** `server/routes.ts` to use v1 namespace

---

### 12. Implement CSRF Protection
**Update:** `server/routes.ts`
```typescript
import { csrfProtection, getCsrfToken } from './middleware/csrf';

// Add CSRF token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Apply to all state-changing operations
app.post('/api/businesses', csrfProtection, isAuthenticated, ...);
app.put('/api/businesses/:id', csrfProtection, isAuthenticated, ...);
app.delete('/api/businesses/:id', csrfProtection, isAuthenticated, ...);
app.post('/api/orders', csrfProtection, isAuthenticated, ...);
// ... apply to ~30 more routes
```

**Update client:** `client/src/lib/queryClient.ts`
```typescript
let csrfToken: string | null = null;

export async function apiRequest(method: string, url: string, data?: unknown) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && !csrfToken) {
    const res = await fetch('/api/csrf-token');
    const { csrfToken: token } = await res.json();
    csrfToken = token;
  }
  
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });
  
  // ... rest of function
}
```

---

### 13. Set Up CI/CD Pipeline
**Create:** `.github/workflows/ci.yml`
```yaml
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run check
      - run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/test_db
      - run: npm run test
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/test_db
          SESSION_SECRET: test_secret_key_minimum_32_chars
      - run: npm run build
```

---

### 14. Add Request Tracing
**Create:** `server/middleware/requestContext.ts`
```typescript
import { AsyncLocalStorage } from 'async_hooks';
import { nanoid } from 'nanoid';

const requestContext = new AsyncLocalStorage<{ requestId: string; userId?: string }>();

export function requestContextMiddleware(req: any, res: any, next: any) {
  const requestId = req.headers['x-request-id'] || nanoid();
  res.setHeader('X-Request-ID', requestId);
  
  requestContext.run({ requestId, userId: req.user?.id }, () => {
    next();
  });
}

export function getRequestContext() {
  return requestContext.getStore();
}

// Update logger to include context
export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format((info) => {
      const context = getRequestContext();
      if (context) {
        info.requestId = context.requestId;
        info.userId = context.userId;
      }
      return info;
    })(),
    winston.format.json()
  ),
});
```

**Add to:** `server/index.ts`
```typescript
import { requestContextMiddleware } from './middleware/requestContext';

app.use(requestContextMiddleware);
```

---

### 15. Implement Feature Flags
**Create:** `server/lib/featureFlags.ts`
```typescript
import { getRedisClient } from '../redis';

class FeatureFlagService {
  async isEnabled(flagKey: string, context?: { userId?: string }): Promise<boolean> {
    const redis = getRedisClient();
    const flags = await redis.get('feature_flags');
    
    if (!flags) return false;
    
    const flagData = JSON.parse(flags);
    const flag = flagData[flagKey];
    
    if (!flag || !flag.enabled) return false;
    
    // Check user allowlist
    if (context?.userId && flag.enabledForUsers?.includes(context.userId)) {
      return true;
    }
    
    // Percentage rollout
    if (flag.rolloutPercentage === 100) return true;
    if (flag.rolloutPercentage === 0) return false;
    
    // Deterministic hash-based rollout
    if (context?.userId) {
      const hash = this.hashString(context.userId + flagKey);
      return (hash % 100) < flag.rolloutPercentage;
    }
    
    return false;
  }
  
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

export const featureFlags = new FeatureFlagService();
```

**Usage:**
```typescript
app.post('/api/ai/generate', isAuthenticated, async (req: any, res) => {
  const enabled = await featureFlags.isEnabled('ai_content_generation', {
    userId: req.user.id,
  });
  
  if (!enabled) {
    return res.status(403).json({ error: 'Feature not available' });
  }
  
  // ... proceed
});
```

---

## 🟢 WEEK 7-8: ADVANCED FEATURES

### 16. WebSocket Reconnection Logic
**Update:** `client/src/hooks/useWebSocket.ts`
```typescript
class ReliableWebSocket {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  connect(url: string) {
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.startHeartbeat();
    };
    
    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.attemptReconnect();
    };
  }
  
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 10000); // Ping every 10s
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.url);
    }, this.reconnectDelay);
    
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }
}
```

---

### 17. Image Optimization with Cloudinary
**Install:**
```bash
npm install cloudinary
```

**Create:** `server/lib/imageOptimizer.ts`
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadAndOptimize(file: Buffer, folder: string) {
  const result = await cloudinary.uploader.upload_stream(
    {
      folder,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    },
    (error, result) => {
      if (error) throw error;
      return result;
    }
  );
  
  return result.secure_url;
}
```

---

### 18. Custom Metrics Dashboard
**Create:** `server/metrics/custom.ts`
```typescript
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

export const registry = new Registry();

// Business metrics
export const userRegistrations = new Counter({
  name: 'user_registrations_total',
  help: 'Total user registrations',
  labelNames: ['method'],
  registers: [registry],
});

export const ordersPlaced = new Counter({
  name: 'orders_placed_total',
  help: 'Total orders placed',
  labelNames: ['status'],
  registers: [registry],
});

export const revenue = new Counter({
  name: 'revenue_cents_total',
  help: 'Total revenue in cents',
  registers: [registry],
});

// Technical metrics
export const apiRequestDuration = new Histogram({
  name: 'api_request_duration_seconds',
  help: 'API request duration',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [registry],
});

// Usage
userRegistrations.inc({ method: 'email' });
ordersPlaced.inc({ status: 'success' });
revenue.inc(1999); // $19.99 in cents
```

---

### 19. Automated Backups
**Create:** `scripts/backup-database.sh`
```bash
#!/bin/bash
set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backups/db_backup_$TIMESTAMP.sql.gz"

echo "📦 Starting database backup..."

mkdir -p backups

# Dump and compress
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

# Upload to S3 (if configured)
if [ -n "$AWS_S3_BACKUP_BUCKET" ]; then
  aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BACKUP_BUCKET/database/"
  echo "☁️  Uploaded to S3"
fi

# Verify
gunzip -t "$BACKUP_FILE" || exit 1

echo "✅ Backup complete: $BACKUP_FILE"

# Cleanup old backups (keep last 7 days)
find backups/ -name "db_backup_*.sql.gz" -mtime +7 -delete
```

**Add cron job:**
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup-database.sh
```

---

### 20. Load Testing
**Install:**
```bash
npm install -g artillery
```

**Create:** `tests/load/api-load-test.yml`
```yaml
config:
  target: 'https://your-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Ramp up
    - duration: 60
      arrivalRate: 100
      name: Peak load

scenarios:
  - name: Browse businesses
    flow:
      - get:
          url: "/api/businesses"
      - think: 2
      - get:
          url: "/api/businesses/{{ $randomString() }}"
      
  - name: Search and view
    flow:
      - get:
          url: "/api/businesses/search?q=restaurant"
      - think: 3
      - get:
          url: "/api/products?businessId={{ $randomString() }}"
```

**Run:**
```bash
artillery run tests/load/api-load-test.yml
```

---

## 🎯 COMPLETION METRICS

### How to Know You're Done:

```markdown
✅ TanStack Compliance:
- [ ] MagicDataTable replaced with TanStack Table
- [ ] 5+ optimistic mutations implemented
- [ ] 3+ infinite queries implemented
- [ ] Query devtools visible in dev mode

✅ Testing:
- [ ] 50+ unit tests passing
- [ ] 20+ component tests passing
- [ ] CI pipeline running tests automatically
- [ ] Coverage report shows 60%+

✅ Documentation:
- [ ] OpenAPI spec for all endpoints
- [ ] Swagger UI accessible at /api-docs
- [ ] README updated with new features

✅ Performance:
- [ ] Database indexes added (5 indexes)
- [ ] Redis caching on 5 routes
- [ ] Image optimization configured
- [ ] API p95 < 200ms (verify with load test)

✅ Production Ready:
- [ ] All 23 TODOs resolved
- [ ] Stripe integration working
- [ ] CSRF protection enabled
- [ ] CI/CD pipeline deployed
- [ ] Automated backups running
```

---

## 📊 QUICK WINS (Can do TODAY)

```markdown
1. Fix TanStack Query config (10 min)
2. Add Query Devtools (5 min)
3. Install Swagger packages (5 min)
4. Create first 5 unit tests (30 min)
5. Add CSRF to 10 routes (20 min)
6. Implement Redis cache on 2 routes (15 min)
7. Create GitHub Actions CI file (15 min)
8. Add 3 database indexes (10 min)
9. Resolve 5 easy TODOs (30 min)
10. Add optimistic update to cart (20 min)

Total: ~3 hours = Immediate B+ → A- improvement
```

---

**Print this. Pin it. Execute in order. You'll hit elite status in 12 weeks.** 🚀

---

## 📞 SUPPORT COMMANDS

```bash
# Check test coverage
npm run test:coverage

# Run linter
npm run check

# Build for production
npm run build

# Validate environment
npm run validate:env

# Run database migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Start dev server
npm run dev

# Start production server
npm start

# Generate OpenAPI spec
npm run generate:api-docs  # Add this script to package.json
```

**Now GO BUILD, Boss.** 💪

