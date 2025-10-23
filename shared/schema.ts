import { sql, relations } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  uuid,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false), // SECURITY: Admin role for spotlight management
  onlineStatus: varchar("online_status", { length: 20 }).default("offline"), // online, away, offline
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business profiles
export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  tagline: varchar("tagline", { length: 500 }),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  location: varchar("location", { length: 255 }),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  website: varchar("website", { length: 255 }),
  logoUrl: varchar("logo_url"),
  coverImageUrl: varchar("cover_image_url"),
  operatingHours: jsonb("operating_hours"),
  socialLinks: jsonb("social_links"),
  googlePlaceId: varchar("google_place_id"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  
  // Google My Business Integration Fields
  gmbVerified: boolean("gmb_verified").default(false),
  gmbConnected: boolean("gmb_connected").default(false),
  gmbAccountId: varchar("gmb_account_id"),
  gmbLocationId: varchar("gmb_location_id"),
  gmbSyncStatus: varchar("gmb_sync_status", { length: 20 }).default("none"), // none, pending, success, error
  gmbLastSyncAt: timestamp("gmb_last_sync_at"),
  gmbLastErrorAt: timestamp("gmb_last_error_at"),
  gmbLastError: text("gmb_last_error"),
  gmbDataSources: jsonb("gmb_data_sources"), // Track which fields come from GMB
  
  // Stripe Connect fields
  stripeAccountId: text("stripe_account_id"),
  stripeOnboardingStatus: text("stripe_onboarding_status"), // pending, active, disabled
  stripeChargesEnabled: boolean("stripe_charges_enabled").default(false),
  stripePayoutsEnabled: boolean("stripe_payouts_enabled").default(false),

  // Multi-payment integration support (Phase 2)
  paymentIntegrations: jsonb("payment_integrations"), // { stripe: {accountId, isActive}, paypal: {...}, square: {...} }
  miniStoreEnabled: boolean("mini_store_enabled").default(false),
  miniStoreConfig: jsonb("mini_store_config"), // { theme, colors, banner, logo }

  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  followerCount: integer("follower_count").default(0),
  postCount: integer("post_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products for marketplace
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  category: varchar("category", { length: 100 }),
  images: jsonb("images"),
  inventory: integer("inventory").default(0),
  isActive: boolean("is_active").default(true),
  isDigital: boolean("is_digital").default(false),
  tags: jsonb("tags"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social posts/updates
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  images: jsonb("images"),
  type: varchar("type", { length: 50 }).default("update"), // update, achievement, partnership, product
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  shareCount: integer("share_count").default(0),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post likes
export const postLikes = pgTable("post_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post comments
export const postComments = pgTable("post_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business followers
export const businessFollowers = pgTable("business_followers", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Spotlight selections
export const spotlights = pgTable("spotlights", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 20 }).notNull(), // daily, weekly, monthly
  position: integer("position"), // 1, 2, 3 for daily; 1-5 for weekly; 1 for monthly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages with enhanced features for business networking and file sharing
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  senderBusinessId: uuid("sender_business_id").references(() => businesses.id, { onDelete: 'cascade' }),
  receiverBusinessId: uuid("receiver_business_id").references(() => businesses.id, { onDelete: 'cascade' }),
  
  // Message content and type
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 30 }).notNull().default("text"), // text, file, business_share, product_share, ice_breaker
  
  // File attachment fields
  fileUrl: varchar("file_url"),
  fileName: varchar("file_name"),
  fileType: varchar("file_type", { length: 100 }),
  fileSize: integer("file_size"), // in bytes
  
  // Shared content references for business networking
  sharedBusinessId: uuid("shared_business_id").references(() => businesses.id),
  sharedProductId: uuid("shared_product_id").references(() => products.id),
  
  // Message metadata
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  isDelivered: boolean("is_delivered").default(false),
  deliveredAt: timestamp("delivered_at"),
  
  // Conversation threading
  conversationId: varchar("conversation_id").notNull(), // Generated from user IDs for grouping
  
  // Business networking context
  networkingContext: jsonb("networking_context"), // For storing ice-breaker prompts, Florida business tips, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shopping cart items
export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer("quantity").notNull().default(1),
  addedAt: timestamp("added_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processing, shipped, delivered, cancelled
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("usd"),
  shippingAddress: jsonb("shipping_address"),
  billingAddress: jsonb("billing_address"),
  customerEmail: varchar("customer_email"),
  customerPhone: varchar("customer_phone", { length: 20 }),
  notes: text("notes"),
  customerComment: varchar("customer_comment", { length: 200 }), // Phase 2: For purchase notification widget
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  vendorBusinessId: uuid("vendor_business_id").references(() => businesses.id), // Phase 2: Track which vendor
  parentOrderId: uuid("parent_order_id"), // Phase 2: For multi-vendor cart splits
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items (products that were ordered)
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid("product_id").notNull().references(() => products.id),
  productName: varchar("product_name", { length: 255 }).notNull(), // Store at time of order
  productPrice: decimal("product_price", { precision: 10, scale: 2 }).notNull(), // Price at time of order
  quantity: integer("quantity").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment records
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id").unique(),
  stripeClientSecret: varchar("stripe_client_secret"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("usd"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processing, succeeded, failed, cancelled
  paymentMethod: varchar("payment_method", { length: 50 }).default("card"),
  failureReason: text("failure_reason"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Spotlight history for tracking business features
export const spotlightHistory = pgTable("spotlight_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 20 }).notNull(), // daily, weekly, monthly
  position: integer("position"), // 1, 2, 3 for daily; 1-5 for weekly; 1 for monthly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  recencyScore: decimal("recency_score", { precision: 5, scale: 2 }),
  diversityScore: decimal("diversity_score", { precision: 5, scale: 2 }),
  totalScore: decimal("total_score", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Engagement metrics for business scoring
export const engagementMetrics = pgTable("engagement_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  followersGrowth: integer("followers_growth").default(0), // Growth in last 30 days
  postsEngagement: decimal("posts_engagement", { precision: 5, scale: 2 }).default("0"), // Avg likes/comments per post
  recentActivity: integer("recent_activity").default(0), // Posts in last 7 days
  productViews: integer("product_views").default(0), // Product page views in last 30 days
  profileViews: integer("profile_views").default(0), // Profile views in last 30 days
  orderCount: integer("order_count").default(0), // Orders in last 30 days
  lastFeaturedDaily: timestamp("last_featured_daily"),
  lastFeaturedWeekly: timestamp("last_featured_weekly"),
  lastFeaturedMonthly: timestamp("last_featured_monthly"),
  calculatedAt: timestamp("calculated_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Ensure each business can only have one engagement metrics record
  uniqueIndex("idx_unique_business_engagement_metrics").on(table.businessId)
]);

// Business votes for monthly spotlight community voting
export const spotlightVotes = pgTable("spotlight_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  month: varchar("month", { length: 7 }).notNull(), // Format: YYYY-MM
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // CRITICAL: Ensure each user can only vote ONCE per month total (not per business)
  uniqueIndex("idx_unique_user_month_vote").on(table.userId, table.month)
]);

// Google My Business OAuth tokens (secure storage)
export const gmbTokens = pgTable("gmb_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text("access_token").notNull(), // Encrypted in storage
  refreshToken: text("refresh_token").notNull(), // Encrypted in storage
  tokenType: varchar("token_type", { length: 20 }).default("Bearer"),
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_unique_business_gmb_token").on(table.businessId)
]);

// GMB sync history and audit trail
export const gmbSyncHistory = pgTable("gmb_sync_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  syncType: varchar("sync_type", { length: 30 }).notNull(), // full, partial, reviews, photos, info
  status: varchar("status", { length: 20 }).notNull(), // success, error, partial
  dataTypes: jsonb("data_types"), // Array of synced data types
  changes: jsonb("changes"), // Summary of changes made
  errorDetails: text("error_details"),
  itemsProcessed: integer("items_processed").default(0),
  itemsUpdated: integer("items_updated").default(0),
  itemsErrors: integer("items_errors").default(0),
  durationMs: integer("duration_ms"),
  triggeredBy: varchar("triggered_by", { length: 20 }).default("manual"), // manual, scheduled, webhook
  gmbApiVersion: varchar("gmb_api_version", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// GMB imported reviews
export const gmbReviews = pgTable("gmb_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  gmbReviewId: varchar("gmb_review_id").notNull(), // Google's review ID
  reviewerName: varchar("reviewer_name", { length: 255 }),
  reviewerPhotoUrl: varchar("reviewer_photo_url"),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  reviewTime: timestamp("review_time").notNull(),
  replyComment: text("reply_comment"),
  replyTime: timestamp("reply_time"),
  gmbCreateTime: timestamp("gmb_create_time").notNull(),
  gmbUpdateTime: timestamp("gmb_update_time").notNull(),
  isVisible: boolean("is_visible").default(true),
  importedAt: timestamp("imported_at").defaultNow(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_unique_gmb_review").on(table.businessId, table.gmbReviewId)
]);

// API Keys for secure external integrations
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyHash: varchar("key_hash", { length: 64 }).notNull().unique(), // SHA-256 hash of the API key
  name: varchar("name", { length: 255 }).notNull(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissions: jsonb("permissions").notNull().default([]), // Array of permission strings
  rateLimit: jsonb("rate_limit"), // { requests: number, window: number }
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_api_keys_key_hash").on(table.keyHash),
  index("idx_api_keys_business_id").on(table.businessId),
  index("idx_api_keys_user_id").on(table.userId)
]);

// ====================================================================
// PHASE 4: BLOGGING & CONTENT PLATFORM SCHEMAS
// ====================================================================

// Blog Categories
export const blogCategories = pgTable("blog_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // Hex color for UI
  icon: varchar("icon", { length: 50 }), // Icon name
  postCount: integer("post_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_blog_categories_slug").on(table.slug)
]);

// Blog Tags
export const blogTags = pgTable("blog_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  postCount: integer("post_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_blog_tags_slug").on(table.slug)
]);

// Blog Posts
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: 'cascade' }), // Optional: business attribution
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: varchar("excerpt", { length: 500 }),
  content: text("content").notNull(), // Rich text HTML from TipTap
  featuredImageUrl: varchar("featured_image_url"),
  categoryId: uuid("category_id").references(() => blogCategories.id, { onDelete: 'set null' }),

  // SEO Fields
  metaTitle: varchar("meta_title", { length: 60 }),
  metaDescription: varchar("meta_description", { length: 160 }),
  metaKeywords: jsonb("meta_keywords"), // Array of keywords
  canonicalUrl: varchar("canonical_url", { length: 500 }),
  ogImage: varchar("og_image"), // Open Graph image

  // Status & Publishing
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, scheduled, published, archived
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),

  // Engagement Metrics
  viewCount: integer("view_count").default(0),
  uniqueViewCount: integer("unique_view_count").default(0),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  shareCount: integer("share_count").default(0),
  bookmarkCount: integer("bookmark_count").default(0),
  readCompletionRate: decimal("read_completion_rate", { precision: 5, scale: 2 }).default("0"), // Percentage
  avgReadTimeSeconds: integer("avg_read_time_seconds"),

  // Features
  isFeatured: boolean("is_featured").default(false),
  isPinned: boolean("is_pinned").default(false),
  allowComments: boolean("allow_comments").default(true),

  // Revision History
  version: integer("version").default(1),
  lastEditedBy: varchar("last_edited_by").references(() => users.id),
  lastEditedAt: timestamp("last_edited_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_blog_posts_slug").on(table.slug),
  index("idx_blog_posts_author").on(table.authorId),
  index("idx_blog_posts_business").on(table.businessId),
  index("idx_blog_posts_category").on(table.categoryId),
  index("idx_blog_posts_status").on(table.status),
  index("idx_blog_posts_published").on(table.publishedAt),
  index("idx_blog_posts_view_count").on(table.viewCount)
]);

// Blog Post Tags (many-to-many)
export const blogPostTags = pgTable("blog_post_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  tagId: uuid("tag_id").notNull().references(() => blogTags.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_unique_post_tag").on(table.postId, table.tagId)
]);

// Blog Comments (nested/threaded)
export const blogComments = pgTable("blog_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentCommentId: uuid("parent_comment_id"),  // Self-reference - set after table definition
  content: text("content").notNull(),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  likeCount: integer("like_count").default(0),
  replyCount: integer("reply_count").default(0),
  isApproved: boolean("is_approved").default(true), // Moderation
  isFlagged: boolean("is_flagged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_blog_comments_post").on(table.postId),
  index("idx_blog_comments_author").on(table.authorId),
  index("idx_blog_comments_parent").on(table.parentCommentId)
]);

// Blog Reactions (Clap/Like system)
export const blogReactions = pgTable("blog_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  reactionType: varchar("reaction_type", { length: 20 }).notNull().default("like"), // like, love, clap, insightful
  count: integer("count").default(1), // Allow multiple claps from same user
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_unique_post_user_reaction").on(table.postId, table.userId, table.reactionType)
]);

// Blog Bookmarks
export const blogBookmarks = pgTable("blog_bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  readingListId: uuid("reading_list_id").references(() => blogReadingLists.id, { onDelete: 'cascade' }), // Optional: organize into lists
  notes: text("notes"), // Personal notes on the bookmark
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_unique_post_user_bookmark").on(table.postId, table.userId)
]);

// Blog Reading Lists (Collections)
export const blogReadingLists = pgTable("blog_reading_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  bookmarkCount: integer("bookmark_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_reading_lists_user").on(table.userId)
]);

// Blog Email Subscriptions
export const blogSubscriptions = pgTable("blog_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }), // Optional: for logged-in users
  email: varchar("email", { length: 255 }).notNull(), // For guest subscriptions
  subscribedToAll: boolean("subscribed_to_all").default(true), // All new posts
  subscribedCategories: jsonb("subscribed_categories"), // Array of category IDs
  subscribedAuthors: jsonb("subscribed_authors"), // Array of author IDs
  frequency: varchar("frequency", { length: 20 }).default("instant"), // instant, daily, weekly
  isActive: boolean("is_active").default(true),
  unsubscribeToken: varchar("unsubscribe_token", { length: 64 }).unique(), // For one-click unsubscribe
  confirmedAt: timestamp("confirmed_at"), // Email verification
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_unique_blog_subscription_email").on(table.email),
  index("idx_blog_subscriptions_user").on(table.userId)
]);

// Blog Analytics (View tracking)
export const blogAnalytics = pgTable("blog_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }), // Null for anonymous
  sessionId: varchar("session_id", { length: 64 }), // For tracking unique views

  // View Data
  viewType: varchar("view_type", { length: 20 }).notNull().default("page_view"), // page_view, scroll_50, scroll_100, read_complete
  scrollDepth: integer("scroll_depth"), // Percentage scrolled
  timeSpentSeconds: integer("time_spent_seconds"),

  // Traffic Source
  referrer: varchar("referrer", { length: 500 }),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),

  // Device Info
  deviceType: varchar("device_type", { length: 20 }), // desktop, mobile, tablet
  browser: varchar("browser", { length: 50 }),
  os: varchar("os", { length: 50 }),
  country: varchar("country", { length: 2 }), // ISO country code
  city: varchar("city", { length: 100 }),

  viewedAt: timestamp("viewed_at").defaultNow(),
}, (table) => [
  index("idx_blog_analytics_post").on(table.postId),
  index("idx_blog_analytics_user").on(table.userId),
  index("idx_blog_analytics_session").on(table.sessionId),
  index("idx_blog_analytics_viewed_at").on(table.viewedAt)
]);

// Blog Revisions (Version history)
export const blogRevisions = pgTable("blog_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  version: integer("version").notNull(),
  editedBy: varchar("edited_by").notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Snapshot of content at this version
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  excerpt: varchar("excerpt", { length: 500 }),

  // Changes metadata
  changesSummary: text("changes_summary"), // Auto-generated or manual description
  changeType: varchar("change_type", { length: 20 }).default("edit"), // edit, major_update, minor_fix

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_blog_revisions_post").on(table.postId),
  uniqueIndex("idx_unique_post_version").on(table.postId, table.version)
]);

