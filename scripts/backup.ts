import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

  try {
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });

    console.log('🔄 Starting database backup...');
    console.log(`📁 Backup location: ${backupFile}`);

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Create pg_dump process
    const pgDump = spawn('pg_dump', [
      databaseUrl,
      '--no-password',
      '--verbose',
      '--clean',
      '--no-acl',
      '--no-owner',
      '--format=plain',
      '--file', backupFile
    ], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    pgDump.stdout?.on('data', (data) => {
      output += data.toString();
    });

    pgDump.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    const exitCode = await new Promise<number>((resolve) => {
      pgDump.on('close', resolve);
    });

    if (exitCode !== 0) {
      throw new Error(`pg_dump failed with exit code ${exitCode}: ${errorOutput}`);
    }

    // Verify backup file was created and has content
    const stats = await fs.stat(backupFile);
    if (stats.size === 0) {
      throw new Error('Backup file is empty');
    }

    console.log('✅ Database backup completed successfully!');
    console.log(`📊 Backup size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`📁 File: ${backupFile}`);

    // Clean up old backups (keep last 7 days)
    await cleanupOldBackups(backupDir);

  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

async function cleanupOldBackups(backupDir: string) {
  try {
    const files = await fs.readdir(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        timestamp: file.replace('backup-', '').replace('.sql', '')
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // Keep only the 7 most recent backups
    const filesToDelete = backupFiles.slice(7);
    
    for (const file of filesToDelete) {
      await fs.unlink(file.path);
      console.log(`🗑️  Cleaned up old backup: ${file.name}`);
    }

    if (filesToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${filesToDelete.length} old backup(s)`);
    }
  } catch (error) {
    console.error('⚠️  Warning: Failed to cleanup old backups:', error);
  }
}

async function restore(backupFile: string) {
  try {
    console.log('🔄 Starting database restore...');
    console.log(`📁 Restore from: ${backupFile}`);

    // Verify backup file exists
    await fs.access(backupFile);

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    console.log('⚠️  WARNING: This will overwrite the current database!');
    
    // In a real implementation, you might want to add a confirmation prompt
    // For now, we'll just proceed with the restore

    const psql = spawn('psql', [
      databaseUrl,
      '--file', backupFile,
      '--verbose'
    ], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    psql.stdout?.on('data', (data) => {
      output += data.toString();
    });

    psql.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    const exitCode = await new Promise<number>((resolve) => {
      psql.on('close', resolve);
    });

    if (exitCode !== 0) {
      throw new Error(`psql failed with exit code ${exitCode}: ${errorOutput}`);
    }

    console.log('✅ Database restore completed successfully!');
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  }
}

// CLI handling
const command = process.argv[2];
const arg = process.argv[3];

if (import.meta.url === `file://${process.argv[1]}`) {
  if (command === 'backup') {
    backup();
  } else if (command === 'restore' && arg) {
    restore(arg);
  } else {
    console.log('Usage:');
    console.log('  npm run backup        - Create a database backup');
    console.log('  npm run backup:restore <file> - Restore from backup file');
    process.exit(1);
  }
}

export { backup, restore };
