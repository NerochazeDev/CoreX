import fs from 'fs/promises';
import path from 'path';
import { 
  User, InsertUser, 
  InvestmentPlan, InsertInvestmentPlan,
  Investment, InsertInvestment,
  Notification, InsertNotification,
  AdminConfig, InsertAdminConfig,
  Transaction, InsertTransaction,
  BackupDatabase, InsertBackupDatabase
} from '../shared/schema.js';
import { IStorage } from './storage.js';

interface DatabaseData {
  users: User[];
  investmentPlans: InvestmentPlan[];
  investments: Investment[];
  notifications: Notification[];
  adminConfig: AdminConfig[];
  transactions: Transaction[];
  backupDatabases: BackupDatabase[];
  nextIds: {
    users: number;
    investmentPlans: number;
    investments: number;
    notifications: number;
    adminConfig: number;
    transactions: number;
    backupDatabases: number;
  };
}

export class JsonStorage implements IStorage {
  private dataPath = path.join(process.cwd(), 'data.json');
  private data: DatabaseData;

  constructor() {
    this.data = {
      users: [],
      investmentPlans: [],
      investments: [],
      notifications: [],
      adminConfig: [],
      transactions: [],
      backupDatabases: [],
      nextIds: {
        users: 1,
        investmentPlans: 1,
        investments: 1,
        notifications: 1,
        adminConfig: 1,
        transactions: 1,
        backupDatabases: 1
      }
    };
  }

