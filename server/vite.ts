import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // CRITICAL: Block service worker in development to prevent caching issues
  app.get('/sw.js', (req, res) => {
    res.status(404).type('text/javascript').send('// Service worker disabled in development');
    log('Blocked service worker request in development mode');
  });

  // Serve Videos folder statically in development
  const videosPath = path.resolve(import.meta.dirname, "..", "client", "public", "Videos");
  if (fs.existsSync(videosPath)) {
    app.use('/Videos', express.static(videosPath));
    log(`📹 Serving videos from: ${videosPath}`, 'videos');
  }

  // Serve attached_assets folder statically in development
  const assetsPath = path.resolve(import.meta.dirname, "..", "client", "public", "attached_assets");
  if (fs.existsSync(assetsPath)) {
    app.use('/attached_assets', express.static(assetsPath));
    log(`📎 Serving attached assets from: ${assetsPath}`, 'assets');
  }

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API and auth routes - let them be handled by Express routes
    if (url.startsWith('/api/') || url.startsWith('/auth/') || url.startsWith('/metrics')) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  log(`📁 Serving static files from: ${distPath}`, 'static');

  // CRITICAL: Serve Videos folder with proper MIME types in production
  const videosPath = path.join(distPath, 'Videos');
  if (fs.existsSync(videosPath)) {
    app.use('/Videos', express.static(videosPath, {
      maxAge: '1y', // Cache videos for 1 year
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.mov')) {
          res.setHeader('Content-Type', 'video/quicktime');
        } else if (filePath.endsWith('.mp4')) {
          res.setHeader('Content-Type', 'video/mp4');
        } else if (filePath.endsWith('.webm')) {
          res.setHeader('Content-Type', 'video/webm');
        }
      }
    }));
    log(`📹 Serving videos from: ${videosPath}`, 'videos');

    // Log available video files
    const videoFiles = fs.readdirSync(videosPath).filter(f =>
      /\.(mov|mp4|webm|avi)$/i.test(f)
    );
    log(`   Found ${videoFiles.length} video files: ${videoFiles.join(', ')}`, 'videos');
  } else {
    log(`⚠️  Videos folder not found at: ${videosPath}`, 'videos');
  }

  app.use((req, res, next) => {
    const url = req.originalUrl;

    if (url.startsWith('/api/') || url.startsWith('/auth/') || url.startsWith('/metrics')) {
      log(`⚡ Skipping static serving for: ${url}`, 'static');
      return next();
    }

    log(`📄 Checking static file: ${url}`, 'static');
    next();
  });

  app.use(express.static(distPath));

  app.use("*", (req, res, next) => {
    const url = req.originalUrl;

    if (url.startsWith('/api/') || url.startsWith('/auth/') || url.startsWith('/metrics')) {
      log(`⚡ Skipping index.html fallback for: ${url}`, 'static');
      return next();
    }

    log(`🏠 Serving index.html for: ${url}`, 'static');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
