#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Recursively copy directory contents
 */
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Source directory does not exist: ${src}`);
    return false;
  }

  // Create destination directory if it doesn't exist
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  
  return true;
}

async function main() {
  const clientDistPath = path.join(projectRoot, 'client', 'dist');
  const targetDistPath = path.join(projectRoot, 'dist', 'public');

  console.log('Copying client build artifacts...');
  console.log(`From: ${clientDistPath}`);
  console.log(`To: ${targetDistPath}`);

  try {
    // Remove existing dist/public directory
    if (fs.existsSync(targetDistPath)) {
      fs.rmSync(targetDistPath, { recursive: true, force: true });
      console.log('Removed existing dist/public directory');
    }

    // Copy client/dist to dist/public
    const success = copyDirSync(clientDistPath, targetDistPath);
    
    if (success) {
      console.log('✅ Client build artifacts copied successfully!');
      
      // Verify the copy worked
      const indexExists = fs.existsSync(path.join(targetDistPath, 'index.html'));
      if (indexExists) {
        console.log('✅ Verified: index.html found in target directory');
      } else {
        console.warn('⚠️  Warning: index.html not found in target directory');
      }
    } else {
      console.error('❌ Failed to copy client build artifacts');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error copying client build:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});