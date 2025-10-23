/**
 * AI Content Generation Routes
 * 
 * Comprehensive API endpoints for AI-powered content generation,
 * image creation, template management, and content history.
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { isAuthenticated } from "./auth/index";
import { generalAPIRateLimit, strictRateLimit } from "./rateLimit";
import { openAIService } from "./openaiService";
import { imageGenerationService } from "./imageGeneration";
import { storage } from "./storage";
import { logger } from "./monitoring";
import type { 
  ContentGenerationOptions, 
  ImageGenerationOptions 
} from "./openaiService";

const router = Router();

// ============================================
// CONTENT GENERATION ENDPOINTS
// ============================================

/**
 * POST /api/ai/content/generate
 * Generate AI content for various business needs
 */
router.post('/content/generate', 
  isAuthenticated, 
  generalAPIRateLimit,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        businessId: z.string().uuid().optional(),
        type: z.enum([
          'business_description', 
          'product_description', 
          'blog_post',
          'social_media', 
          'email_template', 
          'review_response', 
          'faq', 
          'tagline'
        ]),
        platform: z.enum([
          'facebook', 'instagram', 'twitter', 
          'linkedin', 'gmb', 'email', 'general'
        ]).optional(),
        content: z.string().min(1).max(10000), // Input context/idea
        tone: z.enum([
          'professional', 'casual', 'friendly', 
          'formal', 'humorous', 'inspirational'
        ]).optional(),
        language: z.string().optional().default('en'),
        keywords: z.array(z.string()).optional(),
        maxLength: z.number().optional(),
        useCache: z.boolean().optional().default(true),
        stream: z.boolean().optional().default(false),
        saveToHistory: z.boolean().optional().default(true),
      });

      const data = schema.parse(req.body);
      const userId = (req as any).user?.id;

      // Generate content
      const result = await openAIService.generateContent({
        businessId: data.businessId,
        type: data.type,
        platform: data.platform,
        tone: data.tone,
        language: data.language,
        keywords: data.keywords,
        maxLength: data.maxLength,
        context: { userInput: data.content },
        useCache: data.useCache,
        stream: data.stream,
      });

      // Save to history if requested
      if (data.saveToHistory && data.businessId) {
        await storage.createGeneratedContent({
          businessId: data.businessId,
          userId,
          type: data.type,
          platform: data.platform || 'general',
          content: result.content,
          prompt: data.content,
          enhancedPrompt: result.metadata.model,
          tone: data.tone,
          language: data.language,
          keywords: data.keywords,
          hashtags: result.metadata.hashtags,
          metadata: result.metadata,
          qualityMetrics: result.qualityMetrics,
          status: 'draft',
        });
      }

      res.json({
        success: true,
        data: result,
      });

    } catch (error) {
      logger.error("Content generation failed", { error });
      res.status(500).json({ 
        error: "Failed to generate content",
        message: (error as Error).message 
      });
    }
  }
);

/**
 * POST /api/ai/content/generate-batch
 * Generate multiple pieces of content at once
 */
router.post('/content/generate-batch',
  isAuthenticated,
  strictRateLimit,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        businessId: z.string().uuid(),
        requests: z.array(z.object({
          type: z.enum([
            'business_description', 
            'product_description', 
            'social_media',
            'email_template', 
            'review_response'
          ]),
          platform: z.string().optional(),
          content: z.string(),
          tone: z.string().optional(),
        })).min(1).max(10),
      });

      const data = schema.parse(req.body);

      // Generate content in batch
      const requests: ContentGenerationOptions[] = data.requests.map(req => ({
        businessId: data.businessId,
        type: req.type,
        platform: req.platform as any,
        tone: req.tone as any,
        context: { userInput: req.content },
      }));

      const results = await openAIService.generateBatch(requests);

      // Save all to history
      const userId = (req as any).user?.id;
      for (const result of results) {
        await storage.createGeneratedContent({
          businessId: data.businessId,
          userId,
          type: result.type,
          platform: result.platform || 'general',
          content: result.content,
          metadata: result.metadata,
          qualityMetrics: result.qualityMetrics,
          status: 'draft',
        });
      }

      res.json({
        success: true,
        data: results,
      });

    } catch (error) {
      logger.error("Batch content generation failed", { error });
      res.status(500).json({ 
        error: "Failed to generate batch content" 
      });
    }
  }
);

/**
 * POST /api/ai/content/improve
 * Improve existing content with AI suggestions
 */
