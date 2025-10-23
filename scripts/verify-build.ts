#!/usr/bin/env tsx
/**
 * Build Verification Script
 * Verifies that the production build includes all required assets including Videos
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '../..');

interface VerificationResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}

const results: VerificationResult[] = [];

function checkPath(path: string, name: string, required: boolean = true): boolean {
  if (existsSync(path)) {
    results.push({
      name,
      status: 'pass',
      message: `✅ ${name} exists`
    });
    return true;
  } else {
    results.push({
      name,
      status: required ? 'fail' : 'warn',
      message: required ? `❌ ${name} missing` : `⚠️  ${name} not found`,
      details: path
    });
    return false;
  }
}

function checkVideosFolder(): void {
  const videosPath = resolve(__dirname, 'dist/public/Videos');

  if (!existsSync(videosPath)) {
    results.push({
      name: 'Videos Folder',
      status: 'fail',
      message: '❌ Videos folder missing from production build',
      details: videosPath
    });
    return;
  }

  const files = readdirSync(videosPath);
  let totalSize = 0;
  const videoFiles = files.filter(file => {
    const filePath = join(videosPath, file);
    const stats = statSync(filePath);
    if (stats.isFile() && /\.(mov|mp4|webm|avi)$/i.test(file)) {
      totalSize += stats.size;
      return true;
    }
    return false;
  });

  if (videoFiles.length === 0) {
    results.push({
      name: 'Videos Folder',
      status: 'fail',
      message: '❌ Videos folder exists but contains no video files',
      details: videosPath
    });
  } else {
    const totalSizeGB = (totalSize / 1024 / 1024 / 1024).toFixed(2);
    results.push({
      name: 'Videos Folder',
      status: 'pass',
      message: `✅ Videos folder contains ${videoFiles.length} video files`,
      details: `Total size: ${totalSizeGB}GB\nFiles: ${videoFiles.join(', ')}`
    });
  }
}

function printResults(): void {
  console.log('\n🔍 Production Build Verification\n');
  console.log('='.repeat(60));

  let hasFailures = false;
  let hasWarnings = false;

  results.forEach(result => {
    console.log(`\n${result.message}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }

    if (result.status === 'fail') hasFailures = true;
    if (result.status === 'warn') hasWarnings = true;
  });

  console.log('\n' + '='.repeat(60));

  if (hasFailures) {
    console.log('\n❌ Build verification FAILED\n');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('\n⚠️  Build verification completed with warnings\n');
  } else {
    console.log('\n✅ Build verification PASSED\n');
  }
}

// Run verification checks
checkPath(resolve(__dirname, 'dist'), 'dist directory');
checkPath(resolve(__dirname, 'dist/public'), 'public directory');
checkPath(resolve(__dirname, 'dist/public/index.html'), 'index.html');
checkPath(resolve(__dirname, 'dist/index.js'), 'server bundle');
checkVideosFolder();

printResults();
