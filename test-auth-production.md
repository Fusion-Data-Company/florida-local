# Production Authentication Test Plan

## Overview
Comprehensive test suite for Florida Elite authentication system in production mode.

## Test Scenarios

### 1. New User Authentication Flow
**Steps:**
1. Navigate to https://florida-local-elite.replit.app
2. Click "Login" button
3. Complete Replit OAuth flow
4. Verify redirect to "/" (Discover page)
5. Verify user session is created in PostgreSQL
6. Verify user record exists in database
7. Check /api/auth/health endpoint shows "ok" status

**Expected Results:**
- OAuth redirect works correctly
- User is created in database with Replit ID
- Session is stored in PostgreSQL
- User lands on Discover page (/)
- No console errors

### 2. Existing User Login
**Steps:**
1. Logout from application
2. Navigate to https://florida-local-elite.replit.app
3. Click "Login" button
4. Complete Replit OAuth flow
5. Verify redirect to "/" (Discover page)
6. Verify session refresh works

**Expected Results:**
- Existing user record is updated (not duplicated)
- Session is created successfully
- User lands on Discover page
- All user data is preserved

### 3. Session Persistence
**Steps:**
1. Login to application
2. Refresh browser page
3. Navigate to different routes
4. Verify session persists across page loads
5. Check session timeout warning (after 6 days)

**Expected Results:**
- Session cookie is httpOnly and secure
- User remains authenticated across refreshes
- Session stored in PostgreSQL persists
- Warning shown 24 hours before expiry

### 4. Authentication Error Handling
**Steps:**
1. Simulate OAuth error (invalid state/code)
2. Verify error message is shown
3. Verify user can retry login
4. Check production logs for detailed error info

**Expected Results:**
- User-friendly error message displayed
- Detailed error logged for debugging
- User can retry authentication
- No sensitive data exposed in errors

### 5. Multi-Domain Strategy
**Steps:**
1. Test login from .replit.dev domain
2. Test login from .replit.app domain  
3. Test login from florida-local-elite.replit.app
4. Verify all strategies work correctly

**Expected Results:**
- All domain strategies registered correctly
- Fallback strategy works if exact match not found
- florida-local-elite.replit.app strategy prioritized

### 6. Session Store Fallback
**Steps:**
1. Test with Redis unavailable
2. Verify PostgreSQL session store used
3. Check sessions table created
4. Verify session persistence

**Expected Results:**
- Graceful fallback to PostgreSQL
- Sessions stored in "sessions" table
- No errors in production logs
- Session TTL set to 7 days

### 7. Token Refresh
**Steps:**
1. Login and wait for token to near expiry
2. Make authenticated request
3. Verify token is refreshed automatically
4. Check access_token and refresh_token updated

**Expected Results:**
- Token refreshes before expiry
- User not logged out
- New tokens stored in session
- No interruption to user experience

### 8. Database Retry Logic
**Steps:**
1. Simulate transient database failure
2. Verify user upsert retries 3 times
3. Check retry delay (1 second)
4. Verify success after retry

**Expected Results:**
- Upsert retries 3 times on failure
- 1-second delay between retries
- Success logged after retry
- User creation succeeds

### 9. Production Logging
**Steps:**
1. Trigger authentication error
2. Check production logs
3. Verify detailed error context logged
4. Ensure no sensitive data in logs

**Expected Results:**
- Timestamp, hostname, strategy logged
- Error type and message captured
- Request headers logged for debugging
- No passwords or tokens in logs

### 10. Health Check Monitoring
**Steps:**
1. Call /api/auth/health endpoint
2. Verify response includes:
   - status: "ok"
   - sessionStore type (redis/postgresql/memory)
   - database connection status
   - redis connection status
   - timestamp

**Expected Results:**
- 200 OK response
- Accurate status of all systems
- Useful for monitoring/alerting
- Fast response time (<100ms)

## Production Testing Checklist

- [ ] New user can sign up via Replit OAuth
- [ ] Existing user can log in successfully
- [ ] User redirected to "/" after login
- [ ] Session persists across page refreshes
- [ ] Session timeout warning shown at 6 days
- [ ] Authentication errors show user-friendly messages
- [ ] Production logs contain detailed debug info
- [ ] All domain strategies work correctly
- [ ] PostgreSQL session fallback works
- [ ] Token refresh happens automatically
- [ ] Database retry logic handles transient failures
- [ ] /api/auth/health endpoint responds correctly
- [ ] No sensitive data exposed in logs or errors
- [ ] Session cookies are secure and httpOnly
- [ ] CSRF protection working correctly

## Performance Benchmarks

- Login flow: < 3 seconds
- Session validation: < 50ms
- Token refresh: < 200ms
- Health check: < 100ms
- Database upsert (with retry): < 3 seconds

## Security Checklist

- [ ] Session cookies have httpOnly flag
- [ ] Session cookies have secure flag (production)
- [ ] Session cookies use sameSite: 'lax'
- [ ] REPLIT_DOMAINS validated before use
- [ ] No passwords or tokens in logs
- [ ] Rate limiting on auth endpoints
- [ ] CSRF protection enabled
- [ ] Proper error messages (no info leakage)

## Monitoring & Alerts

- Monitor /api/auth/health for failures
- Alert on repeated authentication errors
- Track session store fallback events
- Monitor token refresh failures
- Alert on database retry exhaustion
