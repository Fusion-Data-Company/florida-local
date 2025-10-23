# The Florida Local - Production Deployment Guide

## Overview

This guide documents the production deployment infrastructure for The Florida Local, a Fortune 500-grade business community platform. The system is designed for enterprise-level reliability with comprehensive error handling, monitoring, and dynamic authentication.

## Build System

### Production Build Script

Location: `scripts/build-production.sh`

The build script handles:
1. Clean removal of old build artifacts
2. Vite build for React frontend (→ `client/dist/`)
3. esbuild for Express backend (→ `dist/index.js`)
4. Copying client files to `dist/public/`
5. Copying additional assets (backgrounds, attached_assets)
6. Build verification

**Command:**
```bash
npm run build
```

**Output Structure:**
```
dist/
├── index.js              # Bundled Express server
├── stats.html            # Build statistics
└── public/              # Frontend + static assets
    ├── index.html
    ├── assets/
    ├── backgrounds/
    └── attached_assets/
```

### Deployment Configuration

**File:** `.replit`

```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
```

**Start Command:**
```bash
NODE_ENV=production node dist/index.js
```

## Authentication System

### Dynamic Strategy Registration

The authentication system automatically detects and registers OAuth strategies for **any deployment URL**:

**Registered Strategies:**
1. Primary Replit development domain (`.replit.dev`)
2. Production domain (`.replit.app`) - automatically derived
3. Localhost (`localhost:5000`)
4. Localhost IP (`127.0.0.1:5000`)

**Environment Variables Required:**
- `REPLIT_DOMAINS` - Auto-populated by Replit
- `REPL_ID` - Auto-populated by Replit
- `SESSION_SECRET` - Auto-populated by Replit

### URL-Agnostic Design

**Key Feature:** No hardcoded domains anywhere in the codebase.

The system:
- Detects hostname from request headers (`x-forwarded-host`, `host`)
- Matches against registered strategies
- Falls back intelligently (prefers `.replit.app` over `.replit.dev`)
- Provides detailed error messages if strategy not found

### Session Management

**Storage Hierarchy:**
1. Redis (preferred) - fast, scalable
2. PostgreSQL (fallback) - reliable, persistent
3. Memory Store (emergency fallback) - development only

**Session Configuration:**
- TTL: 7 days
- Rolling refresh: enabled
- httpOnly cookies: yes
- sameSite: 'lax'
- secure: true (production)

## Production Server Features

### Startup Sequence

1. **Environment Validation**
   - Checks NODE_ENV
   - Verifies REPLIT_DOMAINS
   - Validates build files exist

2. **Metrics Setup**
   - Prometheus metrics endpoint (`/metrics`)
   - Request counters, response times
   - Graceful Redis failure handling

3. **Authentication Initialization**
   - Session store setup (with fallback chain)
   - OIDC configuration loading (with timeout)
   - Strategy registration (all domains)
   - Passport initialization

4. **Route Registration**
   - API routes (auth, business, social, etc.)
   - Static file serving
   - Catch-all for SPA routing

5. **Server Start**
   - Listens on port 5000
   - Logs all deployment URLs
   - Health check endpoints active

### Monitoring Endpoints

#### Health Check
**Endpoint:** `/api/auth/health`

```json
{
  "status": "ok",
  "timestamp": "2025-10-17T23:18:18.138Z",
  "sessionStore": "postgresql",
  "database": "connected",
  "redis": "disconnected"
}
```

#### Deployment Status
**Endpoint:** `/api/deployment-status`

```json
{
  "status": "ok",
  "timestamp": "2025-10-17T23:18:18.209Z",
  "environment": {
    "nodeEnv": "production",
    "port": "5000",
    "replitDomains": "..."
  },
  "authentication": {
    "registeredStrategies": [
      "replitauth:...",
      ...
    ]
  },
  "routes": {
    "authLogin": "/api/login",
    "authCallback": "/api/callback",
    ...
  },
  "build": {
    "distIndexJs": true,
    "distPublicExists": true,
    "distPublicIndexHtml": true
  },
  "uptime": 15.185
}
```

#### Session Info
**Endpoint:** `/api/auth/session-info`

Shows session expiry and user authentication status.

### Error Handling

**OIDC Configuration Timeout:**
- 10-second timeout on OIDC discovery
- Detailed error logging
- Prevents server hang

**Session Initialization Timeout:**
- 10-second timeout
- Falls back through storage hierarchy
- Never blocks startup

**Database Upsert Retry:**
- 3 attempts with 1-second delay
- Handles transient failures
- Detailed logging

**Strategy Not Found:**
- Attempts intelligent fallback
- Returns JSON error with available strategies
- HTTP 500 with actionable information

### Logging

**Winston Logger Configuration:**
- Production: JSON format
- Development: Colorized, human-readable
- Levels: error, warn, info
- Metadata: timestamp, service name, environment

**Key Log Events:**
- Server startup progress
- Authentication strategy registration
- Route registration
- Session store selection
- Database connections
- Error conditions

## Testing

### Local Production Testing

**Script:** `scripts/test-deployment.sh`

```bash
bash scripts/test-deployment.sh
```

**Tests:**
1. Server startup (no crashes)
2. Health check endpoint
3. Deployment status endpoint
4. Login endpoint (HTTP 302)
5. Frontend serving (index.html)

**All tests must pass before deploying.**

### Manual Verification Checklist

