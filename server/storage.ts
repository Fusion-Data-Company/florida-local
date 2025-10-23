import {
  users,
  businesses,
  products,
  posts,
  postLikes,
  postComments,
  businessFollowers,
  spotlights,
  spotlightHistory,
  engagementMetrics,
  spotlightVotes,
  messages,
  cartItems,
  orders,
  orderItems,
  payments,
  gmbTokens,
  gmbSyncHistory,
  gmbReviews,
  apiKeys,
  // Blog tables
  blogPosts,
  blogCategories,
  blogTags,
  blogPostTags,
  blogComments,
  blogReactions,
  blogBookmarks,
  blogReadingLists,
  blogSubscriptions,
  blogAnalytics,
  blogRevisions,
  // Social Media tables
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
  type User,
  type UpsertUser,
  type Business,
  type InsertBusiness,
  type UpdateBusiness,
  type Product,
  type InsertProduct,
  type Post,
  type InsertPost,
  type Message,
  type InsertMessage,
  type Spotlight,
  type SpotlightHistory,
  type InsertSpotlightHistory,
  type EngagementMetrics,
  type InsertEngagementMetrics,
  type SpotlightVote,
  type InsertSpotlightVote,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Payment,
  type InsertPayment,
  type GmbToken,
  type InsertGmbToken,
  type GmbSyncHistory,
  type InsertGmbSyncHistory,
  type GmbReview,
  type InsertGmbReview,
  type ApiKey,
  type InsertApiKey,
  // AI Content types
  aiGeneratedContent,
  aiContentTemplates,
  aiGeneratedImages,
  aiUsageTracking,
  aiContentTests,
  aiModerationLog,
  type AIGeneratedContent,
  type InsertAIGeneratedContent,
  type AIContentTemplate,
  type InsertAIContentTemplate,
  type AIGeneratedImage,
  type InsertAIGeneratedImage,
  type AIUsageTracking,
  type InsertAIUsageTracking,
  type AIContentTest,
  type InsertAIContentTest,
  type AIModerationLog,
  type InsertAIModerationLog,
  // Blog types
  type BlogPost,
  type InsertBlogPost,
  type UpdateBlogPost,
  type BlogCategory,
  type InsertBlogCategory,
  type BlogTag,
  type InsertBlogTag,
  type BlogComment,
  type InsertBlogComment,
  type UpdateBlogComment,
  type BlogReaction,
  type InsertBlogReaction,
  type BlogBookmark,
  type InsertBlogBookmark,
  type BlogSubscription,
  type InsertBlogSubscription,
  type BlogAnalytics,
  type InsertBlogAnalytics,
  // Social Media types
  type SocialMediaAccount,
  type InsertSocialMediaAccount,
  type UpdateSocialMediaAccount,
  type SocialMediaPost,
  type InsertSocialMediaPost,
  type UpdateSocialMediaPost,
  type SocialMediaAnalytics,
  type InsertSocialMediaAnalytics,
  type SocialMediaMessage,
  type InsertSocialMediaMessage,
  type UpdateSocialMediaMessage,
  type SocialMediaCampaign,
  type InsertSocialMediaCampaign,
  type UpdateSocialMediaCampaign,
  type SocialContentCategory,
  type InsertSocialContentCategory,
  type SocialResponseTemplate,
  type InsertSocialResponseTemplate,
  type SocialMediaListener,
  type InsertSocialMediaListener,
  type SocialMediaMention,
  type InsertSocialMediaMention,
  type SocialMediaAutomation,
  type InsertSocialMediaAutomation,
  type SocialMediaTeam,
  type InsertSocialMediaTeam,
  type UpdateSocialMediaTeam,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, like, inArray } from "drizzle-orm";

export interface IStorage {
  getUserById(userId: string): Promise<User | null>;
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserAdminStatus(id: string, isAdmin: boolean): Promise<void>;
  updateUserOnlineStatus(userId: string, status: "online" | "away" | "offline"): Promise<void>;
  getUserConnections(userId: string): Promise<string[]>;
  userHasAccessToConversation(userId: string, conversationId: string): Promise<boolean>;
  
  // AI & Analytics operations
  getUserFollowedBusinesses(userId: string): Promise<any[]>;
  getUserLikedPosts(userId: string): Promise<any[]>;
  getUserPurchaseHistory(userId: string): Promise<any[]>;
  getBusinessMetrics(businessId: string): Promise<any>;
  getOrderItemsWithProducts(orderId: string): Promise<any[]>;
  updateOrderInvoiceNumber(orderId: string, invoiceNumber: string): Promise<void>;
  
