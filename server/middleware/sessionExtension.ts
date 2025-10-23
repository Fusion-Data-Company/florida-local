import { Request, Response, NextFunction } from 'express';
import { logger } from '../monitoring';

/**
 * Middleware to automatically extend session on authenticated requests
 *
 * This prevents users from being logged out while actively using the app.
 * The session will be extended on every authenticated request, effectively
 * creating a "sliding window" session expiration.
 */
export function autoExtendSession(req: Request, res: Response, next: NextFunction) {
  // Only extend if user is authenticated
  if (req.isAuthenticated && req.isAuthenticated() && req.session) {
    const session = req.session as any;

    // Store last activity time
    const now = Date.now();
    const lastActivity = session.lastActivity || 0;
    const timeSinceActivity = now - lastActivity;

    // Update last activity
    session.lastActivity = now;

    // Only log if it's been more than 1 minute since last activity
    // (avoid spamming logs on rapid requests)
    if (timeSinceActivity > 60000) {
      logger.debug('🔄 Session activity updated', {
        userId: (req.user as any)?.id,
        timeSinceLastActivity: `${Math.round(timeSinceActivity / 1000)}s`,
      });
    }

    // Touch the session to extend its expiration
    // This resets the session's maxAge
    req.session.touch();
  }

  next();
}

/**
 * Middleware to check if session is about to expire and warn user
 *
 * Adds a header to the response if session is expiring soon,
 * allowing frontend to show a warning and offer to extend session.
 */
export function checkSessionExpiry(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated() && req.session && req.session.cookie) {
    const cookie = req.session.cookie;

    if (cookie.expires) {
      const timeUntilExpiry = cookie.expires.getTime() - Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // If session expires in less than 5 minutes, add warning header
      if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
        res.setHeader('X-Session-Expiring-Soon', 'true');
        res.setHeader('X-Session-Expires-In', Math.round(timeUntilExpiry / 1000).toString());

        logger.warn('⏰ Session expiring soon', {
          userId: (req.user as any)?.id,
          expiresIn: `${Math.round(timeUntilExpiry / 1000)}s`,
        });
      }
    }
  }

  next();
}

/**
 * Get session health info for monitoring
 */
export function getSessionHealth(req: Request): {
  isAuthenticated: boolean;
  hasSession: boolean;
  sessionId?: string;
  expiresAt?: Date;
  expiresIn?: number;
  lastActivity?: number;
  timeSinceActivity?: number;
} {
  const health: any = {
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    hasSession: !!req.session,
  };

  if (req.session) {
    health.sessionId = req.sessionID;

    if (req.session.cookie && req.session.cookie.expires) {
      health.expiresAt = req.session.cookie.expires;
      health.expiresIn = req.session.cookie.expires.getTime() - Date.now();
    }

    const session = req.session as any;
    if (session.lastActivity) {
      health.lastActivity = session.lastActivity;
      health.timeSinceActivity = Date.now() - session.lastActivity;
    }
  }

  return health;
}
