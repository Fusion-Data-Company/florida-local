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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, like, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserAdminStatus(id: string, isAdmin: boolean): Promise<void>;
  
  // Business operations
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, business: UpdateBusiness): Promise<Business>;
  deleteBusiness(id: string): Promise<void>;
  getBusinessById(id: string): Promise<Business | undefined>;
  getBusinessesByOwner(ownerId: string): Promise<Business[]>;
  searchBusinesses(query: string, category?: string): Promise<Business[]>;
  getSpotlightBusinesses(type: 'daily' | 'weekly' | 'monthly'): Promise<Business[]>;
  followBusiness(userId: string, businessId: string): Promise<void>;
  unfollowBusiness(userId: string, businessId: string): Promise<void>;
  isFollowingBusiness(userId: string, businessId: string): Promise<boolean>;
  
  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductsByBusiness(businessId: string): Promise<Product[]>;
  searchProducts(query: string, category?: string): Promise<Product[]>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  
  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getPostById(id: string): Promise<Post | undefined>;
  getRecentPosts(limit?: number): Promise<Post[]>;
  getPostsByBusiness(businessId: string): Promise<Post[]>;
  likePost(userId: string, postId: string): Promise<void>;
  unlikePost(userId: string, postId: string): Promise<void>;
  isPostLiked(userId: string, postId: string): Promise<boolean>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]>;
  getConversations(userId: string): Promise<any[]>;
  markMessageAsRead(messageId: string): Promise<void>;
  
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
  
  // Rotation management
  rotateSpotlights(): Promise<void>;
  canPerformManualRotation(): Promise<{ canRotate: boolean; reason?: string }>;
  archiveExpiredSpotlights(): Promise<void>;
  
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async getProductsByBusiness(businessId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.businessId, businessId))
      .orderBy(desc(products.createdAt));
  }

  async searchProducts(query: string, category?: string): Promise<Product[]> {
    const conditions = [
      or(
        like(products.name, `%${query}%`),
        like(products.description, `%${query}%`)
      ),
      eq(products.isActive, true)
    ];

    if (category) {
      conditions.push(eq(products.category, category));
    }

    return await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.rating));
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
      .where(and(eq(posts.businessId, businessId), eq(posts.isVisible, true)))
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

  async markMessageAsRead(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
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
    const previousFollowerCount = existingMetrics?.businessId ? business.followerCount - (existingMetrics.followersGrowth || 0) : 0;
    const followersGrowth = business.followerCount - previousFollowerCount;

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

    // Get all active businesses
    const allBusinesses = await db
      .select()
      .from(businesses)
      .where(
        and(
          eq(businesses.isActive, true),
          eq(businesses.isVerified, true) // Only verified businesses
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
}

export const storage = new DatabaseStorage();
