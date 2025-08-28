import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { users, investmentPlans, investments, notifications, adminConfig, transactions } from '@shared/schema';

interface BackupSyncStatus {
  activeConnections: number;
  queueLength: number;
  connections: BackupConnection[];
}

interface BackupConnection {
  id: number;
  name: string;
  client: postgres.Sql;
  db: ReturnType<typeof drizzle>;
  isActive: boolean;
  lastSyncAt: Date;
  errorCount: number;
}

class RealtimeBackupSync {
  private connections: Map<number, BackupConnection> = new Map();
  private syncQueue: Array<{ connectionId: number; operation: string; data: any }> = [];
  private isProcessing = false;

  async connectToBackupDatabase(id: number, name: string, connectionString: string): Promise<boolean> {
    try {
      const client = postgres(connectionString, {
        ssl: connectionString.includes('sslmode=require') ? 'require' : { rejectUnauthorized: false },
        max: 5,
        idle_timeout: 20,
        connect_timeout: 10,
      });

      // Test connection
      await client`SELECT 1`;

      const connection: BackupConnection = {
        id,
        name,
        client,
        db: drizzle(client),
        isActive: true,
        lastSyncAt: new Date(),
        errorCount: 0
      };

      this.connections.set(id, connection);
      console.log(`✅ Connected to backup database: ${name}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to connect to backup database ${name}:`, error.message);
      return false;
    }
  }

  disconnectBackupDatabase(id: number): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.client.end();
      this.connections.delete(id);
      console.log(`🔌 Disconnected from backup database: ${connection.name}`);
    }
  }

  getConnectionStatus(): BackupSyncStatus {
    return {
      activeConnections: this.connections.size,
      queueLength: this.syncQueue.length,
      connections: Array.from(this.connections.values()).map(conn => ({
        id: conn.id,
        name: conn.name,
        isActive: conn.isActive,
        lastSyncAt: conn.lastSyncAt.toISOString(),
        errorCount: conn.errorCount
      }))
    };
  }

  async syncToAllConnections(operation: string, data: any): Promise<void> {
    for (const connection of this.connections.values()) {
      this.syncQueue.push({
        connectionId: connection.id,
        operation,
        data
      });
    }

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift()!;
      const connection = this.connections.get(item.connectionId);

      if (!connection) continue;

      try {
        await this.executeOperation(connection, item.operation, item.data);
        connection.lastSyncAt = new Date();
        connection.errorCount = 0;
        connection.isActive = true;
      } catch (error: any) {
        console.error(`❌ Sync failed for ${connection.name}:`, error.message);
        connection.errorCount++;
        if (connection.errorCount > 5) {
          connection.isActive = false;
        }
      }
    }

    this.isProcessing = false;
  }

  private async executeOperation(connection: BackupConnection, operation: string, data: any): Promise<void> {
    switch (operation) {
      case 'user_update':
        await connection.db.insert(users).values(data).onConflictDoUpdate({
          target: users.id,
          set: data
        });
        break;
      case 'investment_update':
        await connection.db.insert(investments).values(data).onConflictDoUpdate({
          target: investments.id,
          set: data
        });
        break;
      case 'notification_create':
        await connection.db.insert(notifications).values(data);
        break;
      // Add more operations as needed
    }
  }

  destroy(): void {
    for (const connection of this.connections.values()) {
      connection.client.end();
    }
    this.connections.clear();
    this.syncQueue = [];
  }
}

export const realtimeBackupSync = new RealtimeBackupSync();

interface SyncOperation {
  id: string;
  timestamp: Date;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  retryCount: number;
}

export class RealtimeBackupSync {
  private activeConnections: Map<number, BackupConnection> = new Map();
  private syncQueue: SyncOperation[] = [];
  private isProcessingQueue = false;
  private maxRetries = 5;
  private reconnectInterval = 30000; // 30 seconds

  constructor() {
    this.initializeBackupConnections();
    this.startQueueProcessor();
    this.startReconnectionMonitor();
    
    console.log('🔄 Real-time backup sync service initialized');
  }

  private async initializeBackupConnections() {
    try {
      // We'll initialize connections when storage is available
      console.log(`📡 Real-time backup sync ready to connect`);
    } catch (error: any) {
      console.error('❌ Error initializing backup connections:', error);
    }
  }

