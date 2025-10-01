import crypto from "crypto";
import { redis, cache } from "./redis";
import { logger } from "./monitoring";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { ApiKey } from "@shared/schema";

interface ApiKeyWithRateLimit extends Omit<ApiKey, 'rateLimit'> {
  rateLimit?: {
    requests: number;
    window: number;
  };
}

// Generate a secure API key
export function generateApiKey(): string {
  const prefix = "flel"; // The Florida Local
  const randomBytes = crypto.randomBytes(32).toString("base64url");
  return `${prefix}_${randomBytes}`;
}

// Hash API key for storage
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

// Store API key
export async function createApiKey(
  businessId: string,
  userId: string,
  name: string,
  permissions: string[] = ["read"],
  expiresInDays?: number
): Promise<{ key: string; apiKey: ApiKey }> {
  const key = generateApiKey();
  const hashedKey = hashApiKey(key);
  
  const apiKeyData = {
    keyHash: hashedKey,
    name,
    businessId,
    userId,
    permissions: permissions as any,
    expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : undefined,
    isActive: true,
  };

  // Store in database
  const apiKey = await storage.createApiKey(apiKeyData);
  
  // Cache for quick lookup
  await cache.set(`apikey:${hashedKey}`, apiKey, 3600); // 1 hour cache
  
  logger.info("API key created", {
    businessId,
    userId,
    name,
    permissions,
  });

  return { key, apiKey };
}

// Validate API key
export async function validateApiKey(key: string): Promise<ApiKey | null> {
  const hashedKey = hashApiKey(key);
  
  // Check cache first
  let apiKey: ApiKey | null = await cache.get<ApiKey>(`apikey:${hashedKey}`);
  
  if (!apiKey) {
    // Fetch from database
    const dbKey = await storage.getApiKeyByHash(hashedKey);
    
    if (!dbKey) {
      return null;
    }
    
    apiKey = dbKey;
    
    // Cache it for future lookups
    await cache.set(`apikey:${hashedKey}`, apiKey, 3600); // 1 hour cache
  }
  
  // Check if expired
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    logger.warn("Expired API key used", { keyId: apiKey.id });
    return null;
  }
  
  // Check if active
  if (!apiKey.isActive) {
    logger.warn("Inactive API key used", { keyId: apiKey.id });
    return null;
  }
  
  // Update last used (fire and forget)
  updateLastUsed(apiKey.id).catch(err => 
    logger.error("Failed to update API key last used", { error: err })
  );
  
  return apiKey;
}

// Update last used timestamp
async function updateLastUsed(keyId: string): Promise<void> {
  await storage.updateApiKeyLastUsed(keyId);
}

// API Key authentication middleware
export function apiKeyAuth(requiredPermissions: string[] = []) {
  return async (req: Request & { apiKey?: ApiKey }, res: Response, next: NextFunction) => {
    const apiKey = req.headers["x-api-key"] as string;
    
    if (!apiKey) {
      return res.status(401).json({ error: "API key required" });
    }
    
    const validatedKey = await validateApiKey(apiKey);
    
    if (!validatedKey) {
      return res.status(401).json({ error: "Invalid API key" });
    }
    
    // Check permissions - handle jsonb permissions field
    const permissions = Array.isArray(validatedKey.permissions) 
      ? validatedKey.permissions as string[]
      : [];
    
    const hasAllPermissions = requiredPermissions.every(perm => 
      permissions.includes(perm)
    );
    
    if (!hasAllPermissions) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        required: requiredPermissions,
        provided: permissions,
      });
    }
    
    // Check rate limit if defined - handle jsonb rateLimit field
    const rateLimit = validatedKey.rateLimit as { requests: number; window: number } | null;
    if (rateLimit && typeof rateLimit === 'object' && 'requests' in rateLimit && 'window' in rateLimit) {
      const rateLimitKey = `ratelimit:apikey:${validatedKey.id}`;
      const current = await redis.incr(rateLimitKey);
      
      if (current === 1) {
        await redis.expire(rateLimitKey, rateLimit.window);
      }
      
      if (current > rateLimit.requests) {
        return res.status(429).json({ 
          error: "Rate limit exceeded",
          limit: rateLimit.requests,
          window: rateLimit.window,
        });
      }
    }
    
    // Attach to request
    req.apiKey = validatedKey;
    next();
  };
}

// Webhook signature verification
export function createWebhookSignature(
  payload: string | Buffer,
  secret: string,
  timestamp: number
): string {
  const message = `${timestamp}.${payload}`;
  return crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
  timestamp: number,
  tolerance: number = 300 // 5 minutes
): boolean {
  // Check timestamp to prevent replay attacks
  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime - timestamp > tolerance) {
    return false;
  }
  
  const expectedSignature = createWebhookSignature(payload, secret, timestamp);
  
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Webhook verification middleware
export function webhookAuth(getSecret: (req: Request) => string | Promise<string>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers["x-webhook-signature"] as string;
    const timestamp = parseInt(req.headers["x-webhook-timestamp"] as string);
    
    if (!signature || !timestamp) {
      return res.status(401).json({ error: "Missing webhook signature or timestamp" });
    }
    
    const secret = await getSecret(req);
    const payload = JSON.stringify(req.body);
    
    if (!verifyWebhookSignature(payload, signature, secret, timestamp)) {
      logger.warn("Invalid webhook signature", {
        path: req.path,
        ip: req.ip,
      });
      return res.status(401).json({ error: "Invalid webhook signature" });
    }
    
    next();
  };
}

// Generate webhook secret
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString("base64url")}`;
}