// ====================================================================
// PHASE 2: ENTREPRENEUR-FIRST PLATFORM SCHEMAS
// ====================================================================

// Entrepreneur Profiles - Separate from business profiles
export const entrepreneurs = pgTable("entrepreneurs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  bio: text("bio"), // Short bio
  story: text("story"), // Full entrepreneurial story
  tagline: varchar("tagline", { length: 200 }),
  profileImageUrl: varchar("profile_image_url"),
  coverImageUrl: varchar("cover_image_url"),
  socialLinks: jsonb("social_links"), // { twitter, linkedin, instagram, facebook }
  achievements: jsonb("achievements"), // Array of achievement objects
  specialties: jsonb("specialties"), // Array of specialty tags
  location: varchar("location", { length: 255 }),
  website: varchar("website", { length: 255 }),
  yearsExperience: integer("years_experience"),
  totalBusinessesOwned: integer("total_businesses_owned").default(0),
  totalRevenueGenerated: decimal("total_revenue_generated", { precision: 12, scale: 2 }),
  followerCount: integer("follower_count").default(0),
  showcaseCount: integer("showcase_count").default(0),
  isVerified: boolean("is_verified").default(false),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Entrepreneur-Business relationship (many-to-many)
export const entrepreneurBusinesses = pgTable("entrepreneur_businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  entrepreneurId: uuid("entrepreneur_id").notNull().references(() => entrepreneurs.id, { onDelete: 'cascade' }),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  role: varchar("role", { length: 50 }).notNull().default("founder"), // founder, co-founder, owner, partner
  equityPercentage: decimal("equity_percentage", { precision: 5, scale: 2 }),
  joinedDate: timestamp("joined_date").defaultNow(),
  leftDate: timestamp("left_date"),
  isCurrent: boolean("is_current").default(true),
  isPublic: boolean("is_public").default(true), // Show on entrepreneur profile
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_unique_entrepreneur_business").on(table.entrepreneurId, table.businessId)
]);

// Timeline Showcases - Main feed content
export const timelineShowcases = pgTable("timeline_showcases", {
  id: uuid("id").primaryKey().defaultRandom(),
  entrepreneurId: uuid("entrepreneur_id").references(() => entrepreneurs.id, { onDelete: 'cascade' }),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: 'cascade' }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 30 }).notNull().default("story"), // story, launch, milestone, promotion, update
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  excerpt: varchar("excerpt", { length: 500 }),
  mediaUrls: jsonb("media_urls"), // Array of image/video URLs
  ctaText: varchar("cta_text", { length: 100 }),
  ctaUrl: varchar("cta_url", { length: 500 }),
  tags: jsonb("tags"), // Array of tag strings
  category: varchar("category", { length: 100 }),
  voteCount: integer("vote_count").default(0),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  shareCount: integer("share_count").default(0),
  viewCount: integer("view_count").default(0),
  isPinned: boolean("is_pinned").default(false),
  isFeatured: boolean("is_featured").default(false),
  isPromoted: boolean("is_promoted").default(false), // Paid promotion
  promotionSpotId: uuid("promotion_spot_id"), // References ad spot if promoted
  promotionStartDate: timestamp("promotion_start_date"),
  promotionEndDate: timestamp("promotion_end_date"),
  isApproved: boolean("is_approved").default(false), // Admin moderation
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_timeline_published").on(table.isPublished, table.publishedAt),
  index("idx_timeline_votes").on(table.voteCount),
  index("idx_timeline_entrepreneur").on(table.entrepreneurId)
]);

// Timeline Showcase Votes
export const timelineShowcaseVotes = pgTable("timeline_showcase_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  showcaseId: uuid("showcase_id").notNull().references(() => timelineShowcases.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  voteType: varchar("vote_type", { length: 10 }).notNull().default("upvote"), // upvote, downvote
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_unique_showcase_vote").on(table.showcaseId, table.userId)
]);

// Vendor Transactions - Track all payments through mini-stores
export const vendorTransactions = pgTable("vendor_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Total order amount
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(), // Platform's cut (e.g., 5%)
  vendorPayout: decimal("vendor_payout", { precision: 10, scale: 2 }).notNull(), // Amount vendor receives
  currency: varchar("currency", { length: 3 }).notNull().default("usd"),
  stripeTransferId: varchar("stripe_transfer_id"), // Stripe Connect transfer ID
  stripeChargeId: varchar("stripe_charge_id"),
  paymentProcessor: varchar("payment_processor", { length: 20 }).default("stripe"), // stripe, paypal, square
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, failed, refunded
  failureReason: text("failure_reason"),
  paidOutAt: timestamp("paid_out_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_vendor_transactions_business").on(table.businessId),
  index("idx_vendor_transactions_order").on(table.orderId)
]);

// Recent Purchases - For notification widget
export const recentPurchases = pgTable("recent_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  customerName: varchar("customer_name", { length: 100 }).notNull(), // Anonymized: "John D."
  customerLocation: varchar("customer_location", { length: 100 }), // "Miami, FL"
  productName: varchar("product_name", { length: 255 }).notNull(),
  vendorName: varchar("vendor_name", { length: 255 }).notNull(),
  vendorBusinessId: uuid("vendor_business_id").references(() => businesses.id, { onDelete: 'cascade' }),
  customerComment: varchar("customer_comment", { length: 200 }), // Optional comment at checkout
  amount: decimal("amount", { precision: 10, scale: 2 }),
  isVisible: boolean("is_visible").default(true), // Can be hidden by admin
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_recent_purchases_created").on(table.createdAt)
]);

// Ad Spots - Available advertising positions
export const adSpots = pgTable("ad_spots", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 50 }).notNull(), // timeline, marketplace, home, sidebar
  position: varchar("position", { length: 50 }), // hero, top, middle, bottom, #3, #8, etc.
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }),
  pricePerWeek: decimal("price_per_week", { precision: 10, scale: 2 }),
  pricePerMonth: decimal("price_per_month", { precision: 10, scale: 2 }),
  dimensions: varchar("dimensions", { length: 50 }), // "300x250", "728x90", etc.
  maxActiveSlots: integer("max_active_slots").default(1), // How many can run simultaneously
  isAvailable: boolean("is_available").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ad Campaigns - Businesses buying ad spots
export const adCampaigns = pgTable("ad_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  adSpotId: uuid("ad_spot_id").notNull().references(() => adSpots.id),
  showcaseId: uuid("showcase_id").references(() => timelineShowcases.id), // Content to promote
  name: varchar("name", { length: 255 }).notNull(),
  creativeUrl: varchar("creative_url"), // Custom ad image/video URL
  targetUrl: varchar("target_url"), // Where ad clicks go
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  billingCycle: varchar("billing_cycle", { length: 20 }).default("prepaid"), // prepaid, monthly
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, active, paused, completed, cancelled
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ad_campaigns_business").on(table.businessId),
  index("idx_ad_campaigns_spot").on(table.adSpotId),
  index("idx_ad_campaigns_dates").on(table.startDate, table.endDate)
]);

// Ad Impressions - Track ad views
export const adImpressions = pgTable("ad_impressions", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => adCampaigns.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  ipAddress: varchar("ip_address", { length: 45 }), // Support IPv6
  userAgent: text("user_agent"),
  referrer: varchar("referrer", { length: 500 }),
  isClick: boolean("is_click").default(false),
  isConversion: boolean("is_conversion").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_ad_impressions_campaign").on(table.campaignId),
  index("idx_ad_impressions_timestamp").on(table.timestamp)
]);

// Premium Features - Paid visibility boosts
export const premiumFeatures = pgTable("premium_features", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  featureType: varchar("feature_type", { length: 30 }).notNull(), // pin, boost, badge, email, multi_category
  showcaseId: uuid("showcase_id").references(() => timelineShowcases.id), // If feature applies to showcase
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, expired, cancelled
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_premium_features_business").on(table.businessId),
  index("idx_premium_features_type").on(table.featureType)
]);

// ======= AI CONTENT GENERATION SYSTEM =======

// AI Generated Content History
export const aiGeneratedContent = pgTable("ai_generated_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  type: varchar("type", { length: 50 }).notNull(), // business_description, product_description, blog_post, social_media, email_template, review_response, faq, tagline
  platform: varchar("platform", { length: 30 }), // facebook, instagram, twitter, linkedin, gmb, email, general
  content: text("content").notNull(),
  prompt: text("prompt"),
  enhancedPrompt: text("enhanced_prompt"),
  tone: varchar("tone", { length: 30 }), // professional, casual, friendly, formal, humorous, inspirational
  language: varchar("language", { length: 10 }).default("en"),
  keywords: jsonb("keywords"), // Array of SEO keywords
  hashtags: jsonb("hashtags"), // Array of hashtags
  metadata: jsonb("metadata"), // { model, tokensUsed, cost, characterCount, wordCount, readingTime, seoScore, sentimentScore }
  qualityMetrics: jsonb("quality_metrics"), // { clarity, engagement, brandSafety, hasProfanity, plagiarismScore }
  version: integer("version").default(1),
  parentId: uuid("parent_id"), // For content iterations/versions
  isFavorite: boolean("is_favorite").default(false),
  isTemplate: boolean("is_template").default(false),
  templateName: varchar("template_name", { length: 255 }),
  usageCount: integer("usage_count").default(0),
  performanceMetrics: jsonb("performance_metrics"), // { views, clicks, conversions, engagement }
  status: varchar("status", { length: 20 }).default("draft"), // draft, published, archived
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_content_business").on(table.businessId),
  index("idx_ai_content_type").on(table.type),
  index("idx_ai_content_created").on(table.createdAt),
  index("idx_ai_content_favorite").on(table.isFavorite)
]);

// AI Content Templates
export const aiContentTemplates = pgTable("ai_content_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(),
  category: varchar("category", { length: 100 }),
  prompt: text("prompt").notNull(),
  variables: jsonb("variables"), // Array of variable names that can be replaced
  examples: jsonb("examples"), // Array of example outputs
  tone: varchar("tone", { length: 30 }),
  platform: varchar("platform", { length: 30 }),
  isGlobal: boolean("is_global").default(false), // Available to all businesses
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_templates_business").on(table.businessId),
  index("idx_ai_templates_type").on(table.type),
  index("idx_ai_templates_global").on(table.isGlobal)
]);

// AI Generated Images
export const aiGeneratedImages = pgTable("ai_generated_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  prompt: text("prompt").notNull(),
  enhancedPrompt: text("enhanced_prompt"),
  negativePrompt: text("negative_prompt"),
  url: text("url").notNull(),
  localPath: text("local_path"),
  s3Url: text("s3_url"),
  metadata: jsonb("metadata"), // { size, style, quality, model, cost, generationTime, fileSize, dimensions }
  category: varchar("category", { length: 50 }), // product, logo, social, banner, background, marketing
  tags: jsonb("tags"), // Array of tags
  variations: jsonb("variations"), // Array of variation URLs if generated
  isFavorite: boolean("is_favorite").default(false),
  usageCount: integer("usage_count").default(0),
  status: varchar("status", { length: 20 }).default("active"), // active, deleted, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_images_business").on(table.businessId),
  index("idx_ai_images_category").on(table.category),
  index("idx_ai_images_created").on(table.createdAt)
]);

// AI Usage Tracking (for billing)
export const aiUsageTracking = pgTable("ai_usage_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  service: varchar("service", { length: 30 }).notNull(), // openai, dalle, gpt5, etc
  model: varchar("model", { length: 50 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // content_generation, image_generation, embeddings
  tokensUsed: integer("tokens_used").default(0),
  cost: decimal("cost", { precision: 10, scale: 6 }).notNull(),
  metadata: jsonb("metadata"), // Additional usage details
  billingPeriod: varchar("billing_period", { length: 20 }), // YYYY-MM
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_usage_business").on(table.businessId),
  index("idx_ai_usage_period").on(table.billingPeriod),
  index("idx_ai_usage_created").on(table.createdAt)
]);

// AI Content A/B Testing
export const aiContentTests = pgTable("ai_content_tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // email_subject, ad_copy, landing_page, etc
  status: varchar("status", { length: 20 }).default("running"), // draft, running, completed, paused
  variants: jsonb("variants"), // Array of { id, content, metrics }
  winnerVariantId: varchar("winner_variant_id", { length: 50 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  metrics: jsonb("metrics"), // { totalViews, conversions, clickThrough, etc }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_tests_business").on(table.businessId),
  index("idx_ai_tests_status").on(table.status)
]);

// AI Content Moderation Log
export const aiModerationLog = pgTable("ai_moderation_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentId: uuid("content_id"),
  contentType: varchar("content_type", { length: 50 }).notNull(), // generated_content, generated_image
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: 'cascade' }),
  moderationResult: jsonb("moderation_result"), // { profanity, violence, adult, etc }
  flaggedReasons: jsonb("flagged_reasons"), // Array of reasons
  isSafe: boolean("is_safe").default(true),
  action: varchar("action", { length: 30 }), // approved, rejected, modified
  moderatedBy: varchar("moderated_by"), // system or user_id
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_moderation_content").on(table.contentId),
  index("idx_ai_moderation_business").on(table.businessId)
]);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  businesses: many(businesses),
  postLikes: many(postLikes),
  postComments: many(postComments),
  businessFollowers: many(businessFollowers),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  cartItems: many(cartItems),
  orders: many(orders),
  spotlightVotes: many(spotlightVotes),
  entrepreneur: one(entrepreneurs), // Phase 2
  timelineShowcases: many(timelineShowcases), // Phase 2
  timelineShowcaseVotes: many(timelineShowcaseVotes), // Phase 2
  // Phase 4: Blog relations
  blogPosts: many(blogPosts),
  blogComments: many(blogComments),
  blogReactions: many(blogReactions),
  blogBookmarks: many(blogBookmarks),
  blogReadingLists: many(blogReadingLists),
  blogSubscriptions: many(blogSubscriptions),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  owner: one(users, {
    fields: [businesses.ownerId],
    references: [users.id],
  }),
  products: many(products),
  posts: many(posts),
  followers: many(businessFollowers),
  spotlights: many(spotlights),
  spotlightHistory: many(spotlightHistory),
  engagementMetrics: one(engagementMetrics),
  spotlightVotes: many(spotlightVotes),
  sentMessages: many(messages, { relationName: "senderBusiness" }),
  receivedMessages: many(messages, { relationName: "receiverBusiness" }),
  gmbTokens: one(gmbTokens),
  gmbSyncHistory: many(gmbSyncHistory),
  gmbReviews: many(gmbReviews),
  // Phase 2 relations
  entrepreneurBusinesses: many(entrepreneurBusinesses),
  timelineShowcases: many(timelineShowcases),
  vendorTransactions: many(vendorTransactions),
  recentPurchases: many(recentPurchases),
  adCampaigns: many(adCampaigns),
  premiumFeatures: many(premiumFeatures),
  // Phase 4: Blog relations
  blogPosts: many(blogPosts),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  business: one(businesses, {
    fields: [products.businessId],
    references: [businesses.id],
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  business: one(businesses, {
    fields: [posts.businessId],
    references: [businesses.id],
  }),
  likes: many(postLikes),
  comments: many(postComments),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postComments.userId],
    references: [users.id],
  }),
}));

export const businessFollowersRelations = relations(businessFollowers, ({ one }) => ({
  business: one(businesses, {
    fields: [businessFollowers.businessId],
    references: [businesses.id],
  }),
  user: one(users, {
    fields: [businessFollowers.userId],
    references: [users.id],
  }),
}));

