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
  recoveryHash: text("recovery_hash"), // Hashed recovery code
  googleId: text("google_id").unique(), // Google OAuth ID
  profileImageUrl: text("profile_image_url"), // Google profile picture URL
  bitcoinAddress: text("bitcoin_address"), // nullable until wallet is set up
  privateKey: text("private_key"), // nullable until wallet is set up
  seedPhrase: text("seed_phrase"),
  trc20DepositAddress: text("trc20_deposit_address"), // TRC20 USDT deposit address
  balance: decimal("balance", { precision: 18, scale: 8 }).notNull().default("0"),
  currentPlanId: integer("current_plan_id"), // null for free plan
  isAdmin: boolean("is_admin").notNull().default(false), // Full admin access
  isSupportAdmin: boolean("is_support_admin").notNull().default(false), // Limited admin access for message support only
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
  usdMinAmount: decimal("usd_min_amount", { precision: 18, scale: 2 }).notNull(), // Primary USD amount - BTC calculated dynamically from real-time prices
  roiPercentage: integer("roi_percentage").notNull(),
  durationDays: integer("duration_days").notNull(),
  color: text("color").notNull(),
  updateIntervalMinutes: integer("update_interval_minutes").notNull().default(60), // How often to update balance (in minutes)
  dailyReturnRate: decimal("daily_return_rate", { precision: 5, scale: 4 }).notNull().default("0.0001"), // Daily return rate for automatic updates
  performanceFeePercentage: integer("performance_fee_percentage").default(0), // Performance fee (10 or 20) on profits only
  isActive: boolean("is_active").notNull().default(true),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  usdAmount: decimal("usd_amount", { precision: 18, scale: 2 }), // USD amount for new investments
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  currentProfit: decimal("current_profit", { precision: 18, scale: 8 }).notNull().default("0"),
  grossProfit: decimal("gross_profit", { precision: 18, scale: 2 }).default("0"), // Total profit before fees
  performanceFee: decimal("performance_fee", { precision: 18, scale: 2 }).default("0"), // Fee amount deducted
  netProfit: decimal("net_profit", { precision: 18, scale: 2 }).default("0"), // Profit after fees
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
  trc20HdSeed: text("trc20_hd_seed"), // HD wallet seed for generating TRC20 addresses
  trc20VaultAddress: text("trc20_vault_address"), // TRC20 USDT vault address
  minDepositUsd: decimal("min_deposit_usd", { precision: 10, scale: 2 }).default("10.00"), // Minimum deposit in USD
  freePlanRate: decimal("free_plan_rate", { precision: 8, scale: 6 }).notNull().default("0.0001"), // Free plan earning rate per 10 minutes
  // Baseline statistics for platform metrics (realistic organic growth 0.3-0.7% daily)
  baselineUsers: integer("baseline_users").default(9850),
  baselineActiveInvestments: integer("baseline_active_investments").default(15420),
  baselineTotalBalance: text("baseline_total_balance").default("845.67342158"),
  baselineTotalProfit: text("baseline_total_profit").default("127.84501632"),

  // USD Plan-specific baseline statistics ($10-$12,000 plans)
  plan10Active: integer("plan10_active").default(3240),
  plan10Amount: text("plan10_amount").default("26.59680000"),
  plan10Profit: text("plan10_profit").default("2.63142400"),

  plan20Active: integer("plan20_active").default(2850),
  plan20Amount: text("plan20_amount").default("46.79100000"),
  plan20Profit: text("plan20_profit").default("4.60951020"),

  plan50Active: integer("plan50_active").default(2410),
  plan50Amount: text("plan50_amount").default("98.77450000"),
  plan50Profit: text("plan50_profit").default("9.81986130"),

  plan100Active: integer("plan100_active").default(1980),
  plan100Amount: text("plan100_amount").default("162.54180000"),
  plan100Profit: text("plan100_profit").default("16.37471736"),

  plan300Active: integer("plan300_active").default(1620),
  plan300Amount: text("plan300_amount").default("398.91600000"),
  plan300Profit: text("plan300_profit").default("39.15205120"),

  plan500Active: integer("plan500_active").default(1350),
  plan500Amount: text("plan500_amount").default("554.04225000"),
  plan500Profit: text("plan500_profit").default("56.56110963"),

  plan1000Active: integer("plan1000_active").default(1140),
  plan1000Amount: text("plan1000_amount").default("935.84562000"),
  plan1000Profit: text("plan1000_profit").default("91.37287076"),

  plan3000Active: integer("plan3000_active").default(580),
  plan3000Amount: text("plan3000_amount").default("1428.29550000"),
  plan3000Profit: text("plan3000_profit").default("283.39430400"),

  plan6000Active: integer("plan6000_active").default(175),
  plan6000Amount: text("plan6000_amount").default("862.01250000"),
  plan6000Profit: text("plan6000_profit").default("203.72494500"),

  plan12000Active: integer("plan12000_active").default(75),
  plan12000Amount: text("plan12000_amount").default("738.62850000"),
  plan12000Profit: text("plan12000_profit").default("147.72570000"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'deposit', 'investment', 'withdrawal'
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  address: text("address"), // Bitcoin address for deposits/withdrawals (legacy)
  withdrawalAddress: text("withdrawal_address"), // TRC20 withdrawal destination address
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'rejected', 'cancelled'
  planId: integer("plan_id"), // only for investment transactions
  transactionHash: text("transaction_hash"), // actual blockchain transaction hash (after sending)
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
  isSupportAdmin: true,
  hasWallet: true,
  recoveryHash: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, "Password must contain uppercase, lowercase, number and special character"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required")
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format")
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  recoveryCode: z.string().min(1, "Recovery code is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, "Password must contain uppercase, lowercase, number and special character")
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
  userId: true, // Added this to fix validation error - userId is added from session
  status: true,
  adminResponse: true,
  respondedBy: true,
  createdAt: true,
  respondedAt: true,
  resolvedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
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