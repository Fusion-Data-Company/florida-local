import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { createRedisStore, redis } from "./redis";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use Redis store if available, otherwise fall back to PostgreSQL
  let sessionStore: any;
  
  if (redis.status === "ready") {
    console.log("✅ Using Redis for session storage");
    sessionStore = createRedisStore(session);
  } else {
    console.log("⚠️ Redis not available, using PostgreSQL for sessions");
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  }
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
      sameSite: "lax",
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
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();
  
  // Keep track of registered strategies for debugging
  const registeredStrategies = new Set<string>();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Register strategy for Replit domains
  const replitDomains = process.env.REPLIT_DOMAINS!.split(",");
  console.log("🔑 Registering authentication strategies for domains:", replitDomains);
  
  for (const domain of replitDomains) {
    const trimmedDomain = domain.trim();
    const strategyName = `replitauth:${trimmedDomain}`;
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
    const hostname = req.hostname;
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
      for (const strategy of registeredStrategies) {
        if (strategy.includes('replit') && !strategy.includes('localhost')) {
          fallbackStrategy = strategy;
          break;
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

  app.get("/api/callback", (req, res, next) => {
    const hostname = req.hostname;
    const strategyName = `replitauth:${hostname}`;
    
    console.log(`🔐 Callback attempt - hostname: ${hostname}, strategy: ${strategyName}`);
    
    // Check if the strategy exists
    if (!registeredStrategies.has(strategyName)) {
      console.error(`❌ Callback strategy not found: ${strategyName}`);
      
      // Try to find a matching strategy
      let fallbackStrategy = null;
      for (const strategy of registeredStrategies) {
        if (strategy.includes('replit') && !strategy.includes('localhost')) {
          fallbackStrategy = strategy;
          break;
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
    
    passport.authenticate(strategyName, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
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
