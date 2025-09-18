import Redis from "ioredis";
import { Queue, Worker, QueueEvents } from "bullmq";

// Redis connection configuration for general use
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Redis configuration for BullMQ (requires maxRetriesPerRequest to be null)
const bullmqRedisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Create Redis clients
export const redis = new Redis(redisConfig);
export const redisSubscriber = new Redis(redisConfig);

// BullMQ connection
export const queueConnection = new Redis(bullmqRedisConfig);

// Job Queues
export const emailQueue = new Queue("email", { connection: queueConnection });
export const imageQueue = new Queue("image-processing", { connection: queueConnection });
export const syncQueue = new Queue("data-sync", { connection: queueConnection });
export const analyticsQueue = new Queue("analytics", { connection: queueConnection });
export const notificationQueue = new Queue("notifications", { connection: queueConnection });

// Queue Events for monitoring
export const emailQueueEvents = new QueueEvents("email", { connection: queueConnection });
export const imageQueueEvents = new QueueEvents("image-processing", { connection: queueConnection });

// Redis health check
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === "PONG";
  } catch (error) {
    console.error("Redis connection failed:", error);
    return false;
  }
}

// Cache helpers
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache invalidate pattern error for ${pattern}:`, error);
    }
  },
};

// Session store helper
export function createRedisStore(session: any) {
  const RedisStore = require("connect-redis").default;
  return new RedisStore({
    client: redis,
    prefix: "sess:",
    ttl: 86400, // 1 day
  });
}

// Initialize Redis connection
redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

// Graceful shutdown
export async function closeRedisConnections() {
  await redis.quit();
  await redisSubscriber.quit();
  await queueConnection.quit();
  console.log("Redis connections closed");
}
