import { db } from "./db";
import { 
  socialMediaAccounts, 
  socialMediaPosts,
  socialMediaAnalytics,
  socialMediaMessages,
  socialResponseTemplates,
  socialMediaCampaigns,
  socialContentCategories,
  socialMediaListeners,
  socialMediaMentions,
  socialMediaAutomation,
  socialMediaTeam,
  type SocialMediaAccount,
  type InsertSocialMediaAccount,
  type SocialMediaPost,
  type InsertSocialMediaPost,
  type SocialMediaAnalytics,
  type InsertSocialMediaAnalytics,
  type SocialMediaMessage,
  type InsertSocialMediaMessage,
  type SocialMediaCampaign,
  type InsertSocialMediaCampaign,
  type SocialContentCategory,
  type InsertSocialContentCategory,
  type SocialMediaListener,
  type InsertSocialMediaListener,
  type SocialMediaMention,
  type InsertSocialMediaMention,
  type SocialMediaAutomation,
  type InsertSocialMediaAutomation,
  type SocialMediaTeam,
  type InsertSocialMediaTeam,
} from "@shared/schema";
import { eq, and, or, desc, gte, lte, inArray, like, sql } from "drizzle-orm";
import { z } from "zod";

// Platform-specific API clients configuration
const PLATFORM_CONFIGS = {
  facebook: {
    apiVersion: 'v18.0',
    baseUrl: 'https://graph.facebook.com',
    scopes: ['pages_read_engagement', 'pages_manage_posts', 'pages_manage_metadata', 'pages_messaging'],
  },
  instagram: {
    apiVersion: 'v18.0',
    baseUrl: 'https://graph.instagram.com',
    scopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_comments', 'instagram_manage_messages'],
  },
  twitter: {
    apiVersion: '2',
    baseUrl: 'https://api.twitter.com',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'follows.read', 'follows.write'],
  },
  linkedin: {
    apiVersion: 'v2',
    baseUrl: 'https://api.linkedin.com',
    scopes: ['r_organization_social', 'w_organization_social', 'r_organization_admin', 'w_member_social'],
  },
  tiktok: {
    apiVersion: 'v2',
    baseUrl: 'https://open-api.tiktok.com',
    scopes: ['user.info.basic', 'video.publish', 'video.list'],
  },
  pinterest: {
    apiVersion: 'v5',
    baseUrl: 'https://api.pinterest.com',
    scopes: ['boards:read', 'boards:write', 'pins:read', 'pins:write'],
  },
  youtube: {
    apiVersion: 'v3',
    baseUrl: 'https://www.googleapis.com/youtube',
    scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
  },
};

// Platform-specific content limits
const PLATFORM_LIMITS = {
  facebook: { text: 63206, images: 10, videos: 1, videoSize: 4000 }, // MB
  instagram: { text: 2200, images: 10, videos: 1, videoSize: 650 },
  twitter: { text: 280, images: 4, videos: 1, videoSize: 512 },
  linkedin: { text: 3000, images: 9, videos: 1, videoSize: 5000 },
  tiktok: { text: 2200, images: 0, videos: 1, videoSize: 287 },
  pinterest: { text: 500, images: 5, videos: 1, videoSize: 2048 },
  youtube: { text: 5000, images: 0, videos: 1, videoSize: 128000 },
};

// Optimal posting times by platform
const OPTIMAL_POSTING_TIMES = {
  facebook: {
    weekdays: ['09:00', '13:00', '16:00'],
    weekends: ['12:00', '14:00'],
  },
  instagram: {
    weekdays: ['11:00', '14:00', '17:00'],
    weekends: ['11:00', '13:00'],
  },
  twitter: {
    weekdays: ['08:00', '10:00', '19:00'],
    weekends: ['09:00', '10:00'],
  },
  linkedin: {
    weekdays: ['07:30', '12:00', '17:00'],
    weekends: [], // LinkedIn has low weekend engagement
  },
  tiktok: {
    weekdays: ['06:00', '10:00', '19:00', '23:00'],
    weekends: ['09:00', '11:00', '19:00'],
  },
  pinterest: {
    weekdays: ['14:00', '21:00'],
    weekends: ['14:00', '21:00'],
  },
  youtube: {
    weekdays: ['14:00', '15:00', '16:00'],
    weekends: ['09:00', '10:00', '11:00'],
  },
};

