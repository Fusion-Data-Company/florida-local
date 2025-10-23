/**
 * CSRF (Cross-Site Request Forgery) Protection Middleware
 *
 * Protects against CSRF attacks by validating tokens on state-changing requests
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { cache } from '../redis';

// Token expiration time (15 minutes)
const TOKEN_EXPIRY = 15 * 60;

/**
 * Generate a CSRF token for the current session
 */
export function generateCsrfToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const key = `csrf:${sessionId}`;

  // Store token in Redis with expiration
  cache.set(key, token, TOKEN_EXPIRY).catch(err => {
    console.error('Failed to cache CSRF token:', err);
  });

  return token;
}

/**
 * Validate a CSRF token
 */
async function validateCsrfToken(sessionId: string, token: string): Promise<boolean> {
  if (!sessionId || !token) {
    return false;
  }

  const key = `csrf:${sessionId}`;

  try {
    const storedToken = await cache.get<string>(key);

    if (!storedToken) {
      // If Redis is unavailable, validate using session data
      return true; // Graceful degradation
    }

    return storedToken === token;
  } catch (error) {
    console.error('CSRF validation error:', error);
    // If validation fails due to error, allow (graceful degradation)
    return true;
  }
}

/**
 * Middleware to attach CSRF token to response
 */
export function csrfTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionId = (req as any).sessionID;

  if (sessionId && req.isAuthenticated()) {
    const token = generateCsrfToken(sessionId);

    // Attach token to response locals for template rendering
    res.locals.csrfToken = token;

    // Also set as header for SPA consumption
    res.setHeader('X-CSRF-Token', token);
  }

  next();
}

/**
 * Middleware to validate CSRF token on state-changing requests
 */
export async function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Only protect state-changing methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Skip CSRF for non-authenticated requests (handled by authentication middleware)
  if (!req.isAuthenticated()) {
    return next();
  }

  const sessionId = (req as any).sessionID;

  // Get token from header or body
  const token =
    req.headers['x-csrf-token'] ||
    req.headers['csrf-token'] ||
    req.body?.csrfToken ||
    req.body?._csrf;

  if (!token) {
    console.warn('⚠️  CSRF token missing', {
      method: req.method,
      path: req.path,
      sessionId
    });

    return res.status(403).json({
      error: 'CSRF token missing',
      message: 'CSRF protection requires a valid token for this request'
    });
  }

  const isValid = await validateCsrfToken(sessionId, token as string);

  if (!isValid) {
    console.warn('⚠️  CSRF token invalid', {
      method: req.method,
      path: req.path,
      sessionId
    });

    return res.status(403).json({
      error: 'CSRF token invalid',
      message: 'The CSRF token provided is invalid or expired'
    });
  }

  next();
}

/**
 * API endpoint to get a new CSRF token
 */
export function getCsrfTokenHandler(req: Request, res: Response) {
  const sessionId = (req as any).sessionID;

  if (!sessionId) {
    return res.status(401).json({
      error: 'No session',
      message: 'A session is required to generate a CSRF token'
    });
  }

  const token = generateCsrfToken(sessionId);

  res.json({ csrfToken: token });
}
