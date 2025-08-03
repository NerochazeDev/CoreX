import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Clean and validate the DATABASE_URL
let databaseUrl = process.env.DATABASE_URL.trim();

// Remove any trailing file paths or socket references that might be invalid
databaseUrl = databaseUrl.replace(/\/\.s\.PGSQL\.\d+$/, '');

// Ensure proper SSL mode for production databases
if (!databaseUrl.includes('sslmode=') && !databaseUrl.includes('localhost')) {
  databaseUrl += databaseUrl.includes('?') ? '&sslmode=require' : '?sslmode=require';
}

console.log('🔗 Using database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

// Enhanced connection configuration with robust retry logic and port stability
const connectionConfig = {
  max: 8, // Optimized pool size for stability
  idle_timeout: 20, // Shorter idle timeout to prevent port issues
  connect_timeout: 90, // Extended connection timeout
  prepare: false, // Disable prepared statements for better compatibility
  onnotice: () => {}, // Suppress notices
  onparameter: () => {}, // Suppress parameter notices
  connection: {
    application_name: 'plus500_investment_platform',
    statement_timeout: 45000, // 45 second query timeout
    idle_in_transaction_session_timeout: 90000, // 90 second idle transaction timeout
    tcp_keepalives_idle: 60, // TCP keepalive settings for port stability
    tcp_keepalives_interval: 10,
    tcp_keepalives_count: 3,
  },
  transform: postgres.camel, // Convert snake_case to camelCase
  retry: 7, // Increased retry attempts
  backoff: 'exponential', // Exponential backoff for retries
  ssl: databaseUrl.includes('sslmode=require') ? { 
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined // Bypass certificate validation issues
  } : false,
  socket_timeout: 300, // 5 minute socket timeout
  keep_alive: true, // Enable TCP keep-alive
};

let client: postgres.Sql;
let db: ReturnType<typeof drizzle>;
let connectionAttempts = 0;
const maxConnectionAttempts = 10;
const baseRetryDelay = 1000; // 1 second base delay

// Initialize connection with enhanced retry logic and port management
async function initializeConnection(): Promise<void> {
  connectionAttempts++;
  
  try {
    // Gracefully close existing connection and clean up ports
    if (client) {
      try {
        await client.end({ timeout: 5 });
      } catch (closeError) {
        console.warn('⚠️ Error closing previous connection:', closeError);
      }
      client = null as any;
    }
    
    // Small delay to allow port cleanup
    if (connectionAttempts > 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    client = postgres(databaseUrl, connectionConfig);
    db = drizzle(client, { schema });
    
    // Test the connection with timeout
    const testPromise = client`SELECT 1, current_database(), inet_server_addr(), inet_server_port()`;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection test timeout')), 30000)
    );
    
    await Promise.race([testPromise, timeoutPromise]);
    console.log(`✅ Database connection successful (attempt ${connectionAttempts})`);
    connectionAttempts = 0; // Reset counter on success
    
    // Set up connection monitoring
    setupConnectionMonitoring();
    
  } catch (error: any) {
    console.error(`❌ Database connection failed (attempt ${connectionAttempts}):`, error.message);
    
    // Force cleanup on connection errors
    if (client) {
      try {
        await client.end({ timeout: 2 });
      } catch {}
      client = null as any;
    }
    
    if (connectionAttempts < maxConnectionAttempts) {
      const delay = Math.min(baseRetryDelay * Math.pow(2, connectionAttempts - 1), 30000);
      console.log(`🔄 Retrying database connection in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return initializeConnection();
    } else {
      console.error('💥 Maximum database connection attempts reached. Application will continue in degraded mode.');
      // Don't throw error - allow application to start in degraded mode
    }
  }
}

// Monitor connection health and auto-reconnect with enhanced port management
function setupConnectionMonitoring(): void {
  setInterval(async () => {
    try {
      if (client) {
        // Enhanced health check with connection info
        const result = await Promise.race([
          client`SELECT 1, pg_backend_pid() as pid, inet_server_addr() as addr, inet_server_port() as port`,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 10000))
        ]);
        
        // Log connection details for monitoring
        if (Array.isArray(result) && result[0]) {
          console.log(`💓 Database health check passed - PID: ${result[0].pid}, Port: ${result[0].port}`);
        }
      } else {
        console.warn('⚠️ No database client available, attempting reconnection...');
        await initializeConnection();
      }
    } catch (error: any) {
      console.warn('⚠️ Database connection health check failed:', error.message);
      console.log('🔄 Attempting automatic reconnection...');
      await initializeConnection();
    }
  }, 25000); // Check every 25 seconds for more responsive monitoring
}

// Wrapper for database operations with enhanced retry and port stability
export async function executeQuery<T>(operation: () => Promise<T>): Promise<T> {
  let attempts = 0;
  const maxAttempts = 6; // Further increased max attempts
  
  while (attempts < maxAttempts) {
    try {
      if (!client) {
        await initializeConnection();
      }
      
      // Wrap operation with timeout to prevent hanging
      const operationPromise = operation();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query execution timeout')), 45000)
      );
      
      return await Promise.race([operationPromise, timeoutPromise]);
      
    } catch (error: any) {
      attempts++;
      
      // Enhanced connection error detection including port issues
      const isConnectionError = error?.code === 'ECONNRESET' || 
                               error?.code === 'ENOTFOUND' || 
                               error?.code === 'ENOENT' ||
                               error?.code === 'ECONNREFUSED' ||
                               error?.code === 'EPIPE' ||
                               error?.code === 'ETIMEDOUT' ||
                               error?.message?.toLowerCase().includes('connection') ||
                               error?.message?.toLowerCase().includes('connect') ||
                               error?.message?.toLowerCase().includes('timeout') ||
                               error?.message?.toLowerCase().includes('port') ||
                               error?.message?.toLowerCase().includes('nonce') ||
                               error?.message?.toLowerCase().includes('socket');
      
      if (isConnectionError && attempts < maxAttempts) {
        console.warn(`🔄 Database operation failed (attempt ${attempts}/${maxAttempts}) - ${error.message}, retrying...`);
        
        // Force complete reconnection with port cleanup
        if (client) {
          try {
            await client.end({ timeout: 3 });
          } catch (cleanupError) {
            console.warn('⚠️ Error during connection cleanup:', cleanupError);
          }
          client = null as any;
        }
        
        // Progressive delay with jitter to avoid thundering herd
        const baseDelay = 1500 * Math.pow(1.5, attempts - 1);
        const jitter = Math.random() * 1000;
        const delay = Math.min(baseDelay + jitter, 20000);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's not a connection error or we've exhausted retries, log and throw
      const errorMsg = `Database operation failed after ${attempts} attempts: ${error.message}`;
      console.error(errorMsg);
      
      if (attempts >= maxAttempts) {
        console.error('💥 All database retry attempts exhausted');
      }
      
      throw error;
    }
  }
  
  throw new Error('Database operation failed after maximum retry attempts');
}

// Initialize connection with additional error handling
initializeConnection().catch((error) => {
  console.error('Initial database connection failed:', error);
  console.log('💡 The application will continue in degraded mode');
  console.log('💡 Database will retry connecting automatically');
});

// Export the database instance with fallback handling
export { client, db };

// Enhanced connection test with retry logic
export async function testConnection(): Promise<boolean> {
  try {
    return await executeQuery(async () => {
      if (!client) {
        await initializeConnection();
      }
      await client`SELECT 1`;
      console.log('✅ Database connection test successful');
      return true;
    });
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

// Graceful shutdown handler
export async function closeConnection(): Promise<void> {
  try {
    if (client) {
      await client.end();
      console.log('🔌 Database connection closed gracefully');
    }
  } catch (error) {
    console.error('⚠️ Error closing database connection:', error);
  }
}

// Export helper for checking connection status
export function isConnected(): boolean {
  return !!client;
}

// Handle process termination
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);
process.on('beforeExit', closeConnection);