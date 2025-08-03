import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced connection configuration with robust retry logic
const connectionConfig = {
  host: process.env.DATABASE_URL,
  max: 20, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 30, // Connection timeout in seconds
  prepare: false, // Disable prepared statements for better compatibility
  onnotice: () => {}, // Suppress notices
  connection: {
    application_name: 'plus500_investment_platform',
    statement_timeout: 30000, // 30 second query timeout
    idle_in_transaction_session_timeout: 60000, // 1 minute idle transaction timeout
  },
  transform: postgres.camel, // Convert snake_case to camelCase
  retry: 3, // Retry failed queries 3 times
  backoff: 'exponential', // Exponential backoff for retries
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
    
    client = postgres(process.env.DATABASE_URL!, connectionConfig);
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
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      return await operation();
    } catch (error: any) {
      attempts++;
      
      // Check if it's a connection error
      if (error?.code === 'ECONNRESET' || error?.code === 'ENOTFOUND' || error?.message?.includes('connection')) {
        console.warn(`🔄 Database operation failed (attempt ${attempts}), retrying...`);
        
        if (attempts < maxAttempts) {
          await initializeConnection();
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw new Error('Database operation failed after maximum retry attempts');
}

// Initialize connection immediately
initializeConnection().catch(console.error);

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