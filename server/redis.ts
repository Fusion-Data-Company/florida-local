import Redis from "ioredis";
import { Queue, Worker, QueueEvents } from "bullmq";
import memorystore from "memorystore";

// Track Redis availability to prevent spam
let redisConnected = false;
let lastErrorLogged = 0;
const ERROR_LOG_INTERVAL = 60000; // Only log errors every 60 seconds

// Redis connection configuration for general use
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  lazyConnect: true, // Don't connect immediately
  retryStrategy: (times: number) => {
    // Fail fast if Redis is consistently unavailable
    if (times > 10) {
      return null; // Stop retrying
    }
    const delay = Math.min(times * 200, 5000); // Slower retry
    return delay;
  },
  reconnectOnError: (err: Error) => {
    // Only reconnect for specific errors
    const targetError = err.message.includes('READONLY');
    return targetError;
  },
};

// Redis configuration for BullMQ (requires maxRetriesPerRequest to be null)
const bullmqRedisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: (times: number) => {
    if (times > 10) {
      return null;
    }
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
  reconnectOnError: (err: Error) => {
    const targetError = err.message.includes('READONLY');
    return targetError;
  },
};

// Helper function to log errors with throttling
function logRedisError(error: Error, context: string) {
  const now = Date.now();
  if (now - lastErrorLogged > ERROR_LOG_INTERVAL) {
    console.error(`❌ Redis ${context} error:`, error.message);
    lastErrorLogged = now;
  }
}

// Create Redis clients
export const redis = new Redis(redisConfig);
export const redisSubscriber = new Redis(redisConfig);

// BullMQ connection
export const queueConnection = new Redis(bullmqRedisConfig);

// Add error handlers to prevent unhandled error events
redis.on('error', (err) => {
  redisConnected = false;
  logRedisError(err, 'main');
});

redisSubscriber.on('error', (err) => {
  logRedisError(err, 'subscriber');
});

queueConnection.on('error', (err) => {
  logRedisError(err, 'queue');
});

// Track connection status
redis.on('connect', () => {
  redisConnected = true;
  console.log('✅ Redis connected');
});

redis.on('close', () => {
  redisConnected = false;
});

// Safe queue creation - only create if Redis is intended to be used
let emailQueue: Queue | null = null;
let imageQueue: Queue | null = null;
let syncQueue: Queue | null = null;
let analyticsQueue: Queue | null = null;
let notificationQueue: Queue | null = null;
let emailQueueEvents: QueueEvents | null = null;
let imageQueueEvents: QueueEvents | null = null;

// Initialize queues lazily
export function getQueues() {
  if (!emailQueue) {
    try {
      emailQueue = new Queue("email", { connection: queueConnection });
      imageQueue = new Queue("image-processing", { connection: queueConnection });
      syncQueue = new Queue("data-sync", { connection: queueConnection });
      analyticsQueue = new Queue("analytics", { connection: queueConnection });
      notificationQueue = new Queue("notifications", { connection: queueConnection });
      emailQueueEvents = new QueueEvents("email", { connection: queueConnection });
      imageQueueEvents = new QueueEvents("image-processing", { connection: queueConnection });
    } catch (error) {
      logRedisError(error as Error, 'queue initialization');
    }
  }
  
  return {
    emailQueue,
    imageQueue,
    syncQueue,
    analyticsQueue,
    notificationQueue,
    emailQueueEvents,
    imageQueueEvents
  };
}

// Export getters for backward compatibility
export { emailQueue, imageQueue, syncQueue, analyticsQueue, notificationQueue, emailQueueEvents, imageQueueEvents };

// Redis health check with graceful handling
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    const isConnected = pong === "PONG";
    if (isConnected && !redisConnected) {
      redisConnected = true;
      console.log('✅ Redis reconnected');
    }
    return isConnected;
  } catch (error) {
    if (redisConnected) {
      logRedisError(error as Error, 'health check');
      redisConnected = false;
    }
    return false;
  }
}

// Check if Redis is available
export function isRedisAvailable(): boolean {
  return redisConnected;
}

// Cache helpers with graceful Redis handling
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redisConnected) return null;
    
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logRedisError(error as Error, `cache get [${key}]`);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!redisConnected) return;
    
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      logRedisError(error as Error, `cache set [${key}]`);
    }
  },

  async delete(key: string): Promise<void> {
    if (!redisConnected) return;
    
    try {
      await redis.del(key);
    } catch (error) {
      logRedisError(error as Error, `cache delete [${key}]`);
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    if (!redisConnected) return;
    
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logRedisError(error as Error, `cache invalidate [${pattern}]`);
    }
  },
};

// Session store helper with fallback
export async function createRedisStore(session: any) {
  const MemoryStore = memorystore(session);
  
  // Use memory store if Redis is not available
  if (!redisConnected) {
    console.log('⚠️  Using memory store for sessions (Redis unavailable)');
    return new MemoryStore({
      checkPeriod: 86400000, // 1 day
    });
  }
  
  try {
    // For connect-redis v7+, we need to handle the import carefully
    // The module might export differently in production vs development
    const connectRedisModule = await import("connect-redis");
    
    // Try different export patterns to handle various versions and build tools
    let RedisStore: any;
    
    // Pattern 1: Named export (most common for v7+)
    if ('RedisStore' in connectRedisModule) {
      RedisStore = connectRedisModule.RedisStore;
    }
    // Pattern 2: Default export that's a factory function
    else if ((connectRedisModule as any).default) {
      RedisStore = (connectRedisModule as any).default;
    }
    // Pattern 3: Module itself is the store/factory
    else if (typeof connectRedisModule === 'function') {
      RedisStore = connectRedisModule;
    }
    // Pattern 4: Direct module export
    else {
      RedisStore = connectRedisModule;
    }
    
    // Now try to create the store
    if (typeof RedisStore === 'function') {
      // Check if it's a factory function or a constructor
      const testInstance = RedisStore.prototype;
      
      if (testInstance && testInstance.constructor) {
        // It's a constructor, instantiate directly
        return new RedisStore({
          client: redis,
          prefix: "sess:",
          ttl: 86400, // 1 day
        });
      } else {
        // It's a factory function, call it with session first
        const Store = RedisStore(session);
        return new Store({
          client: redis,
          prefix: "sess:",
          ttl: 86400, // 1 day
        });
      }
    }
    
    // If we couldn't figure out how to use it, fall back
    throw new Error('Could not determine connect-redis usage pattern');
    
  } catch (error) {
    // If Redis store fails for any reason, fall back to memory store
    console.warn('⚠️  Could not initialize Redis store, using memory store instead:', error);
    return new MemoryStore({
      checkPeriod: 86400000, // 1 day
    });
  }
}

// Graceful startup - try to connect but don't block the app
async function initializeRedis() {
  try {
    await redis.connect();
  } catch (error) {
    logRedisError(error as Error, 'initial connection');
  }
}

// Initialize without blocking
initializeRedis();

// Graceful shutdown
export async function closeRedisConnections() {
  try {
    if (redisConnected) {
      await redis.quit();
      await redisSubscriber.quit();
      await queueConnection.quit();
      console.log("Redis connections closed");
    }
  } catch (error) {
    logRedisError(error as Error, 'shutdown');
  }
}
