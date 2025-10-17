# 🔐 Complete Authentication System Guide

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Features](#features)
5. [API Reference](#api-reference)
6. [Security](#security)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Florida Local Elite authentication system is a production-grade, enterprise-level security infrastructure built on:

- **Replit OpenID Connect (OIDC)** for authentication
- **PostgreSQL** for persistent session storage
- **Redis** for caching and performance (optional)
- **Passport.js** for authentication middleware
- **Express Session** for session management

### Key Capabilities

✅ **Secure**: CSRF protection, security headers, audit logging
✅ **Scalable**: Connection pooling, Redis caching, multi-strategy auth
✅ **Observable**: Comprehensive monitoring, health checks, audit trails
✅ **Reliable**: Graceful fallbacks, error handling, automatic recovery
✅ **Compliant**: Complete audit logging for security compliance

---

## Quick Start

### 1. Environment Setup

Create a `.env` file with required variables:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/database?sslmode=require

# Authentication
SESSION_SECRET=your-32-char-or-longer-secret-here
REPL_ID=your-replit-app-id
REPLIT_DOMAINS=your-app.replit.app,your-custom-domain.com
ISSUER_URL=https://replit.com/oidc

# Redis (Optional but recommended)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Production
NODE_ENV=production
```

### 2. Database Setup

```bash
# Run migrations
npm run db:migrate

# Verify database
npm run validate:db

# Seed initial data (optional)
npm run db:seed
```

### 3. Validate Environment

```bash
# Check all configuration
npm run validate:env

# Run type check
npm run check
```

### 4. Start the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

---

## Architecture

### Authentication Flow

```
User → Login Request → Passport.js → OIDC Provider (Replit)
                                    ↓
                              User Authenticated
                                    ↓
                          Create Session in DB
                                    ↓
                            Track in active_sessions
                                    ↓
                           Log to auth_audit_logs
                                    ↓
                          Return to User Dashboard
```

### Session Storage Hierarchy

1. **Primary**: Redis (fast, distributed)
2. **Fallback**: PostgreSQL (reliable, persistent)
3. **Emergency**: Memory (development only)

### Security Layers

```
Request → Rate Limiting → CSRF Validation → Authentication Check
              ↓                ↓                    ↓
        Block abuse     Block CSRF         Verify session
              ↓                ↓                    ↓
     Security Headers → Session Security → Audit Logging
              ↓                ↓                    ↓
        Enhanced     Session fingerprint    Track all events
        protection   & hijack detection
```

---

## Features

### 1. Multi-Domain Authentication

Supports multiple deployment domains with automatic strategy registration:

```typescript
// Configured via REPLIT_DOMAINS
const domains = process.env.REPLIT_DOMAINS.split(',');
// Automatically registers auth strategies for:
// - All .replit.dev domains
// - All .replit.app domains
// - Custom domains
// - localhost (development)
```

### 2. Session Management

**Active Session Tracking:**
- View all active sessions
- Device type, browser, OS detection
- IP address and location tracking
- Last activity timestamps
- Selective session revocation

**API Endpoints:**
```
GET    /api/sessions           # List all sessions
GET    /api/sessions/current   # Current session info
DELETE /api/sessions/:id       # Revoke specific session
DELETE /api/sessions           # Revoke all other sessions
POST   /api/sessions/refresh   # Extend session expiry
```

### 3. Audit Logging

**Tracked Events:**
- `login_success` - Successful login
- `login_failed` - Failed login attempt
- `logout` - User logout
- `session_created` - New session
- `session_expired` - Session expired
- `session_revoked` - Manual session revocation
- `all_sessions_revoked` - Bulk revocation

**Audit Log Query:**
```typescript
import { getUserAuditLogs } from './middleware/authAudit';

const logs = await getUserAuditLogs(userId, {
  limit: 50,
  offset: 0
});
```

### 4. CSRF Protection

**Automatic Protection:**
```typescript
import { csrfProtection } from './middleware/csrf';

// Protect state-changing routes
app.post('/api/sensitive', csrfProtection, handler);
app.put('/api/update', csrfProtection, handler);
app.delete('/api/delete', csrfProtection, handler);
```

**Client-Side Usage:**
```typescript
// Token automatically included in response headers
const token = response.headers['x-csrf-token'];

// Include in requests
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token
  },
  body: JSON.stringify(data)
});
```

### 5. Security Headers

Automatically applied headers:
- `Strict-Transport-Security`: Force HTTPS
- `X-Content-Type-Options`: Prevent MIME sniffing
- `X-Frame-Options`: Prevent clickjacking
- `X-XSS-Protection`: XSS protection
- `Referrer-Policy`: Control referrer information
- `Permissions-Policy`: Restrict browser features

### 6. Database Monitoring

**Health Checks:**
```
GET /health                 # Basic health
GET /api/auth/health       # Auth system health
GET /api/monitoring        # Full dashboard
GET /api/db/stats          # Database statistics
```

**Monitored Metrics:**
- Connection pool status
- Query performance
- Table sizes and row counts
- Index usage
- Slow query detection
- Active connections

---

## API Reference

### Authentication Endpoints

#### `GET /api/login`
Initiates the authentication flow.

**Response:** Redirects to OIDC provider

---

#### `GET /api/callback`
Handles OIDC callback after authentication.

**Response:** Redirects to application

---

#### `GET /api/logout`
Logs out the current user.

**Response:** Redirects to OIDC logout

---

#### `GET /api/auth/user`
Gets the current authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isAdmin": false,
  "createdAt": "2025-10-16T00:00:00Z"
}
```

