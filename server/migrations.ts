/**
 * Database Migration System
 *
 * Handles applying and rolling back database migrations with proper tracking.
 */

import { db, pool } from './db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Migration tracking table
const MIGRATION_TABLE = `
CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
  execution_time_ms INTEGER,
  checksum VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_migration_version ON migration_history(version);
CREATE INDEX IF NOT EXISTS idx_migration_applied_at ON migration_history(applied_at);
`;

interface Migration {
  version: string;
  name: string;
  filename: string;
  content: string;
  checksum: string;
}

interface AppliedMigration {
  id: number;
  version: string;
  name: string;
  applied_at: Date;
  execution_time_ms: number | null;
  checksum: string | null;
}

/**
 * Initialize the migration tracking table
 */
export async function initMigrationTable(): Promise<void> {
  try {
    await pool.query(MIGRATION_TABLE);
    console.log('✅ Migration tracking table initialized');
  } catch (error) {
    console.error('❌ Failed to initialize migration table:', error);
    throw error;
  }
}

/**
 * Calculate checksum for migration content
 */
function calculateChecksum(content: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Get all migration files from the migrations directory
 */
export function getMigrationFiles(): Migration[] {
  const migrationsDir = path.join(process.cwd(), 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 No migrations directory found');
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return files.map(filename => {
    const content = fs.readFileSync(path.join(migrationsDir, filename), 'utf-8');
    const version = filename.split('_')[0];
    const name = filename.replace('.sql', '').substring(version.length + 1);

    return {
      version,
      name,
      filename,
      content,
      checksum: calculateChecksum(content)
    };
  });
}

/**
 * Get applied migrations from the database
 */
export async function getAppliedMigrations(): Promise<AppliedMigration[]> {
  try {
    const result = await pool.query<AppliedMigration>(
      'SELECT * FROM migration_history ORDER BY version ASC'
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Failed to get applied migrations:', error);
    return [];
  }
}

/**
 * Get pending migrations that haven't been applied yet
 */
export async function getPendingMigrations(): Promise<Migration[]> {
  const allMigrations = getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();
  const appliedVersions = new Set(appliedMigrations.map(m => m.version));

  return allMigrations.filter(m => !appliedVersions.has(m.version));
}

/**
 * Apply a single migration
 */
async function applyMigration(migration: Migration): Promise<void> {
  const startTime = Date.now();

  // Split migration into UP and DOWN sections
  const upMatch = migration.content.match(/-- UP\n([\s\S]*?)(?=-- DOWN|$)/);
  if (!upMatch) {
    throw new Error(`Migration ${migration.filename} is missing -- UP section`);
  }

  const upSQL = upMatch[1].trim();

  try {
    // Execute the migration in a transaction
    await pool.query('BEGIN');

    // Run the UP migration
    await pool.query(upSQL);

    // Record the migration
    const executionTime = Date.now() - startTime;
    await pool.query(
      `INSERT INTO migration_history (version, name, execution_time_ms, checksum)
       VALUES ($1, $2, $3, $4)`,
      [migration.version, migration.name, executionTime, migration.checksum]
    );

    await pool.query('COMMIT');

    console.log(`✅ Applied migration: ${migration.filename} (${executionTime}ms)`);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`❌ Failed to apply migration ${migration.filename}:`, error);
    throw error;
  }
}

/**
 * Apply all pending migrations
 */
export async function runMigrations(): Promise<void> {
  console.log('🔄 Checking for pending migrations...');

  await initMigrationTable();

  const pending = await getPendingMigrations();

  if (pending.length === 0) {
    console.log('✅ No pending migrations');
    return;
  }

  console.log(`📋 Found ${pending.length} pending migration(s)`);

  for (const migration of pending) {
    await applyMigration(migration);
  }

  console.log(`✅ Successfully applied ${pending.length} migration(s)`);
}

/**
 * Rollback the last applied migration
 */
export async function rollbackLastMigration(): Promise<void> {
  console.log('🔄 Rolling back last migration...');

  const applied = await getAppliedMigrations();

  if (applied.length === 0) {
    console.log('⚠️  No migrations to rollback');
    return;
  }

  const lastMigration = applied[applied.length - 1];
  const allMigrations = getMigrationFiles();
  const migrationFile = allMigrations.find(m => m.version === lastMigration.version);

  if (!migrationFile) {
    throw new Error(`Migration file not found for version ${lastMigration.version}`);
  }

  // Extract DOWN section
  const downMatch = migrationFile.content.match(/-- DOWN\n([\s\S]*?)$/);
  if (!downMatch) {
    throw new Error(`Migration ${migrationFile.filename} is missing -- DOWN section`);
  }

  const downSQL = downMatch[1].trim();

  try {
    await pool.query('BEGIN');

    // Run the DOWN migration
    await pool.query(downSQL);

    // Remove the migration record
    await pool.query(
      'DELETE FROM migration_history WHERE version = $1',
      [lastMigration.version]
    );

    await pool.query('COMMIT');

    console.log(`✅ Rolled back migration: ${migrationFile.filename}`);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`❌ Failed to rollback migration:`, error);
    throw error;
  }
}

/**
 * Show migration status
 */
export async function showMigrationStatus(): Promise<void> {
  await initMigrationTable();

  const allMigrations = getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();
  const appliedVersions = new Set(appliedMigrations.map(m => m.version));

  console.log('\n📊 Migration Status:\n');
  console.log('Version          | Status   | Name');
  console.log('-----------------|----------|----------------------------------');

  for (const migration of allMigrations) {
    const status = appliedVersions.has(migration.version) ? '✅ Applied' : '⏳ Pending';
    console.log(`${migration.version} | ${status} | ${migration.name}`);
  }

  console.log(`\nTotal: ${allMigrations.length} migrations (${appliedMigrations.length} applied, ${allMigrations.length - appliedMigrations.length} pending)\n`);
}

/**
 * Verify migration checksums
 */
export async function verifyMigrationIntegrity(): Promise<boolean> {
  const allMigrations = getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();

  let hasIssues = false;

  for (const applied of appliedMigrations) {
    const migration = allMigrations.find(m => m.version === applied.version);

    if (!migration) {
      console.error(`❌ Migration file missing: ${applied.version} ${applied.name}`);
      hasIssues = true;
      continue;
    }

    if (applied.checksum && migration.checksum !== applied.checksum) {
      console.error(`❌ Checksum mismatch for migration: ${migration.filename}`);
      console.error(`   Expected: ${applied.checksum}`);
      console.error(`   Got: ${migration.checksum}`);
      hasIssues = true;
    }
  }

  if (hasIssues) {
    console.error('\n⚠️  Migration integrity check FAILED');
    return false;
  }

  console.log('✅ All migrations verified successfully');
  return true;
}
