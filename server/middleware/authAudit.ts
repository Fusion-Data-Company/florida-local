/**
 * Authentication Audit Logging Middleware
 *
 * Tracks authentication events for security auditing and compliance
 */

import { Request, Response, NextFunction } from 'express';
import { getPool } from '../db';

export interface AuthAuditEvent {
  userId?: string;
  eventType: string;
  eventStatus: 'success' | 'failure' | 'pending';
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an authentication event to the audit table
 */
export async function logAuthEvent(event: AuthAuditEvent): Promise<void> {
  try {
    const pool = getPool();
    if (!pool) {
      console.warn('⚠️  Database pool not available for audit logging');
      return;
    }
    
    await pool.query(
      `INSERT INTO auth_audit_logs (user_id, event_type, event_status, ip_address, user_agent, session_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        event.userId || null,
        event.eventType,
        event.eventStatus,
        event.ipAddress || null,
        event.userAgent || null,
        event.sessionId || null,
        event.metadata ? JSON.stringify(event.metadata) : null
      ]
    );
  } catch (error) {
    // Don't fail requests if audit logging fails, but log the error
    console.error('❌ Failed to log auth event:', error);
  }
}

/**
 * Extract request metadata for audit logging
 */
export function getRequestMetadata(req: Request): { ipAddress?: string; userAgent?: string } {
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress;

  const userAgent = req.headers['user-agent'];

  return {
    ipAddress,
    userAgent
  };
}

/**
 * Middleware to automatically log authentication events
 */
export function authAuditMiddleware(eventType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    const metadata = getRequestMetadata(req);

    // Override res.json to capture the response
    res.json = function (body: any) {
      const user = (req as any).user;
      const sessionId = (req as any).sessionID;

      // Determine event status based on response
      let eventStatus: 'success' | 'failure' | 'pending' = 'pending';

      if (res.statusCode >= 200 && res.statusCode < 300) {
        eventStatus = 'success';
      } else if (res.statusCode >= 400) {
        eventStatus = 'failure';
      }

      // Log the event (don't await to avoid blocking response)
      logAuthEvent({
        userId: user?.claims?.sub || user?.id,
        eventType,
        eventStatus,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        sessionId,
        metadata: {
          statusCode: res.statusCode,
          path: req.path,
          method: req.method
        }
      }).catch(err => console.error('Auth audit error:', err));

      return originalJson(body);
    };

    next();
  };
}

/**
 * Log successful login
 */
export async function logLoginSuccess(req: Request, userId: string): Promise<void> {
  const { ipAddress, userAgent } = getRequestMetadata(req);

  await logAuthEvent({
    userId,
    eventType: 'login_success',
    eventStatus: 'success',
    ipAddress,
    userAgent,
    sessionId: (req as any).sessionID,
    metadata: {
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log failed login attempt
 */
export async function logLoginFailure(req: Request, reason?: string): Promise<void> {
  const { ipAddress, userAgent } = getRequestMetadata(req);

  await logAuthEvent({
    eventType: 'login_failed',
    eventStatus: 'failure',
    ipAddress,
    userAgent,
    metadata: {
      reason,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log logout event
 */
export async function logLogout(req: Request, userId?: string): Promise<void> {
  const { ipAddress, userAgent } = getRequestMetadata(req);

  await logAuthEvent({
    userId,
    eventType: 'logout',
    eventStatus: 'success',
    ipAddress,
    userAgent,
    sessionId: (req as any).sessionID,
    metadata: {
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log session expiration
 */
export async function logSessionExpired(userId: string, sessionId: string): Promise<void> {
  await logAuthEvent({
    userId,
    eventType: 'session_expired',
    eventStatus: 'success',
    sessionId,
    metadata: {
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<any[]> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  try {
    const pool = getPool();
    if (!pool) {
      console.warn('⚠️  Database pool not available for audit logs');
      return [];
    }
    
    const result = await pool.query(
      `SELECT * FROM auth_audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return [];
  }
}

/**
 * Get recent suspicious activities
 */
export async function getSuspiciousActivities(hours: number = 24): Promise<any[]> {
  try {
    const pool = getPool();
    if (!pool) {
      console.warn('⚠️  Database pool not available for suspicious activities');
      return [];
    }
    
    const result = await pool.query(
      `SELECT
        user_id,
        ip_address,
        event_type,
        COUNT(*) as event_count,
        MAX(created_at) as last_occurrence
       FROM auth_audit_logs
       WHERE created_at > NOW() - INTERVAL '${hours} hours'
         AND event_status = 'failure'
       GROUP BY user_id, ip_address, event_type
       HAVING COUNT(*) > 5
       ORDER BY event_count DESC
       LIMIT 100`
    );

    return result.rows;
  } catch (error) {
    console.error('Failed to get suspicious activities:', error);
    return [];
  }
}
