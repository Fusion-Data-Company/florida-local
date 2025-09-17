import {
  users,
  businesses,
  products,
  posts,
  postLikes,
  postComments,
  businessFollowers,
  spotlights,
  messages,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, like, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
}

export const storage = new DatabaseStorage();