router.post('/content/improve',
  isAuthenticated,
  generalAPIRateLimit,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        businessId: z.string().uuid().optional(),
        content: z.string().min(1).max(10000),
        improvementType: z.enum([
          'seo', 'clarity', 'engagement', 
          'grammar', 'tone', 'length'
        ]),
        targetTone: z.string().optional(),
        targetLength: z.number().optional(),
        keywords: z.array(z.string()).optional(),
      });

      const data = schema.parse(req.body);

      // Generate improved content
      const prompt = `Improve the following content for ${data.improvementType}:
        ${data.targetTone ? `Target tone: ${data.targetTone}` : ''}
        ${data.targetLength ? `Target length: ${data.targetLength} words` : ''}
        ${data.keywords ? `Include keywords: ${data.keywords.join(', ')}` : ''}
        
        Original content:
        ${data.content}`;

      const result = await openAIService.generateContent({
        businessId: data.businessId,
        type: 'business_description', // Generic type
        context: { prompt },
        useCache: false,
      });

      res.json({
        success: true,
        data: {
          original: data.content,
          improved: result.content,
          metrics: result.qualityMetrics,
          changes: {
            lengthDiff: result.content.length - data.content.length,
            wordCountDiff: result.metadata.wordCount - data.content.split(/\s+/).length,
          }
        }
      });

    } catch (error) {
      logger.error("Content improvement failed", { error });
      res.status(500).json({ 
        error: "Failed to improve content" 
      });
    }
  }
);

// ============================================
// TEMPLATE MANAGEMENT ENDPOINTS
// ============================================

/**
 * GET /api/ai/templates
 * Get available content templates
 */
router.get('/templates',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { businessId, type, category, isGlobal } = req.query;

      const templates = await storage.getContentTemplates(
        businessId as string,
        {
          type: type as string,
          category: category as string,
          isGlobal: isGlobal === 'true',
          isActive: true,
        }
      );

      // Also get built-in templates
      const builtInTemplates = await openAIService.getContentTemplates(category as string);

      res.json({
        success: true,
        data: {
          custom: templates,
          builtIn: builtInTemplates,
        }
      });

    } catch (error) {
      logger.error("Failed to get templates", { error });
      res.status(500).json({ 
        error: "Failed to retrieve templates" 
      });
    }
  }
);

/**
 * POST /api/ai/templates
 * Create a custom content template
 */
router.post('/templates',
  isAuthenticated,
  generalAPIRateLimit,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        businessId: z.string().uuid().optional(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        type: z.string(),
        category: z.string(),
        prompt: z.string().min(1),
        variables: z.array(z.string()).optional(),
        examples: z.array(z.string()).optional(),
        tone: z.string().optional(),
        platform: z.string().optional(),
        isGlobal: z.boolean().optional().default(false),
      });

      const data = schema.parse(req.body);
      const userId = (req as any).user?.id;

      const template = await storage.createContentTemplate({
        ...data,
        createdBy: userId,
        isActive: true,
        usageCount: 0,
        rating: "0",
      });

      res.json({
        success: true,
        data: template,
      });

    } catch (error) {
      logger.error("Template creation failed", { error });
      res.status(500).json({ 
        error: "Failed to create template" 
      });
    }
  }
);

/**
 * POST /api/ai/templates/:templateId/generate
 * Generate content from a template
 */
router.post('/templates/:templateId/generate',
  isAuthenticated,
  generalAPIRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { templateId } = req.params;
      const schema = z.object({
        businessId: z.string().uuid().optional(),
        variables: z.record(z.string()),
        saveToHistory: z.boolean().optional().default(true),
      });

      const data = schema.parse(req.body);

      // Check if it's a custom or built-in template
      const customTemplate = await storage.getContentTemplate(templateId);
      
      let result;
      if (customTemplate) {
        // Use custom template
        result = await openAIService.generateContent({
          businessId: data.businessId,
          type: customTemplate.type as any,
          platform: customTemplate.platform as any,
          tone: customTemplate.tone as any,
          context: {
            prompt: customTemplate.prompt,
            variables: data.variables,
          },
        });

        // Update usage count
        await storage.updateContentTemplate(templateId, {
          usageCount: customTemplate.usageCount + 1,
        });
      } else {
        // Try built-in template
        result = await openAIService.generateFromTemplate(
          templateId,
          data.variables,
          { businessId: data.businessId }
        );
      }

      // Save to history if requested
      if (data.saveToHistory && data.businessId) {
        const userId = (req as any).user?.id;
        await storage.createGeneratedContent({
          businessId: data.businessId,
          userId,
          type: result.type,
          platform: result.platform || 'general',
          content: result.content,
          templateName: customTemplate?.name || templateId,
          isTemplate: true,
          metadata: result.metadata,
          qualityMetrics: result.qualityMetrics,
          status: 'draft',
        });
      }

      res.json({
        success: true,
        data: result,
      });

    } catch (error) {
      logger.error("Template generation failed", { error });
      res.status(500).json({ 
        error: "Failed to generate from template" 
      });
    }
  }
);