export const spotlightsRelations = relations(spotlights, ({ one }) => ({
  business: one(businesses, {
    fields: [spotlights.businessId],
    references: [businesses.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
  senderBusiness: one(businesses, {
    fields: [messages.senderBusinessId],
    references: [businesses.id],
    relationName: "senderBusiness",
  }),
  receiverBusiness: one(businesses, {
    fields: [messages.receiverBusinessId],
    references: [businesses.id],
    relationName: "receiverBusiness",
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const spotlightHistoryRelations = relations(spotlightHistory, ({ one }) => ({
  business: one(businesses, {
    fields: [spotlightHistory.businessId],
    references: [businesses.id],
  }),
}));

export const engagementMetricsRelations = relations(engagementMetrics, ({ one }) => ({
  business: one(businesses, {
    fields: [engagementMetrics.businessId],
    references: [businesses.id],
  }),
}));

export const spotlightVotesRelations = relations(spotlightVotes, ({ one }) => ({
  business: one(businesses, {
    fields: [spotlightVotes.businessId],
    references: [businesses.id],
  }),
  user: one(users, {
    fields: [spotlightVotes.userId],
    references: [users.id],
  }),
}));

// GMB Relations
export const gmbTokensRelations = relations(gmbTokens, ({ one }) => ({
  business: one(businesses, {
    fields: [gmbTokens.businessId],
    references: [businesses.id],
  }),
  user: one(users, {
    fields: [gmbTokens.userId],
    references: [users.id],
  }),
}));

export const gmbSyncHistoryRelations = relations(gmbSyncHistory, ({ one }) => ({
  business: one(businesses, {
    fields: [gmbSyncHistory.businessId],
    references: [businesses.id],
  }),
}));

export const gmbReviewsRelations = relations(gmbReviews, ({ one }) => ({
  business: one(businesses, {
    fields: [gmbReviews.businessId],
    references: [businesses.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  business: one(businesses, {
    fields: [apiKeys.businessId],
    references: [businesses.id],
  }),
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

// Phase 2 Relations
export const entrepreneursRelations = relations(entrepreneurs, ({ one, many }) => ({
  user: one(users, {
    fields: [entrepreneurs.userId],
    references: [users.id],
  }),
  entrepreneurBusinesses: many(entrepreneurBusinesses),
  timelineShowcases: many(timelineShowcases),
}));

export const entrepreneurBusinessesRelations = relations(entrepreneurBusinesses, ({ one }) => ({
  entrepreneur: one(entrepreneurs, {
    fields: [entrepreneurBusinesses.entrepreneurId],
    references: [entrepreneurs.id],
  }),
  business: one(businesses, {
    fields: [entrepreneurBusinesses.businessId],
    references: [businesses.id],
  }),
}));

export const timelineShowcasesRelations = relations(timelineShowcases, ({ one, many }) => ({
  entrepreneur: one(entrepreneurs, {
    fields: [timelineShowcases.entrepreneurId],
    references: [entrepreneurs.id],
  }),
  business: one(businesses, {
    fields: [timelineShowcases.businessId],
    references: [businesses.id],
  }),
  author: one(users, {
    fields: [timelineShowcases.authorId],
    references: [users.id],
  }),
  votes: many(timelineShowcaseVotes),
  premiumFeatures: many(premiumFeatures),
  adCampaigns: many(adCampaigns),
}));

export const timelineShowcaseVotesRelations = relations(timelineShowcaseVotes, ({ one }) => ({
  showcase: one(timelineShowcases, {
    fields: [timelineShowcaseVotes.showcaseId],
    references: [timelineShowcases.id],
  }),
  user: one(users, {
    fields: [timelineShowcaseVotes.userId],
    references: [users.id],
  }),
}));

export const vendorTransactionsRelations = relations(vendorTransactions, ({ one }) => ({
  business: one(businesses, {
    fields: [vendorTransactions.businessId],
    references: [businesses.id],
  }),
  order: one(orders, {
    fields: [vendorTransactions.orderId],
    references: [orders.id],
  }),
}));

export const recentPurchasesRelations = relations(recentPurchases, ({ one }) => ({
  order: one(orders, {
    fields: [recentPurchases.orderId],
    references: [orders.id],
  }),
  vendorBusiness: one(businesses, {
    fields: [recentPurchases.vendorBusinessId],
    references: [businesses.id],
  }),
}));

export const adSpotsRelations = relations(adSpots, ({ many }) => ({
  adCampaigns: many(adCampaigns),
}));

export const adCampaignsRelations = relations(adCampaigns, ({ one, many }) => ({
  business: one(businesses, {
    fields: [adCampaigns.businessId],
    references: [businesses.id],
  }),
  adSpot: one(adSpots, {
    fields: [adCampaigns.adSpotId],
    references: [adSpots.id],
  }),
  showcase: one(timelineShowcases, {
    fields: [adCampaigns.showcaseId],
    references: [timelineShowcases.id],
  }),
  impressions: many(adImpressions),
}));

export const adImpressionsRelations = relations(adImpressions, ({ one }) => ({
  campaign: one(adCampaigns, {
    fields: [adImpressions.campaignId],
    references: [adCampaigns.id],
  }),
  user: one(users, {
    fields: [adImpressions.userId],
    references: [users.id],
  }),
}));

export const premiumFeaturesRelations = relations(premiumFeatures, ({ one }) => ({
  business: one(businesses, {
    fields: [premiumFeatures.businessId],
    references: [businesses.id],
  }),
  showcase: one(timelineShowcases, {
    fields: [premiumFeatures.showcaseId],
    references: [timelineShowcases.id],
  }),
}));

// Phase 4: Blog Relations
export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  posts: many(blogPosts),
}));

export const blogTagsRelations = relations(blogTags, ({ many }) => ({
  blogPostTags: many(blogPostTags),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  business: one(businesses, {
    fields: [blogPosts.businessId],
    references: [businesses.id],
  }),
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
  lastEditor: one(users, {
    fields: [blogPosts.lastEditedBy],
    references: [users.id],
  }),
  tags: many(blogPostTags),
  comments: many(blogComments),
  reactions: many(blogReactions),
  bookmarks: many(blogBookmarks),
  analytics: many(blogAnalytics),
  revisions: many(blogRevisions),
}));

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostTags.postId],
    references: [blogPosts.id],
  }),
  tag: one(blogTags, {
    fields: [blogPostTags.tagId],
    references: [blogTags.id],
  }),
}));

export const blogCommentsRelations = relations(blogComments, ({ one, many }) => ({
  post: one(blogPosts, {
    fields: [blogComments.postId],
    references: [blogPosts.id],
  }),
  author: one(users, {
    fields: [blogComments.authorId],
    references: [users.id],
  }),
  parentComment: one(blogComments, {
    fields: [blogComments.parentCommentId],
    references: [blogComments.id],
    relationName: "replies",
  }),
  replies: many(blogComments, {
    relationName: "replies",
  }),
}));

export const blogReactionsRelations = relations(blogReactions, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogReactions.postId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [blogReactions.userId],
    references: [users.id],
  }),
}));

export const blogBookmarksRelations = relations(blogBookmarks, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogBookmarks.postId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [blogBookmarks.userId],
    references: [users.id],
  }),
  readingList: one(blogReadingLists, {
    fields: [blogBookmarks.readingListId],
    references: [blogReadingLists.id],
  }),
}));

export const blogReadingListsRelations = relations(blogReadingLists, ({ one, many }) => ({
  user: one(users, {
    fields: [blogReadingLists.userId],
    references: [users.id],
  }),
  bookmarks: many(blogBookmarks),
}));

export const blogSubscriptionsRelations = relations(blogSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [blogSubscriptions.userId],
    references: [users.id],
  }),
}));

export const blogAnalyticsRelations = relations(blogAnalytics, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogAnalytics.postId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [blogAnalytics.userId],
    references: [users.id],
  }),
}));

export const blogRevisionsRelations = relations(blogRevisions, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogRevisions.postId],
    references: [blogPosts.id],
  }),
  editor: one(users, {
    fields: [blogRevisions.editedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  followerCount: true,
  postCount: true,
  rating: true,
  reviewCount: true,
});

export const updateBusinessSchema = insertBusinessSchema.omit({
  ownerId: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  reviewCount: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likeCount: true,
  commentCount: true,
  shareCount: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  addedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSpotlightHistorySchema = createInsertSchema(spotlightHistory).omit({
  id: true,
  createdAt: true,
});

export const insertEngagementMetricsSchema = createInsertSchema(engagementMetrics).omit({
  id: true,
  calculatedAt: true,
  updatedAt: true,
});

export const insertSpotlightVoteSchema = createInsertSchema(spotlightVotes).omit({
  id: true,
  createdAt: true,
});

// GMB Insert Schemas
export const insertGmbTokenSchema = createInsertSchema(gmbTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGmbSyncHistorySchema = createInsertSchema(gmbSyncHistory).omit({
  id: true,
  createdAt: true,
});

export const insertGmbReviewSchema = createInsertSchema(gmbReviews).omit({
  id: true,
  importedAt: true,
  lastSyncedAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type UpdateBusiness = z.infer<typeof updateBusinessSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Spotlight = typeof spotlights.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type SpotlightHistory = typeof spotlightHistory.$inferSelect;
export type InsertSpotlightHistory = z.infer<typeof insertSpotlightHistorySchema>;
export type EngagementMetrics = typeof engagementMetrics.$inferSelect;
export type InsertEngagementMetrics = z.infer<typeof insertEngagementMetricsSchema>;
export type SpotlightVote = typeof spotlightVotes.$inferSelect;
export type InsertSpotlightVote = z.infer<typeof insertSpotlightVoteSchema>;

// GMB Types
export type GmbToken = typeof gmbTokens.$inferSelect;
export type InsertGmbToken = z.infer<typeof insertGmbTokenSchema>;
export type GmbSyncHistory = typeof gmbSyncHistory.$inferSelect;
export type InsertGmbSyncHistory = z.infer<typeof insertGmbSyncHistorySchema>;
export type GmbReview = typeof gmbReviews.$inferSelect;
export type InsertGmbReview = z.infer<typeof insertGmbReviewSchema>;

// API Key Types
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

// Phase 2 Insert Schemas
export const insertEntrepreneurSchema = createInsertSchema(entrepreneurs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  followerCount: true,
  showcaseCount: true,
  totalBusinessesOwned: true,
});

export const updateEntrepreneurSchema = insertEntrepreneurSchema.omit({
  userId: true,
});

export const insertEntrepreneurBusinessSchema = createInsertSchema(entrepreneurBusinesses).omit({
  id: true,
  createdAt: true,
});

export const insertTimelineShowcaseSchema = createInsertSchema(timelineShowcases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  voteCount: true,
  likeCount: true,
  commentCount: true,
  shareCount: true,
  viewCount: true,
});

export const updateTimelineShowcaseSchema = insertTimelineShowcaseSchema.omit({
  authorId: true,
});

export const insertTimelineShowcaseVoteSchema = createInsertSchema(timelineShowcaseVotes).omit({
  id: true,
  createdAt: true,
});

export const insertVendorTransactionSchema = createInsertSchema(vendorTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertRecentPurchaseSchema = createInsertSchema(recentPurchases).omit({
  id: true,
  createdAt: true,
});

export const insertAdSpotSchema = createInsertSchema(adSpots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdCampaignSchema = createInsertSchema(adCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  impressions: true,
  clicks: true,
  conversions: true,
});

export const insertAdImpressionSchema = createInsertSchema(adImpressions).omit({
  id: true,
  timestamp: true,
});

export const insertPremiumFeatureSchema = createInsertSchema(premiumFeatures).omit({
  id: true,
  createdAt: true,
});

// Phase 2 Types
export type Entrepreneur = typeof entrepreneurs.$inferSelect;
export type InsertEntrepreneur = z.infer<typeof insertEntrepreneurSchema>;
export type UpdateEntrepreneur = z.infer<typeof updateEntrepreneurSchema>;
export type EntrepreneurBusiness = typeof entrepreneurBusinesses.$inferSelect;
export type InsertEntrepreneurBusiness = z.infer<typeof insertEntrepreneurBusinessSchema>;
export type TimelineShowcase = typeof timelineShowcases.$inferSelect;
export type InsertTimelineShowcase = z.infer<typeof insertTimelineShowcaseSchema>;
export type UpdateTimelineShowcase = z.infer<typeof updateTimelineShowcaseSchema>;
export type TimelineShowcaseVote = typeof timelineShowcaseVotes.$inferSelect;
export type InsertTimelineShowcaseVote = z.infer<typeof insertTimelineShowcaseVoteSchema>;
export type VendorTransaction = typeof vendorTransactions.$inferSelect;
export type InsertVendorTransaction = z.infer<typeof insertVendorTransactionSchema>;
export type RecentPurchase = typeof recentPurchases.$inferSelect;
export type InsertRecentPurchase = z.infer<typeof insertRecentPurchaseSchema>;
export type AdSpot = typeof adSpots.$inferSelect;
export type InsertAdSpot = z.infer<typeof insertAdSpotSchema>;
export type AdCampaign = typeof adCampaigns.$inferSelect;
export type InsertAdCampaign = z.infer<typeof insertAdCampaignSchema>;
export type AdImpression = typeof adImpressions.$inferSelect;
export type InsertAdImpression = z.infer<typeof insertAdImpressionSchema>;
export type PremiumFeature = typeof premiumFeatures.$inferSelect;
export type InsertPremiumFeature = z.infer<typeof insertPremiumFeatureSchema>;

// Phase 4: Blog Insert Schemas
export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  postCount: true,
});

export const insertBlogTagSchema = createInsertSchema(blogTags).omit({
  id: true,
  createdAt: true,
  postCount: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  uniqueViewCount: true,
  likeCount: true,
  commentCount: true,
  shareCount: true,
  bookmarkCount: true,
  readCompletionRate: true,
  avgReadTimeSeconds: true,
  version: true,
});

export const updateBlogPostSchema = insertBlogPostSchema.omit({
  authorId: true,
});

export const insertBlogPostTagSchema = createInsertSchema(blogPostTags).omit({
  id: true,
  createdAt: true,
});

export const insertBlogCommentSchema = createInsertSchema(blogComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likeCount: true,
  replyCount: true,
  isEdited: true,
  editedAt: true,
});

export const updateBlogCommentSchema = insertBlogCommentSchema.omit({
  authorId: true,
  postId: true,
});

export const insertBlogReactionSchema = createInsertSchema(blogReactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBlogBookmarkSchema = createInsertSchema(blogBookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertBlogReadingListSchema = createInsertSchema(blogReadingLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  bookmarkCount: true,
});

export const insertBlogSubscriptionSchema = createInsertSchema(blogSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBlogAnalyticsSchema = createInsertSchema(blogAnalytics).omit({
  id: true,
  viewedAt: true,
});

export const insertBlogRevisionSchema = createInsertSchema(blogRevisions).omit({
  id: true,
  createdAt: true,
});

// Phase 4: Blog Types
export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type BlogTag = typeof blogTags.$inferSelect;
export type InsertBlogTag = z.infer<typeof insertBlogTagSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type UpdateBlogPost = z.infer<typeof updateBlogPostSchema>;
export type BlogPostTag = typeof blogPostTags.$inferSelect;
export type InsertBlogPostTag = z.infer<typeof insertBlogPostTagSchema>;
export type BlogComment = typeof blogComments.$inferSelect;
export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;
export type UpdateBlogComment = z.infer<typeof updateBlogCommentSchema>;
export type BlogReaction = typeof blogReactions.$inferSelect;
export type InsertBlogReaction = z.infer<typeof insertBlogReactionSchema>;
export type BlogBookmark = typeof blogBookmarks.$inferSelect;
export type InsertBlogBookmark = z.infer<typeof insertBlogBookmarkSchema>;
export type BlogReadingList = typeof blogReadingLists.$inferSelect;
export type InsertBlogReadingList = z.infer<typeof insertBlogReadingListSchema>;
export type BlogSubscription = typeof blogSubscriptions.$inferSelect;
export type InsertBlogSubscription = z.infer<typeof insertBlogSubscriptionSchema>;
export type BlogAnalytics = typeof blogAnalytics.$inferSelect;
export type InsertBlogAnalytics = z.infer<typeof insertBlogAnalyticsSchema>;
export type BlogRevision = typeof blogRevisions.$inferSelect;
export type InsertBlogRevision = z.infer<typeof insertBlogRevisionSchema>;

// ========================================
// PHASE 5: MARKETING AUTOMATION
// ========================================

// Marketing Campaigns table
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // 'email', 'sms', 'push', 'multi-channel'
  status: varchar("status", { length: 20 }).notNull().default("draft"), // 'draft', 'scheduled', 'active', 'paused', 'completed', 'archived'
  targetSegmentId: uuid("target_segment_id").references(() => customerSegments.id, { onDelete: 'set null' }),

  // Campaign Content
  subject: varchar("subject", { length: 255 }), // For email
  preheaderText: varchar("preheader_text", { length: 150 }), // For email
  senderName: varchar("sender_name", { length: 100 }),
  senderEmail: varchar("sender_email", { length: 255 }), // For email
  senderPhone: varchar("sender_phone", { length: 20 }), // For SMS
  content: text("content").notNull(), // HTML for email, plain text for SMS
  plainTextContent: text("plain_text_content"), // Email fallback

  // Scheduling
  scheduledAt: timestamp("scheduled_at"),
  sendAt: varchar("send_at", { length: 50 }).default("immediate"), // 'immediate', 'scheduled', 'optimal'
  timezone: varchar("timezone", { length: 50 }).default("America/New_York"),

  // Tracking Counts
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  bouncedCount: integer("bounced_count").default(0),
  unsubscribedCount: integer("unsubscribed_count").default(0),
  spamCount: integer("spam_count").default(0),

  // Calculated Rates
  deliveryRate: decimal("delivery_rate", { precision: 5, scale: 2 }),
  openRate: decimal("open_rate", { precision: 5, scale: 2 }),
  clickRate: decimal("click_rate", { precision: 5, scale: 2 }),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),

  // Settings
  trackOpens: boolean("track_opens").default(true),
  trackClicks: boolean("track_clicks").default(true),
  allowUnsubscribe: boolean("allow_unsubscribe").default(true),
  testMode: boolean("test_mode").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  completedAt: timestamp("completed_at"),
});

// Campaign Recipients table
export const campaignRecipients = pgTable("campaign_recipients", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => marketingCampaigns.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),

  // Status Tracking
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'spam', 'failed'
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  firstClickedAt: timestamp("first_clicked_at"),
  bouncedAt: timestamp("bounced_at"),

  // Engagement Metrics
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  lastOpenedAt: timestamp("last_opened_at"),
  lastClickedAt: timestamp("last_clicked_at"),

  // Error Tracking
  errorMessage: text("error_message"),
  bounceType: varchar("bounce_type", { length: 50 }), // 'hard', 'soft', 'spam'

  // External IDs (for provider tracking)
  externalMessageId: varchar("external_message_id", { length: 255 }),
  externalStatus: varchar("external_status", { length: 100 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  campaignIdx: index("campaign_recipients_campaign_idx").on(table.campaignId),
  userIdx: index("campaign_recipients_user_idx").on(table.userId),
  emailIdx: index("campaign_recipients_email_idx").on(table.email),
}));

