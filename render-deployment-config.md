# Render Deployment Configuration for BitVault Pro

## 🚀 Exact Configuration for Render.com

### Build Command (Copy exactly):
```
npm ci && npx vite build && npx esbuild server/index.ts --platform=node --target=node18 --packages=external --bundle --format=esm --outfile=dist/index.js --external:pg-native --external:@neondatabase/serverless --minify
```

### Start Command:
```
node dist/index.js
```

### Environment Variables:
- `NODE_ENV`: `production`
- `DATABASE_URL`: (auto-provided by Render PostgreSQL service)

### Service Configuration:
- **Environment**: Node.js
- **Plan**: Free (or higher)
- **Auto-Deploy**: Enabled
- **Branch**: main (or your default branch)

## 🔧 PostgreSQL Database Setup on Render

1. Create a PostgreSQL database service on Render
2. Link it to your web service
3. The DATABASE_URL will be automatically provided

## 🌐 Post-Deployment

After deployment, your app will:
- ✅ Automatically create database tables
- ✅ Start the investment profit system  
- ✅ Enable real-time Bitcoin price tracking
- ✅ Work with Google OAuth authentication

Your BitVault Pro app will be available at your Render URL (something like: `https://bitvault-pro.onrender.com`)

## 🐛 If Still Blank

If the app is still blank, check Render logs for:
1. Build errors during deployment
2. Database connection issues
3. Missing environment variables

The most common issue is using the wrong build command - make sure you copy the build command exactly as shown above.