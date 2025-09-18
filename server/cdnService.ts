import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "./monitoring";
import { cache } from "./redis";
import sharp from "sharp";
import crypto from "crypto";
import { Readable } from "stream";

// Initialize S3 client for Cloudflare R2
const r2Client = process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID
  ? new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

const CDN_BASE_URL = process.env.CDN_BASE_URL || `https://${process.env.R2_PUBLIC_DOMAIN}`;
const R2_BUCKET = process.env.R2_BUCKET || "florida-elite-assets";

interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  acl?: "public-read" | "private";
}

interface ImageTransform {
  width?: number;
  height?: number;
  format?: "webp" | "jpeg" | "png" | "avif";
  quality?: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

// Upload file to CDN
export async function uploadToCDN(
  key: string,
  body: Buffer | Uint8Array | Readable,
  options: UploadOptions = {}
): Promise<string> {
  if (!r2Client) {
    logger.warn("R2 not configured - using local storage");
    return `/local/${key}`;
  }

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: options.contentType || "application/octet-stream",
      CacheControl: options.cacheControl || "public, max-age=31536000", // 1 year
      Metadata: options.metadata,
    });

    await r2Client.send(command);

    const url = `${CDN_BASE_URL}/${key}`;
    
    logger.info("File uploaded to CDN", { key, url });

    // Invalidate any cached URLs for this key
    await cache.delete(`cdn:url:${key}`);

    return url;
  } catch (error) {
    logger.error("Failed to upload to CDN", { error, key });
    throw error;
  }
}

// Get signed URL for private content
export async function getSignedCDNUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  if (!r2Client) {
    logger.warn("R2 not configured - returning local URL");
    return `/local/${key}`;
  }

  try {
    // Check cache first
    const cacheKey = `cdn:signed:${key}:${expiresIn}`;
    const cached = await cache.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });

    // Cache for slightly less than expiration time
    await cache.set(cacheKey, url, Math.floor(expiresIn * 0.9));

    return url;
  } catch (error) {
    logger.error("Failed to generate signed URL", { error, key });
    throw error;
  }
}

// Delete file from CDN
export async function deleteFromCDN(key: string): Promise<void> {
  if (!r2Client) {
    logger.warn("R2 not configured - skipping delete");
    return;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    await r2Client.send(command);

    logger.info("File deleted from CDN", { key });

    // Invalidate cached URLs
    await cache.delete(`cdn:url:${key}`);
    await cache.invalidatePattern(`cdn:signed:${key}:*`);
  } catch (error) {
    logger.error("Failed to delete from CDN", { error, key });
    throw error;
  }
}

// Upload and process image
export async function uploadImage(
  file: Buffer,
  baseName: string,
  transforms: ImageTransform[] = []
): Promise<{
  original: string;
  variants: Record<string, string>;
}> {
  const fileHash = crypto.createHash("sha256").update(file).digest("hex").slice(0, 8);
  const timestamp = Date.now();
  const baseKey = `images/${timestamp}-${fileHash}-${baseName}`;

  // Default transforms if none provided
  if (transforms.length === 0) {
    transforms = [
      { width: 150, height: 150, format: "webp", quality: 80 }, // Thumbnail
      { width: 400, format: "webp", quality: 85 }, // Small
      { width: 800, format: "webp", quality: 85 }, // Medium
      { width: 1200, format: "webp", quality: 85 }, // Large
      { width: 2400, format: "webp", quality: 80 }, // 2x
    ];
  }

  try {
    // Upload original
    const originalKey = `${baseKey}/original`;
    const originalUrl = await uploadToCDN(originalKey, file, {
      contentType: "image/jpeg", // Will be overridden by actual type
      cacheControl: "public, max-age=31536000, immutable",
    });

    // Process and upload variants
    const variants: Record<string, string> = {};

    for (const transform of transforms) {
      const variantName = getVariantName(transform);
      const processed = await processImage(file, transform);
      
      const variantKey = `${baseKey}/${variantName}`;
      const variantUrl = await uploadToCDN(variantKey, processed.buffer, {
        contentType: `image/${transform.format || "webp"}`,
        cacheControl: "public, max-age=31536000, immutable",
        metadata: {
          width: transform.width?.toString() || "",
          height: transform.height?.toString() || "",
          format: transform.format || "webp",
        },
      });

      variants[variantName] = variantUrl;
    }

    return { original: originalUrl, variants };
  } catch (error) {
    logger.error("Failed to upload image", { error, baseName });
    throw error;
  }
}

