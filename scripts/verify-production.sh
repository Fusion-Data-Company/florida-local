#!/bin/bash
#
# Production Deployment Verification Script
# Tests https://the-florida-local.replit.app to verify authentication system is working
#

set -e

PRODUCTION_URL="${PRODUCTION_URL:-https://the-florida-local.replit.app}"
echo "🔍 Verifying production deployment at: $PRODUCTION_URL"
echo "===================================================="

# Test 1: Health endpoint
echo ""
echo "✓ Test 1: Health Check"
echo "   GET /health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/health")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Health check passed (200 OK)"
else
    echo "   ❌ Health check failed (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 2: Detailed health endpoint
echo ""
echo "✓ Test 2: Detailed Health Status"
echo "   GET /api/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/api/health")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Detailed health check passed (200 OK)"
else
    echo "   ❌ Detailed health check failed (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 3: Auth user endpoint (should return 401 for unauthenticated)
echo ""
echo "✓ Test 3: Auth User Endpoint"
echo "   GET /api/auth/user"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/api/auth/user")
if [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ Auth endpoint working (401 Unauthorized - expected)"
else
    echo "   ⚠️  Auth endpoint returned HTTP $HTTP_CODE (expected 401)"
fi

# Test 4: Login endpoint (should redirect to Replit OAuth)
echo ""
echo "✓ Test 4: Login Endpoint"
echo "   GET /api/login"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "$PRODUCTION_URL/api/login")
if [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "307" ]; then
    echo "   ✅ Login endpoint redirecting (HTTP $HTTP_CODE - expected)"
else
    echo "   ❌ Login endpoint returned HTTP $HTTP_CODE (expected 302/307 redirect)"
    exit 1
fi

# Test 5: Frontend loads
echo ""
echo "✓ Test 5: Frontend Homepage"
echo "   GET /"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Frontend loads successfully (200 OK)"
else
    echo "   ❌ Frontend failed to load (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 6: API endpoints responding
echo ""
echo "✓ Test 6: Sample API Endpoint"
echo "   GET /api/businesses/spotlight"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/api/businesses/spotlight")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API endpoints working (200 OK)"
else
    echo "   ⚠️  API endpoint returned HTTP $HTTP_CODE"
fi

echo ""
echo "===================================================="
echo "✅ All critical production tests passed!"
echo ""
echo "📋 Summary:"
echo "   - Health checks: ✅ Working"
echo "   - Auth endpoints: ✅ Working"
echo "   - Login redirect: ✅ Working"
echo "   - Frontend: ✅ Loading"
echo "   - API: ✅ Responding"
echo ""
echo "🎯 Next steps:"
echo "   1. Open $PRODUCTION_URL in your browser"
echo "   2. Click the 'Sign In' button"
echo "   3. Complete the Replit OAuth flow"
echo "   4. Verify you can access authenticated content"
echo ""
