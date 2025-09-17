import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBusinessSchema, updateBusinessSchema, insertProductSchema, insertPostSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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

  // Business routes
  app.post('/api/businesses', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/businesses/search', async (req, res) => {
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
      const spotlights = await storage.getCurrentSpotlights();
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

  app.put('/api/businesses/:id', isAuthenticated, async (req: any, res) => {
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
  app.delete('/api/businesses/:id', isAuthenticated, async (req: any, res) => {
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

  // Product routes
  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: error.message || "Failed to create product" });
    }
  });

  app.get('/api/products/search', async (req, res) => {
    try {
      const { q: query = '', category } = req.query;
      const products = await storage.searchProducts(
        query as string,
        category as string | undefined
      );
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.get('/api/products/featured', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 8;
      const products = await storage.getFeaturedProducts(limit);
      res.json(products);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

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

  // Post routes
  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
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

  // Message routes
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId,
      });
      
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error: any) {
      console.error("Error creating message:", error);
      res.status(400).json({ message: error.message || "Failed to send message" });
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

  const httpServer = createServer(app);
  return httpServer;
}