// Process image with Sharp
async function processImage(
  input: Buffer,
  transform: ImageTransform
): Promise<{ buffer: Buffer; info: sharp.OutputInfo }> {
  let pipeline = sharp(input);

  // Resize if dimensions specified
  if (transform.width || transform.height) {
    pipeline = pipeline.resize(transform.width, transform.height, {
      fit: transform.fit || "cover",
      withoutEnlargement: true,
    });
  }

  // Convert format
  const format = transform.format || "webp";
  const quality = transform.quality || 85;

  switch (format) {
    case "webp":
      pipeline = pipeline.webp({ quality });
      break;
    case "jpeg":
      pipeline = pipeline.jpeg({ quality, progressive: true });
      break;
    case "png":
      pipeline = pipeline.png({ compressionLevel: 9 });
      break;
    case "avif":
      pipeline = pipeline.avif({ quality });
      break;
  }

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  return { buffer: data, info };
}

// Get variant name from transform
function getVariantName(transform: ImageTransform): string {
  const parts: string[] = [];

  if (transform.width && transform.height) {
    parts.push(`${transform.width}x${transform.height}`);
  } else if (transform.width) {
    parts.push(`w${transform.width}`);
  } else if (transform.height) {
    parts.push(`h${transform.height}`);
  }

  if (transform.fit && transform.fit !== "cover") {
    parts.push(transform.fit);
  }

  parts.push(transform.format || "webp");

  if (transform.quality && transform.quality !== 85) {
    parts.push(`q${transform.quality}`);
  }

  return parts.join("-");
}

// Get optimized image URL
export function getOptimizedImageUrl(
  originalUrl: string,
  transform: ImageTransform
): string {
  if (!originalUrl.startsWith(CDN_BASE_URL)) {
    return originalUrl; // Not a CDN URL
  }

  // Extract key from URL
  const key = originalUrl.replace(CDN_BASE_URL + "/", "");
  const variantName = getVariantName(transform);
  
  // Replace /original with variant name
  const variantKey = key.replace("/original", `/${variantName}`);
  
  return `${CDN_BASE_URL}/${variantKey}`;
}

// Preload images for better performance
export async function preloadImages(urls: string[]): Promise<void> {
  if (!r2Client) return;

  const promises = urls.map(async (url) => {
    if (!url.startsWith(CDN_BASE_URL)) return;

    const key = url.replace(CDN_BASE_URL + "/", "");
    
    try {
      // Check if object exists (triggers CDN cache)
      const command = new HeadObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      });
      
      await r2Client.send(command);
    } catch (error) {
      // Ignore errors - just best effort preloading
    }
  });

  await Promise.all(promises);
}

// Generate responsive image srcset
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [400, 800, 1200, 1600, 2400]
): string {
  return widths
    .map(width => {
      const url = getOptimizedImageUrl(baseUrl, { width, format: "webp" });
      return `${url} ${width}w`;
    })
    .join(", ");
}

// Generate picture element HTML
export function generatePictureElement(
  baseUrl: string,
  alt: string,
  className?: string,
  sizes?: string
): string {
  const webpSrcSet = generateSrcSet(baseUrl);
  const jpegSrcSet = generateSrcSet(baseUrl.replace("webp", "jpeg"));

  return `
<picture>
  <source type="image/webp" srcset="${webpSrcSet}" sizes="${sizes || "(max-width: 768px) 100vw, 50vw"}">
  <source type="image/jpeg" srcset="${jpegSrcSet}" sizes="${sizes || "(max-width: 768px) 100vw, 50vw"}">
  <img 
    src="${getOptimizedImageUrl(baseUrl, { width: 800, format: "jpeg" })}" 
    alt="${alt}"
    class="${className || ""}"
    loading="lazy"
    decoding="async"
  >
</picture>
  `.trim();
}
