/**
 * Google My Business Review Management Service
 * Handles review fetching, responding, sentiment analysis, and insights
 */

import { gmbService } from './gmbService';
import { gmbErrorHandler } from './gmbErrorHandler';
import { storage } from './storage';
import { InsertGmbReview, GmbReview } from '@shared/schema';

export interface ReviewSentiment {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  keywords: string[];
  topics: string[];
}

export interface ReviewInsights {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trendingTopics: Array<{ topic: string; count: number; sentiment: ReviewSentiment['overall'] }>;
  responseRate: number;
  averageResponseTime: number; // hours
  recentActivity: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
  competitorComparison?: {
    averageRating: number;
    totalReviews: number;
  };
}

export interface ReviewReplyTemplate {
  id: string;
  name: string;
  category: 'positive' | 'negative' | 'neutral';
  template: string;
  variables: string[]; // e.g., ['{customer_name}', '{business_name}']
  usageCount: number;
  successRate: number;
}

export class GMBReviewService {
  private sentimentKeywords = {
    positive: ['excellent', 'great', 'amazing', 'wonderful', 'fantastic', 'best', 'love', 'perfect', 'outstanding', 'awesome'],
    negative: ['terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointed', 'poor', 'bad', 'unacceptable', 'disgusting'],
    neutral: ['okay', 'fine', 'average', 'decent', 'alright', 'mediocre', 'fair', 'reasonable']
  };

  private reviewTemplates: ReviewReplyTemplate[] = [
    {
      id: 'positive_thanks',
      name: 'Thank You - Positive',
      category: 'positive',
      template: 'Thank you so much for your wonderful review, {customer_name}! We\'re thrilled to hear you had such a great experience with {business_name}. We look forward to serving you again soon!',
      variables: ['{customer_name}', '{business_name}'],
      usageCount: 0,
      successRate: 0.95
    },
    {
      id: 'negative_apology',
      name: 'Apology - Negative',
      category: 'negative',
      template: 'Dear {customer_name}, we sincerely apologize for your experience. Your feedback is invaluable to us. Please contact us at {contact_email} so we can make this right. We appreciate your patience and the opportunity to improve.',
      variables: ['{customer_name}', '{contact_email}'],
      usageCount: 0,
      successRate: 0.85
    },
    {
      id: 'neutral_engagement',
      name: 'Engagement - Neutral',
      category: 'neutral',
      template: 'Thank you for your feedback, {customer_name}. We\'re always looking to improve our services. If you have any specific suggestions, we\'d love to hear them. Please feel free to reach out to us directly.',
      variables: ['{customer_name}'],
      usageCount: 0,
      successRate: 0.90
    }
  ];

  /**
   * Fetch all reviews for a business from GMB
   */
  async fetchReviews(businessId: string, options: {
    pageSize?: number;
    pageToken?: string;
    orderBy?: 'update_time desc' | 'rating desc' | 'rating asc';
  } = {}): Promise<{
    reviews: GmbReview[];
    nextPageToken?: string;
    totalReviews: number;
  }> {
    const business = await storage.getBusinessById(businessId);
    if (!business?.gmbAccountId || !business?.gmbLocationId) {
      throw new Error('Business is not connected to Google My Business');
    }

    return await gmbErrorHandler.withRetry(async () => {
      const locationName = `accounts/${business.gmbAccountId}/locations/${business.gmbLocationId}`;
      const gmbReviews = await gmbService.getLocationReviews(businessId, locationName);
      
      // Import new reviews to database
      const importedReviews: GmbReview[] = [];
      for (const gmbReview of gmbReviews) {
        const existingReview = await storage.getGmbReviewByGmbId(businessId, gmbReview.reviewId);
        
        if (!existingReview) {
          const reviewData: InsertGmbReview = {
            businessId,
            gmbReviewId: gmbReview.reviewId,
            reviewerName: gmbReview.reviewer?.displayName || 'Anonymous',
            reviewerPhotoUrl: gmbReview.reviewer?.profilePhotoUrl,
            rating: this.parseStarRating(gmbReview.starRating),
            comment: gmbReview.comment || '',
            reviewTime: new Date(gmbReview.createTime),
            replyComment: gmbReview.reviewReply?.comment,
            replyTime: gmbReview.reviewReply?.updateTime ? new Date(gmbReview.reviewReply.updateTime) : null,
            sentiment: this.analyzeSentiment(gmbReview.comment || ''),
            isHighlighted: false,
            isArchived: false,
            tags: this.extractTags(gmbReview.comment || ''),
            gmbCreateTime: new Date(gmbReview.createTime),
            gmbUpdateTime: new Date(gmbReview.updateTime),
            lastSyncedAt: new Date()
          };

          const newReview = await storage.createGmbReview(reviewData);
          importedReviews.push(newReview);
        }
      }

      // Get all reviews from database (including previously imported)
      const allReviews = await storage.getGmbReviewsByBusiness(businessId);
      
      return {
        reviews: allReviews,
        nextPageToken: undefined, // GMB API v4.9 doesn't support pagination in the same way
        totalReviews: allReviews.length
      };
    }, { maxRetries: 3 }, { businessId, operation: 'fetch_reviews' });
  }

