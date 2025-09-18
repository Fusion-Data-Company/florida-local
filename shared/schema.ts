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
  invoiceNumber: varchar("invoice_number", { length: 50 }),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
  postLikes: many(postLikes),
  postComments: many(postComments),
  businessFollowers: many(businessFollowers),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  cartItems: many(cartItems),
  orders: many(orders),
  spotlightVotes: many(spotlightVotes),
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
