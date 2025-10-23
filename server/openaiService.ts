/**
 * OpenAI Service - Enterprise AI Content Generation
 * 
 * Provides comprehensive content generation with:
 * - Multiple model support (GPT-5, GPT-4, GPT-3.5)
 * - Token management and cost tracking
 * - Retry logic with exponential backoff
 * - Response caching
 * - Content moderation
 * - SEO optimization
 */

import OpenAI from "openai";
import { logger } from "./monitoring";
import { cache } from "./redis";
import { storage } from "./storage";
import crypto from "crypto";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-5";
const DALL_E_MODEL = "dall-e-3";

// Model cost tracking (per 1K tokens)
const MODEL_COSTS = {
  "gpt-5": { input: 0.015, output: 0.075 },
  "gpt-4o": { input: 0.005, output: 0.015 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "dall-e-3": { "1024x1024": 0.04, "1024x1792": 0.08, "1792x1024": 0.08 }
};

export interface ContentGenerationOptions {
  businessId?: string;
  type: 'business_description' | 'product_description' | 'blog_post' | 
        'social_media' | 'email_template' | 'review_response' | 'faq' | 'tagline';
  platform?: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'gmb' | 'email' | 'general';
  tone?: 'professional' | 'casual' | 'friendly' | 'formal' | 'humorous' | 'inspirational';
  language?: string;
  keywords?: string[];
  maxLength?: number;
  context?: any;
  useCache?: boolean;
  stream?: boolean;
}

export interface GeneratedContent {
  id: string;
  content: string;
  type: string;
  platform?: string;
  metadata: {
    model: string;
    tokensUsed: number;
    cost: number;
    generationTime: number;
    characterCount: number;
    wordCount: number;
    readingTime?: number;
    seoScore?: number;
    sentimentScore?: number;
    keywords?: string[];
    hashtags?: string[];
  };
  qualityMetrics?: {
    clarity: number;
    engagement: number;
    brandSafety: boolean;
    hasProfanity: boolean;
    plagiarismScore?: number;
  };
  createdAt: Date;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  prompt: string;
  variables: string[];
  examples?: string[];
  tone?: string;
  isActive: boolean;
}

class OpenAIService {
  private client: OpenAI | null = null;
  private retryAttempts = 3;
  private retryDelay = 1000;
  private cacheExpiry = 3600; // 1 hour
  private isConfigured = false;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn("⚠️ OpenAI API key not configured - AI features will be disabled");
      this.isConfigured = false;
      return;
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.isConfigured = true;

    logger.info("✅ OpenAI Service initialized");
  }

  private checkConfiguration(): void {
    if (!this.isConfigured || !this.client) {
      throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.");
    }
  }

  /**
   * Generate content with advanced features
   */
  async generateContent(options: ContentGenerationOptions): Promise<GeneratedContent> {
    this.checkConfiguration();
    
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(options);

    // Check cache first if enabled
    if (options.useCache !== false) {
      const cached = await this.getCachedContent(cacheKey);
      if (cached) {
        logger.info("Content retrieved from cache", { cacheKey });
        return cached;
      }
    }

    try {
      const prompt = await this.buildPrompt(options);
      const model = this.selectModel(options);
      
      // Generate content with retry logic
      const response = await this.generateWithRetry(prompt, model, options);
      
      // Process and enhance content
      const processedContent = await this.processContent(response, options);
      
      // Calculate metrics
      const metadata = await this.calculateMetadata(processedContent, model, response);
      
      // Quality checks
      const qualityMetrics = await this.performQualityChecks(processedContent);
      
      const result: GeneratedContent = {
        id: crypto.randomBytes(16).toString('hex'),
        content: processedContent,
        type: options.type,
        platform: options.platform,
        metadata: {
          ...metadata,
          generationTime: Date.now() - startTime,
        },
        qualityMetrics,
        createdAt: new Date(),
      };

      // Cache the result
      if (options.useCache !== false) {
        await this.cacheContent(cacheKey, result);
      }

      // Track usage for billing
      await this.trackUsage(options.businessId || 'system', metadata);

      logger.info("Content generated successfully", {
        type: options.type,
        platform: options.platform,
        tokensUsed: metadata.tokensUsed,
        cost: metadata.cost,
      });

      return result;

    } catch (error) {
      logger.error("Content generation failed", { error, options });
      throw new Error(`Failed to generate content: ${(error as Error).message}`);
    }
  }

  /**
   * Build optimized prompt based on content type
   */
  private async buildPrompt(options: ContentGenerationOptions): Promise<string> {
    const business = options.businessId ? 
      await storage.getBusinessById(options.businessId) : null;

    const basePrompts: Record<string, string> = {
      business_description: `Create a compelling business description that highlights unique value propositions, services/products offered, and target audience appeal. Include a clear call-to-action.`,
      
      product_description: `Write an engaging product description that emphasizes benefits over features, addresses customer pain points, and includes relevant keywords for SEO. Make it scannable with bullet points where appropriate.`,
      
      blog_post: `Write an informative and engaging blog post that provides value to readers, includes relevant examples, and maintains a consistent tone throughout. Structure with clear headings and subheadings.`,
      
      social_media: `Create an engaging social media post optimized for ${options.platform || 'general'} that drives engagement, uses appropriate hashtags, and includes a clear call-to-action.`,
      
      email_template: `Design an effective email template with a compelling subject line, personalized greeting, clear value proposition, and strong call-to-action. Ensure mobile-friendly formatting.`,
      
      review_response: `Craft a professional and empathetic response to a customer review that acknowledges their feedback, addresses concerns if any, and maintains brand voice while showing genuine care for customer experience.`,
      
      faq: `Create comprehensive FAQ entries that anticipate customer questions, provide clear and concise answers, and reduce support burden while building trust.`,
      
      tagline: `Generate a memorable and impactful tagline that captures the essence of the brand, is easy to remember, and differentiates from competitors.`
    };

    let prompt = basePrompts[options.type] || "Generate professional content.";

    // Add business context
    if (business) {
      prompt += `\n\nBusiness Context:
- Name: ${business.name}
- Category: ${business.category}
- Description: ${business.description}
- Tagline: ${business.tagline}
- Location: ${business.location}`;
    }

    // Add tone specification
    if (options.tone) {
      prompt += `\n\nTone: ${options.tone}`;
    }

    // Add keywords for SEO
    if (options.keywords && options.keywords.length > 0) {
      prompt += `\n\nInclude these keywords naturally: ${options.keywords.join(', ')}`;
    }

    // Add platform-specific requirements
    if (options.platform) {
      const platformLimits: Record<string, number> = {
        twitter: 280,
        instagram: 2200,
        facebook: 63206,
        linkedin: 3000,
        gmb: 1500,
      };

      const limit = platformLimits[options.platform];
      if (limit) {
        prompt += `\n\nOptimize for ${options.platform} (max ${limit} characters)`;
      }
    }

    // Add language specification
    if (options.language && options.language !== 'en') {
      prompt += `\n\nGenerate content in ${options.language}`;
    }

    // Add length constraint
    if (options.maxLength) {
      prompt += `\n\nMaximum length: ${options.maxLength} characters`;
    }

    // Add any additional context
    if (options.context) {
      prompt += `\n\nAdditional context: ${JSON.stringify(options.context)}`;
    }

    return prompt;
  }

  /**
   * Select optimal model based on task
   */
  private selectModel(options: ContentGenerationOptions): string {
    // Use GPT-5 for most content generation
    if (options.type === 'blog_post' || options.type === 'email_template') {
      return DEFAULT_MODEL;
    }
    
    // Use faster model for simple tasks
    if (options.type === 'tagline' || options.type === 'review_response') {
      return "gpt-4o-mini";
    }

    return DEFAULT_MODEL;
  }

  /**
   * Generate content with retry logic
   */
  private async generateWithRetry(
    prompt: string, 
    model: string, 
    options: ContentGenerationOptions
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        if (options.stream) {
          return await this.streamGeneration(prompt, model);
        }

        const response = await this.client!.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: "You are a professional content creator specializing in business marketing and communication. Create high-quality, engaging content that drives results."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_completion_tokens: options.maxLength ? Math.min(options.maxLength, 8192) : 2048,
          response_format: options.type === 'faq' ? { type: "json_object" } : undefined,
        });

        return response;

      } catch (error) {
        lastError = error as Error;
        logger.warn(`Generation attempt ${attempt + 1} failed`, { error: lastError.message });
        
        if (attempt < this.retryAttempts - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, this.retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError || new Error("Failed to generate content after retries");
  }

  /**
   * Stream content generation for long-form content
   */
  private async streamGeneration(prompt: string, model: string): Promise<any> {
    const stream = await this.client!.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are a professional content creator. Generate high-quality content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      stream: true,
      max_completion_tokens: 8192,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        fullContent += chunk.choices[0].delta.content;
      }
    }

    return {
      choices: [{
        message: { content: fullContent }
      }],
      usage: {
        prompt_tokens: Math.ceil(prompt.length / 4),
        completion_tokens: Math.ceil(fullContent.length / 4),
        total_tokens: Math.ceil((prompt.length + fullContent.length) / 4)
      }
    };
  }

  /**
   * Process and enhance generated content
   */
  private async processContent(response: any, options: ContentGenerationOptions): Promise<string> {
    let content = response.choices[0].message.content;

    // Add hashtags for social media
    if (options.platform && ['instagram', 'twitter', 'linkedin'].includes(options.platform)) {
      content = await this.addHashtags(content, options.platform);
    }

    // Optimize for SEO
    if (options.keywords && options.keywords.length > 0) {
      content = await this.optimizeForSEO(content, options.keywords);
    }

    // Format for platform
    if (options.platform) {
      content = this.formatForPlatform(content, options.platform);
    }

    return content;
  }

  /**
   * Add relevant hashtags
   */
  private async addHashtags(content: string, platform: string): Promise<string> {
    const maxHashtags = platform === 'instagram' ? 30 : 5;
    
    // Extract keywords from content
    const keywords = content.match(/\b\w{4,}\b/g) || [];
    const uniqueKeywords = [...new Set(keywords.slice(0, maxHashtags))];
    
    const hashtags = uniqueKeywords
      .slice(0, Math.min(maxHashtags, 10))
      .map(word => `#${word.toLowerCase()}`)
      .join(' ');

    return `${content}\n\n${hashtags}`;
  }

  /**
   * Optimize content for SEO
   */
  private async optimizeForSEO(content: string, keywords: string[]): Promise<string> {
    // Ensure keywords appear naturally in content
    let optimized = content;
    
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = optimized.match(regex);
      
      // Add keyword if not present
      if (!matches || matches.length < 2) {
        // Find a suitable place to insert the keyword
        const sentences = optimized.split('. ');
        const midPoint = Math.floor(sentences.length / 2);
        sentences[midPoint] += ` featuring ${keyword}`;
        optimized = sentences.join('. ');
      }
    }

    return optimized;
  }

  /**
   * Format content for specific platform
   */
  private formatForPlatform(content: string, platform: string): string {
    const platformLimits: Record<string, number> = {
      twitter: 280,
      instagram: 2200,
      facebook: 63206,
      linkedin: 3000,
      gmb: 1500,
    };

    const limit = platformLimits[platform];
    if (limit && content.length > limit) {
      // Truncate intelligently at sentence boundary
      const truncated = content.substring(0, limit - 3);
      const lastPeriod = truncated.lastIndexOf('.');
      return lastPeriod > 0 ? truncated.substring(0, lastPeriod + 1) : truncated + '...';
    }

    return content;
  }

  /**
   * Calculate content metadata
   */
  private async calculateMetadata(content: string, model: string, response: any): Promise<any> {
    const tokensUsed = response.usage?.total_tokens || 0;
    const modelCost = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || MODEL_COSTS[DEFAULT_MODEL];
    
    const inputCost = (response.usage?.prompt_tokens || 0) / 1000 * modelCost.input;
    const outputCost = (response.usage?.completion_tokens || 0) / 1000 * modelCost.output;
    const totalCost = inputCost + outputCost;

    const words = content.split(/\s+/).length;
    const readingTime = Math.ceil(words / 200); // 200 words per minute

    // Extract hashtags
    const hashtags = content.match(/#\w+/g) || [];

    // Calculate SEO score (simplified)
    const seoScore = await this.calculateSEOScore(content);

    // Analyze sentiment
    const sentimentScore = await this.analyzeSentiment(content);

    return {
      model,
      tokensUsed,
      cost: totalCost,
      characterCount: content.length,
      wordCount: words,
      readingTime,
      seoScore,
      sentimentScore,
      hashtags,
    };
  }

  /**
   * Calculate SEO score
   */
  private async calculateSEOScore(content: string): Promise<number> {
    let score = 50; // Base score

    // Check for title/heading structure
    if (content.includes('#') || content.includes('**')) score += 10;

    // Check content length
    if (content.length > 300) score += 10;
    if (content.length > 600) score += 10;

    // Check for lists
    if (content.includes('•') || content.includes('-') || content.includes('1.')) score += 5;

    // Check for questions (engagement)
    if (content.includes('?')) score += 5;

    // Check for call-to-action
    const ctaKeywords = ['contact', 'visit', 'learn more', 'shop', 'buy', 'order'];
    if (ctaKeywords.some(keyword => content.toLowerCase().includes(keyword))) score += 10;

    return Math.min(100, score);
  }

  /**
   * Analyze sentiment
   */
  private async analyzeSentiment(content: string): Promise<number> {
    // Simple sentiment analysis based on positive/negative words
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best', 'perfect', 'beautiful', 'outstanding'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointing', 'failed', 'problem'];

    const lowerContent = content.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (lowerContent.includes(word)) score += 0.1;
    });

    negativeWords.forEach(word => {
      if (lowerContent.includes(word)) score -= 0.1;
    });

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, 0.5 + score));
  }

  /**
   * Perform quality checks
   */
  private async performQualityChecks(content: string): Promise<any> {
    // Check clarity (readability score)
    const clarity = this.calculateReadability(content);

    // Check engagement potential
    const engagement = this.calculateEngagement(content);

    // Check for profanity
    const hasProfanity = await this.checkProfanity(content);

    // Brand safety check
    const brandSafety = !hasProfanity && !this.containsSensitiveContent(content);

    return {
      clarity,
      engagement,
      brandSafety,
      hasProfanity,
    };
  }

  /**
   * Calculate readability score
   */
  private calculateReadability(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    
    // Simple readability score (inverse of complexity)
    if (avgWordsPerSentence < 10) return 0.9;
    if (avgWordsPerSentence < 15) return 0.8;
    if (avgWordsPerSentence < 20) return 0.7;
    if (avgWordsPerSentence < 25) return 0.6;
    return 0.5;
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagement(content: string): number {
    let score = 0.5; // Base score

    // Check for questions (increases engagement)
    if (content.includes('?')) score += 0.1;

    // Check for call-to-action
    const ctaPatterns = ['click', 'visit', 'learn', 'discover', 'explore', 'join', 'sign up', 'get started'];
    if (ctaPatterns.some(pattern => content.toLowerCase().includes(pattern))) score += 0.15;

    // Check for emotional words
    const emotionalWords = ['amazing', 'incredible', 'exciting', 'love', 'passionate', 'revolutionary'];
    if (emotionalWords.some(word => content.toLowerCase().includes(word))) score += 0.1;

    // Check for storytelling elements
    if (content.includes('story') || content.includes('journey') || content.includes('experience')) score += 0.05;

    // Check for lists (easy to scan)
    if (content.includes('•') || content.includes('-') || /\d\./.test(content)) score += 0.1;

    return Math.min(1, score);
  }

  /**
   * Check for profanity
   */
  private async checkProfanity(content: string): Promise<boolean> {
    // Simple profanity check (in production, use a proper profanity filter library)
    const profanityList = ['damn', 'hell']; // Simplified list
    const lowerContent = content.toLowerCase();
    
    return profanityList.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(lowerContent);
    });
  }

  /**
   * Check for sensitive content
   */
  private containsSensitiveContent(content: string): boolean {
    const sensitiveTopics = ['politics', 'religion', 'violence', 'adult', 'gambling', 'alcohol', 'tobacco'];
    const lowerContent = content.toLowerCase();
    
    return sensitiveTopics.some(topic => lowerContent.includes(topic));
  }

  /**
   * Generate cache key
   */
  private getCacheKey(options: ContentGenerationOptions): string {
    const key = {
      type: options.type,
      platform: options.platform,
      tone: options.tone,
      keywords: options.keywords?.sort().join(','),
      language: options.language,
      businessId: options.businessId,
    };
    
    return `content:${crypto.createHash('md5').update(JSON.stringify(key)).digest('hex')}`;
  }

  /**
   * Get cached content
   */
  private async getCachedContent(key: string): Promise<GeneratedContent | null> {
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
   * Cache generated content
   */
  private async cacheContent(key: string, content: GeneratedContent): Promise<void> {
    try {
      await cache.setex(key, this.cacheExpiry, JSON.stringify(content));
    } catch (error) {
      logger.error("Cache storage error", { error, key });
    }
  }

  /**
   * Track API usage for billing
   */
  private async trackUsage(businessId: string, metadata: any): Promise<void> {
    try {
      await storage.trackAIUsage({
        businessId,
        service: 'openai',
        model: metadata.model,
        tokensUsed: metadata.tokensUsed,
        cost: metadata.cost,
        type: 'content_generation',
      });
    } catch (error) {
      logger.error("Failed to track usage", { error, businessId });
    }
  }

  /**
   * Generate content templates
   */
  async getContentTemplates(category?: string): Promise<ContentTemplate[]> {
    const templates: ContentTemplate[] = [
      {
        id: 'biz-desc-1',
        name: 'Professional Business Description',
        description: 'Create a compelling business overview',
        type: 'business_description',
        category: 'business',
        prompt: 'Write a professional business description for {businessName} that operates in {industry}. Highlight {uniqueValue} and appeal to {targetAudience}.',
        variables: ['businessName', 'industry', 'uniqueValue', 'targetAudience'],
        tone: 'professional',
        isActive: true,
      },
      {
        id: 'prod-desc-1',
        name: 'Product Launch Description',
        description: 'Perfect for introducing new products',
        type: 'product_description',
        category: 'product',
        prompt: 'Create an exciting product description for {productName}. Emphasize {keyFeatures} and how it solves {customerProblem}. Include benefits for {targetCustomer}.',
        variables: ['productName', 'keyFeatures', 'customerProblem', 'targetCustomer'],
        tone: 'casual',
        isActive: true,
      },
      {
        id: 'social-1',
        name: 'Instagram Product Showcase',
        description: 'Eye-catching Instagram post for products',
        type: 'social_media',
        category: 'social',
        prompt: 'Create an Instagram post showcasing {product}. Include 3 key benefits, use emojis, and add 10 relevant hashtags. Make it visually descriptive.',
        variables: ['product'],
        tone: 'friendly',
        isActive: true,
      },
      {
        id: 'email-1',
        name: 'Welcome Email Series',
        description: 'Onboard new customers effectively',
        type: 'email_template',
        category: 'email',
        prompt: 'Write a welcome email for new customers of {businessName}. Thank them for joining, highlight {topBenefits}, and include a {specialOffer}.',
        variables: ['businessName', 'topBenefits', 'specialOffer'],
        tone: 'friendly',
        isActive: true,
      },
      {
        id: 'review-1',
        name: 'Positive Review Response',
        description: 'Thank customers for positive feedback',
        type: 'review_response',
        category: 'customer_service',
        prompt: 'Respond to a positive review for {businessName}. Thank the customer {customerName}, mention {specificDetail} they liked, and invite them back.',
        variables: ['businessName', 'customerName', 'specificDetail'],
        tone: 'friendly',
        isActive: true,
      },
      {
        id: 'blog-1',
        name: 'How-To Guide Blog Post',
        description: 'Educational content that provides value',
        type: 'blog_post',
        category: 'blog',
        prompt: 'Write a how-to guide about {topic} for {targetAudience}. Include {numberOfSteps} clear steps, practical examples, and expert tips.',
        variables: ['topic', 'targetAudience', 'numberOfSteps'],
        tone: 'professional',
        isActive: true,
      },
    ];

    if (category) {
      return templates.filter(t => t.category === category);
    }

    return templates;
  }

  /**
   * Generate content from template
   */
  async generateFromTemplate(
    templateId: string, 
    variables: Record<string, string>,
    options?: Partial<ContentGenerationOptions>
  ): Promise<GeneratedContent> {
    const templates = await this.getContentTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Replace variables in prompt
    let prompt = template.prompt;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    // Generate content using template
    return this.generateContent({
      type: template.type as any,
      tone: template.tone as any,
      useCache: true,
      ...options,
      context: { prompt, template: template.name },
    });
  }

  /**
   * Batch content generation
   */
  async generateBatch(
    requests: ContentGenerationOptions[]
  ): Promise<GeneratedContent[]> {
    const results: GeneratedContent[] = [];

    // Process in parallel with concurrency limit
    const concurrency = 3;
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(req => this.generateContent(req))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Moderate content for safety and compliance
   */
  async moderateContent(content: string): Promise<any> {
    this.checkConfiguration();
    
    try {
      const response = await this.client!.moderations.create({
        input: content,
      });

      return response.results[0];
    } catch (error) {
      logger.error('Content moderation failed', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();