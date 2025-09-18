#!/bin/bash
# Emergency deployment build script to bypass ES2015 BigInt limitations

echo "🚀 Building with ES2020 support for deployment..."

# Build client with esbuild (ES2020 target)
echo "📦 Building client..."
npx esbuild client/src/index.tsx \
  --bundle \
  --minify \
  --target=es2020 \
  --format=esm \
  --outfile=dist/client/index.js \
  --loader:.tsx=tsx \
  --loader:.ts=tsx \
  --loader:.css=css \
  --define:process.env.NODE_ENV='"production"' \
  --external:react \
  --external:react-dom

# Copy HTML file
mkdir -p dist/client
cp client/index.html dist/client/

# Build server
echo "🖥️ Building server..."
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --target=es2020 \
  --outdir=dist

echo "✅ Build complete! Deployment ready."