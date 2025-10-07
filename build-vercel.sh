#!/bin/bash
set -e

echo "Building client with Vite..."
vite build

echo "Building server with esbuild..."
esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --target=es2020 \
  --outdir=dist

echo "Copying client build to dist/public..."
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

echo "Build completed successfully!"