Before publishing:
- [ ] `npm run build` completes successfully
- [ ] `dist/index.js` exists
- [ ] `dist/public/index.html` exists
- [ ] `bash scripts/test-deployment.sh` passes all tests
- [ ] No CRITICAL errors in logs
- [ ] Authentication strategies registered (check `/api/deployment-status`)

## Deployment Process

### Step 1: Build

```bash
npm run build
```

Expected output:
```
✅ Production build complete!
Files created:
  - dist/index.js (server)
  - dist/public/index.html ✓
  - dist/public/ (client + static assets)
```

### Step 2: Test Locally

```bash
bash scripts/test-deployment.sh
```

Expected output:
```
✅ /api/auth/health responded
✅ /api/deployment-status responded
✅ /api/login responding
✅ Frontend index.html served correctly
✅ Production build deployment test complete
```

### Step 3: Deploy

1. Click **"Publish"** button in Replit
2. Wait for build to complete
3. Access deployment URL (e.g., `your-repl.replit.app`)

### Step 4: Verify Production

**Check Health:**
```bash
curl https://your-repl.replit.app/api/auth/health
```

**Check Deployment Status:**
```bash
curl https://your-repl.replit.app/api/deployment-status
```

**Verify Authentication:**
- Click "Sign In" button
- Should redirect to Replit OAuth
- After auth, should redirect back to `/` (Discover page)

## Troubleshooting

### Issue: Server Won't Start

**Check:**
1. Build files exist (`dist/index.js`, `dist/public/index.html`)
2. Environment variables set (`REPLIT_DOMAINS`, `REPL_ID`)
3. Database accessible (`DATABASE_URL`)

**Logs:**
```bash
tail -100 /var/log/replit/production.log
```

### Issue: 404 on /api/login

**Cause:** Route not registered or catch-all intercepting

**Fix:**
- Check `/api/deployment-status` shows routes registered
- Verify `server/vite.ts` excludes `/api/*` and `/auth/*`

**Current Fix Applied:**
```typescript
// Skip API routes in SPA catch-all
if (req.path.startsWith('/api/') || 
    req.path.startsWith('/auth/') || 
    req.path === '/metrics') {
  return next();
}
```

### Issue: Authentication Strategy Not Found

**Symptoms:**
```json
{
  "error": "Authentication configuration error",
  "message": "No authentication strategy found for hostname: ..."
}
```

**Fix:**
1. Check `/api/deployment-status` for registered strategies
2. Verify REPLIT_DOMAINS environment variable
3. Strategy should auto-register for your domain

**Fallback Behavior:**
- System prefers `.replit.app` domains
- Falls back to any available Replit domain
- Provides detailed error if none match

### Issue: Session Not Persisting

**Check:**
1. Session store status: `/api/auth/health`
2. PostgreSQL connection
3. Cookie settings (httpOnly, secure, sameSite)

**Storage Hierarchy:**
- Redis → PostgreSQL → Memory

### Issue: Blank Page After Login

**Check:**
1. Frontend bundle loaded correctly
2. Browser console for errors
3. Network tab for failed asset requests

**Common Causes:**
- Assets not copied to `dist/public/`
- CSP blocking resources
- Incorrect base URL in frontend

## Performance & Scaling

### Build Optimization

- Vite code splitting
- Gzip/Brotli compression enabled
- Service worker for caching (PWA)

### Runtime Optimization

- Connection pooling (PostgreSQL)
- Session store caching
- Static asset compression
- Health check caching (1 minute TTL)

### Autoscale Configuration

**Replit Autoscale:**
- Scales based on request volume
- Zero downtime deployments
- Automatic SSL/TLS

## Security

### Authentication

- OAuth 2.0 with Replit
- httpOnly session cookies
- CSRF protection
- Secure cookie flags in production

### API Security

- CORS configured for deployment domains
- Rate limiting on sensitive endpoints
- Input validation (Zod schemas)
- Helmet.js security headers

### Secrets Management

- No secrets in code
- Environment variables only
- Replit Secrets integration
- Database credentials auto-managed

## Monitoring

### Metrics

**Endpoint:** `/metrics` (Prometheus format)

**Metrics Collected:**
- HTTP request count
- Response time histogram
- Active connections
- Database query time
- Session store operations

### Error Tracking

**Sentry Integration:**
- Automatic error capture
- Source maps for debugging
- User context tracking
- Performance monitoring

**PostHog Analytics:**
- User behavior tracking
- Feature usage
- Conversion funnels

### Logging

**Winston Transport:**
- Console (development)
- File rotation (production)
- JSON format for parsing

## Maintenance

### Database Migrations

**DO NOT manually write SQL migrations.**

Use Drizzle push:
```bash
npm run db:push
```

Force push (data loss warning):
```bash
npm run db:push -- --force
```

### Backups

Handled automatically by Neon PostgreSQL (Replit database).

### Updates

1. Make code changes
2. Test locally with `npm run dev`
3. Build: `npm run build`
4. Test: `bash scripts/test-deployment.sh`
5. Deploy: Click "Publish"

## Support

### Debug Mode

Set environment variable:
```bash
LOG_LEVEL=debug
```

### Health Checks

- `/api/auth/health` - Authentication system
- `/api/health` - General application
- `/metrics` - Prometheus metrics
- `/api/deployment-status` - Full system status

### Contact

For deployment issues:
1. Check deployment logs
2. Verify environment variables
3. Test endpoints with curl
4. Review this guide

---

**Last Updated:** October 17, 2025
**Version:** 2.0 (Complete Infrastructure Rebuild)
**Status:** ✅ Production Ready - Fortune 500 Grade
