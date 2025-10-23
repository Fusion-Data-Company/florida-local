/**
 * Security Headers Middleware
 *
 * Enhances Helmet.js with additional security headers and configurations
 */

import { Request, Response, NextFunction } from 'express';

export interface SecurityHeadersOptions {
  enableHSTS?: boolean;
  enableNoSniff?: boolean;
  enableXSSProtection?: boolean;
  enableFrameGuard?: boolean;
  enableReferrerPolicy?: boolean;
}

/**
 * Apply comprehensive security headers
 */
export function securityHeaders(options: SecurityHeadersOptions = {}) {
  const {
    enableHSTS = true,
    enableNoSniff = true,
    enableXSSProtection = true,
    enableFrameGuard = true,
    enableReferrerPolicy = true
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Strict-Transport-Security (HSTS)
    if (enableHSTS && req.secure) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // X-Content-Type-Options
    if (enableNoSniff) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // X-XSS-Protection (legacy, but still useful)
    if (enableXSSProtection) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // X-Frame-Options
    if (enableFrameGuard) {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    // Referrer-Policy
    if (enableReferrerPolicy) {
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // X-Permitted-Cross-Domain-Policies
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // X-Download-Options (IE8+)
    res.setHeader('X-Download-Options', 'noopen');

    // Permissions-Policy (formerly Feature-Policy)
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=()'
    );

    // Remove potentially revealing headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    next();
  };
}

/**
 * Session security middleware
 * Adds additional session security checks
 */
export function sessionSecurity(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.isAuthenticated()) {
    const session = req.session as any;

    // Check for session hijacking indicators
    const currentUserAgent = req.headers['user-agent'];
    const currentIP =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress;

    // Store initial session fingerprint
    if (!session.fingerprint) {
      session.fingerprint = {
        userAgent: currentUserAgent,
        ip: currentIP,
        createdAt: new Date().toISOString()
      };
    } else {
      // Validate session fingerprint
      const fingerprintChanged =
        session.fingerprint.userAgent !== currentUserAgent;

      if (fingerprintChanged) {
        console.warn('⚠️  Session fingerprint mismatch detected', {
          sessionId: (req as any).sessionID,
          userId: (req.user as any)?.claims?.sub,
          stored: session.fingerprint.userAgent,
          current: currentUserAgent
        });

        // Log security event
        logSecurityEvent(req, 'session_hijack_attempt').catch(console.error);

        // For production, you might want to invalidate the session
        // For now, we'll just log it
      }
    }

    // Update last activity time
    session.lastActivity = new Date().toISOString();
  }

  next();
}

/**
 * Log a security event
 */
async function logSecurityEvent(req: Request, eventType: string): Promise<void> {
  try {
    const { pool } = await import('../db');

    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress;

    const userAgent = req.headers['user-agent'];
    const user = (req as any).user;
    const userId = user?.claims?.sub || user?.id;

    await pool.query(
      `INSERT INTO security_events (event_type, severity, user_id, ip_address, user_agent, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        eventType,
        'high',
        userId || null,
        ipAddress || null,
        userAgent || null,
        `Potential security event detected: ${eventType}`,
        JSON.stringify({
          path: req.path,
          method: req.method,
          sessionId: (req as any).sessionID,
          timestamp: new Date().toISOString()
        })
      ]
    );
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Rate limit security middleware
 * Tracks suspicious patterns and logs security events
 */
export function securityMonitoring(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  // Override res.json to monitor responses
  res.json = function (body: any) {
    // Log suspicious status codes
    if (res.statusCode === 401 || res.statusCode === 403) {
      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        req.socket.remoteAddress;

      // Track failed auth attempts (can be used with rate limiting)
      const key = `failed_auth:${ipAddress}`;

      // This can be expanded to trigger security alerts
      console.debug('Security monitoring:', {
        statusCode: res.statusCode,
        path: req.path,
        ip: ipAddress,
        timestamp: new Date().toISOString()
      });
    }

    return originalJson(body);
  };

  next();
}
