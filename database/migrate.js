const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'kara_boutique',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const rootDir = __dirname;
const schemaPath = path.join(rootDir, 'schema.sql');
const migrationsDir = path.join(rootDir, 'migrations');

async function acquireMigrationLock(client) {
  // Prevent concurrent migration runs against the same DB.
  await client.query('SELECT pg_advisory_lock(726523901)');
}

async function releaseMigrationLock(client) {
  await client.query('SELECT pg_advisory_unlock(726523901)');
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function hasAnyCoreTable(client) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'products', 'orders')
    ) AS exists
  `);

  return result.rows[0].exists;
}

async function applySchemaIfNeeded(client) {
  const schemaExists = await hasAnyCoreTable(client);

  if (schemaExists) {
    console.log('ℹ️  Base schema already present. Skipping schema.sql');
    return;
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  await client.query(schemaSql);
  console.log('✅ Applied base schema from schema.sql');
}

async function runMigrations(client) {
  if (!fs.existsSync(migrationsDir)) {
    console.log('ℹ️  No migrations directory found. Nothing to run.');
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const alreadyRan = await client.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1 LIMIT 1',
      [file]
    );

    if (alreadyRan.rows.length > 0) {
      console.log(`↩️  Skipping already applied migration: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    console.log(`✅ Applied migration: ${file}`);
  }
}

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("SET lock_timeout = '5s'");
    await acquireMigrationLock(client);
    await client.query('BEGIN');
    await ensureMigrationTable(client);
    await applySchemaIfNeeded(client);
    await runMigrations(client);
    await client.query('COMMIT');
    console.log('🎉 Database migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    try {
      await releaseMigrationLock(client);
    } catch (error) {
      console.error('⚠️ Could not release migration advisory lock:', error.message);
    }
    client.release();
    await pool.end();
  }
}

migrate();