// Campaign Links table (for click tracking)
export const campaignLinks = pgTable("campaign_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => marketingCampaigns.id, { onDelete: 'cascade' }),
  originalUrl: text("original_url").notNull(),
  shortCode: varchar("short_code", { length: 20 }).notNull().unique(),
  trackingUrl: text("tracking_url").notNull(),

  // Analytics
  clickCount: integer("click_count").default(0),
  uniqueClickCount: integer("unique_click_count").default(0),

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  campaignIdx: index("campaign_links_campaign_idx").on(table.campaignId),
}));

// Campaign Clicks table
export const campaignClicks = pgTable("campaign_clicks", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => marketingCampaigns.id, { onDelete: 'cascade' }),
  recipientId: uuid("recipient_id").notNull().references(() => campaignRecipients.id, { onDelete: 'cascade' }),
  linkId: uuid("link_id").notNull().references(() => campaignLinks.id, { onDelete: 'cascade' }),

  // Click Details
  clickedAt: timestamp("clicked_at").defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  deviceType: varchar("device_type", { length: 50 }),
  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
}, (table) => ({
  campaignIdx: index("campaign_clicks_campaign_idx").on(table.campaignId),
  recipientIdx: index("campaign_clicks_recipient_idx").on(table.recipientId),
  linkIdx: index("campaign_clicks_link_idx").on(table.linkId),
}));

// Customer Segments table
export const customerSegments = pgTable("customer_segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Segment Criteria (JSON)
  criteria: jsonb("criteria").notNull(),
  /* Example structure:
    {
      "rules": [
        { "field": "totalSpent", "operator": "greater_than", "value": 100 },
        { "field": "lastPurchaseDate", "operator": "within_days", "value": 30 },
        { "field": "location", "operator": "in", "value": ["Miami", "Tampa"] }
      ],
      "logic": "AND"
    }
  */

  // Segment Stats
  memberCount: integer("member_count").default(0),
  autoUpdate: boolean("auto_update").default(true),
  lastCalculatedAt: timestamp("last_calculated_at"),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  businessIdx: index("customer_segments_business_idx").on(table.businessId),
}));

// Segment Members table
export const segmentMembers = pgTable("segment_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  segmentId: uuid("segment_id").notNull().references(() => customerSegments.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  addedAt: timestamp("added_at").defaultNow(),
  source: varchar("source", { length: 100 }).default("automatic"), // 'automatic', 'manual', 'import'
}, (table) => ({
  segmentIdx: index("segment_members_segment_idx").on(table.segmentId),
  userIdx: index("segment_members_user_idx").on(table.userId),
  uniqueMember: index("segment_members_unique").on(table.segmentId, table.userId),
}));

// Marketing Workflows table
export const marketingWorkflows = pgTable("marketing_workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Workflow Configuration
  triggerType: varchar("trigger_type", { length: 100 }).notNull(),
  /* e.g., "user_signup", "purchase_made", "cart_abandoned",
          "lead_created", "date_based", "segment_entry" */
  triggerConfig: jsonb("trigger_config"),
  /* Example:
    {
      "eventType": "cart_abandoned",
      "conditions": { "cartValue": { "min": 50 } },
      "delay": { "value": 1, "unit": "hours" }
    }
  */

  // Workflow Steps (JSON array)
  steps: jsonb("steps").notNull(),
  /* Example:
    [
      {
        "id": "step-1",
        "type": "delay",
        "config": { "value": 1, "unit": "hours" }
      },
      {
        "id": "step-2",
        "type": "send_email",
        "config": { "templateId": "uuid", "subject": "..." }
      },
      {
        "id": "step-3",
        "type": "condition",
        "config": { "field": "email_opened", "operator": "equals", "value": true },
        "trueStep": "step-4",
        "falseStep": "step-5"
      }
    ]
  */

  // Status
  status: varchar("status", { length: 20 }).notNull().default("draft"), // 'draft', 'active', 'paused', 'archived'

  // Metrics
  totalEnrolled: integer("total_enrolled").default(0),
  activeEnrollments: integer("active_enrollments").default(0),
  completedEnrollments: integer("completed_enrollments").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  activatedAt: timestamp("activated_at"),
}, (table) => ({
  businessIdx: index("marketing_workflows_business_idx").on(table.businessId),
}));

// Workflow Enrollments table
export const workflowEnrollments = pgTable("workflow_enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").notNull().references(() => marketingWorkflows.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Enrollment Status
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active', 'completed', 'exited', 'failed'
  currentStepId: varchar("current_step_id", { length: 100 }),
  currentStepStartedAt: timestamp("current_step_started_at"),

  // Tracking
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  exitedAt: timestamp("exited_at"),
  exitReason: text("exit_reason"),

  // Enrollment Data (context for personalization)
  enrollmentData: jsonb("enrollment_data"),
}, (table) => ({
  workflowIdx: index("workflow_enrollments_workflow_idx").on(table.workflowId),
  userIdx: index("workflow_enrollments_user_idx").on(table.userId),
}));

// Workflow Step Logs table
export const workflowStepLogs = pgTable("workflow_step_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").notNull().references(() => workflowEnrollments.id, { onDelete: 'cascade' }),
  workflowId: uuid("workflow_id").notNull().references(() => marketingWorkflows.id, { onDelete: 'cascade' }),
  stepId: varchar("step_id", { length: 100 }).notNull(),

  // Step Execution
  stepType: varchar("step_type", { length: 100 }).notNull(), // 'send_email', 'send_sms', 'delay', 'condition'
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'failed', 'skipped'

  // Details
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),

  // Results (e.g., email sent, SMS delivered, condition result)
  result: jsonb("result"),
}, (table) => ({
  enrollmentIdx: index("workflow_step_logs_enrollment_idx").on(table.enrollmentId),
  workflowIdx: index("workflow_step_logs_workflow_idx").on(table.workflowId),
}));

// Lead Capture Forms table
export const leadCaptureForms = pgTable("lead_capture_forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Form Configuration
  fields: jsonb("fields").notNull(),
  /* Example:
    [
      { "name": "email", "type": "email", "required": true, "label": "Email Address" },
      { "name": "firstName", "type": "text", "required": true, "label": "First Name" },
      { "name": "phone", "type": "tel", "required": false, "label": "Phone Number" },
      { "name": "interests", "type": "checkbox", "options": ["Product A", "Product B"] }
    ]
  */

  // Settings
  successMessage: text("success_message").notNull().default("Thank you for your submission!"),
  redirectUrl: varchar("redirect_url", { length: 500 }),
  addToSegmentId: uuid("add_to_segment_id").references(() => customerSegments.id, { onDelete: 'set null' }),
  enrollInWorkflowId: uuid("enroll_in_workflow_id").references(() => marketingWorkflows.id, { onDelete: 'set null' }),

  // Tracking
  submissionCount: integer("submission_count").default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  businessIdx: index("lead_capture_forms_business_idx").on(table.businessId),
}));

// Lead Submissions table
export const leadSubmissions = pgTable("lead_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id").notNull().references(() => leadCaptureForms.id, { onDelete: 'cascade' }),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),

  // Submission Data
  formData: jsonb("form_data").notNull(), // All form field values
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),

  // Source Tracking
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),

  // Status
  status: varchar("status", { length: 20 }).notNull().default("new"), // 'new', 'contacted', 'qualified', 'converted', 'archived'

  submittedAt: timestamp("submitted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  formIdx: index("lead_submissions_form_idx").on(table.formId),
  businessIdx: index("lead_submissions_business_idx").on(table.businessId),
  emailIdx: index("lead_submissions_email_idx").on(table.email),
}));

// Relations for marketing automation

export const marketingCampaignsRelations = relations(marketingCampaigns, ({ one, many }) => ({
  business: one(businesses, {
    fields: [marketingCampaigns.businessId],
    references: [businesses.id],
  }),
  targetSegment: one(customerSegments, {
    fields: [marketingCampaigns.targetSegmentId],
    references: [customerSegments.id],
  }),
  recipients: many(campaignRecipients),
  links: many(campaignLinks),
  clicks: many(campaignClicks),
}));

export const campaignRecipientsRelations = relations(campaignRecipients, ({ one, many }) => ({
  campaign: one(marketingCampaigns, {
    fields: [campaignRecipients.campaignId],
    references: [marketingCampaigns.id],
  }),
  user: one(users, {
    fields: [campaignRecipients.userId],
    references: [users.id],
  }),
  clicks: many(campaignClicks),
}));

export const campaignLinksRelations = relations(campaignLinks, ({ one, many }) => ({
  campaign: one(marketingCampaigns, {
    fields: [campaignLinks.campaignId],
    references: [marketingCampaigns.id],
  }),
  clicks: many(campaignClicks),
}));

export const campaignClicksRelations = relations(campaignClicks, ({ one }) => ({
  campaign: one(marketingCampaigns, {
    fields: [campaignClicks.campaignId],
    references: [marketingCampaigns.id],
  }),
  recipient: one(campaignRecipients, {
    fields: [campaignClicks.recipientId],
    references: [campaignRecipients.id],
  }),
  link: one(campaignLinks, {
    fields: [campaignClicks.linkId],
    references: [campaignLinks.id],
  }),
}));

export const customerSegmentsRelations = relations(customerSegments, ({ one, many }) => ({
  business: one(businesses, {
    fields: [customerSegments.businessId],
    references: [businesses.id],
  }),
  members: many(segmentMembers),
  campaigns: many(marketingCampaigns),
  leadForms: many(leadCaptureForms),
}));

export const segmentMembersRelations = relations(segmentMembers, ({ one }) => ({
  segment: one(customerSegments, {
    fields: [segmentMembers.segmentId],
    references: [customerSegments.id],
  }),
  user: one(users, {
    fields: [segmentMembers.userId],
    references: [users.id],
  }),
}));

export const marketingWorkflowsRelations = relations(marketingWorkflows, ({ one, many }) => ({
  business: one(businesses, {
    fields: [marketingWorkflows.businessId],
    references: [businesses.id],
  }),
  enrollments: many(workflowEnrollments),
  stepLogs: many(workflowStepLogs),
  leadForms: many(leadCaptureForms),
}));

export const workflowEnrollmentsRelations = relations(workflowEnrollments, ({ one, many }) => ({
  workflow: one(marketingWorkflows, {
    fields: [workflowEnrollments.workflowId],
    references: [marketingWorkflows.id],
  }),
  user: one(users, {
    fields: [workflowEnrollments.userId],
    references: [users.id],
  }),
  stepLogs: many(workflowStepLogs),
}));

export const workflowStepLogsRelations = relations(workflowStepLogs, ({ one }) => ({
  enrollment: one(workflowEnrollments, {
    fields: [workflowStepLogs.enrollmentId],
    references: [workflowEnrollments.id],
  }),
  workflow: one(marketingWorkflows, {
    fields: [workflowStepLogs.workflowId],
    references: [marketingWorkflows.id],
  }),
}));

export const leadCaptureFormsRelations = relations(leadCaptureForms, ({ one, many }) => ({
  business: one(businesses, {
    fields: [leadCaptureForms.businessId],
    references: [businesses.id],
  }),
  addToSegment: one(customerSegments, {
    fields: [leadCaptureForms.addToSegmentId],
    references: [customerSegments.id],
  }),
  enrollInWorkflow: one(marketingWorkflows, {
    fields: [leadCaptureForms.enrollInWorkflowId],
    references: [marketingWorkflows.id],
  }),
  submissions: many(leadSubmissions),
}));

export const leadSubmissionsRelations = relations(leadSubmissions, ({ one }) => ({
  form: one(leadCaptureForms, {
    fields: [leadSubmissions.formId],
    references: [leadCaptureForms.id],
  }),
  business: one(businesses, {
    fields: [leadSubmissions.businessId],
    references: [businesses.id],
  }),
  user: one(users, {
    fields: [leadSubmissions.userId],
    references: [users.id],
  }),
}));

// Update businesses relations to include marketing automation
export const businessesMarketingRelations = relations(businesses, ({ many }) => ({
  marketingCampaigns: many(marketingCampaigns),
  customerSegments: many(customerSegments),
  marketingWorkflows: many(marketingWorkflows),
  leadCaptureForms: many(leadCaptureForms),
  leadSubmissions: many(leadSubmissions),
}));

// Update users relations to include marketing automation
export const usersMarketingRelations = relations(users, ({ many }) => ({
  campaignRecipients: many(campaignRecipients),
  segmentMemberships: many(segmentMembers),
  workflowEnrollments: many(workflowEnrollments),
  leadSubmissions: many(leadSubmissions),
}));

// Zod schemas for marketing automation

export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns);
export const updateMarketingCampaignSchema = insertMarketingCampaignSchema.partial();

export const insertCampaignRecipientSchema = createInsertSchema(campaignRecipients);
export const updateCampaignRecipientSchema = insertCampaignRecipientSchema.partial();

export const insertCampaignLinkSchema = createInsertSchema(campaignLinks);

export const insertCampaignClickSchema = createInsertSchema(campaignClicks);

export const insertCustomerSegmentSchema = createInsertSchema(customerSegments);
export const updateCustomerSegmentSchema = insertCustomerSegmentSchema.partial();

