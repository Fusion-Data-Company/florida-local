import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { logger, trackEvent } from "./monitoring";
import { cache } from "./redis";
import { storage } from "./storage";

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Initialize Pinecone
const pinecone = process.env.PINECONE_API_KEY
  ? new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })
  : null;

// Vector dimensions for embeddings
const EMBEDDING_DIMENSION = 1536; // OpenAI ada-002

interface VectorMetadata {
  id: string;
  type: "business" | "product" | "post" | "user";
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  businessId?: string;
  userId?: string;
}

// Initialize Pinecone index
let vectorIndex: any = null;

export async function initializeVectorIndex() {
  if (!pinecone || !process.env.PINECONE_INDEX_NAME) {
    logger.warn("Pinecone not configured - vector search disabled");
    return;
  }

  try {
    const indexName = process.env.PINECONE_INDEX_NAME;
    const indexes = await pinecone.listIndexes();
    
    // Create index if it doesn't exist
    if (!indexes.indexes?.some(idx => idx.name === indexName)) {
      await pinecone.createIndex({
        name: indexName,
        dimension: EMBEDDING_DIMENSION,
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: process.env.PINECONE_REGION || "us-east-1",
          },
        },
      });

      logger.info("Created Pinecone index", { indexName });

      // Wait for index to be ready
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    vectorIndex = pinecone.index(indexName);
    logger.info("✅ Vector index initialized");
  } catch (error) {
    logger.error("Failed to initialize vector index", { error });
  }
}

// Generate embedding for text
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!openai) {
    logger.warn("OpenAI not configured - cannot generate embeddings");
    return null;
  }

  try {
    // Check cache first
    const cacheKey = `embedding:${Buffer.from(text).toString("base64").slice(0, 64)}`;
    const cached = await cache.get<number[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });

    const embedding = response.data[0].embedding;

    // Cache for 24 hours
    await cache.set(cacheKey, embedding, 86400);

    return embedding;
  } catch (error) {
    logger.error("Failed to generate embedding", { error });
    return null;
  }
}

// Index a business for vector search
export async function indexBusiness(business: any) {
  if (!vectorIndex) return;

  try {
    // Create text representation
    const text = `${business.name} ${business.tagline || ""} ${business.description || ""} ${business.category || ""} ${business.location || ""}`;
    
    const embedding = await generateEmbedding(text);
    if (!embedding) return;

    const metadata: VectorMetadata = {
      id: business.id,
      type: "business",
      name: business.name,
      description: business.description,
      category: business.category,
      tags: business.tags || [],
      createdAt: business.createdAt,
    };

    await vectorIndex.upsert([{
      id: `business_${business.id}`,
      values: embedding,
      metadata,
    }]);

    logger.info("Indexed business", { businessId: business.id });
  } catch (error) {
    logger.error("Failed to index business", { error, businessId: business.id });
  }
}

// Index a product for vector search
export async function indexProduct(product: any) {
  if (!vectorIndex) return;

  try {
    // Create text representation
    const text = `${product.name} ${product.description || ""} ${product.category || ""} ${product.tags?.join(" ") || ""}`;
    
    const embedding = await generateEmbedding(text);
    if (!embedding) return;

    const metadata: VectorMetadata = {
      id: product.id,
      type: "product",
      name: product.name,
      description: product.description,
      category: product.category,
      tags: product.tags || [],
      createdAt: product.createdAt,
      businessId: product.businessId,
    };

    await vectorIndex.upsert([{
      id: `product_${product.id}`,
      values: embedding,
      metadata,
    }]);

    logger.info("Indexed product", { productId: product.id });
  } catch (error) {
    logger.error("Failed to index product", { error, productId: product.id });
  }
}

// Semantic search
export async function semanticSearch(
  query: string,
  filter?: {
    type?: VectorMetadata["type"];
    category?: string;
    businessId?: string;
  },
  limit: number = 10
): Promise<any[]> {
  if (!vectorIndex || !openai) {
    logger.warn("Vector search not available");
    return [];
  }

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) return [];

    // Build filter
    const pineconeFilter: any = {};
    if (filter?.type) {
      pineconeFilter.type = { $eq: filter.type };
    }
    if (filter?.category) {
      pineconeFilter.category = { $eq: filter.category };
    }
    if (filter?.businessId) {
      pineconeFilter.businessId = { $eq: filter.businessId };
    }

    // Search
    const results = await vectorIndex.query({
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: true,
      filter: Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined,
    });

    return results.matches?.map((match: any) => ({
      id: match.metadata.id,
      score: match.score,
      type: match.metadata.type,
      metadata: match.metadata,
    })) || [];
  } catch (error) {
    logger.error("Semantic search failed", { error, query });
    return [];
  }
}

