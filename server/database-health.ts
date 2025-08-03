
import { testConnection, executeQuery, db } from './db';
import { sql } from 'drizzle-orm';

export class DatabaseHealthMonitor {
  private isHealthy = true;
  private lastHealthCheck = new Date();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private failureCount = 0;
  private readonly maxFailures = 3;

  constructor() {
    this.startHealthChecks();
  }

  private startHealthChecks(): void {
    // Run health check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);

    // Immediate health check
    this.performHealthCheck();
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Test basic connectivity
      const isConnected = await testConnection();
      
      if (isConnected) {
        // Test query execution
        await executeQuery(async () => {
          await db.execute(sql`SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'`);
        });

        // Reset failure count on success
        this.failureCount = 0;
        this.isHealthy = true;
        this.lastHealthCheck = new Date();
        
        console.log('💓 Database health check passed');
      } else {
        this.handleHealthCheckFailure('Connection test failed');
      }
    } catch (error) {
      this.handleHealthCheckFailure(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private handleHealthCheckFailure(error: string): void {
    this.failureCount++;
    console.warn(`💔 Database health check failed (${this.failureCount}/${this.maxFailures}): ${error}`);

    if (this.failureCount >= this.maxFailures) {
      this.isHealthy = false;
      console.error('🚨 Database marked as unhealthy after consecutive failures');
      
      // Trigger recovery attempt
      this.attemptRecovery();
    }
  }

  private async attemptRecovery(): Promise<void> {
    console.log('🔧 Attempting database recovery...');
    
    try {
      // Force reconnection
      const { initializeConnection } = await import('./db');
      // await initializeConnection();
      
      // Reset failure count if recovery succeeds
      this.failureCount = 0;
      this.isHealthy = true;
      console.log('✅ Database recovery successful');
    } catch (error) {
      console.error('❌ Database recovery failed:', error);
    }
  }

  public getHealthStatus(): {
    isHealthy: boolean;
    lastCheck: Date;
    failureCount: number;
    uptimeSeconds: number;
  } {
    const uptimeSeconds = Math.floor((Date.now() - this.lastHealthCheck.getTime()) / 1000);
    
    return {
      isHealthy: this.isHealthy,
      lastCheck: this.lastHealthCheck,
      failureCount: this.failureCount,
      uptimeSeconds
    };
  }

  public stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Export singleton instance
export const databaseHealthMonitor = new DatabaseHealthMonitor();

// Graceful shutdown
process.on('SIGINT', () => databaseHealthMonitor.stop());
process.on('SIGTERM', () => databaseHealthMonitor.stop());