export const insertSegmentMemberSchema = createInsertSchema(segmentMembers);

export const insertMarketingWorkflowSchema = createInsertSchema(marketingWorkflows);
export const updateMarketingWorkflowSchema = insertMarketingWorkflowSchema.partial();

export const insertWorkflowEnrollmentSchema = createInsertSchema(workflowEnrollments);
export const updateWorkflowEnrollmentSchema = insertWorkflowEnrollmentSchema.partial();

export const insertWorkflowStepLogSchema = createInsertSchema(workflowStepLogs);
export const updateWorkflowStepLogSchema = insertWorkflowStepLogSchema.partial();

export const insertLeadCaptureFormSchema = createInsertSchema(leadCaptureForms);
export const updateLeadCaptureFormSchema = insertLeadCaptureFormSchema.partial();

export const insertLeadSubmissionSchema = createInsertSchema(leadSubmissions);
export const updateLeadSubmissionSchema = insertLeadSubmissionSchema.partial();

// TypeScript types for marketing automation

export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;
export type UpdateMarketingCampaign = z.infer<typeof updateMarketingCampaignSchema>;

export type CampaignRecipient = typeof campaignRecipients.$inferSelect;
export type InsertCampaignRecipient = z.infer<typeof insertCampaignRecipientSchema>;
export type UpdateCampaignRecipient = z.infer<typeof updateCampaignRecipientSchema>;

export type CampaignLink = typeof campaignLinks.$inferSelect;
export type InsertCampaignLink = z.infer<typeof insertCampaignLinkSchema>;

export type CampaignClick = typeof campaignClicks.$inferSelect;
export type InsertCampaignClick = z.infer<typeof insertCampaignClickSchema>;

export type CustomerSegment = typeof customerSegments.$inferSelect;
export type InsertCustomerSegment = z.infer<typeof insertCustomerSegmentSchema>;
export type UpdateCustomerSegment = z.infer<typeof updateCustomerSegmentSchema>;

export type SegmentMember = typeof segmentMembers.$inferSelect;
export type InsertSegmentMember = z.infer<typeof insertSegmentMemberSchema>;

export type MarketingWorkflow = typeof marketingWorkflows.$inferSelect;
export type InsertMarketingWorkflow = z.infer<typeof insertMarketingWorkflowSchema>;
export type UpdateMarketingWorkflow = z.infer<typeof updateMarketingWorkflowSchema>;

export type WorkflowEnrollment = typeof workflowEnrollments.$inferSelect;
export type InsertWorkflowEnrollment = z.infer<typeof insertWorkflowEnrollmentSchema>;
export type UpdateWorkflowEnrollment = z.infer<typeof updateWorkflowEnrollmentSchema>;

export type WorkflowStepLog = typeof workflowStepLogs.$inferSelect;
export type InsertWorkflowStepLog = z.infer<typeof insertWorkflowStepLogSchema>;
export type UpdateWorkflowStepLog = z.infer<typeof updateWorkflowStepLogSchema>;

export type LeadCaptureForm = typeof leadCaptureForms.$inferSelect;
export type InsertLeadCaptureForm = z.infer<typeof insertLeadCaptureFormSchema>;
export type UpdateLeadCaptureForm = z.infer<typeof updateLeadCaptureFormSchema>;

export type LeadSubmission = typeof leadSubmissions.$inferSelect;
export type InsertLeadSubmission = z.infer<typeof insertLeadSubmissionSchema>;
export type UpdateLeadSubmission = z.infer<typeof updateLeadSubmissionSchema>;

// ============================================
// PHASE 6: LOYALTY & REWARDS SYSTEM
// ============================================

// Loyalty tiers (Bronze, Silver, Gold, Platinum)
export const loyaltyTiers = pgTable("loyalty_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull(), // Bronze, Silver, Gold, Platinum
  level: integer("level").notNull(), // 1, 2, 3, 4
  pointsRequired: integer("points_required").notNull(), // Minimum points to reach tier
  benefits: jsonb("benefits"), // Array of benefits
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"), // Tier-specific discount
  freeShippingThreshold: decimal("free_shipping_threshold", { precision: 10, scale: 2 }), // Free shipping above this amount
  prioritySupport: boolean("priority_support").default(false), // Access to priority support
  earlyAccess: boolean("early_access").default(false), // Early access to new products
  color: varchar("color", { length: 50 }), // Badge color (bronze, silver, gold, platinum)
  icon: varchar("icon", { length: 100 }), // Icon name or emoji
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User loyalty points balance and tier
export const loyaltyAccounts = pgTable("loyalty_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  currentPoints: integer("current_points").notNull().default(0),
  lifetimePoints: integer("lifetime_points").notNull().default(0), // Total points ever earned
  tierId: uuid("tier_id").references(() => loyaltyTiers.id),
  tierName: varchar("tier_name", { length: 50 }).default("Bronze"), // Denormalized for quick access
  tierLevel: integer("tier_level").default(1),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  pointsExpiringNext30Days: integer("points_expiring_next_30_days").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Points earning/spending transactions
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: uuid("account_id").notNull().references(() => loyaltyAccounts.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 50 }).notNull(), // earned, redeemed, expired, transferred_in, transferred_out, adjusted, bonus
  points: integer("points").notNull(), // Positive for earned, negative for spent
  balanceAfter: integer("balance_after").notNull(),
  source: varchar("source", { length: 100 }).notNull(), // purchase, review, referral, signup_bonus, reward_redemption, etc.
  sourceId: varchar("source_id"), // Order ID, review ID, referral ID, etc.
  description: text("description"),
  metadata: jsonb("metadata"), // Additional data
  expiresAt: timestamp("expires_at"), // When these points expire (typically 1 year)
  isExpired: boolean("is_expired").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("loyalty_transactions_user_idx").on(table.userId),
  index("loyalty_transactions_account_idx").on(table.accountId),
  index("loyalty_transactions_type_idx").on(table.type),
  index("loyalty_transactions_created_idx").on(table.createdAt),
]);

// Points earning rules
export const loyaltyRules = pgTable("loyalty_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 100 }).notNull(), // purchase, review, referral, signup, share, etc.
  pointsAwarded: integer("points_awarded").notNull(),
  calculationType: varchar("calculation_type", { length: 50 }).default("fixed"), // fixed, percentage, tiered
  calculationValue: decimal("calculation_value", { precision: 10, scale: 2 }), // For percentage-based (e.g., 1% = 1 point per $1)
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }), // Minimum purchase amount to qualify
  maxPoints: integer("max_points"), // Maximum points per transaction
  tierMultipliers: jsonb("tier_multipliers"), // { "Bronze": 1, "Silver": 1.25, "Gold": 1.5, "Platinum": 2 }
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rewards catalog (what users can redeem points for)
export const rewards = pgTable("rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: 'cascade' }), // null for platform-wide rewards
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }),
  pointsCost: integer("points_cost").notNull(),
  rewardType: varchar("reward_type", { length: 50 }).notNull(), // discount, free_product, free_shipping, gift_card, experience
  rewardValue: decimal("reward_value", { precision: 10, scale: 2 }), // Monetary value
  discountType: varchar("discount_type", { length: 50 }), // percentage, fixed_amount
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  productId: uuid("product_id").references(() => products.id), // For free_product rewards
  category: varchar("category", { length: 100 }),
  termsConditions: text("terms_conditions"),
  stockQuantity: integer("stock_quantity"), // null for unlimited
  maxRedemptionsPerUser: integer("max_redemptions_per_user"), // null for unlimited
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  tierRestriction: integer("tier_restriction"), // Minimum tier level required (1-4)
  redemptionCount: integer("redemption_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("rewards_business_idx").on(table.businessId),
  index("rewards_active_idx").on(table.isActive),
  index("rewards_featured_idx").on(table.isFeatured),
]);

// User reward redemptions
export const rewardRedemptions = pgTable("reward_redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  rewardId: uuid("reward_id").notNull().references(() => rewards.id, { onDelete: 'cascade' }),
  transactionId: uuid("transaction_id").notNull().references(() => loyaltyTransactions.id),
  pointsSpent: integer("points_spent").notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, fulfilled, cancelled, expired
  redemptionCode: varchar("redemption_code", { length: 100 }).unique(), // Unique code for redemption
  redeemedAt: timestamp("redeemed_at").defaultNow(),
  fulfilledAt: timestamp("fulfilled_at"),
  expiresAt: timestamp("expires_at"), // When the reward expires if not used
  orderId: uuid("order_id").references(() => orders.id), // If used in an order
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("reward_redemptions_user_idx").on(table.userId),
  index("reward_redemptions_reward_idx").on(table.rewardId),
  index("reward_redemptions_status_idx").on(table.status),
]);

// Referral system
export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerId: varchar("referrer_id").notNull().references(() => users.id, { onDelete: 'cascade' }), // User who sent referral
  refereeId: varchar("referee_id").references(() => users.id, { onDelete: 'cascade' }), // User who was referred (null until signup)
  referralCode: varchar("referral_code", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }), // Email of person being referred
  status: varchar("status", { length: 50 }).default("pending"), // pending, signed_up, completed, rewarded
  referrerRewardPoints: integer("referrer_reward_points").default(0), // Points given to referrer
  refereeRewardPoints: integer("referee_reward_points").default(0), // Points given to referee
  referrerRewarded: boolean("referrer_rewarded").default(false),
  refereeRewarded: boolean("referee_rewarded").default(false),
  refereeFirstPurchaseAt: timestamp("referee_first_purchase_at"), // When referee made first purchase
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  signedUpAt: timestamp("signed_up_at"),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("referrals_referrer_idx").on(table.referrerId),
  index("referrals_referee_idx").on(table.refereeId),
  index("referrals_code_idx").on(table.referralCode),
  index("referrals_status_idx").on(table.status),
]);

// Insert schemas for loyalty system
export const insertLoyaltyTierSchema = createInsertSchema(loyaltyTiers);
export const insertLoyaltyAccountSchema = createInsertSchema(loyaltyAccounts);
export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions);
export const insertLoyaltyRuleSchema = createInsertSchema(loyaltyRules);
export const insertRewardSchema = createInsertSchema(rewards);
export const insertRewardRedemptionSchema = createInsertSchema(rewardRedemptions);
export const insertReferralSchema = createInsertSchema(referrals);

// TypeScript types for loyalty system
export type LoyaltyTier = typeof loyaltyTiers.$inferSelect;
export type InsertLoyaltyTier = z.infer<typeof insertLoyaltyTierSchema>;

export type LoyaltyAccount = typeof loyaltyAccounts.$inferSelect;
export type InsertLoyaltyAccount = z.infer<typeof insertLoyaltyAccountSchema>;

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;

export type LoyaltyRule = typeof loyaltyRules.$inferSelect;
export type InsertLoyaltyRule = z.infer<typeof insertLoyaltyRuleSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type InsertRewardRedemption = z.infer<typeof insertRewardRedemptionSchema>;

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

// ========================================
// ANALYTICS & BUSINESS INTELLIGENCE
// ========================================

// Daily metrics aggregation for fast analytics queries
export const dailyMetrics = pgTable("daily_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: timestamp("date").notNull(), // Date for these metrics (start of day UTC)

  // Revenue metrics
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0"),
  orderCount: integer("order_count").default(0),
  averageOrderValue: decimal("average_order_value", { precision: 12, scale: 2 }).default("0"),

  // User metrics
  newUsers: integer("new_users").default(0),
  activeUsers: integer("active_users").default(0),
  returningUsers: integer("returning_users").default(0),

  // Business metrics
  newBusinesses: integer("new_businesses").default(0),
  activeBusinesses: integer("active_businesses").default(0),

  // Product metrics
  productsListed: integer("products_listed").default(0),
  productsSold: integer("products_sold").default(0),

  // Loyalty metrics
  pointsEarned: integer("points_earned").default(0),
  pointsRedeemed: integer("points_redeemed").default(0),
  rewardsRedeemed: integer("rewards_redeemed").default(0),

  // Engagement metrics
  reviewsCreated: integer("reviews_created").default(0),
  messagesExchanged: integer("messages_exchanged").default(0),
  socialShares: integer("social_shares").default(0),

  // Referral metrics
  referralsSent: integer("referrals_sent").default(0),
  referralsCompleted: integer("referrals_completed").default(0),

  // Metadata
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("daily_metrics_date_idx").on(table.date),
]);

// Business-level analytics
export const businessMetrics = pgTable("business_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),

  // Performance metrics
  views: integer("views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  clicks: integer("clicks").default(0),

  // Sales metrics
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0"),
  orders: integer("orders").default(0),
  productsListedCount: integer("products_listed_count").default(0),
  productsSoldCount: integer("products_sold_count").default(0),

  // Customer metrics
  newCustomers: integer("new_customers").default(0),
  returningCustomers: integer("returning_customers").default(0),
  averageOrderValue: decimal("average_order_value", { precision: 12, scale: 2 }).default("0"),

  // Engagement metrics
  reviewsReceived: integer("reviews_received").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  messagesReceived: integer("messages_received").default(0),
  messagesReplied: integer("messages_replied").default(0),

  // Spotlight metrics
  spotlightVotes: integer("spotlight_votes").default(0),
  spotlightWins: integer("spotlight_wins").default(0),

  // Metadata
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("business_metrics_business_idx").on(table.businessId),
  index("business_metrics_date_idx").on(table.date),
  uniqueIndex("business_metrics_unique_idx").on(table.businessId, table.date),
]);

// User behavior analytics
export const userMetrics = pgTable("user_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),

  // Activity metrics
  pageViews: integer("page_views").default(0),
  sessionDuration: integer("session_duration").default(0), // seconds
  actionsCount: integer("actions_count").default(0),

  // Purchase metrics
  ordersPlaced: integer("orders_placed").default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0"),

  // Engagement metrics
  reviewsWritten: integer("reviews_written").default(0),
  messagesSent: integer("messages_sent").default(0),
  socialShares: integer("social_shares").default(0),

  // Loyalty metrics
  pointsEarned: integer("points_earned").default(0),
  pointsSpent: integer("points_spent").default(0),
  rewardsRedeemed: integer("rewards_redeemed").default(0),

  // Metadata
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("user_metrics_user_idx").on(table.userId),
  index("user_metrics_date_idx").on(table.date),
  uniqueIndex("user_metrics_unique_idx").on(table.userId, table.date),
]);

// Product performance analytics
export const productMetrics = pgTable("product_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),

  // Visibility metrics
  views: integer("views").default(0),
  uniqueViewers: integer("unique_viewers").default(0),
  searchAppearances: integer("search_appearances").default(0),

  // Sales metrics
  unitsSold: integer("units_sold").default(0),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0"),
  ordersCount: integer("orders_count").default(0),

  // Conversion metrics
  addToCartCount: integer("add_to_cart_count").default(0),
  checkoutCount: integer("checkout_count").default(0),
  purchaseCount: integer("purchase_count").default(0),

  // Engagement metrics
  likesCount: integer("likes_count").default(0),
  sharesCount: integer("shares_count").default(0),

  // Inventory metrics
  stockLevel: integer("stock_level").default(0),
  restockCount: integer("restock_count").default(0),

  // Metadata
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("product_metrics_product_idx").on(table.productId),
  index("product_metrics_date_idx").on(table.date),
  uniqueIndex("product_metrics_unique_idx").on(table.productId, table.date),
]);

// Real-time event tracking
export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: varchar("event_type", { length: 100 }).notNull(), // page_view, click, purchase, etc.
  eventCategory: varchar("event_category", { length: 100 }), // user_action, business_action, system_event

  // Context
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: 'set null' }),
  productId: uuid("product_id").references(() => products.id, { onDelete: 'set null' }),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: 'set null' }),

  // Session info
  sessionId: varchar("session_id", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),

  // Event details
  eventData: jsonb("event_data"),

  // Timing
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  processingTime: integer("processing_time"), // milliseconds

  // Metadata
  metadata: jsonb("metadata"),
}, (table) => [
  index("analytics_events_type_idx").on(table.eventType),
  index("analytics_events_user_idx").on(table.userId),
  index("analytics_events_business_idx").on(table.businessId),
  index("analytics_events_timestamp_idx").on(table.timestamp),
]);

