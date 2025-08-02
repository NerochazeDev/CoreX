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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware with proper store
app.use(session({
  secret: SESSION_SECRET,
  resave: true, // Force session save to ensure persistence
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  store: new MemStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: false, // Allow client-side access for debugging in development
    sameSite: 'lax'
  },
  name: 'plus500.sid' // Explicit session name
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

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