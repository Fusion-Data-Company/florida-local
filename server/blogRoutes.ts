import { type Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./auth/index";
import { generalAPIRateLimit, publicEndpointRateLimit } from "./rateLimit";
import {
  insertBlogPostSchema,
  updateBlogPostSchema,
  insertBlogCategorySchema,
  insertBlogTagSchema,
  insertBlogCommentSchema,
  updateBlogCommentSchema,
  insertBlogReactionSchema,
  insertBlogBookmarkSchema,
  insertBlogSubscriptionSchema,
} from "@shared/schema";
import { z } from "zod";

/**
 * Blog Routes - Phase 4: Blogging & Content Platform
 *
 * Endpoints:
 * - Blog Posts CRUD
 * - Categories & Tags management
 * - Comments system
 * - Reactions (claps/likes)
 * - Bookmarks & Reading Lists
 * - Email Subscriptions
 * - Analytics tracking
 */
export function registerBlogRoutes(app: Express) {
  // ====================================================================
  // BLOG POSTS
  // ====================================================================

  // Get all published posts (public)
  app.get('/api/blog/posts', publicEndpointRateLimit, async (req, res) => {
    try {
      const {
        status = 'published',
        categoryId,
        tag,
        authorId,
        featured,
        limit = '20',
        offset = '0',
        orderBy = 'publishedAt',
        order = 'desc',
      } = req.query;

      const posts = await storage.getBlogPosts({
        status: status as string,
        categoryId: categoryId as string | undefined,
        tag: tag as string | undefined,
        authorId: authorId as string | undefined,
        featured: featured === 'true',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        orderBy: orderBy as string,
        order: order as 'asc' | 'desc',
      });

      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Get single post by slug (public)
  app.get('/api/blog/posts/by-slug/:slug', publicEndpointRateLimit, async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Track analytics (page view)
      if (req.headers['x-session-id']) {
        await storage.trackBlogAnalytics({
          postId: post.id,
          userId: (req as any).user?.claims?.sub || null,
          sessionId: req.headers['x-session-id'] as string,
          viewType: 'page_view',
          referrer: req.headers.referer,
          deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
        });
      }

      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  // Get single post by ID (public)
  app.get('/api/blog/posts/:id', publicEndpointRateLimit, async (req, res) => {
    try {
      const { id } = req.params;
      const post = await storage.getBlogPost(id);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  // Create new post (authenticated)
  app.post('/api/blog/posts', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tags, ...postData } = req.body;

      // Validate post data
      const validatedData = insertBlogPostSchema.parse({
        ...postData,
        authorId: userId,
      });

      // Create post
      const post = await storage.createBlogPost(validatedData);

      // Add tags if provided
      if (tags && Array.isArray(tags) && tags.length > 0) {
        await storage.addTagsToBlogPost(post.id, tags);
      }

      res.json(post);
    } catch (error: any) {
      console.error("Error creating blog post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to create blog post" });
    }
  });

  // Update post (authenticated, author only)
  app.put('/api/blog/posts/:id', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { tags, ...postData } = req.body;

      // Check if user owns the post
      const existingPost = await storage.getBlogPost(id);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (existingPost.authorId !== userId) {
        return res.status(403).json({ message: "You don't have permission to edit this post" });
      }

      // Validate update data
      const validatedData = updateBlogPostSchema.parse(postData);

      // Update post
      const updatedPost = await storage.updateBlogPost(id, {
        ...validatedData,
        lastEditedBy: userId,
        lastEditedAt: new Date(),
      });

      // Update tags if provided
      if (tags && Array.isArray(tags)) {
        await storage.updateBlogPostTags(id, tags);
      }

      res.json(updatedPost);
    } catch (error: any) {
      console.error("Error updating blog post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to update blog post" });
    }
  });

  // Delete post (authenticated, author only)
  app.delete('/api/blog/posts/:id', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Check if user owns the post
      const existingPost = await storage.getBlogPost(id);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (existingPost.authorId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this post" });
      }

      await storage.deleteBlogPost(id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // Get related posts
  app.get('/api/blog/posts/:id/related', publicEndpointRateLimit, async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = '5' } = req.query;

      const relatedPosts = await storage.getRelatedBlogPosts(id, parseInt(limit as string));
      res.json(relatedPosts);
    } catch (error) {
      console.error("Error fetching related posts:", error);
      res.status(500).json({ message: "Failed to fetch related posts" });
    }
  });

  // ====================================================================
  // CATEGORIES
  // ====================================================================

  // Get all categories (public)
  app.get('/api/blog/categories', publicEndpointRateLimit, async (req, res) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching blog categories:", error);
      res.status(500).json({ message: "Failed to fetch blog categories" });
    }
  });

  // Create category (authenticated)
  app.post('/api/blog/categories', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertBlogCategorySchema.parse(req.body);
      const category = await storage.createBlogCategory(validatedData);
      res.json(category);
    } catch (error: any) {
      console.error("Error creating blog category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to create blog category" });
    }
  });

  // ====================================================================
  // TAGS
  // ====================================================================

  // Get all tags (public)
  app.get('/api/blog/tags', publicEndpointRateLimit, async (req, res) => {
    try {
      const { limit = '50', popular } = req.query;
      const tags = await storage.getBlogTags({
        limit: parseInt(limit as string),
        popular: popular === 'true',
      });
      res.json(tags);
    } catch (error) {
      console.error("Error fetching blog tags:", error);
      res.status(500).json({ message: "Failed to fetch blog tags" });
    }
  });

  // ====================================================================
  // COMMENTS
  // ====================================================================

  // Get comments for a post (public)
  app.get('/api/blog/posts/:postId/comments', publicEndpointRateLimit, async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getBlogComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching blog comments:", error);
      res.status(500).json({ message: "Failed to fetch blog comments" });
    }
  });

  // Create comment (authenticated)
  app.post('/api/blog/posts/:postId/comments', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;

      const validatedData = insertBlogCommentSchema.parse({
        ...req.body,
        postId,
        authorId: userId,
      });

      const comment = await storage.createBlogComment(validatedData);
      res.json(comment);
    } catch (error: any) {
      console.error("Error creating blog comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to create blog comment" });
    }
  });

  // Update comment (authenticated, author only)
  app.put('/api/blog/comments/:id', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Check if user owns the comment
      const existingComment = await storage.getBlogComment(id);
      if (!existingComment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      if (existingComment.authorId !== userId) {
        return res.status(403).json({ message: "You don't have permission to edit this comment" });
      }

      const validatedData = updateBlogCommentSchema.parse(req.body);
      const updatedComment = await storage.updateBlogComment(id, {
        ...validatedData,
        isEdited: true,
        editedAt: new Date(),
      });

      res.json(updatedComment);
    } catch (error: any) {
      console.error("Error updating blog comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to update blog comment" });
    }
  });

  // Delete comment (authenticated, author only)
  app.delete('/api/blog/comments/:id', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const existingComment = await storage.getBlogComment(id);
      if (!existingComment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      if (existingComment.authorId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this comment" });
      }

      await storage.deleteBlogComment(id);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting blog comment:", error);
      res.status(500).json({ message: "Failed to delete blog comment" });
    }
  });

  // ====================================================================
  // REACTIONS
  // ====================================================================

  // Get reactions for a post (public)
  app.get('/api/blog/posts/:postId/reactions', publicEndpointRateLimit, async (req, res) => {
    try {
      const { postId } = req.params;
      const reactions = await storage.getBlogReactions(postId);
      res.json(reactions);
    } catch (error) {
      console.error("Error fetching blog reactions:", error);
      res.status(500).json({ message: "Failed to fetch blog reactions" });
    }
  });

  // Add/update reaction (authenticated)
  app.post('/api/blog/posts/:postId/reactions', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      const { reactionType, count } = req.body;

      const validatedData = insertBlogReactionSchema.parse({
        postId,
        userId,
        reactionType,
        count: count || 1,
      });

      const reaction = await storage.upsertBlogReaction(validatedData);
      res.json(reaction);
    } catch (error: any) {
      console.error("Error creating blog reaction:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to create blog reaction" });
    }
  });

  // Remove reaction (authenticated)
  app.delete('/api/blog/posts/:postId/reactions/:reactionType', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId, reactionType } = req.params;

      await storage.deleteBlogReaction(postId, userId, reactionType);
      res.json({ message: "Reaction removed successfully" });
    } catch (error) {
      console.error("Error removing blog reaction:", error);
      res.status(500).json({ message: "Failed to remove blog reaction" });
    }
  });

  // ====================================================================
  // BOOKMARKS
  // ====================================================================

  // Get user's bookmarks (authenticated)
  app.get('/api/blog/bookmarks', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookmarks = await storage.getBlogBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching blog bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch blog bookmarks" });
    }
  });

  // Add bookmark (authenticated)
  app.post('/api/blog/posts/:postId/bookmark', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      const { readingListId, notes } = req.body;

      const validatedData = insertBlogBookmarkSchema.parse({
        postId,
        userId,
        readingListId: readingListId || null,
        notes: notes || null,
      });

      const bookmark = await storage.createBlogBookmark(validatedData);
      res.json(bookmark);
    } catch (error: any) {
      console.error("Error creating blog bookmark:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to create blog bookmark" });
    }
  });

  // Remove bookmark (authenticated)
  app.delete('/api/blog/posts/:postId/bookmark', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;

      await storage.deleteBlogBookmark(postId, userId);
      res.json({ message: "Bookmark removed successfully" });
    } catch (error) {
      console.error("Error removing blog bookmark:", error);
      res.status(500).json({ message: "Failed to remove blog bookmark" });
    }
  });

  // ====================================================================
  // EMAIL SUBSCRIPTIONS
  // ====================================================================

  // Subscribe to blog (public or authenticated)
  app.post('/api/blog/subscribe', generalAPIRateLimit, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null;
      const { email, subscribedToAll, subscribedCategories, subscribedAuthors, frequency } = req.body;

      const validatedData = insertBlogSubscriptionSchema.parse({
        userId,
        email,
        subscribedToAll: subscribedToAll !== undefined ? subscribedToAll : true,
        subscribedCategories: subscribedCategories || null,
        subscribedAuthors: subscribedAuthors || null,
        frequency: frequency || 'instant',
        unsubscribeToken: generateUnsubscribeToken(),
      });

      const subscription = await storage.createBlogSubscription(validatedData);
      res.json(subscription);
    } catch (error: any) {
      console.error("Error creating blog subscription:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to create blog subscription" });
    }
  });

  // Unsubscribe from blog (public with token)
  app.post('/api/blog/unsubscribe', publicEndpointRateLimit, async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Unsubscribe token is required" });
      }

      await storage.unsubscribeBlog(token);
      res.json({ message: "Unsubscribed successfully" });
    } catch (error) {
      console.error("Error unsubscribing from blog:", error);
      res.status(500).json({ message: "Failed to unsubscribe from blog" });
    }
  });

  // ====================================================================
  // ANALYTICS
  // ====================================================================

  // Track analytics event (public)
  app.post('/api/blog/posts/:postId/analytics', publicEndpointRateLimit, async (req: any, res) => {
    try {
      const { postId } = req.params;
      const {
        viewType,
        scrollDepth,
        timeSpentSeconds,
        sessionId,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
      } = req.body;

      const userId = req.user?.claims?.sub || null;

      await storage.trackBlogAnalytics({
        postId,
        userId,
        sessionId: sessionId || req.headers['x-session-id'] as string,
        viewType,
        scrollDepth,
        timeSpentSeconds,
        referrer: referrer || req.headers.referer,
        utmSource,
        utmMedium,
        utmCampaign,
        deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
        browser: extractBrowser(req.headers['user-agent']),
        os: extractOS(req.headers['user-agent']),
      });

      res.json({ message: "Analytics tracked successfully" });
    } catch (error) {
      console.error("Error tracking blog analytics:", error);
      res.status(500).json({ message: "Failed to track blog analytics" });
    }
  });

  // Get post analytics (authenticated, author only)
  app.get('/api/blog/posts/:postId/analytics', generalAPIRateLimit, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;

      // Check if user owns the post
      const post = await storage.getBlogPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (post.authorId !== userId) {
        return res.status(403).json({ message: "You don't have permission to view analytics for this post" });
      }

      const analytics = await storage.getBlogPostAnalytics(postId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching blog analytics:", error);
      res.status(500).json({ message: "Failed to fetch blog analytics" });
    }
  });
}

// Helper functions
function generateUnsubscribeToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function extractBrowser(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Chrome')) return 'chrome';
  if (userAgent.includes('Safari')) return 'safari';
  if (userAgent.includes('Firefox')) return 'firefox';
  if (userAgent.includes('Edge')) return 'edge';
  return 'other';
}

function extractOS(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Windows')) return 'windows';
  if (userAgent.includes('Mac')) return 'macos';
  if (userAgent.includes('Linux')) return 'linux';
  if (userAgent.includes('Android')) return 'android';
  if (userAgent.includes('iOS')) return 'ios';
  return 'other';
}
