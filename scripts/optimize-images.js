import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../client/public');

const logosToConvert = [
  'I-am-the-logo.png',
  'logo-big.png',
  'new-logo-trans.png',
];

async function optimizeLogos() {
  console.log('🎨 Starting logo optimization...\n');

  for (const logo of logosToConvert) {
    const inputPath = path.join(publicDir, logo);
    const outputPath = path.join(publicDir, logo.replace('.png', '.webp'));

    try {
      const stats = await fs.stat(inputPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`📦 Converting ${logo} (${sizeMB}MB)...`);

      await sharp(inputPath)
        .webp({ quality: 85, effort: 6 })
        .toFile(outputPath);

      const newStats = await fs.stat(outputPath);
      const newSizeMB = (newStats.size / 1024 / 1024).toFixed(2);
      const savings = ((1 - newStats.size / stats.size) * 100).toFixed(1);

      console.log(`✅ Created ${logo.replace('.png', '.webp')} (${newSizeMB}MB) - ${savings}% smaller\n`);
    } catch (error) {
      console.error(`❌ Error converting ${logo}:`, error.message);
    }
  }

  console.log('\n🧹 Removing unused logo files...');
  const unusedLogos = [
    'florida-local-new-logo.png',
    'florida-local-logo-official.png',
  ];

  for (const logo of unusedLogos) {
    try {
      await fs.unlink(path.join(publicDir, logo));
      console.log(`✅ Deleted ${logo}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`❌ Error deleting ${logo}:`, error.message);
      }
    }
  }

  console.log('\n✨ Logo optimization complete!');
}

optimizeLogos().catch(console.error);
