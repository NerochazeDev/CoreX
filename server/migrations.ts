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

// Run safe schema updates that won't break existing data
export async function runSafeMigrations() {
  try {
    const isEmpty = await isDatabaseEmpty();
    const hasCoreTables = await tablesExist();
    
    if (isEmpty) {
      console.log('🆕 New database detected - setting up complete schema...');
    } else if (hasCoreTables) {
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
    
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    throw error;
  }
}