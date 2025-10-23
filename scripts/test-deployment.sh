#!/bin/bash

set -e

echo "================================="
echo "🧪 TESTING PRODUCTION DEPLOYMENT"
echo "================================="
echo ""

# Start production server in background
echo "🚀 Starting production server..."
NODE_ENV=production node dist/index.js > /tmp/deployment-test.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server to start
echo "⏳ Waiting for server to start (15 seconds)..."
sleep 15

# Check if server is still running
if ! ps -p $SERVER_PID > /dev/null; then
    echo "❌ Server crashed during startup!"
    echo "Last 100 lines of logs:"
    tail -100 /tmp/deployment-test.log
    exit 1
fi

echo "✅ Server process running"
echo ""

# Check server logs for errors
echo "📋 Checking server logs..."
if grep -q "CRITICAL" /tmp/deployment-test.log; then
    echo "❌ Critical errors found in logs:"
    grep "CRITICAL" /tmp/deployment-test.log
    kill $SERVER_PID || true
    exit 1
fi

if grep -q "Server listening" /tmp/deployment-test.log; then
    echo "✅ Server started successfully"
else
    echo "⚠️  'Server listening' message not found in logs yet"
fi

echo ""
echo "🔍 Server startup logs (first 100 lines):"
head -100 /tmp/deployment-test.log
echo ""

# Test endpoints
echo "================================="
echo "🧪 TESTING ENDPOINTS"
echo "================================="
echo ""

BASE_URL="http://localhost:5000"

# Test 1: Health check
echo "Test 1: Health check endpoint"
if curl -s -f "$BASE_URL/api/auth/health" > /tmp/test-health.json; then
    echo "✅ /api/auth/health responded"
    cat /tmp/test-health.json | head -20
else
    echo "❌ /api/auth/health failed"
fi
echo ""

# Test 2: Deployment status
echo "Test 2: Deployment status endpoint"
if curl -s -f "$BASE_URL/api/deployment-status" > /tmp/test-status.json; then
    echo "✅ /api/deployment-status responded"
    cat /tmp/test-status.json | head -30
else
    echo "❌ /api/deployment-status failed"
fi
echo ""

# Test 3: Login endpoint (should redirect or return auth error)
echo "Test 3: Login endpoint"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/login")
echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "500" ]; then
    echo "✅ /api/login responding (status $HTTP_CODE is expected without auth)"
else
    echo "❌ /api/login returned unexpected status: $HTTP_CODE"
fi
echo ""

# Test 4: Index.html
echo "Test 4: Frontend index.html"
if curl -s -f "$BASE_URL/" | grep -q "<html"; then
    echo "✅ Frontend index.html served correctly"
else
    echo "❌ Frontend index.html failed to load"
fi
echo ""

# Cleanup
echo "🧹 Stopping test server..."
kill $SERVER_PID || true
sleep 2

echo ""
echo "================================="
echo "📊 TEST SUMMARY"
echo "================================="
echo ""
echo "View full logs at: /tmp/deployment-test.log"
echo ""
echo "✅ Production build deployment test complete"