// ============================================
// IMAGE GENERATION ENDPOINTS
// ============================================

/**
 * POST /api/ai/images/generate
 * Generate images with DALL-E 3
 */
router.post('/images/generate',
  isAuthenticated,
  strictRateLimit,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        businessId: z.string().uuid().optional(),
        prompt: z.string().min(1).max(1000),
        negativePrompt: z.string().optional(),
        size: z.enum(['1024x1024', '1024x1792', '1792x1024']).optional(),
        style: z.enum(['vivid', 'natural']).optional(),
        quality: z.enum(['standard', 'hd']).optional(),
        category: z.enum([
          'product', 'logo', 'social', 
          'banner', 'background', 'marketing'
        ]).optional(),
        numberOfImages: z.number().min(1).max(4).optional().default(1),
        enhancePrompt: z.boolean().optional().default(true),
        variations: z.boolean().optional().default(false),
      });

      const data = schema.parse(req.body);

      // Generate image
      const result = await imageGenerationService.generateImage({
        businessId: data.businessId,
        prompt: data.prompt,
        negativePrompt: data.negativePrompt,
        size: data.size as any,
        style: data.style as any,
        quality: data.quality as any,
        category: data.category as any,
        numberOfImages: data.numberOfImages,
        enhancePrompt: data.enhancePrompt,
        variations: data.variations,
      });

      res.json({
        success: true,
        data: result,
      });

    } catch (error) {
      logger.error("Image generation failed", { error });
      res.status(500).json({ 
        error: "Failed to generate image",
        message: (error as Error).message 
      });
    }
  }
);

/**
 * GET /api/ai/images/templates
 * Get image generation templates
 */
router.get('/images/templates',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      
      const templates = await imageGenerationService.getImageTemplates(
        category as string
      );

      res.json({
        success: true,
        data: templates,
      });

    } catch (error) {
      logger.error("Failed to get image templates", { error });
      res.status(500).json({ 
        error: "Failed to retrieve image templates" 
      });
    }
  }
);

/**
 * POST /api/ai/images/templates/:templateId/generate
 * Generate image from template
 */
router.post('/images/templates/:templateId/generate',
  isAuthenticated,
  strictRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { templateId } = req.params;
      const schema = z.object({
        businessId: z.string().uuid().optional(),
        variables: z.record(z.string()),
        size: z.enum(['1024x1024', '1024x1792', '1792x1024']).optional(),
        quality: z.enum(['standard', 'hd']).optional(),
      });

      const data = schema.parse(req.body);

      const result = await imageGenerationService.generateFromTemplate(
        templateId,
        data.variables,
        {
          businessId: data.businessId,
          size: data.size as any,
          quality: data.quality as any,
        }
      );

      res.json({
        success: true,
        data: result,
      });

    } catch (error) {
      logger.error("Template image generation failed", { error });
      res.status(500).json({ 
        error: "Failed to generate image from template" 
      });
    }
  }
);

/**
 * GET /api/ai/images/history
 * Get generated images history
 */
router.get('/images/history',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        businessId: z.string().uuid(),
        category: z.string().optional(),
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      });

      const data = schema.parse(req.query);

      const images = await storage.getGeneratedImages(data.businessId, {
        category: data.category,
        limit: data.limit,
        offset: data.offset,
      });

      res.json({
        success: true,
        data: images,
      });

    } catch (error) {
      logger.error("Failed to get image history", { error });
      res.status(500).json({ 
        error: "Failed to retrieve image history" 
      });
    }
  }
);

/**
 * DELETE /api/ai/images/:imageId
 * Delete a generated image
 */
router.delete('/images/:imageId',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { imageId } = req.params;
      const { businessId } = req.query;

      if (!businessId) {
        return res.status(400).json({ 
          error: "Business ID is required" 
        });
      }

      await imageGenerationService.deleteImage(
        imageId, 
        businessId as string
      );

      res.json({
        success: true,
        message: "Image deleted successfully",
      });

    } catch (error) {
      logger.error("Image deletion failed", { error });
      res.status(500).json({ 
        error: "Failed to delete image" 
      });
    }
  }
);

// ============================================
// CONTENT HISTORY ENDPOINTS
// ============================================

/**
 * GET /api/ai/content/history
 * Get content generation history
 */
router.get('/content/history',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        businessId: z.string().uuid(),
        type: z.string().optional(),
        platform: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      });

      const data = schema.parse(req.query);

      const history = await storage.getGeneratedContentHistory(
        data.businessId,
        {
          type: data.type,
          platform: data.platform,
          status: data.status,
          limit: data.limit,
          offset: data.offset,
        }
      );

      res.json({
        success: true,
        data: history,
      });

    } catch (error) {
      logger.error("Failed to get content history", { error });
      res.status(500).json({ 
        error: "Failed to retrieve content history" 
      });
    }
  }
);

