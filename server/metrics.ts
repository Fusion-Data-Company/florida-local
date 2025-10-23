import { register, collectDefaultMetrics, Counter, Histogram, Gauge, Summary } from "prom-client";
import { Express, Request, Response } from "express";
import { logger } from "./monitoring";

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const httpRequestErrors = new Counter({
  name: "http_request_errors_total",
  help: "Total number of HTTP request errors",
  labelNames: ["method", "route", "status"],
});

// Business metrics
export const ordersCreated = new Counter({
  name: "orders_created_total",
  help: "Total number of orders created",
  labelNames: ["payment_method", "status"],
});

export const orderValue = new Histogram({
  name: "order_value_dollars",
  help: "Order value in dollars",
  buckets: [10, 25, 50, 100, 250, 500, 1000],
});

export const paymentAttempts = new Counter({
  name: "payment_attempts_total",
  help: "Total number of payment attempts",
  labelNames: ["provider", "status"],
});

export const paymentFailures = new Counter({
  name: "payment_failures_total",
  help: "Total number of payment failures",
  labelNames: ["provider", "reason"],
});

export const activeUsers = new Gauge({
  name: "active_users",
  help: "Number of active users",
  labelNames: ["type"],
});

export const businessSignups = new Counter({
  name: "business_signups_total",
  help: "Total number of business signups",
  labelNames: ["category"],
});

// WebSocket metrics
export const websocketConnections = new Gauge({
  name: "websocket_connections",
  help: "Number of active WebSocket connections",
});

export const websocketMessages = new Counter({
  name: "websocket_messages_total",
  help: "Total number of WebSocket messages",
  labelNames: ["type", "direction"],
});

// Cache metrics
export const cacheHits = new Counter({
  name: "cache_hits_total",
  help: "Total number of cache hits",
  labelNames: ["cache_type"],
});

export const cacheMisses = new Counter({
  name: "cache_misses_total",
  help: "Total number of cache misses",
  labelNames: ["cache_type"],
});

// Queue metrics
export const queueJobsProcessed = new Counter({
  name: "queue_jobs_processed_total",
  help: "Total number of queue jobs processed",
  labelNames: ["queue", "status"],
});

export const queueJobDuration = new Histogram({
  name: "queue_job_duration_seconds",
  help: "Duration of queue job processing",
  labelNames: ["queue"],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
});

export const queueSize = new Gauge({
  name: "queue_size",
  help: "Current queue size",
  labelNames: ["queue", "status"],
});

// AI metrics
export const aiRequests = new Counter({
  name: "ai_requests_total",
  help: "Total number of AI requests",
  labelNames: ["model", "operation"],
});

