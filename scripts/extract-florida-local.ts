/**
 * Florida Local Content Extraction Script
 *
 * This script fetches all content from thefloridalocal.com including:
 * - All images (downloads to local assets)
 * - All text content
 * - Video embeds
 * - Page structure
 *
 * Usage: tsx scripts/extract-florida-local.ts
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

const TARGET_URL = 'https://thefloridalocal.com';
const OUTPUT_DIR = path.join(process.cwd(), 'attached_assets', 'florida_local');
const CONTENT_FILE = path.join(process.cwd(), 'FLORIDA_LOCAL_EXTRACTED_CONTENT.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface ExtractedContent {
  url: string;
  title: string;
  html: string;
  images: Array<{ url: string; filename: string; downloaded: boolean }>;
  videos: Array<{ url: string; type: string }>;
  links: string[];
  meta: {
    description?: string;
    keywords?: string[];
  };
  sections: Array<{
    name: string;
    content: string;
    images: string[];
  }>;
}

/**
 * Fetch HTML content from URL
 */
async function fetchHTML(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Download image to local file system
 */
async function downloadImage(imageUrl: string, filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const outputPath = path.join(OUTPUT_DIR, filename);

      // Skip if already downloaded
      if (fs.existsSync(outputPath)) {
        console.log(`✓ Skipped (exists): ${filename}`);
        resolve(true);
        return;
      }

      const protocol = imageUrl.startsWith('https') ? https : http;
      const file = fs.createWriteStream(outputPath);

      protocol.get(imageUrl, (res) => {
        if (res.statusCode !== 200) {
          console.log(`✗ Failed: ${imageUrl} (${res.statusCode})`);
          resolve(false);
          return;
        }

        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded: ${filename}`);
          resolve(true);
        });
      }).on('error', (err) => {
        fs.unlink(outputPath, () => {});
        console.log(`✗ Error: ${imageUrl} - ${err.message}`);
        resolve(false);
      });
    } catch (error) {
      console.log(`✗ Exception: ${imageUrl}`);
      resolve(false);
    }
  });
}

/**
 * Extract all images from HTML
 */
function extractImages(html: string, baseUrl: string): Array<{ url: string; alt: string }> {
  const images: Array<{ url: string; alt: string }> = [];
  const imgRegex = /<img[^>]+src="([^">]+)"[^>]*alt="([^">]*)"[^>]*>/gi;
  const imgRegex2 = /<img[^>]+src="([^">]+)"[^>]*>/gi;

  let match;

  // Match images with alt text
  while ((match = imgRegex.exec(html)) !== null) {
    let imgUrl = match[1];
    const alt = match[2] || '';

    // Convert relative URLs to absolute
    if (imgUrl.startsWith('//')) {
      imgUrl = 'https:' + imgUrl;
    } else if (imgUrl.startsWith('/')) {
      imgUrl = new URL(imgUrl, baseUrl).href;
    } else if (!imgUrl.startsWith('http')) {
      imgUrl = new URL(imgUrl, baseUrl).href;
    }

    images.push({ url: imgUrl, alt });
  }

  // Match images without alt text
  while ((match = imgRegex2.exec(html)) !== null) {
    let imgUrl = match[1];

    if (imgUrl.startsWith('//')) {
      imgUrl = 'https:' + imgUrl;
    } else if (imgUrl.startsWith('/')) {
      imgUrl = new URL(imgUrl, baseUrl).href;
    } else if (!imgUrl.startsWith('http')) {
      imgUrl = new URL(imgUrl, baseUrl).href;
    }

    // Check if not already added
    if (!images.find(img => img.url === imgUrl)) {
      images.push({ url: imgUrl, alt: '' });
    }
  }

  return images;
}

/**
 * Extract video embeds from HTML
 */
function extractVideos(html: string): Array<{ url: string; type: string }> {
  const videos: Array<{ url: string; type: string }> = [];

  // YouTube embeds
  const youtubeRegex = /(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]+)/gi;
  let match;
  while ((match = youtubeRegex.exec(html)) !== null) {
    videos.push({
      url: `https://www.youtube.com/watch?v=${match[1]}`,
      type: 'youtube'
    });
  }

  // Vimeo embeds
  const vimeoRegex = /vimeo\.com\/video\/(\d+)/gi;
  while ((match = vimeoRegex.exec(html)) !== null) {
    videos.push({
      url: `https://vimeo.com/${match[1]}`,
      type: 'vimeo'
    });
  }

  // Direct video tags
  const videoRegex = /<video[^>]+src="([^">]+)"[^>]*>/gi;
  while ((match = videoRegex.exec(html)) !== null) {
    videos.push({
      url: match[1],
      type: 'direct'
    });
  }

  return videos;
}

