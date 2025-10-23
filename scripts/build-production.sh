#!/bin/bash

set -e

echo "🏗️  Starting clean production build..."
echo "=================================================="

# Clean old builds
echo "🧹 Cleaning old build files..."
rm -rf dist/
rm -rf client/dist/
echo "✅ Cleaned dist/ and client/dist/"

# Build client with Vite
echo ""
echo "📦 Building client with Vite..."
vite build
if [ ! -d "client/dist" ]; then
  echo "❌ ERROR: client/dist was not created by Vite!"
  exit 1
fi
echo "✅ Client build complete: client/dist/"

# Remove heavy directories that Vite copied from client/public
echo ""
echo "🧹 Removing heavy dev assets from client/dist..."
rm -rf client/dist/attached_assets
echo "✅ Removed attached_assets/ (81MB) from build"

# Clean up compressed files and source maps to save space
echo ""
echo "🧹 Cleaning up source maps and compressed files..."
find client/dist -name "*.map" -delete
find client/dist -name "*.gz" -delete
find client/dist -name "*.br" -delete
echo "✅ Removed source maps and compressed files"

# Build server with esbuild
echo ""
echo "📦 Building server with esbuild..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
if [ ! -f "dist/index.js" ]; then
  echo "❌ ERROR: dist/index.js was not created by esbuild!"
  exit 1
fi
echo "✅ Server build complete: dist/index.js"

# Copy client build to server dist/public
echo ""
echo "📁 Copying client files to dist/public/..."
mkdir -p dist/public
cp -r client/dist/* dist/public/
echo "✅ Client files copied to: dist/public/"

# Copy additional assets
echo ""
echo "📁 Copying additional assets..."
if [ -d "client/public" ]; then
  # Copy everything except attached_assets
  rsync -av --exclude='attached_assets' client/public/ dist/public/ 2>/dev/null || {
    # Fallback if rsync not available: copy then remove attached_assets only
    cp -r client/public/* dist/public/ 2>/dev/null || true
    rm -rf dist/public/attached_assets 2>/dev/null || true
  }
  echo "✅ Copied client/public/ assets (excluded attached_assets)"
fi

if [ -d "Backgrounds" ]; then
  mkdir -p dist/public/backgrounds
  cp -r Backgrounds/* dist/public/backgrounds/
  echo "✅ Copied Backgrounds/"
fi

# Skip attached_assets in production builds to reduce deployment size
# (Screenshots and large dev assets excluded via .dockerignore)
if [ -n "$COPY_ATTACHED_ASSETS" ] && [ -d "attached_assets" ]; then
  mkdir -p dist/public/attached_assets
  cp -r attached_assets/* dist/public/attached_assets/
  echo "✅ Copied attached_assets/"
else
  echo "⏭️  Skipped attached_assets/ (not needed in production)"
fi

# Verify the build
echo ""
echo "🔍 Verifying build..."
if [ ! -f "dist/public/index.html" ]; then
  echo "❌ ERROR: dist/public/index.html not found!"
  exit 1
fi

if [ ! -f "dist/index.js" ]; then
  echo "❌ ERROR: dist/index.js not found!"
  exit 1
fi

echo ""
echo "dist/ contents:"
ls -lah dist/ | head -15
echo ""
echo "dist/public/ contents:"
ls -lah dist/public/ | head -15

echo ""
echo "=================================================="
echo "✅ Production build complete!"
echo ""
echo "Files created:"
echo "  - dist/index.js (server)"
echo "  - dist/public/index.html ✓"
echo "  - dist/public/ (client + static assets)"
echo ""
echo "To test locally:"
echo "  NODE_ENV=production node dist/index.js"
echo ""
echo "To deploy:"
echo "  Click 'Publish' in Replit"
echo "=================================================="
