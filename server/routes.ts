import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated } from "./auth/index";
import { isAdmin, adminRateLimit } from "./adminAuth";
import { votingRateLimit, businessActionRateLimit, generalAPIRateLimit, strictRateLimit, publicEndpointRateLimit } from "./rateLimit";
import { checkRedisConnection } from "./redis";
import { getDatabaseStatus } from "./db";
import { insertBusinessSchema, updateBusinessSchema, insertProductSchema, insertPostSchema, insertMessageSchema, insertCartItemSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import Stripe from "stripe";
import { ApiResponse, asyncHandler, standardErrorMiddleware } from "./apiResponse";

// API Request Validation Schemas
const gmbSyncRequestSchema = z.object({
  forceUpdate: z.boolean().default(false),
  syncPhotos: z.boolean().default(true),
  syncReviews: z.boolean().default(true),
  syncBusinessInfo: z.boolean().default(true),
  conflictResolution: z.enum(['merge', 'gmb_wins', 'local_wins']).default('merge'),
});

const stripePayoutRequestSchema = z.object({
  amount: z.number().int().min(100, "Amount must be at least $1.00 (100 cents)"),
  description: z.string().max(500).optional(),
});

const stripePayoutSettingsSchema = z.object({
  interval: z.enum(['daily', 'weekly', 'monthly', 'manual']),
  delayDays: z.number().int().min(0).optional(),
});

const productImageUploadSchema = z.object({
  filename: z.string().min(1).max(255).regex(/\.(jpg|jpeg|png|webp)$/i, "Invalid file type"),
});

const productImageUrlSchema = z.object({
  imageUrl: z.string().url().max(2048),
});

const messageFileUploadSchema = z.object({
  receiverId: z.string().uuid(),
  file: z.object({
    name: z.string().max(255),
    type: z.string(),
    size: z.number().max(10 * 1024 * 1024),
    url: z.string().url(),
  }),
});

const shareBusinessMessageSchema = z.object({
  receiverId: z.string().uuid(),
  businessId: z.string().uuid(),
});

const cartQuantityUpdateSchema = z.object({
  quantity: z.number().int().min(0).max(999),
});

const createPaymentIntentSchema = z.object({
  shippingAddress: z.string().max(500),
  billingAddress: z.string().max(500),
  customerEmail: z.string().email().max(255),
  customerPhone: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
  currency: z.string().length(3).default('usd'),
});

const completeOrderSchema = z.object({
  paymentIntentId: z.string().min(1).max(255),
});

const aiGenerateContentSchema = z.object({
  businessId: z.string().uuid(),
  platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'general']),
  idea: z.string().min(1).max(500),
  tone: z.enum(['professional', 'casual', 'friendly', 'formal', 'humorous']).default('professional'),
});

const adminPromoteUserSchema = z.object({
  userId: z.string().min(1).max(255),
});

const gmbVerifyRequestSchema = z.object({
  gmbLocationName: z.string().min(1).max(500),
});

const spotlightVoteSchema = z.object({
  businessId: z.string().uuid(),
});

const objectUploadRequestSchema = z.object({
  fileType: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/i, "Only image files are allowed").optional(),
  fileSize: z.number().max(5 * 1024 * 1024, "File size must be under 5MB").optional(),
});

const businessImageUpdateSchema = z.object({
  imageURL: z.string().url().max(2048),
});

// GMB Integration Services
import { gmbService } from "./gmbService";
import { businessVerificationService } from "./businessVerificationService";
import { dataSyncService } from "./dataSyncService";
import { gmbReviewService } from "./gmbReviewService";
import { gmbPostService } from "./gmbPostService";
import { gmbInsightsService } from "./gmbInsightsService";
import { gmbSyncService } from "./gmbSyncService";

// Stripe Connect Services
import * as stripeConnect from "./stripeConnect";

// Social Media OAuth Services
import { registerSocialAuthRoutes } from "./socialAuthRoutes";
import { startTokenRefreshService, getTokenRefreshStatus } from "./socialTokenRefresh";

// Social Media Service
import { socialMediaService } from "./socialMediaService";
import { 
  insertSocialMediaAccountSchema, 
  insertSocialMediaPostSchema,
  insertSocialMediaCampaignSchema,
  insertSocialContentCategorySchema,
  insertSocialResponseTemplateSchema,
  insertSocialMediaListenerSchema,
  insertSocialMediaAutomationSchema,
  insertSocialMediaTeamSchema,
  // Blog schemas
  insertBlogPostSchema,
  updateBlogPostSchema,
  insertBlogCategorySchema,
  insertBlogTagSchema,
  insertBlogCommentSchema,
  updateBlogCommentSchema,
  insertBlogReactionSchema,
  insertBlogBookmarkSchema,
  insertBlogSubscriptionSchema,
  insertBlogAnalyticsSchema,
} from "@shared/schema";

// Blog Service
import { blogService } from "./blogService";