export class SocialMediaService {
  // Account Management
  async connectAccount(data: InsertSocialMediaAccount): Promise<SocialMediaAccount> {
    const [account] = await db.insert(socialMediaAccounts)
      .values(data)
      .returning();
    return account;
  }

  async disconnectAccount(accountId: string): Promise<void> {
    await db.update(socialMediaAccounts)
      .set({ isActive: false, accessToken: null, refreshToken: null })
      .where(eq(socialMediaAccounts.id, accountId));
  }

  async refreshTokens(accountId: string): Promise<void> {
    const account = await db.select()
      .from(socialMediaAccounts)
      .where(eq(socialMediaAccounts.id, accountId))
      .limit(1);

    if (!account[0] || !account[0].refreshToken) {
      throw new Error('No refresh token available');
    }

    // Platform-specific token refresh logic would go here
    // This is a placeholder for the actual implementation
    const newTokens = await this.refreshPlatformToken(account[0]);
    
    await db.update(socialMediaAccounts)
      .set({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        tokenExpiry: newTokens.expiry,
        lastSyncAt: new Date(),
      })
      .where(eq(socialMediaAccounts.id, accountId));
  }

  private async refreshPlatformToken(account: SocialMediaAccount): Promise<any> {
    // Platform-specific token refresh implementation
    // This would integrate with each platform's OAuth2 refresh endpoint
    switch (account.platform) {
      case 'facebook':
      case 'instagram':
        // Meta platforms share the same token refresh
        return this.refreshMetaToken(account);
      case 'twitter':
        return this.refreshTwitterToken(account);
      case 'linkedin':
        return this.refreshLinkedInToken(account);
      // Add other platforms...
      default:
        throw new Error(`Unsupported platform: ${account.platform}`);
    }
  }

  private async refreshMetaToken(account: SocialMediaAccount): Promise<any> {
    // Placeholder for Meta token refresh
    return {
      accessToken: 'new_access_token',
      refreshToken: account.refreshToken,
      expiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    };
  }

  private async refreshTwitterToken(account: SocialMediaAccount): Promise<any> {
    // Placeholder for Twitter token refresh
    return {
      accessToken: 'new_access_token',
      refreshToken: 'new_refresh_token',
      expiry: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    };
  }

  private async refreshLinkedInToken(account: SocialMediaAccount): Promise<any> {
    // Placeholder for LinkedIn token refresh
    return {
      accessToken: 'new_access_token',
      refreshToken: account.refreshToken,
      expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    };
  }

  // Content Publishing
  async createPost(data: InsertSocialMediaPost): Promise<SocialMediaPost> {
    // Validate content for each platform
    for (const platform of data.platforms as string[]) {
      this.validateContentForPlatform(platform, data);
    }

    const [post] = await db.insert(socialMediaPosts)
      .values(data)
      .returning();

    // If scheduled, add to scheduling queue
    if (data.scheduledAt && data.scheduledAt > new Date()) {
      await this.schedulePost(post);
    } else if (data.status === 'published') {
      // Publish immediately
      await this.publishPost(post);
    }

    return post;
  }

  private validateContentForPlatform(platform: string, data: InsertSocialMediaPost): void {
    const limits = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS];
    if (!limits) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    if (data.content.length > limits.text) {
      throw new Error(`Content exceeds ${platform} character limit (${limits.text})`);
    }

