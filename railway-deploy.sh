#!/bin/bash

# Railway Deployment Script for Plus500 VIP Bitcoin Investment Platform
# This script automates the Railway deployment process

echo "🚀 Starting Railway deployment for Plus500 VIP..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway..."
    railway login
fi

echo "📦 Building production assets..."
npm run build

echo "🔍 Checking build output..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ Backend build failed - dist/index.js not found"
    exit 1
fi

if [ ! -d "dist/public" ]; then
    echo "❌ Frontend build failed - dist/public not found"
    exit 1
fi

echo "✅ Build successful!"
echo "   - Frontend: $(du -sh dist/public | cut -f1)"
echo "   - Backend: $(du -sh dist/index.js | cut -f1)"

echo "🚂 Deploying to Railway..."

# Initialize Railway project if not exists
if [ ! -f "railway.json" ]; then
    railway init
fi

# Deploy to Railway
railway up

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up environment variables in Railway Dashboard"
echo "2. Add PostgreSQL plugin for database"
echo "3. Configure custom domain (optional)"
echo "4. Monitor deployment logs"
echo ""
echo "🔗 Railway Dashboard: https://railway.app/dashboard"