import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { testConnection } from "./db";
import { runSafeMigrations } from "./migrations";
import { SESSION_SECRET, PORT } from "./config";
import { databaseHealthMonitor } from "./database-health";
import { addSecurityHeaders, secureErrorHandler } from "./security";
// Welcome bot removed - using only main telegram bot for channel updates

const MemStore = MemoryStore(session);

const app = express();

// Trust proxy for rate limiting - required for Replit environment
app.set('trust proxy', 1);

// Security middleware - comprehensive protection
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for Vite dev
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:", "ws:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for development compatibility
}));

// Rate limiting for API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit login attempts
  message: {
    error: "Too many authentication attempts, please try again later."
  },
});

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

// CORS configuration - disable CORS when serving from same origin
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Only set CORS headers for cross-origin requests
  if (origin) {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Add security headers
app.use(addSecurityHeaders);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Configure session middleware with proper store
app.use(session({
  secret: SESSION_SECRET,
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create sessions until explicitly needed
  rolling: false, // Don't reset expiration on every request
  name: 'connect.sid', // Explicit session cookie name
  store: new MemStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true, // Prevent XSS attacks by blocking JavaScript access
    sameSite: 'strict', // Enhanced CSRF protection
    path: '/', // Ensure cookie is available for all paths
    domain: undefined // Let browser handle domains
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // Debug session information for API requests (development only)
  if (process.env.NODE_ENV === 'development' && path.startsWith("/api") && !path.includes('/bitcoin/price')) {
    console.log(`${req.method} ${path} - Session ID: ${req.sessionID}, User ID: ${req.session?.userId}`);
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api") && duration > 100) { // Only log slow requests or errors
      if (res.statusCode >= 400 || duration > 500) {
        log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
      }
    }
  });

  next();
});

// Global error handlers for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
  } else {
    console.error('Unhandled Promise Rejection:', reason instanceof Error ? reason.message : reason);
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }
});

(async () => {
  // Enhanced database initialization with retry logic
  let dbInitialized = false;
  let initAttempts = 0;
  const maxInitAttempts = 5;

  while (!dbInitialized && initAttempts < maxInitAttempts) {
    try {
      initAttempts++;
      console.log(`🔄 Database initialization attempt ${initAttempts}/${maxInitAttempts}...`);

      const connected = await testConnection();
      if (connected) {
        await runSafeMigrations();
        dbInitialized = true;
        console.log('✅ Database initialized successfully');
        
        const { initializeTRC20System } = await import('./trc20-init');
        await initializeTRC20System();
      } else {
        throw new Error('Database connection test failed');
      }
    } catch (error) {
      console.warn(`⚠️  Database initialization attempt ${initAttempts} failed:`, error instanceof Error ? error.message : 'Unknown error');

      if (initAttempts < maxInitAttempts) {
        const delay = 2000 * initAttempts; // Increasing delay
        console.log(`🕐 Retrying database initialization in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.warn('💥 All database initialization attempts failed. Server will start in degraded mode.');
        console.warn('📝 Some features may not work properly without database connection.');
      }
    }
  }

  const server = await registerRoutes(app);

  // Use secure error handler
  app.use(secureErrorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use configured port (supports deployment platforms)
  const port = PORT;
  server.listen(port, "0.0.0.0", async () => {
    log(`serving on port ${port}`);

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Server started but database connection failed. Some features may not work.');
    }
  });
})();