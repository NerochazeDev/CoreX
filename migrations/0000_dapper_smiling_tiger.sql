CREATE TABLE "admin_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"vault_address" text NOT NULL,
	"deposit_address" text NOT NULL,
	"free_plan_rate" numeric(8, 6) DEFAULT '0.0001' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"min_amount" numeric(18, 8) NOT NULL,
	"roi_percentage" integer NOT NULL,
	"duration_days" integer NOT NULL,
	"color" text NOT NULL,
	"update_interval_minutes" integer DEFAULT 60 NOT NULL,
	"daily_return_rate" numeric(5, 4) DEFAULT '0.0001' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp NOT NULL,
	"current_profit" numeric(18, 8) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"plan_id" integer,
	"transaction_hash" text,
	"notes" text,
	"confirmed_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"bitcoin_address" text,
	"private_key" text,
	"seed_phrase" text,
	"balance" numeric(18, 8) DEFAULT '0' NOT NULL,
	"current_plan_id" integer,
	"is_admin" boolean DEFAULT false NOT NULL,
	"has_wallet" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
