import { db } from './db';
import { sql } from 'drizzle-orm';

// Check if database has any tables at all (completely new database)
async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    return Number(result[0]?.table_count) === 0;
  } catch {
    return true; // Assume empty if we can't check
  }
}

// Check if core tables exist
async function tablesExist(): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as users_exist
    `);
    return result[0]?.users_exist === true;
  } catch {
    return false;
  }
}

// Add missing columns to existing tables
async function addMissingColumns(): Promise<void> {
  try {
    // Add missing columns to users table
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS trc20_deposit_address TEXT`);
    
    // Add missing columns to investments table
    await db.execute(sql`ALTER TABLE investments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`);
    await db.execute(sql`ALTER TABLE investments ADD COLUMN IF NOT EXISTS usd_amount DECIMAL(18, 2)`);
    await db.execute(sql`ALTER TABLE investments ADD COLUMN IF NOT EXISTS gross_profit DECIMAL(18, 2) DEFAULT 0`);
    await db.execute(sql`ALTER TABLE investments ADD COLUMN IF NOT EXISTS performance_fee DECIMAL(18, 2) DEFAULT 0`);
    await db.execute(sql`ALTER TABLE investments ADD COLUMN IF NOT EXISTS net_profit DECIMAL(18, 2) DEFAULT 0`);
    
    // Add missing columns to investment_plans table
    await db.execute(sql`ALTER TABLE investment_plans ADD COLUMN IF NOT EXISTS usd_min_amount DECIMAL(18, 2)`);
    await db.execute(sql`ALTER TABLE investment_plans ADD COLUMN IF NOT EXISTS performance_fee_percentage INTEGER DEFAULT 0`);
    
    // Add missing columns to admin_config table
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS trc20_hd_seed TEXT`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS trc20_vault_address TEXT`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS min_deposit_usd DECIMAL(10, 2) DEFAULT 10.00`);
    
    // Add baseline statistics columns
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS baseline_users INTEGER DEFAULT 9850`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS baseline_active_investments INTEGER DEFAULT 15420`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS baseline_total_balance TEXT DEFAULT '845.67342158'`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS baseline_total_profit TEXT DEFAULT '127.84501632'`);
    
    // Add plan-specific baseline statistics columns
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan10_active INTEGER DEFAULT 3240`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan10_amount TEXT DEFAULT '26.59680000'`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan10_profit TEXT DEFAULT '2.63142400'`);
    
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan20_active INTEGER DEFAULT 2850`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan20_amount TEXT DEFAULT '46.79100000'`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan20_profit TEXT DEFAULT '4.60951020'`);
    
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan50_active INTEGER DEFAULT 2410`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan50_amount TEXT DEFAULT '98.77450000'`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan50_profit TEXT DEFAULT '9.81986130'`);
    
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan100_active INTEGER DEFAULT 1980`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan100_amount TEXT DEFAULT '162.54180000'`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan100_profit TEXT DEFAULT '16.37471736'`);
    
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan300_active INTEGER DEFAULT 1620`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan300_amount TEXT DEFAULT '398.91600000'`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan300_profit TEXT DEFAULT '39.15205120'`);
    
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan500_active INTEGER DEFAULT 1350`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan500_amount TEXT DEFAULT '554.04225000'`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan500_profit TEXT DEFAULT '56.56110963'`);
    
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan1000_active INTEGER DEFAULT 1140`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan1000_amount TEXT DEFAULT '935.84562000'`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan1000_profit TEXT DEFAULT '91.37287076'`);
    
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan3000_active INTEGER DEFAULT 580`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan3000_amount TEXT DEFAULT '1428.29550000'`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan3000_profit TEXT DEFAULT '283.39430400'`);
    
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan6000_active INTEGER DEFAULT 175`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan6000_amount TEXT DEFAULT '862.01250000'`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan6000_profit TEXT DEFAULT '203.72494500'`);
    
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan12000_active INTEGER DEFAULT 75`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan12000_amount TEXT DEFAULT '738.62850000'`);
    await db.execute(sql`ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS plan12000_profit TEXT DEFAULT '147.72570000'`);
    
    console.log('✅ Missing columns added successfully');
  } catch (error) {
    console.warn('⚠️ Error adding missing columns:', error);
    // Continue execution - some columns might already exist
  }
}

// Run safe schema updates that won't break existing data
export async function runSafeMigrations() {
  try {
    const isEmpty = await isDatabaseEmpty();
    const hasCoreTables = await tablesExist();
    
    if (isEmpty) {
      console.log('🆕 New database detected - setting up complete schema...');
    } else if (hasCoreTables) {
      console.log('📦 Database tables exist, checking for missing columns...');
      // Add missing columns to existing tables
      await addMissingColumns();
      console.log('✅ Database schema is up to date');
      return;
    } else {
      console.log('📦 Creating missing database tables...');
    }

    console.log('Creating database tables...');
    
    // Create tables with IF NOT EXISTS to avoid conflicts
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        balance DECIMAL(20, 8) DEFAULT 0,
        bitcoin_address VARCHAR(255),
        private_key VARCHAR(255),
        seed_phrase TEXT,
        investment_plan_id INTEGER,
        is_admin BOOLEAN DEFAULT FALSE,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        country TEXT,
        current_plan_id INTEGER,
        has_wallet BOOLEAN DEFAULT FALSE,
        accept_marketing BOOLEAN DEFAULT FALSE,
        bio TEXT,
        website TEXT,
        avatar TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS investment_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        min_amount DECIMAL(20, 8) NOT NULL,
        max_amount DECIMAL(20, 8),
        daily_return_rate DECIMAL(10, 6) NOT NULL,
        duration_days INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        roi_percentage INTEGER,
        color TEXT,
        update_interval_minutes INTEGER DEFAULT 60,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS investments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        plan_id INTEGER REFERENCES investment_plans(id),
        amount DECIMAL(20, 8) NOT NULL,
        start_date TIMESTAMP DEFAULT NOW(),
        end_date TIMESTAMP,
        current_profit DECIMAL(20, 8) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        type VARCHAR(50) DEFAULT 'info',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_config (
        id SERIAL PRIMARY KEY,
        vault_address VARCHAR(255) NOT NULL,
        deposit_address VARCHAR(255) NOT NULL,
        free_plan_rate DECIMAL(10, 6) DEFAULT 0.001,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        address VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        plan_id INTEGER,
        transaction_hash VARCHAR(255),
        notes TEXT,
        confirmed_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        confirmed_at TIMESTAMP
      )
    `);

    await db.execute(sql`
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
    `);

    console.log('✅ Database tables created successfully');
    
    // Always add missing columns after table creation
    await addMissingColumns();
    
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    throw error;
  }
}