// Stripe initialization is handled lazily in stripeConnect module
// No global stripe client needed - stripeConnect handles all Stripe operations

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware with graceful fallback
  console.log("🔧 Starting registerRoutes function");
  console.log("🔧 REPLIT_DOMAINS:", process.env.REPLIT_DOMAINS);
  console.log("🔧 SESSION_SECRET exists:", !!process.env.SESSION_SECRET);
  console.log("🔧 REPL_ID exists:", !!process.env.REPL_ID);
  
  // NOTE: Authentication is now initialized in bootstrap.ts and routes are mounted in router/index.ts
  console.log("✅ Authentication already initialized in bootstrap sequence");
  
  console.log("🔧 Setting up auth routes...");

  // Authentication health check endpoint
  app.get('/api/auth/health', async (_req, res) => {
    try {
      const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        sessionStore: 'unknown',
        database: 'unknown',
        redis: 'unknown'
      };

      // Check session store availability
      try {
        const redisAvailable = await checkRedisConnection().catch(() => false);
        healthData.redis = redisAvailable ? 'connected' : 'disconnected';
        
        if (redisAvailable) {
          healthData.sessionStore = 'redis';
        } else {
          const dbStatus = getDatabaseStatus();
          healthData.database = dbStatus?.isConnected ? 'connected' : 'disconnected';
          healthData.sessionStore = dbStatus?.isConnected ? 'postgresql' : 'memory';
        }
      } catch (err) {
        console.error('Auth health check error:', err);
        healthData.sessionStore = 'error';
      }

      res.json(healthData);
    } catch (error) {
      return ApiResponse.internalError(res, error instanceof Error ? error.message : 'Unknown error', {
        status: 'error',
        timestamp: new Date().toISOString()
      });
    }
});

  // Auth routes
  
  // Session info endpoint (for session expiry warnings)
  app.get('/api/auth/session-info', isAuthenticated, async (req: any, res) => {
    try {
      const session = req.session as any;
      const expires = session.cookie.expires;
      
      // Return expiry time for client-side calculation
      res.json({
        expires: expires ? expires.toISOString() : null,
        maxAge: session.cookie.maxAge,
        isRolling: session.cookie.rolling ?? true
});
    } catch (error) {
      return ApiResponse.internalError(res, "Failed to retrieve session info");
    }
});

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // After deserialization, req.user is the plain user object from database
      // It has 'id' field, not 'claims.sub'
      const userId = req.user?.id || req.user?.claims?.sub;
      const email = req.user?.email || req.user?.claims?.email;

      if (!userId) {
        console.error("❌ /api/auth/user - No user ID found");
        console.error("User object:", JSON.stringify(req.user));
        return ApiResponse.unauthorized(res, "Invalid session: No user ID found");
      }

      console.log(`🔐 /api/auth/user - User authenticated: ${email} (ID: ${userId})`);

      // If req.user is already the full user object (from deserialization), return it directly
      if (req.user.id === userId) {
        console.log(`✅ /api/auth/user - Returning deserialized user: ${req.user.email}`);
        return res.json(req.user);
      }

      // Otherwise fetch from database (shouldn't normally happen after deserialization)
      const user = await storage.getUser(userId);

      if (!user) {
        console.error(`❌ /api/auth/user - User not found in database: ${userId}`);
        return ApiResponse.notFound(res, "User not found");
      }

      console.log(`✅ /api/auth/user - Successfully returned user: ${user.email}`);
      res.json(user);
    } catch (error) {
      console.error("❌ /api/auth/user - Error fetching user:", error);
      console.error("Error stack:", (error as Error).stack);
      return ApiResponse.internalError(res, "Failed to fetch user data");
    }
});

  // Business routes (SECURITY: Rate limited)
  
  // Get all businesses (public endpoint)
  app.get('/api/businesses', publicEndpointRateLimit, asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const category = req.query.category as string | undefined;
    
    const businesses = await storage.getBusinesses(page, limit, category);
    return ApiResponse.success(res, businesses);
  }));

  // Get featured businesses (public endpoint) 
  app.get('/api/businesses/featured', publicEndpointRateLimit, asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 12, 50);
    const businesses = await storage.getFeaturedBusinesses(limit);
    return ApiResponse.success(res, businesses);
  }));

  app.post('/api/businesses', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const businessData = insertBusinessSchema.parse({
        ...req.body,
        ownerId: userId,
});
      
      const business = await storage.createBusiness(businessData);
      res.json(business);
    } catch (error: any) {
      console.error("Error creating business:", error);
      if (error.name === 'ZodError') {
        return ApiResponse.zodValidation(res, error, req);
      }
      return ApiResponse.badRequest(res, "Validation error");
    }
});

  app.get('/api/businesses/search', publicEndpointRateLimit, async (req, res) => {
    try {
      const { q: query = '', category } = req.query;
      const businesses = await storage.searchBusinesses(
        query as string,
        category as string | undefined
      );
      res.json(businesses);
    } catch (error) {
      console.error("Error searching businesses:", error);
      return ApiResponse.internalError(res, "Failed to search businesses");
    }
});

  app.get('/api/businesses/spotlight', async (req, res) => {
    try {
      // Check if rotation is needed and perform it automatically
      await storage.rotateSpotlights();
      
      const spotlights = await storage.getCurrentSpotlights();
      const isEmpty = !spotlights.daily?.length && !spotlights.weekly?.length && !spotlights.monthly?.length;
      if (isEmpty) {
        const trending = await storage.getTrendingBusinesses(6);
        return res.json({
          daily: trending.slice(0, 3),
          weekly: trending.slice(0, 5),
          monthly: trending.slice(0, 1),
          fallback: true,
});
      }
      res.json(spotlights);
    } catch (error) {
      console.error("Error fetching spotlights:", error);
      return ApiResponse.internalError(res, "Failed to fetch spotlights");
    }
});

  app.get('/api/businesses/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const businesses = await storage.getBusinessesByOwner(userId);
      res.json(businesses);
    } catch (error) {
      console.error("Error fetching user businesses:", error);
      return ApiResponse.internalError(res, "Failed to fetch user businesses");
    }
});

  app.get('/api/businesses/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const business = await storage.getBusinessById(id);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      return ApiResponse.internalError(res, "Failed to fetch business");
    }
});

  app.put('/api/businesses/:id', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Check if the business exists and if the user is the owner
      const existingBusiness = await storage.getBusinessById(id);
      if (!existingBusiness) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (existingBusiness.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to edit this business");
      }
      
      const businessData = updateBusinessSchema.parse(req.body);
      const business = await storage.updateBusiness(id, businessData);
      res.json(business);
    } catch (error: any) {
      console.error("Error updating business:", error);
      if (error.name === 'ZodError') {
        return ApiResponse.zodValidation(res, error);
      }
      return ApiResponse.badRequest(res, "Validation error");
    }
});

  app.post('/api/businesses/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      await storage.followBusiness(userId, businessId);
      res.json({ message: "Successfully followed business" });
    } catch (error) {
      console.error("Error following business:", error);
      return ApiResponse.internalError(res, "Failed to follow business");
    }
});

  app.delete('/api/businesses/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      await storage.unfollowBusiness(userId, businessId);
      res.json({ message: "Successfully unfollowed business" });
    } catch (error) {
      console.error("Error unfollowing business:", error);
      return ApiResponse.internalError(res, "Failed to unfollow business");
    }
});

  // =================== GOOGLE MY BUSINESS INTEGRATION ROUTES ===================

  // Initiate GMB OAuth connection for a business
  app.post('/api/businesses/:id/gmb/connect', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to connect GMB for this business");
      }

      // Generate OAuth URL with business ID as state parameter
      const authUrl = gmbService.generateAuthUrl(businessId);
      
      res.json({ 
        success: true,
        authUrl,
        message: "Redirect user to this URL to authorize GMB access"
      });
    } catch (error: any) {
      console.error("Error initiating GMB connection:", error);
      return ApiResponse.internalError(res, error.message || "Failed to initiate GMB connection");
    }
});

  // Handle GMB OAuth callback
  app.get('/api/gmb/oauth/callback', async (req, res) => {
    try {
      const { code, state: businessId, error } = req.query;
      
      if (error) {
        return ApiResponse.badRequest(res, "OAuth authorization failed", { error: error as string });
      }
      
      if (!code || !businessId) {
        return ApiResponse.badRequest(res, "Missing authorization code or business ID");
      }

      // Get business to find owner
      const business = await storage.getBusinessById(businessId as string);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }

      // Exchange code for tokens
      await gmbService.exchangeCodeForTokens(
        code as string, 
        businessId as string, 
        business.ownerId
      );

      // Redirect to business profile page with success message
      res.redirect(`/business/${businessId}?gmb=connected`);
    } catch (error: any) {
      console.error("Error in GMB OAuth callback:", error);
      return ApiResponse.internalError(res, error.message || "Failed to complete GMB connection");
    }
});

  // Search for GMB listings for business verification
  app.get('/api/gmb/search', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { businessId } = req.query;
      
      if (!businessId) {
        return ApiResponse.badRequest(res, "Business ID is required");
      }

      const userId = req.user.claims.sub;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId as string);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to search GMB for this business");
      }

      // Search for GMB matches
      const searchResults = await businessVerificationService.searchGMBMatches(businessId as string);
      
      res.json(searchResults);
    } catch (error: any) {
      console.error("Error searching GMB listings:", error);
      return ApiResponse.internalError(res, error.message || "Failed to search GMB listings");
    }
});

  // Initiate business verification with selected GMB listing
  app.post('/api/businesses/:id/gmb/verify', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      const validationResult = gmbVerifyRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return ApiResponse.zodValidation(res, validationResult.error);
      }
      const { gmbLocationName } = validationResult.data;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to verify this business");
      }

      // Initiate verification process
      const result = await businessVerificationService.initiateVerification(
        businessId, 
        gmbLocationName
      );
      
      res.json(result);
    } catch (error: any) {
      console.error("Error initiating business verification:", error);
      return ApiResponse.internalError(res, error.message || "Failed to initiate verification");
    }
});

  // Get GMB verification and connection status
  app.get('/api/businesses/:id/gmb/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      // Verify business ownership (allow read access for any authenticated user)
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      // For detailed status, require ownership
      const isOwner = business.ownerId === userId;
      
      if (isOwner) {
        // Full status for owners
        const status = await businessVerificationService.getVerificationStatus(businessId);
        const syncStatus = await gmbService.getSyncStatus(businessId);
        
        res.json({
          ...status,
          syncDetails: syncStatus
});
      } else {
        // Public status for non-owners
        res.json({
          isVerified: business.gmbVerified || false,
          isConnected: business.gmbConnected || false
});
      }
    } catch (error: any) {
      console.error("Error fetching GMB status:", error);
      return ApiResponse.internalError(res, error.message || "Failed to fetch GMB status");
    }
});

  // Manual data synchronization trigger
  app.post('/api/businesses/:id/gmb/sync', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      const validationResult = gmbSyncRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return ApiResponse.zodValidation(res, validationResult.error, req);
      }
      const { forceUpdate, syncPhotos, syncReviews, syncBusinessInfo, conflictResolution } = validationResult.data;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to sync this business");
      }

      // Check if business is connected to GMB
      if (!business.gmbConnected) {
        return ApiResponse.badRequest(res, "Business is not connected to Google My Business");
      }

      // Perform data synchronization
      const syncResult = await dataSyncService.performFullSync(businessId, {
        forceUpdate,
        syncPhotos,
        syncReviews,
        syncBusinessInfo,
        conflictResolution
});
      
      res.json(syncResult);
    } catch (error: any) {
      console.error("Error syncing business data:", error);
      return ApiResponse.internalError(res, error.message || "Failed to sync business data");
    }
});

  // Get data synchronization status and history
  app.get('/api/businesses/:id/gmb/sync/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to view sync status for this business");
      }

      // Get sync status and recent history
      const syncStatus = await gmbService.getSyncStatus(businessId);
      
      res.json(syncStatus);
    } catch (error: any) {
      console.error("Error fetching sync status:", error);
      return ApiResponse.internalError(res, error.message || "Failed to fetch sync status");
    }
});

  // Get GMB reviews for a business
  app.get('/api/businesses/:id/gmb/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      // Verify business ownership (or allow public read if specified)
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      // Allow owners and public access to reviews
      const isOwner = business.ownerId === userId;
      
      const reviews = await storage.getGmbReviewsByBusiness(businessId);
      
      // Filter sensitive information for non-owners if needed
      const filteredReviews = reviews.map(review => ({
        id: review.id,
        reviewerName: review.reviewerName,
        reviewerPhotoUrl: review.reviewerPhotoUrl,
        rating: review.rating,
        comment: review.comment,
        reviewTime: review.reviewTime,
        replyComment: review.replyComment,
        replyTime: review.replyTime,
        // Only include GMB IDs for owners
        ...(isOwner && { 
          gmbReviewId: review.gmbReviewId,
          gmbCreateTime: review.gmbCreateTime,
          gmbUpdateTime: review.gmbUpdateTime 
        })
      }));
      
      res.json(filteredReviews);
    } catch (error: any) {
      console.error("Error fetching GMB reviews:", error);
      return ApiResponse.internalError(res, error.message || "Failed to fetch GMB reviews");
    }
});

  // Disconnect GMB integration
  app.delete('/api/businesses/:id/gmb/disconnect', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to disconnect GMB for this business");
      }

      // Disconnect GMB integration
      await gmbService.disconnectBusiness(businessId);
      
      res.json({ 
        success: true,
        message: "Successfully disconnected from Google My Business"
      });
    } catch (error: any) {
      console.error("Error disconnecting GMB:", error);
      return ApiResponse.internalError(res, error.message || "Failed to disconnect GMB");
    }
});

  // GMB Webhook endpoint for real-time updates (if Google supports it)
  app.post('/api/gmb/webhook', async (req, res) => {
    try {
      // Verify webhook signature if Google provides one
      // This is a placeholder for webhook implementation
      
      const payload = req.body;
      console.log('Received GMB webhook:', payload);
      
      // Process webhook payload
      // In a real implementation, you'd:
      // 1. Verify the webhook signature
      // 2. Parse the payload
      // 3. Trigger appropriate sync operations
      // 4. Update business data based on webhook content
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error processing GMB webhook:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Admin endpoint to get GMB integration statistics
  app.get('/api/admin/gmb/stats', isAdmin, adminRateLimit, async (req: any, res) => {
    try {
      // Get GMB integration statistics
      const stats = await storage.getGMBIntegrationStats();
      
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching GMB stats:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // =================== GMB REVIEW MANAGEMENT ROUTES ===================
  
  // Fetch and sync GMB reviews
  app.post('/api/businesses/:id/gmb/reviews/fetch', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to fetch reviews for this business");
      }
      
      // Fetch reviews from GMB
      const result = await gmbReviewService.fetchReviews(businessId);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching GMB reviews:", error);
      return ApiResponse.internalError(res, error.message || "Failed to fetch reviews");
    }
  });
  
  // Reply to a review
  app.post('/api/businesses/:id/gmb/reviews/:reviewId/reply', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId, reviewId } = req.params;
      const { replyText } = req.body;
      
      if (!replyText || replyText.length < 10) {
        return ApiResponse.badRequest(res, "Reply text must be at least 10 characters");
      }
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to reply to reviews for this business");
      }
      
      await gmbReviewService.replyToReview(businessId, reviewId, replyText);
      res.json({ message: "Reply posted successfully" });
    } catch (error: any) {
      console.error("Error replying to review:", error);
      return ApiResponse.internalError(res, error.message || "Failed to post reply");
    }
  });
  
  // Get review insights and analytics
  app.get('/api/businesses/:id/gmb/reviews/insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to view review insights");
      }
      
      const insights = await gmbReviewService.generateInsights(businessId);
      res.json(insights);
    } catch (error: any) {
      console.error("Error generating review insights:", error);
      return ApiResponse.internalError(res, error.message || "Failed to generate insights");
    }
  });
  
  // Monitor review sentiment
  app.get('/api/businesses/:id/gmb/reviews/monitor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to monitor reviews");
      }
      
      const alerts = await gmbReviewService.monitorSentiment(businessId);
      res.json(alerts);
    } catch (error: any) {
      console.error("Error monitoring reviews:", error);
      return ApiResponse.internalError(res, error.message || "Failed to monitor reviews");
    }
  });
  
  // =================== GMB POSTS MANAGEMENT ROUTES ===================
  
  // Create a GMB post
  app.post('/api/businesses/:id/gmb/posts', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const postData = req.body;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to create posts for this business");
      }
      
      const post = await gmbPostService.createPost(businessId, postData);
      res.json(post);
    } catch (error: any) {
      console.error("Error creating GMB post:", error);
      return ApiResponse.internalError(res, error.message || "Failed to create post");
    }
  });
  
  // Get all posts for a business
  app.get('/api/businesses/:id/gmb/posts', isAuthenticated, async (req: any, res) => {
    try {
      const { id: businessId } = req.params;
      
      // Verify business exists
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      const posts = await gmbPostService.getBusinessPosts(businessId);
      res.json(posts);
    } catch (error: any) {
      console.error("Error fetching GMB posts:", error);
      return ApiResponse.internalError(res, error.message || "Failed to fetch posts");
    }
  });
  
  // Update a post
  app.patch('/api/businesses/:id/gmb/posts/:postId', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId, postId } = req.params;
      const updates = req.body;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to update posts");
      }
      
      const post = await gmbPostService.updatePost(postId, updates);
      res.json(post);
    } catch (error: any) {
      console.error("Error updating GMB post:", error);
      return ApiResponse.internalError(res, error.message || "Failed to update post");
    }
  });
  
  // Delete a post
  app.delete('/api/businesses/:id/gmb/posts/:postId', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId, postId } = req.params;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to delete posts");
      }
      
      await gmbPostService.deletePost(postId);
      res.json({ message: "Post deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting GMB post:", error);
      return ApiResponse.internalError(res, error.message || "Failed to delete post");
    }
  });
  
  // Get post metrics
  app.get('/api/businesses/:id/gmb/posts/:postId/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const { id: businessId, postId } = req.params;
      
      const metrics = await gmbPostService.getPostMetrics(postId);
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching post metrics:", error);
      return ApiResponse.internalError(res, error.message || "Failed to fetch metrics");
    }
  });
  
  // Generate AI post content
  app.post('/api/businesses/:id/gmb/posts/generate', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const { type, topic, tone, includeEmoji } = req.body;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }
      
      const content = await gmbPostService.generatePostContent(businessId, {
        type, topic, tone, includeEmoji
      });
      res.json(content);
    } catch (error: any) {
      console.error("Error generating post content:", error);
      return ApiResponse.internalError(res, error.message || "Failed to generate content");
    }
  });
  
  // =================== GMB INSIGHTS ROUTES ===================
  
  // Fetch location insights
  app.get('/api/businesses/:id/gmb/insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const { startDate, endDate, includeCompetitors } = req.query;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to view insights");
      }
      
      const dateRange = {
        start: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate as string) : new Date()
      };
      
      const insights = await gmbInsightsService.fetchLocationInsights(businessId, {
        dateRange,
        includeCompetitors: includeCompetitors === 'true'
      });
      res.json(insights);
    } catch (error: any) {
      console.error("Error fetching insights:", error);
      return ApiResponse.internalError(res, error.message || "Failed to fetch insights");
    }
  });
  
  // Generate performance report
  app.post('/api/businesses/:id/gmb/insights/report', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const { reportType, format } = req.body;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }
      
      const report = await gmbInsightsService.generateReport(businessId, {
        reportType,
        format
      });
      res.json(report);
    } catch (error: any) {
      console.error("Error generating report:", error);
      return ApiResponse.internalError(res, error.message || "Failed to generate report");
    }
  });
  
  // Track performance trends
  app.get('/api/businesses/:id/gmb/insights/trends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const { metricType, periods } = req.query;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }
      
      const trends = await gmbInsightsService.trackPerformanceTrend(
        businessId,
        metricType as any,
        parseInt(periods as string) || 12
      );
      res.json(trends);
    } catch (error: any) {
      console.error("Error tracking trends:", error);
      return ApiResponse.internalError(res, error.message || "Failed to track trends");
    }
  });
  
  // Get actionable insights
  app.get('/api/businesses/:id/gmb/insights/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }
      
      const recommendations = await gmbInsightsService.getActionableInsights(businessId);
      res.json(recommendations);
    } catch (error: any) {
      console.error("Error getting recommendations:", error);
      return ApiResponse.internalError(res, error.message || "Failed to get recommendations");
    }
  });
  
  // =================== GMB ENHANCED SYNC ROUTES ===================
  
  // Configure sync settings
  app.post('/api/businesses/:id/gmb/sync/configure', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const config = req.body;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }
      
      await gmbSyncService.configureSyncSettings({
        businessId,
        ...config
      });
      res.json({ message: "Sync configuration updated successfully" });
    } catch (error: any) {
      console.error("Error configuring sync:", error);
      return ApiResponse.internalError(res, error.message || "Failed to configure sync");
    }
  });
  
  // Start sync session
  app.post('/api/businesses/:id/gmb/sync/start', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const { type, dataTypes, force } = req.body;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }
      
      const session = await gmbSyncService.startSync(businessId, {
        type,
        dataTypes,
        force
      });
      res.json(session);
    } catch (error: any) {
      console.error("Error starting sync:", error);
      return ApiResponse.internalError(res, error.message || "Failed to start sync");
    }
  });
  
  // Get sync session status
  app.get('/api/businesses/:id/gmb/sync/session/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId, sessionId } = req.params;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }
      
      const status = gmbSyncService.getSyncStatus(sessionId);
      if (!status) {
        return ApiResponse.notFound(res, "Sync session not found");
      }
      
      res.json(status);
    } catch (error: any) {
      console.error("Error getting sync status:", error);
      return ApiResponse.internalError(res, error.message || "Failed to get sync status");
    }
  });
  
  // Cancel sync session
  app.post('/api/businesses/:id/gmb/sync/cancel/:sessionId', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId, sessionId } = req.params;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }
      
      gmbSyncService.cancelSync(sessionId);
      res.json({ message: "Sync cancelled successfully" });
    } catch (error: any) {
      console.error("Error cancelling sync:", error);
      return ApiResponse.internalError(res, error.message || "Failed to cancel sync");
    }
  });
  
  // Get sync history
  app.get('/api/businesses/:id/gmb/sync/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const { limit, offset } = req.query;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }
      
      const history = await gmbSyncService.getSyncHistory(businessId, {
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0
      });
      res.json(history);
    } catch (error: any) {
      console.error("Error getting sync history:", error);
      return ApiResponse.internalError(res, error.message || "Failed to get sync history");
    }
  });
  
  // Generate sync report
  app.get('/api/businesses/:id/gmb/sync/report', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }
      
      const dateRange = {
        start: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate as string) : new Date()
      };
      
      const report = await gmbSyncService.generateSyncReport(businessId, dateRange);
      res.json(report);
    } catch (error: any) {
      console.error("Error generating sync report:", error);
      return ApiResponse.internalError(res, error.message || "Failed to generate report");
    }
  });
  
  // GMB Health Check endpoint for monitoring
  app.get('/api/gmb/health', async (req, res) => {
    try {
      // Import gmbErrorHandler here to avoid circular dependencies
      const { gmbErrorHandler } = await import('./gmbErrorHandler');
      
      const healthStatus = gmbErrorHandler.getHealthStatus();
      const integrationStats = await storage.getGMBIntegrationStats();
      
      const overallHealth = {
        ...healthStatus,
        integrationStats,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      };
      
      const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                        healthStatus.status === 'degraded' ? 200 : 503;
      
      res.status(httpStatus).json(overallHealth);
    } catch (error: any) {
      console.error("Error in GMB health check:", error);
      res.status(503).json({ 
        status: 'unhealthy',
  error: error.message,        timestamp: new Date().toISOString()
});
    }
});

  // =================== END GMB INTEGRATION ROUTES ===================

  // =================== STRIPE CONNECT VENDOR PAYOUT ROUTES ===================

  // Get Stripe Connect account status for a business
  app.get('/api/businesses/:id/stripe/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }

      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to view Stripe status for this business");
      }

      if (!business.stripeAccountId) {
        return ApiResponse.notFound(res, "Stripe Connect account not found");
      }

      // Get account details
      const account = await stripeConnect.getConnectAccount(business.stripeAccountId);
      if (!account) {
        return ApiResponse.notFound(res, "Stripe account not found");
      }

      const onboardingComplete = stripeConnect.isAccountOnboarded(account);

      res.json({
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        onboardingComplete,
        requirements: account.requirements,
        payoutSchedule: account.settings?.payouts?.schedule,
});
    } catch (error: any) {
      console.error("Error fetching Stripe status:", error);
      return ApiResponse.internalError(res, error.message || "Failed to fetch Stripe status");
    }
});

  // Get account balance for a business
  app.get('/api/businesses/:id/stripe/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }

      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to view balance for this business");
      }

      if (!business.stripeAccountId) {
        return ApiResponse.notFound(res, "Stripe Connect account not found");
      }

      // Get balance
      const balance = await stripeConnect.getAccountBalance(business.stripeAccountId);
      if (!balance) {
        return ApiResponse.notFound(res, "Balance data not found");
      }

      res.json({
        available: balance.available,
        pending: balance.pending,
});
    } catch (error: any) {
      console.error("Error fetching Stripe balance:", error);
      return ApiResponse.internalError(res, error.message || "Failed to fetch Stripe balance");
    }
});

  // List payouts for a business
  app.get('/api/businesses/:id/stripe/payouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }

      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to view payouts for this business");
      }

      if (!business.stripeAccountId) {
        return ApiResponse.notFound(res, "Stripe Connect account not found");
      }

      // List payouts
      const result = await stripeConnect.listPayouts(business.stripeAccountId, limit);
      if (!result) {
        return ApiResponse.notFound(res, "Payout data not found");
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error fetching Stripe payouts:", error);
      return ApiResponse.internalError(res, error.message || "Failed to fetch Stripe payouts");
    }
});

  // List balance transactions for a business
  app.get('/api/businesses/:id/stripe/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const startingAfter = req.query.startingAfter as string | undefined;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }

      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to view transactions for this business");
      }

      if (!business.stripeAccountId) {
        return ApiResponse.notFound(res, "Stripe Connect account not found");
      }

      // List transactions
      const result = await stripeConnect.listBalanceTransactions(business.stripeAccountId, {
        limit,
        startingAfter,
});
      if (!result) {
        return ApiResponse.notFound(res, "Transaction data not found");
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error fetching Stripe transactions:", error);
      return ApiResponse.internalError(res, error.message || "Failed to fetch Stripe transactions");
    }
});

  // Create a manual payout for a business
  app.post('/api/businesses/:id/stripe/payouts', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      const validationResult = stripePayoutRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return ApiResponse.badRequest(res, "Validation error", { errors: validationResult.error.errors });
      }
      const { amount, description } = validationResult.data;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }

      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to create payouts for this business");
      }

      if (!business.stripeAccountId) {
        return ApiResponse.notFound(res, "Stripe Connect account not found");
      }

      // Check available balance
      const balance = await stripeConnect.getAccountBalance(business.stripeAccountId);
      if (!balance) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      const availableBalance = balance.available.find(b => b.currency === 'usd');
      if (!availableBalance || availableBalance.amount < amount) {
        return ApiResponse.badRequest(res, "Insufficient balance for payout", {
          available: availableBalance?.amount || 0,
          requested: amount,
});
      }

      // Create payout
      const payout = await stripeConnect.createPayout(
        business.stripeAccountId,
        amount,
        'usd',
        description
      );

      if (!payout) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      res.json(payout);
    } catch (error: any) {
      console.error("Error creating Stripe payout:", error);
      return ApiResponse.internalError(res, error.message || "Failed to create Stripe payout");
    }
});

  // Update payout settings for a business
  app.post('/api/businesses/:id/stripe/payout-settings', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      const validationResult = stripePayoutSettingsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return ApiResponse.badRequest(res, "Validation error", {
          errors: validationResult.error.errors 
});
      }
      const { interval, delayDays } = validationResult.data;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }

      if (business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to update payout settings for this business");
      }

      if (!business.stripeAccountId) {
        return ApiResponse.notFound(res, "Stripe Connect account not found");
      }

      // Update payout settings
      const updatedAccount = await stripeConnect.updatePayoutSettings(
        business.stripeAccountId,
        { interval, delayDays }
      );

      if (!updatedAccount) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      res.json({
        accountId: updatedAccount.id,
        payoutSchedule: updatedAccount.settings?.payouts?.schedule,
});
    } catch (error: any) {
      console.error("Error updating Stripe payout settings:", error);
      return ApiResponse.internalError(res, error.message || "Failed to update Stripe payout settings");
    }
});

  // Stripe Connect webhook endpoint
  app.post('/api/stripe/connect/webhook', async (req, res) => {
    try {

      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("STRIPE_WEBHOOK_SECRET not configured");
        return ApiResponse.internalError(res, "Webhook secret not configured");
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return ApiResponse.badRequest(res, "Webhook signature verification failed");
      }

      // Handle the event
      await stripeConnect.handleConnectWebhook(event, storage);

      res.json({ received: true });
    } catch (error: any) {
      console.error("Error processing Stripe webhook:", error);
      return ApiResponse.internalError(res, error.message || "Failed to process webhook");
    }
});

  // =================== END STRIPE CONNECT ROUTES ===================

  app.get('/api/businesses/:id/following', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      const isFollowing = await storage.isFollowingBusiness(userId, businessId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Delete business endpoint
  app.delete('/api/businesses/:id', strictRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Check if the business exists and if the user is the owner
      const existingBusiness = await storage.getBusinessById(id);
      if (!existingBusiness) {
        return ApiResponse.notFound(res, "Business not found");
      }
      
      if (existingBusiness.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to delete this business");
      }
      
      await storage.deleteBusiness(id);
      res.json({ message: "Business deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting business:", error);
      return res.status(400).json({ message: "Validation error" });
    }
});

  // Enhanced Spotlight Management Routes
  
  // SECURITY: Admin-only manual spotlight rotation with enhanced guards
  app.post('/api/spotlight/rotate', isAuthenticated, isAdmin, adminRateLimit, async (req: any, res) => {
    try {
      console.log(`Admin spotlight rotation requested by: ${req.adminUser.email} (${req.adminUser.id})`);
      
      // SECURITY: Check if manual rotation is allowed
      const rotationCheck = await storage.canPerformManualRotation();
      if (!rotationCheck.canRotate) {
        return res.status(429).json({ message: "Rate limited" });
      }

      await storage.rotateSpotlights();
      res.json({ message: "Spotlight rotation triggered successfully",
        triggeredBy: req.adminUser.email,
        timestamp: new Date().toISOString()
});
    } catch (error) {
      console.error("Error in admin spotlight rotation:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Get spotlight history for a business
  app.get('/api/businesses/:id/spotlight-history', async (req, res) => {
    try {
      const { id } = req.params;
      const history = await storage.getSpotlightHistory(id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching spotlight history:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Get engagement metrics for a business
  app.get('/api/businesses/:id/engagement-metrics', async (req, res) => {
    try {
      const { id } = req.params;
      const metrics = await storage.getEngagementMetrics(id);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching engagement metrics:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Calculate and update engagement metrics for a business
  app.post('/api/businesses/:id/calculate-metrics', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const metrics = await storage.calculateEngagementMetrics(id);
      res.json(metrics);
    } catch (error) {
      console.error("Error calculating metrics:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Get business score for spotlight eligibility
  app.get('/api/businesses/:id/score', async (req, res) => {
    try {
      const { id } = req.params;
      const score = await storage.getBusinessScore(id);
      res.json({ score });
    } catch (error) {
      console.error("Error fetching business score:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Monthly spotlight voting endpoints
  
  // Vote for a business for monthly spotlight (SECURITY: Rate limited)
  app.post('/api/spotlight/vote', votingRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validationResult = spotlightVoteSchema.safeParse(req.body);
      if (!validationResult.success) {
        return ApiResponse.badRequest(res, "Validation error", {
          errors: validationResult.error.errors 
});
      }
      const { businessId } = validationResult.data;

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // SECURITY: Check if user has already voted THIS MONTH (only one vote per month total)
      const hasVoted = await storage.hasUserVoted(userId, currentMonth);
      if (hasVoted) {
        const existingVote = await storage.getUserVoteForMonth(userId, currentMonth);
        return ApiResponse.badRequest(res, "You have already voted this month", { 
          votedBusinessId: existingVote?.businessId 
});
      }

      // Verify business exists and is eligible
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }

      const eligibleBusinesses = await storage.getEligibleBusinesses('monthly');
      const isEligible = eligibleBusinesses.some(b => b.id === businessId);
      if (!isEligible) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      const vote = await storage.createSpotlightVote({
        businessId,
        userId,
        month: currentMonth,
});

      res.json({ message: "Vote recorded successfully", vote });
    } catch (error: any) {
      console.error("Error recording vote:", error);
      
      // Handle unique constraint violation
      if (error.code === '23505' || error.constraint?.includes('unique_user_month_vote')) {
        return ApiResponse.badRequest(res, "Validation error");
      }
      
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Get monthly vote counts
  app.get('/api/spotlight/votes/:month', async (req, res) => {
    try {
      const { month } = req.params;
      
      // Validate month format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      const voteCounts = await storage.getMonthlyVoteCounts(month);
      res.json(voteCounts);
    } catch (error) {
      console.error("Error fetching vote counts:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Get user's current vote status for a specific month (for UI state management)
  app.get('/api/spotlight/user-vote/:month', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { month } = req.params;
      
      // Validate month format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return ApiResponse.badRequest(res, "Validation error");
      }
      
      const userVote = await storage.getUserVoteForMonth(userId, month);
      res.json({ 
        hasVoted: !!userVote,
        votedBusinessId: userVote?.businessId || null,
        voteDate: userVote?.createdAt || null
});
    } catch (error) {
      console.error("Error checking user vote status:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // DEPRECATED: Legacy endpoint - keeping for backwards compatibility  
  app.get('/api/spotlight/votes/:month/:businessId/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { month } = req.params;
      
      const userVote = await storage.getUserVoteForMonth(userId, month);
      res.json({ 
        hasVoted: !!userVote,
        votedBusinessId: userVote?.businessId 
});
    } catch (error) {
      console.error("Error checking vote status:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Get eligible businesses for spotlight voting
  app.get('/api/spotlight/eligible/:type', async (req, res) => {
    try {
      const { type } = req.params;

      if (!['daily', 'weekly', 'monthly'].includes(type)) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      const eligibleBusinesses = await storage.getEligibleBusinesses(type as 'daily' | 'weekly' | 'monthly');
      res.json(eligibleBusinesses);
    } catch (error) {
      console.error("Error fetching eligible businesses:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Voting Interface Endpoints
  app.get('/api/spotlight/voting/eligible', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      // Get businesses eligible for monthly spotlight voting
      // These should be active, verified businesses with good standing
      const businesses = await storage.getEligibleForVoting(limit);
      res.json(businesses);
    } catch (error) {
      console.error("Error fetching eligible voting businesses:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.get('/api/spotlight/voting/stats', async (req, res) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const stats = await storage.getVotingStats(currentMonth);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching voting stats:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.get('/api/spotlight/voting/my-votes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentMonth = new Date().toISOString().slice(0, 7);
      const votes = await storage.getUserVotes(userId, currentMonth);
      res.json(votes);
    } catch (error) {
      console.error("Error fetching user votes:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Trending Businesses Endpoint
  app.get('/api/businesses/trending', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trending = await storage.getTrendingBusinesses(limit);
      res.json(trending);
    } catch (error) {
      console.error("Error fetching trending businesses:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Community Leaderboard Endpoints
  app.get('/api/leaderboard/businesses', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getTopBusinesses(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching business leaderboard:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.get('/api/leaderboard/voters', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getTopVoters(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching voters leaderboard:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.get('/api/leaderboard/reviewers', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getTopReviewers(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching reviewers leaderboard:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.get('/api/leaderboard/buyers', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getTopBuyers(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching buyers leaderboard:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Admin endpoints for manual spotlight management
  
  // SECURITY: Admin-only daily spotlight selection
  app.post('/api/admin/spotlight/daily', isAuthenticated, isAdmin, adminRateLimit, async (req: any, res) => {
    try {
      console.log(`Admin daily spotlight selection by: ${req.adminUser.email}`);
      const selectedBusinesses = await storage.selectDailySpotlights();
      res.json({ message: "Daily spotlights selected successfully", 
        businesses: selectedBusinesses,
        selectedBy: req.adminUser.email
});
    } catch (error) {
      console.error("Error in admin daily spotlight selection:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // SECURITY: Admin-only weekly spotlight selection
  app.post('/api/admin/spotlight/weekly', isAuthenticated, isAdmin, adminRateLimit, async (req: any, res) => {
    try {
      console.log(`Admin weekly spotlight selection by: ${req.adminUser.email}`);
      const selectedBusinesses = await storage.selectWeeklySpotlights();
      res.json({ message: "Weekly spotlights selected successfully", 
        businesses: selectedBusinesses,
        selectedBy: req.adminUser.email
});
    } catch (error) {
      console.error("Error in admin weekly spotlight selection:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // SECURITY: Admin-only monthly spotlight selection
  app.post('/api/admin/spotlight/monthly', isAuthenticated, isAdmin, adminRateLimit, async (req: any, res) => {
    try {
      console.log(`Admin monthly spotlight selection by: ${req.adminUser.email}`);
      const selectedBusinesses = await storage.selectMonthlySpotlight();
      res.json({ message: "Monthly spotlight selected successfully", 
        businesses: selectedBusinesses,
        selectedBy: req.adminUser.email
});
    } catch (error) {
      console.error("Error in admin monthly spotlight selection:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // SECURITY: Admin-only spotlight history access
  app.get('/api/admin/spotlight/history/:type/:days', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { type, days } = req.params;
      
      if (!['daily', 'weekly', 'monthly'].includes(type)) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      const daysNum = parseInt(days);
      if (isNaN(daysNum) || daysNum < 1 || daysNum > 90) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      const history = await storage.getRecentSpotlightHistory(
        type as 'daily' | 'weekly' | 'monthly', 
        daysNum
      );
      res.json({
        history,
        requestedBy: req.adminUser.email,
        type,
        days: daysNum
});
    } catch (error) {
      console.error("Error fetching admin spotlight history:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // SECURITY: Admin-only spotlight archiving
  app.post('/api/admin/spotlight/archive', isAuthenticated, isAdmin, adminRateLimit, async (req: any, res) => {
    try {
      console.log(`Admin spotlight archiving by: ${req.adminUser.email}`);
      await storage.archiveExpiredSpotlights();
      res.json({ message: "Expired spotlights archived successfully",
        archivedBy: req.adminUser.email,
        timestamp: new Date().toISOString()
});
    } catch (error) {
      console.error("Error in admin spotlight archiving:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Object Storage routes - for serving public assets
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return ApiResponse.notFound(res, "File not found");
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Object Storage routes - for serving private objects (with ACL)
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
});
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
});
  
  // Serve stock images for demo
  app.use('/stock-images', express.static(path.join(process.cwd(), 'client/src/assets/stock_images')));
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

  // Stable public route for serving uploaded images
  app.get("/api/images/public/:objectId", async (req, res) => {
    const { objectId } = req.params;
    const objectStorageService = new ObjectStorageService();
    
    try {
      // Sanitize object ID to prevent path traversal
      if (!objectId || !/^[a-zA-Z0-9\-_]+$/.test(objectId)) {
        return ApiResponse.badRequest(res, "Validation error");
      }
      
      const objectPath = `/objects/uploads/${objectId}`;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      
      // Check if object is public (no auth required for public objects)
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: undefined, // No user ID for public access
        requestedPermission: ObjectPermission.READ,
});
      
      if (!canAccess) {
        return ApiResponse.forbidden(res, "Access denied - image not public");
      }
      
      // Set cache headers for better performance
      res.set({
        'Cache-Control': 'public, max-age=86400', // 24 hours
        'ETag': `"${objectId}"`,
});
      
      // Check ETag for conditional requests
      const clientETag = req.headers['if-none-match'];
      if (clientETag === `"${objectId}"`) {
        return res.status(304).end();
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving public image:", error);
      if (error instanceof ObjectNotFoundError) {
        return ApiResponse.notFound(res, "Image not found");
      }
      return ApiResponse.internalError(res, "Failed to serve image");
    }
});

  // Upload endpoint - get presigned URL for object upload with validation
  app.post("/api/objects/upload", isAuthenticated, async (req: any, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const validationResult = objectUploadRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return ApiResponse.badRequest(res, "Validation error", {
          errors: validationResult.error.errors 
});
      }
      const { fileType, fileSize } = validationResult.data;
      
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      return ApiResponse.internalError(res, "Failed to get upload URL");
    }
});

  // Update business images endpoint - set ACL policies after upload
  app.put("/api/business-images", isAuthenticated, async (req: any, res) => {
    const validationResult = businessImageUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.error("[BusinessImages] Validation failed:", validationResult.error.errors);
      return res.status(400).json({
        error: "Validation error",
        message: "Invalid request data",
        errors: validationResult.error.errors
      });
    }
    const { imageURL } = validationResult.data;
    const userId = req.user?.claims?.sub;

    console.log("[BusinessImages] Processing image ACL:", {
      userId,
      imageURLPreview: imageURL.substring(0, 100) + '...'
    });

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        imageURL,
        {
          owner: userId,
          // Business images should be public so they can be displayed to all users
          visibility: "public",
        },
      );

      console.log("[BusinessImages] ACL set successfully, object path:", objectPath);

      // Extract object ID from path for public URL
      const objectId = objectStorageService.extractObjectIdFromPath(objectPath);
      const publicURL = `/api/images/public/${objectId}`;

      console.log("[BusinessImages] Generated public URL:", publicURL);

      res.status(200).json({
        objectPath: objectPath,
        publicURL: publicURL,
      });
    } catch (error: any) {
      console.error("[BusinessImages] Error setting business image:", error);
      return res.status(500).json({
        error: "Failed to process image",
        message: error.message || "Internal server error",
        details: error.stack
      });
    }
  });

  // Product routes (SECURITY: Rate limited)
  app.post('/api/products', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      console.error("Error creating product:", error);
      if (error.name === 'ZodError') {
        return ApiResponse.zodValidation(res, error);
      }
      return ApiResponse.badRequest(res, "Validation error");
    }
});

  app.get('/api/products/search', publicEndpointRateLimit, async (req, res) => {
    try {
      const q = (req.query.q as string) || '';
      const categories = typeof req.query.categories === 'string'
        ? String(req.query.categories).split(',').filter(Boolean)
        : (req.query.categories as string[]) || [];
      const minPrice = req.query.minPrice ? parseFloat(String(req.query.minPrice)) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(String(req.query.maxPrice)) : undefined;
      const inStock = req.query.inStock ? String(req.query.inStock) === 'true' : undefined;
      const isDigital = req.query.isDigital ? String(req.query.isDigital) === 'true' : undefined;
      const minRating = req.query.minRating ? parseFloat(String(req.query.minRating)) : undefined;
      const tags = typeof req.query.tags === 'string'
        ? String(req.query.tags).split(',').filter(Boolean)
        : (req.query.tags as string[]) || [];
      const sort = (req.query.sort as any) || 'rating_desc';
      const page = req.query.page ? parseInt(String(req.query.page)) : 1;
      const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 24;

      const { items, total } = await storage.searchProducts(q, {
        categories,
        minPrice,
        maxPrice,
        inStock,
        isDigital,
        minRating,
        tags,
        sort,
        page,
        pageSize,
        includeTotal: true,
});

      res.json({ items, total, page, pageSize });
    } catch (error) {
      console.error("Error searching products:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Get all products (public endpoint)
  app.get('/api/products', publicEndpointRateLimit, asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const category = req.query.category as string | undefined;
    
    const products = await storage.getProducts(page, limit, category);
    return ApiResponse.success(res, products);
  }));

  app.get('/api/products/featured', async (req, res) => {
    try {
      const limitParam = parseInt(req.query.limit as string);
      const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20;
      const unique = (req.query.unique as string) === 'images';

      // Over-fetch to allow dedupe by primary image signature
      const overFetch = Math.max(limit * 8, 200);
      const raw = await storage.getFeaturedProducts(overFetch);

      if (!unique) {
        return res.json(raw.slice(0, limit));
      }

      // Dedupe featured products by normalized primary image signature
      const seen = new Set<string>();
      const out: typeof raw = [];
      for (const p of raw) {
        const first = Array.isArray((p as any).images) && (p as any).images[0] ? String((p as any).images[0]) : '';
        const sig = normalizeImageSignature(first || fallbackSignatureFor(p));
        if (seen.has(sig)) continue;
        seen.add(sig);
        out.push(p);
        if (out.length >= limit) break;
      }
      return res.json(out);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  function normalizeImageSignature(url: string): string {
    try {
      const u = new URL(url, 'https://placeholder.local');
      const host = (u.host || '').toLowerCase();
      const path = u.pathname.replace(/\/original$/, '').toLowerCase();
      return `${host}${path}`;
    } catch {
      return (url || '').toLowerCase().split('?')[0];
    }
  }
  function fallbackSignatureFor(p: any): string {
    const category = (p.category || 'default').toLowerCase();
    const id: string = String(p.id || '');
    let seed = 0;
    for (let i = 0; i < id.length; i++) seed = ((seed << 5) - seed) + id.charCodeAt(i);
    const bucket = Math.abs(seed) % 8;
    return `fallback://${category}/${bucket}`;
  }

  app.get('/api/businesses/:id/products', async (req, res) => {
    try {
      const { id: businessId } = req.params;
      const products = await storage.getProductsByBusiness(businessId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching business products:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.put('/api/products/:id', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: productId } = req.params;
      
      // Get product and verify ownership through business
      const product = await storage.getProductById(productId);
      if (!product) {
        return ApiResponse.notFound(res, "Product not found");
      }
      
      const business = await storage.getBusinessById(product.businessId);
      if (!business || business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to edit this product");
      }
      
      const productData = insertProductSchema.parse({
        ...req.body,
        businessId: product.businessId, // Preserve original business
});
      
      const updatedProduct = await storage.updateProduct(productId, productData);
      res.json(updatedProduct);
    } catch (error: any) {
      console.error("Error updating product:", error);
      return res.status(400).json({ message: "Validation error" });
    }
});

  // Product Image Upload Routes
  app.post('/api/products/:productId/images/upload-url', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.params;
      
      const validationResult = productImageUploadSchema.safeParse(req.body);
      if (!validationResult.success) {
        return ApiResponse.badRequest(res, "Validation error", {
          errors: validationResult.error.errors 
});
      }
      const { filename } = validationResult.data;

      // Get product and verify ownership through business
      const product = await storage.getProductById(productId);
      if (!product) {
        return ApiResponse.notFound(res, "Product not found");
      }

      const business = await storage.getBusinessById(product.businessId);
      if (!business || business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to upload images for this product");
      }

      // Validate file extension
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      // Generate presigned URL
      const objectStorageService = new ObjectStorageService();
      const { uploadUrl, publicPath } = await objectStorageService.getProductImageUploadURL(
        business.id,
        productId,
        filename
      );

      res.json({
        method: "PUT",
        url: uploadUrl,
        publicPath,
});
    } catch (error: any) {
      console.error("Error generating upload URL:", error);
      return ApiResponse.internalError(res, error.message || "Failed to generate upload URL");
    }
});

  app.post('/api/products/:productId/images', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.params;
      
      const validationResult = productImageUrlSchema.safeParse(req.body);
      if (!validationResult.success) {
        return ApiResponse.badRequest(res, "Validation error", {
          errors: validationResult.error.errors 
});
      }
      const { imageUrl } = validationResult.data;

      // Get product and verify ownership through business
      const product = await storage.getProductById(productId);
      if (!product) {
        return ApiResponse.notFound(res, "Product not found");
      }

      const business = await storage.getBusinessById(product.businessId);
      if (!business || business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to modify this product");
      }

      // Check if we already have 5 images
      const currentImages = (product.images as string[]) || [];
      if (currentImages.length >= 5) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      // Add new image URL to the array
      const updatedImages = [...currentImages, imageUrl];
      const updatedProduct = await storage.updateProductImages(productId, updatedImages);

      res.json(updatedProduct);
    } catch (error: any) {
      console.error("Error saving product image:", error);
      return ApiResponse.internalError(res, error.message || "Failed to save product image");
    }
});

  app.delete('/api/products/:productId/images', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.params;
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      // Get product and verify ownership through business
      const product = await storage.getProductById(productId);
      if (!product) {
        return ApiResponse.notFound(res, "Product not found");
      }

      const business = await storage.getBusinessById(product.businessId);
      if (!business || business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to modify this product");
      }

      // Remove image URL from the array
      const currentImages = (product.images as string[]) || [];
      const updatedImages = currentImages.filter((img: string) => img !== imageUrl);
      const updatedProduct = await storage.updateProductImages(productId, updatedImages);

      res.json(updatedProduct);
    } catch (error: any) {
      console.error("Error deleting product image:", error);
      return ApiResponse.internalError(res, error.message || "Failed to delete product image");
    }
});

  // Post routes (SECURITY: Rate limited)
  app.post('/api/posts', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error: any) {
      console.error("Error creating post:", error);
      if (error.name === 'ZodError') {
        return ApiResponse.zodValidation(res, error);
      }
      return ApiResponse.badRequest(res, "Validation error");
    }
});

  app.get('/api/posts', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const posts = await storage.getRecentPosts(limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.get('/api/businesses/:id/posts', async (req, res) => {
    try {
      const { id: businessId } = req.params;
      const posts = await storage.getPostsByBusiness(businessId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching business posts:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.post('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: postId } = req.params;
      
      await storage.likePost(userId, postId);
      res.json({ message: "Successfully liked post" });
    } catch (error) {
      console.error("Error liking post:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.delete('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: postId } = req.params;
      
      await storage.unlikePost(userId, postId);
      res.json({ message: "Successfully unliked post" });
    } catch (error) {
      console.error("Error unliking post:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.get('/api/posts/:id/liked', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: postId } = req.params;
      
      const isLiked = await storage.isPostLiked(userId, postId);
      res.json({ isLiked });
    } catch (error) {
      console.error("Error checking like status:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // ========== BLOG API ROUTES ==========
  // Blog Post Management
  
  app.post('/api/blog/posts', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const authorId = req.user.claims.sub;
      const postData = insertBlogPostSchema.parse({
        ...req.body,
        authorId,
      });
      
      const post = await blogService.createPost(postData);
      res.json(post);
    } catch (error: any) {
      console.error("Error creating blog post:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.put('/api/blog/posts/:id', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const postData = updateBlogPostSchema.parse(req.body);
      
      const post = await blogService.updatePost(id, postData);
      res.json(post);
    } catch (error: any) {
      console.error("Error updating blog post:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.delete('/api/blog/posts/:id', strictRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Check ownership
      const post = await blogService.getPostById(id);
      if (!post) {
        return ApiResponse.notFound(res, "Post not found");
      }
      if (post.authorId !== userId && !req.user.isAdmin) {
        return ApiResponse.forbidden(res, "Not authorized");
      }
      
      await blogService.deletePost(id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  // Popular posts route must be before :id route
  app.get('/api/blog/posts/popular', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const period = parseInt(req.query.period as string) || 30;
      
      const posts = await blogService.getPopularPosts(limit, period);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching popular posts:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.get('/api/blog/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const post = await blogService.getPostById(id);
      
      if (!post) {
        return ApiResponse.notFound(res, "Post not found");
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.get('/api/blog/posts/slug/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await blogService.getPostBySlug(slug);
      
      if (!post) {
        return ApiResponse.notFound(res, "Post not found");
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post by slug:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.get('/api/blog/posts', async (req, res) => {
    try {
      const params = {
        query: req.query.q as string,
        categoryId: req.query.category as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        authorId: req.query.author as string,
        status: req.query.status as string || 'published',
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        sort: req.query.sort as any || 'newest',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };
      
      const result = await blogService.searchPosts(params);
      res.json(result);
    } catch (error) {
      console.error("Error searching blog posts:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.get('/api/blog/posts/:id/related', async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;
      
      const posts = await blogService.getRelatedPosts(id, limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching related posts:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  // Category Management
  
  app.post('/api/blog/categories', businessActionRateLimit, isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categoryData = insertBlogCategorySchema.parse(req.body);
      const category = await blogService.createCategory(categoryData);
      res.json(category);
    } catch (error: any) {
      console.error("Error creating category:", error);
      return res.status(400).json({ message: "Validation error" });
    }
  });

  app.put('/api/blog/categories/:id', businessActionRateLimit, isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const category = await blogService.updateCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.get('/api/blog/categories', async (req, res) => {
    try {
      const categories = await blogService.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  // Tag Management
  
  app.post('/api/blog/tags', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const tagData = insertBlogTagSchema.parse(req.body);
      const tag = await blogService.createTag(tagData);
      res.json(tag);
    } catch (error: any) {
      console.error("Error creating tag:", error);
      return res.status(400).json({ message: "Validation error" });
    }
  });

  app.get('/api/blog/tags', async (req, res) => {
    try {
      const tags = await blogService.getTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.post('/api/blog/posts/:id/tags', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { tagIds } = req.body;
      
      await blogService.attachTagsToPost(id, tagIds);
      res.json({ message: "Tags attached successfully" });
    } catch (error) {
      console.error("Error attaching tags:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  // Comment System
  
  app.post('/api/blog/posts/:postId/comments', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { postId } = req.params;
      const authorId = req.user.claims.sub;
      
      const commentData = insertBlogCommentSchema.parse({
        ...req.body,
        postId,
        authorId,
      });
      
      const comment = await blogService.createComment(commentData);
      res.json(comment);
    } catch (error: any) {
      console.error("Error creating comment:", error);
      return res.status(400).json({ message: "Validation error" });
    }
  });

  app.put('/api/blog/comments/:id', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Check ownership
      const comment = await storage.getBlogCommentById(id);
      if (!comment || comment.authorId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }
      
      const updateData = updateBlogCommentSchema.parse(req.body);
      const updated = await blogService.updateComment(id, updateData);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating comment:", error);
      return res.status(400).json({ message: "Validation error" });
    }
  });

  app.delete('/api/blog/comments/:id', strictRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Check ownership or admin
      const comment = await storage.getBlogCommentById(id);
      if (!comment || (comment.authorId !== userId && !req.user.isAdmin)) {
        return ApiResponse.forbidden(res, "Not authorized");
      }
      
      await blogService.deleteComment(id);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.get('/api/blog/posts/:postId/comments', async (req, res) => {
    try {
      const { postId } = req.params;
      const options = {
        parentId: req.query.parentId as string || null,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: req.query.sortBy as any || 'newest',
      };
      
      const comments = await blogService.getComments(postId, options);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.put('/api/blog/comments/:id/moderate', strictRateLimit, isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { approved } = req.body;
      
      await blogService.moderateComment(id, approved);
      res.json({ message: `Comment ${approved ? 'approved' : 'rejected'} successfully` });
    } catch (error) {
      console.error("Error moderating comment:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  // Reactions & Bookmarks
  
  app.post('/api/blog/posts/:id/reactions', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { id: postId } = req.params;
      const userId = req.user.claims.sub;
      
      const reactionData = insertBlogReactionSchema.parse({
        ...req.body,
        postId,
        userId,
      });
      
      const reaction = await blogService.addReaction(reactionData);
      res.json(reaction);
    } catch (error: any) {
      console.error("Error adding reaction:", error);
      return res.status(400).json({ message: "Validation error" });
    }
  });

  app.delete('/api/blog/posts/:id/reactions', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { id: postId } = req.params;
      const userId = req.user.claims.sub;
      const reactionType = req.query.type as string || 'like';
      
      await blogService.removeReaction(postId, userId, reactionType);
      res.json({ message: "Reaction removed successfully" });
    } catch (error) {
      console.error("Error removing reaction:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.post('/api/blog/posts/:id/bookmarks', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { id: postId } = req.params;
      const userId = req.user.claims.sub;
      
      const bookmarkData = insertBlogBookmarkSchema.parse({
        postId,
        userId,
        readingListId: req.body.readingListId,
        notes: req.body.notes,
      });
      
      const bookmark = await blogService.bookmarkPost(bookmarkData);
      res.json(bookmark);
    } catch (error: any) {
      console.error("Error bookmarking post:", error);
      return res.status(400).json({ message: "Validation error" });
    }
  });

  app.delete('/api/blog/posts/:id/bookmarks', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { id: postId } = req.params;
      const userId = req.user.claims.sub;
      
      await blogService.removeBookmark(postId, userId);
      res.json({ message: "Bookmark removed successfully" });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  // Subscriptions
  
  app.post('/api/blog/subscribe', generalAPIRateLimit, async (req, res) => {
    try {
      const subscriptionData = insertBlogSubscriptionSchema.parse(req.body);
      const subscription = await blogService.subscribe(subscriptionData);
      res.json(subscription);
    } catch (error: any) {
      console.error("Error subscribing:", error);
      return res.status(400).json({ message: "Validation error" });
    }
  });

  app.delete('/api/blog/unsubscribe/:token', async (req, res) => {
    try {
      const { token } = req.params;
      await blogService.unsubscribe(token);
      res.json({ message: "Unsubscribed successfully" });
    } catch (error) {
      console.error("Error unsubscribing:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  // Analytics
  
  app.post('/api/blog/posts/:id/track-view', async (req, res) => {
    try {
      const { id: postId } = req.params;
      const analyticsData = req.body;
      
      await blogService.trackView(postId, analyticsData);
      res.json({ message: "View tracked" });
    } catch (error) {
      console.error("Error tracking view:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.post('/api/blog/posts/:id/track-engagement', async (req, res) => {
    try {
      const { id: postId } = req.params;
      const { type, ...data } = req.body;
      
      await blogService.trackEngagement(postId, type, data);
      res.json({ message: "Engagement tracked" });
    } catch (error) {
      console.error("Error tracking engagement:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.get('/api/blog/posts/:id/analytics', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id: postId } = req.params;
      const period = {
        start: req.query.start ? new Date(req.query.start as string) : undefined,
        end: req.query.end ? new Date(req.query.end as string) : undefined,
      };
      
      const analytics = await blogService.getPostAnalytics(postId, period.start && period.end ? period : undefined);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  // SEO Endpoints
  
  app.get('/api/blog/posts/:id/seo', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const post = await blogService.getPostById(id);
      
      if (!post) {
        return ApiResponse.notFound(res, "Post not found");
      }
      
      const seoAnalysis = await blogService.analyzeSEO(post);
      res.json(seoAnalysis);
    } catch (error) {
      console.error("Error analyzing SEO:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.get('/api/blog/posts/:id/structured-data', async (req, res) => {
    try {
      const { id } = req.params;
      const post = await blogService.getPostById(id);
      
      if (!post) {
        return ApiResponse.notFound(res, "Post not found");
      }
      
      const author = await storage.getUser(post.authorId);
      const siteInfo = {
        name: "The Florida Local",
        url: process.env.SITE_URL || "https://thefloridaLocal.com",
        logo: "/logo.png",
      };
      
      const structuredData = blogService.generateStructuredData(post, author, siteInfo);
      res.json(structuredData);
    } catch (error) {
      console.error("Error generating structured data:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.get('/api/blog/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = process.env.SITE_URL || `https://${req.get('host')}`;
      const sitemap = await blogService.generateSitemap(baseUrl);
      
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  app.get('/api/blog/rss.xml', async (req, res) => {
    try {
      const baseUrl = process.env.SITE_URL || `https://${req.get('host')}`;
      const limit = parseInt(req.query.limit as string) || 20;
      const rssFeed = await blogService.generateRSSFeed(baseUrl, limit);
      
      res.set('Content-Type', 'application/rss+xml; charset=utf-8');
      res.send(rssFeed);
    } catch (error) {
      console.error("Error generating RSS feed:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
  });

  // Enhanced Message routes with file sharing and business networking
  app.post('/api/messages', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      
      // Generate conversation ID from user IDs for consistency
      const conversationId = [senderId, req.body.receiverId].sort().join('-');
      
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId,
        conversationId,
        isDelivered: true,
        deliveredAt: new Date(),
});
      
      const message = await storage.createMessage(messageData);
      
      // Emit real-time message via WebSocket
      const { sendMessage } = await import("./websocket");
      sendMessage(conversationId, {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        timestamp: message.createdAt?.toISOString() || new Date().toISOString(),
});
      
      res.json(message);
    } catch (error: any) {
      console.error("Error creating message:", error);
      return res.status(400).json({ message: "Validation error" });
    }
});

  // File upload for messages
  app.post('/api/messages/upload', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      
      const validationResult = messageFileUploadSchema.safeParse(req.body);
      if (!validationResult.success) {
        return ApiResponse.badRequest(res, "Validation error", {
          errors: validationResult.error.errors 
});
      }
      const { receiverId, file } = validationResult.data;
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!allowedTypes.includes(file.type)) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      // Generate conversation ID
      const conversationId = [senderId, receiverId].sort().join('-');

      // Create message with file attachment
      const messageData = insertMessageSchema.parse({
        senderId,
        receiverId,
        conversationId,
        content: `Shared a file: ${file.name}`,
        messageType: 'file',
        fileUrl: file.url,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        isDelivered: true,
        deliveredAt: new Date(),
});

      const message = await storage.createMessage(messageData);

      // Emit real-time message via WebSocket
      const { sendMessage } = await import("./websocket");
      sendMessage(conversationId, {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        timestamp: message.createdAt?.toISOString() || new Date().toISOString(),
});

      res.json(message);
    } catch (error: any) {
      console.error("Error uploading file message:", error);
      return ApiResponse.internalError(res, error.message || "Failed to upload file");
    }
});

  // Share business in message
  app.post('/api/messages/share-business', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      
      const validationResult = shareBusinessMessageSchema.safeParse(req.body);
      if (!validationResult.success) {
        return ApiResponse.badRequest(res, "Validation error", {
          errors: validationResult.error.errors 
});
      }
      const { receiverId, businessId } = validationResult.data;

      // Verify business exists
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }

      // Generate conversation ID
      const conversationId = [senderId, receiverId].sort().join('-');

      const messageData = insertMessageSchema.parse({
        senderId,
        receiverId,
        conversationId,
        content: `Shared a business: ${business.name}`,
        messageType: 'business_share',
        sharedBusinessId: businessId,
        networkingContext: {
          businessName: business.name,
          businessCategory: business.category,
          businessLocation: business.location,
        },
        isDelivered: true,
        deliveredAt: new Date(),
});

      const message = await storage.createMessage(messageData);

      // Emit real-time message via WebSocket
      const { sendMessage } = await import("./websocket");
      sendMessage(conversationId, {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        timestamp: message.createdAt?.toISOString() || new Date().toISOString(),
});

      res.json(message);
    } catch (error: any) {
      console.error("Error sharing business:", error);
      return ApiResponse.internalError(res, error.message || "Failed to share business");
    }
});

  app.get('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.get('/api/messages/conversation/:conversationId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { conversationId } = req.params;
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 50;
      
      // Verify user has access to this conversation
      const hasAccess = await storage.userHasAccessToConversation(currentUserId, conversationId);
      if (!hasAccess) {
        return ApiResponse.forbidden(res, "Access denied to this conversation");
      }
      
      const messages = await storage.getConversationMessages(conversationId, offset, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.get('/api/messages/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { userId: otherUserId } = req.params;
      
      const messages = await storage.getMessagesBetweenUsers(currentUserId, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Mark message as read
  app.put('/api/messages/:messageId/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messageId } = req.params;
      
      // Verify message exists and user is the receiver
      const message = await storage.getMessageById(messageId);
      if (!message) {
        return ApiResponse.notFound(res, "Message not found");
      }
      
      if (message.receiverId !== userId) {
        return ApiResponse.forbidden(res, "Access denied");
      }
      
      await storage.markMessageAsRead(messageId, new Date());
      res.json({ message: "Message marked as read" });
    } catch (error) {
      console.error("Error marking message as read:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Get unread message count
  app.get('/api/messages/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ unreadCount: count });
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Search messages
  app.get('/api/messages/search', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const query = req.query.q as string;
      
      if (!query || query.trim().length < 2) {
        return ApiResponse.badRequest(res, "Search query must be at least 2 characters");
      }
      
      const messages = await storage.searchMessages(userId, query.trim());
      res.json(messages);
    } catch (error) {
      console.error("Error searching messages:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Cart routes
  app.get('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.post('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartData = insertCartItemSchema.parse({
        ...req.body,
        userId,
});
      
      // Validate product exists and is available
      const product = await storage.getProductById(cartData.productId);
      if (!product) {
        return ApiResponse.notFound(res, "Product not found");
      }
      
      if (!product.isActive) {
        return ApiResponse.badRequest(res, "Product is not available");
      }
      
      // Validate quantity and inventory
      if (!cartData.quantity || cartData.quantity <= 0) {
        return ApiResponse.badRequest(res, "Invalid quantity");
      }
      
      if (cartData.quantity > (product.inventory || 0)) {
        return ApiResponse.badRequest(res, `Only ${product.inventory} units available for "${product.name}"`);
      }
      
      // Check if item already exists in cart and validate total quantity
      const existingCartItems = await storage.getCartItems(userId);
      const existingItem = existingCartItems.find(item => item.productId === cartData.productId);
      const totalQuantity = existingItem ? (existingItem.quantity || 0) + (cartData.quantity || 0) : (cartData.quantity || 0);
      
      if (totalQuantity > (product.inventory || 0)) {
        return ApiResponse.badRequest(res, `Cannot add ${cartData.quantity} more. Only ${(product.inventory || 0) - (existingItem?.quantity || 0)} more units available.`);
      }
      
      const cartItem = await storage.addToCart(userId, cartData.productId, cartData.quantity || 0);
      res.json(cartItem);
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      if (error.name === 'ZodError') {
        return ApiResponse.zodValidation(res, error);
      }
      return ApiResponse.badRequest(res, "Validation error");
    }
});

  app.put('/api/cart/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.params;
      
      const validationResult = cartQuantityUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return ApiResponse.zodValidation(res, validationResult.error, req);
      }
      const { quantity: quantityNum } = validationResult.data;
      
      if (quantityNum === 0) {
        // Remove item if quantity is 0
        await storage.removeFromCart(userId, productId);
        return res.json({ message: "Item removed from cart" });
      }
      
      // Validate product exists and is available
      const product = await storage.getProductById(productId);
      if (!product) {
        return ApiResponse.notFound(res, "Product not found");
      }
      
      if (!product.isActive) {
        return ApiResponse.badRequest(res, "Product is not available");
      }
      
      // Validate inventory
      if (quantityNum > (product.inventory || 0)) {
        return ApiResponse.badRequest(res, `Only ${product.inventory} units available for "${product.name}"`);
      }
      
      await storage.updateCartItemQuantity(userId, productId, quantityNum);
      res.json({ message: "Cart updated successfully" });
    } catch (error) {
      console.error("Error updating cart:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.delete('/api/cart/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.params;
      
      await storage.removeFromCart(userId, productId);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.delete('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared successfully" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.get('/api/cart/total', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const total = await storage.getCartTotal(userId);
      res.json({ total });
    } catch (error) {
      console.error("Error fetching cart total:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Checkout and Payment routes - from Stripe blueprint
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validationResult = createPaymentIntentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return ApiResponse.badRequest(res, "Validation error", {
          errors: validationResult.error.errors 
});
      }
      const { shippingAddress, billingAddress, customerEmail, customerPhone, notes, currency } = validationResult.data;
      
      // Get cart items and validate
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      // Validate inventory for all items
      for (const item of cartItems) {
        if (!item.product.isActive) {
          return res.status(400).json({            message: `Product "${item.product.name}" is no longer available` 
});
        }
        if (item.quantity > (item.product.inventory || 0)) {
          return res.status(400).json({            message: `Only ${item.product.inventory || 0} of "${item.product.name}" available` 
});
        }
      }

      // Calculate totals server-side
      const subtotal = cartItems.reduce(
        (total, item) => total + (parseFloat(item.product.price) * item.quantity),
        0
      );
      const taxAmount = subtotal * 0.08; // 8% tax
      const shippingAmount = cartItems.some(item => !item.product.isDigital) ? 5.99 : 0;
      const total = subtotal + taxAmount + shippingAmount;

      // Create provisional order first
      const order = await storage.createOrder({
        userId,
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        shippingAmount: shippingAmount.toFixed(2),
        total: total.toFixed(2),
        currency,
        shippingAddress,
        billingAddress,
        customerEmail,
        customerPhone,
        notes,
        status: "pending_payment",
});

      // Create order items
      const orderItemsData = cartItems.map(item => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.product.name,
        productPrice: item.product.price,
        quantity: item.quantity,
        totalPrice: (parseFloat(item.product.price) * item.quantity).toFixed(2),
      }));
      await storage.createOrderItems(orderItemsData);
      
      // STRIPE INTEGRATION PLACEHOLDER
      // Create Stripe PaymentIntent with server-calculated amount
      //   return res.status(503).json({ message: "Payments not configured. Provide STRIPE_SECRET_KEY or use manual /api/checkout." });
      // }
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: Math.round(total * 100), // Convert to cents
      //   currency,
      //   metadata: {
      //     userId,
      //     orderId: order.id,
      //   },
      //);

      // // Create payment record
      // await storage.createPayment({
      //   orderId: order.id,
      //   stripePaymentIntentId: paymentIntent.id,
      //   stripeClientSecret: paymentIntent.client_secret || "",
      //   amount: total.toFixed(2),
      //   currency,
      //   status: "pending",
      // });

      // res.json({ 
      //   clientSecret: paymentIntent.client_secret,
      //   paymentIntentId: paymentIntent.id,
      //   orderId: order.id,
      //   orderSummary: {
      //     subtotal: subtotal.toFixed(2),
      //     taxAmount: taxAmount.toFixed(2),
      //     shippingAmount: shippingAmount.toFixed(2),
      //     total: total.toFixed(2),
      //     itemCount: cartItems.length,
      //   }
      //);

      // Temporary response until Stripe is integrated
      return res.status(503).json({ message: "Stripe payment integration not yet configured. Use /api/checkout for manual orders.",
        orderId: order.id 
});
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.post('/api/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId,
});

      // Get cart items
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      // Calculate totals
      const subtotal = cartItems.reduce(
        (total, item) => total + (parseFloat(item.product.price) * item.quantity),
        0
      );
      const taxAmount = subtotal * 0.08; // 8% tax
      const shippingAmount = cartItems.some(item => !item.product.isDigital) ? 5.99 : 0;
      const total = subtotal + taxAmount + shippingAmount;

      // Create order
      const order = await storage.createOrder({
        ...orderData,
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        shippingAmount: shippingAmount.toFixed(2),
        total: total.toFixed(2),
        status: "pending",
});

      // Create order items
      const orderItemsData = cartItems.map(item => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.product.name,
        productPrice: item.product.price,
        quantity: item.quantity,
        totalPrice: (parseFloat(item.product.price) * item.quantity).toFixed(2),
      }));

      await storage.createOrderItems(orderItemsData);

      res.json({
        order,
        total,
        cartItems: cartItems.length,
});
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      if (error.name === 'ZodError') {
        return ApiResponse.zodValidation(res, error);
      }
      return ApiResponse.badRequest(res, "Validation error");
    }
});

  // Order routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getOrdersByUser(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.get('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: orderId } = req.params;
      
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return ApiResponse.notFound(res, "Order not found");
      }

      // Check if user owns this order
      if (order.userId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to view this order");
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  app.post('/api/orders/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: orderId } = req.params;
      
      const validationResult = completeOrderSchema.safeParse(req.body);
      if (!validationResult.success) {
        return ApiResponse.zodValidation(res, validationResult.error, req);
      }
      const { paymentIntentId } = validationResult.data;

      // Verify the order belongs to the user
      const order = await storage.getOrderById(orderId);
      if (!order || order.userId !== userId) {
        return ApiResponse.notFound(res, "Order not found");
      }

      // STRIPE INTEGRATION PLACEHOLDER
      // Verify payment with Stripe
      //   return res.status(503).json({ message: "Payments not configured" });
      // }
      // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      // if (paymentIntent.status === "succeeded") {
      //   // Update order status
      //   await storage.updateOrderStatus(orderId, "processing");

      //   // Update payment status
      //   const payment = await storage.getPaymentByStripeId(paymentIntentId);
      //   if (payment) {
      //     await storage.updatePaymentStatus(payment.id, "succeeded", new Date());
      //   }

      //   // Award loyalty points for purchase
      //   try {
      //     const { loyaltyStorage } = await import("./loyaltyStorage");
      //     await loyaltyStorage.awardPointsForEvent(
      //       userId,
      //       "purchase",
      //       orderId
      //     );
      //   } catch (loyaltyError) {
      //     console.error("Error awarding loyalty points:", loyaltyError);
      //     // Don't fail the order completion if loyalty points fail
      //   }

      //   // Clear user's cart
      //   await storage.clearCart(userId);

      //   res.json({ message: "Order completed successfully", order });
      // } else {
      //   res.status(400).json({ message: "Payment not successful" });
      // }

      // Temporary response until Stripe is integrated
      return res.status(503).json({ message: "Stripe payment verification not yet configured"     });
    } catch (error: any) {
      console.error("Error completing order:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Health endpoints
  app.get('/health', async (req, res) => {
    const redisHealthy = await checkRedisConnection();
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      redis: redisHealthy ? 'connected' : 'disconnected'
});
});

  app.get('/api/health', async (req, res) => {
    try {
      const redisHealthy = await checkRedisConnection();
      
      // Import database health functions
      const { getDatabaseStatus, testDatabaseConnection } = await import("./db");
      
      // Get comprehensive database status
      const dbStatus = getDatabaseStatus();
      const dbHealthCheck = await testDatabaseConnection().catch(() => false);
      
      const overallHealthy = dbHealthCheck && (redisHealthy || true); // Redis is optional
      
      res.status(overallHealthy ? 200 : 503).json({ 
        status: overallHealthy ? 'healthy' : 'degraded',
        services: {
          database: {
            status: dbHealthCheck ? 'connected' : 'disconnected',
            isConnected: dbStatus.isConnected,
            lastError: dbStatus.lastError,
            lastErrorTime: dbStatus.lastErrorTime,
            reconnectAttempts: dbStatus.reconnectAttempts,
            pool: {
              idle: dbStatus.poolIdleCount,
              total: dbStatus.poolTotalCount,
              waiting: dbStatus.poolWaitingCount
            }
          },
          auth: 'operational',
          storage: 'operational',
          redis: {
            status: redisHealthy ? 'operational' : 'unavailable',
            required: false // Redis is optional, falls back to PostgreSQL sessions
          },
          monitoring: {
            sentry: process.env.SENTRY_DSN ? 'configured' : 'disabled',
            posthog: process.env.POSTHOG_KEY ? 'configured' : 'disabled'
          }
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
});
    } catch (error: any) {
      console.error("Health check error:", error);
      res.status(503).json({
        status: 'unhealthy',
  error: error.message,        timestamp: new Date().toISOString()
});
    }
});

  // Deployment status endpoint - shows registered routes and environment
  app.get('/api/deployment-status', async (req, res) => {
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const fs = await import('fs');
      const path = await import('path');
      
      // Import authentication info
      const { getRegisteredStrategies } = await import("./auth/index");
      const registeredStrategies = getRegisteredStrategies ? getRegisteredStrategies() : [];
      
      // Check build files in production
      let buildInfo = {};
      if (isProduction) {
        const distPath = path.resolve(process.cwd(), 'dist');
        const distPublicPath = path.resolve(distPath, 'public');
        const distIndexPath = path.resolve(distPath, 'index.js');
        const distPublicIndexPath = path.resolve(distPublicPath, 'index.html');
        
        buildInfo = {
          distIndexJs: fs.existsSync(distIndexPath),
          distPublicExists: fs.existsSync(distPublicPath),
          distPublicIndexHtml: fs.existsSync(distPublicIndexPath),
        };
      }
      
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          port: process.env.PORT,
          replitDomains: process.env.REPLIT_DOMAINS || 'NOT SET',
          replitDeployment: process.env.REPL_DEPLOYMENT || 'NOT SET',
        },
        authentication: {
          registeredStrategies: Array.from(registeredStrategies || []),
          strategiesCount: (registeredStrategies || []).length,
        },
        routes: {
          authLogin: '/api/login',
          authCallback: '/api/callback',
          authLogout: '/api/logout',
          health: '/health',
          apiHealth: '/api/health',
          deploymentStatus: '/api/deployment-status (you are here)',
        },
        build: isProduction ? buildInfo : { status: 'development mode' },
        uptime: process.uptime(),
      });
    } catch (error: any) {
      console.error("Deployment status error:", error);
      res.status(500).json({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
});

  // Admin promotion endpoint (development only)
  app.post('/api/admin/promote', isAuthenticated, async (req: any, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return ApiResponse.forbidden(res, "Admin promotion disabled in production");
      }

      const userId = req.user.claims.sub;
      await storage.updateUserAdminStatus(userId, true);
      
      res.json({ message: "User promoted to admin successfully",
        userId,
        timestamp: new Date().toISOString()
});
    } catch (error) {
      console.error("Error promoting user to admin:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Placeholder notifications endpoint (polling)
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      // TODO: Implement real notifications system
      // For now, return empty array - this is just for the polling hook
      const notifications: any[] = [];
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return ApiResponse.internalError(res, "Internal server error");
    }
});

  // Stripe Connect onboarding endpoints
  app.post('/api/businesses/:id/stripe/connect', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }

      // Import Stripe Connect functions
      const { createConnectAccount, createAccountLink } = await import("./stripeConnect");
      
      // Check if already has Stripe account
      if (business.stripeAccountId) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      // Create Connect account
      const account = await createConnectAccount({
        businessId,
        userId,
        email: req.user.claims.email,
        businessName: business.name,
        businessType: business.category || "Other",
});

      if (!account) {
        return ApiResponse.internalError(res, "Failed to create Stripe account");
      }

      // Update business with Stripe account ID
      await storage.updateBusiness(businessId, {
        name: business.name,
        stripeAccountId: account.id,
        stripeOnboardingStatus: "pending",
});

      // Create account link for onboarding
      const baseUrl = `${req.protocol}://${req.hostname}`;
      const accountLink = await createAccountLink(
        account.id,
        `${baseUrl}/api/businesses/${businessId}/stripe/refresh`,
        `${baseUrl}/business/${businessId}/settings?stripe=success`
      );

      res.json({
        accountId: account.id,
        onboardingUrl: accountLink?.url,
});
    } catch (error: any) {
      console.error("Error creating Stripe Connect account:", error);
      return ApiResponse.internalError(res, error.message || "Failed to create Stripe account");
    }
});

  // Stripe Connect refresh link
  app.get('/api/businesses/:id/stripe/refresh', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }

      if (!business.stripeAccountId) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      const { createAccountLink } = await import("./stripeConnect");
      
      const baseUrl = `${req.protocol}://${req.hostname}`;
      const accountLink = await createAccountLink(
        business.stripeAccountId,
        `${baseUrl}/api/businesses/${businessId}/stripe/refresh`,
        `${baseUrl}/business/${businessId}/settings?stripe=success`
      );

      if (!accountLink) {
        return res.status(500).json({ message: "Failed to create account link" });
      }

      res.redirect(accountLink.url);
    } catch (error: any) {
      console.error("Error refreshing Stripe link:", error);
      return ApiResponse.internalError(res, error.message || "Failed to refresh Stripe link");
    }
});

  // Get Stripe Connect account status
  app.get('/api/businesses/:id/stripe/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }

      if (!business.stripeAccountId) {
        return res.json({ connected: false });
      }

      const { getConnectAccount, isAccountOnboarded } = await import("./stripeConnect");
      
      const account = await getConnectAccount(business.stripeAccountId);
      if (!account) {
        return res.json({ connected: false });
      }

      const onboarded = isAccountOnboarded(account);

      // Update business status if changed
      if (onboarded && business.stripeOnboardingStatus !== "active") {
        await storage.updateBusiness(businessId, {
          name: business.name,
          stripeOnboardingStatus: "active",
});
      }

      res.json({
        connected: true,
        onboarded,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements,
});
    } catch (error: any) {
      console.error("Error getting Stripe status:", error);
      return ApiResponse.internalError(res, error.message || "Failed to get Stripe status");
    }
});

  // AI and Recommendations endpoints
  app.get('/api/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const type = req.query.type as "business" | "product" || "business";
      const limit = parseInt(req.query.limit as string) || 10;

      const { getRecommendations } = await import("./aiService");
      const recommendations = await getRecommendations(userId, type, limit);

      res.json({ recommendations });
    } catch (error: any) {
      console.error("Error getting recommendations:", error);
      return ApiResponse.internalError(res, error.message || "Failed to get recommendations");
    }
});

  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      const type = req.query.type as "business" | "product";
      const category = req.query.category as string;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      const { semanticSearch } = await import("./aiService");
      const results = await semanticSearch(query, { type, category }, limit);

      res.json({ results });
    } catch (error: any) {
      console.error("Error performing search:", error);
      return ApiResponse.internalError(res, error.message || "Search failed");
    }
});

  // AI Business Intelligence Dashboard Endpoints
  app.get('/api/ai/business-metrics/:businessId', isAuthenticated, async (req: any, res) => {
    try {
      const { businessId } = req.params;
      const userId = req.user.claims.sub;

      // Verify user owns this business
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Access denied");
      }

      // Generate AI-powered metrics
      const { generateBusinessMetrics } = await import("./aiService");
      const metrics = await generateBusinessMetrics(businessId);
      res.json(metrics);
    } catch (error: any) {
      console.error("Error getting AI business metrics:", error);
      return ApiResponse.internalError(res, error.message || "Failed to get business metrics");
    }
});

  app.get('/api/ai/business-insights/:businessId', isAuthenticated, async (req: any, res) => {
    try {
      const { businessId } = req.params;
      const userId = req.user.claims.sub;

      // Verify user owns this business
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Access denied");
      }

      // Generate AI insights
      const { generateBusinessInsights } = await import("./aiService");
      const insights = await generateBusinessInsights(businessId);
      
      // Convert to dashboard format  
      const { generateAIDashboardInsights } = await import("./aiService");
      const dashboardInsights = await generateAIDashboardInsights(businessId, insights);
      res.json(dashboardInsights);
    } catch (error: any) {
      console.error("Error getting AI business insights:", error);
      return ApiResponse.internalError(res, error.message || "Failed to get business insights");
    }
});

  app.get('/api/businesses/:id/insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }

      const { generateBusinessInsights } = await import("./aiService");
      const insights = await generateBusinessInsights(businessId);

      res.json(insights);
    } catch (error: any) {
      console.error("Error generating insights:", error);
      return ApiResponse.internalError(res, error.message || "Failed to generate insights");
    }
});

  // AI CONTENT GENERATOR - THE KILLER FEATURE
  app.post('/api/ai/generate-content', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validationResult = aiGenerateContentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return ApiResponse.badRequest(res, "Validation error", { errors: validationResult.error.errors });
      }
      const { businessId, platform, idea, tone } = validationResult.data;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized to generate content for this business");
      }

      // Generate platform-specific content with business data injected
      const { generatePlatformContent } = await import("./aiService");
      const generatedContent = await generatePlatformContent({
        business,
        platform,
        idea,
        tone: tone || 'professional',
});

      res.json(generatedContent);
    } catch (error: any) {
      console.error("Error generating AI content:", error);
      return ApiResponse.internalError(res, error.message || "Failed to generate content");
    }
});

  // Tax endpoints
  app.post('/api/tax/calculate', isAuthenticated, async (req: any, res) => {
    try {
      const { calculateSalesTax } = await import("./taxService");
      
      const taxData = await calculateSalesTax(req.body);
      
      res.json(taxData);
    } catch (error: any) {
      console.error("Error calculating tax:", error);
      return ApiResponse.internalError(res, error.message || "Failed to calculate tax");
    }
});

  app.get('/api/tax/categories', async (req, res) => {
    try {
      const { getTaxCategories } = await import("./taxService");
      
      const categories = await getTaxCategories();
      
      res.json({ categories });
    } catch (error: any) {
      console.error("Error getting tax categories:", error);
      return ApiResponse.internalError(res, error.message || "Failed to get tax categories");
    }
});

  // Invoice endpoint
  app.post('/api/orders/:id/invoice', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: orderId } = req.params;

      // Verify order belongs to user
      const order = await storage.getOrderById(orderId);
      if (!order || order.userId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }

      const { generateOrderInvoice } = await import("./invoiceService");
      const { invoiceNumber, buffer } = await generateOrderInvoice(orderId);

      // Send PDF as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceNumber}.pdf"`);
      res.send(buffer);
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      return ApiResponse.internalError(res, error.message || "Failed to generate invoice");
    }
});

  // ========================================
  // STRIPE PAYMENT PROCESSING
  // ========================================
  
  // Stripe webhook endpoint - Main webhook handler
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("Stripe webhook secret not configured");
        return ApiResponse.internalError(res, "Webhook secret not configured");
      }

      // Import webhook handlers
      const { constructWebhookEvent } = await import("./stripeConnect");
      const { handleWebhookEvent } = await import("./stripeWebhooks");

      let event: Stripe.Event;
      try {
        event = constructWebhookEvent(req.body, sig);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return ApiResponse.badRequest(res, "Webhook signature verification failed");
      }

      // Process webhook event
      const result = await handleWebhookEvent(event, storage);
      
      if (result.success) {
        res.json({ received: true });
      } else {
        if (result.retryable) {
          return ApiResponse.serviceUnavailable(res, result.error);
        } else {
          return ApiResponse.badRequest(res, result.error);
        }
      }
    } catch (error: any) {
      console.error("Stripe webhook error:", error);
      return ApiResponse.internalError(res, error.message || "Webhook processing failed");
    }
  });

  // Create payment intent for marketplace transaction
  app.post('/api/payments/create-intent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { 
        amount, 
        sellerId, 
        orderId,
        savePaymentMethod,
        currency = 'usd',
        description 
      } = req.body;

      const stripePayments = await import("./stripePayments");
      const stripeCompliance = await import("./stripeCompliance");
      
      // Perform security checks
      const securityCheck = await stripeCompliance.performSecurityCheck({
        amount,
        currency,
        customerId: userId,
        email: req.user.claims.email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      if (securityCheck.riskLevel === 'blocked') {
        return ApiResponse.forbidden(res, "Transaction blocked due to security concerns", { reasons: securityCheck.reasons });
      }

      // Create or retrieve Stripe customer
      const customer = await stripePayments.createOrRetrieveCustomer(
        userId,
        req.user.claims.email,
        req.user.claims.name
      );

      // Create payment intent with split payment
      const paymentIntent = await stripePayments.createPaymentIntent({
        amount,
        currency,
        sellerId,
        customerId: customer.id,
        description,
        metadata: {
          userId,
          orderId: orderId || '',
          sellerId: sellerId || '',
        },
        savePaymentMethod,
        use3DSecure: securityCheck.requiresAdditionalVerification,
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        requiresAction: paymentIntent.status === 'requires_action',
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      return ApiResponse.internalError(res, error.message || "Failed to create payment");
    }
  });

  // Confirm payment intent
  app.post('/api/payments/:id/confirm', isAuthenticated, async (req: any, res) => {
    try {
      const { id: paymentIntentId } = req.params;
      const { paymentMethodId, returnUrl } = req.body;

      const stripePayments = await import("./stripePayments");
      
      const paymentIntent = await stripePayments.confirmPaymentIntent(
        paymentIntentId,
        paymentMethodId,
        returnUrl
      );

      res.json({
        status: paymentIntent.status,
        requiresAction: paymentIntent.status === 'requires_action',
        nextActionUrl: paymentIntent.next_action?.redirect_to_url?.url,
      });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      return ApiResponse.internalError(res, error.message || "Failed to confirm payment");
    }
  });

  // Cancel payment intent
  app.post('/api/payments/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const { id: paymentIntentId } = req.params;
      const { reason } = req.body;

      const stripePayments = await import("./stripePayments");
      
      const paymentIntent = await stripePayments.cancelPaymentIntent(
        paymentIntentId,
        reason
      );

      res.json({ status: paymentIntent.status });
    } catch (error: any) {
      console.error("Error canceling payment:", error);
      return ApiResponse.internalError(res, error.message || "Failed to cancel payment");
    }
  });

  // Process refund
  app.post('/api/payments/:id/refund', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: paymentIntentId } = req.params;
      const { amount, reason } = req.body;

      // Verify user has permission to refund
      const payment = await storage.getPaymentByIntentId(paymentIntentId);
      if (!payment) {
        return ApiResponse.notFound(res, "Payment not found");
      }

      const order = await storage.getOrderById(payment.orderId);
      if (!order || (order.userId !== userId && !req.user.claims.isAdmin)) {
        return ApiResponse.forbidden(res, "Not authorized to refund this payment");
      }

      const stripePayments = await import("./stripePayments");
      
      const refund = await stripePayments.processRefund({
        paymentIntentId,
        amount,
        reason,
        refundApplicationFee: true,
        reverseTransfer: true,
      });

      // Update order status
      await storage.updateOrderStatus(
        payment.orderId,
        amount ? 'partially_refunded' : 'refunded'
      );

      res.json({
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      });
    } catch (error: any) {
      console.error("Error processing refund:", error);
      return ApiResponse.internalError(res, error.message || "Failed to process refund");
    }
  });

  // Save payment method
  app.post('/api/payment-methods/save', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { paymentMethodId, setAsDefault } = req.body;

      const stripePayments = await import("./stripePayments");
      
      const customer = await stripePayments.createOrRetrieveCustomer(
        userId,
        req.user.claims.email,
        req.user.claims.name
      );

      const paymentMethod = await stripePayments.savePaymentMethod(
        customer.id,
        paymentMethodId,
        setAsDefault
      );

      res.json({
        id: paymentMethod.id,
        type: paymentMethod.type,
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
      });
    } catch (error: any) {
      console.error("Error saving payment method:", error);
      return ApiResponse.internalError(res, error.message || "Failed to save payment method");
    }
  });

  // List saved payment methods
  app.get('/api/payment-methods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type = 'card' } = req.query;

      const stripePayments = await import("./stripePayments");
      
      const customer = await stripePayments.createOrRetrieveCustomer(
        userId,
        req.user.claims.email,
        req.user.claims.name
      );

      const paymentMethods = await stripePayments.listPaymentMethods(
        customer.id,
        type as 'card' | 'us_bank_account'
      );

      res.json(paymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        last4: pm.card?.last4 || pm.us_bank_account?.last4,
        brand: pm.card?.brand,
        bankName: pm.us_bank_account?.bank_name,
      })));
    } catch (error: any) {
      console.error("Error listing payment methods:", error);
      return ApiResponse.internalError(res, error.message || "Failed to list payment methods");
    }
  });

  // Delete payment method
  app.delete('/api/payment-methods/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id: paymentMethodId } = req.params;

      const stripePayments = await import("./stripePayments");
      
      await stripePayments.deletePaymentMethod(paymentMethodId);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting payment method:", error);
      return ApiResponse.internalError(res, error.message || "Failed to delete payment method");
    }
  });

  // Create subscription
  app.post('/api/subscriptions/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { priceId, paymentMethodId, trialDays, coupon } = req.body;

      const stripePayments = await import("./stripePayments");
      
      const customer = await stripePayments.createOrRetrieveCustomer(
        userId,
        req.user.claims.email,
        req.user.claims.name
      );

      const subscription = await stripePayments.createSubscription(
        customer.id,
        priceId,
        {
          trialDays,
          coupon,
          paymentMethodId,
          metadata: { userId },
        }
      );

      res.json({
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        trialEnd: subscription.trial_end,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      return ApiResponse.internalError(res, error.message || "Failed to create subscription");
    }
  });

  // Cancel subscription
  app.post('/api/subscriptions/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const { id: subscriptionId } = req.params;
      const { immediately = false } = req.body;

      const stripePayments = await import("./stripePayments");
      
      const subscription = await stripePayments.cancelSubscription(
        subscriptionId,
        immediately
      );

      res.json({
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAt: subscription.cancel_at,
        canceledAt: subscription.canceled_at,
      });
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      return ApiResponse.internalError(res, error.message || "Failed to cancel subscription");
    }
  });

  // ========================================
  // STRIPE CONNECT ROUTES - Seller Management
  // ========================================

  // Create Connect account for seller
  app.post('/api/connect/accounts/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const businessData = req.body;

      // Verify business ownership
      const business = await storage.getBusinessById(businessData.businessId);
      if (!business || business.ownerId !== userId) {
        return ApiResponse.forbidden(res, "Not authorized");
      }

      const stripeConnect = await import("./stripeConnect");
      
      const account = await stripeConnect.createConnectAccount({
        businessId: businessData.businessId,
        userId,
        email: req.user.claims.email,
        businessName: business.name,
        businessType: businessData.businessType || 'company',
        country: businessData.country || 'US',
        firstName: businessData.firstName,
        lastName: businessData.lastName,
        phone: businessData.phone,
        address: businessData.address,
        taxId: businessData.taxId,
        website: business.website,
        productDescription: business.description,
      });

      // Update business with Stripe account ID
      await storage.updateBusinessStripeInfo(businessData.businessId, {
        stripeAccountId: account.id,
        stripeOnboardingStatus: 'pending',
      });

      res.json({
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      });
    } catch (error: any) {
      console.error("Error creating Connect account:", error);
      res.status(500).json({ message: error.message || "Failed to create seller account" });
    }
  });

  // Get Connect account onboarding link
  app.post('/api/connect/accounts/:id/onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const { id: accountId } = req.params;
      const { refreshUrl, returnUrl } = req.body;

      const stripeConnect = await import("./stripeConnect");
      
      const accountLink = await stripeConnect.createAccountLink(
        accountId,
        refreshUrl || `${process.env.APP_URL}/seller/onboarding/refresh`,
        returnUrl || `${process.env.APP_URL}/seller/onboarding/complete`
      );

      res.json({ url: accountLink.url });
    } catch (error: any) {
      console.error("Error creating onboarding link:", error);
      res.status(500).json({ message: error.message || "Failed to create onboarding link" });
    }
  });

  // Get Connect account dashboard link
  app.post('/api/connect/accounts/:id/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const { id: accountId } = req.params;

      const stripeConnect = await import("./stripeConnect");
      
      const loginLink = await stripeConnect.createLoginLink(accountId);

      res.json({ url: loginLink.url });
    } catch (error: any) {
      console.error("Error creating dashboard link:", error);
      res.status(500).json({ message: error.message || "Failed to create dashboard link" });
    }
  });

  // Get Connect account details
  app.get('/api/connect/accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id: accountId } = req.params;

      const stripeConnect = await import("./stripeConnect");
      
      const account = await stripeConnect.getConnectAccount(accountId);
      const verificationStatus = await stripeConnect.getVerificationStatus(accountId);
      const capabilities = await stripeConnect.getAccountCapabilities(accountId);

      res.json({
        id: account.id,
        email: account.email,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        verificationStatus,
        capabilities,
      });
    } catch (error: any) {
      console.error("Error getting Connect account:", error);
      res.status(500).json({ message: error.message || "Failed to get account details" });
    }
  });

  // Update Connect account verification
  app.patch('/api/connect/accounts/:id/verification', isAuthenticated, async (req: any, res) => {
    try {
      const { id: accountId } = req.params;
      const updates = req.body;

      const stripeConnect = await import("./stripeConnect");
      
      const account = await stripeConnect.updateVerificationInfo(accountId, updates);

      res.json({
        id: account.id,
        requirementsCount: account.requirements?.currently_due?.length || 0,
      });
    } catch (error: any) {
      console.error("Error updating verification:", error);
      res.status(500).json({ message: error.message || "Failed to update verification" });
    }
  });

  // Get Connect account balance
  app.get('/api/connect/accounts/:id/balance', isAuthenticated, async (req: any, res) => {
    try {
      const { id: accountId } = req.params;

      const stripeConnect = await import("./stripeConnect");
      
      const balance = await stripeConnect.getAccountBalance(accountId);

      res.json({
        available: balance.available.map(b => ({
          amount: b.amount / 100,
          currency: b.currency,
        })),
        pending: balance.pending.map(b => ({
          amount: b.amount / 100,
          currency: b.currency,
        })),
      });
    } catch (error: any) {
      console.error("Error getting balance:", error);
      res.status(500).json({ message: error.message || "Failed to get balance" });
    }
  });

  // Create payout for Connect account
  app.post('/api/connect/accounts/:id/payouts', isAuthenticated, async (req: any, res) => {
    try {
      const { id: accountId } = req.params;
      const { amount, currency = 'usd', instant = false } = req.body;

      const stripeConnect = await import("./stripeConnect");
      
      const payout = instant 
        ? await stripeConnect.createInstantPayout(accountId, amount, currency)
        : await stripeConnect.createPayout(accountId, amount, currency);

      res.json({
        payoutId: payout.id,
        amount: payout.amount / 100,
        currency: payout.currency,
        arrivalDate: payout.arrival_date,
        method: payout.method,
      });
    } catch (error: any) {
      console.error("Error creating payout:", error);
      res.status(500).json({ message: error.message || "Failed to create payout" });
    }
  });

  // List payouts for Connect account
  app.get('/api/connect/accounts/:id/payouts', isAuthenticated, async (req: any, res) => {
    try {
      const { id: accountId } = req.params;
      const { limit = 10 } = req.query;

      const stripeConnect = await import("./stripeConnect");
      
      const payouts = await stripeConnect.listPayouts(accountId, parseInt(limit as string));

      res.json({
        payouts: payouts.data.map(p => ({
          id: p.id,
          amount: p.amount / 100,
          currency: p.currency,
          arrivalDate: p.arrival_date,
          status: p.status,
          method: p.method,
        })),
        hasMore: payouts.hasMore,
      });
    } catch (error: any) {
      console.error("Error listing payouts:", error);
      res.status(500).json({ message: error.message || "Failed to list payouts" });
    }
  });

  // Update payout settings
  app.patch('/api/connect/accounts/:id/payout-settings', isAuthenticated, async (req: any, res) => {
    try {
      const { id: accountId } = req.params;
      const settings = req.body;

      const stripeConnect = await import("./stripeConnect");
      
      const account = await stripeConnect.updatePayoutSettings(accountId, settings);

      res.json({
        interval: account.settings?.payouts?.schedule?.interval,
        delayDays: account.settings?.payouts?.schedule?.delay_days,
      });
    } catch (error: any) {
      console.error("Error updating payout settings:", error);
      res.status(500).json({ message: error.message || "Failed to update payout settings" });
    }
  });

  // Add bank account to Connect account
  app.post('/api/connect/accounts/:id/bank-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const { id: accountId } = req.params;
      const bankAccountData = req.body;

      const stripeConnect = await import("./stripeConnect");
      
      const bankAccount = await stripeConnect.addBankAccount(accountId, bankAccountData);

      res.json({
        id: bankAccount.id,
        last4: bankAccount.last4,
        bankName: bankAccount.bank_name,
        status: bankAccount.status,
      });
    } catch (error: any) {
      console.error("Error adding bank account:", error);
      res.status(500).json({ message: error.message || "Failed to add bank account" });
    }
  });

  // List transactions for Connect account
  app.get('/api/connect/accounts/:id/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const { id: accountId } = req.params;
      const { limit = 10, startingAfter } = req.query;

      const stripeConnect = await import("./stripeConnect");
      
      const transactions = await stripeConnect.listBalanceTransactions(accountId, {
        limit: parseInt(limit as string),
        startingAfter: startingAfter as string,
      });

      res.json({
        transactions: transactions.data.map(t => ({
          id: t.id,
          amount: t.amount / 100,
          fee: t.fee / 100,
          net: t.net / 100,
          currency: t.currency,
          type: t.type,
          created: t.created,
        })),
        hasMore: transactions.hasMore,
      });
    } catch (error: any) {
      console.error("Error listing transactions:", error);
      res.status(500).json({ message: error.message || "Failed to list transactions" });
    }
  });

  // ========================================
  // FINANCIAL REPORTS & ANALYTICS
  // ========================================

  // Generate financial report
  app.get('/api/reports/financial', isAuthenticated, async (req: any, res) => {
    try {
      const { startDate, endDate, accountId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates required" });
      }

      const stripePayments = await import("./stripePayments");
      
      const report = await stripePayments.generateFinancialReport(
        new Date(startDate as string),
        new Date(endDate as string),
        {
          accountId: accountId as string,
          includeTransfers: true,
          includePayouts: true,
          includeCharges: true,
          includeRefunds: true,
        }
      );

      res.json(report);
    } catch (error: any) {
      console.error("Error generating financial report:", error);
      return ApiResponse.internalError(res, error.message || "Failed to generate report");
    }
  });

  // Generate compliance report
  app.get('/api/reports/compliance', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates required" });
      }

      const stripeCompliance = await import("./stripeCompliance");
      
      const report = await stripeCompliance.generateComplianceReport(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(report);
    } catch (error: any) {
      console.error("Error generating compliance report:", error);
      return ApiResponse.internalError(res, error.message || "Failed to generate report");
    }
  });

  // Generate tax report
  app.get('/api/reports/tax/:accountId', isAuthenticated, async (req: any, res) => {
    try {
      const { accountId } = req.params;
      const { year } = req.query;

      if (!year) {
        return res.status(400).json({ message: "Year required" });
      }

      const stripeCompliance = await import("./stripeCompliance");
      
      const report = await stripeCompliance.generateTaxReport(
        accountId,
        parseInt(year as string)
      );

      res.json(report);
    } catch (error: any) {
      console.error("Error generating tax report:", error);
      return ApiResponse.internalError(res, error.message || "Failed to generate report");
    }
  });

  // Calculate fees for amount
  app.post('/api/payments/calculate-fees', async (req, res) => {
    try {
      const { amount, taxRate, couponDiscount } = req.body;

      const stripePayments = await import("./stripePayments");
      
      const fees = stripePayments.calculateFees(amount, {
        taxRate,
        couponDiscount,
      });

      res.json(fees);
    } catch (error: any) {
      console.error("Error calculating fees:", error);
      res.status(500).json({ message: error.message || "Failed to calculate fees" });
    }
  });

  // Create coupon
  app.post('/api/coupons/create', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const couponData = req.body;

      const stripePayments = await import("./stripePayments");
      
      const coupon = await stripePayments.createCoupon(couponData);

      res.json({
        id: coupon.id,
        name: coupon.name,
        percentOff: coupon.percent_off,
        amountOff: coupon.amount_off ? coupon.amount_off / 100 : null,
        duration: coupon.duration,
        maxRedemptions: coupon.max_redemptions,
      });
    } catch (error: any) {
      console.error("Error creating coupon:", error);
      res.status(500).json({ message: error.message || "Failed to create coupon" });
    }
  });

  // ========================================
  // ADMIN ROUTES - Platform Management
  // ========================================

  // Get admin statistics
  app.get('/api/admin/stats', adminRateLimit, isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      // Get all stats for admin dashboard
      const allUsers = await storage.getAllUsers();
      const allBusinesses = await storage.getAllBusinesses();
      const allOrders = await storage.getAllOrders();

      // Calculate total revenue
      const totalRevenue = allOrders.reduce((sum, order) => {
        const total = parseFloat(order.total || "0");
        return sum + (total * 100); // Convert to cents
      }, 0);

      // Count pending approvals (businesses not verified)
      const pendingApprovals = allBusinesses.filter(b => !b.isVerified).length;

      // Count active users (logged in within last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUsers = allUsers.filter(u => {
        const lastSeen = u.lastSeenAt ? new Date(u.lastSeenAt) : null;
        return lastSeen && lastSeen > oneDayAgo;
      }).length;

      res.json({
        totalUsers: allUsers.length,
        totalBusinesses: allBusinesses.length,
        totalOrders: allOrders.length,
        totalRevenue,
        pendingApprovals,
        activeUsers,
});
    } catch (error: any) {
      console.error("Error getting admin stats:", error);
      res.status(500).json({ message: error.message || "Failed to get admin stats" });
    }
});

  // Get all users (admin only)
  app.get('/api/admin/users', adminRateLimit, isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      console.error("Error getting all users:", error);
      res.status(500).json({ message: error.message || "Failed to get users" });
    }
});

  // Get all businesses (admin only)
  app.get('/api/admin/businesses', adminRateLimit, isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const businesses = await storage.getAllBusinesses();
      res.json(businesses);
    } catch (error: any) {
      console.error("Error getting all businesses:", error);
      res.status(500).json({ message: error.message || "Failed to get businesses" });
    }
});

  // Get all orders (admin only)
  app.get('/api/admin/orders', adminRateLimit, isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error: any) {
      console.error("Error getting all orders:", error);
      res.status(500).json({ message: error.message || "Failed to get orders" });
    }
});

  // Admin user actions
  app.post('/api/admin/users/:userId/:action', adminRateLimit, isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId, action } = req.params;
      const adminId = req.user.claims.sub;

      // Prevent self-modification
      if (userId === adminId && (action === 'ban' || action === 'promote')) {
        return ApiResponse.badRequest(res, "Validation error");
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      switch (action) {
        case 'promote':
          // Toggle admin status
          await storage.updateUser(userId, { isAdmin: !user.isAdmin });
          res.json({ message: `User ${user.isAdmin ? 'demoted from' : 'promoted to'} admin` });
          break;

        case 'ban':
          // In a real system, you'd have a 'banned' field
          // For now, we'll just return success
          res.json({ message: "User ban functionality to be implemented" });
          break;

        case 'view':
          res.json(user);
          break;

        default:
          res.status(400).json({ message: "Invalid action" });
      }
    } catch (error: any) {
      console.error("Error performing user action:", error);
      res.status(500).json({ message: error.message || "Failed to perform action" });
    }
});

  // Admin business actions
  app.post('/api/admin/businesses/:businessId/:action', adminRateLimit, isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { businessId, action } = req.params;

      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }

      switch (action) {
        case 'verify':
          // Toggle verification status
          await storage.updateBusiness(businessId, { name: business.name, isVerified: !business.isVerified });
          res.json({ message: `Business ${business.isVerified ? 'unverified' : 'verified'}` });
          break;

        case 'activate':
          await storage.updateBusiness(businessId, { name: business.name, isActive: true });
          res.json({ message: "Business activated" });
          break;

        case 'deactivate':
          await storage.updateBusiness(businessId, { name: business.name, isActive: false });
          res.json({ message: "Business deactivated" });
          break;

        case 'view':
          res.json(business);
          break;

        case 'delete':
          // In production, you'd likely soft-delete or archive
          res.json({ message: "Business deletion to be implemented" });
          break;

        default:
          res.status(400).json({ message: "Invalid action" });
      }
    } catch (error: any) {
      console.error("Error performing business action:", error);
      res.status(500).json({ message: error.message || "Failed to perform action" });
    }
});

  // Get detailed user information for admin (with all related data)
  app.get('/api/admin/users/:userId/details', adminRateLimit, isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's businesses
      const businesses = await storage.getBusinessesByOwner(userId);

      // Get user's orders
      const orders = await storage.getOrdersByUser(userId);

      // Get loyalty account
      const { LoyaltyStorage } = await import("./loyaltyStorage");
      const loyaltyStorage = new LoyaltyStorage();
      const loyaltyAccount = await loyaltyStorage.getLoyaltyAccount(userId);

      // Get recent loyalty transactions
      const loyaltyTransactions = loyaltyAccount
        ? await loyaltyStorage.getTransactionHistory(userId, { limit: 10 })
        : [];

      // Get referrals made by user
      const referrals = loyaltyAccount
        ? await loyaltyStorage.getUserReferrals(userId)
        : [];

      res.json({
        user,
        businesses,
        orders,
        loyaltyAccount,
        loyaltyTransactions,
        referrals,
        stats: {
          totalBusinesses: businesses.length,
          totalOrders: orders.length,
          totalSpent: orders.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0),
          loyaltyPoints: loyaltyAccount?.currentPoints || 0,
          referralCount: referrals.length,
        }
});
    } catch (error: any) {
      console.error("Error getting user details:", error);
      res.status(500).json({ message: error.message || "Failed to get user details" });
    }
});

  // Get detailed business information for admin (with all related data)
  app.get('/api/admin/businesses/:businessId/details', adminRateLimit, isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { businessId } = req.params;

      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return ApiResponse.notFound(res, "Business not found");
      }

      // Get business owner
      const owner = await storage.getUser(business.ownerId);

      // Get products
      const products = await storage.getProductsByBusiness(businessId);

      // Get posts
      const posts = await storage.getPostsByBusiness(businessId);

      // Get orders for this business
      const allOrders = await storage.getAllOrders();
      const productIds = new Set(products.map(p => p.id));
      const businessOrders = [];
      
      for (const order of allOrders) {
        const orderItems = await storage.getOrderItemsWithProducts(order.id);
        const hasBusinessProducts = orderItems.some(item => productIds.has(item.productId));
        if (hasBusinessProducts) {
          businessOrders.push(order);
        }
      }

      // Calculate revenue
      const totalRevenue = businessOrders.reduce((sum, order) =>
        sum + parseFloat(order.total || "0"), 0
      );

      // Get GMB sync status if connected
      let gmbStatus = null;
      if (business.gmbConnected) {
        gmbStatus = {
          connected: business.gmbConnected,
          verified: business.gmbVerified,
          syncStatus: business.gmbSyncStatus,
          lastSyncAt: business.gmbLastSyncAt,
          lastError: business.gmbLastError,
        };
      }

      // Get Stripe status if connected
      let stripeStatus = null;
      if (business.stripeAccountId) {
        stripeStatus = {
          accountId: business.stripeAccountId,
          onboardingStatus: business.stripeOnboardingStatus,
          chargesEnabled: business.stripeChargesEnabled,
          payoutsEnabled: business.stripePayoutsEnabled,
        };
      }

      res.json({
        business,
        owner,
        products,
        posts,
        orders: businessOrders,
        gmbStatus,
        stripeStatus,
        stats: {
          totalProducts: products.length,
          totalPosts: posts.length,
          totalOrders: businessOrders.length,
          totalRevenue,
          avgRating: parseFloat(business.rating || "0"),
          reviewCount: business.reviewCount || 0,
          followerCount: business.followerCount || 0,
        }
});
    } catch (error: any) {
      console.error("Error getting business details:", error);
      res.status(500).json({ message: error.message || "Failed to get business details" });
    }
});

  // Get content moderation data (blog posts, posts, products)
  app.get('/api/admin/content', adminRateLimit, isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { type, status, limit = 50, offset = 0 } = req.query;

      // Get blog posts
      const blogPosts = await storage.getBlogPosts({
        status: status as string || 'all',
        limit: Number(limit),
        offset: Number(offset),
});

      // Get business posts
      const allPosts = await storage.getAllPosts();

      // Get products
      const allProducts = await storage.getAllProducts();

      res.json({
        blogPosts: {
          items: blogPosts,
          total: blogPosts.length,
        },
        posts: {
          items: allPosts.slice(Number(offset), Number(offset) + Number(limit)),
          total: allPosts.length,
        },
        products: {
          items: allProducts.slice(Number(offset), Number(offset) + Number(limit)),
          total: allProducts.length,
        }
});
    } catch (error: any) {
      console.error("Error getting content:", error);
      res.status(500).json({ message: error.message || "Failed to get content" });
    }
});

  // Get marketing overview for admin
  app.get('/api/admin/marketing', adminRateLimit, isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { MarketingStorage } = await import("./marketingStorage");
      const marketingStorage = new MarketingStorage();

      // Get all campaigns across all businesses
      const campaigns = await marketingStorage.getAllCampaigns({ limit: 100 });

      // Get all segments
      const segments = await marketingStorage.getAllSegments({ limit: 100 });

      // Calculate stats
      const campaignStats = {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
        draft: campaigns.filter(c => c.status === 'draft').length,
      };

      const segmentStats = {
        total: segments.length,
        avgSize: segments.reduce((sum, s) => sum + (s.memberCount || 0), 0) / segments.length || 0,
      };

      res.json({
        campaigns: {
          items: campaigns.slice(0, 20),
          stats: campaignStats,
        },
        segments: {
          items: segments.slice(0, 20),
          stats: segmentStats,
        }
});
    } catch (error: any) {
      console.error("Error getting marketing data:", error);
      res.status(500).json({ message: error.message || "Failed to get marketing data" });
    }
});

  // Get loyalty overview for admin
  app.get('/api/admin/loyalty', adminRateLimit, isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { LoyaltyStorage } = await import("./loyaltyStorage");
      const loyaltyStorage = new LoyaltyStorage();

      // Get all loyalty accounts
      const accounts = await loyaltyStorage.getAllAccounts({ limit: 1000 });

      // Get all tiers
      const tiers = await loyaltyStorage.getAllTiers();

      // Get all rewards
      const rewards = await loyaltyStorage.getAllRewards({ limit: 100 });

      // Get recent redemptions
      const redemptions = await loyaltyStorage.getRecentRedemptions({ limit: 50 });

      // Calculate distribution by tier
      const tierDistribution = tiers.map(tier => ({
        tier: tier.name,
        count: accounts.filter(a => a.tierId === tier.id).length,
      }));

      // Calculate stats
      const totalPointsIssued = accounts.reduce((sum, a) => sum + (a.lifetimePoints || 0), 0);
      const totalPointsAvailable = accounts.reduce((sum, a) => sum + (a.currentPoints || 0), 0);

      res.json({
        accounts: {
          total: accounts.length,
          items: accounts.slice(0, 20),
        },
        tiers: {
          items: tiers,
          distribution: tierDistribution,
        },
        rewards: {
          items: rewards,
          total: rewards.length,
        },
        redemptions: {
          items: redemptions,
          pending: redemptions.filter(r => r.status === 'pending').length,
          completed: redemptions.filter(r => r.status === 'completed').length,
        },
        stats: {
          totalPointsIssued,
          totalPointsAvailable,
          activeMembers: accounts.length,
        }
});
    } catch (error: any) {
      console.error("Error getting loyalty data:", error);
      res.status(500).json({ message: error.message || "Failed to get loyalty data" });
    }
});

  // Get system health and monitoring data
  app.get('/api/admin/system', adminRateLimit, isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      // Check Redis connection
      const redisStatus = await checkRedisConnection();

      // Get database stats
      const allUsers = await storage.getAllUsers();
      const allBusinesses = await storage.getAllBusinesses();
      const allOrders = await storage.getAllOrders();

      // Calculate platform metrics
      const platformMetrics = {
        totalUsers: allUsers.length,
        totalBusinesses: allBusinesses.length,
        totalOrders: allOrders.length,
        verifiedBusinesses: allBusinesses.filter(b => b.isVerified).length,
        activeBusinesses: allBusinesses.filter(b => b.isActive).length,
      };

      // System health
      const systemHealth = {
        redis: redisStatus ? 'healthy' : 'unhealthy',
        database: 'healthy', // If we got here, DB is working
        timestamp: new Date().toISOString(),
      };

      res.json({
        health: systemHealth,
        metrics: platformMetrics,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
});
    } catch (error: any) {
      console.error("Error getting system data:", error);
      res.status(500).json({
        message: error.message || "Failed to get system data",
        health: {
          redis: 'unknown',
          database: 'unhealthy',
          timestamp: new Date().toISOString(),
        }
});
    }
});

  // ====================================================================
  // SOCIAL MEDIA HUB ROUTES
  // ====================================================================

  // Social Media Account Management
  app.get('/api/social-media/accounts/:businessId', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const accounts = await socialMediaService.getAccounts(req.params.businessId);
      res.json(accounts);
    } catch (error: any) {
      console.error("Error fetching social media accounts:", error);
      res.status(500).json({ message: error.message || "Failed to fetch accounts" });
    }
  });

  app.post('/api/social-media/accounts/connect', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertSocialMediaAccountSchema.parse({
        ...req.body,
        userId,
      });
      const account = await socialMediaService.connectAccount(data);
      res.json(account);
    } catch (error: any) {
      console.error("Error connecting social media account:", error);
      res.status(500).json({ message: error.message || "Failed to connect account" });
    }
  });

  app.post('/api/social-media/accounts/:accountId/disconnect', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      await socialMediaService.disconnectAccount(req.params.accountId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error disconnecting account:", error);
      res.status(500).json({ message: error.message || "Failed to disconnect account" });
    }
  });

  // Content Publishing
  app.post('/api/social-media/posts', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertSocialMediaPostSchema.parse({
        ...req.body,
        authorId: userId,
      });
      const post = await socialMediaService.createPost(data);
      res.json(post);
    } catch (error: any) {
      console.error("Error creating social media post:", error);
      res.status(500).json({ message: error.message || "Failed to create post" });
    }
  });

  app.get('/api/social-media/posts/:businessId', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { status, platform, campaignId, startDate, endDate } = req.query;
      const posts = await storage.getSocialMediaPosts(req.params.businessId, {
        status: status as string,
        platform: platform as string,
        campaignId: campaignId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json(posts);
    } catch (error: any) {
      console.error("Error fetching social media posts:", error);
      res.status(500).json({ message: error.message || "Failed to fetch posts" });
    }
  });

  app.post('/api/social-media/posts/:postId/publish', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const post = await storage.getSocialMediaPostById(req.params.postId);
      if (!post) {
        return ApiResponse.notFound(res, "Post not found");
      }
      await socialMediaService.publishPost(post);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error publishing post:", error);
      res.status(500).json({ message: error.message || "Failed to publish post" });
    }
  });

  app.post('/api/social-media/posts/bulk-schedule', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { csvData, businessId } = req.body;
      const posts = await socialMediaService.bulkSchedulePosts(csvData, businessId, userId);
      res.json(posts);
    } catch (error: any) {
      console.error("Error bulk scheduling posts:", error);
      res.status(500).json({ message: error.message || "Failed to bulk schedule posts" });
    }
  });

  // Analytics
  app.get('/api/social-media/analytics/:businessId', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      const dateRange = {
        start: new Date(startDate as string || Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(endDate as string || Date.now()),
      };
      const analytics = await socialMediaService.fetchAnalytics(req.params.businessId, dateRange);
      res.json(analytics);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: error.message || "Failed to fetch analytics" });
    }
  });

  app.get('/api/social-media/analytics/:businessId/summary', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { platform, dateRange } = req.query;
      const analytics = await storage.getSocialMediaAnalytics(req.params.businessId, {
        platform: platform as string,
        dateRange: dateRange ? JSON.parse(dateRange as string) : undefined,
      });
      
      // Calculate summary metrics
      const summary = {
        totalImpressions: analytics.reduce((sum, a) => sum + (a.impressions || 0), 0),
        totalEngagements: analytics.reduce((sum, a) => sum + (a.engagements || 0), 0),
        totalReach: analytics.reduce((sum, a) => sum + (a.reach || 0), 0),
        avgEngagementRate: analytics.reduce((sum, a) => sum + Number(a.engagementRate || 0), 0) / analytics.length,
        platforms: [...new Set(analytics.map(a => a.platform))],
      };
      
      res.json({ analytics, summary });
    } catch (error: any) {
      console.error("Error fetching analytics summary:", error);
      res.status(500).json({ message: error.message || "Failed to fetch analytics summary" });
    }
  });

  // Messages & Inbox
  app.get('/api/social-media/messages/:businessId', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      await socialMediaService.fetchMessages(req.params.businessId);
      const messages = await storage.getSocialMediaMessages(req.params.businessId, {
        platform: req.query.platform as string,
        status: req.query.status as string,
        priority: req.query.priority as string,
        assignedTo: req.query.assignedTo as string,
      });
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: error.message || "Failed to fetch messages" });
    }
  });

  app.post('/api/social-media/messages/:messageId/reply', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { response } = req.body;
      await socialMediaService.sendMessage(req.params.messageId, response);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error replying to message:", error);
      res.status(500).json({ message: error.message || "Failed to send reply" });
    }
  });

  app.put('/api/social-media/messages/:messageId/status', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { status, assignedTo, priority } = req.body;
      await storage.updateSocialMediaMessage(req.params.messageId, {
        status,
        assignedTo,
        priority,
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating message status:", error);
      res.status(500).json({ message: error.message || "Failed to update message status" });
    }
  });

  // Campaigns
  app.post('/api/social-media/campaigns', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertSocialMediaCampaignSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const campaign = await socialMediaService.createCampaign(data);
      res.json(campaign);
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: error.message || "Failed to create campaign" });
    }
  });

  app.get('/api/social-media/campaigns/:businessId', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const campaigns = await storage.getSocialMediaCampaigns(req.params.businessId);
      res.json(campaigns);
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: error.message || "Failed to fetch campaigns" });
    }
  });

  app.put('/api/social-media/campaigns/:campaignId/metrics', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      await socialMediaService.updateCampaignMetrics(req.params.campaignId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating campaign metrics:", error);
      res.status(500).json({ message: error.message || "Failed to update campaign metrics" });
    }
  });

  // Content Suggestions
  app.post('/api/social-media/hashtags/suggest', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { content, platform } = req.body;
      const hashtags = await socialMediaService.generateHashtags(content, platform);
      res.json(hashtags);
    } catch (error: any) {
      console.error("Error generating hashtags:", error);
      res.status(500).json({ message: error.message || "Failed to generate hashtags" });
    }
  });

  app.get('/api/social-media/optimal-times/:businessId', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { platform } = req.query;
      const times = await socialMediaService.suggestOptimalTimes(
        req.params.businessId, 
        platform as string
      );
      res.json(times);
    } catch (error: any) {
      console.error("Error suggesting optimal times:", error);
      res.status(500).json({ message: error.message || "Failed to suggest optimal times" });
    }
  });

  // Social Listening
  app.post('/api/social-media/listeners', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const data = insertSocialMediaListenerSchema.parse(req.body);
      const listener = await socialMediaService.createListener(data);
      res.json(listener);
    } catch (error: any) {
      console.error("Error creating listener:", error);
      res.status(500).json({ message: error.message || "Failed to create listener" });
    }
  });

  app.get('/api/social-media/mentions/:businessId', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const mentions = await socialMediaService.checkMentions(req.params.businessId);
      res.json(mentions);
    } catch (error: any) {
      console.error("Error fetching mentions:", error);
      res.status(500).json({ message: error.message || "Failed to fetch mentions" });
    }
  });

  // Automation
  app.post('/api/social-media/automation', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const data = insertSocialMediaAutomationSchema.parse(req.body);
      const automation = await socialMediaService.createAutomation(data);
      res.json(automation);
    } catch (error: any) {
      console.error("Error creating automation:", error);
      res.status(500).json({ message: error.message || "Failed to create automation" });
    }
  });

  app.post('/api/social-media/automation/:automationId/run', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      await socialMediaService.runAutomation(req.params.automationId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error running automation:", error);
      res.status(500).json({ message: error.message || "Failed to run automation" });
    }
  });

  app.get('/api/social-media/automation/:businessId', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const automations = await storage.getSocialMediaAutomations(req.params.businessId);
      res.json(automations);
    } catch (error: any) {
      console.error("Error fetching automations:", error);
      res.status(500).json({ message: error.message || "Failed to fetch automations" });
    }
  });

  // Team Management
  app.post('/api/social-media/team', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const invitedBy = req.user.claims.sub;
      const data = insertSocialMediaTeamSchema.parse({
        ...req.body,
        invitedBy,
      });
      const member = await socialMediaService.addTeamMember(data);
      res.json(member);
    } catch (error: any) {
      console.error("Error adding team member:", error);
      res.status(500).json({ message: error.message || "Failed to add team member" });
    }
  });

  app.put('/api/social-media/team/:memberId/permissions', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      await socialMediaService.updateTeamMemberPermissions(req.params.memberId, req.body);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating permissions:", error);
      res.status(500).json({ message: error.message || "Failed to update permissions" });
    }
  });

  app.get('/api/social-media/team/:businessId', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const members = await socialMediaService.getTeamMembers(req.params.businessId);
      res.json(members);
    } catch (error: any) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: error.message || "Failed to fetch team members" });
    }
  });

  // Content Categories
  app.post('/api/social-media/categories', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const data = insertSocialContentCategorySchema.parse(req.body);
      const category = await socialMediaService.createCategory(data);
      res.json(category);
    } catch (error: any) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: error.message || "Failed to create category" });
    }
  });

  app.get('/api/social-media/categories/:businessId', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const categories = await socialMediaService.getCategories(req.params.businessId);
      res.json(categories);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: error.message || "Failed to fetch categories" });
    }
  });

  // Response Templates
  app.post('/api/social-media/templates', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const data = insertSocialResponseTemplateSchema.parse(req.body);
      const template = await socialMediaService.createResponseTemplate(data);
      res.json(template);
    } catch (error: any) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: error.message || "Failed to create template" });
    }
  });

  app.get('/api/social-media/templates/:businessId', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const templates = await socialMediaService.getResponseTemplates(req.params.businessId);
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: error.message || "Failed to fetch templates" });
    }
  });

  app.post('/api/social-media/templates/:templateId/use', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const content = await socialMediaService.useResponseTemplate(req.params.templateId);
      res.json({ content });
    } catch (error: any) {
      console.error("Error using template:", error);
      res.status(500).json({ message: error.message || "Failed to use template" });
    }
  });

  // Refresh tokens for all connected accounts
  app.post('/api/social-media/refresh-tokens/:businessId', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const accounts = await storage.getSocialMediaAccounts(req.params.businessId);
      const results = [];
      
      for (const account of accounts) {
        try {
          await socialMediaService.refreshTokens(account.id);
          results.push({ accountId: account.id, status: 'success' });
        } catch (error) {
          results.push({ 
            accountId: account.id, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
      
      res.json(results);
    } catch (error: any) {
      console.error("Error refreshing tokens:", error);
      res.status(500).json({ message: error.message || "Failed to refresh tokens" });
    }
  });

  // Register AI content generation routes
  const { aiContentRoutes } = await import("./aiContentRoutes");
  app.use('/api/ai', aiContentRoutes);

  // Register blog routes (Phase 4)
  const { registerBlogRoutes } = await import("./blogRoutes");
  registerBlogRoutes(app);

  // Register marketing automation routes (Phase 5)
  const { registerMarketingRoutes } = await import("./marketingRoutes");
  registerMarketingRoutes(app);

  // Register AI-enhanced marketing routes (Phase 5 - Enterprise AI)
  const { registerAIMarketingRoutes } = await import("./aiMarketingRoutes");
  registerAIMarketingRoutes(app);

  // Register marketplace AI agent routes (Phase 5.2 - Marketplace Intelligence)
  const { registerMarketplaceAgentRoutes } = await import("./marketplaceAgentRoutes");
  registerMarketplaceAgentRoutes(app);

  // Register loyalty & rewards routes (Phase 6 - Loyalty System)
  const { registerLoyaltyRoutes } = await import("./loyaltyRoutes");
  registerLoyaltyRoutes(app);

  // Register analytics & BI routes (Phase 7 - Advanced Analytics)
  const { registerAnalyticsRoutes } = await import("./analyticsRoutes");
  registerAnalyticsRoutes(app);

  // Register enterprise monitoring and health check routes
  const { registerMonitoringRoutes } = await import("./monitoringRoutes");
  registerMonitoringRoutes(app);

  // Register enterprise error handling and performance monitoring (must be last)
  const { errorHandlerMiddleware, performanceMiddleware } = await import("./errorHandler");
  app.use(performanceMiddleware);
  app.use(errorHandlerMiddleware);

  // Register social media OAuth routes
  registerSocialAuthRoutes(app);

  // Start automatic token refresh service (runs every 4 hours)
  startTokenRefreshService(4);
  console.log('✅ Automatic social media token refresh service started');

  // Admin endpoint to check token refresh status
  app.get('/api/admin/token-status', isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const status = await getTokenRefreshStatus();
      res.json({ tokens: status });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get token status' });
    }
});

  const httpServer = createServer(app);

  // Initialize WebSocket server
  const { initWebSocket } = await import("./websocket");
  initWebSocket(httpServer);

  return httpServer;
}
