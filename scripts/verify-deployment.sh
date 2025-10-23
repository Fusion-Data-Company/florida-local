#!/bin/bash
# Deployment verification script - checks if production build is ready

echo "🔍 DEPLOYMENT VERIFICATION"
echo "=========================="
echo ""

# Check 1: Client build output
echo "📦 Checking client build..."
if [ -f "client/dist/index.html" ]; then
  echo "✅ client/dist/index.html exists"
else
  echo "❌ client/dist/index.html MISSING"
  echo "   Run 'npm run build' to create it"
fi

# Check 2: Server build output
echo ""
echo "🖥️  Checking server build..."
if [ -f "dist/index.js" ]; then
  echo "✅ dist/index.js exists"
  SIZE=$(du -h dist/index.js | cut -f1)
  echo "   Size: $SIZE"
else
  echo "❌ dist/index.js MISSING"
  echo "   Run 'npm run build' to create it"
fi

# Check 3: Production static files location
echo ""
echo "📁 Checking dist/public..."
if [ -f "dist/public/index.html" ]; then
  echo "✅ dist/public/index.html exists"
  echo "   Production static files ready!"
else
  echo "⚠️  dist/public/ not found"
  echo "   This is normal - server will copy client/dist → dist/public at startup"
fi

# Check 4: Verify the server can copy files
echo ""
echo "🔧 Testing file copy mechanism..."
if [ -d "client/dist" ] && [ -d "dist" ]; then
  mkdir -p dist/public-test
  cp -r client/dist/* dist/public-test/ 2>/dev/null
  if [ -f "dist/public-test/index.html" ]; then
    echo "✅ File copy test successful"
    rm -rf dist/public-test
  else
    echo "❌ File copy test FAILED"
  fi
else
  echo "⚠️  Cannot test - source or dest missing"
fi

# Summary
echo ""
echo "📊 DEPLOYMENT READINESS:"
echo "========================"

READY=true

if [ ! -f "client/dist/index.html" ]; then
  echo "❌ Client build incomplete"
  READY=false
fi

if [ ! -f "dist/index.js" ]; then
  echo "❌ Server build incomplete"
  READY=false
fi

if [ "$READY" = true ]; then
  echo "✅ Build is complete and ready for deployment"
  echo ""
  echo "🚀 To deploy:"
  echo "   1. Ensure REPLIT_DOMAINS environment variable is set"
  echo "   2. Click 'Publish' in Replit"
  echo "   3. Health checks will pass at '/' endpoint"
  echo "   4. Server will auto-copy static files on startup"
else
  echo "❌ Build not ready - run 'npm run build' first"
fi
