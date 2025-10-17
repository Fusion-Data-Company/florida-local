import {
  BlogPost, InsertBlogPost, UpdateBlogPost,
  BlogCategory, InsertBlogCategory,
  BlogTag, InsertBlogTag,
  BlogComment, InsertBlogComment, UpdateBlogComment,
  BlogReaction, InsertBlogReaction,
  BlogBookmark, InsertBlogBookmark,
  BlogSubscription, InsertBlogSubscription,
  BlogAnalytics, InsertBlogAnalytics,
  BlogRevision, InsertBlogRevision,
  blogPosts, blogCategories, blogTags, blogPostTags, blogComments,
  blogReactions, blogBookmarks, blogSubscriptions, blogAnalytics, blogRevisions
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql, and, or, like, inArray, between, gte, lte, ne, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

// SEO and Content Analysis
export interface SEOAnalysis {
  score: number;
  issues: string[];
  warnings: string[];
  suggestions: string[];
  metaTitleLength: number;
  metaDescriptionLength: number;
  headingStructure: { h1: number; h2: number; h3: number };
  keywordDensity: Map<string, number>;
  readabilityScore: number;
  estimatedReadingTime: number;
  imageAltTexts: { missing: number; total: number };
  internalLinks: number;
  externalLinks: number;
}

export interface StructuredData {
  "@context": string;
  "@type": string;
  headline: string;
  description: string;
  image?: string[];
  datePublished: string;
  dateModified: string;
  author: {
    "@type": string;
    name: string;
    url?: string;
  };
  publisher?: {
    "@type": string;
    name: string;
    logo?: {
      "@type": string;
      url: string;
    };
  };
  mainEntityOfPage?: {
    "@type": string;
    "@id": string;
  };
}

export class BlogService {
  // ========== POST MANAGEMENT ==========

  async createPost(data: InsertBlogPost): Promise<BlogPost> {
    const slug = await this.generateUniqueSlug(data.title);
    
    // Auto-generate SEO fields if not provided
    const seoData = {
      ...data,
      slug,
      metaTitle: data.metaTitle || this.generateMetaTitle(data.title),
      metaDescription: data.metaDescription || this.generateMetaDescription(data.excerpt || data.content),
      canonicalUrl: data.canonicalUrl || `/blog/${slug}`,
    };

    const [post] = await db.insert(blogPosts).values(seoData).returning();
    
    // Create initial revision
    await this.createRevision(post.id, post, "Initial version");
    
    // Schedule auto-save if draft
    if (post.status === 'draft') {
      this.scheduleAutoSave(post.id);
    }
    
    return post;
  }

  async updatePost(id: string, data: UpdateBlogPost): Promise<BlogPost> {
    const existing = await this.getPostById(id);
    if (!existing) throw new Error("Post not found");

    // Track version if content changed
    if (data.content && data.content !== existing.content) {
      await this.createRevision(id, { ...existing, ...data }, "Content update");
    }

    // Update SEO fields
    if (data.title && !data.metaTitle) {
      data.metaTitle = this.generateMetaTitle(data.title);
    }
    
    const [updated] = await db
      .update(blogPosts)
      .set({
        ...data,
        updatedAt: new Date(),
        version: sql`${blogPosts.version} + 1`,
      })
      .where(eq(blogPosts.id, id))
      .returning();
      
    return updated;
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async getPostById(id: string): Promise<BlogPost | null> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1);
    return post || null;
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);
      
    // Track view asynchronously
    if (post) {
      this.trackView(post.id).catch(console.error);
    }
    
    return post || null;
  }

  async searchPosts(params: {
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
  }) {
    const { page = 1, limit = 10, sort = 'newest' } = params;
    const offset = (page - 1) * limit;
    
    let query = db.select().from(blogPosts).$dynamic();
    
    const conditions = [];
    
    if (params.query) {
      conditions.push(
        or(
          like(blogPosts.title, `%${params.query}%`),
          like(blogPosts.content, `%${params.query}%`),
          like(blogPosts.excerpt, `%${params.query}%`)
        )
      );
    }
    
    if (params.categoryId) {
      conditions.push(eq(blogPosts.categoryId, params.categoryId));
    }
    
    if (params.authorId) {
      conditions.push(eq(blogPosts.authorId, params.authorId));
    }
    
    if (params.status) {
      conditions.push(eq(blogPosts.status, params.status));
    }
    
    if (params.startDate && params.endDate) {
      conditions.push(
        between(blogPosts.publishedAt, params.startDate, params.endDate)
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Apply sorting
    switch (sort) {
      case 'popular':
        query = query.orderBy(desc(blogPosts.viewCount));
        break;
      case 'trending':
        query = query.orderBy(desc(sql`${blogPosts.viewCount} * EXP(-EXTRACT(EPOCH FROM (NOW() - ${blogPosts.publishedAt})) / 604800)`));
        break;
      default:
        query = query.orderBy(desc(blogPosts.publishedAt));
    }
    
    const results = await query.limit(limit).offset(offset);
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.as<number>() })
      .from(blogPosts)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    return {
      posts: results,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  async getRelatedPosts(postId: string, limit = 5): Promise<BlogPost[]> {
    const post = await this.getPostById(postId);
    if (!post) return [];
    
    // Find posts with similar tags or in same category
    const related = await db
      .select({
        post: blogPosts,
        score: sql<number>`
          CASE WHEN ${blogPosts.categoryId} = ${post.categoryId} THEN 3 ELSE 0 END +
          (SELECT COUNT(*) FROM ${blogPostTags} t1 
           JOIN ${blogPostTags} t2 ON t1.tag_id = t2.tag_id 
           WHERE t1.post_id = ${post.id} AND t2.post_id = ${blogPosts.id})
        `.as('score')
      })
      .from(blogPosts)
      .where(
        and(
          ne(blogPosts.id, postId),
          eq(blogPosts.status, 'published')
        )
      )
      .orderBy(desc(sql`score`), desc(blogPosts.publishedAt))
      .limit(limit);
    
    return related.map(r => r.post);
  }

  // ========== CATEGORY & TAG MANAGEMENT ==========

  async createCategory(data: InsertBlogCategory): Promise<BlogCategory> {
    const slug = this.generateSlug(data.name);
    const [category] = await db
      .insert(blogCategories)
      .values({ ...data, slug })
      .returning();
    return category;
  }

  async updateCategory(id: string, data: Partial<InsertBlogCategory>): Promise<BlogCategory> {
    if (data.name) {
      data.slug = this.generateSlug(data.name);
    }
    const [updated] = await db
      .update(blogCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(blogCategories.id, id))
      .returning();
    return updated;
  }

  async getCategories(): Promise<BlogCategory[]> {
    return db
      .select()
      .from(blogCategories)
      .where(eq(blogCategories.isActive, true))
      .orderBy(asc(blogCategories.name));
  }

  async createTag(data: InsertBlogTag): Promise<BlogTag> {
    const slug = this.generateSlug(data.name);
    const [tag] = await db
      .insert(blogTags)
      .values({ ...data, slug })
      .returning();
    return tag;
  }

  async getTags(): Promise<BlogTag[]> {
    return db
      .select()
      .from(blogTags)
      .orderBy(desc(blogTags.postCount));
  }

  async attachTagsToPost(postId: string, tagIds: string[]): Promise<void> {
    const values = tagIds.map(tagId => ({
      postId,
      tagId,
    }));
    
    await db.insert(blogPostTags).values(values).onConflictDoNothing();
    
    // Update tag counts
    await db
      .update(blogTags)
      .set({
        postCount: sql`${blogTags.postCount} + 1`
      })
      .where(inArray(blogTags.id, tagIds));
  }

  // ========== COMMENT SYSTEM ==========

  async createComment(data: InsertBlogComment): Promise<BlogComment> {
    const [comment] = await db.insert(blogComments).values(data).returning();
    
    // Update post comment count
    await db
      .update(blogPosts)
      .set({ commentCount: sql`${blogPosts.commentCount} + 1` })
      .where(eq(blogPosts.id, data.postId));
    
    // Update parent comment reply count if nested
    if (data.parentCommentId) {
      await db
        .update(blogComments)
        .set({ replyCount: sql`${blogComments.replyCount} + 1` })
        .where(eq(blogComments.id, data.parentCommentId));
    }
    
    return comment;
  }

  async updateComment(id: string, data: UpdateBlogComment): Promise<BlogComment> {
    const [updated] = await db
      .update(blogComments)
      .set({
        ...data,
        isEdited: true,
        editedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(blogComments.id, id))
      .returning();
    return updated;
  }

  async deleteComment(id: string): Promise<void> {
    const comment = await db
      .select()
      .from(blogComments)
      .where(eq(blogComments.id, id))
      .limit(1);
    
    if (comment.length > 0) {
      await db.delete(blogComments).where(eq(blogComments.id, id));
      
      // Update counts
      await db
        .update(blogPosts)
        .set({ commentCount: sql`${blogPosts.commentCount} - 1` })
        .where(eq(blogPosts.id, comment[0].postId));
    }
  }

  async getComments(postId: string, options?: { 
    parentId?: string | null;
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'oldest' | 'popular';
  }) {
    const { page = 1, limit = 20, sortBy = 'newest', parentId = null } = options || {};
    const offset = (page - 1) * limit;
    
    let query = db
      .select()
      .from(blogComments)
      .where(
        and(
          eq(blogComments.postId, postId),
          eq(blogComments.isApproved, true),
          parentId ? eq(blogComments.parentCommentId, parentId) : isNull(blogComments.parentCommentId)
        )
      )
      .$dynamic();
    
    switch (sortBy) {
      case 'oldest':
        query = query.orderBy(asc(blogComments.createdAt));
        break;
      case 'popular':
        query = query.orderBy(desc(blogComments.likeCount), desc(blogComments.createdAt));
        break;
      default:
        query = query.orderBy(desc(blogComments.createdAt));
    }
    
    return query.limit(limit).offset(offset);
  }

  async moderateComment(id: string, approved: boolean): Promise<void> {
    await db
      .update(blogComments)
      .set({ isApproved: approved })
      .where(eq(blogComments.id, id));
  }

  // ========== REACTIONS & BOOKMARKS ==========

  async addReaction(data: InsertBlogReaction): Promise<BlogReaction> {
    const [reaction] = await db
      .insert(blogReactions)
      .values(data)
      .onConflictDoUpdate({
        target: [blogReactions.postId, blogReactions.userId, blogReactions.reactionType],
        set: { 
          count: sql`${blogReactions.count} + 1`,
          updatedAt: new Date() 
        }
      })
      .returning();
    
    // Update post like count
    await db
      .update(blogPosts)
      .set({ likeCount: sql`${blogPosts.likeCount} + 1` })
      .where(eq(blogPosts.id, data.postId));
    
    return reaction;
  }

  async removeReaction(postId: string, userId: string, reactionType = 'like'): Promise<void> {
    await db
      .delete(blogReactions)
      .where(
        and(
          eq(blogReactions.postId, postId),
          eq(blogReactions.userId, userId),
          eq(blogReactions.reactionType, reactionType)
        )
      );
    
    await db
      .update(blogPosts)
      .set({ likeCount: sql`${blogPosts.likeCount} - 1` })
      .where(eq(blogPosts.id, postId));
  }

  async bookmarkPost(data: InsertBlogBookmark): Promise<BlogBookmark> {
    const [bookmark] = await db
      .insert(blogBookmarks)
      .values(data)
      .onConflictDoNothing()
      .returning();
    
    if (bookmark) {
      await db
        .update(blogPosts)
        .set({ bookmarkCount: sql`${blogPosts.bookmarkCount} + 1` })
        .where(eq(blogPosts.id, data.postId));
    }
    
    return bookmark;
  }

  async removeBookmark(postId: string, userId: string): Promise<void> {
    await db
      .delete(blogBookmarks)
      .where(
        and(
          eq(blogBookmarks.postId, postId),
          eq(blogBookmarks.userId, userId)
        )
      );
    
    await db
      .update(blogPosts)
      .set({ bookmarkCount: sql`${blogPosts.bookmarkCount} - 1` })
      .where(eq(blogPosts.id, postId));
  }

  // ========== SUBSCRIPTIONS & NEWSLETTERS ==========

  async subscribe(data: InsertBlogSubscription): Promise<BlogSubscription> {
    const unsubscribeToken = nanoid(32);
    const [subscription] = await db
      .insert(blogSubscriptions)
      .values({ ...data, unsubscribeToken })
      .onConflictDoUpdate({
        target: blogSubscriptions.email,
        set: {
          ...data,
          isActive: true,
          updatedAt: new Date(),
        }
      })
      .returning();
    
    // Send confirmation email
    this.sendSubscriptionConfirmation(subscription).catch(console.error);
    
    return subscription;
  }

  async unsubscribe(token: string): Promise<void> {
    await db
      .update(blogSubscriptions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(blogSubscriptions.unsubscribeToken, token));
  }

  async getSubscribers(options?: {
    categories?: string[];
    frequency?: string;
    active?: boolean;
  }): Promise<BlogSubscription[]> {
    let query = db.select().from(blogSubscriptions).$dynamic();
    
    const conditions = [];
    
    if (options?.active !== undefined) {
      conditions.push(eq(blogSubscriptions.isActive, options.active));
    }
    
    if (options?.frequency) {
      conditions.push(eq(blogSubscriptions.frequency, options.frequency));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query;
  }

  // ========== ANALYTICS & TRACKING ==========

  async trackView(postId: string, data?: Partial<InsertBlogAnalytics>): Promise<void> {
    // Insert analytics record
    await db.insert(blogAnalytics).values({
      postId,
      viewType: 'page_view',
      ...data,
    });
    
    // Update view counts
    await db
      .update(blogPosts)
      .set({ 
        viewCount: sql`${blogPosts.viewCount} + 1`,
      })
      .where(eq(blogPosts.id, postId));
  }

  async trackEngagement(postId: string, type: 'share' | 'scroll_50' | 'scroll_100' | 'read_complete', data?: any): Promise<void> {
    if (type === 'share') {
      await db
        .update(blogPosts)
        .set({ shareCount: sql`${blogPosts.shareCount} + 1` })
        .where(eq(blogPosts.id, postId));
    }
    
    await db.insert(blogAnalytics).values({
      postId,
      viewType: type,
      ...data,
    });
  }

  async getPostAnalytics(postId: string, period?: { start: Date; end: Date }) {
    const conditions = [eq(blogAnalytics.postId, postId)];
    
    if (period) {
      conditions.push(between(blogAnalytics.viewedAt, period.start, period.end));
    }
    
    const [stats] = await db
      .select({
        totalViews: sql`COUNT(*)`.as<number>(),
        uniqueViews: sql`COUNT(DISTINCT session_id)`.as<number>(),
        avgTimeSpent: sql`AVG(time_spent_seconds)`.as<number>(),
        avgScrollDepth: sql`AVG(scroll_depth)`.as<number>(),
        completionRate: sql`
          (COUNT(*) FILTER (WHERE view_type = 'read_complete')::float / 
           NULLIF(COUNT(*) FILTER (WHERE view_type = 'page_view'), 0) * 100)
        `.as<number>(),
      })
      .from(blogAnalytics)
      .where(and(...conditions));
    
    return stats;
  }

  async getPopularPosts(limit = 10, period = 30): Promise<BlogPost[]> {
    const periodDate = new Date();
    periodDate.setDate(periodDate.getDate() - period);
    
    return db
      .select()
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.status, 'published'),
          gte(blogPosts.publishedAt, periodDate)
        )
      )
      .orderBy(desc(blogPosts.viewCount))
      .limit(limit);
  }

  // ========== VERSION CONTROL ==========

  async createRevision(postId: string, data: any, changesSummary?: string): Promise<void> {
    const post = await this.getPostById(postId);
    if (!post) return;
    
    await db.insert(blogRevisions).values({
      postId,
      version: post.version,
      editedBy: data.lastEditedBy || data.authorId,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      changesSummary,
    });
  }

  async getRevisions(postId: string): Promise<BlogRevision[]> {
    return db
      .select()
      .from(blogRevisions)
      .where(eq(blogRevisions.postId, postId))
      .orderBy(desc(blogRevisions.version));
  }

  async restoreRevision(postId: string, revisionId: string): Promise<BlogPost> {
    const [revision] = await db
      .select()
      .from(blogRevisions)
      .where(eq(blogRevisions.id, revisionId))
      .limit(1);
    
    if (!revision) throw new Error("Revision not found");
    
    return this.updatePost(postId, {
      title: revision.title,
      content: revision.content,
      excerpt: revision.excerpt || undefined,
    });
  }

  // ========== SEO OPTIMIZATION ==========

  async analyzeSEO(post: BlogPost): Promise<SEOAnalysis> {
    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Meta title checks
    const titleLength = post.metaTitle?.length || 0;
    if (titleLength === 0) {
      issues.push("Meta title is missing");
    } else if (titleLength < 30) {
      warnings.push("Meta title is too short (recommended: 30-60 characters)");
    } else if (titleLength > 60) {
      warnings.push("Meta title is too long (maximum: 60 characters)");
    }
    
    // Meta description checks
    const descLength = post.metaDescription?.length || 0;
    if (descLength === 0) {
      issues.push("Meta description is missing");
    } else if (descLength < 120) {
      warnings.push("Meta description is too short (recommended: 120-160 characters)");
    } else if (descLength > 160) {
      warnings.push("Meta description is too long (maximum: 160 characters)");
    }
    
    // Content analysis
    const content = post.content;
    const headings = this.analyzeHeadings(content);
    
    if (headings.h1 === 0) {
      issues.push("No H1 heading found");
    } else if (headings.h1 > 1) {
      warnings.push("Multiple H1 headings found (should have only one)");
    }
    
    // Image alt text check
    const imageAnalysis = this.analyzeImages(content);
    if (imageAnalysis.missing > 0) {
      warnings.push(`${imageAnalysis.missing} images are missing alt text`);
    }
    
    // Keyword density
    const keywordDensity = this.calculateKeywordDensity(content);
    
    // Readability
    const readabilityScore = this.calculateReadability(content);
    if (readabilityScore < 30) {
      warnings.push("Content readability is poor");
    }
    
    // Reading time
    const estimatedReadingTime = this.calculateReadingTime(content);
    
    // Links analysis
    const links = this.analyzeLinks(content);
    
    if (links.internal < 2) {
      suggestions.push("Add more internal links to improve site navigation");
    }
    
    if (!post.featuredImageUrl) {
      warnings.push("No featured image set");
    }
    
    if (!post.canonicalUrl) {
      issues.push("Canonical URL is not set");
    }
    
    // Calculate overall score
    const score = this.calculateSEOScore({
      issues: issues.length,
      warnings: warnings.length,
      titleLength,
      descLength,
      headings,
      readabilityScore,
      hasImages: imageAnalysis.total > 0,
      hasFeaturedImage: !!post.featuredImageUrl,
    });
    
    return {
      score,
      issues,
      warnings,
      suggestions,
      metaTitleLength: titleLength,
      metaDescriptionLength: descLength,
      headingStructure: headings,
      keywordDensity,
      readabilityScore,
      estimatedReadingTime,
      imageAltTexts: imageAnalysis,
      internalLinks: links.internal,
      externalLinks: links.external,
    };
  }

  generateStructuredData(post: BlogPost, author: any, siteInfo: any): StructuredData {
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription || post.excerpt || "",
      image: post.featuredImageUrl ? [post.featuredImageUrl] : undefined,
      datePublished: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      author: {
        "@type": "Person",
        name: `${author.firstName} ${author.lastName}`,
        url: `/author/${author.id}`,
      },
      publisher: {
        "@type": "Organization",
        name: siteInfo.name || "The Florida Local",
        logo: {
          "@type": "ImageObject",
          url: siteInfo.logo || "/logo.png",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${siteInfo.url}/blog/${post.slug}`,
      },
    };
  }

  generateOpenGraphTags(post: BlogPost, siteInfo: any): Record<string, string> {
    return {
      "og:title": post.metaTitle || post.title,
      "og:description": post.metaDescription || post.excerpt || "",
      "og:type": "article",
      "og:url": `${siteInfo.url}/blog/${post.slug}`,
      "og:image": post.ogImage || post.featuredImageUrl || siteInfo.defaultOgImage,
      "og:site_name": siteInfo.name || "The Florida Local",
      "article:published_time": post.publishedAt?.toISOString() || "",
      "article:modified_time": post.updatedAt.toISOString(),
      "article:author": post.authorId,
    };
  }

  generateTwitterCardTags(post: BlogPost): Record<string, string> {
    return {
      "twitter:card": "summary_large_image",
      "twitter:title": post.metaTitle || post.title,
      "twitter:description": post.metaDescription || post.excerpt || "",
      "twitter:image": post.ogImage || post.featuredImageUrl || "",
    };
  }

  async generateSitemap(baseUrl: string): Promise<string> {
    const posts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt));
    
    const urls = posts.map(post => `
      <url>
        <loc>${baseUrl}/blog/${post.slug}</loc>
        <lastmod>${post.updatedAt.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
    `).join('');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls}
      </urlset>`;
  }

  async generateRSSFeed(baseUrl: string, limit = 20): Promise<string> {
    const posts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);
    
    const items = posts.map(post => `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <description><![CDATA[${post.excerpt || ''}]]></description>
        <link>${baseUrl}/blog/${post.slug}</link>
        <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
        <pubDate>${post.publishedAt?.toUTCString() || ''}</pubDate>
      </item>
    `).join('');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>The Florida Local Blog</title>
          <description>Business insights and local stories from Florida</description>
          <link>${baseUrl}/blog</link>
          <language>en-US</language>
          <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
          ${items}
        </channel>
      </rss>`;
  }

  // ========== HELPER METHODS ==========

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = this.generateSlug(title);
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existing = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, slug))
        .limit(1);
      
      if (existing.length === 0) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }

  private generateMetaTitle(title: string): string {
    if (title.length <= 60) return title;
    return title.substring(0, 57) + '...';
  }

  private generateMetaDescription(content: string): string {
    const stripped = content.replace(/<[^>]*>/g, '').substring(0, 160);
    return stripped.length === 160 ? stripped.substring(0, 157) + '...' : stripped;
  }

  private analyzeHeadings(content: string): { h1: number; h2: number; h3: number } {
    const h1Matches = content.match(/<h1[^>]*>/gi) || [];
    const h2Matches = content.match(/<h2[^>]*>/gi) || [];
    const h3Matches = content.match(/<h3[^>]*>/gi) || [];
    
    return {
      h1: h1Matches.length,
      h2: h2Matches.length,
      h3: h3Matches.length,
    };
  }

  private analyzeImages(content: string): { missing: number; total: number } {
    const imgMatches = content.match(/<img[^>]*>/gi) || [];
    const altMissing = imgMatches.filter(img => !img.includes('alt=')).length;
    
    return {
      missing: altMissing,
      total: imgMatches.length,
    };
  }

  private analyzeLinks(content: string): { internal: number; external: number } {
    const linkMatches = content.match(/<a[^>]*href="([^"]*)"[^>]*>/gi) || [];
    let internal = 0;
    let external = 0;
    
    linkMatches.forEach(link => {
      const href = link.match(/href="([^"]*)"/)?.[1] || '';
      if (href.startsWith('http://') || href.startsWith('https://')) {
        external++;
      } else if (href.startsWith('/')) {
        internal++;
      }
    });
    
    return { internal, external };
  }

  private calculateKeywordDensity(content: string): Map<string, number> {
    const text = content.replace(/<[^>]*>/g, '').toLowerCase();
    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    const wordCount = new Map<string, number>();
    
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    // Convert to density percentage
    const density = new Map<string, number>();
    const totalWords = words.length;
    
    wordCount.forEach((count, word) => {
      if (count > 2) { // Only track words that appear more than twice
        density.set(word, (count / totalWords) * 100);
      }
    });
    
    return density;
  }

  private calculateReadability(content: string): number {
    const text = content.replace(/<[^>]*>/g, '');
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.match(/\b\w+\b/g) || [];
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    // Flesch Reading Ease score
    const score = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
    
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = /[aeiou]/.test(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent e
    if (word.endsWith('e')) {
      count--;
    }
    
    // Ensure at least 1 syllable
    return Math.max(1, count);
  }

  private calculateReadingTime(content: string): number {
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.match(/\b\w+\b/g) || [];
    const wordsPerMinute = 200;
    
    return Math.ceil(words.length / wordsPerMinute);
  }

  private calculateSEOScore(factors: any): number {
    let score = 100;
    
    // Deduct for issues
    score -= factors.issues * 10;
    score -= factors.warnings * 5;
    
    // Title length
    if (factors.titleLength < 30 || factors.titleLength > 60) {
      score -= 5;
    }
    
    // Description length
    if (factors.descLength < 120 || factors.descLength > 160) {
      score -= 5;
    }
    
    // Headings
    if (factors.headings.h1 !== 1) {
      score -= 10;
    }
    
    // Readability
    if (factors.readabilityScore < 30) {
      score -= 10;
    } else if (factors.readabilityScore < 50) {
      score -= 5;
    }
    
    // Images
    if (!factors.hasImages) {
      score -= 5;
    }
    if (!factors.hasFeaturedImage) {
      score -= 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private scheduleAutoSave(postId: string): void {
    // Implementation would use a job queue like Bull or similar
    // For now, this is a placeholder
    console.log(`Auto-save scheduled for post ${postId}`);
  }

  private async sendSubscriptionConfirmation(subscription: BlogSubscription): Promise<void> {
    // Implementation would use email service
    console.log(`Sending confirmation email to ${subscription.email}`);
  }
}

// Export singleton instance
export const blogService = new BlogService();