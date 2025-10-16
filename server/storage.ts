import { users, investmentPlans, investments, notifications, adminConfig, transactions, backupDatabases, depositSessions, supportMessages, type User, type InsertUser, type InvestmentPlan, type InsertInvestmentPlan, type Investment, type InsertInvestment, type Notification, type InsertNotification, type AdminConfig, type InsertAdminConfig, type Transaction, type InsertTransaction, type BackupDatabase, type InsertBackupDatabase, type UpdateUserProfile, type DepositSession, type InsertDepositSession, type SupportMessage, type InsertSupportMessage } from "@shared/schema";
import { db, executeQuery } from "./db";
import { eq, desc, and, isNotNull, inArray, sql } from "drizzle-orm";
import { BackupSyncService } from './backup-sync';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { bitcoinAddress: string | null; privateKey: string | null; recoveryHash?: string; googleId?: string; profileImageUrl?: string }): Promise<User>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  updateUserBalance(id: number, balance: string): Promise<User | undefined>;
  updateUserPlan(id: number, planId: number | null): Promise<User | undefined>;
  updateUserProfile(id: number, profileData: Partial<UpdateUserProfile>): Promise<User | undefined>;
  updateUserPassword(id: number, passwordHash: string, recoveryHash: string): Promise<User | undefined>;
  updateUserRecoveryCode(id: number, recoveryHash: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersWithPlans(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;

  // Investment plan operations
  getInvestmentPlans(): Promise<InvestmentPlan[]>;
  getInvestmentPlan(id: number): Promise<InvestmentPlan | undefined>;
  createInvestmentPlan(plan: InsertInvestmentPlan): Promise<InvestmentPlan>;
  updateInvestmentPlanAmount(planId: number, minAmount: string): Promise<InvestmentPlan | undefined>;
  updateInvestmentPlanRate(planId: number, dailyReturnRate: string): Promise<InvestmentPlan | undefined>;
  updateInvestmentPlanStatus(planId: number, isActive: boolean): Promise<InvestmentPlan | undefined>;

  // Investment operations
  getUserInvestments(userId: number): Promise<Investment[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestmentProfit(id: number, profit: string): Promise<Investment | undefined>;
  updateInvestmentProfitDetails(id: number, details: {
    currentProfit: string;
    grossProfit?: string;
    performanceFee?: string;
    netProfit?: string;
  }): Promise<Investment | undefined>;
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
  updateUserTRC20Address(userId: number, trc20DepositAddress: string): Promise<User | undefined>;

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

  // Deposit session operations
  createDepositSession(session: InsertDepositSession): Promise<DepositSession>;
  getDepositSession(sessionToken: string): Promise<DepositSession | undefined>;
  getUserDepositSessions(userId: number): Promise<DepositSession[]>;
  updateDepositSessionStatus(sessionToken: string, status: string, completedAt?: Date): Promise<DepositSession | undefined>;
  updateDepositSessionBlockchain(sessionToken: string, txHash: string, confirmations: number, amountReceived: string): Promise<DepositSession | undefined>;
  markUserConfirmedSent(sessionToken: string): Promise<DepositSession | undefined>;
  expireDepositSessions(): Promise<void>;
  getActivePendingDepositSessions(): Promise<DepositSession[]>;

  // Support message operations
  createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage>;
  getUserSupportMessages(userId: number): Promise<SupportMessage[]>;
  getAllSupportMessages(): Promise<SupportMessage[]>;
  getSupportMessage(id: number): Promise<SupportMessage | undefined>;
  updateSupportMessageStatus(id: number, status: string, adminResponse?: string, adminId?: number): Promise<SupportMessage | undefined>;
  getSupportMessagesByStatus(status: string): Promise<SupportMessage[]>;
}

export class DatabaseStorage implements IStorage {
  private backupSyncService = new BackupSyncService();

  // Real-time backup synchronization - disabled for Replit environment
  private async syncToBackupDatabases(): Promise<void> {
    // Backup sync disabled for Replit environment to prevent connection errors
    // Only using the primary Replit database
    return;
  }

  private async getActiveBackupDatabases(): Promise<BackupDatabase[]> {
    return await executeQuery(async () => {
      return await db
        .select()
        .from(backupDatabases)
        .where(eq(backupDatabases.isActive, true));
    });
  }
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

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return await executeQuery(async () => {
      const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
      return user || undefined;
    });
  }

  async createUser(insertUser: InsertUser & { bitcoinAddress: string | null; privateKey: string | null; recoveryHash?: string; googleId?: string; profileImageUrl?: string }): Promise<User> {
    const user = await executeQuery(async () => {
      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          balance: "0",
          isAdmin: false,
        })
        .returning();
      return user;
    });

    // Real-time sync to backup databases - disabled for Replit environment

    return user;
  }

  async updateUserBalance(userId: number, balance: string): Promise<User | undefined> {
    const user = await executeQuery(async () => {
      const [user] = await db
        .update(users)
        .set({ balance })
        .where(eq(users.id, userId))
        .returning();
      return user || undefined;
    });

    // Real-time sync to backup databases - disabled for Replit environment

    return user;
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

  async updateUserPassword(userId: number, passwordHash: string, recoveryHash: string): Promise<User | undefined> {
    return await executeQuery(async () => {
      const [user] = await db
        .update(users)
        .set({
          password: passwordHash,
          recoveryHash: recoveryHash
        })
        .where(eq(users.id, userId))
        .returning();
      return user || undefined;
    });
  }

  async updateUserRecoveryCode(userId: number, recoveryHash: string): Promise<User | undefined> {
    return await executeQuery(async () => {
      const [user] = await db
        .update(users)
        .set({ recoveryHash: recoveryHash })
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
      // Fetch only active plans
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

  async updateInvestmentPlanAmount(planId: number, minAmount: string, usdMinAmount?: string): Promise<InvestmentPlan | undefined> {
    const updateData: any = { minAmount };
    if (usdMinAmount) {
      updateData.usdMinAmount = usdMinAmount;
    }

    const [plan] = await db
      .update(investmentPlans)
      .set(updateData)
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

  async updateInvestmentPlanStatus(planId: number, isActive: boolean): Promise<InvestmentPlan | undefined> {
    const [updated] = await db
      .update(investmentPlans)
      .set({ isActive })
      .where(eq(investmentPlans.id, planId))
      .returning();
    return updated;
  }

  async getUserInvestments(userId: number): Promise<Investment[]> {
    return await db.select().from(investments).where(eq(investments.userId, userId));
  }

  async createInvestment(insertInvestment: InsertInvestment): Promise<Investment> {
    const plan = await this.getInvestmentPlan(insertInvestment.planId);
    if (!plan) throw new Error("Investment plan not found");

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Determine USD amount if this is a USD-based plan
    let usdAmount: string | undefined;
    if (plan.usdMinAmount) {
      // For USD plans, set usdAmount equal to the plan's USD minimum
      usdAmount = plan.usdMinAmount;
    }

    const [investment] = await db.insert(investments).values({
      userId: insertInvestment.userId,
      planId: insertInvestment.planId,
      amount: insertInvestment.amount,
      usdAmount: insertInvestment.usdAmount,
      startDate,
      endDate,
      currentProfit: "0",
      grossProfit: "0",
      performanceFee: "0",
      netProfit: "0",
      isActive: true,
    }).returning();

    // Real-time sync to backup databases - disabled for Replit environment

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

  async updateInvestmentProfitDetails(id: number, details: {
    currentProfit: string;
    grossProfit?: string;
    performanceFee?: string;
    netProfit?: string;
  }): Promise<Investment | undefined> {
    const [investment] = await db
      .update(investments)
      .set({
        currentProfit: details.currentProfit,
        grossProfit: details.grossProfit,
        performanceFee: details.performanceFee,
        netProfit: details.netProfit,
      })
      .where(eq(investments.id, id))
      .returning();
    return investment || undefined;
  }

  async getActiveInvestments(): Promise<Investment[]> {
    return await db.select().from(investments).where(eq(investments.isActive, true));
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

  async updateAdminConfig(config: Partial<InsertAdminConfig>): Promise<AdminConfig> {
    const existing = await this.getAdminConfig();

    if (existing) {
      const updated = await db
        .update(adminConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(adminConfig.id, existing.id))
        .returning();
      return updated[0];
    } else {
      // Ensure required fields are provided
      const fullConfig: InsertAdminConfig = {
        vaultAddress: config.vaultAddress || 'DEFAULT_VAULT_ADDRESS',
        depositAddress: config.depositAddress || 'DEFAULT_DEPOSIT_ADDRESS',
        ...config
      };
      const created = await db.insert(adminConfig).values(fullConfig).returning();
      return created[0];
    }
  }

  async incrementBaselineStatistics(type: 'user' | 'investment' | 'balance' | 'user_baseline' | 'investment_baseline' | 'balance_baseline' | 'profit_baseline', amount?: number, planName?: string): Promise<void> {
    try {
      // Get current config
      const config = await this.getAdminConfig();
      if (!config) {
        console.warn('No admin config found for baseline increment');
        return;
      }

      const updates: Partial<AdminConfig> = {};

      switch (type) {
        case 'user':
          updates.baselineUsers = (config.baselineUsers || 420) + 1;
          break;

        case 'user_baseline':
          updates.baselineUsers = (config.baselineUsers || 420) + (amount || 1);
          break;

        case 'investment':
          updates.baselineActiveInvestments = (config.baselineActiveInvestments || 804) + 1;
          if (amount && planName) {
            // Update plan-specific stats
            switch (planName) {
              case 'Growth Plan':
                updates.growthPlanActive = (config.growthPlanActive || 227) + 1;
                updates.growthPlanAmount = ((parseFloat(config.growthPlanAmount || '11004.9901')) + amount).toString();
                break;
              case 'Institutional Plan':
                updates.institutionalPlanActive = (config.institutionalPlanActive || 210) + 1;
                updates.institutionalPlanAmount = ((parseFloat(config.institutionalPlanAmount || '9228.4977')) + amount).toString();
                break;
              case 'Premium Plan':
                updates.premiumPlanActive = (config.premiumPlanActive || 198) + 1;
                updates.premiumPlanAmount = ((parseFloat(config.premiumPlanAmount || '9274.8974')) + amount).toString();
                break;
              case 'Foundation Plan':
                updates.foundationPlanActive = (config.foundationPlanActive || 169) + 1;
                updates.foundationPlanAmount = ((parseFloat(config.foundationPlanAmount || '7436.5081')) + amount).toString();
                break;
            }
          }
          break;

        case 'investment_baseline':
          updates.baselineActiveInvestments = (config.baselineActiveInvestments || 804) + (amount || 1);
          // Also randomly distribute increases across plans
          const planUpdates = ['Growth Plan', 'Institutional Plan', 'Premium Plan', 'Foundation Plan'];
          const randomPlan = planUpdates[Math.floor(Math.random() * planUpdates.length)];
          const planIncrease = Math.floor((amount || 1) / 4) + 1; // Distribute the increase
          switch (randomPlan) {
            case 'Growth Plan':
              updates.growthPlanActive = (config.growthPlanActive || 227) + planIncrease;
              break;
            case 'Institutional Plan':
              updates.institutionalPlanActive = (config.institutionalPlanActive || 210) + planIncrease;
              break;
            case 'Premium Plan':
              updates.premiumPlanActive = (config.premiumPlanActive || 198) + planIncrease;
              break;
            case 'Foundation Plan':
              updates.foundationPlanActive = (config.foundationPlanActive || 169) + planIncrease;
              break;
          }
          break;

        case 'balance':
          if (amount) {
            updates.baselineTotalBalance = ((parseFloat(config.baselineTotalBalance || '70275.171605')) + amount).toString();
          }
          break;

        case 'balance_baseline':
          if (amount) {
            updates.baselineTotalBalance = ((parseFloat(config.baselineTotalBalance || '70275.171605')) + amount).toString();
            // Also update random plan amounts
            const balancePlans = ['Growth Plan', 'Institutional Plan', 'Premium Plan', 'Foundation Plan'];
            const randomBalancePlan = balancePlans[Math.floor(Math.random() * balancePlans.length)];
            const planAmount = amount / 4; // Distribute the balance increase
            switch (randomBalancePlan) {
              case 'Growth Plan':
                updates.growthPlanAmount = ((parseFloat(config.growthPlanAmount || '11004.9901')) + planAmount).toString();
                break;
              case 'Institutional Plan':
                updates.institutionalPlanAmount = ((parseFloat(config.institutionalPlanAmount || '9228.4977')) + planAmount).toString();
                break;
              case 'Premium Plan':
                updates.premiumPlanAmount = ((parseFloat(config.premiumPlanAmount || '9274.8974')) + planAmount).toString();
                break;
              case 'Foundation Plan':
                updates.foundationPlanAmount = ((parseFloat(config.foundationPlanAmount || '7436.5081')) + planAmount).toString();
                break;
            }
          }
          break;

        case 'profit_baseline':
          if (amount) {
            updates.baselineTotalProfit = ((parseFloat(config.baselineTotalProfit || '460.347340')) + amount).toString();
            // Also update random plan profits
            const profitPlans = ['Growth Plan', 'Institutional Plan', 'Premium Plan', 'Foundation Plan'];
            const randomProfitPlan = profitPlans[Math.floor(Math.random() * profitPlans.length)];
            const planProfit = amount / 4; // Distribute the profit increase
            switch (randomProfitPlan) {
              case 'Growth Plan':
                updates.growthPlanProfit = ((parseFloat(config.growthPlanProfit || '101.649889')) + planProfit).toString();
                break;
              case 'Institutional Plan':
                updates.institutionalPlanProfit = ((parseFloat(config.institutionalPlanProfit || '205.248890')) + planProfit).toString();
                break;
              case 'Premium Plan':
                updates.premiumPlanProfit = ((parseFloat(config.premiumPlanProfit || '114.419514')) + planProfit).toString();
                break;
              case 'Foundation Plan':
                updates.foundationPlanProfit = ((parseFloat(config.foundationPlanProfit || '39.029047')) + planProfit).toString();
                break;
            }
          }
          break;
      }

      // Update the configuration
      await this.updateAdminConfig(updates);
    } catch (error) {
      console.error('Error incrementing baseline statistics:', error);
    }
  }

  // Update baseline statistics with 0.9% growth (for telegram bot)
  async updateBaselineStatistics(stats: any): Promise<void> {
    try {
      const existingConfig = await this.getAdminConfig();

      if (existingConfig) {
        await db.query(`
        UPDATE admin_config SET
          baseline_users = $1,
          baseline_active_investments = $2,
          baseline_total_balance = $3,
          baseline_total_profit = $4,
          growth_plan_active = $5,
          growth_plan_amount = $6,
          growth_plan_profit = $7,
          institutional_plan_active = $8,
          institutional_plan_amount = $9,
          institutional_plan_profit = $10,
          premium_plan_active = $11,
          premium_plan_amount = $12,
          premium_plan_profit = $13,
          foundation_plan_active = $14,
          foundation_plan_amount = $15,
          foundation_plan_profit = $16
        WHERE id = $17
      `, [
          stats.baselineUsers,
          stats.baselineActiveInvestments,
          stats.baselineTotalBalance,
          stats.baselineTotalProfit,
          stats.growthPlanActive,
          stats.growthPlanAmount,
          stats.growthPlanProfit,
          stats.institutionalPlanActive,
          stats.institutionalPlanAmount,
          stats.institutionalPlanProfit,
          stats.premiumPlanActive,
          stats.premiumPlanAmount,
          stats.premiumPlanProfit,
          stats.foundationPlanActive,
          stats.foundationPlanAmount,
          stats.foundationPlanProfit,
          existingConfig.id
        ]);
      } else {
        await db.query(`
        INSERT INTO admin_config (
          baseline_users, baseline_active_investments, baseline_total_balance, baseline_total_profit,
          growth_plan_active, growth_plan_amount, growth_plan_profit,
          institutional_plan_active, institutional_plan_amount, institutional_plan_profit,
          premium_plan_active, premium_plan_amount, premium_plan_profit,
          foundation_plan_active, foundation_plan_amount, foundation_plan_profit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
          stats.baselineUsers,
          stats.baselineActiveInvestments,
          stats.baselineTotalBalance,
          stats.baselineTotalProfit,
          stats.growthPlanActive,
          stats.growthPlanAmount,
          stats.growthPlanProfit,
          stats.institutionalPlanActive,
          stats.institutionalPlanAmount,
          stats.institutionalPlanProfit,
          stats.premiumPlanActive,
          stats.premiumPlanAmount,
          stats.premiumPlanProfit,
          stats.foundationPlanActive,
          stats.foundationPlanAmount,
          stats.foundationPlanProfit
        ]);
      }
      console.log('✅ Baseline statistics updated with 0.9% growth');
    } catch (error) {
      console.error('Error updating baseline statistics:', error);
    }
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

  async updateUserTRC20Address(userId: number, trc20DepositAddress: string): Promise<User | undefined> {
    const updated = await db
      .update(users)
      .set({ trc20DepositAddress })
      .where(eq(users.id, userId))
      .returning();
    return updated[0];
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const created = await db.insert(transactions).values(transaction).returning();

    // Real-time sync to backup databases - disabled for Replit environment

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
  async getBackupDatabases(): Promise<BackupDatabase[] > {
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

  async getAllInvestments(): Promise<Investment[]> {
    try {
      return await db.select().from(investments).orderBy(desc(investments.startDate));
    } catch (error) {
      console.error('Error getting all investments:', error);
      return [];
    }
  }

  // Deposit session operations
  async createDepositSession(session: InsertDepositSession): Promise<DepositSession> {
    return await executeQuery(async () => {
      const sessionToken = `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

      const [created] = await db.insert(depositSessions).values({
        ...session,
        sessionToken,
        expiresAt,
      }).returning();
      return created;
    });
  }

  async getDepositSession(sessionToken: string): Promise<DepositSession | undefined> {
    return await executeQuery(async () => {
      const [session] = await db.select().from(depositSessions).where(eq(depositSessions.sessionToken, sessionToken));
      return session || undefined;
    });
  }

  async getUserDepositSessions(userId: number): Promise<DepositSession[]> {
    return await executeQuery(async () => {
      return await db
        .select()
        .from(depositSessions)
        .where(eq(depositSessions.userId, userId))
        .orderBy(desc(depositSessions.createdAt));
    });
  }

  async updateDepositSessionStatus(sessionToken: string, status: string, completedAt?: Date): Promise<DepositSession | undefined> {
    return await executeQuery(async () => {
      const updateData: any = { status };
      if (completedAt) {
        updateData.completedAt = completedAt;
      }

      const [updated] = await db
        .update(depositSessions)
        .set(updateData)
        .where(eq(depositSessions.sessionToken, sessionToken))
        .returning();
      return updated || undefined;
    });
  }

  async updateDepositSessionBlockchain(sessionToken: string, txHash: string, confirmations: number, amountReceived: string): Promise<DepositSession | undefined> {
    return await executeQuery(async () => {
      const [updated] = await db
        .update(depositSessions)
        .set({
          blockchainTxHash: txHash,
          confirmations,
          amountReceived,
          lastCheckedAt: new Date(),
        })
        .where(eq(depositSessions.sessionToken, sessionToken))
        .returning();
      return updated || undefined;
    });
  }

  async updateDepositSessionVault(sessionToken: string, vaultTxHash: string): Promise<DepositSession | undefined> {
    return await executeQuery(async () => {
      const [updated] = await db
        .update(depositSessions)
        .set({
          vaultTxHash,
          lastCheckedAt: new Date(),
        })
        .where(eq(depositSessions.sessionToken, sessionToken))
        .returning();
      return updated || undefined;
    });
  }

  async getDepositSessionByTxHash(txHash: string): Promise<DepositSession | undefined> {
    return await executeQuery(async () => {
      const [session] = await db
        .select()
        .from(depositSessions)
        .where(eq(depositSessions.blockchainTxHash, txHash));
      return session || undefined;
    });
  }

  async getRecentUserTransactions(userId: number, type: string, hoursAgo: number): Promise<Transaction[]> {
    return await executeQuery(async () => {
      const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      const result = await db
        .select()
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.type, type),
          sql`${transactions.createdAt} >= ${cutoffTime}`
        ));
      return result;
    });
  }

  async markUserConfirmedSent(sessionToken: string): Promise<DepositSession | undefined> {
    return await executeQuery(async () => {
      const [updated] = await db
        .update(depositSessions)
        .set({ userConfirmedSent: true })
        .where(eq(depositSessions.sessionToken, sessionToken))
        .returning();
      return updated || undefined;
    });
  }

  async expireDepositSessions(): Promise<void> {
    await executeQuery(async () => {
      const now = new Date();
      await db
        .update(depositSessions)
        .set({ status: 'expired' })
        .where(and(
          eq(depositSessions.status, 'pending'),
          sql`expires_at < NOW()`
        ));
    });
  }

  async getActivePendingDepositSessions(): Promise<DepositSession[]> {
    return await executeQuery(async () => {
      return await db
        .select()
        .from(depositSessions)
        .where(and(
          eq(depositSessions.status, 'pending'),
          eq(depositSessions.userConfirmedSent, true)
        ))
        .orderBy(desc(depositSessions.createdAt));
    });
  }

  // Support message operations
  async createSupportMessage(data: InsertSupportMessage & { userId: number }): Promise<SupportMessage> {
    return await executeQuery(async () => {
      const [supportMessage] = await db
        .insert(supportMessages)
        .values({
          userId: data.userId,
          subject: data.subject,
          message: data.message,
          imageUrl: data.imageUrl || null,
          priority: data.priority || 'normal'
        })
        .returning();
      return supportMessage;
    });
  }

  async getUserSupportMessages(userId: number): Promise<SupportMessage[]> {
    return await executeQuery(async () => {
      return await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.userId, userId))
        .orderBy(desc(supportMessages.createdAt));
    });
  }

  async getAllSupportMessages(): Promise<SupportMessage[]> {
    return await executeQuery(async () => {
      return await db
        .select()
        .from(supportMessages)
        .orderBy(desc(supportMessages.createdAt));
    });
  }

  async getSupportMessage(id: number): Promise<SupportMessage | undefined> {
    return await executeQuery(async () => {
      const [message] = await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.id, id));
      return message || undefined;
    });
  }

  async updateSupportMessageStatus(id: number, status: string, adminResponse?: string, adminId?: number): Promise<SupportMessage | undefined> {
    return await executeQuery(async () => {
      const updateData: any = {
        status,
        respondedAt: new Date(),
      };

      if (adminResponse) {
        updateData.adminResponse = adminResponse;
      }

      if (adminId) {
        updateData.respondedBy = adminId;
      }

      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
      }

      const [updated] = await db
        .update(supportMessages)
        .set(updateData)
        .where(eq(supportMessages.id, id))
        .returning();
      return updated || undefined;
    });
  }

  async getSupportMessagesByStatus(status: string): Promise<SupportMessage[]> {
    return await executeQuery(async () => {
      return await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.status, status))
        .orderBy(desc(supportMessages.createdAt));
    });
  }

  // Admin user management operations
  async updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<User | undefined> {
    return await executeQuery(async () => {
      const [updated] = await db
        .update(users)
        .set({ isAdmin })
        .where(eq(users.id, userId))
        .returning();
      return updated || undefined;
    });
  }

  async updateUserSupportAdminStatus(userId: number, isSupportAdmin: boolean): Promise<User | undefined> {
    return await executeQuery(async () => {
      const [updated] = await db
        .update(users)
        .set({ isSupportAdmin })
        .where(eq(users.id, userId))
        .returning();
      return updated || undefined;
    });
  }
}


export const storage = new DatabaseStorage();