  private async createBackupConnection(backup: any) {
    try {
      const client = postgres(backup.connectionString, {
        ssl: { rejectUnauthorized: false },
        max: 3,
        idle_timeout: 20,
        connect_timeout: 15,
        prepare: false,
        onnotice: () => {}, // Suppress notices
      });

      const db = drizzle(client);
      
      // Test connection
      await client`SELECT 1`;
      
      const connection: BackupConnection = {
        id: backup.id,
        name: backup.name,
        client,
        db,
        isActive: true,
        lastSyncAt: new Date(),
        errorCount: 0
      };

      this.activeConnections.set(backup.id, connection);
      
      console.log(`✅ Connected to backup database: ${backup.name}`);
    } catch (error: any) {
      console.error(`❌ Failed to connect to backup database ${backup.name}:`, error);
    }
  }

  private async disconnectBackup(backupId: number) {
    const connection = this.activeConnections.get(backupId);
    if (connection) {
      try {
        await connection.client.end();
        this.activeConnections.delete(backupId);
        console.log(`🔌 Disconnected from backup database: ${connection.name}`);
      } catch (error) {
        console.error(`❌ Error disconnecting backup ${connection.name}:`, error);
      }
    }
  }

  // Main method to sync data in real-time
  async syncDataChange(table: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', data: any) {
    if (this.activeConnections.size === 0) {
      return; // No active backup connections
    }

    const syncOperation: SyncOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      table,
      operation,
      data,
      retryCount: 0
    };