/**
 * PATCH /api/ai/content/:contentId
 * Update generated content
 */
router.patch('/content/:contentId',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { contentId } = req.params;
      const schema = z.object({
        content: z.string().optional(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
        isFavorite: z.boolean().optional(),
        performanceMetrics: z.object({
          views: z.number().optional(),
          clicks: z.number().optional(),
          conversions: z.number().optional(),
          engagement: z.number().optional(),
        }).optional(),
      });

      const data = schema.parse(req.body);

      await storage.updateGeneratedContent(contentId, {
        ...data,
        updatedAt: new Date(),
      });

      res.json({
        success: true,
        message: "Content updated successfully",
      });

    } catch (error) {
      logger.error("Content update failed", { error });
      res.status(500).json({ 
        error: "Failed to update content" 
      });
    }
  }
);

/**
 * POST /api/ai/content/:contentId/favorite
 * Toggle content favorite status
 */
router.post('/content/:contentId/favorite',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { contentId } = req.params;
      const { isFavorite } = req.body;

      await storage.markContentAsFavorite(contentId, isFavorite);

      res.json({
        success: true,
        message: `Content ${isFavorite ? 'favorited' : 'unfavorited'} successfully`,
      });

    } catch (error) {
      logger.error("Failed to toggle favorite", { error });
      res.status(500).json({ 
        error: "Failed to update favorite status" 
      });
    }
  }
);

// ============================================
// USAGE & BILLING ENDPOINTS
// ============================================

/**
 * GET /api/ai/usage
 * Get AI usage statistics
 */
router.get('/usage',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { businessId, billingPeriod } = req.query;

      if (!businessId) {
        return res.status(400).json({ 
          error: "Business ID is required" 
        });
      }

      const usage = await storage.getAIUsageByBusiness(
        businessId as string,
        billingPeriod as string
      );

      const summary = await storage.getAIUsageSummary(businessId as string);

      res.json({
        success: true,
        data: {
          usage,
          summary,
        }
      });

    } catch (error) {
      logger.error("Failed to get usage statistics", { error });
      res.status(500).json({ 
        error: "Failed to retrieve usage statistics" 
      });
    }
  }
);

// ============================================
// A/B TESTING ENDPOINTS
// ============================================

/**
 * POST /api/ai/tests
 * Create an A/B content test
 */
router.post('/tests',
  isAuthenticated,
  generalAPIRateLimit,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        businessId: z.string().uuid(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        type: z.string(),
        variants: z.array(z.object({
          id: z.string(),
          content: z.string(),
        })).min(2).max(5),
      });

      const data = schema.parse(req.body);

      const test = await storage.createContentTest({
        ...data,
        status: 'draft',
        startDate: new Date(),
      });

      res.json({
        success: true,
        data: test,
      });

    } catch (error) {
      logger.error("A/B test creation failed", { error });
      res.status(500).json({ 
        error: "Failed to create A/B test" 
      });
    }
  }
);

/**
 * GET /api/ai/tests
 * Get A/B tests for a business
 */
router.get('/tests',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { businessId, status } = req.query;

      if (!businessId) {
        return res.status(400).json({ 
          error: "Business ID is required" 
        });
      }

      const tests = await storage.getContentTests(
        businessId as string,
        status as string
      );

      res.json({
        success: true,
        data: tests,
      });

    } catch (error) {
      logger.error("Failed to get A/B tests", { error });
      res.status(500).json({ 
        error: "Failed to retrieve A/B tests" 
      });
    }
  }
);

// ============================================
// MODERATION ENDPOINTS
// ============================================

/**
 * POST /api/ai/moderate
 * Check content for safety and compliance
 */
router.post('/moderate',
  isAuthenticated,
  generalAPIRateLimit,
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        content: z.string().min(1),
        contentType: z.enum(['text', 'prompt']),
        businessId: z.string().uuid().optional(),
      });

      const data = schema.parse(req.body);

      // Use OpenAI moderation API
      const moderationResult = await openAIService.moderateContent(data.content);

      // Log moderation
      if (data.businessId) {
        await storage.logModeration({
          contentType: 'generated_content',
          businessId: data.businessId,
          moderationResult,
          isSafe: !moderationResult.flagged,
          action: moderationResult.flagged ? 'rejected' : 'approved',
          moderatedBy: 'system',
        });
      }

      res.json({
        success: true,
        data: {
          isSafe: !moderationResult.flagged,
          flags: moderationResult.categories,
          scores: moderationResult.category_scores,
        }
      });

    } catch (error) {
      logger.error("Content moderation failed", { error });
      res.status(500).json({ 
        error: "Failed to moderate content" 
      });
    }
  }
);

export { router as aiContentRoutes };