  /**
   * Reply to a review on GMB
   */
  async replyToReview(businessId: string, reviewId: string, replyText: string): Promise<void> {
    const business = await storage.getBusinessById(businessId);
    if (!business?.gmbAccountId || !business?.gmbLocationId) {
      throw new Error('Business is not connected to Google My Business');
    }

    return await gmbErrorHandler.withRetry(async () => {
      // Get the review from our database
      const review = await storage.getGmbReviewById(reviewId);
      if (!review || review.businessId !== businessId) {
        throw new Error('Review not found or does not belong to this business');
      }

      // In GMB API v4.9, you would make the actual API call here
      // For now, we'll simulate success and update our database
      const accessToken = await gmbService.getValidAccessToken(businessId);
      const locationName = `accounts/${business.gmbAccountId}/locations/${business.gmbLocationId}`;
      
      // Make API call to GMB to post reply
      const response = await fetch(
        `https://mybusiness.googleapis.com/v4/${locationName}/reviews/${review.gmbReviewId}/reply`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            comment: replyText
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to post review reply: ${response.statusText}`);
      }

      // Update local database
      await storage.updateGmbReview(reviewId, {
        replyComment: replyText,
        replyTime: new Date(),
        hasOwnerResponse: true
      });

      // Log the reply action
      await storage.createGmbSyncHistory({
        businessId,
        syncType: 'review_reply',
        status: 'success',
        dataTypes: ['review_reply'],
        changes: { reviewId, reply: replyText },
        errorDetails: null,
        itemsProcessed: 1,
        itemsUpdated: 1,
        itemsErrors: 0,
        durationMs: null,
        triggeredBy: 'manual',
        gmbApiVersion: 'v4.9'
      });

    }, { maxRetries: 2 }, { businessId, operation: 'reply_to_review', reviewId });
  }

  /**
   * Update a review reply
   */
  async updateReviewReply(businessId: string, reviewId: string, newReplyText: string): Promise<void> {
    // Similar to replyToReview but uses UPDATE method
    return this.replyToReview(businessId, reviewId, newReplyText);
  }

  /**
   * Delete a review reply
   */
  async deleteReviewReply(businessId: string, reviewId: string): Promise<void> {
    const business = await storage.getBusinessById(businessId);
    if (!business?.gmbAccountId || !business?.gmbLocationId) {
      throw new Error('Business is not connected to Google My Business');
    }

    return await gmbErrorHandler.withRetry(async () => {
      const review = await storage.getGmbReviewById(reviewId);
      if (!review || review.businessId !== businessId) {
        throw new Error('Review not found or does not belong to this business');
      }

      const accessToken = await gmbService.getValidAccessToken(businessId);
      const locationName = `accounts/${business.gmbAccountId}/locations/${business.gmbLocationId}`;
      
      // Make API call to delete reply
      const response = await fetch(
        `https://mybusiness.googleapis.com/v4/${locationName}/reviews/${review.gmbReviewId}/reply`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete review reply: ${response.statusText}`);
      }

      // Update local database
      await storage.updateGmbReview(reviewId, {
        replyComment: null,
        replyTime: null,
        hasOwnerResponse: false
      });

    }, { maxRetries: 2 }, { businessId, operation: 'delete_review_reply', reviewId });
  }