    this.syncQueue.push(syncOperation);
    console.log(`📤 Queued ${operation} operation for ${table} table`);
  }

  private startQueueProcessor() {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.syncQueue.length > 0) {
        await this.processQueue();
      }
    }, 1000); // Process queue every second
  }

  private async processQueue() {
    if (this.syncQueue.length === 0 || this.activeConnections.size === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const operation = this.syncQueue.shift();
      if (!operation) return;

      const connectionsArray = [...this.activeConnections.values()];
      const promises = connectionsArray.map(connection =>
        this.executeOperationOnBackup(connection, operation)
      );

      const results = await Promise.allSettled(promises);
      
      // Check for failures and retry if needed
      const connectionsArray2 = [...this.activeConnections.values()];
      const failedConnections = results
        .map((result, index) => ({ result, connection: connectionsArray2[index] }))
        .filter(({ result }) => result.status === 'rejected');

      if (failedConnections.length > 0 && operation.retryCount < this.maxRetries) {
        operation.retryCount++;
        this.syncQueue.unshift(operation); // Put back at front for retry
        
        console.log(`⚠️ ${failedConnections.length} backups failed, retry ${operation.retryCount}/${this.maxRetries}`);
        
        // Handle failed connections
        for (const { connection } of failedConnections) {
          connection.errorCount++;
          if (connection.errorCount >= 3) {
            await this.disconnectBackup(connection.id);
          }
        }
      } else if (operation.retryCount >= this.maxRetries) {
        console.error(`❌ Operation failed after ${this.maxRetries} retries:`, operation);
      } else {
        console.log(`✅ Successfully synced ${operation.operation} to ${this.activeConnections.size} backup(s)`);
        
        // Reset error counts on success
        const connectionsArray3 = [...this.activeConnections.values()];
        for (const connection of connectionsArray3) {
          connection.errorCount = 0;
          connection.lastSyncAt = new Date();
        }
      }
    } catch (error) {
      console.error('❌ Error processing sync queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async executeOperationOnBackup(connection: BackupConnection, operation: SyncOperation) {
    const { table, operation: op, data } = operation;

    try {
      switch (table) {
        case 'users':
          await this.syncUsersOperation(connection.db, op, data);
          break;
        case 'investments':
          await this.syncInvestmentsOperation(connection.db, op, data);
          break;
        case 'transactions':
          await this.syncTransactionsOperation(connection.db, op, data);
          break;
        case 'notifications':
          await this.syncNotificationsOperation(connection.db, op, data);
          break;
        case 'admin_config':
          await this.syncAdminConfigOperation(connection.db, op, data);
          break;
        case 'investment_plans':
          await this.syncInvestmentPlansOperation(connection.db, op, data);
          break;
        default:
          throw new Error(`Unsupported table: ${table}`);
      }
    } catch (error) {
      console.error(`❌ Failed to sync ${op} on ${table} to ${connection.name}:`, error);
      throw error;
    }
  }

  private async syncUsersOperation(db: ReturnType<typeof drizzle>, operation: string, data: any) {
    switch (operation) {
      case 'INSERT':
        await db.insert(users).values(data).onConflictDoNothing();
        break;
      case 'UPDATE':
        await db.update(users).set(data.updates).where(eq(users.id, data.id));
        break;
      case 'DELETE':
        await db.delete(users).where(eq(users.id, data.id));
        break;
    }
  }

  private async syncInvestmentsOperation(db: ReturnType<typeof drizzle>, operation: string, data: any) {
    switch (operation) {
      case 'INSERT':
        await db.insert(investments).values(data).onConflictDoNothing();
        break;
      case 'UPDATE':
        await db.update(investments).set(data.updates).where(eq(investments.id, data.id));
        break;
      case 'DELETE':
        await db.delete(investments).where(eq(investments.id, data.id));
        break;
    }
  }

  private async syncTransactionsOperation(db: ReturnType<typeof drizzle>, operation: string, data: any) {
    switch (operation) {
      case 'INSERT':
        await db.insert(transactions).values(data).onConflictDoNothing();
        break;
      case 'UPDATE':
        await db.update(transactions).set(data.updates).where(eq(transactions.id, data.id));
        break;
      case 'DELETE':
        await db.delete(transactions).where(eq(transactions.id, data.id));
        break;
    }
  }

  private async syncNotificationsOperation(db: ReturnType<typeof drizzle>, operation: string, data: any) {
    switch (operation) {
      case 'INSERT':
        await db.insert(notifications).values(data).onConflictDoNothing();
        break;
      case 'UPDATE':
        await db.update(notifications).set(data.updates).where(eq(notifications.id, data.id));
        break;
      case 'DELETE':
        await db.delete(notifications).where(eq(notifications.id, data.id));
        break;
    }
  }

  private async syncAdminConfigOperation(db: ReturnType<typeof drizzle>, operation: string, data: any) {
    switch (operation) {
      case 'INSERT':
        await db.insert(adminConfig).values(data).onConflictDoNothing();
        break;
      case 'UPDATE':
        await db.update(adminConfig).set(data.updates).where(eq(adminConfig.id, data.id));
        break;
      case 'DELETE':
        await db.delete(adminConfig).where(eq(adminConfig.id, data.id));
        break;
    }
  }

  private async syncInvestmentPlansOperation(db: ReturnType<typeof drizzle>, operation: string, data: any) {
    switch (operation) {
      case 'INSERT':
        await db.insert(investmentPlans).values(data).onConflictDoNothing();
        break;
      case 'UPDATE':
        await db.update(investmentPlans).set(data.updates).where(eq(investmentPlans.id, data.id));
        break;
      case 'DELETE':
        await db.delete(investmentPlans).where(eq(investmentPlans.id, data.id));
        break;
    }
  }

  private startReconnectionMonitor() {
    setInterval(async () => {
      try {
        // We'll get backup databases when storage is available
        // const backupDatabases = await storage.getBackupDatabases();
        
        // Handle reconnection logic here when storage is available
      } catch (error) {
        console.error('❌ Error in reconnection monitor:', error);
      }
    }, this.reconnectInterval);
  }

  // Public methods for managing connections
  async addBackupDatabase(backup: any) {
    if (backup && backup.isActive) {
      await this.createBackupConnection(backup);
    }
  }

  async removeBackupDatabase(backupId: number) {
    await this.disconnectBackup(backupId);
  }

  getConnectionStatus() {
    return {
      activeConnections: this.activeConnections.size,
      queueLength: this.syncQueue.length,
      connections: [...this.activeConnections.values()].map(conn => ({
        id: conn.id,
        name: conn.name,
        isActive: conn.isActive,
        lastSyncAt: conn.lastSyncAt,
        errorCount: conn.errorCount
      }))
    };
  }

  async close() {
    console.log('🔌 Closing all backup connections...');
    
    const connectionsArray4 = [...this.activeConnections.values()];
    for (const connection of connectionsArray4) {
      try {
        await connection.client.end();
      } catch (error: any) {
        console.error(`Error closing connection to ${connection.name}:`, error);
      }
    }
    
    this.activeConnections.clear();
    console.log('✅ All backup connections closed');
  }
}

// Export singleton instance
export const realtimeBackupSync = new RealtimeBackupSync();