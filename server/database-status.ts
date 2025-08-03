
import { testConnection, isConnected, getEndpointStatus, forceEndpointRecovery } from './db';

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
    endpointStatus?: { isDisabled: boolean; lastError: Date | null; timeSinceError: number | null };
  }> {
    try {
      // Check endpoint status first
      const endpointStatus = getEndpointStatus();
      
      // If endpoint was recently disabled, attempt recovery
      if (endpointStatus.isDisabled && endpointStatus.timeSinceError && endpointStatus.timeSinceError > 30000) {
        console.log('🔧 Attempting automatic endpoint recovery...');
        await forceEndpointRecovery();
      }
      
      const connected = await testConnection();
      
      if (connected) {
        // Get detailed connection info for monitoring
        try {
          const { executeQuery, client } = await import('./db');
          const connectionInfo = await executeQuery(async () => {
            if (client) {
              const result = await client`SELECT pg_backend_pid() as pid, inet_server_addr() as addr, inet_server_port() as port, now() as timestamp`;
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
          message: 'Database connection healthy - endpoint active and stable',
          portInfo: this.lastPortInfo,
          endpointStatus: getEndpointStatus()
        };
      } else {
        this.connectionFailures++;
        this.isCurrentlyHealthy = false;
        
        const endpointInfo = getEndpointStatus();
        const message = endpointInfo.isDisabled 
          ? 'Database endpoint is disabled - implementing recovery protocol'
          : 'Database connection test failed - checking stability';
        
        return {
          isHealthy: false,
          lastSuccess: this.lastSuccessfulConnection,
          failures: this.connectionFailures,
          message,
          endpointStatus: endpointInfo
        };
      }
    } catch (error: any) {
      this.connectionFailures++;
      this.isCurrentlyHealthy = false;
      
      // Enhanced error classification
      const isEndpointError = error.message?.includes('endpoint is disabled') ||
                             error.message?.includes('Control plane request failed') ||
                             error.message?.includes('Server error') ||
                             error.code === 'NeonDbError';
      
      const isPortError = error.message?.toLowerCase().includes('port') ||
                         error.message?.toLowerCase().includes('nonce') ||
                         error.message?.toLowerCase().includes('socket') ||
                         error.code === 'ECONNREFUSED';
      
      let message = error.message || 'Database connection error';
      
      if (isEndpointError) {
        message = `CRITICAL ENDPOINT ERROR: ${error.message} - Implementing recovery protocol`;
        // Trigger immediate recovery attempt for endpoint errors
        setTimeout(async () => {
          try {
            await forceEndpointRecovery();
          } catch (recoveryError) {
            console.error('❌ Automatic endpoint recovery failed:', recoveryError);
          }
        }, 5000);
      } else if (isPortError) {
        message = `Port/connection stability issue: ${error.message}`;
      }
      
      return {
        isHealthy: false,
        lastSuccess: this.lastSuccessfulConnection,
        failures: this.connectionFailures,
        message,
        endpointStatus: getEndpointStatus()
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