  async initialize(): Promise<void> {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.data = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, use default data
      await this.saveData();
    }
  }

  private async saveData(): Promise<void> {
    await fs.writeFile(this.dataPath, JSON.stringify(this.data, null, 2));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.data.users.find(user => user.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.data.users.find(user => user.email === email);
  }

  async createUser(userData: InsertUser & { bitcoinAddress: string | null; privateKey: string | null }): Promise<User> {
    const newUser: User = {
      id: this.data.nextIds.users++,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      email: userData.email,
      phone: userData.phone || null,
      country: userData.country || null,
      password: userData.password ?? null,
      originalPassword: null,
      recoveryHash: null,
      googleId: userData.googleId || null,
      profileImageUrl: userData.profileImageUrl || null,
      bio: null,
      website: null,
      avatar: null,
      bitcoinAddress: userData.bitcoinAddress,
      privateKey: userData.privateKey,
      seedPhrase: null,
      balance: "0",
      currentPlanId: null,
      isAdmin: false,
      isSupportAdmin: false,
      hasWallet: false,
      acceptMarketing: userData.acceptMarketing || false,
      createdAt: new Date()
    };
    this.data.users.push(newUser);
    await this.saveData();
    return newUser;
  }

  async updateUserBalance(id: number, balance: string): Promise<User | undefined> {
    const user = this.data.users.find(u => u.id === id);
    if (user) {
      user.balance = balance;
      await this.saveData();
    }
    return user;
  }

  async updateUserPlan(id: number, planId: number | null): Promise<User | undefined> {
    const user = this.data.users.find(u => u.id === id);
    if (user) {
      user.currentPlanId = planId;
      await this.saveData();
    }
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.data.users;
  }

  async getUsersWithPlans(): Promise<User[]> {
    return this.data.users.filter(user => user.currentPlanId !== null);
  }


  // Investment plan operations
  async getInvestmentPlans(): Promise<InvestmentPlan[]> {
    return this.data.investmentPlans;
  }

  async getInvestmentPlan(id: number): Promise<InvestmentPlan | undefined> {
    return this.data.investmentPlans.find(plan => plan.id === id);
  }

  async createInvestmentPlan(planData: InsertInvestmentPlan): Promise<InvestmentPlan> {
    const newPlan: InvestmentPlan = {
      id: this.data.nextIds.investmentPlans++,
      name: planData.name,
      minAmount: planData.minAmount,
      roiPercentage: planData.roiPercentage,
      durationDays: planData.durationDays,
      color: planData.color,
      updateIntervalMinutes: planData.updateIntervalMinutes || 60,
      dailyReturnRate: planData.dailyReturnRate || "0.0001",
      isActive: planData.isActive !== undefined ? planData.isActive : true
    };
    this.data.investmentPlans.push(newPlan);
    await this.saveData();
    return newPlan;
  }


  // Investment operations
  async getUserInvestments(userId: number): Promise<Investment[]> {
    return this.data.investments.filter(investment => investment.userId === userId);
  }

  async createInvestment(investmentData: InsertInvestment): Promise<Investment> {
    const newInvestment: Investment = {
      id: this.data.nextIds.investments++,
      userId: investmentData.userId,
      planId: investmentData.planId,
      amount: investmentData.amount,
      startDate: new Date(),
      endDate: new Date(),
      currentProfit: "0",
      isActive: true
    };
    this.data.investments.push(newInvestment);
    await this.saveData();
    return newInvestment;
  }

  async updateInvestmentProfit(id: number, profit: string): Promise<Investment | undefined> {
    const investment = this.data.investments.find(inv => inv.id === id);
    if (investment) {
      investment.currentProfit = profit;
      await this.saveData();
    }
    return investment;
  }

  async getActiveInvestments(): Promise<Investment[]> {
    return this.data.investments.filter(investment => investment.isActive);
  }

  // Notification operations
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return this.data.notifications.filter(notification => notification.userId === userId);
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      id: this.data.nextIds.notifications++,
      userId: notificationData.userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || "info",
      isRead: notificationData.isRead || false,
      createdAt: new Date()
    };
    this.data.notifications.push(newNotification);
    await this.saveData();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.data.notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      await this.saveData();
    }
    return notification;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    return this.data.notifications.filter(n => n.userId === userId && !n.isRead).length;
  }

  async clearAllUserNotifications(userId: number): Promise<void> {
    this.data.notifications = this.data.notifications.filter(n => n.userId !== userId);
    await this.saveData();
  }

  // Admin config operations
  async getAdminConfig(): Promise<AdminConfig | undefined> {
    return this.data.adminConfig[0];
  }

  async updateAdminConfig(configData: InsertAdminConfig): Promise<AdminConfig> {
    if (this.data.adminConfig.length === 0) {
      const newConfig: AdminConfig = {
        id: this.data.nextIds.adminConfig++,
        vaultAddress: configData.vaultAddress,
        depositAddress: configData.depositAddress,
        freePlanRate: configData.freePlanRate || "0.0001",
        baselineUsers: 0,
        baselineActiveInvestments: 0,
        baselineTotalBalance: "0",
        baselineTotalProfit: "0",
        baselineTopPerformer: null,
        baselineMarketTrend: "stable",
        baselineLastAnalysis: new Date(),
        baselineStatsVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.data.adminConfig.push(newConfig);
    } else {
      this.data.adminConfig[0] = {
        ...this.data.adminConfig[0],
        vaultAddress: configData.vaultAddress,
        depositAddress: configData.depositAddress,
        freePlanRate: configData.freePlanRate || this.data.adminConfig[0].freePlanRate,
        updatedAt: new Date()
      };
    }
    await this.saveData();
    return this.data.adminConfig[0];
  }

  // Wallet operations
  async updateUserWallet(userId: number, bitcoinAddress: string, privateKey: string, seedPhrase?: string): Promise<User | undefined> {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.bitcoinAddress = bitcoinAddress;
      user.privateKey = privateKey;
      user.hasWallet = true;
      if (seedPhrase) user.seedPhrase = seedPhrase;
      await this.saveData();
    }
    return user;
  }

  // Transaction operations
  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: this.data.nextIds.transactions++,
      userId: transactionData.userId,
      type: transactionData.type,
      amount: transactionData.amount,
      address: transactionData.address || null,
      status: transactionData.status || "pending",
      planId: transactionData.planId || null,
      transactionHash: transactionData.transactionHash || null,
      notes: transactionData.notes || null,
      confirmedBy: null,
      createdAt: new Date(),
      confirmedAt: null
    };
    this.data.transactions.push(newTransaction);
    await this.saveData();
    return newTransaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return this.data.transactions.filter(transaction => transaction.userId === userId);
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return this.data.transactions.filter(transaction => transaction.status === 'pending');
  }

  async confirmTransaction(id: number, adminId: number, notes?: string): Promise<Transaction | undefined> {
    const transaction = this.data.transactions.find(t => t.id === id);
    if (transaction) {
      transaction.status = 'confirmed';
      transaction.confirmedAt = new Date();
      transaction.confirmedBy = adminId;
      if (notes) transaction.notes = notes;
      await this.saveData();
    }
    return transaction;
  }

  async rejectTransaction(id: number, adminId: number, notes?: string): Promise<Transaction | undefined> {
    const transaction = this.data.transactions.find(t => t.id === id);
    if (transaction) {
      transaction.status = 'rejected';
      transaction.confirmedBy = adminId;
      if (notes) transaction.notes = notes;
      await this.saveData();
    }
    return transaction;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.data.transactions.find(transaction => transaction.id === id);
  }

  async cancelTransaction(id: number, userId: number): Promise<Transaction | undefined> {
    const transaction = this.data.transactions.find(t => t.id === id && t.userId === userId);
    if (transaction && transaction.status === 'pending') {
      transaction.status = 'cancelled';
      await this.saveData();
    }
    return transaction;
  }

  // Backup database operations
  async getBackupDatabases(): Promise<BackupDatabase[]> {
    return this.data.backupDatabases;
  }

  async createBackupDatabase(backupData: InsertBackupDatabase): Promise<BackupDatabase> {
    const newBackup: BackupDatabase = {
      id: this.data.nextIds.backupDatabases++,
      name: backupData.name,
      connectionString: backupData.connectionString,
      isActive: backupData.isActive || false,
      isPrimary: backupData.isPrimary || false,
      lastSyncAt: null,
      status: backupData.status || "inactive",
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.backupDatabases.push(newBackup);
    await this.saveData();
    return newBackup;
  }

  async updateBackupDatabaseStatus(id: number, status: string, errorMessage?: string): Promise<BackupDatabase | undefined> {
    const backup = this.data.backupDatabases.find(b => b.id === id);
    if (backup) {
      backup.status = status;
      if (errorMessage) backup.errorMessage = errorMessage;
      backup.updatedAt = new Date();
      await this.saveData();
    }
    return backup;
  }

  async activateBackupDatabase(id: number): Promise<BackupDatabase | undefined> {
    const backup = this.data.backupDatabases.find(b => b.id === id);
    if (backup) {
      backup.isActive = true;
      backup.updatedAt = new Date();
      await this.saveData();
    }
    return backup;
  }

  async deactivateBackupDatabase(id: number): Promise<BackupDatabase | undefined> {
    const backup = this.data.backupDatabases.find(b => b.id === id);
    if (backup) {
      backup.isActive = false;
      backup.updatedAt = new Date();
      await this.saveData();
    }
    return backup;
  }

  async deleteBackupDatabase(id: number): Promise<void> {
    this.data.backupDatabases = this.data.backupDatabases.filter(backup => backup.id !== id);
    await this.saveData();
  }

  async setPrimaryDatabase(id: number): Promise<BackupDatabase | undefined> {
    // Set all others to not primary
    this.data.backupDatabases.forEach(backup => {
      backup.isPrimary = false;
    });
    
    const backup = this.data.backupDatabases.find(b => b.id === id);
    if (backup) {
      backup.isPrimary = true;
      backup.updatedAt = new Date();
      await this.saveData();
    }
    return backup;
  }

  async syncDataToBackup(backupId: number): Promise<void> {
    // For JSON storage, this is a no-op since data is already persistent
    const backup = this.data.backupDatabases.find(b => b.id === backupId);
    if (backup) {
      backup.lastSyncAt = new Date();
      backup.status = 'synced';
      backup.updatedAt = new Date();
      await this.saveData();
    }
  }

  // Missing methods - stub implementations
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async updateUserProfile(id: number, profileData: any): Promise<User | undefined> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async updateUserPassword(id: number, passwordHash: string, recoveryHash: string): Promise<User | undefined> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async updateUserRecoveryCode(id: number, recoveryHash: string): Promise<User | undefined> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async deleteUser(id: number): Promise<void> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async getInvestmentById(id: number): Promise<Investment | null> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async toggleInvestmentStatus(id: number): Promise<Investment | null> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async cancelInvestment(id: number): Promise<boolean> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async getAllInvestments(): Promise<Investment[]> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async createDepositSession(session: any): Promise<any> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async getDepositSession(sessionToken: string): Promise<any> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async getUserDepositSessions(userId: number): Promise<any[]> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async updateDepositSession(sessionToken: string, updates: any): Promise<any> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async completeDepositSession(sessionToken: string, transactionHash: string): Promise<any> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async createSupportMessage(message: any): Promise<any> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async getSupportMessages(): Promise<any[]> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async getSupportMessage(id: number): Promise<any> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async updateSupportMessage(id: number, updates: any): Promise<any> {
    throw new Error("Method not implemented in JsonStorage");
  }

  // Additional missing methods based on latest IStorage interface
  async updateDepositSessionStatus(sessionToken: string, status: string): Promise<any> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async updateDepositSessionBlockchain(sessionToken: string, txHash: string, confirmations: number, amountReceived: string): Promise<any> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async markUserConfirmedSent(sessionToken: string): Promise<any> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async expireDepositSessions(): Promise<void> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async updateInvestmentPlanAmount(planId: number, minAmount: string): Promise<InvestmentPlan | undefined> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async updateInvestmentPlanRate(planId: number, dailyReturnRate: string): Promise<InvestmentPlan | undefined> {
    throw new Error("Method not implemented in JsonStorage");
  }

  // Additional missing methods for complete IStorage implementation
  async getActivePendingDepositSessions(): Promise<any[]> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async getUserSupportMessages(userId: number): Promise<any[]> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async getAllSupportMessages(): Promise<any[]> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async updateSupportMessageStatus(id: number, status: string): Promise<any> {
    throw new Error("Method not implemented in JsonStorage");
  }

  async getSupportMessagesByStatus(status: string): Promise<any[]> {
    throw new Error("Method not implemented in JsonStorage");
  }
}