// Customer cohorts for cohort analysis
export const customerCohorts = pgTable("customer_cohorts", {
  id: uuid("id").primaryKey().defaultRandom(),
  cohortName: varchar("cohort_name", { length: 100 }).notNull(),
  cohortType: varchar("cohort_type", { length: 50 }).notNull(), // signup_month, first_purchase_month, tier_based
  cohortDate: timestamp("cohort_date").notNull(), // Start date of cohort (e.g., 2025-01-01 for Jan 2025 cohort)

  // Cohort metrics
  userCount: integer("user_count").default(0),
  activeUsers: integer("active_users").default(0),
  retentionRate: decimal("retention_rate", { precision: 5, scale: 2 }).default("0"),

  // Revenue metrics
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0"),
  averageRevenuePerUser: decimal("average_revenue_per_user", { precision: 12, scale: 2 }).default("0"),

  // Engagement metrics
  averageOrdersPerUser: decimal("average_orders_per_user", { precision: 8, scale: 2 }).default("0"),
  averageLifetimeValue: decimal("average_lifetime_value", { precision: 12, scale: 2 }).default("0"),

  // Metadata
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("cohorts_date_idx").on(table.cohortDate),
  index("cohorts_type_idx").on(table.cohortType),
  uniqueIndex("cohorts_unique_idx").on(table.cohortName, table.cohortDate),
]);

// Funnel analytics for conversion tracking
export const conversionFunnels = pgTable("conversion_funnels", {
  id: uuid("id").primaryKey().defaultRandom(),
  funnelName: varchar("funnel_name", { length: 100 }).notNull(),
  date: timestamp("date").notNull(),

  // Funnel steps (generic for flexibility)
  step1Count: integer("step1_count").default(0),
  step2Count: integer("step2_count").default(0),
  step3Count: integer("step3_count").default(0),
  step4Count: integer("step4_count").default(0),
  step5Count: integer("step5_count").default(0),

  // Conversion rates
  step1ToStep2Rate: decimal("step1_to_step2_rate", { precision: 5, scale: 2 }).default("0"),
  step2ToStep3Rate: decimal("step2_to_step3_rate", { precision: 5, scale: 2 }).default("0"),
  step3ToStep4Rate: decimal("step3_to_step4_rate", { precision: 5, scale: 2 }).default("0"),
  step4ToStep5Rate: decimal("step4_to_step5_rate", { precision: 5, scale: 2 }).default("0"),
  overallConversionRate: decimal("overall_conversion_rate", { precision: 5, scale: 2 }).default("0"),

  // Metadata (store step names, etc.)
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("funnels_name_idx").on(table.funnelName),
  index("funnels_date_idx").on(table.date),
  uniqueIndex("funnels_unique_idx").on(table.funnelName, table.date),
]);

// Insert schemas for analytics
export const insertDailyMetricsSchema = createInsertSchema(dailyMetrics);
export const insertBusinessMetricsSchema = createInsertSchema(businessMetrics);
export const insertUserMetricsSchema = createInsertSchema(userMetrics);
export const insertProductMetricsSchema = createInsertSchema(productMetrics);
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents);
export const insertCustomerCohortSchema = createInsertSchema(customerCohorts);
export const insertConversionFunnelSchema = createInsertSchema(conversionFunnels);

// TypeScript types for analytics
export type DailyMetrics = typeof dailyMetrics.$inferSelect;
export type InsertDailyMetrics = z.infer<typeof insertDailyMetricsSchema>;

// ============================================
// SOCIAL MEDIA INTEGRATION TABLES
// ============================================

export const socialAccounts = pgTable("social_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  businessId: uuid("business_id").references(() => businesses.id),
  platform: text("platform").notNull(), // facebook, instagram, twitter, linkedin, tiktok, pinterest, youtube
  accountId: text("account_id").notNull(), // Platform-specific account ID
  accountName: text("account_name"),
  accountHandle: text("account_handle"),
  profileUrl: text("profile_url"),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"), // Platform-specific metadata
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("social_accounts_user_idx").on(table.userId),
  index("social_accounts_business_idx").on(table.businessId),
  index("social_accounts_platform_idx").on(table.platform),
  uniqueIndex("social_accounts_unique_idx").on(table.userId, table.platform, table.accountId),
]);

export const socialTokens = pgTable("social_tokens", {
  id: text("id").primaryKey(),
  socialAccountId: text("social_account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  scopes: jsonb("scopes").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("social_tokens_account_idx").on(table.socialAccountId),
]);

export const socialPosts = pgTable("social_posts", {
  id: text("id").primaryKey(),
  socialAccountId: text("social_account_id").notNull().references(() => socialAccounts.id),
  businessId: uuid("business_id").references(() => businesses.id),
  platformPostId: text("platform_post_id"), // ID on the social platform
  platform: text("platform").notNull(),
  postType: text("post_type").notNull(), // post, story, reel, video, etc.
  content: text("content"),
  mediaUrls: jsonb("media_urls").$type<string[]>(),
  hashtags: jsonb("hashtags").$type<string[]>(),
  mentions: jsonb("mentions").$type<string[]>(),
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  status: text("status").notNull(), // draft, scheduled, published, failed
  metrics: jsonb("metrics"), // likes, comments, shares, views, etc.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("social_posts_account_idx").on(table.socialAccountId),
  index("social_posts_business_idx").on(table.businessId),
  index("social_posts_status_idx").on(table.status),
  index("social_posts_scheduled_idx").on(table.scheduledFor),
]);

export const socialAnalytics = pgTable("social_analytics", {
  id: text("id").primaryKey(),
  socialAccountId: text("social_account_id").notNull().references(() => socialAccounts.id),
  businessId: uuid("business_id").references(() => businesses.id),
  platform: text("platform").notNull(),
  date: date("date").notNull(),
  metrics: jsonb("metrics").notNull(), // Platform-specific metrics
  insights: jsonb("insights"), // AI-generated insights
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("social_analytics_account_idx").on(table.socialAccountId),
  index("social_analytics_date_idx").on(table.date),
  uniqueIndex("social_analytics_unique_idx").on(table.socialAccountId, table.date),
]);

// Insert schemas for social media
export const insertSocialAccountSchema = createInsertSchema(socialAccounts);
export const insertSocialTokenSchema = createInsertSchema(socialTokens);
export const insertSocialPostSchema = createInsertSchema(socialPosts);
export const insertSocialAnalyticsSchema = createInsertSchema(socialAnalytics);

// TypeScript types for social media
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialToken = typeof socialTokens.$inferSelect;
export type InsertSocialToken = z.infer<typeof insertSocialTokenSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialAnalytics = typeof socialAnalytics.$inferSelect;
export type InsertSocialAnalytics = z.infer<typeof insertSocialAnalyticsSchema>;

export type BusinessMetrics = typeof businessMetrics.$inferSelect;
export type InsertBusinessMetrics = z.infer<typeof insertBusinessMetricsSchema>;

export type UserMetrics = typeof userMetrics.$inferSelect;
export type InsertUserMetrics = z.infer<typeof insertUserMetricsSchema>;

export type ProductMetrics = typeof productMetrics.$inferSelect;
export type InsertProductMetrics = z.infer<typeof insertProductMetricsSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

export type CustomerCohort = typeof customerCohorts.$inferSelect;
export type InsertCustomerCohort = z.infer<typeof insertCustomerCohortSchema>;

export type ConversionFunnel = typeof conversionFunnels.$inferSelect;
export type InsertConversionFunnel = z.infer<typeof insertConversionFunnelSchema>;

// ============================================
// ADMIN AUDIT LOGS & RBAC SYSTEM (Phase 1: Enterprise Features)
// ============================================

// Admin Roles (Super Admin, Content Moderator, Support Agent, etc.)
export const adminRoles = pgTable("admin_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions").$type<string[]>().notNull(), // Array of permission strings
  isSystemRole: boolean("is_system_role").default(false), // Cannot be deleted/modified
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User role assignments (many-to-many: users can have multiple roles)
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid("role_id").notNull().references(() => adminRoles.id, { onDelete: 'cascade' }),
  assignedBy: varchar("assigned_by").notNull().references(() => users.id), // Admin who assigned the role
  assignedAt: timestamp("assigned_at").defaultNow(),
}, (table) => [
  index("user_roles_user_idx").on(table.userId),
  index("user_roles_role_idx").on(table.roleId),
  uniqueIndex("user_roles_unique_idx").on(table.userId, table.roleId),
]);

// Admin Audit Logs (immutable record of all admin actions)
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: varchar("admin_id").notNull().references(() => users.id), // Admin who performed action
  action: varchar("action", { length: 100 }).notNull(), // user.promote, business.verify, content.moderate, etc.
  entityType: varchar("entity_type", { length: 50 }).notNull(), // user, business, post, product, etc.
  entityId: varchar("entity_id", { length: 255 }).notNull(), // ID of affected entity
  changes: jsonb("changes"), // Before/after state
  reason: text("reason"), // Optional reason for action
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
  sessionId: varchar("session_id", { length: 255 }),
  status: varchar("status", { length: 20 }).default("success"), // success, failed, partial
  errorMessage: text("error_message"), // If status is failed
  metadata: jsonb("metadata"), // Additional context
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("audit_logs_admin_idx").on(table.adminId),
  index("audit_logs_action_idx").on(table.action),
  index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  index("audit_logs_timestamp_idx").on(table.timestamp),
]);

// Error Tracking (aggregated from errorHandler)
export const errorLogs = pgTable("error_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  errorHash: varchar("error_hash", { length: 64 }).notNull(), // Hash of error type + message
  message: text("message").notNull(),
  stack: text("stack"),
  category: varchar("category", { length: 50 }).notNull(), // From ErrorCategory enum
  severity: varchar("severity", { length: 20 }).notNull(), // From ErrorSeverity enum
  userId: varchar("user_id"), // User who encountered error (if authenticated)
  requestPath: varchar("request_path", { length: 500 }),
  requestMethod: varchar("request_method", { length: 10 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  count: integer("count").default(1), // Number of occurrences
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  resolved: boolean("resolved").default(false),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"), // Admin notes on resolution
}, (table) => [
  index("error_logs_hash_idx").on(table.errorHash),
  index("error_logs_category_idx").on(table.category),
  index("error_logs_severity_idx").on(table.severity),
  index("error_logs_resolved_idx").on(table.resolved),
  index("error_logs_last_seen_idx").on(table.lastSeenAt),
]);

// Premium Advertising Slots (NEW TABLE)
export const premiumAdSlots = pgTable("premium_ad_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  tagline: text("tagline"),
  imageUrl: varchar("image_url", { length: 500 }),
  isPremium: boolean("is_premium").default(false),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "set null" }),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("premium_slots_active_idx").on(table.isActive),
  index("premium_slots_order_idx").on(table.displayOrder),
]);

// ============================================================================
// AI CHAT ASSISTANT SYSTEM - Enterprise-Grade Conversational AI
// ============================================================================

// Chat conversations - Main conversation threads
export const chatConversations = pgTable("chat_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 100 }).notNull(), // Browser session ID
  title: varchar("title", { length: 255 }), // Auto-generated from first message
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, resolved, escalated, archived
  channel: varchar("channel", { length: 50 }).default("widget").notNull(), // widget, mobile, api, sms
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "set null" }), // If discussing specific business

  // Context & Metadata
  metadata: jsonb("metadata"), // { page, referrer, utmParams, deviceInfo, etc. }
  tags: jsonb("tags").$type<string[]>().default(sql`'[]'::jsonb`), // ["support", "billing", "product-inquiry"]
  intent: varchar("intent", { length: 50 }), // question, complaint, booking, purchase, feedback
  sentiment: varchar("sentiment", { length: 20 }), // positive, neutral, negative, frustrated
  language: varchar("language", { length: 10 }).default("en"), // ISO language code

  // Analytics
  messageCount: integer("message_count").default(0),
  satisfactionScore: integer("satisfaction_score"), // 1-5 rating
  satisfactionComment: text("satisfaction_comment"),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolutionTime: integer("resolution_time"), // Seconds from start to resolution

  // Human handoff
  escalated: boolean("escalated").default(false),
  escalatedAt: timestamp("escalated_at"),
  escalatedTo: varchar("escalated_to").references(() => users.id), // Support agent
  escalationReason: text("escalation_reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
}, (table) => [
  index("chat_conversations_user_idx").on(table.userId),
  index("chat_conversations_session_idx").on(table.sessionId),
  index("chat_conversations_status_idx").on(table.status),
  index("chat_conversations_created_idx").on(table.createdAt),
  index("chat_conversations_business_idx").on(table.businessId),
  index("chat_conversations_escalated_idx").on(table.escalated, table.escalatedTo),
]);

// Chat messages - Individual messages in conversations
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // user, assistant, system, agent
  content: text("content").notNull(),

  // Rich message features
  messageType: varchar("message_type", { length: 50 }).default("text"), // text, card, carousel, quick_reply, file
  attachments: jsonb("attachments"), // [{ type, url, name, size }]
  metadata: jsonb("metadata"), // For rich cards, buttons, actions

  // AI-specific fields
  model: varchar("model", { length: 50 }), // gpt-4, gpt-3.5-turbo, claude-3
  tokens: integer("tokens"), // Token usage for cost tracking
  latency: integer("latency"), // Response time in milliseconds
  temperature: decimal("temperature", { precision: 3, scale: 2 }), // Model temperature used

  // Context & Analysis
  intent: varchar("intent", { length: 50 }), // Detected intent
  sentiment: varchar("sentiment", { length: 20 }), // Message-level sentiment
  entities: jsonb("entities"), // Extracted entities: {orderNumber, businessName, date, etc.}
  knowledgeBaseUsed: boolean("knowledge_base_used").default(false),
  knowledgeBaseArticles: jsonb("knowledge_base_articles").$type<string[]>(), // Article IDs used

  // Feedback & Quality
  helpful: boolean("helpful"), // User feedback: thumbs up/down
  feedbackComment: text("feedback_comment"),
  flagged: boolean("flagged").default(false), // For review
  flagReason: text("flag_reason"),

  // Status
  status: varchar("status", { length: 20 }).default("sent"), // pending, sent, delivered, read, failed
  errorMessage: text("error_message"), // If failed

  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
}, (table) => [
  index("chat_messages_conversation_idx").on(table.conversationId),
  index("chat_messages_created_idx").on(table.createdAt),
  index("chat_messages_role_idx").on(table.role),
  index("chat_messages_flagged_idx").on(table.flagged),
]);

// Chat knowledge base - FAQ and support articles for RAG
export const chatKnowledgeBase = pgTable("chat_knowledge_base", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 100 }).notNull(), // products, billing, shipping, account, etc.
  subcategory: varchar("subcategory", { length: 100 }),

  // Content
  question: text("question").notNull(), // The question or topic
  answer: text("answer").notNull(), // The answer/content
  alternativeQuestions: jsonb("alternative_questions").$type<string[]>(), // Different ways to ask
  keywords: jsonb("keywords").$type<string[]>(), // For matching

  // SEO & Metadata
  title: varchar("title", { length: 255 }), // Display title
  slug: varchar("slug", { length: 255 }).unique(),
  summary: text("summary"), // Short summary
  relatedArticles: jsonb("related_articles").$type<string[]>(), // Related article IDs
  externalLinks: jsonb("external_links"), // [{ title, url }]

  // Vector embeddings for semantic search
  embedding: text("embedding"), // JSON stringified vector (or use pgvector extension)
  embeddingModel: varchar("embedding_model", { length: 50 }), // text-embedding-ada-002

  // Usage analytics
  viewCount: integer("view_count").default(0),
  useCount: integer("use_count").default(0), // Times used in chat responses
  helpfulCount: integer("helpful_count").default(0),
  notHelpfulCount: integer("not_helpful_count").default(0),

  // Management
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Higher = shown first
  createdBy: varchar("created_by").references(() => users.id),
  lastEditedBy: varchar("last_edited_by").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("chat_kb_category_idx").on(table.category),
  index("chat_kb_active_idx").on(table.isActive),
  index("chat_kb_priority_idx").on(table.priority),
  index("chat_kb_slug_idx").on(table.slug),
]);