/**
 * Extract meta information
 */
function extractMeta(html: string): { description?: string; keywords?: string[] } {
  const meta: { description?: string; keywords?: string[] } = {};

  // Description
  const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^">]+)"/i);
  if (descMatch) {
    meta.description = descMatch[1];
  }

  // Keywords
  const keywordsMatch = html.match(/<meta[^>]+name="keywords"[^>]+content="([^">]+)"/i);
  if (keywordsMatch) {
    meta.keywords = keywordsMatch[1].split(',').map(k => k.trim());
  }

  return meta;
}

/**
 * Generate safe filename from URL
 */
function generateFilename(imageUrl: string, index: number): string {
  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    const ext = path.extname(pathname) || '.jpg';
    const basename = path.basename(pathname, ext).replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    return `${basename}_${index}${ext}`;
  } catch {
    return `image_${index}.jpg`;
  }
}

/**
 * Main extraction function
 */
async function extractFloridaLocalContent() {
  console.log('🏝️  Florida Local Content Extractor');
  console.log('=====================================\n');
  console.log(`Fetching: ${TARGET_URL}`);

  try {
    // Fetch HTML
    const html = await fetchHTML(TARGET_URL);
    console.log(`✓ Fetched HTML (${html.length} characters)\n`);

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'The Florida Local';

    // Extract images
    console.log('Extracting images...');
    const imageList = extractImages(html, TARGET_URL);
    console.log(`Found ${imageList.length} images\n`);

    // Download images
    console.log('Downloading images...');
    const downloadedImages = [];
    for (let i = 0; i < imageList.length; i++) {
      const img = imageList[i];
      const filename = generateFilename(img.url, i);
      const success = await downloadImage(img.url, filename);
      downloadedImages.push({
        url: img.url,
        filename,
        downloaded: success,
        alt: img.alt
      });
    }
    console.log('');

    // Extract videos
    console.log('Extracting videos...');
    const videos = extractVideos(html);
    console.log(`Found ${videos.length} video embeds\n`);

    // Extract meta
    const meta = extractMeta(html);

    // Build extracted content object
    const extracted: ExtractedContent = {
      url: TARGET_URL,
      title,
      html,
      images: downloadedImages,
      videos,
      links: [],
      meta,
      sections: []
    };

    // Save to JSON file
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(extracted, null, 2));
    console.log(`✓ Content saved to: ${CONTENT_FILE}`);
    console.log(`✓ Images saved to: ${OUTPUT_DIR}`);

    // Summary
    console.log('\n📊 Extraction Summary:');
    console.log('======================');
    console.log(`Total Images: ${downloadedImages.length}`);
    console.log(`Downloaded: ${downloadedImages.filter(i => i.downloaded).length}`);
    console.log(`Failed: ${downloadedImages.filter(i => !i.downloaded).length}`);
    console.log(`Videos: ${videos.length}`);
    console.log('');

    console.log('✅ Extraction complete!');
    console.log('\nNext steps:');
    console.log('1. Review extracted content in:', CONTENT_FILE);
    console.log('2. Check downloaded images in:', OUTPUT_DIR);
    console.log('3. Update florida-local-elite.tsx with real content');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run extraction
extractFloridaLocalContent();
