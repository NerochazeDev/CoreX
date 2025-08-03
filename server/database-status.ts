
import { testConnection, isConnected } from './db';

export class DatabaseStatus {
  private static lastSuccessfulConnection: Date | null = null;
  private static connectionFailures = 0;
  private static isCurrentlyHealthy = false;

  static async checkHealth(): Promise<{
    isHealthy: boolean;
    lastSuccess: Date | null;
    failures: number;
    message: string;
  }> {
    try {
      const connected = await testConnection();
      
      if (connected) {
        this.lastSuccessfulConnection = new Date();
        this.connectionFailures = 0;
        this.isCurrentlyHealthy = true;
        
        return {
          isHealthy: true,
          lastSuccess: this.lastSuccessfulConnection,
          failures: this.connectionFailures,
          message: 'Database connection healthy'
        };
      } else {
        this.connectionFailures++;
        this.isCurrentlyHealthy = false;
        
        return {
          isHealthy: false,
          lastSuccess: this.lastSuccessfulConnection,
          failures: this.connectionFailures,
          message: 'Database connection test failed'
        };
      }
    } catch (error: any) {
      this.connectionFailures++;
      this.isCurrentlyHealthy = false;
      
      return {
        isHealthy: false,
        lastSuccess: this.lastSuccessfulConnection,
        failures: this.connectionFailures,
        message: error.message || 'Database connection error'
      };
    }
  }

  static getQuickStatus(): boolean {
    return this.isCurrentlyHealthy && isConnected();
  }
}
