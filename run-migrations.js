
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database for migrations');

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Check which migrations have been run
    const executedMigrations = await client.query('SELECT filename FROM migrations');
    const executedFiles = executedMigrations.rows.map(row => row.filename);

    // Read migration files
    const migrationDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log('📋 Found migration files:', migrationFiles);
    console.log('✅ Already executed:', executedFiles);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedFiles.includes(file)) {
        console.log(`🚀 Running migration: ${file}`);
        
        const migrationSQL = fs.readFileSync(path.join(migrationDir, file), 'utf8');
        
        // Split by semicolons and execute each statement
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
          if (statement.trim()) {
            await client.query(statement);
          }
        }

        // Mark migration as executed
        await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
        console.log(`✅ Migration ${file} completed`);
      }
    }

    console.log('🎉 All migrations completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