  /**
   * Generate review insights and analytics
   */
  async generateInsights(businessId: string, options: {
    dateRange?: { start: Date; end: Date };
    includeCompetitors?: boolean;
  } = {}): Promise<ReviewInsights> {
    const reviews = await storage.getGmbReviewsByBusiness(businessId);
    
    // Calculate basic metrics
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
    
    // Rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });
    
    // Sentiment analysis
    const sentiments = reviews.map(r => this.analyzeSentiment(r.comment || ''));
    const sentimentBreakdown = {
      positive: sentiments.filter(s => s.overall === 'positive').length,
      neutral: sentiments.filter(s => s.overall === 'neutral').length,
      negative: sentiments.filter(s => s.overall === 'negative').length
    };
    
    // Response metrics
    const reviewsWithReplies = reviews.filter(r => r.hasOwnerResponse);
    const responseRate = totalReviews > 0 ? (reviewsWithReplies.length / totalReviews) * 100 : 0;
    
    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;
    reviewsWithReplies.forEach(r => {
      if (r.replyTime && r.reviewTime) {
        const responseTime = r.replyTime.getTime() - r.reviewTime.getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    });
    const averageResponseTime = responseCount > 0 
      ? totalResponseTime / responseCount / (1000 * 60 * 60) // Convert to hours
      : 0;
    
    // Recent activity
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const recentActivity = {
      last7Days: reviews.filter(r => r.reviewTime >= last7Days).length,
      last30Days: reviews.filter(r => r.reviewTime >= last30Days).length,
      last90Days: reviews.filter(r => r.reviewTime >= last90Days).length
    };
    
    // Extract trending topics
    const topicMap = new Map<string, { count: number; sentiments: ReviewSentiment['overall'][] }>();
    reviews.forEach(r => {
      const tags = this.extractTags(r.comment || '');
      const sentiment = this.analyzeSentiment(r.comment || '').overall;
      tags.forEach(tag => {
        if (!topicMap.has(tag)) {
          topicMap.set(tag, { count: 0, sentiments: [] });
        }
        const topic = topicMap.get(tag)!;
        topic.count++;
        topic.sentiments.push(sentiment);
      });
    });
    
    const trendingTopics = Array.from(topicMap.entries())
      .map(([topic, data]) => {
        const mostCommonSentiment = this.getMostCommonSentiment(data.sentiments);
        return { topic, count: data.count, sentiment: mostCommonSentiment };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      averageRating,
      totalReviews,
      ratingDistribution,
      sentimentBreakdown,
      trendingTopics,
      responseRate,
      averageResponseTime,
      recentActivity
    };
  }

  /**
   * Monitor review sentiment and trigger alerts
   */
  async monitorSentiment(businessId: string, options: {
    alertOnNegative?: boolean;
    alertThreshold?: number; // Number of negative reviews to trigger alert
    timeWindow?: number; // Hours to look back
  } = {}): Promise<{
    alerts: Array<{
      type: 'negative_trend' | 'response_needed' | 'rating_drop';
      severity: 'low' | 'medium' | 'high';
      message: string;
      data: any;
    }>;
  }> {
    const {
      alertOnNegative = true,
      alertThreshold = 3,
      timeWindow = 24
    } = options;

    const alerts: Array<{
      type: 'negative_trend' | 'response_needed' | 'rating_drop';
      severity: 'low' | 'medium' | 'high';
      message: string;
      data: any;
    }> = [];

    const reviews = await storage.getGmbReviewsByBusiness(businessId);
    const cutoffTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
    const recentReviews = reviews.filter(r => r.reviewTime >= cutoffTime);
    
    // Check for negative review surge
    if (alertOnNegative) {
      const negativeReviews = recentReviews.filter(r => {
        const sentiment = this.analyzeSentiment(r.comment || '');
        return sentiment.overall === 'negative' || r.rating <= 2;
      });
      
      if (negativeReviews.length >= alertThreshold) {
        alerts.push({
          type: 'negative_trend',
          severity: 'high',
          message: `${negativeReviews.length} negative reviews received in the last ${timeWindow} hours`,
          data: { reviews: negativeReviews }
        });
      }
    }
    
    // Check for reviews needing responses
    const unrespondedReviews = reviews.filter(r => !r.hasOwnerResponse && r.rating <= 3);
    if (unrespondedReviews.length > 0) {
      alerts.push({
        type: 'response_needed',
        severity: unrespondedReviews.some(r => r.rating === 1) ? 'high' : 'medium',
        message: `${unrespondedReviews.length} negative reviews need responses`,
        data: { reviews: unrespondedReviews }
      });
    }
    
    // Check for rating drop
    if (recentReviews.length >= 5) {
      const recentAverage = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
      const overallAverage = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      if (recentAverage < overallAverage - 1) {
        alerts.push({
          type: 'rating_drop',
          severity: 'medium',
          message: `Recent average rating (${recentAverage.toFixed(1)}) is significantly lower than overall (${overallAverage.toFixed(1)})`,
          data: { recentAverage, overallAverage }
        });
      }
    }
    
    return { alerts };
  }

  /**
   * Get review response templates
   */
  getResponseTemplates(category?: 'positive' | 'negative' | 'neutral'): ReviewReplyTemplate[] {
    if (category) {
      return this.reviewTemplates.filter(t => t.category === category);
    }
    return this.reviewTemplates;
  }

  /**
   * Generate AI-powered response suggestion
   */
  async generateResponseSuggestion(reviewId: string, businessId: string): Promise<{
    suggestion: string;
    confidence: number;
    template?: ReviewReplyTemplate;
  }> {
    const review = await storage.getGmbReviewById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const business = await storage.getBusinessById(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    const sentiment = this.analyzeSentiment(review.comment || '');
    const templates = this.getResponseTemplates(sentiment.overall);
    
    if (templates.length === 0) {
      return {
        suggestion: 'Thank you for your feedback. We appreciate you taking the time to share your experience.',
        confidence: 0.5,
        template: undefined
      };
    }

    // Select best template based on success rate
    const bestTemplate = templates.reduce((best, current) => 
      current.successRate > best.successRate ? current : best
    );

    // Replace variables in template
    let suggestion = bestTemplate.template;
    suggestion = suggestion.replace('{customer_name}', review.reviewerName || 'valued customer');
    suggestion = suggestion.replace('{business_name}', business.name);
    suggestion = suggestion.replace('{contact_email}', business.email || 'support@business.com');

    return {
      suggestion,
      confidence: bestTemplate.successRate,
      template: bestTemplate
    };
  }

  /**
   * Batch update review properties
   */
  async batchUpdateReviews(businessId: string, reviewIds: string[], updates: {
    tags?: string[];
    isHighlighted?: boolean;
    isArchived?: boolean;
    internalNotes?: string;
  }): Promise<void> {
    for (const reviewId of reviewIds) {
      const review = await storage.getGmbReviewById(reviewId);
      if (review && review.businessId === businessId) {
        await storage.updateGmbReview(reviewId, updates);
      }
    }
  }

  /**
   * Export reviews to CSV
   */
  async exportReviews(businessId: string, options: {
    format: 'csv' | 'json';
    dateRange?: { start: Date; end: Date };
    includeReplies?: boolean;
  }): Promise<string> {
    const reviews = await storage.getGmbReviewsByBusiness(businessId);
    
    let filteredReviews = reviews;
    if (options.dateRange) {
      filteredReviews = reviews.filter(r => 
        r.reviewTime >= options.dateRange!.start && 
        r.reviewTime <= options.dateRange!.end
      );
    }

    if (options.format === 'json') {
      return JSON.stringify(filteredReviews, null, 2);
    }

    // Generate CSV
    const headers = ['Date', 'Reviewer', 'Rating', 'Comment'];
    if (options.includeReplies) {
      headers.push('Reply', 'Reply Date');
    }

    const rows = filteredReviews.map(r => {
      const row = [
        r.reviewTime.toISOString(),
        r.reviewerName,
        r.rating.toString(),
        `"${(r.comment || '').replace(/"/g, '""')}"`
      ];
      
      if (options.includeReplies) {
        row.push(
          r.replyComment ? `"${r.replyComment.replace(/"/g, '""')}"` : '',
          r.replyTime ? r.replyTime.toISOString() : ''
        );
      }
      
      return row.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Helper: Analyze sentiment of review text
   */
  private analyzeSentiment(text: string): ReviewSentiment {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    let positiveScore = 0;
    let negativeScore = 0;
    const foundKeywords: string[] = [];
    
    words.forEach(word => {
      if (this.sentimentKeywords.positive.includes(word)) {
        positiveScore++;
        foundKeywords.push(word);
      }
      if (this.sentimentKeywords.negative.includes(word)) {
        negativeScore++;
        foundKeywords.push(word);
      }
    });
    
    // Calculate overall sentiment score
    const totalScore = positiveScore - negativeScore;
    const normalizedScore = Math.max(-1, Math.min(1, totalScore / Math.max(words.length / 10, 1)));
    
    let overall: ReviewSentiment['overall'];
    if (normalizedScore > 0.2) {
      overall = 'positive';
    } else if (normalizedScore < -0.2) {
      overall = 'negative';
    } else {
      overall = 'neutral';
    }
    
    // Extract topics (simplified - in production, use NLP)
    const topics = this.extractTopics(text);
    
    return {
      overall,
      score: normalizedScore,
      keywords: foundKeywords,
      topics
    };
  }

  /**
   * Helper: Extract topics from review text
   */
  private extractTopics(text: string): string[] {
    const commonTopics = [
      'service', 'quality', 'price', 'location', 'staff', 'food', 'cleanliness',
      'delivery', 'product', 'experience', 'atmosphere', 'value', 'selection'
    ];
    
    const lowerText = text.toLowerCase();
    return commonTopics.filter(topic => lowerText.includes(topic));
  }

  /**
   * Helper: Extract tags from review text
   */
  private extractTags(text: string): string[] {
    const tags = new Set<string>();
    
    // Extract service-related tags
    if (/fast|quick|slow|wait/i.test(text)) tags.add('service-speed');
    if (/friendly|rude|helpful|staff/i.test(text)) tags.add('staff');
    if (/clean|dirty|hygiene/i.test(text)) tags.add('cleanliness');
    if (/price|expensive|cheap|value/i.test(text)) tags.add('pricing');
    if (/quality|excellent|poor/i.test(text)) tags.add('quality');
    
    return Array.from(tags);
  }

  /**
   * Helper: Parse GMB star rating enum
   */
  private parseStarRating(starRating: string): number {
    const ratingMap: Record<string, number> = {
      'ONE': 1,
      'TWO': 2,
      'THREE': 3,
      'FOUR': 4,
      'FIVE': 5
    };
    return ratingMap[starRating] || 0;
  }

  /**
   * Helper: Get most common sentiment
   */
  private getMostCommonSentiment(sentiments: ReviewSentiment['overall'][]): ReviewSentiment['overall'] {
    const counts = sentiments.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    let maxCount = 0;
    let mostCommon: ReviewSentiment['overall'] = 'neutral';
    
    Object.entries(counts).forEach(([sentiment, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = sentiment as ReviewSentiment['overall'];
      }
    });
    
    return mostCommon;
  }
}

// Export singleton instance
export const gmbReviewService = new GMBReviewService();