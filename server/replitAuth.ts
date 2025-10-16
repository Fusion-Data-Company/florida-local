import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import memorystore from "memorystore";
import { storage } from "./storage";
import { createRedisStore, redis, isRedisAvailable, checkRedisConnection } from "./redis";
import { getDatabaseStatus, testDatabaseConnection } from "./db";
import { randomBytes } from "crypto";

const MemoryStore = memorystore(session);

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export async function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60; // 1 week in seconds
  const sessionTtlMs = sessionTtl * 1000; // 1 week in milliseconds
  
  // Use Redis store if available, otherwise fall back to PostgreSQL
  let sessionStore: any;
  
  // Check if Redis is available and working (test connection first)
  const redisAvailable = await checkRedisConnection().catch(() => false);
  const dbStatus = getDatabaseStatus();
  
  if (redisAvailable) {
    console.log("✅ Using Redis for session storage");
    try {
      sessionStore = await createRedisStore(session);
    } catch (error) {
      console.error("❌ Failed to create Redis session store:", error);
      sessionStore = null;
    }
  }
  
  // If Redis store creation failed or Redis isn't available, use PostgreSQL
  if (!sessionStore) {
    console.log("⚠️ Redis not available, attempting PostgreSQL for sessions");
    
    try {
      // Test database connection with timeout before creating session store
      const dbConnected = await Promise.race([
        testDatabaseConnection(),
        new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 5000)
        )
      ]);
      
      if (!dbConnected) {
        throw new Error("Database connection test failed");
      }
      
      const pgStore = connectPg(session);
      sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
        ttl: sessionTtl,
        tableName: "sessions",
        schemaName: "public",
        errorLog: (error: Error) => {
          console.error("❌ PostgreSQL session store error:", error.message);
        },
      });
      
      sessionStore.on('error', (error: Error) => {
        console.error("❌ Session store connection error:", error);
      });
      
      console.log("✅ Using PostgreSQL for session storage");
    } catch (dbError) {
      console.error("❌ Failed to setup PostgreSQL session store:", dbError);
      console.log("⚠️ Falling back to in-memory session store (sessions will not persist across restarts)");
      
      sessionStore = new MemoryStore({
        checkPeriod: 86400000,
      });
    }
  }
  
  // Determine if we're in production
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.REPLIT_DEPLOYMENT === '1' ||
                       process.env.REPL_SLUG?.includes('florida-local-elite');
  
  // Configure cookie settings based on environment
  const cookieConfig: any = {
    httpOnly: true,
    secure: isProduction, // Only secure in production
    maxAge: sessionTtlMs,
    sameSite: "lax" as const, // Important for OAuth flow
  };
  
  // Add domain configuration for production
  if (isProduction && process.env.REPLIT_DOMAINS) {
    // Use the production domain if available
    const productionDomain = process.env.REPLIT_DOMAINS.split(',')
      .find(d => d.includes('.replit.app'))
      ?.trim();
      
    if (productionDomain) {
      // Extract the base domain for cookie sharing across subdomains
      const baseDomain = productionDomain.replace(/^[^.]+\./, '.');
      cookieConfig.domain = baseDomain; // e.g., ".replit.app"
      console.log(`🍪 Cookie domain set to: ${cookieConfig.domain}`);
    }
  }
  
  console.log(`🔐 Session configuration:`, {
    isProduction,
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    domain: cookieConfig.domain || 'default',
    store: sessionStore ? sessionStore.constructor.name : 'MemoryStore'
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Extend session on activity
    cookie: cookieConfig,
    name: 'florida.elite.sid', // Custom session name to avoid conflicts
    // Add session error handling
    genid: () => {
      return randomBytes(32).toString('hex');
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  console.log(`🔐 Upserting user: ${claims["email"]} (Replit ID: ${claims["sub"]})`);
  
  try {
    const userData = {
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
    };
    
    const user = await storage.upsertUser(userData);
    console.log(`✅ User upserted successfully: ${user.email} (DB ID: ${user.id})`);
    return user;
  } catch (error) {
    console.error(`❌ Failed to upsert user ${claims["email"]}:`, error);
    throw error;
  }
}

export async function setupAuth(app: Express) {
  // Validate REPLIT_DOMAINS early
  if (!process.env.REPLIT_DOMAINS) {
    console.error("❌ CRITICAL: REPLIT_DOMAINS environment variable is not set");
    throw new Error("REPLIT_DOMAINS environment variable is required for authentication");
  }

  console.log("🔐 Starting auth setup...");
  app.set("trust proxy", 1);
  
  // Session setup with timeout to prevent hanging
  const sessionMiddleware = await Promise.race([
    getSession(),
    new Promise<any>((_, reject) => 
      setTimeout(() => reject(new Error('Session initialization timeout')), 10000)
    )
  ]);
  
  app.use(sessionMiddleware);
  console.log("✅ Session middleware configured");
  
  app.use(passport.initialize());
  app.use(passport.session());
  console.log("✅ Passport initialized");

  const config = await getOidcConfig();
  console.log("✅ OIDC config loaded");
  
  // Keep track of registered strategies for debugging
  const registeredStrategies = new Set<string>();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const claims = tokens.claims();
      console.log(`🔐 Verifying user with email: ${claims?.["email"]}`);

      // Upsert user and get the database user in one operation
      const dbUser = await upsertUser(claims);

      if (!dbUser) {
        console.error(`❌ Failed to upsert user with email: ${claims?.["email"]}`);
        return verified(new Error("Failed to create or update user in database"));
      }

      console.log(`✅ User verified successfully - DB ID: ${dbUser.id}, Email: ${dbUser.email}`);

      // Create session user with database ID and Replit tokens
      const user = {
        claims: {
          ...claims,
          sub: dbUser.id, // Use DATABASE user ID, not Replit ID
        },
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: claims?.exp,
      };

      verified(null, user);
    } catch (error) {
      console.error(`❌ Error in verify callback:`, error);
      verified(error as Error);
    }
  };

  // Register strategy for Replit domains
  const replitDomains = process.env.REPLIT_DOMAINS.split(",");
  console.log("🔑 Registering authentication strategies for domains:", replitDomains);
  
  // Always ensure production domain is registered
  // Handle both .replit.dev (development) and .replit.app (production) domains
  const additionalDomains: string[] = [];
  
  // For each .replit.dev domain, also register the corresponding .replit.app domain
  for (const domain of replitDomains) {
    if (domain.includes('.replit.dev')) {
      // Extract the repl ID and create the .replit.app version
      const replId = domain.split('-00-')[0];
      if (replId) {
        // Add the production .replit.app domain
        additionalDomains.push(`${replId}.replit.app`);
        // Add florida-local-elite.replit.app as the production domain
        if (!additionalDomains.includes('florida-local-elite.replit.app')) {
          additionalDomains.push('florida-local-elite.replit.app');
        }
      }
    }
  }
  
  const allDomains = [...replitDomains, ...additionalDomains];
  console.log("🔑 Registering strategies for all domains:", allDomains);
  
  for (const domain of allDomains) {
    const trimmedDomain = domain.trim();
    if (!trimmedDomain) {
      console.warn(`⚠️ Skipping empty domain`);
      continue;
    }
    const strategyName = `replitauth:${trimmedDomain}`;
    console.log(`🔧 Attempting to register strategy: ${strategyName}`);
    try {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${trimmedDomain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
      console.log(`✅ Registered strategy: ${strategyName}`);
    } catch (strategyError) {
      console.error(`❌ Failed to register strategy ${strategyName}:`, strategyError);
      // Don't throw, just log the error and continue with other strategies
      console.error(`⚠️ Continuing with other strategies...`);
    }
  }

  // Also register strategy for localhost development
  const localhostStrategy = new Strategy(
    {
      name: `replitauth:localhost`,
      config,
      scope: "openid email profile offline_access",
      callbackURL: `http://localhost:5000/api/callback`,
    },
    verify,
  );
  passport.use(localhostStrategy);
  registeredStrategies.add("replitauth:localhost");
  console.log("✅ Registered strategy: replitauth:localhost");

  // Also register strategy for 127.0.0.1 (sometimes hostname reports this)
  const localhostIpStrategy = new Strategy(
    {
      name: `replitauth:127.0.0.1`,
      config,
      scope: "openid email profile offline_access",
      callbackURL: `http://127.0.0.1:5000/api/callback`,
    },
    verify,
  );
  passport.use(localhostIpStrategy);
  registeredStrategies.add("replitauth:127.0.0.1");
  console.log("✅ Registered strategy: replitauth:127.0.0.1");

  console.log("🔑 All registered authentication strategies:", Array.from(registeredStrategies));

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Check multiple headers to get the correct hostname
    let hostname = req.hostname;
    const xForwardedHost = req.get('x-forwarded-host');
    const hostHeader = req.get('host');
    
    // Prefer x-forwarded-host for production domains
    if (xForwardedHost) {
      hostname = xForwardedHost.split(':')[0]; // Remove port if present
    } else if (hostHeader) {
      hostname = hostHeader.split(':')[0]; // Remove port if present
    }
    
    // Special handling for florida-local-elite.replit.app
    if (hostname === 'florida-local-elite.replit.app' || 
        hostname.includes('florida-local-elite')) {
      hostname = 'florida-local-elite.replit.app';
    }
    
    const strategyName = `replitauth:${hostname}`;
    
    console.log(`🔐 Login attempt - hostname: ${hostname}, strategy: ${strategyName}`);
    console.log(`🔐 Available strategies: ${Array.from(registeredStrategies).join(', ')}`);
    console.log(`🔐 Headers - Host: ${req.get('host')}, X-Forwarded-Host: ${req.get('x-forwarded-host')}`);
    
    // Check if the strategy exists
    if (!registeredStrategies.has(strategyName)) {
      console.error(`❌ Strategy not found: ${strategyName}`);
      console.error(`❌ Available strategies: ${Array.from(registeredStrategies).join(', ')}`);
      
      // Try to find a matching strategy or use the first available Replit domain
      let fallbackStrategy = null;
      
      // First, try florida-local-elite.replit.app strategy specifically
      if (registeredStrategies.has('replitauth:florida-local-elite.replit.app')) {
        fallbackStrategy = 'replitauth:florida-local-elite.replit.app';
      } else {
        // Then fall back to any Replit strategy
        for (const strategy of registeredStrategies) {
          if (strategy.includes('replit') && !strategy.includes('localhost')) {
            fallbackStrategy = strategy;
            break;
          }
        }
      }
      
      if (fallbackStrategy) {
        console.log(`🔄 Using fallback strategy: ${fallbackStrategy}`);
        passport.authenticate(fallbackStrategy, {
          prompt: "login consent",
          scope: ["openid", "email", "profile", "offline_access"],
        })(req, res, next);
        return;
      } else {
        console.error("❌ No fallback strategy available");
        return res.status(500).json({ 
          error: "Authentication configuration error",
          message: `No authentication strategy found for hostname: ${hostname}`,
          hostname,
          availableStrategies: Array.from(registeredStrategies)
        });
      }
    }
    
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", async (req, res, next) => {
    console.log(`🔐 === AUTHENTICATION CALLBACK START ===`);
    console.log(`🔐 Query params:`, req.query);
    console.log(`🔐 Headers - Host: ${req.get('host')}, X-Forwarded-Host: ${req.get('x-forwarded-host')}, Referer: ${req.get('referer')}`);
    
    // Check multiple headers to get the correct hostname (same as login)
    let hostname = req.hostname;
    const xForwardedHost = req.get('x-forwarded-host');
    const hostHeader = req.get('host');
    
    // Prefer x-forwarded-host for production domains
    if (xForwardedHost) {
      hostname = xForwardedHost.split(':')[0]; // Remove port if present
    } else if (hostHeader) {
      hostname = hostHeader.split(':')[0]; // Remove port if present
    }
    
    // Special handling for florida-local-elite.replit.app
    if (hostname === 'florida-local-elite.replit.app' || 
        hostname.includes('florida-local-elite')) {
      hostname = 'florida-local-elite.replit.app';
    }
    
    const strategyName = `replitauth:${hostname}`;
    
    console.log(`🔐 Resolved hostname: ${hostname}, strategy: ${strategyName}`);
    console.log(`🔐 Available strategies: ${Array.from(registeredStrategies).join(', ')}`);
    
    // Check if the strategy exists
    if (!registeredStrategies.has(strategyName)) {
      console.error(`❌ Callback strategy not found: ${strategyName}`);
      
      // Try to find a matching strategy
      let fallbackStrategy = null;
      
      // First, try florida-local-elite.replit.app strategy specifically
      if (registeredStrategies.has('replitauth:florida-local-elite.replit.app')) {
        fallbackStrategy = 'replitauth:florida-local-elite.replit.app';
      } else {
        // Then fall back to any Replit strategy
        for (const strategy of registeredStrategies) {
          if (strategy.includes('replit') && !strategy.includes('localhost')) {
            fallbackStrategy = strategy;
            break;
          }
        }
      }
      
      if (fallbackStrategy) {
        console.log(`🔄 Using fallback strategy for callback: ${fallbackStrategy}`);
        passport.authenticate(fallbackStrategy, {
          successReturnToOrRedirect: "/",
          failureRedirect: "/api/login",
        })(req, res, next);
        return;
      } else {
        console.error("❌ No fallback strategy available for callback");
        return res.redirect("/api/login");
      }
    }
    
    // Use custom callback to handle post-authentication routing
    passport.authenticate(strategyName, async (err: any, user: any, info: any) => {
      console.log(`🔐 Passport authenticate callback triggered`);
      
      if (err) {
        console.error("❌ Authentication error:", err);
        console.error("❌ Error stack:", err.stack);
        console.error("❌ Error details:", JSON.stringify(err, null, 2));
        return res.redirect("/api/login");
      }

      if (!user) {
        console.error("❌ Authentication failed - no user returned");
        console.error("❌ Info from passport:", JSON.stringify(info, null, 2));
        return res.redirect("/api/login");
      }

      console.log(`✅ Authentication successful for user:`, {
        email: user.claims?.email,
        sub: user.claims?.sub,
        hasAccessToken: !!user.access_token,
        hasRefreshToken: !!user.refresh_token,
        expiresAt: user.expires_at
      });

      // Log the user in
      req.login(user, async (loginErr) => {
        if (loginErr) {
          console.error("❌ Session login error:", loginErr);
          console.error("❌ Login error stack:", loginErr.stack);
          console.error("❌ Login error details:", JSON.stringify(loginErr, null, 2));
          return res.redirect("/api/login");
        }

        console.log(`✅ Session created successfully for user: ${user.claims?.email} (ID: ${user.claims?.sub})`);
        console.log(`🔐 Session ID: ${req.sessionID}`);

        // Get user profile to determine redirect
        try {
          const userId = user.claims?.sub;
          if (userId) {
            const dbUser = await storage.getUser(userId);
            console.log(`✅ Retrieved DB user profile:`, {
              id: dbUser?.id,
              email: dbUser?.email,
              isAdmin: dbUser?.isAdmin
            });
            
            // Check if there's a return URL in the session
            const returnUrl = (req.session as any)?.returnTo;
            if (returnUrl) {
              console.log(`🔐 Found return URL in session: ${returnUrl}`);
              delete (req.session as any).returnTo;
              return res.redirect(returnUrl);
            }

            console.log(`🔐 Redirecting to /profile for intelligent routing`);
            // Always redirect to profile page for intelligent routing
            return res.redirect("/profile");
          }
        } catch (profileError) {
          console.error("⚠️ Error retrieving user profile:", profileError);
        }
        
        console.log(`🔐 Falling back to redirect to home page`);
        // Default redirect to home
        return res.redirect("/");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