---

### Session Management Endpoints

#### `GET /api/sessions`
List all active sessions for the current user.

**Authentication:** Required

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "sessionId": "session-hash",
      "ipAddress": "192.168.1.1",
      "deviceType": "desktop",
      "browser": "Chrome 120",
      "os": "Windows 11",
      "isCurrent": true,
      "lastActivity": "2025-10-16T20:00:00Z",
      "expiresAt": "2025-10-23T20:00:00Z",
      "createdAt": "2025-10-16T19:00:00Z"
    }
  ],
  "currentSessionId": "session-hash"
}
```

---

#### `DELETE /api/sessions/:sessionId`
Revoke a specific session.

**Authentication:** Required

**Parameters:**
- `sessionId` (path) - The session ID to revoke

**Response:**
```json
{
  "success": true,
  "message": "Session revoked successfully"
}
```

---

### Monitoring Endpoints

#### `GET /health`
Basic application health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-16T20:00:00Z"
}
```

---

#### `GET /api/auth/health`
Authentication system health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-16T20:00:00Z",
  "sessionStore": "redis",
  "database": "connected",
  "redis": "connected"
}
```

---

#### `GET /api/monitoring`
Comprehensive monitoring dashboard.

**Authentication:** Admin required

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-16T20:00:00Z",
  "database": {
    "connection": { ... },
    "performance": { ... },
    "tables": { ... },
    "health": { ... }
  },
  "system": {
    "nodejs": { ... },
    "environment": { ... }
  },
  "security": {
    "recentAudits": [ ... ],
    "recentSecurityEvents": [ ... ]
  }
}
```

---

## Security

### Authentication Security

**Strong Authentication:**
- OIDC-based authentication (industry standard)
- Secure token handling
- Automatic token refresh
- Session expiry management

**Session Security:**
- Session fingerprinting
- Device tracking
- IP address monitoring
- Session hijacking detection
- Multi-device management

### Request Security

**CSRF Protection:**
- Token-based validation
- Automatic token generation
- 15-minute token expiry
- Redis-backed storage

**Rate Limiting:**
- IP-based rate limiting
- Adaptive rate limits
- Redis-backed counters
- Configurable thresholds

### Data Security

**Encryption:**
- HTTPS enforced in production
- Secure cookie flags
- Encrypted session storage
- SSL database connections

**Audit Trail:**
- Complete authentication history
- Security event logging
- Suspicious activity detection
- Compliance-ready logs

---

## Monitoring

### Health Monitoring

**Automatic Checks:**
- Database connectivity
- Redis availability
- Query performance
- Session storage health
- Application uptime

**Alerting:**
- Failed health checks
- Suspicious activities
- Performance degradation
- Security events

### Performance Monitoring

**Metrics Tracked:**
- Response times
- Query execution times
- Connection pool stats
- Cache hit rates
- Error rates