    const mediaCount = (data.mediaUrls as string[] || []).length;
    if (data.contentType === 'image' && mediaCount > limits.images) {
      throw new Error(`Too many images for ${platform} (max: ${limits.images})`);
    }

    if (data.contentType === 'video' && mediaCount > limits.videos) {
      throw new Error(`Too many videos for ${platform} (max: ${limits.videos})`);
    }
  }

  async schedulePost(post: SocialMediaPost): Promise<void> {
    // Implementation for scheduling posts
    // This would integrate with a job queue system (Bull, etc.)
    console.log(`Post ${post.id} scheduled for ${post.scheduledAt}`);
  }

  async publishPost(post: SocialMediaPost): Promise<void> {
    const accounts = await db.select()
      .from(socialMediaAccounts)
      .where(
        and(
          eq(socialMediaAccounts.businessId, post.businessId),
          inArray(socialMediaAccounts.platform, post.platforms as string[]),
          eq(socialMediaAccounts.isActive, true)
        )
      );

    const platformPosts: Record<string, any> = {};

    for (const account of accounts) {
      try {
        const result = await this.publishToPlatform(account, post);
        platformPosts[account.platform] = {
          id: result.id,
          status: 'published',
          url: result.url,
          publishedAt: new Date(),
        };
      } catch (error) {
        platformPosts[account.platform] = {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    await db.update(socialMediaPosts)
      .set({
        platformPosts,
        status: 'published',
        publishedAt: new Date(),
      })
      .where(eq(socialMediaPosts.id, post.id));
  }

  private async publishToPlatform(account: SocialMediaAccount, post: SocialMediaPost): Promise<any> {
    // Platform-specific publishing logic
    switch (account.platform) {
      case 'facebook':
        return this.publishToFacebook(account, post);
      case 'instagram':
        return this.publishToInstagram(account, post);
      case 'twitter':
        return this.publishToTwitter(account, post);
      case 'linkedin':
        return this.publishToLinkedIn(account, post);
      // Add other platforms...
      default:
        throw new Error(`Publishing not implemented for ${account.platform}`);
    }
  }

  private async publishToFacebook(account: SocialMediaAccount, post: SocialMediaPost): Promise<any> {
    // Facebook Graph API implementation
    const endpoint = `${PLATFORM_CONFIGS.facebook.baseUrl}/${PLATFORM_CONFIGS.facebook.apiVersion}/${account.accountId}/feed`;
    
    // Placeholder response
    return {
      id: 'facebook_post_id',
      url: `https://facebook.com/${account.accountId}/posts/facebook_post_id`,
    };
  }

  private async publishToInstagram(account: SocialMediaAccount, post: SocialMediaPost): Promise<any> {
    // Instagram Graph API implementation
    const endpoint = `${PLATFORM_CONFIGS.instagram.baseUrl}/${PLATFORM_CONFIGS.instagram.apiVersion}/${account.accountId}/media`;
    
    // Placeholder response
    return {
      id: 'instagram_post_id',
      url: `https://instagram.com/p/instagram_post_id`,
    };
  }

  private async publishToTwitter(account: SocialMediaAccount, post: SocialMediaPost): Promise<any> {
    // Twitter API v2 implementation
    const endpoint = `${PLATFORM_CONFIGS.twitter.baseUrl}/${PLATFORM_CONFIGS.twitter.apiVersion}/tweets`;
    
    // Placeholder response
    return {
      id: 'tweet_id',
      url: `https://twitter.com/${account.accountHandle}/status/tweet_id`,
    };
  }

  private async publishToLinkedIn(account: SocialMediaAccount, post: SocialMediaPost): Promise<any> {
    // LinkedIn API implementation
    const endpoint = `${PLATFORM_CONFIGS.linkedin.baseUrl}/${PLATFORM_CONFIGS.linkedin.apiVersion}/ugcPosts`;
    
    // Placeholder response
    return {
      id: 'linkedin_post_id',
      url: `https://linkedin.com/feed/update/urn:li:share:linkedin_post_id`,
    };
  }

  // Analytics & Metrics
  async fetchAnalytics(businessId: string, dateRange: { start: Date; end: Date }): Promise<SocialMediaAnalytics[]> {
    const accounts = await db.select()
      .from(socialMediaAccounts)
      .where(
        and(
          eq(socialMediaAccounts.businessId, businessId),
          eq(socialMediaAccounts.isActive, true)
        )
      );

    const analytics: InsertSocialMediaAnalytics[] = [];

    for (const account of accounts) {
      const metrics = await this.fetchPlatformAnalytics(account, dateRange);
      analytics.push(...metrics);
    }

    // Store analytics in database
    if (analytics.length > 0) {
      await db.insert(socialMediaAnalytics)
        .values(analytics)
        .onConflictDoUpdate({
          target: [socialMediaAnalytics.accountId, socialMediaAnalytics.metricDate],
          set: {
            impressions: sql`excluded.impressions`,
            reach: sql`excluded.reach`,
            engagements: sql`excluded.engagements`,
            likes: sql`excluded.likes`,
            comments: sql`excluded.comments`,
            shares: sql`excluded.shares`,
            updatedAt: new Date(),
          },
        });
    }

    return db.select()
      .from(socialMediaAnalytics)
      .where(
        and(
          eq(socialMediaAnalytics.businessId, businessId),
          gte(socialMediaAnalytics.metricDate, dateRange.start.toISOString().split('T')[0]),
          lte(socialMediaAnalytics.metricDate, dateRange.end.toISOString().split('T')[0])
        )
      );
  }

  private async fetchPlatformAnalytics(
    account: SocialMediaAccount,
    dateRange: { start: Date; end: Date }
  ): Promise<InsertSocialMediaAnalytics[]> {
    // Platform-specific analytics fetching
    // This is a placeholder implementation
    const metrics: InsertSocialMediaAnalytics[] = [];
    
    // Generate sample metrics for each day in range
    const currentDate = new Date(dateRange.start);
    while (currentDate <= dateRange.end) {
      metrics.push({
        accountId: account.id,
        businessId: account.businessId,
        platform: account.platform,
        metricDate: currentDate.toISOString().split('T')[0],
        metricType: 'account',
        impressions: Math.floor(Math.random() * 10000),
        reach: Math.floor(Math.random() * 8000),
        engagements: Math.floor(Math.random() * 500),
        likes: Math.floor(Math.random() * 300),
        comments: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50),
        followerCount: Math.floor(Math.random() * 5000),
        followerGrowth: Math.floor(Math.random() * 100) - 50,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return metrics;
  }

  // Message & Inbox Management
  async fetchMessages(businessId: string): Promise<void> {
    const accounts = await db.select()
      .from(socialMediaAccounts)
      .where(
        and(
          eq(socialMediaAccounts.businessId, businessId),
          eq(socialMediaAccounts.isActive, true)
        )
      );

    for (const account of accounts) {
      await this.fetchPlatformMessages(account);
    }
  }

  private async fetchPlatformMessages(account: SocialMediaAccount): Promise<void> {
    // Platform-specific message fetching
    // This would integrate with each platform's messaging API
    const messages = await this.getPlatformMessages(account);
    
    if (messages.length > 0) {
      await db.insert(socialMediaMessages)
        .values(messages)
        .onConflictDoNothing();
    }
  }

  private async getPlatformMessages(account: SocialMediaAccount): Promise<InsertSocialMediaMessage[]> {
    // Placeholder implementation
    return [];
  }

  async sendMessage(messageId: string, response: string): Promise<void> {
    const [message] = await db.select()
      .from(socialMediaMessages)
      .where(eq(socialMediaMessages.id, messageId))
      .limit(1);

    if (!message) {
      throw new Error('Message not found');
    }

    const [account] = await db.select()
      .from(socialMediaAccounts)
      .where(eq(socialMediaAccounts.id, message.accountId))
      .limit(1);

    if (!account) {
      throw new Error('Account not found');
    }

    // Send response through platform API
    await this.sendPlatformMessage(account, message, response);

    // Update message status
    await db.update(socialMediaMessages)
      .set({
        status: 'replied',
        repliedAt: new Date(),
        responseTime: Math.floor((new Date().getTime() - message.createdAt.getTime()) / 1000),
      })
      .where(eq(socialMediaMessages.id, messageId));
  }

  private async sendPlatformMessage(
    account: SocialMediaAccount,
    message: SocialMediaMessage,
    response: string
  ): Promise<void> {
    // Platform-specific message sending
    switch (account.platform) {
      case 'facebook':
      case 'instagram':
        // Meta platforms share similar messaging APIs
        await this.sendMetaMessage(account, message, response);
        break;
      case 'twitter':
        await this.sendTwitterMessage(account, message, response);
        break;
      // Add other platforms...
    }
  }

  private async sendMetaMessage(
    account: SocialMediaAccount,
    message: SocialMediaMessage,
    response: string
  ): Promise<void> {
    // Meta Messenger API implementation
    console.log(`Sending message via ${account.platform}: ${response}`);
  }

  private async sendTwitterMessage(
    account: SocialMediaAccount,
    message: SocialMediaMessage,
    response: string
  ): Promise<void> {
    // Twitter DM API implementation
    console.log(`Sending Twitter DM: ${response}`);
  }

  // Content Suggestions
  async generateHashtags(content: string, platform: string): Promise<string[]> {
    // AI-powered hashtag generation
    // This would integrate with an AI service for hashtag suggestions
    const hashtags: string[] = [];
    
    // Basic keyword extraction for demo
    const words = content.toLowerCase().split(/\s+/);
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    const keywords = words.filter(w => w.length > 4 && !commonWords.includes(w));
    
    // Platform-specific hashtag limits
    const hashtagLimits: Record<string, number> = {
      instagram: 30,
      twitter: 2,
      facebook: 10,
      linkedin: 3,
      tiktok: 100,
      pinterest: 20,
    };

    const limit = hashtagLimits[platform] || 10;
    
    for (let i = 0; i < Math.min(keywords.length, limit); i++) {
      hashtags.push(`#${keywords[i]}`);
    }

    // Add trending hashtags (placeholder)
    hashtags.push('#trending', '#viral', `#${platform}`);

    return hashtags.slice(0, limit);
  }

  async suggestOptimalTimes(businessId: string, platform: string): Promise<string[]> {
    // Analyze past performance to suggest optimal posting times
    const analytics = await db.select()
      .from(socialMediaAnalytics)
      .where(
        and(
          eq(socialMediaAnalytics.businessId, businessId),
          eq(socialMediaAnalytics.platform, platform)
        )
      )
      .orderBy(desc(socialMediaAnalytics.engagementRate))
      .limit(10);

    if (analytics.length === 0) {
      // Return default optimal times
      const defaults = OPTIMAL_POSTING_TIMES[platform as keyof typeof OPTIMAL_POSTING_TIMES];
      const isWeekday = new Date().getDay() >= 1 && new Date().getDay() <= 5;
      return isWeekday ? defaults.weekdays : defaults.weekends;
    }

    // Analyze best performing times from analytics
    // This is a simplified version - real implementation would be more sophisticated
    return OPTIMAL_POSTING_TIMES[platform as keyof typeof OPTIMAL_POSTING_TIMES].weekdays;
  }

  // Campaign Management
  async createCampaign(data: InsertSocialMediaCampaign): Promise<SocialMediaCampaign> {
    const [campaign] = await db.insert(socialMediaCampaigns)
      .values(data)
      .returning();
    return campaign;
  }

  async updateCampaignMetrics(campaignId: string): Promise<void> {
    // Aggregate metrics from all posts in the campaign
    const posts = await db.select()
      .from(socialMediaPosts)
      .where(eq(socialMediaPosts.campaignId, campaignId));

    const postIds = posts.map(p => p.id);
    
    if (postIds.length > 0) {
      const metrics = await db.select({
        totalImpressions: sql`SUM(impressions)`,
        totalEngagements: sql`SUM(engagements)`,
        totalReach: sql`SUM(reach)`,
      })
      .from(socialMediaAnalytics)
      .where(inArray(socialMediaAnalytics.postId, postIds));

      await db.update(socialMediaCampaigns)
        .set({
          postCount: posts.length,
          totalImpressions: metrics[0]?.totalImpressions || 0,
          totalEngagements: metrics[0]?.totalEngagements || 0,
          updatedAt: new Date(),
        })
        .where(eq(socialMediaCampaigns.id, campaignId));
    }
  }

  // Social Listening
  async createListener(data: InsertSocialMediaListener): Promise<SocialMediaListener> {
    const [listener] = await db.insert(socialMediaListeners)
      .values(data)
      .returning();
    
    // Start monitoring
    await this.startMonitoring(listener);
    
    return listener;
  }

  private async startMonitoring(listener: SocialMediaListener): Promise<void> {
    // Set up webhooks or polling for monitoring
    // This would integrate with platform APIs for real-time monitoring
    console.log(`Started monitoring: ${listener.name}`);
  }

  async checkMentions(businessId: string): Promise<SocialMediaMention[]> {
    const listeners = await db.select()
      .from(socialMediaListeners)
      .where(
        and(
          eq(socialMediaListeners.businessId, businessId),
          eq(socialMediaListeners.isActive, true)
        )
      );

    const mentions: InsertSocialMediaMention[] = [];

    for (const listener of listeners) {
      const newMentions = await this.fetchMentionsForListener(listener);
      mentions.push(...newMentions);
    }

    if (mentions.length > 0) {
      await db.insert(socialMediaMentions)
        .values(mentions)
        .onConflictDoNothing();
    }

    return db.select()
      .from(socialMediaMentions)
      .where(eq(socialMediaMentions.businessId, businessId))
      .orderBy(desc(socialMediaMentions.mentionedAt))
      .limit(100);
  }

  private async fetchMentionsForListener(listener: SocialMediaListener): Promise<InsertSocialMediaMention[]> {
    // Platform-specific mention fetching
    // This would integrate with social listening APIs
    return [];
  }

  // Automation
  async createAutomation(data: InsertSocialMediaAutomation): Promise<SocialMediaAutomation> {
    const [automation] = await db.insert(socialMediaAutomation)
      .values(data)
      .returning();
    
    // Set up automation triggers
    await this.setupAutomationTriggers(automation);
    
    return automation;
  }

  private async setupAutomationTriggers(automation: SocialMediaAutomation): Promise<void> {
    // Set up cron jobs, webhooks, or event listeners based on trigger type
    console.log(`Automation setup: ${automation.name}`);
  }

  async runAutomation(automationId: string): Promise<void> {
    const [automation] = await db.select()
      .from(socialMediaAutomation)
      .where(eq(socialMediaAutomation.id, automationId))
      .limit(1);

    if (!automation || !automation.isActive) {
      return;
    }

    // Execute automation action
    await this.executeAutomationAction(automation);

    // Update last triggered
    await db.update(socialMediaAutomation)
      .set({
        lastTriggeredAt: new Date(),
        triggerCount: (automation.triggerCount || 0) + 1,
      })
      .where(eq(socialMediaAutomation.id, automationId));
  }

  private async executeAutomationAction(automation: SocialMediaAutomation): Promise<void> {
    // Execute the configured action
    const actionConfig = automation.actionConfig as any;
    
    switch (automation.actionType) {
      case 'post':
        // Create and publish a post
        await this.createPost({
          businessId: automation.businessId,
          authorId: 'system',
          content: actionConfig.content,
          contentType: 'text',
          platforms: automation.platforms as string[],
          status: 'published',
        });
        break;
      case 'message':
        // Send automated messages
        console.log('Sending automated message');
        break;
      case 'email':
        // Send email notification
        console.log('Sending automated email');
        break;
    }
  }

  // Team Collaboration
  async addTeamMember(data: InsertSocialMediaTeam): Promise<SocialMediaTeam> {
    const [member] = await db.insert(socialMediaTeam)
      .values(data)
      .returning();
    return member;
  }

  async updateTeamMemberPermissions(
    memberId: string,
    permissions: Partial<SocialMediaTeam>
  ): Promise<void> {
    await db.update(socialMediaTeam)
      .set(permissions)
      .where(eq(socialMediaTeam.id, memberId));
  }

  async getTeamMembers(businessId: string): Promise<SocialMediaTeam[]> {
    return db.select()
      .from(socialMediaTeam)
      .where(
        and(
          eq(socialMediaTeam.businessId, businessId),
          eq(socialMediaTeam.isActive, true)
        )
      );
  }

  // Bulk Operations
  async bulkSchedulePosts(csvData: any[], businessId: string, authorId: string): Promise<SocialMediaPost[]> {
    const posts: InsertSocialMediaPost[] = [];

    for (const row of csvData) {
      posts.push({
        businessId,
        authorId,
        content: row.content,
        contentType: row.contentType || 'text',
        platforms: row.platforms.split(','),
        scheduledAt: new Date(row.scheduledAt),
        status: 'scheduled',
        hashtags: row.hashtags?.split(',') || [],
        mediaUrls: row.mediaUrls?.split(',') || [],
      });
    }

    const insertedPosts = await db.insert(socialMediaPosts)
      .values(posts)
      .returning();

    // Schedule all posts
    for (const post of insertedPosts) {
      await this.schedulePost(post);
    }

    return insertedPosts;
  }

  // Content Categories
  async createCategory(data: InsertSocialContentCategory): Promise<SocialContentCategory> {
    const [category] = await db.insert(socialContentCategories)
      .values(data)
      .returning();
    return category;
  }

  async getCategories(businessId: string): Promise<SocialContentCategory[]> {
    return db.select()
      .from(socialContentCategories)
      .where(
        and(
          eq(socialContentCategories.businessId, businessId),
          eq(socialContentCategories.isActive, true)
        )
      );
  }

  // Response Templates
  async createResponseTemplate(data: InsertSocialResponseTemplate): Promise<SocialResponseTemplate> {
    const [template] = await db.insert(socialResponseTemplates)
      .values(data)
      .returning();
    return template;
  }

  async getResponseTemplates(businessId: string): Promise<SocialResponseTemplate[]> {
    return db.select()
      .from(socialResponseTemplates)
      .where(
        and(
          eq(socialResponseTemplates.businessId, businessId),
          eq(socialResponseTemplates.isActive, true)
        )
      );
  }

  async useResponseTemplate(templateId: string): Promise<string> {
    const [template] = await db.select()
      .from(socialResponseTemplates)
      .where(eq(socialResponseTemplates.id, templateId))
      .limit(1);

    if (!template) {
      throw new Error('Template not found');
    }

    // Increment use count
    await db.update(socialResponseTemplates)
      .set({ useCount: (template.useCount || 0) + 1 })
      .where(eq(socialResponseTemplates.id, templateId));

    return template.content;
  }

  // Additional methods for API routes
  async getAccounts(businessId: string): Promise<SocialMediaAccount[]> {
    return db.select()
      .from(socialMediaAccounts)
      .where(
        and(
          eq(socialMediaAccounts.businessId, businessId),
          eq(socialMediaAccounts.isActive, true)
        )
      );
  }
}

// Export singleton instance
export const socialMediaService = new SocialMediaService();