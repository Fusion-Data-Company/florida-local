import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { checkRedisConnection } from "./redis";
import { initSentry, initPostHog, requestLogger, setupErrorHandling, logger } from "./monitoring";

const app = express();

// Initialize monitoring early
initSentry(app);
initPostHog();

// CRITICAL: Validate REPLIT_DOMAINS in production
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.REPLIT_DOMAINS) {
  logger.error('CRITICAL: REPLIT_DOMAINS environment variable is not set in production. This is required for CORS security.');
  throw new Error('REPLIT_DOMAINS must be set in production environment. Cannot start server without proper CORS configuration.');
}

// SECURITY: Split Helmet configuration for development vs production
// Production: Strict CSP without unsafe-inline for scripts
// Development: Allow unsafe-inline for Vite hot module replacement
const helmetConfig = isProduction ? {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"], // PRODUCTION: No unsafe-inline
      connectSrc: ["'self'", "wss:", "ws:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
} : {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // DEVELOPMENT: Allow unsafe-inline for Vite
      connectSrc: ["'self'", "wss:", "ws:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
};

app.use(helmet(helmetConfig));

// SECURITY: CORS configuration with production validation
const corsOrigins = isProduction 
  ? process.env.REPLIT_DOMAINS!.split(',').map(d => `https://${d.trim()}`)
  : true; // Allow all origins in development

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Use structured request logging
app.use(requestLogger);

(async () => {
  // Setup metrics
  const { setupMetrics } = await import("./metrics");
  setupMetrics(app);
  
  const server = await registerRoutes(app);
  
  // Setup error handling after all routes
  setupErrorHandling(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
