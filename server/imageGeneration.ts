/**
 * Image Generation Service - DALL-E 3 Integration
 * 
 * Enterprise image generation with:
 * - Product images and mockups
 * - Business branding assets
 * - Social media graphics
 * - Custom styles and variations
 * - Image optimization and storage
 */

import OpenAI from "openai";
import { logger } from "./monitoring";
import { cache } from "./redis";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import sharp from "sharp";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";

const DALL_E_MODEL = "dall-e-3";

// Image generation costs
const IMAGE_COSTS = {
  "1024x1024": 0.04,
  "1024x1792": 0.08,
  "1792x1024": 0.08
};

export type ImageSize = "1024x1024" | "1024x1792" | "1792x1024";
export type ImageStyle = "vivid" | "natural";
export type ImageQuality = "standard" | "hd";

export interface ImageGenerationOptions {
  businessId?: string;
  prompt: string;
  negativePrompt?: string;
  size?: ImageSize;
  style?: ImageStyle;
  quality?: ImageQuality;
  numberOfImages?: number;
  category?: 'product' | 'logo' | 'social' | 'banner' | 'background' | 'marketing';
  enhancePrompt?: boolean;
  variations?: boolean;
  useCache?: boolean;
}

export interface GeneratedImage {
  id: string;
  url: string;
  localPath?: string;
  s3Url?: string;
  prompt: string;
  enhancedPrompt?: string;
  metadata: {
    size: ImageSize;
    style: ImageStyle;
    quality: ImageQuality;
    model: string;
    cost: number;
    generationTime: number;
    fileSize?: number;
    format: string;
    dimensions: {
      width: number;
      height: number;
    };
  };
  category?: string;
  businessId?: string;
  tags?: string[];
  createdAt: Date;
}

export interface ImageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrompt: string;
  styleModifiers: string[];
  defaultSize: ImageSize;
  examples?: string[];
}

class ImageGenerationService {
  private client: OpenAI | null = null;
  private storageService: ObjectStorageService | S3Service | null = null;
  private localStoragePath = path.join(process.cwd(), 'attached_assets', 'generated_images');
  private cacheExpiry = 86400; // 24 hours
  private isConfigured = false;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn("⚠️ OpenAI API key not configured - Image generation features will be disabled");
      this.isConfigured = false;
      return;
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.isConfigured = true;

    // Initialize storage service if available
    this.initializeStorage();

    // Ensure local storage directory exists
    this.ensureLocalStorage();

