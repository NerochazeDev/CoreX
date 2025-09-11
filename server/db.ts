import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Clean and validate the DATABASE_URL from environment secrets
let databaseUrl = process.env.DATABASE_URL.trim();

// Fix duplicate DATABASE_URL= prefix if present
if (databaseUrl.startsWith('DATABASE_URL=')) {
  databaseUrl = databaseUrl.substring('DATABASE_URL='.length);
}

// Remove any trailing file paths or socket references that might be invalid
databaseUrl = databaseUrl.replace(/\/\.s\.PGSQL\.\d+$/, '');

// Ensure proper SSL mode for production databases
if (!databaseUrl.includes('sslmode=') && !databaseUrl.includes('localhost')) {
  databaseUrl += databaseUrl.includes('?') ? '&sslmode=require' : '?sslmode=require';
}

console.log('🔗 Using database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

// Enhanced connection configuration with endpoint failure protection
const connectionConfig = {
  max: 12, // Increased pool size for better availability
  idle_timeout: 15, // Shorter idle timeout to prevent endpoint disable
  connect_timeout: 120, // Extended connection timeout for slow endpoints
  prepare: false, // Disable prepared statements for better compatibility
  onnotice: () => {}, // Suppress notices
  onparameter: () => {}, // Suppress parameter notices
  connection: {
    application_name: 'bitvault_investment_platform_persistent',
    statement_timeout: 60000, // 60 second query timeout
    idle_in_transaction_session_timeout: 120000, // 120 second idle transaction timeout
    tcp_keepalives_idle: 30, // More frequent keepalives to prevent endpoint disable
    tcp_keepalives_interval: 5,
    tcp_keepalives_count: 6,
    lock_timeout: 30000, // 30 second lock timeout
  },
  transform: postgres.camel, // Convert snake_case to camelCase
  retry: 10, // Maximum retry attempts for endpoint issues
  // backoff: 'exponential', // Exponential backoff for retries - removed for compatibility
  ssl: databaseUrl.includes('sslmode=require') ? { 
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
    // Additional SSL options for stability
    secureProtocol: 'TLSv1_2_method',
    ciphers: 'ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS'
  } : false,
  socket_timeout: 600, // 10 minute socket timeout
  // keep_alive: true, // Enable TCP keep-alive - removed for compatibility
  // Additional options for endpoint stability
  no_prepare: true, // Disable prepared statements completely
  fetch_types: false, // Disable automatic type fetching
};

let client: postgres.Sql;
let db: ReturnType<typeof drizzle>;
let connectionAttempts = 0;
const maxConnectionAttempts = 15; // Increased for endpoint issues
const baseRetryDelay = 2000; // 2 second base delay
let lastEndpointError: Date | null = null;
let isEndpointDisabled = false;
let keepAliveInterval: NodeJS.Timeout | null = null;
let lastHealthLogTime: number = 0;
let lastKeepAliveLogTime: number = 0;

// Initialize connection with endpoint failure protection
async function initializeConnection(): Promise<void> {
  connectionAttempts++;
  
  try {
    // Clear keep-alive interval if exists
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
    
    // Gracefully close existing connection and clean up ports
    if (client) {
      try {
        await client.end({ timeout: 8 });
      } catch (closeError) {
        console.warn('⚠️ Error closing previous connection:', closeError);
      }
      client = null as any;
    }
    
    // Extended delay for endpoint recovery if previously disabled
    if (isEndpointDisabled && connectionAttempts > 1) {
      const recoveryDelay = 15000; // 15 seconds for endpoint recovery
      console.log(`⏳ Waiting ${recoveryDelay}ms for endpoint recovery...`);
      await new Promise(resolve => setTimeout(resolve, recoveryDelay));
    } else if (connectionAttempts > 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    client = postgres(databaseUrl, connectionConfig);
    db = drizzle(client, { schema });
    
    // Enhanced connection test with endpoint status check
    const testPromise = client`SELECT 1 as status, current_database(), inet_server_addr(), inet_server_port(), version()`;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection test timeout - possible endpoint issue')), 45000)
    );
    
    const result = await Promise.race([testPromise, timeoutPromise]);
    console.log(`✅ Database connection successful (attempt ${connectionAttempts}) - Endpoint active`);
    
    // Reset failure states on success
    connectionAttempts = 0;
    isEndpointDisabled = false;
    lastEndpointError = null;
    
    // Set up connection monitoring and keep-alive
    setupConnectionMonitoring();
    setupEndpointKeepAlive();
    
  } catch (error: any) {
    const errorMessage = error.message || '';
    const isEndpointError = errorMessage.includes('endpoint is disabled') ||
                           errorMessage.includes('Control plane request failed') ||
                           errorMessage.includes('Server error') ||
                           error.code === 'NeonDbError';
    
    if (isEndpointError) {
      isEndpointDisabled = true;
      lastEndpointError = new Date();
      console.error(`🚨 ENDPOINT DISABLED ERROR (attempt ${connectionAttempts}): ${errorMessage}`);
      console.log('🔧 Implementing endpoint recovery strategy...');
    } else {
      console.error(`❌ Database connection failed (attempt ${connectionAttempts}): ${errorMessage}`);
    }
    
    // Force cleanup on connection errors
    if (client) {
      try {
        await client.end({ timeout: 3 });
      } catch {}
      client = null as any;
    }
    
    if (connectionAttempts < maxConnectionAttempts) {
      // Extended delays for endpoint errors
      const baseDelay = isEndpointError ? 10000 : baseRetryDelay;
      const delay = Math.min(baseDelay * Math.pow(1.8, connectionAttempts - 1), 60000);
      
      console.log(`🔄 Retrying ${isEndpointError ? 'endpoint recovery' : 'database connection'} in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return initializeConnection();
    } else {
      console.error('💥 Maximum database connection attempts reached. Application will continue in degraded mode.');
      console.log('💡 Endpoint issues may require manual intervention or time to resolve');
    }
  }
}

// Monitor connection health and auto-reconnect with endpoint protection
function setupConnectionMonitoring(): void {
  setInterval(async () => {
    try {
      if (client) {
        // Enhanced health check with endpoint status verification
        const result = await Promise.race([
          client`SELECT 1 as healthy, pg_backend_pid() as pid, inet_server_addr() as addr, inet_server_port() as port, now() as timestamp`,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout - possible endpoint issue')), 15000))
        ]);
        
        // Log connection details for monitoring (reduced frequency)
        if (Array.isArray(result) && result[0]) {
          // Only log health checks every 5 minutes instead of every 20 seconds
          const now = Date.now();
          if (!lastHealthLogTime || (now - lastHealthLogTime) > 300000) {
            console.log(`💓 Database healthy - PID: ${result[0].pid}, Port: ${result[0].port}`);
            lastHealthLogTime = now;
          }
          
          // Reset endpoint failure state on successful health check
          if (isEndpointDisabled) {
            isEndpointDisabled = false;
            console.log('✅ Endpoint recovered and operational');
          }
        }
      } else {
        console.warn('⚠️ No database client available, attempting reconnection...');
        await initializeConnection();
      }
    } catch (error: any) {
      const isEndpointError = error.message?.includes('endpoint') || 
                             error.message?.includes('Control plane') ||
                             error.message?.includes('Server error');
      
      if (isEndpointError) {
        isEndpointDisabled = true;
        lastEndpointError = new Date();
        console.warn('🚨 Endpoint health check failed - endpoint may be disabled:', error.message);
      } else {
        console.warn('⚠️ Database connection health check failed:', error.message);
      }
      
      console.log('🔄 Attempting automatic reconnection...');
      await initializeConnection();
    }
  }, 20000); // Check every 20 seconds for faster endpoint issue detection
}

// Keep endpoint active to prevent automatic disable
function setupEndpointKeepAlive(): void {
  // Prevent endpoint from going idle by running lightweight queries
  keepAliveInterval = setInterval(async () => {
    try {
      if (client && !isEndpointDisabled) {
        // Lightweight query to keep endpoint active
        await Promise.race([
          client`SELECT 1 as keepalive, extract(epoch from now()) as timestamp`,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Keep-alive timeout')), 8000))
        ]);
        
        // Reduced logging for keep-alive (only every 10 minutes)
        const now = Date.now();
        if (!lastKeepAliveLogTime || (now - lastKeepAliveLogTime) > 600000) {
          console.log('🔄 Database endpoint active');
          lastKeepAliveLogTime = now;
        }
      }
    } catch (error: any) {
      const isEndpointError = error.message?.includes('endpoint') || 
                             error.message?.includes('Control plane');
      
      if (isEndpointError) {
        console.warn('⚠️ Keep-alive detected endpoint issue:', error.message);
        isEndpointDisabled = true;
        lastEndpointError = new Date();
      } else {
        console.warn('⚠️ Keep-alive failed:', error.message);
      }
    }
  }, 180000); // Every 3 minutes to prevent endpoint idle timeout
}

// Wrapper for database operations with endpoint failure protection
export async function executeQuery<T>(operation: () => Promise<T>): Promise<T> {
  let attempts = 0;
  const maxAttempts = 8; // Increased for endpoint issues
  
  while (attempts < maxAttempts) {
    try {
      if (!client) {
        await initializeConnection();
      }
      
      // Enhanced timeout handling for slow endpoints
      const operationPromise = operation();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query execution timeout - possible endpoint slowdown')), 60000)
      );
      
      return await Promise.race([operationPromise, timeoutPromise]);
      
    } catch (error: any) {
      attempts++;
      
      // Enhanced error detection including endpoint-specific errors
      const isEndpointError = error?.message?.includes('endpoint is disabled') ||
                             error?.message?.includes('Control plane request failed') ||
                             error?.message?.includes('Server error') ||
                             error?.code === 'NeonDbError' ||
                             error?.message?.includes('HTTP status 500');
      
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
      
      const shouldRetry = (isConnectionError || isEndpointError) && attempts < maxAttempts;
      
      if (shouldRetry) {
        if (isEndpointError) {
          isEndpointDisabled = true;
          lastEndpointError = new Date();
          console.warn(`🚨 ENDPOINT ERROR detected (attempt ${attempts}/${maxAttempts}): ${error.message}`);
          console.log('🔧 Initiating endpoint recovery protocol...');
        } else {
          console.warn(`🔄 Database operation failed (attempt ${attempts}/${maxAttempts}) - ${error.message}, retrying...`);
        }
        
        // Force complete reconnection with cleanup
        if (client) {
          try {
            await client.end({ timeout: 5 });
          } catch (cleanupError) {
            console.warn('⚠️ Error during connection cleanup:', cleanupError);
          }
          client = null as any;
        }
        
        // Extended delays for endpoint errors
        const baseDelay = isEndpointError ? 8000 : 2000;
        const multiplier = isEndpointError ? 2.0 : 1.5;
        const calculatedDelay = baseDelay * Math.pow(multiplier, attempts - 1);
        const jitter = Math.random() * 2000;
        const delay = Math.min(calculatedDelay + jitter, isEndpointError ? 45000 : 25000);
        
        console.log(`⏳ Waiting ${delay}ms before retry (${isEndpointError ? 'endpoint recovery' : 'reconnection'})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Log final error details
      const errorMsg = `Database operation failed after ${attempts} attempts: ${error.message}`;
      console.error(errorMsg);
      
      if (isEndpointError) {
        console.error('🚨 CRITICAL: Persistent endpoint failure detected');
        console.error('💡 This may require Neon database restart or plan upgrade');
      }
      
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

// Graceful shutdown handler with endpoint cleanup
export async function closeConnection(): Promise<void> {
  try {
    // Clear keep-alive interval
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
    
    if (client) {
      await client.end({ timeout: 10 });
      console.log('🔌 Database connection closed gracefully with endpoint cleanup');
    }
  } catch (error) {
    console.error('⚠️ Error closing database connection:', error);
  }
}

// Export helper for checking connection status
export function isConnected(): boolean {
  return !!client && !isEndpointDisabled;
}

// Export endpoint status helpers
export function getEndpointStatus(): {
  isDisabled: boolean;
  lastError: Date | null;
  timeSinceError: number | null;
} {
  return {
    isDisabled: isEndpointDisabled,
    lastError: lastEndpointError,
    timeSinceError: lastEndpointError ? Date.now() - lastEndpointError.getTime() : null
  };
}

// Force endpoint recovery
export async function forceEndpointRecovery(): Promise<boolean> {
  console.log('🔧 Forcing endpoint recovery...');
  isEndpointDisabled = false;
  lastEndpointError = null;
  connectionAttempts = 0;
  
  try {
    await initializeConnection();
    return true;
  } catch (error) {
    console.error('❌ Forced endpoint recovery failed:', error);
    return false;
  }
}

// Handle process termination
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);
process.on('beforeExit', closeConnection);