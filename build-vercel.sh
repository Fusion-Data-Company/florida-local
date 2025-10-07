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

echo "Build completed successfully!"
