#!/bin/bash
# Deployment build script that properly handles client build and server static file serving

echo "🚀 Building for deployment..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Build client using Vite (the proper way)
echo "📦 Building client with Vite..."
npx vite build

# Build server
echo "🖥️ Building server..."
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --target=es2020 \
  --outdir=dist

# Copy client build artifacts to the expected location for serveStatic
echo "📋 Copying client build to dist/public..."
mkdir -p dist/public
if [ -d "client/dist" ]; then
  cp -r client/dist/* dist/public/
  echo "✅ Client build artifacts copied successfully!"
  
  # Verify the copy worked
  if [ -f "dist/public/index.html" ]; then
    echo "✅ Verified: index.html found in dist/public"
  else
    echo "⚠️  Warning: index.html not found in dist/public"
  fi
else
  echo "❌ Error: client/dist directory not found"
  echo "   Make sure the Vite build completed successfully"
  exit 1
fi

echo "✅ Build complete! Deployment ready."
echo "📁 Build directory structure:"
echo "   dist/"
echo "   ├── index.js (server)"
echo "   └── public/ (client build artifacts)"