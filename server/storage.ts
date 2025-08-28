import { users, investmentPlans, investments, notifications, adminConfig, transactions, backupDatabases, type User, type InsertUser, type InvestmentPlan, type InsertInvestmentPlan, type Investment, type InsertInvestment, type Notification, type InsertNotification, type AdminConfig, type InsertAdminConfig, type Transaction, type InsertTransaction, type BackupDatabase, type InsertBackupDatabase, type UpdateUserProfile } from "@shared/schema";
import { db, executeQuery } from "./db";
import { eq, desc, and, isNotNull, inArray } from "drizzle-orm";

// Import the real-time backup sync service
let realtimeBackupSync: any = null;

// Lazy load to prevent circular dependencies
async function getRealtimeSync() {
  if (!realtimeBackupSync) {
    const { realtimeBackupSync: syncService } = await import('./realtime-backup-sync');
    realtimeBackupSync = syncService;
  }
  return realtimeBackupSync;
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { bitcoinAddress: string | null; privateKey: string | null }): Promise<User>;
  updateUserBalance(id: number, balance: string): Promise<User | undefined>;
  updateUserPlan(id: number, planId: number | null): Promise<User | undefined>;
  updateUserProfile(id: number, profileData: Partial<UpdateUserProfile>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersWithPlans(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;

  // Investment plan operations
  getInvestmentPlans(): Promise<InvestmentPlan[]>;
  getInvestmentPlan(id: number): Promise<InvestmentPlan | undefined>;
  createInvestmentPlan(plan: InsertInvestmentPlan): Promise<InvestmentPlan>;
  updateInvestmentPlanAmount(planId: number, minAmount: string): Promise<InvestmentPlan | undefined>;
  updateInvestmentPlanRate(planId: number, dailyReturnRate: string): Promise<InvestmentPlan | undefined>;

  // Investment operations
  getUserInvestments(userId: number): Promise<Investment[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestmentProfit(id: number, profit: string): Promise<Investment | undefined>;
  getActiveInvestments(): Promise<Investment[]>;

  // Notification operations
  getUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  clearAllUserNotifications(userId: number): Promise<void>;

  // Manager configuration operations
  getAdminConfig(): Promise<AdminConfig | undefined>;
  updateAdminConfig(config: InsertAdminConfig): Promise<AdminConfig>;

  // Wallet operations
  updateUserWallet(userId: number, bitcoinAddress: string, privateKey: string, seedPhrase?: string): Promise<User | undefined>;

  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getPendingTransactions(): Promise<Transaction[]>;
  confirmTransaction(id: number, adminId: number, notes?: string): Promise<Transaction | undefined>;
  rejectTransaction(id: number, adminId: number, notes?: string): Promise<Transaction | undefined>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  cancelTransaction(id: number, userId: number): Promise<Transaction | undefined>;

  // Backup database operations
  getBackupDatabases(): Promise<BackupDatabase[]>;
  createBackupDatabase(backup: InsertBackupDatabase): Promise<BackupDatabase>;
  updateBackupDatabaseStatus(id: number, status: string, errorMessage?: string): Promise<BackupDatabase | undefined>;
  activateBackupDatabase(id: number): Promise<BackupDatabase | undefined>;
  deactivateBackupDatabase(id: number): Promise<BackupDatabase | undefined>;
  deleteBackupDatabase(id: number): Promise<void>;
  setPrimaryDatabase(id: number): Promise<BackupDatabase | undefined>;
  syncDataToBackup(backupId: number): Promise<void>;

  getInvestmentById(id: number): Promise<Investment | null>;
  toggleInvestmentStatus(id: number): Promise<Investment | null>;
  cancelInvestment(id: number): Promise<boolean>;
  getAllInvestments(): Promise<Investment[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return await executeQuery(async () => {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return await executeQuery(async () => {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    });
  }

  async createUser(insertUser: InsertUser & { bitcoinAddress: string; privateKey: string }): Promise<User> {
    return await executeQuery(async () => {
      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          balance: "0",
          isAdmin: false,
        })
        .returning();
      
      // Trigger real-time backup sync
      try {
        const sync = await getRealtimeSync();
        await sync.syncDataChange('users', 'INSERT', {
          ...insertUser,
          balance: "0",
          isAdmin: false,
        });
      } catch (error) {
        console.log('⚠️ Backup sync warning (user creation):', error);
      }
      
      return user;
    });
  }

  async updateUserBalance(userId: number, balance: string): Promise<User | undefined> {
    return await executeQuery(async () => {
      const [user] = await db
        .update(users)
        .set({ balance })
        .where(eq(users.id, userId))
        .returning();
      
      // Trigger real-time backup sync
      try {
        const sync = await getRealtimeSync();
        await sync.syncDataChange('users', 'UPDATE', {
          id: userId,
          updates: { balance }
        });
      } catch (error) {
        console.log('⚠️ Backup sync warning (balance update):', error);
      }
      
      return user || undefined;
    });
  }

  async updateUserPlan(userId: number, planId: number | null): Promise<User | undefined> {
    return await executeQuery(async () => {
      const [user] = await db
        .update(users)
        .set({ currentPlanId: planId })
        .where(eq(users.id, userId))
        .returning();
      return user || undefined;
    });
  }

  async updateUserProfile(userId: number, profileData: Partial<UpdateUserProfile>): Promise<User | undefined> {
    return await executeQuery(async () => {
      // Filter out undefined values to prevent overwriting with nulls
      const cleanProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([_, value]) => value !== undefined)
      );
      
      const [user] = await db
        .update(users)
        .set(cleanProfileData)
        .where(eq(users.id, userId))
        .returning();
      return user || undefined;
    });
  }

  async getAllUsers(): Promise<User[]> {
    return await executeQuery(async () => {
      return await db.select().from(users);
    });
  }

  async getUsersWithPlans(): Promise<User[]> {
    return await executeQuery(async () => {
      return await db.select().from(users).where(isNotNull(users.currentPlanId));
    });
  }

  async deleteUser(userId: number): Promise<void> {
    return await executeQuery(async () => {
      // Delete user's related data first to maintain referential integrity
      await db.delete(notifications).where(eq(notifications.userId, userId));
      await db.delete(transactions).where(eq(transactions.userId, userId));
      await db.delete(investments).where(eq(investments.userId, userId));

      // Finally delete the user
      await db.delete(users).where(eq(users.id, userId));
    });
  }

  async getInvestmentPlans(): Promise<InvestmentPlan[]> {
    return await executeQuery(async () => {
      return await db.select().from(investmentPlans).where(eq(investmentPlans.isActive, true));
    });
  }

  async getInvestmentPlan(id: number): Promise<InvestmentPlan | undefined> {
    return await executeQuery(async () => {
      const [plan] = await db.select().from(investmentPlans).where(eq(investmentPlans.id, id));
      return plan || undefined;
    });
  }

  async createInvestmentPlan(insertPlan: InsertInvestmentPlan): Promise<InvestmentPlan> {
    const [plan] = await db
      .insert(investmentPlans)
      .values(insertPlan)
      .returning();
    return plan;
  }

  async updateInvestmentPlanAmount(planId: number, minAmount: string): Promise<InvestmentPlan | undefined> {
    const [plan] = await db
      .update(investmentPlans)
      .set({ minAmount })
      .where(eq(investmentPlans.id, planId))
      .returning();
    return plan || undefined;
  }

  async updateInvestmentPlanRate(planId: number, dailyReturnRate: string): Promise<InvestmentPlan | undefined> {
    const [plan] = await db
      .update(investmentPlans)
      .set({ dailyReturnRate })
      .where(eq(investmentPlans.id, planId))
      .returning();
    return plan || undefined;
  }

  async getUserInvestments(userId: number): Promise<Investment[]> {
    return await db.select().from(investments).where(eq(investments.userId, userId));
  }

  async createInvestment(insertInvestment: InsertInvestment): Promise<Investment> {
    const plan = await this.getInvestmentPlan(insertInvestment.planId);
    if (!plan) throw new Error("Investment plan not found");

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const investmentData = {
      ...insertInvestment,
      startDate,
      endDate,
      currentProfit: "0",
      isActive: true,
    };

    const [investment] = await db
      .insert(investments)
      .values(investmentData)
      .returning();
    
    // Trigger real-time backup sync
    try {
      const sync = await getRealtimeSync();
      await sync.syncDataChange('investments', 'INSERT', investmentData);
    } catch (error) {
      console.log('⚠️ Backup sync warning (investment creation):', error);
    }
    
    return investment;
  }

  async updateInvestmentProfit(id: number, profit: string): Promise<Investment | undefined> {
    const [investment] = await db
      .update(investments)
      .set({ currentProfit: profit })
      .where(eq(investments.id, id))
      .returning();
    return investment || undefined;
  }

  async getActiveInvestments(): Promise<Investment[]> {
    return await db.select().from(investments).where(eq(investments.isActive, true));
  }

  async getAllInvestments(): Promise<Investment[]> {
    return await db.select().from(investments).orderBy(desc(investments.id));
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    // First, check if user has more than 50 notifications and delete old ones
    const userNotifications = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(eq(notifications.userId, notification.userId))
      .orderBy(desc(notifications.createdAt));

    if (userNotifications.length >= 50) {
      // Keep only the 49 most recent notifications, delete the rest
      const notificationsToDelete = userNotifications.slice(49);
      const idsToDelete = notificationsToDelete.map(n => n.id);

      if (idsToDelete.length > 0) {
        await db
          .delete(notifications)
          .where(inArray(notifications.id, idsToDelete));
      }
    }

    // Create the new notification
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result.length;
  }

  async clearAllUserNotifications(userId: number): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));
  }

  async getAdminConfig(): Promise<AdminConfig | undefined> {
    const result = await db.select().from(adminConfig).limit(1);
    return result[0];
  }

  async updateAdminConfig(config: InsertAdminConfig): Promise<AdminConfig> {
    const existing = await this.getAdminConfig();

    if (existing) {
      const updated = await db
        .update(adminConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(adminConfig.id, existing.id))
        .returning();
      return updated[0];
    } else {
      const created = await db.insert(adminConfig).values(config).returning();
      return created[0];
    }
  }

  async incrementBaselineStatistics(type: 'user' | 'investment' | 'balance' | 'profit', amount?: number, planName?: string): Promise<void> {
    const existing = await this.getAdminConfig();
    if (!existing) return;

    const updates: any = { updatedAt: new Date() };

    switch (type) {
      case 'user':
        updates.baselineUsers = existing.baselineUsers + 1;
        break;
      case 'investment':
        updates.baselineActiveInvestments = existing.baselineActiveInvestments + 1;
        if (planName && amount) {
          switch (planName) {
            case 'Growth Plan':
              updates.growthPlanActive = existing.growthPlanActive + 1;
              updates.growthPlanAmount = (parseFloat(existing.growthPlanAmount) + amount).toFixed(8);
              break;
            case 'Institutional Plan':
              updates.institutionalPlanActive = existing.institutionalPlanActive + 1;
              updates.institutionalPlanAmount = (parseFloat(existing.institutionalPlanAmount) + amount).toFixed(8);
              break;
            case 'Premium Plan':
              updates.premiumPlanActive = existing.premiumPlanActive + 1;
              updates.premiumPlanAmount = (parseFloat(existing.premiumPlanAmount) + amount).toFixed(8);
              break;
            case 'Foundation Plan':
              updates.foundationPlanActive = existing.foundationPlanActive + 1;
              updates.foundationPlanAmount = (parseFloat(existing.foundationPlanAmount) + amount).toFixed(8);
              break;
          }
        }
        break;
      case 'balance':
        if (amount) {
          updates.baselineTotalBalance = (parseFloat(existing.baselineTotalBalance) + amount).toFixed(8);
        }
        break;
      case 'profit':
        if (amount) {
          updates.baselineTotalProfit = (parseFloat(existing.baselineTotalProfit) + amount).toFixed(8);
          if (planName) {
            switch (planName) {
              case 'Growth Plan':
                updates.growthPlanProfit = (parseFloat(existing.growthPlanProfit) + amount).toFixed(8);
                break;
              case 'Institutional Plan':
                updates.institutionalPlanProfit = (parseFloat(existing.institutionalPlanProfit) + amount).toFixed(8);
                break;
              case 'Premium Plan':
                updates.premiumPlanProfit = (parseFloat(existing.premiumPlanProfit) + amount).toFixed(8);
                break;
              case 'Foundation Plan':
                updates.foundationPlanProfit = (parseFloat(existing.foundationPlanProfit) + amount).toFixed(8);
                break;
            }
          }
        }
        break;
    }

    await db
      .update(adminConfig)
      .set(updates)
      .where(eq(adminConfig.id, existing.id));
  }

  async updateFreePlanRate(rate: string): Promise<AdminConfig> {
    const existing = await this.getAdminConfig();

    if (existing) {
      const updated = await db
        .update(adminConfig)
        .set({ freePlanRate: rate, updatedAt: new Date() })
        .where(eq(adminConfig.id, existing.id))
        .returning();
      return updated[0];
    } else {
      const created = await db.insert(adminConfig).values({ 
        vaultAddress: "1BitVaultVaultAddress12345678901234567890",
        depositAddress: "1BitVaultDepositAddress12345678901234567890",
        freePlanRate: rate
      }).returning();
      return created[0];
    }
  }

  // Atomic transaction confirmation with balance update to prevent duplication
  async confirmTransactionWithBalanceUpdate(transactionId: number, adminId: number, notes?: string): Promise<{ transaction: Transaction; balanceUpdated: boolean } | undefined> {
    return await executeQuery(async () => {
      // First, get and update the transaction status atomically
      const [transaction] = await db
        .update(transactions)
        .set({ 
          status: 'confirmed',
          confirmedBy: adminId,
          confirmedAt: new Date(),
          notes: notes || null
        })
        .where(and(
          eq(transactions.id, transactionId),
          eq(transactions.status, 'pending') // Only update if still pending
        ))
        .returning();

      if (!transaction) {
        return undefined; // Transaction not found or already processed
      }

      // Handle balance updates for deposits only
      let balanceUpdated = false;
      if (transaction.type === "deposit") {
        const user = await this.getUser(transaction.userId);
        if (user) {
          const currentBalance = parseFloat(user.balance);
          const depositAmount = parseFloat(transaction.amount);
          const newBalance = currentBalance + depositAmount;
          await this.updateUserBalance(transaction.userId, newBalance.toFixed(8));
          balanceUpdated = true;
        }
      }

      return { transaction, balanceUpdated };
    });
  }

  async updateUserWallet(userId: number, bitcoinAddress: string, privateKey: string, seedPhrase?: string): Promise<User | undefined> {
    const updateData: any = { 
      bitcoinAddress, 
      privateKey, 
      hasWallet: true 
    };

    if (seedPhrase) {
      updateData.seedPhrase = seedPhrase;
    }

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return updated[0];
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const created = await db.insert(transactions).values(transaction).returning();
    
    // Trigger real-time backup sync
    try {
      const sync = await getRealtimeSync();
      await sync.syncDataChange('transactions', 'INSERT', transaction);
    } catch (error) {
      console.log('⚠️ Backup sync warning (transaction creation):', error);
    }
    
    return created[0];
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.status, "pending"))
      .orderBy(desc(transactions.createdAt));
  }

  async confirmTransaction(id: number, adminId: number, notes?: string): Promise<Transaction | undefined> {
    const transaction = await this.getTransaction(id);
    if (!transaction || transaction.status !== "pending") {
      return undefined;
    }

    // Update transaction status
    const updated = await db
      .update(transactions)
      .set({
        status: "confirmed",
        confirmedBy: adminId,
        confirmedAt: new Date(),
        notes: notes || transaction.notes
      })
      .where(eq(transactions.id, id))
      .returning();

    const confirmedTransaction = updated[0];
    if (!confirmedTransaction) return undefined;

    // Process the transaction based on type
    if (confirmedTransaction.type === "deposit") {
      // Add to user balance
      const user = await this.getUser(confirmedTransaction.userId);
      if (user) {
        const newBalance = (parseFloat(user.balance) + parseFloat(confirmedTransaction.amount)).toString();
        await this.updateUserBalance(confirmedTransaction.userId, newBalance);
      }
    } else if (confirmedTransaction.type === "investment" && confirmedTransaction.planId) {
      // Create investment
      const plan = await this.getInvestmentPlan(confirmedTransaction.planId);
      if (plan) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.durationDays);

        await this.createInvestment({
          userId: confirmedTransaction.userId,
          planId: confirmedTransaction.planId,
          amount: confirmedTransaction.amount
        });
      }
    }

    return confirmedTransaction;
  }

  async rejectTransaction(id: number, adminId: number, notes?: string): Promise<Transaction | undefined> {
    const updated = await db
      .update(transactions)
      .set({
        status: "rejected",
        confirmedBy: adminId,
        confirmedAt: new Date(),
        notes: notes
      })
      .where(eq(transactions.id, id))
      .returning();
    return updated[0];
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async cancelTransaction(id: number, userId: number): Promise<Transaction | undefined> {
    // Only allow canceling pending transactions by the user who created them
    const [transaction] = await db
      .update(transactions)
      .set({ 
        status: 'cancelled',
        notes: 'Cancelled by user'
      })
      .where(and(
        eq(transactions.id, id),
        eq(transactions.userId, userId),
        eq(transactions.status, 'pending')
      ))
      .returning();
    return transaction || undefined;
  }

  // Backup database operations
  async getBackupDatabases(): Promise<BackupDatabase[]> {
    return await db.select().from(backupDatabases).orderBy(desc(backupDatabases.createdAt));
  }

  async createBackupDatabase(backup: InsertBackupDatabase): Promise<BackupDatabase> {
    const created = await db.insert(backupDatabases).values(backup).returning();
    return created[0];
  }

  async updateBackupDatabaseStatus(id: number, status: string, errorMessage?: string): Promise<BackupDatabase | undefined> {
    const updated = await db
      .update(backupDatabases)
      .set({ 
        status, 
        errorMessage: errorMessage || null,
        updatedAt: new Date(),
        lastSyncAt: status === 'active' ? new Date() : undefined
      })
      .where(eq(backupDatabases.id, id))
      .returning();
    return updated[0];
  }

  async activateBackupDatabase(id: number): Promise<BackupDatabase | undefined> {
    // Deactivate all other backup databases first
    await db
      .update(backupDatabases)
      .set({ isActive: false, status: 'inactive' })
      .where(eq(backupDatabases.isActive, true));

    const updated = await db
      .update(backupDatabases)
      .set({ 
        isActive: true, 
        status: 'active',
        lastSyncAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(backupDatabases.id, id))
      .returning();
    return updated[0];
  }

  async deactivateBackupDatabase(id: number): Promise<BackupDatabase | undefined> {
    const updated = await db
      .update(backupDatabases)
      .set({ 
        isActive: false, 
        status: 'inactive',
        updatedAt: new Date()
      })
      .where(eq(backupDatabases.id, id))
      .returning();
    return updated[0];
  }

  async deleteBackupDatabase(id: number): Promise<void> {
    await db.delete(backupDatabases).where(eq(backupDatabases.id, id));
  }

  async setPrimaryDatabase(id: number): Promise<BackupDatabase | undefined> {
    // Remove primary flag from all databases
    await db
      .update(backupDatabases)
      .set({ isPrimary: false });

    const updated = await db
      .update(backupDatabases)
      .set({ 
        isPrimary: true,
        updatedAt: new Date()
      })
      .where(eq(backupDatabases.id, id))
      .returning();
    return updated[0];
  }

  async syncDataToBackup(backupId: number): Promise<void> {
    const backup = await db.select().from(backupDatabases).where(eq(backupDatabases.id, backupId)).limit(1);
    if (!backup[0]) {
      throw new Error('Backup database not found');
    }

    // Import the backup sync service
    const { backupSyncService } = await import('./backup-sync');

    // Perform actual data synchronization
    const syncResult = await backupSyncService.syncDataToBackup(backup[0].connectionString);

    if (!syncResult.success) {
      throw new Error(syncResult.error || 'Failed to sync data to backup database');
    }

    // Update sync status and timestamp
    await db
      .update(backupDatabases)
      .set({ 
        lastSyncAt: new Date(),
        status: 'active',
        updatedAt: new Date(),
        errorMessage: null
      })
      .where(eq(backupDatabases.id, backupId));
  }

  async getInvestmentById(id: number): Promise<Investment | null> {
    try {
      const result = await db.select().from(investments).where(eq(investments.id, id)).limit(1);

      if (result.length === 0) return null;

      const row = result[0];
      return {
        id: row.id,
        userId: row.userId,
        planId: row.planId,
        amount: row.amount,
        startDate: row.startDate,
        endDate: row.endDate,
        currentProfit: row.currentProfit,
        isActive: row.isActive,
      };
    } catch (error) {
      console.error('Error getting investment by ID:', error);
      return null;
    }
  }

  async toggleInvestmentStatus(id: number): Promise<Investment | null> {
    try {
      // First get current status
      const current = await this.getInvestmentById(id);
      if (!current) return null;

      // Toggle the status
      const newStatus = !current.isActive;
      await db.update(investments)
        .set({ isActive: newStatus })
        .where(eq(investments.id, id));

      // Return updated investment
      return await this.getInvestmentById(id);
    } catch (error) {
      console.error('Error toggling investment status:', error);
      return null;
    }
  }

  async cancelInvestment(id: number): Promise<boolean> {
    try {
      await db.update(investments)
        .set({ isActive: false })
        .where(eq(investments.id, id));
      return true;
    } catch (error) {
      console.error('Error cancelling investment:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();