// Chat sessions - Browser/device sessions for context
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: varchar("session_id", { length: 100 }).notNull().unique(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // Null for anonymous

  // Device & Browser Info
  deviceInfo: jsonb("device_info"), // { browser, os, device, screen }
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  location: jsonb("location"), // { country, region, city, timezone }

  // Context
  initialPage: varchar("initial_page", { length: 500 }), // Landing page
  referrer: varchar("referrer", { length: 500 }),
  utmParams: jsonb("utm_params"), // UTM tracking parameters

  // Activity tracking
  pageViews: jsonb("page_views").$type<Array<{ page: string; timestamp: string }>>(),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),

  // Engagement
  conversationCount: integer("conversation_count").default(0),
  messagesSent: integer("messages_sent").default(0),
  avgResponseTime: integer("avg_response_time"), // Milliseconds

  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Session expiry
}, (table) => [
  index("chat_sessions_session_id_idx").on(table.sessionId),
  index("chat_sessions_user_idx").on(table.userId),
  index("chat_sessions_active_idx").on(table.isActive),
  index("chat_sessions_last_activity_idx").on(table.lastActivity),
]);

// Chat analytics - Aggregated metrics for reporting
export const chatAnalytics = pgTable("chat_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),

  // Conversation metrics
  duration: integer("duration").notNull(), // Total conversation time in seconds
  messageCount: integer("message_count").notNull(),
  userMessageCount: integer("user_message_count").notNull(),
  assistantMessageCount: integer("assistant_message_count").notNull(),

  // Response times
  avgResponseTime: integer("avg_response_time"), // Average AI response time (ms)
  minResponseTime: integer("min_response_time"),
  maxResponseTime: integer("max_response_time"),

  // AI metrics
  totalTokens: integer("total_tokens"),
  totalCost: decimal("total_cost", { precision: 10, scale: 4 }), // USD
  modelsUsed: jsonb("models_used").$type<string[]>(),

  // Quality metrics
  sentimentProgression: jsonb("sentiment_progression"), // Track sentiment over time
  intentChanges: integer("intent_changes"), // How many times intent changed
  knowledgeBaseHitRate: decimal("kb_hit_rate", { precision: 5, scale: 2 }), // % of answers from KB

  // Outcomes
  resolved: boolean("resolved").notNull(),
  escalated: boolean("escalated").notNull(),
  satisfactionScore: integer("satisfaction_score"),
  conversionEvent: varchar("conversion_event", { length: 100 }), // signup, purchase, demo_booked
  conversionValue: decimal("conversion_value", { precision: 10, scale: 2 }),

  // Context
  peakHour: integer("peak_hour"), // Hour of day (0-23)
  dayOfWeek: integer("day_of_week"), // 0-6

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("chat_analytics_conversation_idx").on(table.conversationId),
  index("chat_analytics_created_idx").on(table.createdAt),
  index("chat_analytics_resolved_idx").on(table.resolved),
]);

// Chat quick actions - Pre-configured action buttons
export const chatQuickActions = pgTable("chat_quick_actions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Action config
  label: varchar("label", { length: 100 }).notNull(), // "Book Demo", "Contact Sales"
  actionType: varchar("action_type", { length: 50 }).notNull(), // navigate, api_call, modal, email
  actionPayload: jsonb("action_payload").notNull(), // { url, endpoint, modalId, etc. }

  // Display
  icon: varchar("icon", { length: 50 }), // Lucide icon name
  variant: varchar("variant", { length: 20 }).default("default"), // default, primary, outline
  description: text("description"),

  // Targeting
  showOnPages: jsonb("show_on_pages").$type<string[]>(), // Pages where this action appears
  showForIntents: jsonb("show_for_intents").$type<string[]>(), // Show for specific intents
  requiresAuth: boolean("requires_auth").default(false),

  // Analytics
  clickCount: integer("click_count").default(0),
  conversionCount: integer("conversion_count").default(0),

  // Management
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("chat_quick_actions_active_idx").on(table.isActive),
  index("chat_quick_actions_order_idx").on(table.displayOrder),
]);

// Chat proactive triggers - Rules for proactive engagement
export const chatProactiveTriggers = pgTable("chat_proactive_triggers", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Trigger config
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // time_on_page, scroll_depth, exit_intent, cart_abandon, error_404

  // Conditions
  conditions: jsonb("conditions").notNull(), // { pages, minTime, scrollPercent, etc. }
  message: text("message").notNull(), // The proactive message to show
  quickReplies: jsonb("quick_replies").$type<string[]>(), // Suggested responses

  // Targeting
  targetPages: jsonb("target_pages").$type<string[]>(),
  requiresAuth: boolean("requires_auth").default(false),
  excludeIfConversationExists: boolean("exclude_if_conversation_exists").default(true),

  // Frequency control
  maxShowsPerSession: integer("max_shows_per_session").default(1),
  cooldownMinutes: integer("cooldown_minutes").default(60),

  // Analytics
  showCount: integer("show_count").default(0),
  engagementCount: integer("engagement_count").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),

  // Management
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("chat_proactive_active_idx").on(table.isActive),
  index("chat_proactive_priority_idx").on(table.priority),
]);

// ====================================================================
// SECURITY TABLES - Fortune 500 Grade Security Infrastructure
// ====================================================================

// Failed login attempts tracking
export const failedLoginAttempts = pgTable("failed_login_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(), // IPv6 support
  userAgent: text("user_agent"),
  failureReason: varchar("failure_reason", { length: 100 }), // wrong_password, account_not_found, etc.
  attemptTime: timestamp("attempt_time").defaultNow().notNull(),
  geoLocation: jsonb("geo_location"), // { country, city, region, lat, lon }
}, (table) => [
  index("idx_failed_login_email").on(table.email),
  index("idx_failed_login_ip").on(table.ipAddress),
  index("idx_failed_login_time").on(table.attemptTime),
]);

// Account lockouts
export const accountLockouts = pgTable("account_lockouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  lockoutType: varchar("lockout_type", { length: 20 }).notNull(), // temporary, permanent
  lockedAt: timestamp("locked_at").defaultNow().notNull(),
  lockedUntil: timestamp("locked_until"), // null for permanent lockouts
  unlockedAt: timestamp("unlocked_at"), // when admin manually unlocked
  unlockedBy: varchar("unlocked_by").references(() => users.id),
  reason: text("reason"),
  attemptCount: integer("attempt_count").notNull().default(0),
}, (table) => [
  index("idx_lockout_email").on(table.email),
  index("idx_lockout_active").on(table.lockedUntil, table.unlockedAt),
]);

// IP access control (blocklist/allowlist)
export const ipAccessControl = pgTable("ip_access_control", {
  id: uuid("id").primaryKey().defaultRandom(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(), // Single IP or CIDR notation
  ipRange: varchar("ip_range", { length: 100 }), // For IP ranges
  accessType: varchar("access_type", { length: 10 }).notNull(), // block, allow
  reason: text("reason"),
  expiresAt: timestamp("expires_at"), // null for permanent
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_unique_ip_access").on(table.ipAddress, table.accessType),
  index("idx_ip_access_active").on(table.isActive, table.expiresAt),
]);

// Geographic restrictions
export const geoRestrictions = pgTable("geo_restrictions", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryCode: varchar("country_code", { length: 2 }).notNull(), // ISO 3166-1 alpha-2
  regionCode: varchar("region_code", { length: 10 }), // State/province code
  restrictionType: varchar("restriction_type", { length: 10 }).notNull(), // block, allow
  reason: text("reason"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_unique_geo_restriction").on(table.countryCode, table.regionCode, table.restrictionType),
  index("idx_geo_restriction_active").on(table.isActive),
]);

// Security events (comprehensive audit log)
export const securityEvents = pgTable("security_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: varchar("event_type", { length: 100 }).notNull(), // login_failed, session_hijack, ip_blocked, etc.
  severity: varchar("severity", { length: 20 }).notNull(), // info, warning, high, critical
  userId: varchar("user_id").references(() => users.id),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Additional event-specific data
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  notificationSent: boolean("notification_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_security_event_type").on(table.eventType),
  index("idx_security_event_severity").on(table.severity),
  index("idx_security_event_user").on(table.userId),
  index("idx_security_event_created").on(table.createdAt),
]);

// Active sessions tracking (for session management)
export const activeSessions = pgTable("active_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  deviceType: varchar("device_type", { length: 50 }), // desktop, mobile, tablet
  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),
  isCurrent: boolean("is_current").default(false),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_active_session_user").on(table.userId),
  index("idx_active_session_id").on(table.sessionId),
  index("idx_active_session_expires").on(table.expiresAt),
]);

// Security notification queue
export const securityNotifications = pgTable("security_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientPhone: varchar("recipient_phone", { length: 20 }),
  notificationType: varchar("notification_type", { length: 50 }).notNull(), // email, sms, both
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"), // low, normal, high, critical
  metadata: jsonb("metadata"), // Event details, user info, etc.
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processing, sent, failed
  attempts: integer("attempts").default(0),
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notification_status").on(table.status),
  index("idx_notification_priority").on(table.priority),
  index("idx_notification_created").on(table.createdAt),
]);

// Authentication audit logs (separate from general audit)
export const authAuditLogs = pgTable("auth_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  eventType: varchar("event_type", { length: 50 }).notNull(), // login_success, login_failed, logout, session_expired, password_changed
  eventStatus: varchar("event_status", { length: 20 }).notNull(), // success, failure, pending
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id", { length: 255 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_auth_audit_user").on(table.userId),
  index("idx_auth_audit_type").on(table.eventType),
  index("idx_auth_audit_created").on(table.createdAt),
]);

// Rate limiting records (for persistent rate limiting)
export const rateLimitRecords = pgTable("rate_limit_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: varchar("identifier", { length: 255 }).notNull(), // IP, userId, or composite key
  limitType: varchar("limit_type", { length: 50 }).notNull(), // api, login, registration, etc.
  attempts: integer("attempts").notNull().default(1),
  windowStart: timestamp("window_start").notNull(),
  windowEnd: timestamp("window_end").notNull(),
  blocked: boolean("blocked").default(false),
  blockedUntil: timestamp("blocked_until"),
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_unique_rate_limit").on(table.identifier, table.limitType, table.windowStart),
  index("idx_rate_limit_identifier").on(table.identifier),
  index("idx_rate_limit_window").on(table.windowEnd),
]);

// Rate limit violations tracking (for enhanced rate limiter)
export const rateLimitViolations = pgTable("rate_limit_violations", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: varchar("identifier", { length: 255 }).notNull(), // IP address or user ID
  ipAddress: varchar("ip_address", { length: 45 }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  violationType: varchar("violation_type", { length: 50 }).notNull(), // rate_limit_exceeded, suspicious_pattern
  requestCount: integer("request_count").notNull(),
  timeWindow: integer("time_window").notNull(), // seconds
  penalty: varchar("penalty", { length: 50 }), // throttled, blocked, warned
  penaltyDuration: integer("penalty_duration"), // seconds
  metadata: jsonb("metadata"), // Request details, user agent, etc.
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_rate_violation_identifier").on(table.identifier),
  index("idx_rate_violation_ip").on(table.ipAddress),
  index("idx_rate_violation_user").on(table.userId),
  index("idx_rate_violation_created").on(table.createdAt),
]);

// User sessions (for advanced session management)
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgent: text("user_agent"),
  deviceId: varchar("device_id", { length: 255 }),
  location: jsonb("location").$type<{ country?: string; region?: string; city?: string; timezone?: string }>(), // Geo location data
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_unique_session_token").on(table.token),
  index("idx_user_sessions_user").on(table.userId),
  index("idx_user_sessions_expires").on(table.expiresAt),
  index("idx_user_sessions_active").on(table.isActive),
]);

// Device fingerprints (for device tracking)
export const deviceFingerprints = pgTable("device_fingerprints", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  fingerprint: varchar("fingerprint", { length: 255 }).notNull(),
  deviceName: varchar("device_name", { length: 255 }),
  deviceType: varchar("device_type", { length: 50 }), // desktop, mobile, tablet
  os: varchar("os", { length: 100 }),
  browser: varchar("browser", { length: 100 }),
  browserVersion: varchar("browser_version", { length: 50 }),
  screenResolution: varchar("screen_resolution", { length: 50 }),
  trusted: boolean("trusted").default(false),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  location: jsonb("location").$type<{ country?: string; region?: string; city?: string }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_unique_device_fingerprint").on(table.userId, table.fingerprint),
  index("idx_device_fingerprints_user").on(table.userId),
  index("idx_device_fingerprints_trusted").on(table.trusted),
]);

// Session events (for session security monitoring)
export const sessionEvents = pgTable("session_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => userSessions.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: varchar("event_type", { length: 50 }).notNull(), // login, logout, activity, location_change, device_change, hijack_detected
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  location: jsonb("location").$type<{ country?: string; region?: string; city?: string }>(),
  metadata: jsonb("metadata"), // Additional event data
  severity: varchar("severity", { length: 20 }).default("info"), // info, warning, critical
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_session_events_session").on(table.sessionId),
  index("idx_session_events_user").on(table.userId),
  index("idx_session_events_type").on(table.eventType),
  index("idx_session_events_severity").on(table.severity),
  index("idx_session_events_created").on(table.createdAt),
]);

// ====================================================================
// SOCIAL MEDIA HUB SCHEMAS
// ====================================================================

// Social Media Accounts - Store connected social accounts
export const socialMediaAccounts = pgTable("social_media_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Platform Details
  platform: varchar("platform", { length: 30 }).notNull(), // facebook, instagram, twitter, linkedin, tiktok, pinterest, youtube
  accountType: varchar("account_type", { length: 30 }).default("business"), // business, personal, page, channel
  accountId: varchar("account_id", { length: 255 }).notNull(), // Platform-specific ID
  accountName: varchar("account_name", { length: 255 }),
  accountHandle: varchar("account_handle", { length: 255 }),
  profileUrl: varchar("profile_url"),
  profileImageUrl: varchar("profile_image_url"),
  
  // OAuth & Authentication
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  tokenScopes: jsonb("token_scopes"), // Array of granted permissions
  
  // Account Status
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  lastErrorAt: timestamp("last_error_at"),
  lastError: text("last_error"),
  
  // Platform-specific metadata
  platformMetadata: jsonb("platform_metadata"), // Store platform-specific data
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_social_accounts_business").on(table.businessId),
  uniqueIndex("idx_unique_social_account").on(table.businessId, table.platform, table.accountId)
]);

// Social Media Posts - Unified content across platforms
export const socialMediaPosts = pgTable("social_media_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Content Details
  content: text("content").notNull(),
  contentType: varchar("content_type", { length: 30 }).default("text"), // text, image, video, carousel, story, reel
  mediaUrls: jsonb("media_urls"), // Array of media URLs
  thumbnailUrl: varchar("thumbnail_url"),
  hashtags: jsonb("hashtags"), // Array of hashtags
  mentions: jsonb("mentions"), // Array of @mentions
  links: jsonb("links"), // Array of links in the post
  
  // Publishing Details
  status: varchar("status", { length: 30 }).notNull().default("draft"), // draft, scheduled, published, failed, archived
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  
  // Platform Distribution
  platforms: jsonb("platforms").notNull(), // Array of platforms to publish to
  platformPosts: jsonb("platform_posts"), // Platform-specific post IDs and statuses
  
  // Campaign & Organization  
  campaignId: uuid("campaign_id"),
  categoryId: uuid("category_id"),
  isPromoted: boolean("is_promoted").default(false),
  promotionBudget: decimal("promotion_budget", { precision: 10, scale: 2 }),
  
  // Team Collaboration
  needsApproval: boolean("needs_approval").default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  approvalNotes: text("approval_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_social_posts_business").on(table.businessId),
  index("idx_social_posts_scheduled").on(table.scheduledAt),
  index("idx_social_posts_status").on(table.status)
]);

