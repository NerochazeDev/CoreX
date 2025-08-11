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
  password: text("password_hash").notNull(),
  bitcoinAddress: text("bitcoin_address"), // nullable until wallet is set up
  privateKey: text("private_key"), // nullable until wallet is set up
  seedPhrase: text("seed_phrase"),
  balance: decimal("balance", { precision: 18, scale: 8 }).notNull().default("0"),
  currentPlanId: integer("current_plan_id"), // null for free plan
  isAdmin: boolean("is_admin").notNull().default(false),
  hasWallet: boolean("has_wallet").notNull().default(false), // tracks if user has set up wallet
  acceptMarketing: boolean("accept_marketing").notNull().default(false),
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

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  category: text("category").notNull().default("general"), // general, technical, billing, complaint
  imageUrl: text("image_url"), // URL to uploaded image
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const supportResponses = pgTable("support_responses", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  adminId: integer("admin_id"), // null for user responses
  userId: integer("user_id"), // null for admin responses
  message: text("message").notNull(),
  isFromAdmin: boolean("is_from_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportResponseSchema = createInsertSchema(supportResponses).omit({
  id: true,
  createdAt: true,
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
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportResponse = z.infer<typeof insertSupportResponseSchema>;
export type SupportResponse = typeof supportResponses.$inferSelect;