export const aiRequestDuration = new Histogram({
  name: "ai_request_duration_seconds",
  help: "Duration of AI requests",
  labelNames: ["model", "operation"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

// Middleware to track HTTP metrics
export function metricsMiddleware(req: Request, res: Response, next: any) {
  const start = Date.now();
  
  // Track request
  const route = req.route?.path || req.path;
  const method = req.method;

  // Track response
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const status = res.statusCode.toString();

    httpRequestsTotal.labels(method, route, status).inc();
    httpRequestDuration.labels(method, route, status).observe(duration);

    if (res.statusCode >= 400) {
      httpRequestErrors.labels(method, route, status).inc();
    }
  });

  next();
}

// Set up metrics endpoint
export function setupMetrics(app: Express) {
  // Add metrics middleware
  app.use(metricsMiddleware);

  // Metrics endpoint
  app.get("/metrics", async (req, res) => {
    try {
      res.set("Content-Type", register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);
    } catch (error) {
      logger.error("Error generating metrics", { error });
      res.status(500).end();
    }
  });

  logger.info("✅ Metrics endpoint available at /metrics");
}

// Helper to track business events
export function trackBusinessEvent(event: string, labels: Record<string, string> = {}) {
  switch (event) {
    case "order_created":
      ordersCreated.labels(labels.payment_method || "unknown", labels.status || "pending").inc();
      if (labels.value) {
        orderValue.observe(parseFloat(labels.value));
      }
      break;
    
    case "payment_attempt":
      paymentAttempts.labels(labels.provider || "unknown", labels.status || "unknown").inc();
      break;
    
    case "payment_failure":
      paymentFailures.labels(labels.provider || "unknown", labels.reason || "unknown").inc();
      break;
    
    case "business_signup":
      businessSignups.labels(labels.category || "unknown").inc();
      break;
    
    case "websocket_connect":
      websocketConnections.inc();
      break;
    
    case "websocket_disconnect":
      websocketConnections.dec();
      break;
    
    case "websocket_message":
      websocketMessages.labels(labels.type || "unknown", labels.direction || "unknown").inc();
      break;
    
    case "cache_hit":
      cacheHits.labels(labels.cache_type || "unknown").inc();
      break;
    
    case "cache_miss":
      cacheMisses.labels(labels.cache_type || "unknown").inc();
      break;
    
    case "queue_job_processed":
      queueJobsProcessed.labels(labels.queue || "unknown", labels.status || "unknown").inc();
      if (labels.duration) {
        queueJobDuration.labels(labels.queue || "unknown").observe(parseFloat(labels.duration));
      }
      break;
    
    case "ai_request":
      aiRequests.labels(labels.model || "unknown", labels.operation || "unknown").inc();
      if (labels.duration) {
        aiRequestDuration.labels(labels.model || "unknown", labels.operation || "unknown").observe(parseFloat(labels.duration));
      }
      break;
  }
}

// Update gauge metrics periodically
export async function updateGaugeMetrics() {
  // Update active users - wrapped in try-catch to prevent cascade failures
  try {
    const { getOnlineUsersCount, io } = await import("./websocket");
    // Check if WebSocket is initialized before getting count
    if (io) {
      const onlineUsers = await getOnlineUsersCount();
      activeUsers.labels("online").set(onlineUsers);
    }
  } catch (error) {
    logger.debug("Could not update active users metric", { error: error instanceof Error ? error.message : error });
  }

  // Update queue sizes - wrapped in try-catch to prevent cascade failures
  try {
    const { getQueues, isRedisAvailable } = await import("./redis");
    
    // Check if Redis is available before attempting queue operations
    if (!isRedisAvailable()) {
      logger.debug("Skipping queue metrics: Redis not available");
      return;
    }

    // Get initialized queues (not the null exports)
    const { emailQueue, imageQueue } = getQueues();
    
    // Update email queue metrics if queue exists
    if (emailQueue) {
      try {
        const emailQueueCounts = await emailQueue.getJobCounts();
        queueSize.labels("email", "waiting").set(emailQueueCounts.waiting || 0);
        queueSize.labels("email", "active").set(emailQueueCounts.active || 0);
        queueSize.labels("email", "completed").set(emailQueueCounts.completed || 0);
        queueSize.labels("email", "failed").set(emailQueueCounts.failed || 0);
      } catch (error) {
        logger.debug("Could not update email queue metrics", { error: error instanceof Error ? error.message : error });
      }
    }
    
    // Update image queue metrics if queue exists
    if (imageQueue) {
      try {
        const imageQueueCounts = await imageQueue.getJobCounts();
        queueSize.labels("image", "waiting").set(imageQueueCounts.waiting || 0);
        queueSize.labels("image", "active").set(imageQueueCounts.active || 0);
        queueSize.labels("image", "completed").set(imageQueueCounts.completed || 0);
        queueSize.labels("image", "failed").set(imageQueueCounts.failed || 0);
      } catch (error) {
        logger.debug("Could not update image queue metrics", { error: error instanceof Error ? error.message : error });
      }
    }
  } catch (error) {
    logger.debug("Could not update queue metrics", { error: error instanceof Error ? error.message : error });
  }
}

// Start periodic gauge updates
setInterval(updateGaugeMetrics, 30000); // Every 30 seconds