    logger.info("✅ Image Generation Service initialized");
  }

  private checkConfiguration(): void {
    if (!this.isConfigured || !this.client) {
      throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.");
    }
  }

  /**
   * Initialize storage service (S3 or Object Storage)
   */
  private async initializeStorage() {
    try {
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        this.storageService = new S3Service();
        logger.info("Using S3 for image storage");
      } else if (process.env.PUBLIC_OBJECT_SEARCH_PATHS) {
        this.storageService = new ObjectStorageService();
        logger.info("Using Object Storage for images");
      }
    } catch (error) {
      logger.warn("No cloud storage configured, using local storage only");
    }
  }

  /**
   * Ensure local storage directory exists
   */
  private async ensureLocalStorage() {
    try {
      await fs.mkdir(this.localStoragePath, { recursive: true });
    } catch (error) {
      logger.error("Failed to create local storage directory", { error });
    }
  }

  /**
   * Generate image with DALL-E 3
   */
  async generateImage(options: ImageGenerationOptions): Promise<GeneratedImage> {
    this.checkConfiguration();
    
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(options);

    // Check cache first
    if (options.useCache !== false) {
      const cached = await this.getCachedImage(cacheKey);
      if (cached) {
        logger.info("Image retrieved from cache", { cacheKey });
        return cached;
      }
    }

    try {
      // Enhance prompt if requested
      const finalPrompt = options.enhancePrompt 
        ? await this.enhancePrompt(options.prompt, options)
        : options.prompt;

      // Add negative prompt handling
      const promptWithNegative = options.negativePrompt
        ? `${finalPrompt}. Avoid: ${options.negativePrompt}`
        : finalPrompt;

      // Generate image
      const response = await this.client!.images.generate({
        model: DALL_E_MODEL,
        prompt: promptWithNegative,
        n: 1, // DALL-E 3 only supports n=1
        size: options.size || "1024x1024",
        style: options.style || "vivid",
        quality: options.quality || "standard",
      });

      const imageUrl = response.data[0].url;
      const revisedPrompt = response.data[0].revised_prompt;

      if (!imageUrl) {
        throw new Error("No image URL returned from API");
      }

      // Download and save image
      const savedImage = await this.saveImage(imageUrl, options);

      // Calculate cost
      const cost = IMAGE_COSTS[options.size || "1024x1024"];

      // Get image dimensions
      const dimensions = this.getDimensions(options.size || "1024x1024");

      const result: GeneratedImage = {
        id: crypto.randomBytes(16).toString('hex'),
        url: imageUrl,
        localPath: savedImage.localPath,
        s3Url: savedImage.s3Url,
        prompt: options.prompt,
        enhancedPrompt: revisedPrompt || finalPrompt,
        metadata: {
          size: options.size || "1024x1024",
          style: options.style || "vivid",
          quality: options.quality || "standard",
          model: DALL_E_MODEL,
          cost,
          generationTime: Date.now() - startTime,
          fileSize: savedImage.fileSize,
          format: 'png',
          dimensions,
        },
        category: options.category,
        businessId: options.businessId,
        tags: this.extractTags(options.prompt),
        createdAt: new Date(),
      };

      // Cache the result
      if (options.useCache !== false) {
        await this.cacheImage(cacheKey, result);
      }

      // Track usage
      await this.trackUsage(options.businessId || 'system', result);

      // Store in database
      await this.storeImageRecord(result);

      logger.info("Image generated successfully", {
        id: result.id,
        cost,
        generationTime: result.metadata.generationTime,
      });

      // Generate variations if requested
      if (options.variations && options.numberOfImages && options.numberOfImages > 1) {
        const variations = await this.generateVariations(
          options, 
          options.numberOfImages - 1
        );
        // Return the first image, variations are stored separately
      }

      return result;

    } catch (error) {
      logger.error("Image generation failed", { error, options });
      throw new Error(`Failed to generate image: ${(error as Error).message}`);
    }
  }

  /**
   * Enhance prompt for better results
   */
  private async enhancePrompt(
    prompt: string, 
    options: ImageGenerationOptions
  ): Promise<string> {
    const categoryEnhancements: Record<string, string> = {
      product: "professional product photography, studio lighting, high quality, commercial, clean background",
      logo: "minimalist logo design, vector style, scalable, memorable, professional branding",
      social: "eye-catching social media graphic, engaging, shareable, modern design",
      banner: "website banner, hero image, high resolution, impactful, professional",
      background: "seamless pattern, website background, subtle, elegant, professional",
      marketing: "marketing material, promotional, attention-grabbing, call-to-action, professional design"
    };

    const styleEnhancements: Record<string, string> = {
      vivid: "vibrant colors, high contrast, dynamic, bold",
      natural: "realistic, photorealistic, natural lighting, authentic"
    };

    let enhanced = prompt;

    // Add category-specific enhancements
    if (options.category && categoryEnhancements[options.category]) {
      enhanced += `, ${categoryEnhancements[options.category]}`;
    }

    // Add style enhancements
    if (options.style && styleEnhancements[options.style]) {
      enhanced += `, ${styleEnhancements[options.style]}`;
    }

    // Add quality markers
    if (options.quality === 'hd') {
      enhanced += ", ultra HD, 4K quality, highly detailed, sharp focus";
    }

    // Add technical specifications
    enhanced += ", professional photography, commercial use, high resolution";

    return enhanced;
  }

  /**
   * Save image locally and to cloud storage
   */
  private async saveImage(
    imageUrl: string, 
    options: ImageGenerationOptions
  ): Promise<{
    localPath: string;
    s3Url?: string;
    fileSize: number;
  }> {
    try {
      // Download image
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      // Generate filename
      const timestamp = Date.now();
      const hash = crypto.randomBytes(8).toString('hex');
      const category = options.category || 'general';
      const filename = `${category}_${timestamp}_${hash}.png`;
      const localPath = path.join(this.localStoragePath, filename);

      // Save locally
      await fs.writeFile(localPath, buffer);

      // Optimize image
      const optimizedBuffer = await this.optimizeImage(buffer, options);

      // Save optimized version
      const optimizedPath = localPath.replace('.png', '_optimized.png');
      await fs.writeFile(optimizedPath, optimizedBuffer);

      // Upload to cloud storage if available
      let s3Url: string | undefined;
      if (this.storageService) {
        const s3Key = `generated-images/${options.businessId || 'system'}/${filename}`;
        s3Url = await this.storageService.uploadFile(optimizedBuffer, s3Key, 'image/png');
      }

      return {
        localPath: `attached_assets/generated_images/${filename}`,
        s3Url,
        fileSize: optimizedBuffer.length,
      };

    } catch (error) {
      logger.error("Failed to save image", { error });
      throw new Error("Failed to save generated image");
    }
  }

  /**
   * Optimize image for web use
   */
  private async optimizeImage(
    buffer: Buffer, 
    options: ImageGenerationOptions
  ): Promise<Buffer> {
    try {
      let pipeline = sharp(buffer);

      // Apply optimizations based on category
      if (options.category === 'social') {
        // Social media optimization
        pipeline = pipeline
          .jpeg({ quality: 85, progressive: true })
          .resize(1200, 630, { fit: 'cover' }); // Standard social media size
      } else if (options.category === 'product') {
        // Product image optimization
        pipeline = pipeline
          .png({ compressionLevel: 9 })
          .resize(1500, 1500, { fit: 'inside', withoutEnlargement: true });
      } else if (options.category === 'logo') {
        // Logo optimization
        pipeline = pipeline
          .png({ compressionLevel: 9 })
          .resize(500, 500, { fit: 'inside', withoutEnlargement: true });
      } else {
        // General optimization
        pipeline = pipeline
          .jpeg({ quality: 90, progressive: true });
      }

      return await pipeline.toBuffer();

    } catch (error) {
      logger.error("Image optimization failed", { error });
      return buffer; // Return original if optimization fails
    }
  }

  /**
   * Generate multiple variations
   */
  private async generateVariations(
    baseOptions: ImageGenerationOptions,
    count: number
  ): Promise<GeneratedImage[]> {
    const variations: GeneratedImage[] = [];
    const variationPrompts = this.createVariationPrompts(baseOptions.prompt, count);

    for (const varPrompt of variationPrompts) {
      try {
        const variation = await this.generateImage({
          ...baseOptions,
          prompt: varPrompt,
          variations: false, // Prevent recursive variations
        });
        variations.push(variation);
      } catch (error) {
        logger.error("Failed to generate variation", { error });
      }
    }

    return variations;
  }

  /**
   * Create variation prompts
   */
  private createVariationPrompts(basePrompt: string, count: number): string[] {
    const modifiers = [
      "different angle",
      "alternative style",
      "varied composition",
      "unique perspective",
      "creative interpretation",
      "fresh approach",
      "innovative design",
      "distinctive look",
    ];

    const prompts: string[] = [];
    for (let i = 0; i < count && i < modifiers.length; i++) {
      prompts.push(`${basePrompt}, ${modifiers[i]}`);
    }

    return prompts;
  }

  /**
   * Get image dimensions from size string
   */
  private getDimensions(size: ImageSize): { width: number; height: number } {
    const [width, height] = size.split('x').map(Number);
    return { width, height };
  }

  /**
   * Extract tags from prompt
   */
  private extractTags(prompt: string): string[] {
    // Extract meaningful keywords from prompt
    const words = prompt.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    return words
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 10);
  }

  /**
   * Generate cache key
   */
  private getCacheKey(options: ImageGenerationOptions): string {
    const key = {
      prompt: options.prompt,
      size: options.size,
      style: options.style,
      quality: options.quality,
      category: options.category,
    };
    
    return `image:${crypto.createHash('md5').update(JSON.stringify(key)).digest('hex')}`;
  }

  /**
   * Get cached image
   */
  private async getCachedImage(key: string): Promise<GeneratedImage | null> {
    try {
      const cached = await cache.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.error("Cache retrieval error", { error, key });
    }
    return null;
  }

  /**
   * Cache generated image
   */
  private async cacheImage(key: string, image: GeneratedImage): Promise<void> {
    try {
      await cache.setex(key, this.cacheExpiry, JSON.stringify(image));
    } catch (error) {
      logger.error("Cache storage error", { error, key });
    }
  }

  /**
   * Track image generation usage
   */
  private async trackUsage(businessId: string, image: GeneratedImage): Promise<void> {
    try {
      await storage.trackAIUsage({
        businessId,
        service: 'openai',
        model: DALL_E_MODEL,
        tokensUsed: 0, // Images don't use tokens
        cost: image.metadata.cost,
        type: 'image_generation',
        metadata: {
          size: image.metadata.size,
          quality: image.metadata.quality,
          category: image.category,
        }
      });
    } catch (error) {
      logger.error("Failed to track usage", { error, businessId });
    }
  }

  /**
   * Store image record in database
   */
  private async storeImageRecord(image: GeneratedImage): Promise<void> {
    try {
      await storage.createGeneratedImage({
        id: image.id,
        businessId: image.businessId,
        prompt: image.prompt,
        enhancedPrompt: image.enhancedPrompt,
        url: image.url,
        localPath: image.localPath,
        s3Url: image.s3Url,
        metadata: image.metadata,
        category: image.category,
        tags: image.tags,
      });
    } catch (error) {
      logger.error("Failed to store image record", { error });
    }
  }

  /**
   * Get image templates
   */
  async getImageTemplates(category?: string): Promise<ImageTemplate[]> {
    const templates: ImageTemplate[] = [
      {
        id: 'product-hero',
        name: 'Product Hero Shot',
        description: 'Professional product photography for e-commerce',
        category: 'product',
        basePrompt: 'professional product photography of {product}, white background, studio lighting, commercial quality, centered composition',
        styleModifiers: ['minimal shadows', 'high key lighting', 'clean aesthetic'],
        defaultSize: '1024x1024',
      },
      {
        id: 'product-lifestyle',
        name: 'Product Lifestyle',
        description: 'Product in real-world setting',
        category: 'product',
        basePrompt: '{product} in use, lifestyle photography, natural setting, warm lighting, authentic feel',
        styleModifiers: ['bokeh background', 'golden hour', 'candid style'],
        defaultSize: '1792x1024',
      },
      {
        id: 'logo-minimal',
        name: 'Minimalist Logo',
        description: 'Clean, modern logo design',
        category: 'logo',
        basePrompt: 'minimalist logo for {businessName}, simple geometric shapes, vector style, scalable design, {primaryColor} color scheme',
        styleModifiers: ['flat design', 'negative space', 'timeless'],
        defaultSize: '1024x1024',
      },
      {
        id: 'social-announcement',
        name: 'Social Media Announcement',
        description: 'Eye-catching social media post',
        category: 'social',
        basePrompt: 'social media graphic announcing {announcement}, bold typography, {brandColors}, modern design, Instagram-ready',
        styleModifiers: ['gradient background', 'trendy', 'shareable'],
        defaultSize: '1024x1024',
      },
      {
        id: 'banner-hero',
        name: 'Website Hero Banner',
        description: 'Impactful website header image',
        category: 'banner',
        basePrompt: 'website hero banner for {businessType}, professional, {mood} atmosphere, high resolution, panoramic view',
        styleModifiers: ['cinematic', 'depth of field', 'dramatic lighting'],
        defaultSize: '1792x1024',
      },
      {
        id: 'marketing-flyer',
        name: 'Marketing Flyer',
        description: 'Professional marketing material',
        category: 'marketing',
        basePrompt: 'marketing flyer design for {offer}, professional layout, clear hierarchy, {brandColors}, call-to-action prominent',
        styleModifiers: ['corporate style', 'clean layout', 'print-ready'],
        defaultSize: '1024x1792',
      },
    ];

    if (category) {
      return templates.filter(t => t.category === category);
    }

    return templates;
  }

  /**
   * Generate from template
   */
  async generateFromTemplate(
    templateId: string,
    variables: Record<string, string>,
    options?: Partial<ImageGenerationOptions>
  ): Promise<GeneratedImage> {
    const templates = await this.getImageTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Replace variables in prompt
    let prompt = template.basePrompt;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    // Add style modifiers
    if (template.styleModifiers.length > 0) {
      prompt += `, ${template.styleModifiers.join(', ')}`;
    }

    // Generate image using template
    return this.generateImage({
      prompt,
      size: template.defaultSize as ImageSize,
      category: template.category as any,
      enhancePrompt: true,
      ...options,
    });
  }

  /**
   * Batch image generation
   */
  async generateBatch(
    requests: ImageGenerationOptions[]
  ): Promise<GeneratedImage[]> {
    const results: GeneratedImage[] = [];

    // DALL-E 3 only supports sequential generation (n=1)
    for (const request of requests) {
      try {
        const image = await this.generateImage(request);
        results.push(image);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error("Batch generation error", { error, request });
      }
    }

    return results;
  }

  /**
   * Get image history
   */
  async getImageHistory(
    businessId: string,
    options?: {
      category?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<GeneratedImage[]> {
    try {
      return await storage.getGeneratedImages(businessId, options);
    } catch (error) {
      logger.error("Failed to get image history", { error });
      return [];
    }
  }

  /**
   * Delete generated image
   */
  async deleteImage(imageId: string, businessId: string): Promise<void> {
    try {
      // Get image record
      const image = await storage.getGeneratedImage(imageId);
      
      if (!image || image.businessId !== businessId) {
        throw new Error("Image not found or unauthorized");
      }

      // Delete from local storage
      if (image.localPath) {
        const fullPath = path.join(process.cwd(), image.localPath);
        await fs.unlink(fullPath).catch(() => {});
      }

      // Delete from S3
      if (image.s3Url && this.storageService) {
        await this.storageService.deleteFile(image.s3Url);
      }

      // Delete from database
      await storage.deleteGeneratedImage(imageId);

      logger.info("Image deleted", { imageId, businessId });

    } catch (error) {
      logger.error("Failed to delete image", { error, imageId });
      throw error;
    }
  }
}

// Export singleton instance
export const imageGenerationService = new ImageGenerationService();