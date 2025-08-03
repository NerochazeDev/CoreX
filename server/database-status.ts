
import { testConnection, isConnected } from './db';

export class DatabaseStatus {
  private static lastSuccessfulConnection: Date | null = null;
  private static connectionFailures = 0;
  private static isCurrentlyHealthy = false;
  private static lastPortInfo: { pid?: number; port?: number; addr?: string } = {};

  static async checkHealth(): Promise<{
    isHealthy: boolean;
    lastSuccess: Date | null;
    failures: number;
    message: string;
    portInfo?: { pid?: number; port?: number; addr?: string };
  }> {
    try {
      const connected = await testConnection();
      
      if (connected) {
        // Get detailed connection info for port monitoring
        try {
          const { executeQuery, client } = await import('./db');
          const connectionInfo = await executeQuery(async () => {
            if (client) {
              const result = await client`SELECT pg_backend_pid() as pid, inet_server_addr() as addr, inet_server_port() as port`;
              return Array.isArray(result) && result[0] ? result[0] : {};
            }
            return {};
          });
          
          this.lastPortInfo = connectionInfo;
        } catch (infoError) {
          console.warn('⚠️ Could not retrieve connection info:', infoError);
        }
        
        this.lastSuccessfulConnection = new Date();
        this.connectionFailures = 0;
        this.isCurrentlyHealthy = true;
        
        return {
          isHealthy: true,
          lastSuccess: this.lastSuccessfulConnection,
          failures: this.connectionFailures,
          message: 'Database connection healthy with stable port',
          portInfo: this.lastPortInfo
        };
      } else {
        this.connectionFailures++;
        this.isCurrentlyHealthy = false;
        
        return {
          isHealthy: false,
          lastSuccess: this.lastSuccessfulConnection,
          failures: this.connectionFailures,
          message: 'Database connection test failed - checking port stability'
        };
      }
    } catch (error: any) {
      this.connectionFailures++;
      this.isCurrentlyHealthy = false;
      
      // Check for port-related errors
      const isPortError = error.message?.toLowerCase().includes('port') ||
                         error.message?.toLowerCase().includes('nonce') ||
                         error.message?.toLowerCase().includes('socket') ||
                         error.code === 'ECONNREFUSED';
      
      const message = isPortError 
        ? `Port/connection stability issue: ${error.message}`
        : error.message || 'Database connection error';
      
      return {
        isHealthy: false,
        lastSuccess: this.lastSuccessfulConnection,
        failures: this.connectionFailures,
        message
      };
    }
  }

  static getQuickStatus(): boolean {
    return this.isCurrentlyHealthy && isConnected();
  }

  static getPortInfo() {
    return this.lastPortInfo;
  }
}
