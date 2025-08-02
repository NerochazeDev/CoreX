import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { testConnection } from "./db";
import { runSafeMigrations } from "./migrations";
import { SESSION_SECRET, PORT } from "./config";

const MemStore = MemoryStore(session);

const app = express();

// CORS configuration to allow credentials for cross-origin requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Allow Replit domains and localhost for development
  if (origin && (
    origin.includes('replit.dev') || 
    origin.includes('localhost') || 
    origin.includes('127.0.0.1')
  )) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback to localhost if no origin header
    res.header('Access-Control-Allow-Origin', 'http://localhost:5000');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware with proper store
app.use(session({
  secret: SESSION_SECRET,
  resave: false, // Don't save session if unmodified
  saveUninitialized: true, // Save uninitialized sessions to ensure cookie is set
  rolling: false, // Don't reset expiration on every request
  name: 'connect.sid', // Explicit session cookie name
  store: new MemStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Required for sameSite: 'none' in HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: false, // Allow client-side access for debugging
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Cross-origin for production, lax for dev
    path: '/', // Ensure cookie is available for all paths
    domain: undefined // Let browser handle cross-origin domains
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // Debug session information for API requests
  if (path.startsWith("/api")) {
    console.log(`${req.method} ${path} - Session ID: ${req.sessionID}, User ID: ${req.session?.userId}`);
    console.log(`  Headers: Origin=${req.headers.origin}, Cookie=${req.headers.cookie || 'none'}`);
    console.log(`  User-Agent: ${req.headers['user-agent']}`);
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
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

(async () => {
  // Initialize database with migrations - don't fail on connection issues
  try {
    const connected = await testConnection();
    if (connected) {
      await runSafeMigrations();
    } else {
      console.warn('⚠️  Database connection failed, starting server without database');
    }
  } catch (error) {
    console.warn('⚠️  Database initialization failed, starting server in limited mode:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

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