// Social Media Campaigns - Group posts into campaigns
export const socialMediaCampaigns = pgTable("social_media_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  objectives: jsonb("objectives"), // Array of campaign objectives
  
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  
  budget: decimal("budget", { precision: 10, scale: 2 }),
  spentBudget: decimal("spent_budget", { precision: 10, scale: 2 }).default("0"),
  
  targetAudience: jsonb("target_audience"), // Demographics and interests
  targetPlatforms: jsonb("target_platforms"), // Array of platforms
  
  status: varchar("status", { length: 30 }).default("draft"), // draft, active, paused, completed
  
  // Performance Tracking
  postCount: integer("post_count").default(0),
  totalImpressions: integer("total_impressions").default(0),
  totalEngagements: integer("total_engagements").default(0),
  totalConversions: integer("total_conversions").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_social_campaigns_business").on(table.businessId),
  index("idx_social_campaigns_status").on(table.status)
]);

// Social Content Categories - Organize content
export const socialContentCategories = pgTable("social_content_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }), // Hex color for calendar display
  icon: varchar("icon", { length: 50 }),
  description: text("description"),
  
  postCount: integer("post_count").default(0),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_content_categories_business").on(table.businessId)
]);

// Social Media Analytics - Track performance metrics
export const socialMediaAnalytics = pgTable("social_media_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => socialMediaPosts.id, { onDelete: 'cascade' }),
  accountId: uuid("account_id").references(() => socialMediaAccounts.id, { onDelete: 'cascade' }),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  
  // Platform & Period
  platform: varchar("platform", { length: 30 }).notNull(),
  metricDate: date("metric_date").notNull(),
  metricType: varchar("metric_type", { length: 30 }).default("post"), // post, account, campaign, story
  
  // Engagement Metrics
  impressions: integer("impressions").default(0),
  reach: integer("reach").default(0),
  engagements: integer("engagements").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  saves: integer("saves").default(0),
  clicks: integer("clicks").default(0),
  videoViews: integer("video_views").default(0),
  videoCompletions: integer("video_completions").default(0),
  
  // Audience Metrics
  followerCount: integer("follower_count"),
  followerGrowth: integer("follower_growth"),
  audienceDemographics: jsonb("audience_demographics"),
  
  // Performance Metrics
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  clickThroughRate: decimal("click_through_rate", { precision: 5, scale: 2 }),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  costPerEngagement: decimal("cost_per_engagement", { precision: 10, scale: 2 }),
  
  // Revenue Attribution
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_social_analytics_business").on(table.businessId),
  index("idx_social_analytics_date").on(table.metricDate),
  index("idx_social_analytics_platform").on(table.platform)
]);

// Social Media Messages - Unified inbox
export const socialMediaMessages = pgTable("social_media_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  accountId: uuid("account_id").notNull().references(() => socialMediaAccounts.id, { onDelete: 'cascade' }),
  
  // Message Details
  platform: varchar("platform", { length: 30 }).notNull(),
  platformMessageId: varchar("platform_message_id", { length: 255 }),
  messageType: varchar("message_type", { length: 30 }).default("direct"), // direct, comment, mention, review
  
  // Sender/Recipient
  senderName: varchar("sender_name", { length: 255 }),
  senderId: varchar("sender_id", { length: 255 }),
  senderProfileUrl: varchar("sender_profile_url"),
  isFromBusiness: boolean("is_from_business").default(false),
  
  // Content
  content: text("content"),
  mediaUrls: jsonb("media_urls"),
  parentMessageId: uuid("parent_message_id"), // Self-reference - references parent message in thread
  threadId: varchar("thread_id", { length: 255 }),
  
  // Status & Management
  status: varchar("status", { length: 30 }).default("unread"), // unread, read, replied, archived, flagged
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  sentiment: varchar("sentiment", { length: 20 }), // positive, neutral, negative, critical
  
  // Assignment & Response
  assignedTo: varchar("assigned_to").references(() => users.id),
  repliedAt: timestamp("replied_at"),
  responseTime: integer("response_time"), // in seconds
  
  // Automation
  autoResponseSent: boolean("auto_response_sent").default(false),
  autoResponseTemplate: uuid("auto_response_template"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_social_messages_business").on(table.businessId),
  index("idx_social_messages_status").on(table.status),
  index("idx_social_messages_platform").on(table.platform)
]);

// Social Response Templates - Pre-written responses
export const socialResponseTemplates = pgTable("social_response_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }), // greeting, faq, complaint, thank_you
  content: text("content").notNull(),
  platforms: jsonb("platforms"), // Array of applicable platforms
  triggers: jsonb("triggers"), // Keywords or conditions that trigger this template
  
  useCount: integer("use_count").default(0),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_response_templates_business").on(table.businessId)
]);

// Social Media Listeners - Monitor keywords and mentions
export const socialMediaListeners = pgTable("social_media_listeners", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(), // keyword, hashtag, mention, competitor
  
  // Monitoring Configuration
  keywords: jsonb("keywords"), // Array of keywords to track
  hashtags: jsonb("hashtags"), // Array of hashtags to monitor
  accounts: jsonb("accounts"), // Array of accounts to track (competitors, influencers)
  platforms: jsonb("platforms"), // Array of platforms to monitor
  
  // Alert Configuration
  alertEnabled: boolean("alert_enabled").default(false),
  alertThreshold: integer("alert_threshold"), // Number of mentions to trigger alert
  alertEmails: jsonb("alert_emails"), // Array of emails to notify
  
  isActive: boolean("is_active").default(true),
  lastCheckedAt: timestamp("last_checked_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_social_listeners_business").on(table.businessId)
]);

// Social Media Mentions - Store tracked mentions
export const socialMediaMentions = pgTable("social_media_mentions", {
  id: uuid("id").primaryKey().defaultRandom(),
  listenerId: uuid("listener_id").references(() => socialMediaListeners.id, { onDelete: 'cascade' }),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  
  platform: varchar("platform", { length: 30 }).notNull(),
  platformPostId: varchar("platform_post_id", { length: 255 }),
  
  authorName: varchar("author_name", { length: 255 }),
  authorHandle: varchar("author_handle", { length: 255 }),
  authorProfileUrl: varchar("author_profile_url"),
  
  content: text("content"),
  postUrl: varchar("post_url"),
  
  sentiment: varchar("sentiment", { length: 20 }), // positive, neutral, negative
  reach: integer("reach"),
  engagement: integer("engagement"),
  
  isInfluencer: boolean("is_influencer").default(false),
  influencerScore: integer("influencer_score"),
  
  responded: boolean("responded").default(false),
  respondedAt: timestamp("responded_at"),
  
  mentionedAt: timestamp("mentioned_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_social_mentions_business").on(table.businessId),
  index("idx_social_mentions_mentioned_at").on(table.mentionedAt)
]);

// Social Media Automation Rules
export const socialMediaAutomation = pgTable("social_media_automation", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // rss_feed, product_sync, review_share, welcome_message, anniversary
  
  // Trigger Configuration
  triggerType: varchar("trigger_type", { length: 50 }), // time, event, condition
  triggerConfig: jsonb("trigger_config"), // Specific configuration for the trigger
  
  // Action Configuration
  actionType: varchar("action_type", { length: 50 }), // post, message, email
  actionConfig: jsonb("action_config"), // Specific configuration for the action
  
  platforms: jsonb("platforms"), // Target platforms
  
  isActive: boolean("is_active").default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  triggerCount: integer("trigger_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_social_automation_business").on(table.businessId)
]);

// Social Media Team Members - Collaboration
export const socialMediaTeam = pgTable("social_media_team", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  role: varchar("role", { length: 50 }).notNull(), // admin, editor, moderator, viewer
  permissions: jsonb("permissions"), // Granular permissions
  
  // Access Control
  canPublish: boolean("can_publish").default(false),
  canSchedule: boolean("can_schedule").default(true),
  canRespond: boolean("can_respond").default(true),
  canViewAnalytics: boolean("can_view_analytics").default(true),
  canManageTeam: boolean("can_manage_team").default(false),
  
  assignedPlatforms: jsonb("assigned_platforms"), // Platforms this member can manage
  
  isActive: boolean("is_active").default(true),
  invitedBy: varchar("invited_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_social_team_business").on(table.businessId),
  uniqueIndex("idx_unique_social_team_member").on(table.businessId, table.userId)
]);

// Social Media Insert Schemas
export const insertSocialMediaAccountSchema = createInsertSchema(socialMediaAccounts);
export const insertSocialMediaPostSchema = createInsertSchema(socialMediaPosts);
export const insertSocialMediaCampaignSchema = createInsertSchema(socialMediaCampaigns);
export const insertSocialContentCategorySchema = createInsertSchema(socialContentCategories);
export const insertSocialMediaAnalyticsSchema = createInsertSchema(socialMediaAnalytics);
export const insertSocialMediaMessageSchema = createInsertSchema(socialMediaMessages);
export const insertSocialResponseTemplateSchema = createInsertSchema(socialResponseTemplates);
export const insertSocialMediaListenerSchema = createInsertSchema(socialMediaListeners);
export const insertSocialMediaMentionSchema = createInsertSchema(socialMediaMentions);
export const insertSocialMediaAutomationSchema = createInsertSchema(socialMediaAutomation);
export const insertSocialMediaTeamSchema = createInsertSchema(socialMediaTeam);

// Insert schemas
export const insertAdminRoleSchema = createInsertSchema(adminRoles);
export const insertUserRoleSchema = createInsertSchema(userRoles);
export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLogs);
export const insertErrorLogSchema = createInsertSchema(errorLogs);
export const insertPremiumAdSlotSchema = createInsertSchema(premiumAdSlots);
export const insertRateLimitViolationSchema = createInsertSchema(rateLimitViolations);
export const insertUserSessionSchema = createInsertSchema(userSessions);
export const insertDeviceFingerprintSchema = createInsertSchema(deviceFingerprints);
export const insertSessionEventSchema = createInsertSchema(sessionEvents);

// Chat system insert schemas
export const insertChatConversationSchema = createInsertSchema(chatConversations);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertChatKnowledgeBaseSchema = createInsertSchema(chatKnowledgeBase);
export const insertChatSessionSchema = createInsertSchema(chatSessions);
export const insertChatAnalyticsSchema = createInsertSchema(chatAnalytics);
export const insertChatQuickActionSchema = createInsertSchema(chatQuickActions);
export const insertChatProactiveTriggerSchema = createInsertSchema(chatProactiveTriggers);

// TypeScript types
export type PremiumAdSlot = typeof premiumAdSlots.$inferSelect;
export type InsertPremiumAdSlot = z.infer<typeof insertPremiumAdSlotSchema>;

export type AdminRole = typeof adminRoles.$inferSelect;
export type InsertAdminRole = z.infer<typeof insertAdminRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;
export type ErrorLog = typeof errorLogs.$inferSelect;

// AI Content Types
export const insertAIGeneratedContentSchema = createInsertSchema(aiGeneratedContent);
export const insertAIContentTemplateSchema = createInsertSchema(aiContentTemplates);
export const insertAIGeneratedImageSchema = createInsertSchema(aiGeneratedImages);
export const insertAIUsageTrackingSchema = createInsertSchema(aiUsageTracking);
export const insertAIContentTestSchema = createInsertSchema(aiContentTests);
export const insertAIModerationLogSchema = createInsertSchema(aiModerationLog);

export type AIGeneratedContent = typeof aiGeneratedContent.$inferSelect;
export type InsertAIGeneratedContent = z.infer<typeof insertAIGeneratedContentSchema>;

export type AIContentTemplate = typeof aiContentTemplates.$inferSelect;
export type InsertAIContentTemplate = z.infer<typeof insertAIContentTemplateSchema>;

export type AIGeneratedImage = typeof aiGeneratedImages.$inferSelect;
export type InsertAIGeneratedImage = z.infer<typeof insertAIGeneratedImageSchema>;

export type AIUsageTracking = typeof aiUsageTracking.$inferSelect;
export type InsertAIUsageTracking = z.infer<typeof insertAIUsageTrackingSchema>;

export type AIContentTest = typeof aiContentTests.$inferSelect;
export type InsertAIContentTest = z.infer<typeof insertAIContentTestSchema>;

export type AIModerationLog = typeof aiModerationLog.$inferSelect;
export type InsertAIModerationLog = z.infer<typeof insertAIModerationLogSchema>;
export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;

// Chat system TypeScript types
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatKnowledgeBase = typeof chatKnowledgeBase.$inferSelect;
export type InsertChatKnowledgeBase = z.infer<typeof insertChatKnowledgeBaseSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatAnalytics = typeof chatAnalytics.$inferSelect;
export type InsertChatAnalytics = z.infer<typeof insertChatAnalyticsSchema>;
export type ChatQuickAction = typeof chatQuickActions.$inferSelect;
export type InsertChatQuickAction = z.infer<typeof insertChatQuickActionSchema>;
export type ChatProactiveTrigger = typeof chatProactiveTriggers.$inferSelect;
export type InsertChatProactiveTrigger = z.infer<typeof insertChatProactiveTriggerSchema>;

// Security and session management types
export type RateLimitViolation = typeof rateLimitViolations.$inferSelect;
export type InsertRateLimitViolation = z.infer<typeof insertRateLimitViolationSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type DeviceFingerprint = typeof deviceFingerprints.$inferSelect;
export type InsertDeviceFingerprint = z.infer<typeof insertDeviceFingerprintSchema>;
export type SessionEvent = typeof sessionEvents.$inferSelect;
export type InsertSessionEvent = z.infer<typeof insertSessionEventSchema>;

// Social Media Hub Types
export type SocialMediaAccount = typeof socialMediaAccounts.$inferSelect;
export type InsertSocialMediaAccount = z.infer<typeof insertSocialMediaAccountSchema>;
export type UpdateSocialMediaAccount = Partial<InsertSocialMediaAccount>;

export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type InsertSocialMediaPost = z.infer<typeof insertSocialMediaPostSchema>;
export type UpdateSocialMediaPost = Partial<InsertSocialMediaPost>;

export type SocialMediaCampaign = typeof socialMediaCampaigns.$inferSelect;
export type InsertSocialMediaCampaign = z.infer<typeof insertSocialMediaCampaignSchema>;
export type UpdateSocialMediaCampaign = Partial<InsertSocialMediaCampaign>;

export type SocialContentCategory = typeof socialContentCategories.$inferSelect;
export type InsertSocialContentCategory = z.infer<typeof insertSocialContentCategorySchema>;

export type SocialMediaAnalytics = typeof socialMediaAnalytics.$inferSelect;
export type InsertSocialMediaAnalytics = z.infer<typeof insertSocialMediaAnalyticsSchema>;

export type SocialMediaMessage = typeof socialMediaMessages.$inferSelect;
export type InsertSocialMediaMessage = z.infer<typeof insertSocialMediaMessageSchema>;
export type UpdateSocialMediaMessage = Partial<InsertSocialMediaMessage>;

export type SocialResponseTemplate = typeof socialResponseTemplates.$inferSelect;
export type InsertSocialResponseTemplate = z.infer<typeof insertSocialResponseTemplateSchema>;

export type SocialMediaListener = typeof socialMediaListeners.$inferSelect;
export type InsertSocialMediaListener = z.infer<typeof insertSocialMediaListenerSchema>;

export type SocialMediaMention = typeof socialMediaMentions.$inferSelect;
export type InsertSocialMediaMention = z.infer<typeof insertSocialMediaMentionSchema>;

export type SocialMediaAutomation = typeof socialMediaAutomation.$inferSelect;
export type InsertSocialMediaAutomation = z.infer<typeof insertSocialMediaAutomationSchema>;

export type SocialMediaTeam = typeof socialMediaTeam.$inferSelect;
export type InsertSocialMediaTeam = z.infer<typeof insertSocialMediaTeamSchema>;
export type UpdateSocialMediaTeam = Partial<InsertSocialMediaTeam>;
