import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { isAdmin, adminRateLimit } from "./adminAuth";
import { votingRateLimit, businessActionRateLimit, generalAPIRateLimit, strictRateLimit, publicEndpointRateLimit } from "./rateLimit";
import { checkRedisConnection } from "./redis";
import { insertBusinessSchema, updateBusinessSchema, insertProductSchema, insertPostSchema, insertMessageSchema, insertCartItemSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import Stripe from "stripe";

// GMB Integration Services
import { gmbService } from "./gmbService";
import { businessVerificationService } from "./businessVerificationService";
import { dataSyncService } from "./dataSyncService";

// Stripe Connect Services
import * as stripeConnect from "./stripeConnect";

// Social Media OAuth Services
import { registerSocialAuthRoutes } from "./socialAuthRoutes";

// Initialize Stripe optionally; if key missing, endpoints will short-circuit
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware with graceful fallback
  console.log("🔧 Starting registerRoutes function");
  console.log("🔧 REPLIT_DOMAINS:", process.env.REPLIT_DOMAINS);
  console.log("🔧 SESSION_SECRET exists:", !!process.env.SESSION_SECRET);
  console.log("🔧 REPL_ID exists:", !!process.env.REPL_ID);
  
  try {
    console.log("🔧 Calling setupAuth...");
    await setupAuth(app);
    console.log("✅ Authentication middleware initialized");
  } catch (error) {
    console.error("❌ Failed to setup authentication:", error);
    console.error("❌ Error stack:", (error as Error).stack);
    console.log("⚠️ Server will start without session persistence");
    // Continue anyway - the app can still serve public routes
  }
  
  console.log("🔧 Setting up auth routes...");

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Business routes (SECURITY: Rate limited)
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
      res.status(400).json({ message: error.message || "Failed to create business" });
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
      res.status(500).json({ message: "Failed to search businesses" });
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
      res.status(500).json({ message: "Failed to fetch spotlight businesses" });
    }
  });

  app.get('/api/businesses/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const businesses = await storage.getBusinessesByOwner(userId);
      res.json(businesses);
    } catch (error) {
      console.error("Error fetching user businesses:", error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  app.get('/api/businesses/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const business = await storage.getBusinessById(id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  app.put('/api/businesses/:id', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Check if the business exists and if the user is the owner
      const existingBusiness = await storage.getBusinessById(id);
      if (!existingBusiness) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      if (existingBusiness.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this business" });
      }
      
      const businessData = updateBusinessSchema.parse(req.body);
      const business = await storage.updateBusiness(id, businessData);
      res.json(business);
    } catch (error: any) {
      console.error("Error updating business:", error);
      res.status(400).json({ message: error.message || "Failed to update business" });
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
      res.status(500).json({ message: "Failed to follow business" });
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
      res.status(500).json({ message: "Failed to unfollow business" });
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
        return res.status(404).json({ message: "Business not found" });
      }
      
      if (business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to connect GMB for this business" });
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
      res.status(500).json({ message: error.message || "Failed to initiate GMB connection" });
    }
  });

  // Handle GMB OAuth callback
  app.get('/api/gmb/oauth/callback', async (req, res) => {
    try {
      const { code, state: businessId, error } = req.query;
      
      if (error) {
        return res.status(400).json({ 
          message: "OAuth authorization failed", 
          error: error as string 
        });
      }
      
      if (!code || !businessId) {
        return res.status(400).json({ 
          message: "Missing authorization code or business ID" 
        });
      }

      // Get business to find owner
      const business = await storage.getBusinessById(businessId as string);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
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
      res.status(500).json({ message: error.message || "Failed to complete GMB connection" });
    }
  });

  // Search for GMB listings for business verification
  app.get('/api/gmb/search', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const { businessId } = req.query;
      
      if (!businessId) {
        return res.status(400).json({ message: "Business ID is required" });
      }

      const userId = req.user.claims.sub;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId as string);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      if (business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to search GMB for this business" });
      }

      // Search for GMB matches
      const searchResults = await businessVerificationService.searchGMBMatches(businessId as string);
      
      res.json(searchResults);
    } catch (error: any) {
      console.error("Error searching GMB listings:", error);
      res.status(500).json({ message: error.message || "Failed to search GMB listings" });
    }
  });

  // Initiate business verification with selected GMB listing
  app.post('/api/businesses/:id/gmb/verify', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const { gmbLocationName } = req.body;
      
      if (!gmbLocationName) {
        return res.status(400).json({ message: "GMB location name is required" });
      }

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      if (business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to verify this business" });
      }

      // Initiate verification process
      const result = await businessVerificationService.initiateVerification(
        businessId, 
        gmbLocationName
      );
      
      res.json(result);
    } catch (error: any) {
      console.error("Error initiating business verification:", error);
      res.status(500).json({ message: error.message || "Failed to initiate verification" });
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
        return res.status(404).json({ message: "Business not found" });
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
      res.status(500).json({ message: error.message || "Failed to fetch GMB status" });
    }
  });

  // Manual data synchronization trigger
  app.post('/api/businesses/:id/gmb/sync', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const { 
        forceUpdate = false, 
        syncPhotos = true, 
        syncReviews = true, 
        syncBusinessInfo = true,
        conflictResolution = 'merge'
      } = req.body;
      
      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      if (business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to sync this business" });
      }

      // Check if business is connected to GMB
      if (!business.gmbConnected) {
        return res.status(400).json({ 
          message: "Business is not connected to Google My Business" 
        });
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
      res.status(500).json({ message: error.message || "Failed to sync business data" });
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
        return res.status(404).json({ message: "Business not found" });
      }
      
      if (business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to view sync status for this business" });
      }

      // Get sync status and recent history
      const syncStatus = await gmbService.getSyncStatus(businessId);
      
      res.json(syncStatus);
    } catch (error: any) {
      console.error("Error fetching sync status:", error);
      res.status(500).json({ message: error.message || "Failed to fetch sync status" });
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
        return res.status(404).json({ message: "Business not found" });
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
      res.status(500).json({ message: error.message || "Failed to fetch GMB reviews" });
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
        return res.status(404).json({ message: "Business not found" });
      }
      
      if (business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to disconnect GMB for this business" });
      }

      // Disconnect GMB integration
      await gmbService.disconnectBusiness(businessId);
      
      res.json({ 
        success: true,
        message: "Successfully disconnected from Google My Business" 
      });
    } catch (error: any) {
      console.error("Error disconnecting GMB:", error);
      res.status(500).json({ message: error.message || "Failed to disconnect GMB" });
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
      res.status(500).json({ message: "Failed to process webhook" });
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
      res.status(500).json({ message: "Failed to fetch GMB statistics" });
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
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // =================== END GMB INTEGRATION ROUTES ===================

  // =================== STRIPE CONNECT VENDOR PAYOUT ROUTES ===================

  // Get Stripe Connect account status for a business
  app.get('/api/businesses/:id/stripe/status', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(501).json({ message: "Stripe Connect is not configured" });
      }

      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to view Stripe status for this business" });
      }

      if (!business.stripeAccountId) {
        return res.status(404).json({ message: "No Stripe Connect account found for this business" });
      }

      // Get account details
      const account = await stripeConnect.getConnectAccount(business.stripeAccountId);
      if (!account) {
        return res.status(404).json({ message: "Stripe account not found" });
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
      res.status(500).json({ message: error.message || "Failed to fetch Stripe status" });
    }
  });

  // Get account balance for a business
  app.get('/api/businesses/:id/stripe/balance', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(501).json({ message: "Stripe Connect is not configured" });
      }

      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to view balance for this business" });
      }

      if (!business.stripeAccountId) {
        return res.status(404).json({ message: "No Stripe Connect account found for this business" });
      }

      // Get balance
      const balance = await stripeConnect.getAccountBalance(business.stripeAccountId);
      if (!balance) {
        return res.status(404).json({ message: "Failed to retrieve balance" });
      }

      res.json({
        available: balance.available,
        pending: balance.pending,
      });
    } catch (error: any) {
      console.error("Error fetching Stripe balance:", error);
      res.status(500).json({ message: error.message || "Failed to fetch Stripe balance" });
    }
  });

  // List payouts for a business
  app.get('/api/businesses/:id/stripe/payouts', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(501).json({ message: "Stripe Connect is not configured" });
      }

      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to view payouts for this business" });
      }

      if (!business.stripeAccountId) {
        return res.status(404).json({ message: "No Stripe Connect account found for this business" });
      }

      // List payouts
      const result = await stripeConnect.listPayouts(business.stripeAccountId, limit);
      if (!result) {
        return res.status(404).json({ message: "Failed to retrieve payouts" });
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error fetching Stripe payouts:", error);
      res.status(500).json({ message: error.message || "Failed to fetch Stripe payouts" });
    }
  });

  // List balance transactions for a business
  app.get('/api/businesses/:id/stripe/transactions', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(501).json({ message: "Stripe Connect is not configured" });
      }

      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const startingAfter = req.query.startingAfter as string | undefined;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to view transactions for this business" });
      }

      if (!business.stripeAccountId) {
        return res.status(404).json({ message: "No Stripe Connect account found for this business" });
      }

      // List transactions
      const result = await stripeConnect.listBalanceTransactions(business.stripeAccountId, {
        limit,
        startingAfter,
      });
      if (!result) {
        return res.status(404).json({ message: "Failed to retrieve transactions" });
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error fetching Stripe transactions:", error);
      res.status(500).json({ message: error.message || "Failed to fetch Stripe transactions" });
    }
  });

  // Create a manual payout for a business
  app.post('/api/businesses/:id/stripe/payouts', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(501).json({ message: "Stripe Connect is not configured" });
      }

      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const { amount, description } = req.body;

      // Validate amount
      if (!amount || typeof amount !== 'number' || amount < 100) {
        return res.status(400).json({ message: "Amount must be at least $1.00 (100 cents)" });
      }

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to create payouts for this business" });
      }

      if (!business.stripeAccountId) {
        return res.status(404).json({ message: "No Stripe Connect account found for this business" });
      }

      // Check available balance
      const balance = await stripeConnect.getAccountBalance(business.stripeAccountId);
      if (!balance) {
        return res.status(400).json({ message: "Failed to retrieve account balance" });
      }

      const availableBalance = balance.available.find(b => b.currency === 'usd');
      if (!availableBalance || availableBalance.amount < amount) {
        return res.status(400).json({ 
          message: "Insufficient balance for payout",
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
        return res.status(400).json({ message: "Failed to create payout" });
      }

      res.json(payout);
    } catch (error: any) {
      console.error("Error creating Stripe payout:", error);
      res.status(500).json({ message: error.message || "Failed to create Stripe payout" });
    }
  });

  // Update payout settings for a business
  app.post('/api/businesses/:id/stripe/payout-settings', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(501).json({ message: "Stripe Connect is not configured" });
      }

      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;
      const { interval, delayDays } = req.body;

      // Validate interval
      const validIntervals = ['daily', 'weekly', 'monthly', 'manual'];
      if (!interval || !validIntervals.includes(interval)) {
        return res.status(400).json({ 
          message: "Invalid interval. Must be one of: daily, weekly, monthly, manual" 
        });
      }

      // Validate delayDays if provided
      if (delayDays !== undefined && (typeof delayDays !== 'number' || delayDays < 0)) {
        return res.status(400).json({ message: "Delay days must be a non-negative number" });
      }

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update payout settings for this business" });
      }

      if (!business.stripeAccountId) {
        return res.status(404).json({ message: "No Stripe Connect account found for this business" });
      }

      // Update payout settings
      const updatedAccount = await stripeConnect.updatePayoutSettings(
        business.stripeAccountId,
        { interval, delayDays }
      );

      if (!updatedAccount) {
        return res.status(400).json({ message: "Failed to update payout settings" });
      }

      res.json({
        accountId: updatedAccount.id,
        payoutSchedule: updatedAccount.settings?.payouts?.schedule,
      });
    } catch (error: any) {
      console.error("Error updating Stripe payout settings:", error);
      res.status(500).json({ message: error.message || "Failed to update Stripe payout settings" });
    }
  });

  // Stripe Connect webhook endpoint
  app.post('/api/stripe/connect/webhook', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(501).json({ message: "Stripe Connect is not configured" });
      }

      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("STRIPE_WEBHOOK_SECRET not configured");
        return res.status(500).json({ message: "Webhook secret not configured" });
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
      }

      // Handle the event
      await stripeConnect.handleConnectWebhook(event, storage);

      res.json({ received: true });
    } catch (error: any) {
      console.error("Error processing Stripe webhook:", error);
      res.status(500).json({ message: error.message || "Failed to process webhook" });
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
      res.status(500).json({ message: "Failed to check follow status" });
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
        return res.status(404).json({ message: "Business not found" });
      }
      
      if (existingBusiness.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this business" });
      }
      
      await storage.deleteBusiness(id);
      res.json({ message: "Business deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting business:", error);
      res.status(400).json({ message: error.message || "Failed to delete business" });
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
        return res.status(429).json({
          message: "Manual rotation not allowed at this time",
          reason: rotationCheck.reason,
          error: "ROTATION_COOLDOWN"
        });
      }

      await storage.rotateSpotlights();
      res.json({ 
        message: "Spotlight rotation triggered successfully",
        triggeredBy: req.adminUser.email,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error in admin spotlight rotation:", error);
      res.status(500).json({ message: "Failed to rotate spotlights" });
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
      res.status(500).json({ message: "Failed to fetch spotlight history" });
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
      res.status(500).json({ message: "Failed to fetch engagement metrics" });
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
      res.status(500).json({ message: "Failed to calculate engagement metrics" });
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
      res.status(500).json({ message: "Failed to fetch business score" });
    }
  });

  // Monthly spotlight voting endpoints
  
  // Vote for a business for monthly spotlight (SECURITY: Rate limited)
  app.post('/api/spotlight/vote', votingRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { businessId } = req.body;
      
      if (!businessId) {
        return res.status(400).json({ message: "Business ID is required" });
      }

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // SECURITY: Check if user has already voted THIS MONTH (only one vote per month total)
      const hasVoted = await storage.hasUserVoted(userId, currentMonth);
      if (hasVoted) {
        const existingVote = await storage.getUserVoteForMonth(userId, currentMonth);
        return res.status(400).json({ 
          message: "You have already voted this month", 
          votedBusinessId: existingVote?.businessId 
        });
      }

      // Verify business exists and is eligible
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const eligibleBusinesses = await storage.getEligibleBusinesses('monthly');
      const isEligible = eligibleBusinesses.some(b => b.id === businessId);
      if (!isEligible) {
        return res.status(400).json({ message: "Business is not eligible for spotlight voting" });
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
        return res.status(400).json({ message: "You have already voted this month" });
      }
      
      res.status(500).json({ message: "Failed to record vote" });
    }
  });

  // Get monthly vote counts
  app.get('/api/spotlight/votes/:month', async (req, res) => {
    try {
      const { month } = req.params;
      
      // Validate month format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
      }

      const voteCounts = await storage.getMonthlyVoteCounts(month);
      res.json(voteCounts);
    } catch (error) {
      console.error("Error fetching vote counts:", error);
      res.status(500).json({ message: "Failed to fetch vote counts" });
    }
  });

  // Get user's current vote status for a specific month (for UI state management)
  app.get('/api/spotlight/user-vote/:month', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { month } = req.params;
      
      // Validate month format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
      }
      
      const userVote = await storage.getUserVoteForMonth(userId, month);
      res.json({ 
        hasVoted: !!userVote,
        votedBusinessId: userVote?.businessId || null,
        voteDate: userVote?.createdAt || null
      });
    } catch (error) {
      console.error("Error checking user vote status:", error);
      res.status(500).json({ message: "Failed to check vote status" });
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
      res.status(500).json({ message: "Failed to check vote status" });
    }
  });

  // Get eligible businesses for spotlight voting
  app.get('/api/spotlight/eligible/:type', async (req, res) => {
    try {
      const { type } = req.params;

      if (!['daily', 'weekly', 'monthly'].includes(type)) {
        return res.status(400).json({ message: "Invalid spotlight type. Use daily, weekly, or monthly" });
      }

      const eligibleBusinesses = await storage.getEligibleBusinesses(type as 'daily' | 'weekly' | 'monthly');
      res.json(eligibleBusinesses);
    } catch (error) {
      console.error("Error fetching eligible businesses:", error);
      res.status(500).json({ message: "Failed to fetch eligible businesses" });
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
      res.status(500).json({ message: "Failed to fetch eligible businesses" });
    }
  });

  app.get('/api/spotlight/voting/stats', async (req, res) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const stats = await storage.getVotingStats(currentMonth);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching voting stats:", error);
      res.status(500).json({ message: "Failed to fetch voting stats" });
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
      res.status(500).json({ message: "Failed to fetch user votes" });
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
      res.status(500).json({ message: "Failed to fetch trending businesses" });
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
      res.status(500).json({ message: "Failed to fetch business leaderboard" });
    }
  });

  app.get('/api/leaderboard/voters', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getTopVoters(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching voters leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch voters leaderboard" });
    }
  });

  app.get('/api/leaderboard/reviewers', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getTopReviewers(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching reviewers leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch reviewers leaderboard" });
    }
  });

  app.get('/api/leaderboard/buyers', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getTopBuyers(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching buyers leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch buyers leaderboard" });
    }
  });

  // Admin endpoints for manual spotlight management
  
  // SECURITY: Admin-only daily spotlight selection
  app.post('/api/admin/spotlight/daily', isAuthenticated, isAdmin, adminRateLimit, async (req: any, res) => {
    try {
      console.log(`Admin daily spotlight selection by: ${req.adminUser.email}`);
      const selectedBusinesses = await storage.selectDailySpotlights();
      res.json({ 
        message: "Daily spotlights selected successfully", 
        businesses: selectedBusinesses,
        selectedBy: req.adminUser.email
      });
    } catch (error) {
      console.error("Error in admin daily spotlight selection:", error);
      res.status(500).json({ message: "Failed to select daily spotlights" });
    }
  });

  // SECURITY: Admin-only weekly spotlight selection
  app.post('/api/admin/spotlight/weekly', isAuthenticated, isAdmin, adminRateLimit, async (req: any, res) => {
    try {
      console.log(`Admin weekly spotlight selection by: ${req.adminUser.email}`);
      const selectedBusinesses = await storage.selectWeeklySpotlights();
      res.json({ 
        message: "Weekly spotlights selected successfully", 
        businesses: selectedBusinesses,
        selectedBy: req.adminUser.email
      });
    } catch (error) {
      console.error("Error in admin weekly spotlight selection:", error);
      res.status(500).json({ message: "Failed to select weekly spotlights" });
    }
  });

  // SECURITY: Admin-only monthly spotlight selection
  app.post('/api/admin/spotlight/monthly', isAuthenticated, isAdmin, adminRateLimit, async (req: any, res) => {
    try {
      console.log(`Admin monthly spotlight selection by: ${req.adminUser.email}`);
      const selectedBusinesses = await storage.selectMonthlySpotlight();
      res.json({ 
        message: "Monthly spotlight selected successfully", 
        businesses: selectedBusinesses,
        selectedBy: req.adminUser.email
      });
    } catch (error) {
      console.error("Error in admin monthly spotlight selection:", error);
      res.status(500).json({ message: "Failed to select monthly spotlight" });
    }
  });

  // SECURITY: Admin-only spotlight history access
  app.get('/api/admin/spotlight/history/:type/:days', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { type, days } = req.params;
      
      if (!['daily', 'weekly', 'monthly'].includes(type)) {
        return res.status(400).json({ message: "Invalid spotlight type" });
      }

      const daysNum = parseInt(days);
      if (isNaN(daysNum) || daysNum < 1 || daysNum > 90) {
        return res.status(400).json({ message: "Days must be between 1 and 90" });
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
      res.status(500).json({ message: "Failed to fetch spotlight history" });
    }
  });

  // SECURITY: Admin-only spotlight archiving
  app.post('/api/admin/spotlight/archive', isAuthenticated, isAdmin, adminRateLimit, async (req: any, res) => {
    try {
      console.log(`Admin spotlight archiving by: ${req.adminUser.email}`);
      await storage.archiveExpiredSpotlights();
      res.json({ 
        message: "Expired spotlights archived successfully",
        archivedBy: req.adminUser.email,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error in admin spotlight archiving:", error);
      res.status(500).json({ message: "Failed to archive expired spotlights" });
    }
  });

  // Object Storage routes - for serving public assets
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
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
        return res.status(400).json({ error: "Invalid object ID" });
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
        return res.status(403).json({ error: "Access denied - image not public" });
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
        return res.status(404).json({ error: "Image not found" });
      }
      return res.status(500).json({ error: "Failed to serve image" });
    }
  });

  // Upload endpoint - get presigned URL for object upload with validation
  app.post("/api/objects/upload", isAuthenticated, async (req: any, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      // Add request validation for security
      const { fileType, fileSize } = req.body;
      
      // Validate MIME type (server-side allowlist)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (fileType && !allowedTypes.includes(fileType.toLowerCase())) {
        return res.status(400).json({ 
          error: "Invalid file type", 
          message: "Only JPEG, PNG, GIF, and WebP images are allowed" 
        });
      }
      
      // Validate file size (5MB max)
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB
      if (fileSize && fileSize > maxSizeBytes) {
        return res.status(400).json({ 
          error: "File too large", 
          message: "Maximum file size is 5MB" 
        });
      }
      
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Update business images endpoint - set ACL policies after upload
  app.put("/api/business-images", isAuthenticated, async (req: any, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    const userId = req.user?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          // Business images should be public so they can be displayed to all users
          visibility: "public",
        },
      );
      
      // Extract object ID from path for public URL
      const objectId = objectStorageService.extractObjectIdFromPath(objectPath);
      const publicURL = `/api/images/public/${objectId}`;

      res.status(200).json({
        objectPath: objectPath,
        publicURL: publicURL,
      });
    } catch (error) {
      console.error("Error setting business image:", error);
      res.status(500).json({ error: "Internal server error" });
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
      res.status(400).json({ message: error.message || "Failed to create product" });
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
      res.status(500).json({ message: "Failed to search products" });
    }
  });

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
      res.status(500).json({ message: "Failed to fetch featured products" });
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
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.put('/api/products/:id', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: productId } = req.params;
      
      // Get product and verify ownership through business
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const business = await storage.getBusinessById(product.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this product" });
      }
      
      const productData = insertProductSchema.parse({
        ...req.body,
        businessId: product.businessId, // Preserve original business
      });
      
      const updatedProduct = await storage.updateProduct(productId, productData);
      res.json(updatedProduct);
    } catch (error: any) {
      console.error("Error updating product:", error);
      res.status(400).json({ message: error.message || "Failed to update product" });
    }
  });

  // Product Image Upload Routes
  app.post('/api/products/:productId/images/upload-url', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.params;
      const { filename } = req.body;

      if (!filename) {
        return res.status(400).json({ message: "Filename is required" });
      }

      // Get product and verify ownership through business
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const business = await storage.getBusinessById(product.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to upload images for this product" });
      }

      // Validate file extension
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ message: "Invalid file type. Allowed: JPEG, PNG, WebP" });
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
      res.status(500).json({ message: error.message || "Failed to generate upload URL" });
    }
  });

  app.post('/api/products/:productId/images', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.params;
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }

      // Get product and verify ownership through business
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const business = await storage.getBusinessById(product.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to modify this product" });
      }

      // Check if we already have 5 images
      const currentImages = (product.images as string[]) || [];
      if (currentImages.length >= 5) {
        return res.status(400).json({ message: "Maximum of 5 images allowed per product" });
      }

      // Add new image URL to the array
      const updatedImages = [...currentImages, imageUrl];
      const updatedProduct = await storage.updateProductImages(productId, updatedImages);

      res.json(updatedProduct);
    } catch (error: any) {
      console.error("Error saving product image:", error);
      res.status(500).json({ message: error.message || "Failed to save product image" });
    }
  });

  app.delete('/api/products/:productId/images', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.params;
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }

      // Get product and verify ownership through business
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const business = await storage.getBusinessById(product.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to modify this product" });
      }

      // Remove image URL from the array
      const currentImages = (product.images as string[]) || [];
      const updatedImages = currentImages.filter((img: string) => img !== imageUrl);
      const updatedProduct = await storage.updateProductImages(productId, updatedImages);

      res.json(updatedProduct);
    } catch (error: any) {
      console.error("Error deleting product image:", error);
      res.status(500).json({ message: error.message || "Failed to delete product image" });
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
      res.status(400).json({ message: error.message || "Failed to create post" });
    }
  });

  app.get('/api/posts', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const posts = await storage.getRecentPosts(limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get('/api/businesses/:id/posts', async (req, res) => {
    try {
      const { id: businessId } = req.params;
      const posts = await storage.getPostsByBusiness(businessId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching business posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
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
      res.status(500).json({ message: "Failed to like post" });
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
      res.status(500).json({ message: "Failed to unlike post" });
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
      res.status(500).json({ message: "Failed to check like status" });
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
      res.status(400).json({ message: error.message || "Failed to send message" });
    }
  });

  // File upload for messages
  app.post('/api/messages/upload', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const { receiverId, file } = req.body;
      
      if (!file || !receiverId) {
        return res.status(400).json({ message: "File and receiver ID are required" });
      }

      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        return res.status(400).json({ message: "File type not allowed" });
      }

      if (file.size > maxSize) {
        return res.status(400).json({ message: "File size too large (max 10MB)" });
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
      res.status(500).json({ message: error.message || "Failed to upload file" });
    }
  });

  // Share business in message
  app.post('/api/messages/share-business', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const { receiverId, businessId } = req.body;
      
      if (!receiverId || !businessId) {
        return res.status(400).json({ message: "Receiver ID and business ID are required" });
      }

      // Verify business exists
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
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
      res.status(500).json({ message: error.message || "Failed to share business" });
    }
  });

  app.get('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
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
        return res.status(403).json({ message: "Access denied to this conversation" });
      }
      
      const messages = await storage.getConversationMessages(conversationId, offset, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
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
      res.status(500).json({ message: "Failed to fetch messages" });
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
        return res.status(404).json({ message: "Message not found" });
      }
      
      if (message.receiverId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.markMessageAsRead(messageId, new Date());
      res.json({ message: "Message marked as read" });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
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
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Search messages
  app.get('/api/messages/search', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const query = req.query.q as string;
      
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      const messages = await storage.searchMessages(userId, query.trim());
      res.json(messages);
    } catch (error) {
      console.error("Error searching messages:", error);
      res.status(500).json({ message: "Failed to search messages" });
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
      res.status(500).json({ message: "Failed to fetch cart" });
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
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (!product.isActive) {
        return res.status(400).json({ message: "Product is no longer available" });
      }
      
      // Validate quantity and inventory
      if (!cartData.quantity || cartData.quantity <= 0) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
      }
      
      if (cartData.quantity > (product.inventory || 0)) {
        return res.status(400).json({ 
          message: `Only ${product.inventory} units available for "${product.name}"` 
        });
      }
      
      // Check if item already exists in cart and validate total quantity
      const existingCartItems = await storage.getCartItems(userId);
      const existingItem = existingCartItems.find(item => item.productId === cartData.productId);
      const totalQuantity = existingItem ? (existingItem.quantity || 0) + (cartData.quantity || 0) : (cartData.quantity || 0);
      
      if (totalQuantity > (product.inventory || 0)) {
        return res.status(400).json({ 
          message: `Cannot add ${cartData.quantity} more. Only ${(product.inventory || 0) - (existingItem?.quantity || 0)} more units available.` 
        });
      }
      
      const cartItem = await storage.addToCart(userId, cartData.productId, cartData.quantity || 0);
      res.json(cartItem);
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      res.status(400).json({ message: error.message || "Failed to add to cart" });
    }
  });

  app.put('/api/cart/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.params;
      const { quantity } = req.body;
      
      // Validate quantity input
      const quantityNum = parseInt(quantity);
      if (isNaN(quantityNum) || quantityNum < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      if (quantityNum === 0) {
        // Remove item if quantity is 0
        await storage.removeFromCart(userId, productId);
        return res.json({ message: "Item removed from cart" });
      }
      
      // Validate product exists and is available
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (!product.isActive) {
        return res.status(400).json({ message: "Product is no longer available" });
      }
      
      // Validate inventory
      if (quantityNum > (product.inventory || 0)) {
        return res.status(400).json({ 
          message: `Only ${product.inventory} units available for "${product.name}"` 
        });
      }
      
      await storage.updateCartItemQuantity(userId, productId, quantityNum);
      res.json({ message: "Cart updated successfully" });
    } catch (error) {
      console.error("Error updating cart:", error);
      res.status(500).json({ message: "Failed to update cart" });
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
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  app.delete('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared successfully" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  app.get('/api/cart/total', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const total = await storage.getCartTotal(userId);
      res.json({ total });
    } catch (error) {
      console.error("Error fetching cart total:", error);
      res.status(500).json({ message: "Failed to fetch cart total" });
    }
  });

  // Checkout and Payment routes - from Stripe blueprint
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { shippingAddress, billingAddress, customerEmail, customerPhone, notes, currency = "usd" } = req.body;
      
      // Get cart items and validate
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Validate inventory for all items
      for (const item of cartItems) {
        if (!item.product.isActive) {
          return res.status(400).json({ 
            message: `Product "${item.product.name}" is no longer available` 
          });
        }
        if (item.quantity > (item.product.inventory || 0)) {
          return res.status(400).json({ 
            message: `Only ${item.product.inventory || 0} of "${item.product.name}" available` 
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
      
      // Create Stripe PaymentIntent with server-calculated amount
      if (!stripe) {
        return res.status(503).json({ message: "Payments not configured. Provide STRIPE_SECRET_KEY or use manual /api/checkout." });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Convert to cents
        currency,
        metadata: {
          userId,
          orderId: order.id,
        },
      });

      // Create payment record
      await storage.createPayment({
        orderId: order.id,
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret || "",
        amount: total.toFixed(2),
        currency,
        status: "pending",
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId: order.id,
        orderSummary: {
          subtotal: subtotal.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          shippingAmount: shippingAmount.toFixed(2),
          total: total.toFixed(2),
          itemCount: cartItems.length,
        }
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
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
        return res.status(400).json({ message: "Cart is empty" });
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
      res.status(400).json({ message: error.message || "Failed to create checkout" });
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
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: orderId } = req.params;
      
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user owns this order
      if (order.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to view this order" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: orderId } = req.params;
      const { paymentIntentId } = req.body;

      // Verify the order belongs to the user
      const order = await storage.getOrderById(orderId);
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify payment with Stripe
      if (!stripe) {
        return res.status(503).json({ message: "Payments not configured" });
      }
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status === "succeeded") {
        // Update order status
        await storage.updateOrderStatus(orderId, "processing");

        // Update payment status
        const payment = await storage.getPaymentByStripeId(paymentIntentId);
        if (payment) {
          await storage.updatePaymentStatus(payment.id, "succeeded", new Date());
        }

        // Award loyalty points for purchase
        try {
          const { loyaltyStorage } = await import("./loyaltyStorage");
          await loyaltyStorage.awardPointsForEvent(
            userId,
            "purchase",
            orderId
          );
        } catch (loyaltyError) {
          console.error("Error awarding loyalty points:", loyaltyError);
          // Don't fail the order completion if loyalty points fail
        }

        // Clear user's cart
        await storage.clearCart(userId);

        res.json({ message: "Order completed successfully", order });
      } else {
        res.status(400).json({ message: "Payment not successful" });
      }
    } catch (error: any) {
      console.error("Error completing order:", error);
      res.status(500).json({ message: "Failed to complete order" });
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
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Admin promotion endpoint (development only)
  app.post('/api/admin/promote', isAuthenticated, async (req: any, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: "Admin promotion disabled in production" });
      }

      const userId = req.user.claims.sub;
      await storage.updateUserAdminStatus(userId, true);
      
      res.json({ 
        message: "User promoted to admin successfully",
        userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error promoting user to admin:", error);
      res.status(500).json({ message: "Failed to promote user to admin" });
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
      res.status(500).json({ message: "Failed to fetch notifications" });
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
        return res.status(403).json({ message: "Not authorized" });
      }

      // Import Stripe Connect functions
      const { createConnectAccount, createAccountLink } = await import("./stripeConnect");
      
      // Check if already has Stripe account
      if (business.stripeAccountId) {
        return res.status(400).json({ message: "Stripe account already exists" });
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
        return res.status(500).json({ message: "Failed to create Stripe account" });
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
      res.status(500).json({ message: error.message || "Failed to create Stripe account" });
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
        return res.status(403).json({ message: "Not authorized" });
      }

      if (!business.stripeAccountId) {
        return res.status(400).json({ message: "No Stripe account found" });
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
      res.status(500).json({ message: error.message || "Failed to refresh Stripe link" });
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
        return res.status(403).json({ message: "Not authorized" });
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
      res.status(500).json({ message: error.message || "Failed to get Stripe status" });
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
      res.status(500).json({ message: error.message || "Failed to get recommendations" });
    }
  });

  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      const type = req.query.type as "business" | "product";
      const category = req.query.category as string;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }

      const { semanticSearch } = await import("./aiService");
      const results = await semanticSearch(query, { type, category }, limit);

      res.json({ results });
    } catch (error: any) {
      console.error("Error performing search:", error);
      res.status(500).json({ message: error.message || "Search failed" });
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
        return res.status(403).json({ message: "Access denied" });
      }

      // Generate AI-powered metrics
      const { generateBusinessMetrics } = await import("./aiService");
      const metrics = await generateBusinessMetrics(businessId);
      res.json(metrics);
    } catch (error: any) {
      console.error("Error getting AI business metrics:", error);
      res.status(500).json({ message: error.message || "Failed to get business metrics" });
    }
  });

  app.get('/api/ai/business-insights/:businessId', isAuthenticated, async (req: any, res) => {
    try {
      const { businessId } = req.params;
      const userId = req.user.claims.sub;

      // Verify user owns this business
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
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
      res.status(500).json({ message: error.message || "Failed to get business insights" });
    }
  });

  app.get('/api/businesses/:id/insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: businessId } = req.params;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { generateBusinessInsights } = await import("./aiService");
      const insights = await generateBusinessInsights(businessId);

      res.json(insights);
    } catch (error: any) {
      console.error("Error generating insights:", error);
      res.status(500).json({ message: error.message || "Failed to generate insights" });
    }
  });

  // AI CONTENT GENERATOR - THE KILLER FEATURE
  app.post('/api/ai/generate-content', businessActionRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { businessId, platform, idea, tone } = req.body;

      // Validate inputs
      if (!businessId || !platform || !idea) {
        return res.status(400).json({ message: "Missing required fields: businessId, platform, idea" });
      }

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to generate content for this business" });
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
      res.status(500).json({ message: error.message || "Failed to generate content" });
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
      res.status(500).json({ message: error.message || "Failed to calculate tax" });
    }
  });

  app.get('/api/tax/categories', async (req, res) => {
    try {
      const { getTaxCategories } = await import("./taxService");
      
      const categories = await getTaxCategories();
      
      res.json({ categories });
    } catch (error: any) {
      console.error("Error getting tax categories:", error);
      res.status(500).json({ message: error.message || "Failed to get tax categories" });
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
        return res.status(403).json({ message: "Not authorized" });
      }

      const { generateOrderInvoice } = await import("./invoiceService");
      const { invoiceNumber, buffer } = await generateOrderInvoice(orderId);

      // Send PDF as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceNumber}.pdf"`);
      res.send(buffer);
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      res.status(500).json({ message: error.message || "Failed to generate invoice" });
    }
  });

  // Stripe webhook endpoint
  app.post('/api/stripe/webhook', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(501).json({ message: "Stripe not configured" });
      }

      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("Stripe webhook secret not configured");
        return res.status(500).json({ message: "Webhook secret not configured" });
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
      }

      const { handleConnectWebhook } = await import("./stripeConnect");

      // Handle the event
      if (event.type.startsWith('account.')) {
        await handleConnectWebhook(event, storage);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Stripe webhook error:", error);
      res.status(500).json({ message: error.message || "Webhook processing failed" });
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
        return res.status(400).json({ message: "Cannot perform this action on yourself" });
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
        return res.status(404).json({ message: "Business not found" });
      }

      switch (action) {
        case 'verify':
          // Toggle verification status
          await storage.updateBusiness(businessId, { isVerified: !business.isVerified });
          res.json({ message: `Business ${business.isVerified ? 'unverified' : 'verified'}` });
          break;

        case 'activate':
          await storage.updateBusiness(businessId, { isActive: true });
          res.json({ message: "Business activated" });
          break;

        case 'deactivate':
          await storage.updateBusiness(businessId, { isActive: false });
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
        return res.status(404).json({ message: "Business not found" });
      }

      // Get business owner
      const owner = await storage.getUser(business.ownerId);

      // Get products
      const products = await storage.getProductsByBusiness(businessId);

      // Get posts
      const posts = await storage.getPostsByBusiness(businessId);

      // Get orders for this business
      const allOrders = await storage.getAllOrders();
      const businessOrders = allOrders.filter(order => {
        // Filter orders that contain products from this business
        return order.items?.some((item: any) =>
          products.some(p => p.id === item.productId)
        );
      });

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

  const httpServer = createServer(app);

  // Initialize WebSocket server
  const { initWebSocket } = await import("./websocket");
  initWebSocket(httpServer);

  return httpServer;
}
