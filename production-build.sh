#!/bin/bash
set -e

echo "=== Plus500 VIP Production Build Script ==="

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production
npm install typescript @types/node esbuild vite

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist client/dist

# Build frontend
echo "Building frontend with Vite..."
npx vite build

# Build backend with esbuild
echo "Building backend with esbuild..."
npx esbuild server/index.ts \
  --platform=node \
  --target=node18 \
  --packages=external \
  --bundle \
  --format=esm \
  --outfile=dist/index.js \
  --external:pg-native \
  --external:@neondatabase/serverless

# Copy necessary files
echo "Copying static files..."
cp -r client/dist dist/client 2>/dev/null || echo "No client dist found"

echo "=== Build completed successfully! ==="
echo "Start the application with: node dist/index.js"