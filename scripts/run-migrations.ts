#!/usr/bin/env tsx
/**
 * Migration Runner Script
 *
 * Usage:
 *   npm run db:migrate        - Run all pending migrations
 *   npm run db:migrate:status - Show migration status
 *   npm run db:migrate:verify - Verify migration integrity
 */

import { runMigrations, showMigrationStatus, verifyMigrationIntegrity, rollbackLastMigration } from '../server/migrations';

async function main() {
  const command = process.argv[2] || 'up';

  try {
    switch (command) {
      case 'up':
        await runMigrations();
        break;

      case 'status':
        await showMigrationStatus();
        break;

      case 'verify':
        const isValid = await verifyMigrationIntegrity();
        process.exit(isValid ? 0 : 1);
        break;

      case 'rollback':
        await rollbackLastMigration();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log('Available commands: up, status, verify, rollback');
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
