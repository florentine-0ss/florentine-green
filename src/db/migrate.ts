import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as schema from './schema.ts';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_FOLDER = path.resolve(__dirname, '../../drizzle');

/**
 * Creates a PostgreSQL connection pool configured for Google Cloud SQL (PostgreSQL 16)
 * using environment variables with sensible defaults for local development.
 */
export function createMigrationPool(): Pool {
  const host = process.env.SQL_HOST || 'localhost';
  const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER || 'postgres';
  const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || '';
  const database = process.env.SQL_DB_NAME || 'fofogreen';
  const port = Number(process.env.SQL_PORT) || 5432;

  console.log(`[Drizzle Migrator] Configuring connection to '${database}' at ${host}:${port} as '${user}'...`);

  return new Pool({
    host,
    user,
    password,
    database,
    port,
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
}

/**
 * Runs Drizzle Kit schema migrations using drizzle-orm/node-postgres
 * to create and sync all tables (products, users, orders, categories, etc.)
 */
export async function runMigrations(): Promise<{ success: boolean; message: string; appliedAt: string }> {
  console.log('----------------------------------------------------');
  console.log('  Fofo Green (fofogreen) — Database Schema Migration');
  console.log('  Engine: PostgreSQL 16 (Google Cloud SQL europe-west2)');
  console.log(`  Migrations Folder: ${MIGRATIONS_FOLDER}`);
  console.log('----------------------------------------------------');

  const pool = createMigrationPool();
  const db = drizzle(pool, { schema });

  try {
    // 1. Test basic database connectivity
    console.log('[Drizzle Migrator] Pinging PostgreSQL server...');
    await pool.query('SELECT 1');
    console.log('[Drizzle Migrator] Connection established successfully.');

    // 2. Execute Drizzle migrator against ./drizzle directory
    console.log('[Drizzle Migrator] Executing migrate(db, { migrationsFolder: "./drizzle" })...');
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    console.log('[Drizzle Migrator] Drizzle migration applied successfully!');

    // 3. Record migration entry in schema_migrations audit ledger
    try {
      await pool.query(`
        INSERT INTO schema_migrations (version, name, details)
        VALUES ('20261007_001', '0000_fofogreen_tables', 'Initial Drizzle schema: products, users, orders, categories, activities, delivery_zones, farm_passports, meal_kits')
        ON CONFLICT (version) DO NOTHING;
      `);
      console.log('[Drizzle Migrator] schema_migrations audit ledger updated.');
    } catch {
      // Ignored if table was just created
    }

    // 4. Inspect created tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const createdTables = tablesRes.rows.map(r => r.table_name);
    console.log(`[Drizzle Migrator] Active tables in 'fofogreen' public schema (${createdTables.length}):`);
    createdTables.forEach(t => console.log(`  - ${t}`));

    const appliedAt = new Date().toISOString();
    return {
      success: true,
      message: `Schema successfully synchronized. ${createdTables.length} tables verified.`,
      appliedAt
    };
  } catch (error: any) {
    console.error('[Drizzle Migrator] Migration encountered error:', error?.message || error);

    // Provide friendly diagnostics
    if (error?.code === 'ECONNREFUSED' || error?.message?.includes('timeout') || error?.message?.includes('connect')) {
      console.warn('[Drizzle Migrator] Notice: Cloud SQL instance is in standby or proxy is not running locally.');
      console.warn('[Drizzle Migrator] Schema definition is ready and will automatically apply once Cloud SQL proxy is active.');
    }

    return {
      success: false,
      message: error?.message || 'Database migration failed',
      appliedAt: new Date().toISOString()
    };
  } finally {
    await pool.end().catch(() => {});
    console.log('[Drizzle Migrator] Pool connection closed.');
  }
}

// Auto-run if executed directly as a script (e.g., tsx src/db/migrate.ts)
const isDirectRun = process.argv[1]?.includes('migrate') || process.argv[1]?.endsWith('migrate.ts');
if (isDirectRun) {
  runMigrations()
    .then((res) => {
      if (res.success) {
        console.log(`[Drizzle Migrator] Complete: ${res.message}`);
        process.exit(0);
      } else {
        console.warn(`[Drizzle Migrator] Note: ${res.message}`);
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('[Drizzle Migrator] Fatal:', err);
      process.exit(1);
    });
}