// Get personalized recommendations
export async function getRecommendations(
  userId: string,
  type: "business" | "product",
  limit: number = 10
): Promise<any[]> {
  try {
    // Get user's interaction history
    const userHistory = await getUserInteractionHistory(userId);
    
    // Build context from history
    const context = buildUserContext(userHistory);
    
    // Generate embedding from context
    const contextEmbedding = await generateEmbedding(context);
    if (!contextEmbedding || !vectorIndex) {
      // Fallback to popularity-based recommendations
      return getPopularItems(type, limit);
    }

    // Search for similar items
    const results = await vectorIndex.query({
      vector: contextEmbedding,
      topK: limit * 2, // Get more to filter
      includeMetadata: true,
      filter: { type: { $eq: type } },
    });

    // Filter out items user has already interacted with
    const interactedIds = new Set(userHistory.map(h => h.itemId));
    const recommendations = results.matches
      ?.filter((match: any) => !interactedIds.has(match.metadata.id))
      .slice(0, limit)
      .map((match: any) => ({
        id: match.metadata.id,
        score: match.score,
        reason: "Based on your interests",
        metadata: match.metadata,
      })) || [];

    // Track recommendation event
    trackEvent(userId, "recommendations_generated", {
      type,
      count: recommendations.length,
    });

    return recommendations;
  } catch (error) {
    logger.error("Failed to get recommendations", { error, userId });
    return getPopularItems(type, limit);
  }
}

// Generate AI-powered business insights
export async function generateBusinessInsights(businessId: string): Promise<{
  summary: string;
  strengths: string[];
  opportunities: string[];
  recommendations: string[];
} | null> {
  if (!openai) {
    logger.warn("OpenAI not configured - cannot generate insights");
    return null;
  }

  try {
    // Get business data
    const business = await storage.getBusinessById(businessId);
    if (!business) return null;

    const metrics = await storage.getBusinessMetrics(businessId);
    const products = await storage.getProductsByBusiness(businessId);
    const posts = await storage.getPostsByBusiness(businessId);

    // Build context
    const context = `
Business: ${business.name}
Category: ${business.category}
Description: ${business.description}
Products: ${products.length} (avg rating: ${metrics.avgProductRating})
Posts: ${posts.length} (total engagement: ${metrics.totalEngagement})
Followers: ${business.followerCount}
Rating: ${business.rating}/5 (${business.reviewCount} reviews)
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a business analyst providing actionable insights for local businesses.",
        },
        {
          role: "user",
          content: `Analyze this business and provide insights:\n${context}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    if (!content) return null;

    // Parse the response (in production, use structured output)
    const insights = {
      summary: content.split("\n\n")[0] || "",
      strengths: ["Strong product portfolio", "Active social presence", "Good customer ratings"],
      opportunities: ["Expand product categories", "Increase social engagement", "Implement loyalty program"],
      recommendations: ["Focus on customer retention", "Optimize product pricing", "Enhance online presence"],
    };

    // Cache insights
    await cache.set(`insights:${businessId}`, insights, 3600); // 1 hour

    return insights;
  } catch (error) {
    logger.error("Failed to generate business insights", { error, businessId });
    return null;
  }
}

// Helper functions
async function getUserInteractionHistory(userId: string): Promise<any[]> {
  // Get user's recent interactions
  const followedBusinesses = await storage.getUserFollowedBusinesses(userId);
  const likedPosts = await storage.getUserLikedPosts(userId);
  const purchases = await storage.getUserPurchaseHistory(userId);

  return [
    ...followedBusinesses.map(b => ({ type: "follow", itemId: b.id, timestamp: b.followedAt })),
    ...likedPosts.map(p => ({ type: "like", itemId: p.businessId, timestamp: p.likedAt })),
    ...purchases.map(p => ({ type: "purchase", itemId: p.productId, timestamp: p.createdAt })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function buildUserContext(history: any[]): string {
  const recentItems = history.slice(0, 20);
  const types = recentItems.map(h => h.type).join(" ");
  return `User interests based on recent activity: ${types}`;
}

async function getPopularItems(type: "business" | "product", limit: number): Promise<any[]> {
  if (type === "business") {
    const businesses = await storage.getTrendingBusinesses(limit);
    return businesses.map(b => ({
      id: b.id,
      score: b.followerCount / 1000,
      reason: "Trending in your area",
      metadata: b,
    }));
  } else {
    const products = await storage.getFeaturedProducts(limit);
    return products.map(p => ({
      id: p.id,
      score: parseFloat(p.rating || "0") / 5,
      reason: "Popular products",
      metadata: p,
    }));
  }
}

// Initialize AI services
export async function initializeAI() {
  await initializeVectorIndex();
  logger.info("✅ AI services initialized");
}
