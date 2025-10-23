/**
 * Google My Business Posts Management Service
 * Handles creating, scheduling, and managing GMB posts with performance tracking
 */

import { gmbService } from './gmbService';
import { gmbErrorHandler } from './gmbErrorHandler';
import { storage } from './storage';

export type PostType = 'STANDARD' | 'EVENT' | 'OFFER' | 'PRODUCT' | 'COVID_UPDATE';
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'FAILED';
export type ActionType = 'LEARN_MORE' | 'BOOK' | 'ORDER' | 'SHOP' | 'SIGN_UP' | 'GET_OFFER' | 'CALL';

export interface GMBPost {
  id: string;
  businessId: string;
  gmbPostId?: string;
  type: PostType;
  status: PostStatus;
  title?: string;
  summary: string;
  mediaUrls?: string[];
  callToAction?: {
    actionType: ActionType;
    url?: string;
    phone?: string;
  };
  event?: {
    title: string;
    startDate: Date;
    endDate: Date;
  };
  offer?: {
    couponCode?: string;
    redeemOnlineUrl?: string;
    termsConditions?: string;
  };
  scheduledDate?: Date;
  publishedDate?: Date;
  expiryDate?: Date;
  metrics?: PostMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostMetrics {
  views: number;
  clicks: number;
  callClicks: number;
  directionClicks: number;
  websiteClicks: number;
  lastUpdated: Date;
}

export interface PostTemplate {
  id: string;
  name: string;
  type: PostType;
  title?: string;
  summaryTemplate: string;
  callToAction?: {
    actionType: ActionType;
    urlTemplate?: string;
  };
  tags: string[];
  usageCount: number;
}

export interface PostSchedule {
  id: string;
  businessId: string;
  postId: string;
  scheduledDate: Date;
  status: 'pending' | 'processing' | 'published' | 'failed';
  errorMessage?: string;
  attempts: number;
  lastAttempt?: Date;
}

export class GMBPostService {
  private postTemplates: PostTemplate[] = [
    {
      id: 'new_product',
      name: 'New Product Announcement',
      type: 'PRODUCT',
      title: 'New Product Available!',
      summaryTemplate: 'Introducing our latest {product_name}! {product_description} Available now in-store and online.',
      callToAction: {
        actionType: 'SHOP',
        urlTemplate: '{website_url}/products/{product_id}'
      },
      tags: ['product', 'new', 'announcement'],
      usageCount: 0
    },
    {
      id: 'special_offer',
      name: 'Limited Time Offer',
      type: 'OFFER',
      title: 'Special Offer!',
      summaryTemplate: 'Get {discount}% off on {product_category}! Use code {coupon_code} at checkout. Valid until {expiry_date}.',
      callToAction: {
        actionType: 'GET_OFFER',
        urlTemplate: '{website_url}/offers'
      },
      tags: ['offer', 'discount', 'promotion'],
      usageCount: 0
    },
    {
      id: 'upcoming_event',
      name: 'Event Announcement',
      type: 'EVENT',
      title: 'Join Us!',
      summaryTemplate: 'Join us for {event_name} on {event_date}! {event_description} Limited seats available.',
      callToAction: {
        actionType: 'SIGN_UP',
        urlTemplate: '{website_url}/events/{event_id}'
      },
      tags: ['event', 'announcement'],
      usageCount: 0
    },
    {
      id: 'business_update',
      name: 'Business Update',
      type: 'STANDARD',
      summaryTemplate: '{update_message} Visit us today to learn more!',
      callToAction: {
        actionType: 'LEARN_MORE',
        urlTemplate: '{website_url}'
      },
      tags: ['update', 'news'],
      usageCount: 0
    }
  ];

