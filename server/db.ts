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

// Enhanced connection configuration with robust retry logic
const connectionConfig = {
  max: 10, // Reduced pool size for stability
  idle_timeout: 30, // Close idle connections after 30 seconds
  connect_timeout: 60, // Increased connection timeout
  prepare: false, // Disable prepared statements for better compatibility
  onnotice: () => {}, // Suppress notices
  connection: {
    application_name: 'plus500_investment_platform',
    statement_timeout: 60000, // 60 second query timeout
    idle_in_transaction_session_timeout: 120000, // 2 minute idle transaction timeout
  },
  transform: postgres.camel, // Convert snake_case to camelCase
  retry: 5, // Increased retry attempts
  backoff: 'exponential', // Exponential backoff for retries
  ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
};

let client: postgres.Sql;
let db: ReturnType<typeof drizzle>;
let connectionAttempts = 0;
const maxConnectionAttempts = 10;
const baseRetryDelay = 1000; // 1 second base delay

// Initialize connection with retry logic
async function initializeConnection(): Promise<void> {
  connectionAttempts++;
  
  try {
    if (client) {
      await client.end();
    }
    
    client = postgres(databaseUrl, connectionConfig);
    db = drizzle(client, { schema });
    
    // Test the connection
    await client`SELECT 1`;
    console.log(`✅ Database connection successful (attempt ${connectionAttempts})`);
    connectionAttempts = 0; // Reset counter on success
    
    // Set up connection monitoring
    setupConnectionMonitoring();
    
  } catch (error) {
    console.error(`❌ Database connection failed (attempt ${connectionAttempts}):`, error);
    
    if (connectionAttempts < maxConnectionAttempts) {
      const delay = baseRetryDelay * Math.pow(2, connectionAttempts - 1);
      console.log(`🔄 Retrying database connection in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return initializeConnection();
    } else {
      console.error('💥 Maximum database connection attempts reached. Application may have limited functionality.');
      // Don't throw error - allow application to start in degraded mode
    }
  }
}

// Monitor connection health and auto-reconnect
function setupConnectionMonitoring(): void {
  setInterval(async () => {
    try {
      if (client) {
        await client`SELECT 1`;
      }
    } catch (error) {
      console.warn('⚠️ Database connection health check failed, attempting reconnection...');
      await initializeConnection();
    }
  }, 30000); // Check every 30 seconds
}

// Wrapper for database operations with automatic retry
export async function executeQuery<T>(operation: () => Promise<T>): Promise<T> {
  let attempts = 0;
  const maxAttempts = 5; // Increased max attempts
  
  while (attempts < maxAttempts) {
    try {
      if (!client) {
        await initializeConnection();
      }
      return await operation();
    } catch (error: any) {
      attempts++;
      
      // Check if it's a connection error
      const isConnectionError = error?.code === 'ECONNRESET' || 
                               error?.code === 'ENOTFOUND' || 
                               error?.code === 'ENOENT' ||
                               error?.message?.includes('connection') ||
                               error?.message?.includes('connect') ||
                               error?.message?.includes('timeout');
      
      if (isConnectionError) {
        console.warn(`🔄 Database operation failed (attempt ${attempts}/${maxAttempts}), retrying...`);
        
        if (attempts < maxAttempts) {
          // Force reconnection
          if (client) {
            try {
              await client.end();
            } catch {}
            client = null as any;
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
          continue;
        }
      }
      
      // If it's not a connection error or we've exhausted retries, throw
      console.error(`Database operation failed after ${attempts} attempts:`, error.message);
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