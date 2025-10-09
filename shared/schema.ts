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
});

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
