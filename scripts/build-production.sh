#!/bin/bash
# Production build script - properly prepares all assets for deployment

echo "🚀 Building for production deployment..."

# Step 1: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/ client/dist/

# Step 2: Build client with Vite
echo "📦 Building client..."
vite build

# Step 3: Build server with esbuild  
echo "🖥️  Building server..."
esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist

# Step 4: CRITICAL - Copy client to dist/public for production serving
echo "📋 Copying client build to dist/public..."
mkdir -p dist/public
cp -r client/dist/* dist/public/

# Step 5: Verify build success
if [ -f "dist/public/index.html" ]; then
  echo "✅ Build complete! Deployment artifacts ready:"
  echo "   - dist/index.js (server)"  
  echo "   - dist/public/ (client static files)"
  echo "   - dist/public/index.html ✓"
else
  echo "❌ Build failed! index.html not found in dist/public/"
  exit 1
fi
