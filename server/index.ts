import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import fs from "fs";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { checkRedisConnection } from "./redis";
import { initSentry, initPostHog, requestLogger, setupErrorHandling, logger } from "./monitoring";

/**
 * Ensures static assets are in the correct location for production deployment.
 * Production builds create client/dist/, but serveStatic expects dist/public/.
 * This function copies client/dist/ to dist/public/ if needed.
 */
function ensureStaticAssets(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) return;

  const distPublic = path.resolve(process.cwd(), 'dist/public');
  const clientDist = path.resolve(process.cwd(), 'client/dist');

  // If dist/public already exists and has index.html, we're good
  if (fs.existsSync(path.join(distPublic, 'index.html'))) {
    logger.info('✅ Static assets found in dist/public/');
    return;
  }

  // Check if client/dist exists (output from vite build)
  if (!fs.existsSync(clientDist)) {
    const error = `❌ Client build not found at ${clientDist}. Run 'npm run build' first.`;
    logger.error(error);
    throw new Error(error);
  }

  // Create dist/public and copy files
  logger.info('📋 Copying client build to dist/public/ for production deployment...');
  
  // Remove dist/public if it exists but is incomplete
  if (fs.existsSync(distPublic)) {
    fs.rmSync(distPublic, { recursive: true, force: true });
  }
  
  // Create dist/public directory
  fs.mkdirSync(distPublic, { recursive: true });
  
  // Copy all files from client/dist to dist/public
  fs.cpSync(clientDist, distPublic, { recursive: true });
  
  // Verify the copy succeeded
  if (!fs.existsSync(path.join(distPublic, 'index.html'))) {
    const error = `❌ Failed to copy client build to ${distPublic}`;
    logger.error(error);
    throw new Error(error);
  }
  
  logger.info('✅ Client build successfully copied to dist/public/');
  logger.info(`📁 Static assets ready at: ${distPublic}`);
}

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

// CRITICAL: Start server immediately in async IIFE
(async () => {
  try {
    // CRITICAL: Ultra-fast health check for deployment - returns 200 instantly
    // Define BEFORE any expensive operations
    app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({ status: 'ok' });
    });

    // Setup metrics first
    const { setupMetrics } = await import("./metrics");
    setupMetrics(app);
    
    // Register routes - this creates and returns the HTTP server with WebSockets
    const server = await registerRoutes(app);
    
    // Setup error handling after all routes
    setupErrorHandling(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // Setup vite in development or serve static files in production
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      // PRODUCTION: Prepare static assets before serving
      try {
        ensureStaticAssets();
        serveStatic(app);
        logger.info('✅ Production static file serving initialized');
      } catch (assetError) {
        logger.error('❌ Failed to initialize static file serving:', assetError);
        logger.warn('⚠️  Static files unavailable. API routes will still work.');
        
        // Serve a fallback response for non-API routes
        app.use("*", (req: Request, res: Response) => {
          if (req.path.startsWith('/api/') || req.path.startsWith('/auth/') || req.path.startsWith('/metrics')) {
            return res.status(404).json({ error: 'Not found' });
          }
          res.status(503).send(`
            <!DOCTYPE html>
            <html><head><title>Service Initializing</title></head><body>
              <h1>Application Starting</h1>
              <p>The application is initializing. Please refresh in a moment.</p>
              <script>setTimeout(() => location.reload(), 5000);</script>
            </body></html>
          `);
        });
      }
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    logger.error('Fatal error during server startup:', error);
    process.exit(1);
  }
})();