**Dashboards:**
- Real-time metrics
- Historical trends
- Performance bottlenecks
- Resource utilization

---

## Troubleshooting

### Common Issues

#### 1. Authentication Fails

**Symptoms:** Users cannot log in, redirected to error page

**Check:**
```bash
# Verify OIDC configuration
echo $REPL_ID
echo $REPLIT_DOMAINS

# Check auth audit logs
psql $DATABASE_URL -c "SELECT * FROM auth_audit_logs WHERE event_status='failure' ORDER BY created_at DESC LIMIT 10;"
```

**Solutions:**
- Verify REPL_ID is correct
- Check REPLIT_DOMAINS includes all deployment domains
- Ensure ISSUER_URL is accessible
- Review Replit Auth settings

---

#### 2. Sessions Not Persisting

**Symptoms:** Users logged out frequently, session lost on refresh

**Check:**
```bash
# Check session storage
psql $DATABASE_URL -c "SELECT COUNT(*) FROM sessions;"

# Check Redis connection
redis-cli ping
```

**Solutions:**
- Verify DATABASE_URL is correct
- Check Redis connectivity
- Review session configuration
- Check cookie settings

---

#### 3. CSRF Token Errors

**Symptoms:** POST/PUT/DELETE requests fail with 403

**Check:**
```bash
# Check Redis connection
redis-cli ping

# Review CSRF configuration
curl -I https://your-domain.com/api/csrf-token
```

**Solutions:**
- Ensure client includes CSRF token
- Check token expiry (15 minutes)
- Verify Redis is available
- Review CORS configuration

---

#### 4. Performance Issues

**Symptoms:** Slow response times, timeouts

**Check:**
```bash
# Check database performance
npm run validate:db

# Check monitoring dashboard
curl https://your-domain.com/api/monitoring
```

**Solutions:**
- Review database connection pool
- Check for slow queries
- Verify Redis caching
- Review index usage
- Check system resources

---

### Debug Mode

Enable detailed logging:

```env
# .env (development only!)
DEBUG=express:*
VERBOSE_LOGGING=true
```

**Warning:** Never enable debug mode in production!

---

### Getting Help

1. **Check Logs:**
   ```bash
   # Application logs
   journalctl -u your-app -f

   # Database logs
   psql $DATABASE_URL -c "SELECT * FROM auth_audit_logs ORDER BY created_at DESC LIMIT 50;"
   ```

2. **Run Diagnostics:**
   ```bash
   npm run validate:env
   npm run validate:db
   npm run db:migrate:status
   ```

3. **Review Documentation:**
   - `DEPLOYMENT_CHECKLIST.md`
   - `PRODUCTION_READY_SUMMARY.md`
   - This guide

---

## Best Practices

### Development

1. **Use Environment Variables:**
   - Never commit secrets
   - Use .env.example for templates
   - Validate env in CI/CD

2. **Test Authentication:**
   - Test login flow
   - Test session persistence
   - Test logout
   - Test expired sessions

3. **Monitor Performance:**
   - Review query times
   - Check connection pools
   - Monitor cache hit rates

### Production

1. **Security Hardening:**
   - Use strong SESSION_SECRET (32+ chars)
   - Enable Redis for performance
   - Configure SSL for database
   - Set up monitoring alerts

2. **Backup Strategy:**
   - Daily automated backups
   - Test restore procedures
   - Monitor backup success
   - Retain 30 days minimum

3. **Monitoring:**
   - Set up health check monitoring
   - Configure error alerting
   - Review audit logs daily
   - Track security events

### Maintenance

1. **Regular Tasks:**
   - Review audit logs weekly
   - Clean expired sessions monthly
   - Update dependencies quarterly
   - Security audit annually

2. **Performance Tuning:**
   - Optimize slow queries
   - Review index usage
   - Adjust connection pools
   - Monitor cache efficiency

---

## Additional Resources

- [Passport.js Documentation](http://www.passportjs.org/)
- [Express Session Guide](https://github.com/expressjs/session)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/performance-tips.html)
- [Redis Documentation](https://redis.io/documentation)
- [OWASP Security Guidelines](https://owasp.org/)

---

**Last Updated:** October 16, 2025
**Version:** 2.0.0 - Production Ready