  // Business operations
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, business: UpdateBusiness): Promise<Business>;
  deleteBusiness(id: string): Promise<void>;
  getBusinessById(id: string): Promise<Business | undefined>;
  getBusinesses(page?: number, limit?: number, category?: string): Promise<Business[]>;
  getFeaturedBusinesses(limit?: number): Promise<Business[]>;
  getBusinessesByOwner(ownerId: string): Promise<Business[]>;
  searchBusinesses(query: string, category?: string): Promise<Business[]>;
  getSpotlightBusinesses(type: 'daily' | 'weekly' | 'monthly'): Promise<Business[]>;
  followBusiness(userId: string, businessId: string): Promise<void>;
  unfollowBusiness(userId: string, businessId: string): Promise<void>;
  isFollowingBusiness(userId: string, businessId: string): Promise<boolean>;
  
  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  updateProductImages(productId: string, images: string[]): Promise<Product>;
  getProductById(id: string): Promise<Product | undefined>;
  getProducts(page?: number, limit?: number, category?: string): Promise<Product[]>;
  getProductsByBusiness(businessId: string): Promise<Product[]>;
  searchProducts(query: string, options?: {
    categories?: string[];
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    isDigital?: boolean;
    minRating?: number;
    tags?: string[];
    sort?: 'rating_desc' | 'price_asc' | 'price_desc' | 'newest' | 'popular';
    page?: number;
    pageSize?: number;
    includeTotal?: boolean;
  }): Promise<{ items: Product[]; total: number }>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  
  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getPostById(id: string): Promise<Post | undefined>;
  getRecentPosts(limit?: number): Promise<Post[]>;
  getPostsByBusiness(businessId: string): Promise<Post[]>;
  likePost(userId: string, postId: string): Promise<void>;
  unlikePost(userId: string, postId: string): Promise<void>;
  isPostLiked(userId: string, postId: string): Promise<boolean>;
  
  // Enhanced Message operations with file sharing and business networking
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]>;
  getConversations(userId: string): Promise<any[]>;
  getConversationMessages(conversationId: string, offset?: number, limit?: number): Promise<Message[]>;
  markMessageAsRead(messageId: string, readAt?: Date): Promise<void>;
  markMessagesAsDelivered(messageIds: string[], deliveredAt?: Date): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;
  getLatestMessageInConversation(conversationId: string): Promise<Message | undefined>;
  searchMessages(userId: string, query: string): Promise<Message[]>;
  deleteMessage(messageId: string, userId: string): Promise<void>;
  getMessageById(messageId: string): Promise<Message | undefined>;
  
  // Spotlight operations
  getCurrentSpotlights(): Promise<{ daily: Business[], weekly: Business[], monthly: Business[] }>;
  
  // Enhanced spotlight operations with algorithms
  calculateEngagementMetrics(businessId: string): Promise<EngagementMetrics>;
  updateEngagementMetrics(businessId: string, metrics: Partial<InsertEngagementMetrics>): Promise<EngagementMetrics>;
  getEngagementMetrics(businessId: string): Promise<EngagementMetrics | undefined>;
  getAllEngagementMetrics(): Promise<EngagementMetrics[]>;
  
  // Spotlight history tracking
  createSpotlightHistory(history: InsertSpotlightHistory): Promise<SpotlightHistory>;
  getSpotlightHistory(businessId: string): Promise<SpotlightHistory[]>;
  getRecentSpotlightHistory(type: 'daily' | 'weekly' | 'monthly', days: number): Promise<SpotlightHistory[]>;
  
  // Intelligent spotlight selection algorithms
  selectDailySpotlights(): Promise<Business[]>;
  selectWeeklySpotlights(): Promise<Business[]>;
  selectMonthlySpotlight(): Promise<Business[]>;
  getBusinessScore(businessId: string): Promise<number>;
  getEligibleBusinesses(type: 'daily' | 'weekly' | 'monthly'): Promise<Business[]>;
  
  // Spotlight voting (for monthly spotlight)
  createSpotlightVote(vote: InsertSpotlightVote): Promise<SpotlightVote>;
  getSpotlightVotes(businessId: string, month: string): Promise<SpotlightVote[]>;
  getMonthlyVoteCounts(month: string): Promise<Array<{ businessId: string, voteCount: number }>>;
  hasUserVoted(userId: string, month: string): Promise<boolean>;
  getUserVoteForMonth(userId: string, month: string): Promise<SpotlightVote | undefined>;
  getEligibleForVoting(limit?: number): Promise<any[]>;
  getVotingStats(month: string): Promise<any>;
  getUserVotes(userId: string, month: string): Promise<SpotlightVote[]>;
  
  // Rotation management
  rotateSpotlights(): Promise<void>;
  canPerformManualRotation(): Promise<{ canRotate: boolean; reason?: string }>;
  archiveExpiredSpotlights(): Promise<void>;

  // Community Leaderboards
  getTopBusinesses(limit?: number): Promise<any[]>;
  getTopVoters(limit?: number): Promise<any[]>;
  getTopReviewers(limit?: number): Promise<any[]>;
  getTopBuyers(limit?: number): Promise<any[]>;
  getTrendingBusinesses(limit?: number): Promise<any[]>;
  
  // Cart operations
  addToCart(userId: string, productId: string, quantity: number): Promise<CartItem>;
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  updateCartItemQuantity(userId: string, productId: string, quantity: number): Promise<void>;
  removeFromCart(userId: string, productId: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
  getCartTotal(userId: string): Promise<number>;
  
  // Order operations
  createOrder(orderData: InsertOrder): Promise<Order>;
  createOrderItems(orderItems: InsertOrderItem[]): Promise<OrderItem[]>;
  getOrderById(orderId: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  updateOrderStatus(orderId: string, status: string): Promise<void>;
  
  // Payment operations
  createPayment(paymentData: InsertPayment): Promise<Payment>;
  updatePaymentStatus(paymentId: string, status: string, paidAt?: Date, failureReason?: string): Promise<void>;
  getPaymentByStripeId(stripePaymentIntentId: string): Promise<Payment | undefined>;

  // GMB Token operations
  createGmbToken(tokenData: InsertGmbToken): Promise<GmbToken>;
  getGmbToken(businessId: string): Promise<GmbToken | undefined>;
  updateGmbToken(businessId: string, tokenData: Partial<GmbToken>): Promise<void>;
  deactivateGmbToken(businessId: string): Promise<void>;

  // GMB Sync History operations
  createGmbSyncHistory(syncData: InsertGmbSyncHistory): Promise<GmbSyncHistory>;
  getGmbSyncHistory(businessId: string): Promise<GmbSyncHistory[]>;
  getRecentGmbSyncHistory(businessId: string, limit: number): Promise<GmbSyncHistory[]>;

  // GMB Review operations
  createGmbReview(reviewData: InsertGmbReview): Promise<GmbReview>;
  getGmbReviewByGmbId(businessId: string, gmbReviewId: string): Promise<GmbReview | undefined>;
  updateGmbReview(reviewId: string, updates: Partial<GmbReview>): Promise<void>;
  getGmbReviewsByBusiness(businessId: string): Promise<GmbReview[]>;

  // Business GMB Status operations
  updateBusinessGmbStatus(businessId: string, updates: {
    gmbVerified?: boolean;
    gmbConnected?: boolean;
    gmbAccountId?: string | null;
    gmbLocationId?: string | null;
    gmbSyncStatus?: string;
    gmbLastSyncAt?: Date | null;
    gmbLastErrorAt?: Date | null;
    gmbLastError?: string | null;
    gmbDataSources?: any;
  }): Promise<void>;

  // Stripe Connect operations
  updateBusinessStripeFields(businessId: string, fields: {
    stripeAccountId?: string;
    stripeOnboardingComplete?: boolean;
    stripePayoutsEnabled?: boolean;
  }): Promise<void>;

  // GMB Integration Statistics
  getGMBIntegrationStats(): Promise<{
    totalConnectedBusinesses: number;
    totalVerifiedBusinesses: number;
    totalSyncOperations: number;
    recentSyncActivity: any[];
    errorRates: any;
  }>;

  // API Key operations
  createApiKey(apiKeyData: InsertApiKey): Promise<ApiKey>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  updateApiKeyLastUsed(keyId: string): Promise<void>;

  // AI Content Generation operations
  createGeneratedContent(content: InsertAIGeneratedContent): Promise<AIGeneratedContent>;
  getGeneratedContent(contentId: string): Promise<AIGeneratedContent | undefined>;
  getGeneratedContentHistory(businessId: string, options?: {
    type?: string;
    platform?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<AIGeneratedContent[]>;
  updateGeneratedContent(contentId: string, updates: Partial<AIGeneratedContent>): Promise<void>;
  markContentAsFavorite(contentId: string, isFavorite: boolean): Promise<void>;
  deleteGeneratedContent(contentId: string): Promise<void>;

  // AI Content Template operations
  createContentTemplate(template: InsertAIContentTemplate): Promise<AIContentTemplate>;
  getContentTemplate(templateId: string): Promise<AIContentTemplate | undefined>;
  getContentTemplates(businessId?: string, options?: {
    type?: string;
    category?: string;
    isGlobal?: boolean;
    isActive?: boolean;
  }): Promise<AIContentTemplate[]>;
  updateContentTemplate(templateId: string, updates: Partial<AIContentTemplate>): Promise<void>;
  deleteContentTemplate(templateId: string): Promise<void>;

  // AI Generated Image operations
  createGeneratedImage(image: InsertAIGeneratedImage): Promise<AIGeneratedImage>;
  getGeneratedImage(imageId: string): Promise<AIGeneratedImage | undefined>;
  getGeneratedImages(businessId: string, options?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<AIGeneratedImage[]>;
  updateGeneratedImage(imageId: string, updates: Partial<AIGeneratedImage>): Promise<void>;
  deleteGeneratedImage(imageId: string): Promise<void>;

  // AI Usage Tracking operations
  trackAIUsage(usage: InsertAIUsageTracking): Promise<void>;
  getAIUsageByBusiness(businessId: string, billingPeriod?: string): Promise<AIUsageTracking[]>;
  getAIUsageSummary(businessId: string): Promise<{
    totalTokens: number;
    totalCost: number;
    byModel: Record<string, { tokens: number; cost: number }>;
    byType: Record<string, { count: number; cost: number }>;
  }>;

  // AI Content A/B Testing operations
  createContentTest(test: InsertAIContentTest): Promise<AIContentTest>;
  getContentTest(testId: string): Promise<AIContentTest | undefined>;
  getContentTests(businessId: string, status?: string): Promise<AIContentTest[]>;
  updateContentTest(testId: string, updates: Partial<AIContentTest>): Promise<void>;

  // AI Moderation operations
  logModeration(moderation: InsertAIModerationLog): Promise<void>;
  getModerationHistory(businessId: string): Promise<AIModerationLog[]>;

  // Social Media Hub Operations
  // Account Management
  createSocialMediaAccount(data: InsertSocialMediaAccount): Promise<SocialMediaAccount>;
  updateSocialMediaAccount(id: string, data: UpdateSocialMediaAccount): Promise<SocialMediaAccount | null>;
  getSocialMediaAccounts(businessId: string): Promise<SocialMediaAccount[]>;
  getSocialMediaAccountById(id: string): Promise<SocialMediaAccount | null>;
  deleteSocialMediaAccount(id: string): Promise<void>;

  // Post Management
  createSocialMediaPost(data: InsertSocialMediaPost): Promise<SocialMediaPost>;
  updateSocialMediaPost(id: string, data: UpdateSocialMediaPost): Promise<SocialMediaPost | null>;
  getSocialMediaPosts(businessId: string, filters?: {
    status?: string;
    platform?: string;
    campaignId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<SocialMediaPost[]>;
  getSocialMediaPostById(id: string): Promise<SocialMediaPost | null>;
  deleteSocialMediaPost(id: string): Promise<void>;

  // Analytics
  createSocialMediaAnalytics(data: InsertSocialMediaAnalytics): Promise<SocialMediaAnalytics>;
  getSocialMediaAnalytics(businessId: string, filters?: {
    platform?: string;
    dateRange?: { start: Date; end: Date };
    metricType?: string;
  }): Promise<SocialMediaAnalytics[]>;

  // Messages & Inbox
  createSocialMediaMessage(data: InsertSocialMediaMessage): Promise<SocialMediaMessage>;
  updateSocialMediaMessage(id: string, data: UpdateSocialMediaMessage): Promise<SocialMediaMessage | null>;
  getSocialMediaMessages(businessId: string, filters?: {
    platform?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
  }): Promise<SocialMediaMessage[]>;
  getSocialMediaMessageById(id: string): Promise<SocialMediaMessage | null>;

  // Campaigns
  createSocialMediaCampaign(data: InsertSocialMediaCampaign): Promise<SocialMediaCampaign>;
  updateSocialMediaCampaign(id: string, data: UpdateSocialMediaCampaign): Promise<SocialMediaCampaign | null>;
  getSocialMediaCampaigns(businessId: string): Promise<SocialMediaCampaign[]>;
  getSocialMediaCampaignById(id: string): Promise<SocialMediaCampaign | null>;
  deleteSocialMediaCampaign(id: string): Promise<void>;

  // Response Templates
  createSocialResponseTemplate(data: InsertSocialResponseTemplate): Promise<SocialResponseTemplate>;
  getSocialResponseTemplates(businessId: string): Promise<SocialResponseTemplate[]>;
  deleteSocialResponseTemplate(id: string): Promise<void>;

  // Social Listening
  createSocialMediaListener(data: InsertSocialMediaListener): Promise<SocialMediaListener>;
  getSocialMediaListeners(businessId: string): Promise<SocialMediaListener[]>;
  createSocialMediaMention(data: InsertSocialMediaMention): Promise<SocialMediaMention>;
  getSocialMediaMentions(businessId: string): Promise<SocialMediaMention[]>;

  // Automation
  createSocialMediaAutomation(data: InsertSocialMediaAutomation): Promise<SocialMediaAutomation>;
  getSocialMediaAutomations(businessId: string): Promise<SocialMediaAutomation[]>;
  updateSocialMediaAutomation(id: string, data: Partial<InsertSocialMediaAutomation>): Promise<SocialMediaAutomation | null>;

  // Team Management  
  createSocialMediaTeamMember(data: InsertSocialMediaTeam): Promise<SocialMediaTeam>;
  updateSocialMediaTeamMember(id: string, data: UpdateSocialMediaTeam): Promise<SocialMediaTeam | null>;
  getSocialMediaTeamMembers(businessId: string): Promise<SocialMediaTeam[]>;
  removeSocialMediaTeamMember(id: string): Promise<void>;

  // Content Categories
  createSocialContentCategory(data: InsertSocialContentCategory): Promise<SocialContentCategory>;
  getSocialContentCategories(businessId: string): Promise<SocialContentCategory[]>;
  deleteSocialContentCategory(id: string): Promise<void>;

  // ====== BLOG OPERATIONS ======
  // Blog Post operations
  createBlogPost(data: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, data: UpdateBlogPost): Promise<BlogPost>;
  deleteBlogPost(id: string): Promise<void>;
  getBlogPostById(id: string): Promise<BlogPost | null>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | null>;
  searchBlogPosts(params: {
    query?: string;
    categoryId?: string;
    tags?: string[];
    authorId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    sort?: 'newest' | 'popular' | 'trending';
    page?: number;
    limit?: number;
  }): Promise<{ posts: BlogPost[]; pagination: any }>;
  getRelatedBlogPosts(postId: string, limit?: number): Promise<BlogPost[]>;
  getPopularBlogPosts(limit?: number, period?: number): Promise<BlogPost[]>;
  getFeaturedBlogPosts(limit?: number): Promise<BlogPost[]>;
  getRecentBlogPosts(limit?: number): Promise<BlogPost[]>;
  getBlogPostsByAuthor(authorId: string): Promise<BlogPost[]>;
  getBlogPostsByCategory(categoryId: string): Promise<BlogPost[]>;
  getBlogPostsByTag(tagId: string): Promise<BlogPost[]>;
  
  // Blog Category operations
  createBlogCategory(data: InsertBlogCategory): Promise<BlogCategory>;
  updateBlogCategory(id: string, data: Partial<InsertBlogCategory>): Promise<BlogCategory>;
  deleteBlogCategory(id: string): Promise<void>;
  getBlogCategories(): Promise<BlogCategory[]>;
  getBlogCategoryById(id: string): Promise<BlogCategory | null>;
  getBlogCategoryBySlug(slug: string): Promise<BlogCategory | null>;
  
  // Blog Tag operations
  createBlogTag(data: InsertBlogTag): Promise<BlogTag>;
  updateBlogTag(id: string, data: Partial<InsertBlogTag>): Promise<BlogTag>;
  deleteBlogTag(id: string): Promise<void>;
  getBlogTags(): Promise<BlogTag[]>;
  getBlogTagById(id: string): Promise<BlogTag | null>;
  getBlogTagBySlug(slug: string): Promise<BlogTag | null>;
  attachTagsToPost(postId: string, tagIds: string[]): Promise<void>;
  detachTagsFromPost(postId: string, tagIds: string[]): Promise<void>;
  getPostTags(postId: string): Promise<BlogTag[]>;
  
  // Blog Comment operations
  createBlogComment(data: InsertBlogComment): Promise<BlogComment>;
  updateBlogComment(id: string, data: UpdateBlogComment): Promise<BlogComment>;
  deleteBlogComment(id: string): Promise<void>;
  getBlogCommentById(id: string): Promise<BlogComment | null>;
  getBlogComments(postId: string, options?: {
    parentId?: string | null;
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'oldest' | 'popular';
  }): Promise<BlogComment[]>;
  moderateBlogComment(id: string, approved: boolean): Promise<void>;
  flagBlogComment(id: string): Promise<void>;
  likeBlogComment(commentId: string, userId: string): Promise<void>;
  unlikeBlogComment(commentId: string, userId: string): Promise<void>;
  
  // Blog Reaction operations
  addBlogReaction(data: InsertBlogReaction): Promise<BlogReaction>;
  removeBlogReaction(postId: string, userId: string, reactionType?: string): Promise<void>;
  getBlogReactions(postId: string): Promise<BlogReaction[]>;
  getUserBlogReaction(postId: string, userId: string): Promise<BlogReaction | null>;
  
  // Blog Bookmark operations
  bookmarkBlogPost(data: InsertBlogBookmark): Promise<BlogBookmark>;
  removeBookmark(postId: string, userId: string): Promise<void>;
  getUserBookmarks(userId: string): Promise<BlogBookmark[]>;
  isPostBookmarked(postId: string, userId: string): Promise<boolean>;
  
  // Blog Subscription operations
  subscribeToBlog(data: InsertBlogSubscription): Promise<BlogSubscription>;
  unsubscribeFromBlog(token: string): Promise<void>;
  getBlogSubscribers(options?: {
    categories?: string[];
    frequency?: string;
    active?: boolean;
  }): Promise<BlogSubscription[]>;
  updateSubscriptionPreferences(id: string, preferences: Partial<InsertBlogSubscription>): Promise<void>;
  confirmSubscription(token: string): Promise<void>;
  
  // Blog Analytics operations
  trackBlogView(postId: string, data?: Partial<InsertBlogAnalytics>): Promise<void>;
  trackBlogEngagement(postId: string, type: string, data?: any): Promise<void>;
  getBlogPostAnalytics(postId: string, period?: { start: Date; end: Date }): Promise<any>;
  getBlogOverallAnalytics(period?: { start: Date; end: Date }): Promise<any>;
  getTopPerformingPosts(limit?: number): Promise<BlogPost[]>;
  
  // Blog Revision operations
  createBlogRevision(postId: string, data: any, changesSummary?: string): Promise<void>;
  getBlogRevisions(postId: string): Promise<any[]>;
  restoreBlogRevision(postId: string, revisionId: string): Promise<BlogPost>;
  compareBlogRevisions(revisionId1: string, revisionId2: string): Promise<any>;
  
  // Blog SEO operations
  generateBlogSlug(title: string): Promise<string>;
  analyzeBlogSEO(post: BlogPost): Promise<any>;
  generateBlogStructuredData(post: BlogPost, author: any, siteInfo: any): Promise<any>;
  generateBlogOpenGraphTags(post: BlogPost, siteInfo: any): Promise<Record<string, string>>;
  generateBlogTwitterCardTags(post: BlogPost): Promise<Record<string, string>>;
  generateBlogSitemap(baseUrl: string): Promise<string>;
  generateBlogRSSFeed(baseUrl: string, limit?: number): Promise<string>;
  
  // Blog Archive operations
  getBlogArchive(type: 'month' | 'year'): Promise<any[]>;
  getBlogPostsByMonth(year: number, month: number): Promise<BlogPost[]>;
  getBlogPostsByYear(year: number): Promise<BlogPost[]>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(userId: string): Promise<User | null> {
    return (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0] || null;
  }
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<{ user: User; isNewUser: boolean }> {
    try {
      console.log('🔍 upsertUser called with:', JSON.stringify(userData));

      // Validate and sanitize email
      if (!userData.email || typeof userData.email !== 'string') {
        // If no email, generate a placeholder and create account anyway
        const fallbackEmail = `user-${Math.random().toString(36).substr(2, 9)}@placeholder.local`;
        console.warn(`⚠️  No email provided, using fallback: ${fallbackEmail}`);
        userData.email = fallbackEmail;
      }

      const userEmail = userData.email.trim().toLowerCase(); // Normalize email

      // ALWAYS match users by email - this is the primary identifier
      const existingByEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);

      console.log(`🔍 Existing user check: ${existingByEmail[0] ? `FOUND (${existingByEmail[0].id})` : 'NOT FOUND'}`);

      if (existingByEmail[0]) {
        // User exists with this email - update their profile data
        console.log(`✅ Updating existing user ${existingByEmail[0].id}`);
        const [user] = await db
          .update(users)
          .set({
            firstName: userData.firstName || existingByEmail[0].firstName,
            lastName: userData.lastName || existingByEmail[0].lastName,
            profileImageUrl: userData.profileImageUrl || existingByEmail[0].profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userEmail))
          .returning();
        console.log(`✅ User updated: ${user.id} (${user.email})`);
        return { user, isNewUser: false };
      }

      // New user - create with a custom ID (not the OAuth ID)
      console.log('📝 Creating NEW user...');
      const baseId = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
      const uniqueId = `${baseId}-${Math.random().toString(36).substr(2, 6)}`;
      console.log(`📝 Generated ID: ${uniqueId}`);

      const [user] = await db
        .insert(users)
        .values({
          id: uniqueId,
          email: userEmail,
          firstName: userData.firstName || 'User',
          lastName: userData.lastName || '',
          profileImageUrl: userData.profileImageUrl,
        })
        .returning();
      console.log(`✅ New user created: ${user.id} (${user.email})`);
      return { user, isNewUser: true };
    } catch (error) {
      console.error('❌ FATAL ERROR in upsertUser:', error);
      console.error('userData was:', JSON.stringify(userData));
      // Re-throw so we can see this in the error page debug info
      throw error;
    }
  }

  async updateUserAdminStatus(id: string, isAdmin: boolean): Promise<void> {
    await db
      .update(users)
      .set({
        isAdmin,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async updateUserOnlineStatus(userId: string, status: "online" | "away" | "offline"): Promise<void> {
    await db
      .update(users)
      .set({
        onlineStatus: status,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getUserConnections(userId: string): Promise<string[]> {
    // Get all users who follow businesses owned by this user
    const myBusinesses = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.ownerId, userId));

    if (myBusinesses.length === 0) {
      return [];
    }

    const businessIds = myBusinesses.map(b => b.id);
    const followers = await db
      .select({ userId: businessFollowers.userId })
      .from(businessFollowers)
      .where(inArray(businessFollowers.businessId, businessIds))
      .groupBy(businessFollowers.userId);

    // Also get users this user has messaged
    const messageConnections = await db
      .select({ userId: messages.senderId })
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .groupBy(messages.senderId)
      .union(
        db
          .select({ userId: messages.receiverId })
          .from(messages)
          .where(
            or(
              eq(messages.senderId, userId),
              eq(messages.receiverId, userId)
            )
          )
          .groupBy(messages.receiverId)
      );

    const connectionIds = new Set([
      ...followers.map(f => f.userId),
      ...messageConnections.map(m => m.userId).filter(id => id !== userId),
    ]);

    return Array.from(connectionIds);
  }

  async userHasAccessToConversation(userId: string, conversationId: string): Promise<boolean> {
    // For now, check if user is part of the message thread
    const message = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.id, conversationId),
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId)
          )
        )
      )
      .limit(1);

    return message.length > 0;
  }

  async getUserFollowedBusinesses(userId: string): Promise<any[]> {
    const follows = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        category: businesses.category,
        followedAt: businessFollowers.createdAt,
      })
      .from(businessFollowers)
      .innerJoin(businesses, eq(businesses.id, businessFollowers.businessId))
      .where(eq(businessFollowers.userId, userId))
      .orderBy(desc(businessFollowers.createdAt))
      .limit(50);
    
    return follows;
  }

  async getUserLikedPosts(userId: string): Promise<any[]> {
    const likes = await db
      .select({
        postId: postLikes.postId,
        businessId: posts.businessId,
        likedAt: postLikes.createdAt,
      })
      .from(postLikes)
      .innerJoin(posts, eq(posts.id, postLikes.postId))
      .where(eq(postLikes.userId, userId))
      .orderBy(desc(postLikes.createdAt))
      .limit(50);
    
    return likes;
  }

  async getUserPurchaseHistory(userId: string): Promise<any[]> {
    const purchases = await db
      .select({
        orderId: orders.id,
        productId: orderItems.productId,
        productName: orderItems.productName,
        quantity: orderItems.quantity,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.status, "completed")
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(50);
    
    return purchases;
  }

  async getBusinessMetrics(businessId: string): Promise<any> {
    // Get average product rating
    const productStats = await db
      .select({
        avgRating: sql<number>`AVG(CAST(${products.rating} AS DECIMAL))`,
        productCount: sql<number>`COUNT(*)`,
      })
      .from(products)
      .where(eq(products.businessId, businessId));

    // Get total engagement
    const postStats = await db
      .select({
        totalLikes: sql<number>`SUM(${posts.likeCount})`,
        totalComments: sql<number>`SUM(${posts.commentCount})`,
        totalShares: sql<number>`SUM(${posts.shareCount})`,
        postCount: sql<number>`COUNT(*)`,
      })
      .from(posts)
      .where(eq(posts.businessId, businessId));

    const business = await this.getBusinessById(businessId);

    return {
      avgProductRating: productStats[0]?.avgRating || 0,
      productCount: productStats[0]?.productCount || 0,
      totalEngagement: 
        (postStats[0]?.totalLikes || 0) + 
        (postStats[0]?.totalComments || 0) + 
        (postStats[0]?.totalShares || 0),
      postCount: postStats[0]?.postCount || 0,
      followerCount: business?.followerCount || 0,
      rating: business?.rating || "0",
      reviewCount: business?.reviewCount || 0,
    };
  }


  async getOrderItemsWithProducts(orderId: string): Promise<any[]> {
    return await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        productName: orderItems.productName,
        productPrice: orderItems.productPrice,
        quantity: orderItems.quantity,
        totalPrice: orderItems.totalPrice,
        product: products,
      })
      .from(orderItems)
      .leftJoin(products, eq(products.id, orderItems.productId))
      .where(eq(orderItems.orderId, orderId));
  }

  async updateOrderInvoiceNumber(orderId: string, invoiceNumber: string): Promise<void> {
    await db
      .update(orders)
      .set({
        invoiceNumber,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  }

  async createBusiness(businessData: InsertBusiness): Promise<Business> {
    const [business] = await db
      .insert(businesses)
      .values(businessData)
      .returning();
    return business;
  }

  async updateBusiness(id: string, businessData: UpdateBusiness): Promise<Business> {
    const [business] = await db
      .update(businesses)
      .set({
        ...businessData,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, id))
      .returning();
    return business;
  }

  async deleteBusiness(id: string): Promise<void> {
    await db.delete(businesses).where(eq(businesses.id, id));
  }

  async getBusinessById(id: string): Promise<Business | undefined> {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, id));
    return business;
  }

  async getBusinesses(page: number = 1, limit: number = 20, category?: string): Promise<Business[]> {
    const offset = (page - 1) * limit;
    const conditions = [];
    
    if (category) {
      conditions.push(eq(businesses.category, category));
    }

    return await db
      .select()
      .from(businesses)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(businesses.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getFeaturedBusinesses(limit: number = 12): Promise<Business[]> {
    // Get businesses that have been featured recently or have high ratings
    return await db
      .select()
      .from(businesses)
      .orderBy(desc(businesses.rating), desc(businesses.createdAt))
      .limit(limit);
  }

  async getBusinessesByOwner(ownerId: string): Promise<Business[]> {
    return await db
      .select()
      .from(businesses)
      .where(eq(businesses.ownerId, ownerId));
  }

  async searchBusinesses(query: string, category?: string): Promise<Business[]> {
    const conditions = [
      or(
        like(businesses.name, `%${query}%`),
        like(businesses.description, `%${query}%`),
        like(businesses.location, `%${query}%`)
      )
    ];

    if (category) {
      conditions.push(eq(businesses.category, category));
    }

    return await db
      .select()
      .from(businesses)
      .where(and(...conditions))
      .orderBy(desc(businesses.rating));
  }

  async getSpotlightBusinesses(type: 'daily' | 'weekly' | 'monthly'): Promise<Business[]> {
    const today = new Date();
    
    return await db
      .select({
        id: businesses.id,
        ownerId: businesses.ownerId,
        name: businesses.name,
        tagline: businesses.tagline,
        description: businesses.description,
        category: businesses.category,
        location: businesses.location,
        address: businesses.address,
        phone: businesses.phone,
        website: businesses.website,
        logoUrl: businesses.logoUrl,
        coverImageUrl: businesses.coverImageUrl,
        operatingHours: businesses.operatingHours,
        socialLinks: businesses.socialLinks,
        googlePlaceId: businesses.googlePlaceId,
        isVerified: businesses.isVerified,
        isActive: businesses.isActive,
        gmbVerified: businesses.gmbVerified,
        gmbConnected: businesses.gmbConnected,
        gmbAccountId: businesses.gmbAccountId,
        gmbLocationId: businesses.gmbLocationId,
        gmbSyncStatus: businesses.gmbSyncStatus,
        gmbLastSyncAt: businesses.gmbLastSyncAt,
        gmbLastErrorAt: businesses.gmbLastErrorAt,
        gmbLastError: businesses.gmbLastError,
        gmbDataSources: businesses.gmbDataSources,
        stripeAccountId: businesses.stripeAccountId,
        stripeOnboardingStatus: businesses.stripeOnboardingStatus,
        stripeChargesEnabled: businesses.stripeChargesEnabled,
        stripePayoutsEnabled: businesses.stripePayoutsEnabled,
        rating: businesses.rating,
        reviewCount: businesses.reviewCount,
        followerCount: businesses.followerCount,
        postCount: businesses.postCount,
        createdAt: businesses.createdAt,
        updatedAt: businesses.updatedAt,
      })
      .from(businesses)
      .innerJoin(spotlights, eq(spotlights.businessId, businesses.id))
      .where(
        and(
          eq(spotlights.type, type),
          eq(spotlights.isActive, true),
          sql`${spotlights.startDate} <= ${today}`,
          sql`${spotlights.endDate} >= ${today}`
        )
      )
      .orderBy(spotlights.position);
  }

  async followBusiness(userId: string, businessId: string): Promise<void> {
    await db.insert(businessFollowers).values({
      userId,
      businessId,
    }).onConflictDoNothing();

    // Update follower count
    await db
      .update(businesses)
      .set({
        followerCount: sql`${businesses.followerCount} + 1`,
      })
      .where(eq(businesses.id, businessId));
  }

  async unfollowBusiness(userId: string, businessId: string): Promise<void> {
    await db
      .delete(businessFollowers)
      .where(
        and(
          eq(businessFollowers.userId, userId),
          eq(businessFollowers.businessId, businessId)
        )
      );

    // Update follower count
    await db
      .update(businesses)
      .set({
        followerCount: sql`GREATEST(${businesses.followerCount} - 1, 0)`,
      })
      .where(eq(businesses.id, businessId));
  }

  async isFollowingBusiness(userId: string, businessId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(businessFollowers)
      .where(
        and(
          eq(businessFollowers.userId, userId),
          eq(businessFollowers.businessId, businessId)
        )
      );
    return !!follow;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();
    return product;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async updateProductImages(productId: string, images: string[]): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({
        images,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();
    return product;
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async getProducts(page: number = 1, limit: number = 20, category?: string): Promise<Product[]> {
    const offset = (page - 1) * limit;
    const conditions = [eq(products.isActive, true)];
    
    if (category) {
      conditions.push(eq(products.category, category));
    }

    return await db
      .select()
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getProductsByBusiness(businessId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.businessId, businessId))
      .orderBy(desc(products.createdAt));
  }

  async searchProducts(query: string, options?: {
    categories?: string[];
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    isDigital?: boolean;
    minRating?: number;
    tags?: string[];
    sort?: 'rating_desc' | 'price_asc' | 'price_desc' | 'newest' | 'popular';
    page?: number;
    pageSize?: number;
    includeTotal?: boolean;
  }): Promise<{ items: Product[]; total: number }> {
    const {
      categories,
      minPrice,
      maxPrice,
      inStock,
      isDigital,
      minRating,
      tags,
      sort = 'rating_desc',
      page = 1,
      pageSize = 24,
      includeTotal = false,
    } = options || {};

    const conditions = [
      eq(products.isActive, true),
    ];

    const q = (query || '').trim();
    if (q) {
      const searchCondition = or(
        like(products.name, `%${q}%`),
        like(products.description, `%${q}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (categories && categories.length > 0) {
      conditions.push(inArray(products.category, categories));
    }

    if (typeof isDigital === 'boolean') {
      conditions.push(eq(products.isDigital, isDigital));
    }

    if (inStock) {
      conditions.push(sql`${products.inventory} > 0`);
    }

    if (typeof minPrice === 'number') {
      conditions.push(sql`CAST(${products.price} AS DECIMAL) >= ${minPrice}`);
    }

    if (typeof maxPrice === 'number') {
      conditions.push(sql`CAST(${products.price} AS DECIMAL) <= ${maxPrice}`);
    }

    if (typeof minRating === 'number') {
      conditions.push(sql`CAST(${products.rating} AS DECIMAL) >= ${minRating}`);
    }

    if (tags && tags.length > 0) {
      const tagConds = tags.map(t => sql`${products.tags}::text ILIKE ${`%"${t}"%`}`);
      const tagCondition = or(...tagConds);
      if (tagCondition) {
        conditions.push(tagCondition);
      }
    }

    // Sorting
    let orderByExpr: any = desc(products.rating);
    if (sort === 'price_asc') orderByExpr = sql`CAST(${products.price} AS DECIMAL) ASC`;
    if (sort === 'price_desc') orderByExpr = sql`CAST(${products.price} AS DECIMAL) DESC`;
    if (sort === 'newest') orderByExpr = desc(products.createdAt);
    if (sort === 'popular') orderByExpr = desc(products.reviewCount);

    const offset = Math.max(0, (page - 1) * pageSize);

    const queryBase = db
      .select()
      .from(products)
      .where(and(...conditions));

    const items = await queryBase
      .orderBy(orderByExpr)
      .limit(pageSize)
      .offset(offset);

    let total = 0;
    if (includeTotal) {
      const [row] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...conditions));
      total = row?.count || 0;
    }

    return { items, total };
  }

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.rating))
      .limit(limit);
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(postData)
      .returning();

    // Update business post count
    await db
      .update(businesses)
      .set({
        postCount: sql`${businesses.postCount} + 1`,
      })
      .where(eq(businesses.id, postData.businessId));

    return post;
  }

  async getPostById(id: string): Promise<Post | undefined> {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id));
    return post;
  }

  async getRecentPosts(limit = 20): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.isVisible, true))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  async getPostsByBusiness(businessId: string): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.businessId, businessId),
          eq(posts.isVisible, true)
        )
      )
      .orderBy(desc(posts.createdAt));
  }


  async likePost(userId: string, postId: string): Promise<void> {
    await db.insert(postLikes).values({
      userId,
      postId,
    }).onConflictDoNothing();

    // Update like count
    await db
      .update(posts)
      .set({
        likeCount: sql`${posts.likeCount} + 1`,
      })
      .where(eq(posts.id, postId));
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    await db
      .delete(postLikes)
      .where(
        and(
          eq(postLikes.userId, userId),
          eq(postLikes.postId, postId)
        )
      );

    // Update like count
    await db
      .update(posts)
      .set({
        likeCount: sql`GREATEST(${posts.likeCount} - 1, 0)`,
      })
      .where(eq(posts.id, postId));
  }

  async isPostLiked(userId: string, postId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(postLikes)
      .where(
        and(
          eq(postLikes.userId, userId),
          eq(postLikes.postId, postId)
        )
      );
    return !!like;
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async getConversations(userId: string): Promise<any[]> {
    // Get distinct conversations for the user
    const conversations = await db
      .selectDistinctOn([messages.senderId, messages.receiverId], {
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        createdAt: messages.createdAt,
        isRead: messages.isRead,
      })
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(messages.senderId, messages.receiverId, desc(messages.createdAt));

    return conversations;
  }

  async markMessageAsRead(messageId: string, readAt?: Date): Promise<void> {
    await db
      .update(messages)
      .set({ 
        isRead: true,
        readAt: readAt || new Date(),
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId));
  }

  async getConversationMessages(conversationId: string, offset?: number, limit?: number): Promise<Message[]> {
    const query = db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt));
    
    if (limit !== undefined) {
      query.limit(limit);
    }
    
    if (offset !== undefined) {
      query.offset(offset);
    }
    
    return await query;
  }

  async markMessagesAsDelivered(messageIds: string[], deliveredAt?: Date): Promise<void> {
    if (messageIds.length === 0) return;
    
    await db
      .update(messages)
      .set({ 
        isDelivered: true,
        deliveredAt: deliveredAt || new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(messages.id, messageIds));
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );
    
    return result?.count || 0;
  }

  async getLatestMessageInConversation(conversationId: string): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    
    return message;
  }

  async searchMessages(userId: string, query: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId)
          ),
          like(messages.content, `%${query}%`)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(50);
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    await db
      .delete(messages)
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.senderId, userId)
        )
      );
  }

  async getMessageById(messageId: string): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));
    
    return message;
  }

  async getCurrentSpotlights(): Promise<{ daily: Business[], weekly: Business[], monthly: Business[] }> {
    const [daily, weekly, monthly] = await Promise.all([
      this.getSpotlightBusinesses('daily'),
      this.getSpotlightBusinesses('weekly'),
      this.getSpotlightBusinesses('monthly'),
    ]);

    return { daily, weekly, monthly };
  }

  // Cart operations
  async addToCart(userId: string, productId: string, quantity: number): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, productId)
        )
      );

    if (existingItem) {
      // Update quantity if item exists
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Create new cart item
      const [cartItem] = await db
        .insert(cartItems)
        .values({ userId, productId, quantity })
        .returning();
      return cartItem;
    }
  }

  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    return await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        addedAt: cartItems.addedAt,
        product: {
          id: products.id,
          businessId: products.businessId,
          name: products.name,
          description: products.description,
          price: products.price,
          originalPrice: products.originalPrice,
          category: products.category,
          images: products.images,
          inventory: products.inventory,
          isActive: products.isActive,
          isDigital: products.isDigital,
          tags: products.tags,
          rating: products.rating,
          reviewCount: products.reviewCount,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        },
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.addedAt));
  }

  async updateCartItemQuantity(userId: string, productId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.removeFromCart(userId, productId);
      return;
    }

    await db
      .update(cartItems)
      .set({ quantity })
      .where(
        and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, productId)
        )
      );
  }

  async removeFromCart(userId: string, productId: string): Promise<void> {
    await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, productId)
        )
      );
  }

  async clearCart(userId: string): Promise<void> {
    await db
      .delete(cartItems)
      .where(eq(cartItems.userId, userId));
  }

  async getCartTotal(userId: string): Promise<number> {
    const cartItemsWithProducts = await this.getCartItems(userId);
    return cartItemsWithProducts.reduce(
      (total, item) => total + (parseFloat(item.product.price) * item.quantity),
      0
    );
  }

  // Order operations
  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(orderData)
      .returning();
    return order;
  }

  async createOrderItems(orderItemsData: InsertOrderItem[]): Promise<OrderItem[]> {
    return await db
      .insert(orderItems)
      .values(orderItemsData)
      .returning();
  }

  async getOrderById(orderId: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      return undefined;
    }

    const orderItemsWithProducts = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        productName: orderItems.productName,
        productPrice: orderItems.productPrice,
        quantity: orderItems.quantity,
        totalPrice: orderItems.totalPrice,
        createdAt: orderItems.createdAt,
        product: {
          id: products.id,
          businessId: products.businessId,
          name: products.name,
          description: products.description,
          price: products.price,
          originalPrice: products.originalPrice,
          category: products.category,
          images: products.images,
          inventory: products.inventory,
          isActive: products.isActive,
          isDigital: products.isDigital,
          tags: products.tags,
          rating: products.rating,
          reviewCount: products.reviewCount,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        },
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return {
      ...order,
      orderItems: orderItemsWithProducts,
    };
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await db
      .update(orders)
      .set({ 
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Adjust inventory when order moves to processing
    if (status === 'processing') {
      await this.adjustInventoryForOrder(orderId);
    }
  }

  private async adjustInventoryForOrder(orderId: string): Promise<void> {
    try {
      // Get order items
      const orderItemsList = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      // Reduce inventory for each product
      for (const item of orderItemsList) {
        await db
          .update(products)
          .set({
            inventory: sql`GREATEST(${products.inventory} - ${item.quantity}, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }

      console.log(`✅ Adjusted inventory for ${orderItemsList.length} products in order ${orderId}`);
    } catch (error) {
      console.error(`❌ Failed to adjust inventory for order ${orderId}:`, error);
      // Don't throw - we don't want to fail the order status update
    }
  }

  // Payment operations
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(paymentData)
      .returning();
    return payment;
  }

  async updatePaymentStatus(
    paymentId: string, 
    status: string, 
    paidAt?: Date, 
    failureReason?: string
  ): Promise<void> {
    await db
      .update(payments)
      .set({
        status,
        paidAt,
        failureReason,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));
  }

  async getPaymentByStripeId(stripePaymentIntentId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId));
    return payment;
  }

  // GMB Token operations
  async createGmbToken(tokenData: InsertGmbToken): Promise<GmbToken> {
    const [token] = await db
      .insert(gmbTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getGmbToken(businessId: string): Promise<GmbToken | undefined> {
    const [token] = await db
      .select()
      .from(gmbTokens)
      .where(and(
        eq(gmbTokens.businessId, businessId),
        eq(gmbTokens.isActive, true)
      ));
    return token;
  }

  async updateGmbToken(businessId: string, tokenData: Partial<GmbToken>): Promise<void> {
    await db
      .update(gmbTokens)
      .set({
        ...tokenData,
        updatedAt: new Date(),
      })
      .where(eq(gmbTokens.businessId, businessId));
  }

  async deactivateGmbToken(businessId: string): Promise<void> {
    await db
      .update(gmbTokens)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(gmbTokens.businessId, businessId));
  }

  // GMB Sync History operations
  async createGmbSyncHistory(syncData: InsertGmbSyncHistory): Promise<GmbSyncHistory> {
    const [history] = await db
      .insert(gmbSyncHistory)
      .values(syncData)
      .returning();
    return history;
  }

  async getGmbSyncHistory(businessId: string): Promise<GmbSyncHistory[]> {
    return await db
      .select()
      .from(gmbSyncHistory)
      .where(eq(gmbSyncHistory.businessId, businessId))
      .orderBy(desc(gmbSyncHistory.createdAt));
  }

  async getRecentGmbSyncHistory(businessId: string, limit: number): Promise<GmbSyncHistory[]> {
    return await db
      .select()
      .from(gmbSyncHistory)
      .where(eq(gmbSyncHistory.businessId, businessId))
      .orderBy(desc(gmbSyncHistory.createdAt))
      .limit(limit);
  }

  // GMB Review operations
  async createGmbReview(reviewData: InsertGmbReview): Promise<GmbReview> {
    const [review] = await db
      .insert(gmbReviews)
      .values(reviewData)
      .returning();
    return review;
  }

  async getGmbReviewByGmbId(businessId: string, gmbReviewId: string): Promise<GmbReview | undefined> {
    const [review] = await db
      .select()
      .from(gmbReviews)
      .where(and(
        eq(gmbReviews.businessId, businessId),
        eq(gmbReviews.gmbReviewId, gmbReviewId)
      ));
    return review;
  }

  async updateGmbReview(reviewId: string, updates: Partial<GmbReview>): Promise<void> {
    await db
      .update(gmbReviews)
      .set(updates)
      .where(eq(gmbReviews.id, reviewId));
  }

  async getGmbReviewsByBusiness(businessId: string): Promise<GmbReview[]> {
    return await db
      .select()
      .from(gmbReviews)
      .where(and(
        eq(gmbReviews.businessId, businessId),
        eq(gmbReviews.isVisible, true)
      ))
      .orderBy(desc(gmbReviews.reviewTime));
  }

  // Business GMB Status operations
  async updateBusinessGmbStatus(businessId: string, updates: {
    gmbVerified?: boolean;
    gmbConnected?: boolean;
    gmbAccountId?: string | null;
    gmbLocationId?: string | null;
    gmbSyncStatus?: string;
    gmbLastSyncAt?: Date | null;
    gmbLastErrorAt?: Date | null;
    gmbLastError?: string | null;
    gmbDataSources?: any;
  }): Promise<void> {
    await db
      .update(businesses)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId));
  }

  // Stripe Connect operations
  async updateBusinessStripeFields(businessId: string, fields: {
    stripeAccountId?: string;
    stripeOnboardingComplete?: boolean;
    stripePayoutsEnabled?: boolean;
  }): Promise<void> {
    try {
      await db
        .update(businesses)
        .set({
          ...fields,
          updatedAt: new Date(),
        })
        .where(eq(businesses.id, businessId));
    } catch (error) {
      console.error("Error updating business Stripe fields:", error);
      throw error;
    }
  }

  // GMB Integration Statistics
  async getGMBIntegrationStats(): Promise<{
    totalConnectedBusinesses: number;
    totalVerifiedBusinesses: number;
    totalSyncOperations: number;
    recentSyncActivity: any[];
    errorRates: any;
  }> {
    // Count connected businesses
    const [connectedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(businesses)
      .where(eq(businesses.gmbConnected, true));

    // Count verified businesses
    const [verifiedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(businesses)
      .where(eq(businesses.gmbVerified, true));

    // Count total sync operations
    const [syncResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(gmbSyncHistory);

    // Get recent sync activity (last 10 operations)
    const recentSyncActivity = await db
      .select()
      .from(gmbSyncHistory)
      .orderBy(desc(gmbSyncHistory.createdAt))
      .limit(10);

    // Calculate error rates
    const [errorResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(gmbSyncHistory)
      .where(eq(gmbSyncHistory.status, 'error'));

    const errorRate = syncResult.count > 0 ? (errorResult.count / syncResult.count) * 100 : 0;

    return {
      totalConnectedBusinesses: connectedResult.count,
      totalVerifiedBusinesses: verifiedResult.count,
      totalSyncOperations: syncResult.count,
      recentSyncActivity,
      errorRates: {
        totalErrors: errorResult.count,
        errorPercentage: Math.round(errorRate * 100) / 100
      }
    };
  }

  // Enhanced spotlight operations with algorithms
  async calculateEngagementMetrics(businessId: string): Promise<EngagementMetrics> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get current follower count
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId));

    if (!business) {
      throw new Error('Business not found');
    }

    // Calculate metrics
    const recentPosts = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.businessId, businessId),
          sql`${posts.createdAt} >= ${sevenDaysAgo}`
        )
      );

    const totalEngagement = recentPosts.reduce(
      (sum, post) => sum + (post.likeCount || 0) + (post.commentCount || 0),
      0
    );
    
    const postsEngagement = recentPosts.length > 0 ? totalEngagement / recentPosts.length : 0;

    // Get existing metrics to calculate growth
    const existingMetrics = await this.getEngagementMetrics(businessId);
    const currentFollowerCount = business.followerCount || 0;
    const previousFollowerCount = existingMetrics?.businessId ? currentFollowerCount - (existingMetrics.followersGrowth || 0) : 0;
    const followersGrowth = currentFollowerCount - previousFollowerCount;

    const metrics: InsertEngagementMetrics = {
      businessId,
      followersGrowth,
      postsEngagement: postsEngagement.toString(),
      recentActivity: recentPosts.length,
      productViews: 0, // Would be calculated from analytics if available
      profileViews: 0, // Would be calculated from analytics if available  
      orderCount: 0, // Would be calculated from actual orders if available
    };

    return await this.updateEngagementMetrics(businessId, metrics);
  }

  async updateEngagementMetrics(businessId: string, metrics: Partial<InsertEngagementMetrics>): Promise<EngagementMetrics> {
    const [updated] = await db
      .insert(engagementMetrics)
      .values({
        businessId,
        ...metrics,
      })
      .onConflictDoUpdate({
        target: engagementMetrics.businessId,
        set: {
          ...metrics,
          updatedAt: new Date(),
        },
      })
      .returning();
    return updated;
  }

  async getEngagementMetrics(businessId: string): Promise<EngagementMetrics | undefined> {
    const [metrics] = await db
      .select()
      .from(engagementMetrics)
      .where(eq(engagementMetrics.businessId, businessId));
    return metrics;
  }

  async getAllEngagementMetrics(): Promise<EngagementMetrics[]> {
    return await db
      .select()
      .from(engagementMetrics)
      .orderBy(desc(engagementMetrics.updatedAt));
  }

  // Spotlight history tracking
  async createSpotlightHistory(history: InsertSpotlightHistory): Promise<SpotlightHistory> {
    const [created] = await db
      .insert(spotlightHistory)
      .values(history)
      .returning();
    return created;
  }

  async getSpotlightHistory(businessId: string): Promise<SpotlightHistory[]> {
    return await db
      .select()
      .from(spotlightHistory)
      .where(eq(spotlightHistory.businessId, businessId))
      .orderBy(desc(spotlightHistory.createdAt));
  }

  async getRecentSpotlightHistory(type: 'daily' | 'weekly' | 'monthly', days: number): Promise<SpotlightHistory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await db
      .select()
      .from(spotlightHistory)
      .where(
        and(
          eq(spotlightHistory.type, type),
          sql`${spotlightHistory.startDate} >= ${cutoffDate}`
        )
      )
      .orderBy(desc(spotlightHistory.startDate));
  }

  // Intelligent spotlight selection algorithms
  async selectDailySpotlights(): Promise<Business[]> {
    const eligibleBusinesses = await this.getEligibleBusinesses('daily');
    
    // Calculate scores for all eligible businesses
    const businessesWithScores = await Promise.all(
      eligibleBusinesses.map(async (business) => {
        const score = await this.getBusinessScore(business.id);
        return { business, score };
      })
    );

    // Sort by score and select top 3
    const selectedBusinesses = businessesWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.business);

    // Archive any existing daily spotlights and create new ones
    await this.archiveExpiredSpotlights();
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create spotlight entries and history
    for (let i = 0; i < selectedBusinesses.length; i++) {
      const business = selectedBusinesses[i];
      const score = businessesWithScores.find(item => item.business.id === business.id)?.score || 0;
      
      // Create spotlight entry
      await db.insert(spotlights).values({
        businessId: business.id,
        type: 'daily',
        position: i + 1,
        startDate: today,
        endDate: tomorrow,
        isActive: true,
      });

      // Create history entry
      await this.createSpotlightHistory({
        businessId: business.id,
        type: 'daily',
        position: i + 1,
        startDate: today,
        endDate: tomorrow,
        totalScore: score.toString(),
      });

      // Update last featured date
      await this.updateEngagementMetrics(business.id, {
        lastFeaturedDaily: today,
      });
    }

    return selectedBusinesses;
  }

  async selectWeeklySpotlights(): Promise<Business[]> {
    const eligibleBusinesses = await this.getEligibleBusinesses('weekly');
    
    // Calculate scores and ensure category diversity
    const businessesWithScores = await Promise.all(
      eligibleBusinesses.map(async (business) => {
        const score = await this.getBusinessScore(business.id);
        return { business, score };
      })
    );

    // Group by category for diversity
    const businessesByCategory = businessesWithScores.reduce((acc, item) => {
      const category = item.business.category || 'uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, typeof businessesWithScores>);

    // Select businesses ensuring category diversity
    const selectedBusinesses: Business[] = [];
    const categories = Object.keys(businessesByCategory);
    
    // First, select top business from each category (up to 5)
    for (let i = 0; i < Math.min(5, categories.length); i++) {
      const category = categories[i];
      const categoryBusinesses = businessesByCategory[category]
        .sort((a, b) => b.score - a.score);
      
      if (categoryBusinesses.length > 0 && selectedBusinesses.length < 5) {
        selectedBusinesses.push(categoryBusinesses[0].business);
      }
    }

    // Fill remaining slots with highest scoring businesses
    const remainingBusinesses = businessesWithScores
      .filter(item => !selectedBusinesses.some(selected => selected.id === item.business.id))
      .sort((a, b) => b.score - a.score);

    while (selectedBusinesses.length < 5 && remainingBusinesses.length > 0) {
      selectedBusinesses.push(remainingBusinesses.shift()!.business);
    }

    // Create spotlight entries
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    for (let i = 0; i < selectedBusinesses.length; i++) {
      const business = selectedBusinesses[i];
      const score = businessesWithScores.find(item => item.business.id === business.id)?.score || 0;
      
      await db.insert(spotlights).values({
        businessId: business.id,
        type: 'weekly',
        position: i + 1,
        startDate: today,
        endDate: nextWeek,
        isActive: true,
      });

      await this.createSpotlightHistory({
        businessId: business.id,
        type: 'weekly',
        position: i + 1,
        startDate: today,
        endDate: nextWeek,
        totalScore: score.toString(),
      });

      await this.updateEngagementMetrics(business.id, {
        lastFeaturedWeekly: today,
      });
    }

    return selectedBusinesses;
  }

  async selectMonthlySpotlight(): Promise<Business[]> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    // Get community votes (70% weight)
    const voteCounts = await this.getMonthlyVoteCounts(currentMonth);
    
    // Get eligible businesses
    const eligibleBusinesses = await this.getEligibleBusinesses('monthly');
    
    // Calculate combined scores (70% community votes + 30% admin algorithm)
    const businessesWithScores = await Promise.all(
      eligibleBusinesses.map(async (business) => {
        const voteCount = voteCounts.find(v => v.businessId === business.id)?.voteCount || 0;
        const algorithmScore = await this.getBusinessScore(business.id);
        
        // Normalize vote count (assuming max 1000 votes)
        const normalizedVotes = Math.min(voteCount / 10, 100);
        
        // Combined score: 70% votes + 30% algorithm
        const combinedScore = (normalizedVotes * 0.7) + (algorithmScore * 0.3);
        
        return { business, score: combinedScore, voteCount };
      })
    );

    // Select top business
    const winner = businessesWithScores
      .sort((a, b) => b.score - a.score)[0];

    if (!winner) {
      return [];
    }

    // Create spotlight entry
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await db.insert(spotlights).values({
      businessId: winner.business.id,
      type: 'monthly',
      position: 1,
      startDate: today,
      endDate: nextMonth,
      isActive: true,
    });

    await this.createSpotlightHistory({
      businessId: winner.business.id,
      type: 'monthly',
      position: 1,
      startDate: today,
      endDate: nextMonth,
      totalScore: winner.score.toString(),
    });

    await this.updateEngagementMetrics(winner.business.id, {
      lastFeaturedMonthly: today,
    });

    return [winner.business];
  }

  async getBusinessScore(businessId: string): Promise<number> {
    // Algorithm: 30% engagement + 25% recency + 20% reviews + 15% growth + 10% community
    
    const business = await this.getBusinessById(businessId);
    if (!business) return 0;

    const metrics = await this.getEngagementMetrics(businessId);
    
    // Engagement Score (30%)
    const engagementScore = metrics?.postsEngagement ? 
      Math.min(parseFloat(metrics.postsEngagement), 100) : 0;

    // Recency Score (25%) - Higher score for businesses not featured recently
    const now = new Date();
    const lastFeatured = metrics?.lastFeaturedDaily || metrics?.lastFeaturedWeekly || metrics?.lastFeaturedMonthly;
    let recencyScore = 100;
    
    if (lastFeatured) {
      const daysSinceLastFeatured = Math.floor((now.getTime() - lastFeatured.getTime()) / (1000 * 60 * 60 * 24));
      recencyScore = Math.min(daysSinceLastFeatured * 2, 100); // 2 points per day
    }

    // Reviews Score (20%)
    const reviewsScore = Math.min((business.reviewCount || 0) * 5, 100); // 5 points per review, max 100

    // Growth Score (15%)
    const growthScore = metrics?.followersGrowth ? 
      Math.min((metrics.followersGrowth || 0) * 2, 100) : 0; // 2 points per new follower

    // Community Score (10%)
    const followerScore = Math.min((business.followerCount || 0), 100); // 1 point per follower, max 100

    // Calculate weighted score
    const totalScore = 
      (engagementScore * 0.30) +
      (recencyScore * 0.25) +
      (reviewsScore * 0.20) +
      (growthScore * 0.15) +
      (followerScore * 0.10);

    return Math.round(totalScore);
  }

  async getEligibleBusinesses(type: 'daily' | 'weekly' | 'monthly'): Promise<Business[]> {
    const now = new Date();
    let cooldownDays = 1; // Default for daily
    if (type === 'weekly') cooldownDays = 7;
    if (type === 'monthly') cooldownDays = 30;

    const cooldownDate = new Date(now);
    cooldownDate.setDate(cooldownDate.getDate() - cooldownDays);

    // If no verified businesses exist, relax requirement to active-only (degraded mode for demo)
    const [verifiedCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(businesses)
      .where(eq(businesses.isVerified, true));
    const requireVerified = (verifiedCountRow?.count || 0) > 0;

    // Get all active (and verified when available) businesses
    const allBusinesses = await db
      .select()
      .from(businesses)
      .where(
        and(
          eq(businesses.isActive, true),
          requireVerified ? eq(businesses.isVerified, true) : sql`TRUE`
        )
      );

    // Filter out businesses currently featured or recently featured
    const eligibleBusinesses: Business[] = [];

    for (const business of allBusinesses) {
      // Check if currently featured in any spotlight
      const currentSpotlight = await db
        .select()
        .from(spotlights)
        .where(
          and(
            eq(spotlights.businessId, business.id),
            eq(spotlights.isActive, true),
            sql`${spotlights.endDate} > ${now}`
          )
        );

      if (currentSpotlight.length > 0) continue;

      // Check cooldown period for this type
      const recentHistory = await db
        .select()
        .from(spotlightHistory)
        .where(
          and(
            eq(spotlightHistory.businessId, business.id),
            eq(spotlightHistory.type, type),
            sql`${spotlightHistory.endDate} > ${cooldownDate}`
          )
        );

      if (recentHistory.length === 0) {
        eligibleBusinesses.push(business);
      }
    }

    return eligibleBusinesses;
  }

  // Spotlight voting (for monthly spotlight)
  async createSpotlightVote(vote: InsertSpotlightVote): Promise<SpotlightVote> {
    const [created] = await db
      .insert(spotlightVotes)
      .values(vote)
      .returning();
    return created;
  }

  async getSpotlightVotes(businessId: string, month: string): Promise<SpotlightVote[]> {
    return await db
      .select()
      .from(spotlightVotes)
      .where(
        and(
          eq(spotlightVotes.businessId, businessId),
          eq(spotlightVotes.month, month)
        )
      );
  }

  async getMonthlyVoteCounts(month: string): Promise<Array<{ businessId: string, voteCount: number }>> {
    const votes = await db
      .select({
        businessId: spotlightVotes.businessId,
        voteCount: sql<number>`count(*)`.as('voteCount'),
      })
      .from(spotlightVotes)
      .where(eq(spotlightVotes.month, month))
      .groupBy(spotlightVotes.businessId)
      .orderBy(desc(sql`count(*)`));

    return votes;
  }

  async hasUserVoted(userId: string, month: string): Promise<boolean> {
    const [vote] = await db
      .select()
      .from(spotlightVotes)
      .where(
        and(
          eq(spotlightVotes.userId, userId),
          eq(spotlightVotes.month, month)
        )
      );
    return !!vote;
  }

  // Get which business the user voted for in a specific month
  async getUserVoteForMonth(userId: string, month: string): Promise<SpotlightVote | undefined> {
    const [vote] = await db
      .select()
      .from(spotlightVotes)
      .where(
        and(
          eq(spotlightVotes.userId, userId),
          eq(spotlightVotes.month, month)
        )
      );
    return vote;
  }

  // Get eligible businesses for voting with vote counts and trend data
  async getEligibleForVoting(limit: number = 20): Promise<any[]> {
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Get all eligible businesses (monthly type = no cooldown restrictions for voting)
    const eligible = await this.getEligibleBusinesses('monthly');

    // Get vote counts for this month
    const voteCounts = await this.getMonthlyVoteCounts(currentMonth);
    const voteMap = new Map(voteCounts.map(v => [v.businessId, v.voteCount]));

    // Enrich businesses with vote counts and calculate trend scores
    const enrichedBusinesses = await Promise.all(
      eligible.slice(0, limit).map(async (business) => {
        const voteCount = voteMap.get(business.id) || 0;

        // Calculate trend score based on recent activity (simplified version)
        // In production, this would use more sophisticated metrics
        const trendScore = Math.min(100, (voteCount * 10) + (business.averageRating || 0) * 15);

        return {
          ...business,
          voteCount,
          trendScore,
          isEligible: true,
        };
      })
    );

    // Sort by vote count descending
    return enrichedBusinesses.sort((a, b) => b.voteCount - a.voteCount);
  }

  // Get voting statistics for the current month
  async getVotingStats(month: string): Promise<any> {
    const voteCounts = await this.getMonthlyVoteCounts(month);

    // Get total unique voters
    const [totalVotersRow] = await db
      .select({ count: sql<number>`count(distinct ${spotlightVotes.userId})` })
      .from(spotlightVotes)
      .where(eq(spotlightVotes.month, month));

    const totalVotes = voteCounts.reduce((sum, v) => sum + v.voteCount, 0);
    const totalVoters = totalVotersRow?.count || 0;
    const participatingBusinesses = voteCounts.length;

    // Calculate days remaining in month
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysRemaining = Math.max(0, Math.ceil((lastDayOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      totalVotes,
      totalVoters,
      participatingBusinesses,
      daysRemaining,
      month,
      topBusinesses: voteCounts.slice(0, 3).map((v, index) => ({
        businessId: v.businessId,
        voteCount: v.voteCount,
        rank: index + 1,
      })),
    };
  }

  // Get all votes by a specific user for a month
  async getUserVotes(userId: string, month: string): Promise<SpotlightVote[]> {
    return await db
      .select()
      .from(spotlightVotes)
      .where(
        and(
          eq(spotlightVotes.userId, userId),
          eq(spotlightVotes.month, month)
        )
      );
  }

  // Community Leaderboard Methods
  async getTopBusinesses(limit: number = 10): Promise<any[]> {
    // Get top businesses by a composite score of ratings, reviews, orders, and engagement
    const topBusinesses = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        logoUrl: businesses.logoUrl,
        description: businesses.description,
        averageRating: businesses.averageRating,
        totalReviews: businesses.totalReviews,
        totalOrders: businesses.totalOrders,
        followers: businesses.followers,
        city: businesses.city,
        state: businesses.state,
      })
      .from(businesses)
      .where(
        and(
          eq(businesses.isActive, true),
          sql`${businesses.averageRating} > 0`
        )
      )
      .orderBy(
        desc(sql`
          (${businesses.averageRating} * 20) +
          (LEAST(${businesses.totalReviews}, 100) * 0.5) +
          (LEAST(${businesses.totalOrders}, 50) * 1.0) +
          (LEAST(${businesses.followers}, 200) * 0.3)
        `)
      )
      .limit(limit);

    // Add rank and score
    return topBusinesses.map((business, index) => ({
      ...business,
      rank: index + 1,
      score: (business.averageRating || 0) * 20 +
             Math.min(business.totalReviews || 0, 100) * 0.5 +
             Math.min(business.totalOrders || 0, 50) * 1.0 +
             Math.min(business.followers || 0, 200) * 0.3,
    }));
  }

  async getTopVoters(limit: number = 10): Promise<any[]> {
    // Get users with most spotlight votes
    const topVoters = await db
      .select({
        userId: spotlightVotes.userId,
        voteCount: sql<number>`count(*)`.as('voteCount'),
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        },
      })
      .from(spotlightVotes)
      .leftJoin(users, eq(spotlightVotes.userId, users.id))
      .groupBy(spotlightVotes.userId, users.id)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    return topVoters.map((voter, index) => ({
      id: voter.userId,
      name: `${voter.user?.firstName || 'Unknown'} ${voter.user?.lastName || 'User'}`,
      avatar: voter.user?.profileImage,
      count: voter.voteCount,
      rank: index + 1,
    }));
  }

  async getTopReviewers(limit: number = 10): Promise<any[]> {
    // Get users with most reviews
    const topReviewers = await db
      .select({
        userId: businessReviews.userId,
        reviewCount: sql<number>`count(*)`.as('reviewCount'),
        avgRating: sql<number>`avg(${businessReviews.rating})`.as('avgRating'),
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        },
      })
      .from(businessReviews)
      .leftJoin(users, eq(businessReviews.userId, users.id))
      .groupBy(businessReviews.userId, users.id)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    return topReviewers.map((reviewer, index) => ({
      id: reviewer.userId,
      name: `${reviewer.user?.firstName || 'Unknown'} ${reviewer.user?.lastName || 'User'}`,
      avatar: reviewer.user?.profileImage,
      count: reviewer.reviewCount,
      avgRating: reviewer.avgRating ? Number(reviewer.avgRating).toFixed(1) : '0.0',
      rank: index + 1,
    }));
  }

  async getTopBuyers(limit: number = 10): Promise<any[]> {
    // Get users with most orders
    const topBuyers = await db
      .select({
        userId: orders.userId,
        orderCount: sql<number>`count(distinct ${orders.id})`.as('orderCount'),
        totalSpent: sql<number>`sum(${orders.total})`.as('totalSpent'),
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        },
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.status, 'completed'))
      .groupBy(orders.userId, users.id)
      .orderBy(desc(sql`sum(${orders.total})`))
      .limit(limit);

    return topBuyers.map((buyer, index) => ({
      id: buyer.userId,
      name: `${buyer.user?.firstName || 'Unknown'} ${buyer.user?.lastName || 'User'}`,
      avatar: buyer.user?.profileImage,
      count: buyer.orderCount,
      totalSpent: buyer.totalSpent ? Number(buyer.totalSpent).toFixed(2) : '0.00',
      rank: index + 1,
    }));
  }

  async getTrendingBusinesses(limit: number = 10): Promise<any[]> {
    // Calculate trending score based on recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get businesses with their recent activity metrics
    const trendingBusinesses = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        logoUrl: businesses.logoUrl,
        description: businesses.description,
        category: businesses.category,
        averageRating: businesses.averageRating,
        totalReviews: businesses.totalReviews,
        totalOrders: businesses.totalOrders,
        followers: businesses.followers,
        city: businesses.city,
        state: businesses.state,
        createdAt: businesses.createdAt,
      })
      .from(businesses)
      .where(eq(businesses.isActive, true))
      .orderBy(
        desc(sql`
          (CASE WHEN ${businesses.createdAt} > ${sevenDaysAgo} THEN 50 ELSE 0 END) +
          (${businesses.averageRating} * 15) +
          (LEAST(${businesses.totalReviews}, 50) * 0.8) +
          (LEAST(${businesses.totalOrders}, 30) * 1.2) +
          (LEAST(${businesses.followers}, 100) * 0.5)
        `)
      )
      .limit(limit);

    // Calculate trend scores
    return trendingBusinesses.map((business, index) => {
      const isNew = business.createdAt && new Date(business.createdAt) > sevenDaysAgo;
      const trendScore = Math.min(100, Math.round(
        (isNew ? 50 : 0) +
        (business.averageRating || 0) * 15 +
        Math.min(business.totalReviews || 0, 50) * 0.8 +
        Math.min(business.totalOrders || 0, 30) * 1.2 +
        Math.min(business.followers || 0, 100) * 0.5
      ));

      return {
        ...business,
        trendScore,
        isNew,
        rank: index + 1,
      };
    });
  }

  // SECURITY: Enhanced rotation management with guards and frequency controls
  private rotationInProgress = new Set<string>();
  private lastRotationTimes = new Map<string, number>();

  async rotateSpotlights(): Promise<void> {
    const now = new Date();
    const currentTime = now.getTime();
    
    // GUARD: Prevent concurrent rotations
    if (this.rotationInProgress.has('global')) {
      console.warn('Spotlight rotation already in progress, skipping...');
      return;
    }

    try {
      this.rotationInProgress.add('global');
      console.log('Starting spotlight rotation process...');

      // GUARD: Check if rotation was triggered too recently (abuse prevention)
      const lastRotation = this.lastRotationTimes.get('global');
      const MIN_ROTATION_INTERVAL = 60 * 1000; // 1 minute minimum between rotations
      
      if (lastRotation && (currentTime - lastRotation) < MIN_ROTATION_INTERVAL) {
        console.warn(`Rotation triggered too soon. Last rotation: ${new Date(lastRotation).toISOString()}`);
        return;
      }

      this.lastRotationTimes.set('global', currentTime);
      
      let rotationsPerformed = 0;

      // Enhanced daily rotation check with more precise timing
      if (await this.shouldRotateSpotlight('daily', now)) {
        console.log('Performing daily spotlight rotation...');
        await this.selectDailySpotlights();
        rotationsPerformed++;
      }

      // Enhanced weekly rotation check 
      if (await this.shouldRotateSpotlight('weekly', now)) {
        console.log('Performing weekly spotlight rotation...');
        await this.selectWeeklySpotlights();
        rotationsPerformed++;
      }

      // Enhanced monthly rotation check
      if (await this.shouldRotateSpotlight('monthly', now)) {
        console.log('Performing monthly spotlight rotation...');
        await this.selectMonthlySpotlight();
        rotationsPerformed++;
      }

      if (rotationsPerformed === 0) {
        console.log('No spotlight rotations needed at this time.');
      } else {
        console.log(`Completed ${rotationsPerformed} spotlight rotation(s).`);
      }

      // Archive expired spotlights
      await this.archiveExpiredSpotlights();
      
    } catch (error) {
      console.error('Error during spotlight rotation:', error);
      throw error;
    } finally {
      this.rotationInProgress.delete('global');
    }
  }

  // SECURITY: Enhanced rotation timing validation
  private async shouldRotateSpotlight(type: 'daily' | 'weekly' | 'monthly', now: Date): Promise<boolean> {
    // Get the most recent rotation of this type
    const lastRotation = await db
      .select()
      .from(spotlights)
      .where(eq(spotlights.type, type))
      .orderBy(desc(spotlights.createdAt))
      .limit(1);

    if (!lastRotation.length) {
      return true; // No previous rotation, safe to rotate
    }

    // If createdAt is null, treat as requiring rotation (return early true)
    if (!lastRotation[0].createdAt) {
      return true;
    }
    
    const lastRotationTime = new Date(lastRotation[0].createdAt).getTime();
    const currentTime = now.getTime();
    const timeDiff = currentTime - lastRotationTime;

    // Define minimum intervals with safety margins
    const intervals = {
      daily: 20 * 60 * 60 * 1000,   // 20 hours (allows for some flexibility)
      weekly: 6.5 * 24 * 60 * 60 * 1000,  // 6.5 days 
      monthly: 25 * 24 * 60 * 60 * 1000   // 25 days (monthly is more flexible due to voting)
    };

    const shouldRotate = timeDiff > intervals[type];
    
    if (!shouldRotate) {
      const nextRotation = new Date(lastRotationTime + intervals[type]);
      console.log(`${type} rotation not due yet. Next rotation: ${nextRotation.toISOString()}`);
    }

    return shouldRotate;
  }

  // SECURITY: Manual rotation validation for admin use
  async canPerformManualRotation(): Promise<{ canRotate: boolean; reason?: string }> {
    if (this.rotationInProgress.has('global')) {
      return { canRotate: false, reason: 'Rotation already in progress' };
    }

    const lastRotation = this.lastRotationTimes.get('global');
    const MIN_MANUAL_INTERVAL = 30 * 1000; // 30 seconds for manual rotations
    
    if (lastRotation && (Date.now() - lastRotation) < MIN_MANUAL_INTERVAL) {
      const nextAllowed = new Date(lastRotation + MIN_MANUAL_INTERVAL);
      return { 
        canRotate: false, 
        reason: `Manual rotation cooling down. Next allowed: ${nextAllowed.toISOString()}` 
      };
    }

    return { canRotate: true };
  }

  async archiveExpiredSpotlights(): Promise<void> {
    const now = new Date();
    
    await db
      .update(spotlights)
      .set({ isActive: false })
      .where(
        and(
          eq(spotlights.isActive, true),
          sql`${spotlights.endDate} <= ${now}`
        )
      );
  }

  async createApiKey(apiKeyData: InsertApiKey): Promise<ApiKey> {
    const [apiKey] = await db
      .insert(apiKeys)
      .values(apiKeyData)
      .returning();
    return apiKey;
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);
    return apiKey;
  }

  async updateApiKeyLastUsed(keyId: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, keyId));
  }

  // ========================================
  // ADMIN METHODS - Platform Management
  // ========================================

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getAllBusinesses(): Promise<Business[]> {
    return await db
      .select()
      .from(businesses)
      .orderBy(desc(businesses.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async getAllPosts(): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt));
  }

  async getAllProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));
  }

  async updateUser(userId: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // ====================================================================
  // PHASE 4: BLOG STORAGE METHODS
  // ====================================================================

  // Blog Posts
  async getBlogPosts(filters: any): Promise<BlogPost[]> {
    const {
      status = 'published',
      categoryId,
      tag,
      authorId,
      featured,
      limit = 20,
      offset = 0,
      orderBy = 'publishedAt',
      order = 'desc',
    } = filters;

    let query = db
      .select({
        post: blogPosts,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
        category: {
          id: blogCategories.id,
          name: blogCategories.name,
          slug: blogCategories.slug,
          color: blogCategories.color,
        },
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .$dynamic();

    // Apply filters
    const conditions = [];

    if (status) {
      conditions.push(eq(blogPosts.status, status));
    }

    if (categoryId) {
      conditions.push(eq(blogPosts.categoryId, categoryId));
    }

    if (authorId) {
      conditions.push(eq(blogPosts.authorId, authorId));
    }

    if (featured !== undefined) {
      conditions.push(eq(blogPosts.isFeatured, featured));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const orderColumn = orderBy === 'publishedAt' ? blogPosts.publishedAt :
                       orderBy === 'viewCount' ? blogPosts.viewCount :
                       orderBy === 'likeCount' ? blogPosts.likeCount :
                       blogPosts.createdAt;

    query = query.orderBy(order === 'desc' ? desc(orderColumn) : orderColumn);

    // Apply pagination
    query = query.limit(limit).offset(offset);

    const results = await query;

    return results.map((r: any) => ({
      ...r.post,
      author: r.author,
      category: r.category,
    }));
  }

  async getBlogPost(id: string): Promise<BlogPost | null> {
    const results = await db
      .select({
        post: blogPosts,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
        category: {
          id: blogCategories.id,
          name: blogCategories.name,
          slug: blogCategories.slug,
          color: blogCategories.color,
        },
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(eq(blogPosts.id, id))
      .limit(1);

    if (results.length === 0) return null;

    const result = results[0];
    return {
      ...result.post,
      author: result.author,
      category: result.category,
    } as any;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const results = await db
      .select({
        post: blogPosts,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
        category: {
          id: blogCategories.id,
          name: blogCategories.name,
          slug: blogCategories.slug,
          color: blogCategories.color,
        },
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (results.length === 0) return null;

    const result = results[0];
    return {
      ...result.post,
      author: result.author,
      category: result.category,
    } as any;
  }

  async createBlogPost(data: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db
      .insert(blogPosts)
      .values({
        ...data,
        publishedAt: data.status === 'published' ? new Date() : data.publishedAt,
      })
      .returning();

    return post;
  }

  async updateBlogPost(id: string, data: Partial<UpdateBlogPost>): Promise<BlogPost> {
    const [post] = await db
      .update(blogPosts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, id))
      .returning();

    return post;
  }

  async deleteBlogPost(id: string): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async getRelatedBlogPosts(postId: string, limit: number): Promise<BlogPost[]> {
    // Get the current post to find its category and tags
    const post = await this.getBlogPost(postId);
    if (!post) return [];

    // Get tags for this post
    const postTags = await db
      .select({ tagId: blogPostTags.tagId })
      .from(blogPostTags)
      .where(eq(blogPostTags.postId, postId));

    const tagIds = postTags.map(pt => pt.tagId);

    // Find posts with same category or shared tags
    let query = db
      .select({
        post: blogPosts,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(
        and(
          eq(blogPosts.status, 'published'),
          sql`${blogPosts.id} != ${postId}`, // Exclude current post
          or(
            eq(blogPosts.categoryId, post.categoryId),
            tagIds.length > 0
              ? sql`${blogPosts.id} IN (
                  SELECT ${blogPostTags.postId}
                  FROM ${blogPostTags}
                  WHERE ${blogPostTags.tagId} IN ${tagIds}
                )`
              : undefined
          )
        )
      )
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);

    const results = await query;

    return results.map((r: any) => ({
      ...r.post,
      author: r.author,
    }));
  }

  async addTagsToBlogPost(postId: string, tags: string[]): Promise<void> {
    for (const tagName of tags) {
      const slug = tagName.toLowerCase().replace(/\s+/g, '-');

      // Find or create tag
      let [tag] = await db
        .select()
        .from(blogTags)
        .where(eq(blogTags.slug, slug))
        .limit(1);

      if (!tag) {
        [tag] = await db
          .insert(blogTags)
          .values({ name: tagName, slug })
          .returning();
      }

      // Link tag to post (ignore if already linked)
      try {
        await db
          .insert(blogPostTags)
          .values({ postId, tagId: tag.id });

        // Increment tag post count
        await db
          .update(blogTags)
          .set({ postCount: sql`${blogTags.postCount} + 1` })
          .where(eq(blogTags.id, tag.id));
      } catch (error) {
        // Ignore duplicate key errors
      }
    }
  }

  async updateBlogPostTags(postId: string, tags: string[]): Promise<void> {
    // Get current tags
    const currentTags = await db
      .select({ tagId: blogPostTags.tagId })
      .from(blogPostTags)
      .where(eq(blogPostTags.postId, postId));

    const currentTagIds = currentTags.map(t => t.tagId);

    // Delete all current tag associations
    if (currentTagIds.length > 0) {
      await db
        .delete(blogPostTags)
        .where(eq(blogPostTags.postId, postId));

      // Decrement post counts for old tags
      await db
        .update(blogTags)
        .set({ postCount: sql`${blogTags.postCount} - 1` })
        .where(inArray(blogTags.id, currentTagIds));
    }

    // Add new tags
    await this.addTagsToBlogPost(postId, tags);
  }

  // Categories
  async getBlogCategories(): Promise<BlogCategory[]> {
    return await db
      .select()
      .from(blogCategories)
      .where(eq(blogCategories.isActive, true))
      .orderBy(blogCategories.name);
  }

  async createBlogCategory(data: InsertBlogCategory): Promise<BlogCategory> {
    const [category] = await db
      .insert(blogCategories)
      .values(data)
      .returning();

    return category;
  }

  // Tags
  async getBlogTags(filters: any): Promise<BlogTag[]> {
    const { limit = 50, popular = false } = filters;

    let query = db
      .select()
      .from(blogTags)
      .$dynamic();

    if (popular) {
      query = query.orderBy(desc(blogTags.postCount));
    } else {
      query = query.orderBy(blogTags.name);
    }

    return await query.limit(limit);
  }

  // Comments
  async getBlogComments(postId: string): Promise<BlogComment[]> {
    const results = await db
      .select({
        comment: blogComments,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(blogComments)
      .leftJoin(users, eq(blogComments.authorId, users.id))
      .where(eq(blogComments.postId, postId))
      .orderBy(blogComments.createdAt);

    return results.map((r: any) => ({
      ...r.comment,
      author: r.author,
    }));
  }

  async getBlogComment(id: string): Promise<BlogComment | null> {
    const [comment] = await db
      .select()
      .from(blogComments)
      .where(eq(blogComments.id, id))
      .limit(1);

    return comment || null;
  }

  async createBlogComment(data: InsertBlogComment): Promise<BlogComment> {
    const [comment] = await db
      .insert(blogComments)
      .values(data)
      .returning();

    // Increment post comment count
    await db
      .update(blogPosts)
      .set({ commentCount: sql`${blogPosts.commentCount} + 1` })
      .where(eq(blogPosts.id, data.postId));

    // If this is a reply, increment parent comment's reply count
    if (data.parentCommentId) {
      await db
        .update(blogComments)
        .set({ replyCount: sql`${blogComments.replyCount} + 1` })
        .where(eq(blogComments.id, data.parentCommentId));
    }

    return comment;
  }

  async updateBlogComment(id: string, data: Partial<UpdateBlogComment>): Promise<BlogComment> {
    const [comment] = await db
      .update(blogComments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(blogComments.id, id))
      .returning();

    return comment;
  }

  async deleteBlogComment(id: string): Promise<void> {
    const comment = await this.getBlogComment(id);
    if (!comment) return;

    // Decrement post comment count
    await db
      .update(blogPosts)
      .set({ commentCount: sql`${blogPosts.commentCount} - 1` })
      .where(eq(blogPosts.id, comment.postId));

    // If this is a reply, decrement parent comment's reply count
    if (comment.parentCommentId) {
      await db
        .update(blogComments)
        .set({ replyCount: sql`${blogComments.replyCount} - 1` })
        .where(eq(blogComments.id, comment.parentCommentId));
    }

    await db.delete(blogComments).where(eq(blogComments.id, id));
  }

  // Reactions
  async getBlogReactions(postId: string): Promise<BlogReaction[]> {
    return await db
      .select()
      .from(blogReactions)
      .where(eq(blogReactions.postId, postId));
  }

  async upsertBlogReaction(data: InsertBlogReaction): Promise<BlogReaction> {
    // Try to find existing reaction
    const [existing] = await db
      .select()
      .from(blogReactions)
      .where(
        and(
          eq(blogReactions.postId, data.postId),
          eq(blogReactions.userId, data.userId),
          eq(blogReactions.reactionType, data.reactionType)
        )
      )
      .limit(1);

    if (existing) {
      // Update count
      const [updated] = await db
        .update(blogReactions)
        .set({
          count: data.count || (existing.count + 1),
          updatedAt: new Date(),
        })
        .where(eq(blogReactions.id, existing.id))
        .returning();

      return updated;
    } else {
      // Create new reaction
      const [reaction] = await db
        .insert(blogReactions)
        .values(data)
        .returning();

      // Increment post like count
      await db
        .update(blogPosts)
        .set({ likeCount: sql`${blogPosts.likeCount} + 1` })
        .where(eq(blogPosts.id, data.postId));

      return reaction;
    }
  }

  async deleteBlogReaction(postId: string, userId: string, reactionType: string): Promise<void> {
    await db
      .delete(blogReactions)
      .where(
        and(
          eq(blogReactions.postId, postId),
          eq(blogReactions.userId, userId),
          eq(blogReactions.reactionType, reactionType)
        )
      );

    // Decrement post like count
    await db
      .update(blogPosts)
      .set({ likeCount: sql`${blogPosts.likeCount} - 1` })
      .where(eq(blogPosts.id, postId));
  }

  // Bookmarks
  async getBlogBookmarks(userId: string): Promise<any[]> {
    const results = await db
      .select({
        bookmark: blogBookmarks,
        post: {
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          featuredImageUrl: blogPosts.featuredImageUrl,
          publishedAt: blogPosts.publishedAt,
        },
      })
      .from(blogBookmarks)
      .leftJoin(blogPosts, eq(blogBookmarks.postId, blogPosts.id))
      .where(eq(blogBookmarks.userId, userId))
      .orderBy(desc(blogBookmarks.createdAt));

    return results.map((r: any) => ({
      ...r.bookmark,
      post: r.post,
    }));
  }

  async createBlogBookmark(data: InsertBlogBookmark): Promise<BlogBookmark> {
    const [bookmark] = await db
      .insert(blogBookmarks)
      .values(data)
      .returning();

    // Increment post bookmark count
    await db
      .update(blogPosts)
      .set({ bookmarkCount: sql`${blogPosts.bookmarkCount} + 1` })
      .where(eq(blogPosts.id, data.postId));

    return bookmark;
  }

  async deleteBlogBookmark(postId: string, userId: string): Promise<void> {
    await db
      .delete(blogBookmarks)
      .where(
        and(
          eq(blogBookmarks.postId, postId),
          eq(blogBookmarks.userId, userId)
        )
      );

    // Decrement post bookmark count
    await db
      .update(blogPosts)
      .set({ bookmarkCount: sql`${blogPosts.bookmarkCount} - 1` })
      .where(eq(blogPosts.id, postId));
  }

  // Subscriptions
  async createBlogSubscription(data: InsertBlogSubscription): Promise<BlogSubscription> {
    const [subscription] = await db
      .insert(blogSubscriptions)
      .values(data)
      .returning();

    return subscription;
  }

  async unsubscribeBlog(token: string): Promise<void> {
    await db
      .update(blogSubscriptions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(blogSubscriptions.unsubscribeToken, token));
  }

  // Analytics
  async trackBlogAnalytics(data: InsertBlogAnalytics): Promise<void> {
    // Insert analytics record
    await db.insert(blogAnalytics).values(data);

    // Update post view counts
    if (data.viewType === 'page_view') {
      await db
        .update(blogPosts)
        .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
        .where(eq(blogPosts.id, data.postId));

      // Update unique view count if this is first view from this session
      if (data.sessionId) {
        const existingViews = await db
          .select()
          .from(blogAnalytics)
          .where(
            and(
              eq(blogAnalytics.postId, data.postId),
              eq(blogAnalytics.sessionId, data.sessionId)
            )
          )
          .limit(1);

        if (existingViews.length === 0) {
          await db
            .update(blogPosts)
            .set({ uniqueViewCount: sql`${blogPosts.uniqueViewCount} + 1` })
            .where(eq(blogPosts.id, data.postId));
        }
      }
    }
  }

  async getBlogPostAnalytics(postId: string): Promise<any> {
    // Get basic post stats
    const [post] = await db
      .select({
        viewCount: blogPosts.viewCount,
        uniqueViewCount: blogPosts.uniqueViewCount,
        likeCount: blogPosts.likeCount,
        commentCount: blogPosts.commentCount,
        bookmarkCount: blogPosts.bookmarkCount,
        shareCount: blogPosts.shareCount,
        readCompletionRate: blogPosts.readCompletionRate,
      })
      .from(blogPosts)
      .where(eq(blogPosts.id, postId))
      .limit(1);

    // Get detailed analytics
    const analyticsData = await db
      .select()
      .from(blogAnalytics)
      .where(eq(blogAnalytics.postId, postId));

    // Calculate metrics
    const totalViews = analyticsData.filter(a => a.viewType === 'page_view').length;
    const avgReadTime = analyticsData.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0) / (totalViews || 1);

    // Group by traffic source
    const trafficSources: Record<string, number> = {};
    analyticsData.forEach(a => {
      const source = a.utmSource || a.referrer || 'direct';
      trafficSources[source] = (trafficSources[source] || 0) + 1;
    });

    const trafficSourcesArray = Object.entries(trafficSources).map(([source, visits]) => ({
      source,
      visits,
      percentage: (visits / totalViews) * 100,
    })).sort((a, b) => b.visits - a.visits);

    // Device breakdown
    const deviceBreakdown = {
      desktop: analyticsData.filter(a => a.deviceType === 'desktop').length,
      mobile: analyticsData.filter(a => a.deviceType === 'mobile').length,
      tablet: analyticsData.filter(a => a.deviceType === 'tablet').length,
    };

    // Geographic data
    const geographicData: Record<string, number> = {};
    analyticsData.forEach(a => {
      if (a.country) {
        geographicData[a.country] = (geographicData[a.country] || 0) + 1;
      }
    });

    const geographicDataArray = Object.entries(geographicData).map(([country, visits]) => ({
      country,
      visits,
    })).sort((a, b) => b.visits - a.visits);

    return {
      overview: {
        totalViews: post.viewCount,
        uniqueViews: post.uniqueViewCount,
        avgReadTime: Math.floor(avgReadTime),
        readCompletionRate: post.readCompletionRate,
        totalReactions: post.likeCount,
        totalComments: post.commentCount,
        totalBookmarks: post.bookmarkCount,
        totalShares: post.shareCount,
      },
      trafficSources: trafficSourcesArray,
      deviceBreakdown,
      geographicData: geographicDataArray,
      engagementMetrics: {
        avgScrollDepth: 0, // TODO: Calculate from scroll events
        bounceRate: 0, // TODO: Calculate
        avgTimeOnPage: Math.floor(avgReadTime),
      },
    };
  }
}

export const storage = new DatabaseStorage();