  private scheduledPosts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Create a new GMB post
   */
  async createPost(businessId: string, postData: {
    type: PostType;
    title?: string;
    summary: string;
    mediaUrls?: string[];
    callToAction?: GMBPost['callToAction'];
    event?: GMBPost['event'];
    offer?: GMBPost['offer'];
    scheduledDate?: Date;
  }): Promise<GMBPost> {
    const business = await storage.getBusinessById(businessId);
    if (!business?.gmbConnected) {
      throw new Error('Business is not connected to Google My Business');
    }

    const post: GMBPost = {
      id: `post_${Date.now()}_${businessId}`,
      businessId,
      type: postData.type,
      status: postData.scheduledDate ? 'SCHEDULED' : 'DRAFT',
      title: postData.title,
      summary: postData.summary,
      mediaUrls: postData.mediaUrls,
      callToAction: postData.callToAction,
      event: postData.event,
      offer: postData.offer,
      scheduledDate: postData.scheduledDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // If scheduled, set up the scheduling
    if (postData.scheduledDate) {
      await this.schedulePost(post);
    } else {
      // Publish immediately
      await this.publishPost(post.id);
    }

    return post;
  }

  /**
   * Publish a post to GMB
   */
  async publishPost(postId: string): Promise<void> {
    // Get post from storage (in a real implementation)
    const post = await this.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const business = await storage.getBusinessById(post.businessId);
    if (!business?.gmbAccountId || !business?.gmbLocationId) {
      throw new Error('Business GMB configuration not found');
    }

    return await gmbErrorHandler.withRetry(async () => {
      const accessToken = await gmbService.getValidAccessToken(post.businessId);
      const locationName = `accounts/${business.gmbAccountId}/locations/${business.gmbLocationId}`;
      
      // Build post payload based on type
      const payload = this.buildPostPayload(post);
      
      // Make API call to create post
      const response = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}/localPosts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create GMB post: ${error}`);
      }

      const result = await response.json();
      
      // Update post with GMB ID and status
      post.gmbPostId = result.name;
      post.status = 'PUBLISHED';
      post.publishedDate = new Date();
      
      // Set expiry based on post type
      if (post.type === 'OFFER' && post.offer) {
        post.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      } else if (post.type === 'EVENT' && post.event) {
        post.expiryDate = post.event.endDate;
      }

      // Log success
      await storage.createGmbSyncHistory({
        businessId: post.businessId,
        syncType: 'post_publish',
        status: 'success',
        dataTypes: ['post'],
        changes: { postId: post.id, gmbPostId: post.gmbPostId },
        errorDetails: null,
        itemsProcessed: 1,
        itemsUpdated: 1,
        itemsErrors: 0,
        durationMs: null,
        triggeredBy: 'manual',
        gmbApiVersion: 'v4.9'
      });

    }, { maxRetries: 2 }, { businessId: post.businessId, operation: 'publish_post' });
  }

  /**
   * Update an existing GMB post
   */
  async updatePost(postId: string, updates: Partial<GMBPost>): Promise<GMBPost> {
    const post = await this.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (post.status === 'PUBLISHED' && post.gmbPostId) {
      // Update on GMB
      await this.updateGMBPost(post, updates);
    }

    // Update local post
    Object.assign(post, updates, { updatedAt: new Date() });
    
    return post;
  }

  /**
   * Delete a GMB post
   */
  async deletePost(postId: string): Promise<void> {
    const post = await this.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (post.status === 'PUBLISHED' && post.gmbPostId) {
      const business = await storage.getBusinessById(post.businessId);
      if (!business?.gmbAccountId || !business?.gmbLocationId) {
        throw new Error('Business GMB configuration not found');
      }

      await gmbErrorHandler.withRetry(async () => {
        const accessToken = await gmbService.getValidAccessToken(post.businessId);
        
        const response = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${post.gmbPostId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete GMB post: ${response.statusText}`);
        }
      }, { maxRetries: 2 }, { businessId: post.businessId, operation: 'delete_post' });
    }

    // Cancel schedule if exists
    if (post.status === 'SCHEDULED') {
      this.cancelScheduledPost(postId);
    }

    // Mark as deleted in local storage
    post.status = 'EXPIRED';
  }

  /**
   * Schedule a post for future publication
   */
  async schedulePost(post: GMBPost): Promise<void> {
    if (!post.scheduledDate) {
      throw new Error('Scheduled date is required');
    }

    const delay = post.scheduledDate.getTime() - Date.now();
    if (delay <= 0) {
      // Publish immediately if scheduled time has passed
      await this.publishPost(post.id);
      return;
    }

    // Set up timeout for publishing
    const timeout = setTimeout(async () => {
      try {
        await this.publishPost(post.id);
        this.scheduledPosts.delete(post.id);
      } catch (error) {
        console.error(`Failed to publish scheduled post ${post.id}:`, error);
        post.status = 'FAILED';
        // Store error in database
        await storage.createGmbSyncHistory({
          businessId: post.businessId,
          syncType: 'post_schedule_failed',
          status: 'error',
          dataTypes: ['post'],
          changes: null,
          errorDetails: (error as Error).message,
          itemsProcessed: 1,
          itemsUpdated: 0,
          itemsErrors: 1,
          durationMs: null,
          triggeredBy: 'scheduled',
          gmbApiVersion: 'v4.9'
        });
      }
    }, delay);

    this.scheduledPosts.set(post.id, timeout);
  }

  /**
   * Cancel a scheduled post
   */
  cancelScheduledPost(postId: string): void {
    const timeout = this.scheduledPosts.get(postId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledPosts.delete(postId);
    }
  }

  /**
   * Get post performance metrics from GMB
   */
  async getPostMetrics(postId: string): Promise<PostMetrics> {
    const post = await this.getPostById(postId);
    if (!post || !post.gmbPostId) {
      throw new Error('Post not found or not published');
    }

    return await gmbErrorHandler.withRetry(async () => {
      const accessToken = await gmbService.getValidAccessToken(post.businessId);
      
      // Get post insights from GMB API
      const response = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${post.gmbPostId}/insights`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch post metrics: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Parse metrics from response
      const metrics: PostMetrics = {
        views: data.metricValues?.find((m: any) => m.metric === 'LOCAL_POST_VIEWS_SEARCH')?.totalValue?.value || 0,
        clicks: data.metricValues?.find((m: any) => m.metric === 'LOCAL_POST_ACTIONS_CALL_TO_ACTION')?.totalValue?.value || 0,
        callClicks: data.metricValues?.find((m: any) => m.metric === 'LOCAL_POST_ACTIONS_CALL')?.totalValue?.value || 0,
        directionClicks: data.metricValues?.find((m: any) => m.metric === 'LOCAL_POST_ACTIONS_DIRECTIONS')?.totalValue?.value || 0,
        websiteClicks: data.metricValues?.find((m: any) => m.metric === 'LOCAL_POST_ACTIONS_WEBSITE')?.totalValue?.value || 0,
        lastUpdated: new Date()
      };

      // Update post with metrics
      post.metrics = metrics;
      
      return metrics;
    }, { maxRetries: 3 }, { businessId: post.businessId, operation: 'get_post_metrics' });
  }

  /**
   * Get all posts for a business
   */
  async getBusinessPosts(businessId: string, options: {
    status?: PostStatus[];
    type?: PostType[];
    dateRange?: { start: Date; end: Date };
    limit?: number;
    offset?: number;
  } = {}): Promise<{ posts: GMBPost[]; total: number }> {
    // In a real implementation, this would query from database
    // For now, return mock data
    const mockPosts: GMBPost[] = [
      {
        id: `post_1_${businessId}`,
        businessId,
        type: 'STANDARD',
        status: 'PUBLISHED',
        title: 'Summer Sale!',
        summary: 'Get 20% off all items this weekend only!',
        publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        metrics: {
          views: 1250,
          clicks: 87,
          callClicks: 12,
          directionClicks: 23,
          websiteClicks: 52,
          lastUpdated: new Date()
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        id: `post_2_${businessId}`,
        businessId,
        type: 'EVENT',
        status: 'SCHEDULED',
        title: 'Grand Opening Event',
        summary: 'Join us for our grand opening celebration!',
        event: {
          title: 'Grand Opening',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)
        },
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return {
      posts: mockPosts,
      total: mockPosts.length
    };
  }

  /**
   * Get post templates
   */
  getPostTemplates(type?: PostType): PostTemplate[] {
    if (type) {
      return this.postTemplates.filter(t => t.type === type);
    }
    return this.postTemplates;
  }

  /**
   * Generate post content using AI
   */
  async generatePostContent(businessId: string, options: {
    type: PostType;
    topic: string;
    tone?: 'professional' | 'casual' | 'friendly' | 'urgent';
    includeEmoji?: boolean;
    maxLength?: number;
  }): Promise<{
    title?: string;
    summary: string;
    callToAction?: GMBPost['callToAction'];
  }> {
    const business = await storage.getBusinessById(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    // Generate content based on type and options
    const tone = options.tone || 'professional';
    const maxLength = options.maxLength || 1500; // GMB post limit
    
    let title: string | undefined;
    let summary: string;
    let callToAction: GMBPost['callToAction'] | undefined;

    switch (options.type) {
      case 'OFFER':
        title = options.includeEmoji ? '🎉 Special Offer!' : 'Special Offer';
        summary = this.generateOfferContent(business.name, options.topic, tone);
        callToAction = {
          actionType: 'GET_OFFER',
          url: business.website
        };
        break;
        
      case 'EVENT':
        title = options.includeEmoji ? '📅 Upcoming Event' : 'Join Us!';
        summary = this.generateEventContent(business.name, options.topic, tone);
        callToAction = {
          actionType: 'SIGN_UP',
          url: business.website
        };
        break;
        
      case 'PRODUCT':
        title = options.includeEmoji ? '✨ New Product' : 'New Arrival';
        summary = this.generateProductContent(business.name, options.topic, tone);
        callToAction = {
          actionType: 'SHOP',
          url: business.website
        };
        break;
        
      default:
        summary = this.generateStandardContent(business.name, options.topic, tone);
        callToAction = {
          actionType: 'LEARN_MORE',
          url: business.website
        };
    }

    // Ensure summary doesn't exceed max length
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + '...';
    }

    return { title, summary, callToAction };
  }

  /**
   * Batch create multiple posts
   */
  async batchCreatePosts(businessId: string, posts: Array<Partial<GMBPost>>): Promise<GMBPost[]> {
    const createdPosts: GMBPost[] = [];
    const errors: Array<{ post: Partial<GMBPost>; error: string }> = [];

    for (const postData of posts) {
      try {
        const post = await this.createPost(businessId, {
          type: postData.type || 'STANDARD',
          title: postData.title,
          summary: postData.summary || '',
          mediaUrls: postData.mediaUrls,
          callToAction: postData.callToAction,
          event: postData.event,
          offer: postData.offer,
          scheduledDate: postData.scheduledDate
        });
        createdPosts.push(post);
      } catch (error) {
        errors.push({
          post: postData,
          error: (error as Error).message
        });
      }
    }

    if (errors.length > 0) {
      console.error('Batch post creation errors:', errors);
    }

    return createdPosts;
  }

  /**
   * Get post analytics summary
   */
  async getPostAnalytics(businessId: string, dateRange: { start: Date; end: Date }): Promise<{
    totalPosts: number;
    totalViews: number;
    totalClicks: number;
    averageEngagementRate: number;
    topPerformingPosts: GMBPost[];
    postsByType: Record<PostType, number>;
    performanceByDay: Array<{ date: string; views: number; clicks: number }>;
  }> {
    const { posts } = await this.getBusinessPosts(businessId, { dateRange });
    
    let totalViews = 0;
    let totalClicks = 0;
    const postsByType: Record<PostType, number> = {
      'STANDARD': 0,
      'EVENT': 0,
      'OFFER': 0,
      'PRODUCT': 0,
      'COVID_UPDATE': 0
    };

    posts.forEach(post => {
      if (post.metrics) {
        totalViews += post.metrics.views;
        totalClicks += post.metrics.clicks;
      }
      postsByType[post.type]++;
    });

    const averageEngagementRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    // Get top performing posts
    const topPerformingPosts = posts
      .filter(p => p.metrics)
      .sort((a, b) => (b.metrics?.views || 0) - (a.metrics?.views || 0))
      .slice(0, 5);

    // Generate daily performance (mock data for demo)
    const performanceByDay: Array<{ date: string; views: number; clicks: number }> = [];
    const currentDate = new Date(dateRange.start);
    while (currentDate <= dateRange.end) {
      performanceByDay.push({
        date: currentDate.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 500),
        clicks: Math.floor(Math.random() * 50)
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      totalPosts: posts.length,
      totalViews,
      totalClicks,
      averageEngagementRate,
      topPerformingPosts,
      postsByType,
      performanceByDay
    };
  }

  /**
   * Helper: Build GMB post payload
   */
  private buildPostPayload(post: GMBPost): any {
    const payload: any = {
      languageCode: 'en',
      summary: post.summary,
      topicType: this.mapPostTypeToTopic(post.type)
    };

    if (post.title) {
      payload.title = post.title;
    }

    if (post.mediaUrls && post.mediaUrls.length > 0) {
      payload.media = post.mediaUrls.map(url => ({
        mediaFormat: 'PHOTO',
        sourceUrl: url
      }));
    }

    if (post.callToAction) {
      payload.callToAction = {
        actionType: post.callToAction.actionType,
        url: post.callToAction.url
      };
    }

    if (post.type === 'EVENT' && post.event) {
      payload.event = {
        title: post.event.title,
        schedule: {
          startDate: post.event.startDate.toISOString().split('T')[0],
          endDate: post.event.endDate.toISOString().split('T')[0]
        }
      };
    }

    if (post.type === 'OFFER' && post.offer) {
      payload.offer = {
        couponCode: post.offer.couponCode,
        redeemOnlineUrl: post.offer.redeemOnlineUrl,
        termsConditions: post.offer.termsConditions
      };
    }

    return payload;
  }

  /**
   * Helper: Map post type to GMB topic type
   */
  private mapPostTypeToTopic(type: PostType): string {
    const mapping: Record<PostType, string> = {
      'STANDARD': 'STANDARD',
      'EVENT': 'EVENT',
      'OFFER': 'OFFER',
      'PRODUCT': 'PRODUCT',
      'COVID_UPDATE': 'COVID_19'
    };
    return mapping[type] || 'STANDARD';
  }

  /**
   * Helper: Update GMB post
   */
  private async updateGMBPost(post: GMBPost, updates: Partial<GMBPost>): Promise<void> {
    if (!post.gmbPostId) return;

    const business = await storage.getBusinessById(post.businessId);
    if (!business?.gmbAccountId || !business?.gmbLocationId) {
      throw new Error('Business GMB configuration not found');
    }

    await gmbErrorHandler.withRetry(async () => {
      const accessToken = await gmbService.getValidAccessToken(post.businessId);
      
      // Build update mask and payload
      const updateMask: string[] = [];
      const payload: any = {};
      
      if (updates.summary !== undefined) {
        updateMask.push('summary');
        payload.summary = updates.summary;
      }
      
      if (updates.callToAction !== undefined) {
        updateMask.push('call_to_action');
        payload.callToAction = updates.callToAction;
      }

      const response = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${post.gmbPostId}?updateMask=${updateMask.join(',')}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update GMB post: ${response.statusText}`);
      }
    }, { maxRetries: 2 }, { businessId: post.businessId, operation: 'update_post' });
  }

  /**
   * Helper: Get post by ID (mock implementation)
   */
  private async getPostById(postId: string): Promise<GMBPost | null> {
    // In a real implementation, this would query from database
    // For now, return a mock post
    return {
      id: postId,
      businessId: 'mock-business-id',
      type: 'STANDARD',
      status: 'DRAFT',
      summary: 'Mock post content',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Helper: Generate offer content
   */
  private generateOfferContent(businessName: string, topic: string, tone: string): string {
    const templates = {
      professional: `We're pleased to announce a special offer at ${businessName}. ${topic}. Visit us today to take advantage of this limited-time opportunity.`,
      casual: `Hey! Check out this awesome deal at ${businessName}! ${topic}. Don't miss out!`,
      friendly: `Great news from ${businessName}! ${topic}. We'd love to see you soon!`,
      urgent: `LIMITED TIME! ${businessName} presents: ${topic}. Act fast - this offer won't last long!`
    };
    return templates[tone as keyof typeof templates] || templates.professional;
  }

  /**
   * Helper: Generate event content
   */
  private generateEventContent(businessName: string, topic: string, tone: string): string {
    const templates = {
      professional: `${businessName} cordially invites you to ${topic}. We look forward to your attendance at this special event.`,
      casual: `Join us at ${businessName} for ${topic}! It's going to be great!`,
      friendly: `You're invited! ${businessName} is hosting ${topic}. We can't wait to see you there!`,
      urgent: `Don't miss out! ${businessName} presents ${topic}. RSVP now - limited spaces available!`
    };
    return templates[tone as keyof typeof templates] || templates.professional;
  }

  /**
   * Helper: Generate product content
   */
  private generateProductContent(businessName: string, topic: string, tone: string): string {
    const templates = {
      professional: `${businessName} is proud to introduce ${topic}. Experience quality and innovation in our latest offering.`,
      casual: `New at ${businessName}: ${topic}! Come check it out!`,
      friendly: `Exciting news! ${businessName} just launched ${topic}. We think you'll love it!`,
      urgent: `NOW AVAILABLE at ${businessName}: ${topic}. Get yours before they're gone!`
    };
    return templates[tone as keyof typeof templates] || templates.professional;
  }

  /**
   * Helper: Generate standard content
   */
  private generateStandardContent(businessName: string, topic: string, tone: string): string {
    const templates = {
      professional: `${businessName} update: ${topic}. Thank you for your continued support.`,
      casual: `Hey from ${businessName}! ${topic} Drop by when you can!`,
      friendly: `Hello from ${businessName}! ${topic} We appreciate your business!`,
      urgent: `Important update from ${businessName}: ${topic}. Please take note!`
    };
    return templates[tone as keyof typeof templates] || templates.professional;
  }
}

// Export singleton instance
export const gmbPostService = new GMBPostService();