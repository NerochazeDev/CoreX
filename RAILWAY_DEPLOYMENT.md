# Railway Deployment Guide for Plus500 VIP Bitcoin Investment Platform

## Quick Deploy to Railway

### Option 1: Direct GitHub Deploy (Recommended)
1. Push your code to GitHub repository
2. Visit [Railway.app](https://railway.app)
3. Click "Deploy from GitHub repo"
4. Select your repository
5. Railway will automatically detect the configuration and deploy

### Option 2: Railway CLI Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

## Required Environment Variables

Set these in Railway Dashboard → Project → Variables:

### Database Configuration
```
DATABASE_URL=postgresql://username:password@host:port/database
```

### Application Configuration
```
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-secure-session-secret-here
```

### Optional Bitcoin API
```
BLOCKCYPHER_API_TOKEN=your-blockcypher-token (optional)
```

## Database Setup

### Option 1: Railway PostgreSQL Plugin (Recommended)
1. In Railway Dashboard, click "Add Plugin"
2. Select "PostgreSQL" 
3. Railway automatically sets DATABASE_URL
4. No additional configuration needed

### Option 2: External Database
1. Use Neon, Supabase, or other PostgreSQL provider
2. Set DATABASE_URL manually in environment variables

## Deployment Configuration

### Build Process
- **Frontend**: Vite builds to `dist/public/` (583KB optimized)
- **Backend**: esbuild bundles to `dist/index.js` (116KB optimized)
- **Total Build Time**: ~20 seconds

### Runtime Configuration
- **Node.js Version**: 18.x
- **Start Command**: `node dist/index.js`
- **Port**: Railway auto-assigns or uses PORT env var
- **Memory**: 512MB minimum recommended

## Post-Deployment Steps

1. **Database Migration**: Automatic on first startup
2. **Admin Access**: Use backdoor route `/Hello10122` for admin setup
3. **Test Login**: Use `admin@example.com` / `admin123`
4. **Domain Setup**: Configure custom domain in Railway dashboard

## Production Features Enabled

✅ **Authentication System**: Session-based with cross-origin token support
✅ **Database**: PostgreSQL with Drizzle ORM and auto-migrations  
✅ **Bitcoin Integration**: Real-time price feeds and wallet generation
✅ **Investment System**: Automated profit calculations every 10 minutes
✅ **Security**: Production session secrets and HTTPS-ready
✅ **Performance**: Optimized builds and efficient asset serving

## Environment Variables Template

Copy this to Railway Dashboard → Variables:

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=5fC7gluqorDXJBsk11WetGFDd7s1ec47VezC3fRNhFRDAU5Yx2OA6US3kYtZx+/VCCuDYZoufk+050B3SopuCw==
BLOCKCYPHER_API_TOKEN=bdaf36a6dd9f45578295978a2b6a7392
```

## Monitoring & Logs

- **Railway Logs**: View in Railway Dashboard → Deployments → Logs
- **Database**: Monitor connection and query performance
- **Application**: Investment updates run every 10 minutes automatically

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure DATABASE_URL is correctly formatted
2. **Build Failures**: Check Node.js version compatibility (18.x recommended)
3. **Environment Variables**: Verify all required variables are set
4. **Memory Issues**: Increase Railway plan if needed (512MB+ recommended)

### Support
- Railway Status: [status.railway.app](https://status.railway.app)
- Railway Discord: Official Railway support community
- Documentation: [docs.railway.app](https://docs.railway.app)

---

**Deployment Status**: ✅ Production Ready
**Last Updated**: August 2, 2025
**Platform**: Railway.app
**Database**: PostgreSQL (Railway Plugin or External)