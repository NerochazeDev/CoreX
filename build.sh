#!/bin/bash
set -e

echo "Building frontend..."
npx vite build

echo "Building backend..."
npx esbuild server/index.ts --platform=node --target=node18 --packages=external --bundle --format=esm --outfile=dist/index.js --external:pg-native --external:@neondatabase/serverless --external:canvas

echo "Build completed successfully!"