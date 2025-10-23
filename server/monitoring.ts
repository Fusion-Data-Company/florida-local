import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { PostHog } from "posthog-node";
import winston from "winston";
import { Express } from "express";

// Initialize Sentry
export function initSentry(app: Express) {
  if (!process.env.SENTRY_DSN) {
    console.log("⚠️ Sentry DSN not configured - error tracking disabled");
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      // Enable HTTP calls tracing
      Sentry.httpIntegration(),
      // Enable Express.js middleware tracing
      Sentry.expressIntegration(),
      // Enable profiling
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    environment: process.env.NODE_ENV || "development",
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.authorization;
      }
      return event;
    },
  });

  // Note: Sentry middleware setup handled by expressIntegration() above
  console.log("✅ Sentry initialized");
}

// Initialize PostHog
let posthog: PostHog | null = null;

export function initPostHog() {
  if (!process.env.POSTHOG_KEY) {
    console.log("⚠️ PostHog key not configured - analytics disabled");
    return;
  }

  posthog = new PostHog(process.env.POSTHOG_KEY, {
    host: process.env.POSTHOG_HOST || "https://app.posthog.com",
    flushAt: 20,
    flushInterval: 10000,
  });

  console.log("✅ PostHog initialized");
}

// Get PostHog client
export function getPostHog(): PostHog | null {
  return posthog;
}

// Track event helper
export function trackEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>
) {
  if (posthog) {
    posthog.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
    });
  }
}

// Initialize Winston logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: "florida-elite",
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console transport with colorized output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === "production") {
  logger.add(
    new winston.transports.File({ 
      filename: "logs/error.log", 
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  logger.add(
    new winston.transports.File({ 
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Request logging middleware
export function requestLogger(req: any, res: any, next: any) {
  const start = Date.now();
  
  // Log request
  logger.info("Request", {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    userId: req.user?.claims?.sub,
  });

  // Log response
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = Date.now() - start;
    
    logger.info("Response", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.claims?.sub,
    });

    // Track API performance in PostHog
    trackEvent(req.user?.claims?.sub || "anonymous", "api_request", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });

    return originalSend.call(this, data);
  };

  next();
}

// Error tracking middleware (must be after routes)
export function setupErrorHandling(app: Express) {
  app.use(Sentry.expressErrorHandler({
    shouldHandleError(error: any) {
      // Capture 4xx and 5xx errors
      if (error.status && error.status >= 400) {
        return true;
      }
      return true;
    },
  }));

  // Final error handler
  app.use((err: any, req: any, res: any, next: any) => {
    logger.error("Unhandled error", {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: req.user?.claims?.sub,
    });

    res.status(err.status || 500).json({
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  });
}

// Graceful shutdown
export async function shutdownMonitoring() {
  if (posthog) {
    await posthog.shutdown();
  }
  await Sentry.close(2000);
}
