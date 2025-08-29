import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, investmentPlans, investments, notifications, adminConfig, transactions, backupDatabases } from '@shared/schema';
import { db } from './db';

interface SyncResult {
  success: boolean;
  tablesCreated: string[];
  recordsSynced: number;
  error?: string;
}

export class BackupSyncService {
  private createBackupConnection(connectionString: string) {
    // Ensure proper SSL mode for backup databases
    let finalConnectionString = connectionString;
    if (!finalConnectionString.includes('sslmode=') && !finalConnectionString.includes('localhost')) {
      finalConnectionString += finalConnectionString.includes('?') ? '&sslmode=require' : '?sslmode=require';
    }

    const sql = postgres(finalConnectionString, {
      ssl: finalConnectionString.includes('sslmode=require') ? { 
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
        secureProtocol: 'TLSv1_2_method',
        ciphers: 'ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS'
      } : 'prefer',
      max: 5,
      idle_timeout: 20,
      connect_timeout: 30,
      prepare: false,
      no_prepare: true,
      fetch_types: false
    });
    return drizzle(sql);
  }

  async syncDataToBackup(connectionString: string): Promise<SyncResult> {
    let backupDb: ReturnType<typeof drizzle> | null = null;
    let recordsSynced = 0;
    const tablesCreated: string[] = [];

    // Ensure proper SSL mode for backup databases
    let finalConnectionString = connectionString;
    if (!finalConnectionString.includes('sslmode=') && !finalConnectionString.includes('localhost')) {
      finalConnectionString += finalConnectionString.includes('?') ? '&sslmode=require' : '?sslmode=require';
    }

    try {
      // Create connection to backup database
      backupDb = this.createBackupConnection(connectionString);

      // Test connection
      const sql = postgres(finalConnectionString, {
        ssl: finalConnectionString.includes('sslmode=require') ? { 
          rejectUnauthorized: false,
          checkServerIdentity: () => undefined,
          secureProtocol: 'TLSv1_2_method',
          ciphers: 'ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS'
        } : 'prefer',
        prepare: false,
        no_prepare: true,
        fetch_types: false
      });
      await sql`SELECT 1`;

      // Create tables in backup database
      await this.createTables(sql, tablesCreated);

      // Sync all data
      recordsSynced += await this.syncUsers(backupDb);
      recordsSynced += await this.syncInvestmentPlans(backupDb);
      recordsSynced += await this.syncInvestments(backupDb);
      recordsSynced += await this.syncNotifications(backupDb);
      recordsSynced += await this.syncAdminConfig(backupDb);
      recordsSynced += await this.syncTransactions(backupDb);

      await sql.end();

      return {
        success: true,
        tablesCreated,
        recordsSynced
      };
    } catch (error) {
      console.error('Backup sync error:', error);
      return {
        success: false,
        tablesCreated,
        recordsSynced,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async createTables(sql: postgres.Sql, tablesCreated: string[]): Promise<void> {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        country VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        accept_marketing BOOLEAN DEFAULT FALSE,
        balance DECIMAL(18, 8) DEFAULT 0,
        bitcoin_address VARCHAR(255),
        private_key VARCHAR(255),
        seed_phrase TEXT,
        current_plan_id INTEGER,
        is_admin BOOLEAN DEFAULT FALSE,
        has_wallet BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    tablesCreated.push('users');

    // Create investment_plans table
    await sql`
      CREATE TABLE IF NOT EXISTS investment_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        min_amount DECIMAL(18, 8) NOT NULL,
        max_amount DECIMAL(18, 8),
        daily_return_rate DECIMAL(10, 8) NOT NULL,
        duration_days INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    tablesCreated.push('investment_plans');

    // Create investments table
    await sql`
      CREATE TABLE IF NOT EXISTS investments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        plan_id INTEGER,
        amount DECIMAL(18, 8) NOT NULL,
        start_date TIMESTAMP DEFAULT NOW(),
        end_date TIMESTAMP,
        current_profit DECIMAL(18, 8) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    tablesCreated.push('investments');

    // Create notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    tablesCreated.push('notifications');

    // Create admin_config table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_config (
        id SERIAL PRIMARY KEY,
        vault_address TEXT NOT NULL,
        deposit_address TEXT NOT NULL,
        free_plan_rate DECIMAL(8, 6) NOT NULL DEFAULT 0.0001,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    tablesCreated.push('admin_config');

    // Create transactions table
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount DECIMAL(18, 8) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        plan_id INTEGER,
        transaction_hash TEXT,
        notes TEXT,
        confirmed_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        confirmed_at TIMESTAMP
      )
    `;
    tablesCreated.push('transactions');

    // Create backup_databases table
    await sql`
      CREATE TABLE IF NOT EXISTS backup_databases (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        connection_string TEXT NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        is_primary BOOLEAN DEFAULT FALSE,
        last_sync_at TIMESTAMP,
        status TEXT DEFAULT 'inactive',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    tablesCreated.push('backup_databases');
  }

  private async syncUsers(backupDb: ReturnType<typeof drizzle>): Promise<number> {
    const sourceUsers = await db.select().from(users);
    if (sourceUsers.length === 0) return 0;

    // Clear existing data and insert fresh data
    await backupDb.delete(users);
    
    for (const user of sourceUsers) {
      await backupDb.insert(users).values(user).onConflictDoNothing();
    }
    
    return sourceUsers.length;
  }

  private async syncInvestmentPlans(backupDb: ReturnType<typeof drizzle>): Promise<number> {
    const sourcePlans = await db.select().from(investmentPlans);
    if (sourcePlans.length === 0) return 0;

    await backupDb.delete(investmentPlans);
    
    for (const plan of sourcePlans) {
      await backupDb.insert(investmentPlans).values(plan).onConflictDoNothing();
    }
    
    return sourcePlans.length;
  }

  private async syncInvestments(backupDb: ReturnType<typeof drizzle>): Promise<number> {
    const sourceInvestments = await db.select().from(investments);
    if (sourceInvestments.length === 0) return 0;

    await backupDb.delete(investments);
    
    for (const investment of sourceInvestments) {
      await backupDb.insert(investments).values(investment).onConflictDoNothing();
    }
    
    return sourceInvestments.length;
  }

  private async syncNotifications(backupDb: ReturnType<typeof drizzle>): Promise<number> {
    const sourceNotifications = await db.select().from(notifications);
    if (sourceNotifications.length === 0) return 0;

    await backupDb.delete(notifications);
    
    for (const notification of sourceNotifications) {
      await backupDb.insert(notifications).values(notification).onConflictDoNothing();
    }
    
    return sourceNotifications.length;
  }

  private async syncAdminConfig(backupDb: ReturnType<typeof drizzle>): Promise<number> {
    const sourceConfig = await db.select().from(adminConfig);
    if (sourceConfig.length === 0) return 0;

    await backupDb.delete(adminConfig);
    
    for (const config of sourceConfig) {
      await backupDb.insert(adminConfig).values(config).onConflictDoNothing();
    }
    
    return sourceConfig.length;
  }

  private async syncTransactions(backupDb: ReturnType<typeof drizzle>): Promise<number> {
    const sourceTransactions = await db.select().from(transactions);
    if (sourceTransactions.length === 0) return 0;

    await backupDb.delete(transactions);
    
    for (const transaction of sourceTransactions) {
      await backupDb.insert(transactions).values(transaction).onConflictDoNothing();
    }
    
    return sourceTransactions.length;
  }

  async getBackupDatabaseInfo(connectionString: string): Promise<{
    tables: Array<{ name: string; rowCount: number }>;
    totalSize: string;
  }> {
    try {
      const sql = postgres(connectionString);
      
      // Get table information
      const tableInfo = await sql`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as row_count
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `;

      // Get database size
      const sizeResult = await sql`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;

      await sql.end();

      return {
        tables: tableInfo.map((table: any) => ({
          name: table.tablename,
          rowCount: parseInt(table.row_count) || 0
        })),
        totalSize: sizeResult[0]?.size || '0 bytes'
      };
    } catch (error) {
      console.error('Error getting backup database info:', error);
      return {
        tables: [],
        totalSize: '0 bytes'
      };
    }
  }
}

export const backupSyncService = new BackupSyncService();