#!/usr/bin/env tsx
/**
 * Create a new migration file
 *
 * Usage: npm run db:migrate:create -- <migration_name>
 */

import fs from 'fs';
import path from 'path';

function createMigration(name: string) {
  if (!name) {
    console.error('❌ Migration name is required');
    console.log('Usage: npm run db:migrate:create -- <migration_name>');
    process.exit(1);
  }

  // Generate timestamp version
  const now = new Date();
  const version = now.toISOString()
    .replace(/[-:T]/g, '')
    .replace(/\..+/, '')
    .slice(0, 14);

  // Clean up name
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const filename = `${version}_${cleanName}.sql`;
  const filepath = path.join(process.cwd(), 'migrations', filename);

  const template = `-- Migration: ${cleanName}
-- Created: ${now.toISOString()}
-- Description: Add description here

-- UP
-- Write your UP migration here (applied when running migrations)



-- DOWN
-- Write your DOWN migration here (applied when rolling back)


`;

  fs.writeFileSync(filepath, template, 'utf-8');

  console.log(`✅ Created migration: ${filename}`);
  console.log(`📝 Edit the file at: migrations/${filename}`);
}

const migrationName = process.argv[2];
createMigration(migrationName);
