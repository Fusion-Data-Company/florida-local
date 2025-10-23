/**
 * Session Management API
 *
 * Provides endpoints for managing user sessions, device tracking, and security
 */

import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { isAuthenticated } from '../auth/index';
import UAParser from 'ua-parser-js';

const router = Router();

interface SessionInfo {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  isCurrent: boolean;
  lastActivity: Date;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Parse user agent to extract device info
 */
function parseUserAgent(userAgent: string | undefined): {
  deviceType: string;
  browser: string;
  os: string;
} {
  if (!userAgent) {
    return {
      deviceType: 'unknown',
      browser: 'unknown',
      os: 'unknown'
    };
  }

  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  const browser = parser.getBrowser();
  const os = parser.getOS();

  return {
    deviceType: device.type || 'desktop',
    browser: `${browser.name || 'unknown'} ${browser.version || ''}`.trim(),
    os: `${os.name || 'unknown'} ${os.version || ''}`.trim()
  };
}

/**
 * Track active session in database
 */
export async function trackSession(req: Request): Promise<void> {
  try {
    const user = (req as any).user;
    const userId = user?.claims?.sub;
    const sessionId = (req as any).sessionID;

    if (!userId || !sessionId) {
      return;
    }

    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress;

    const userAgent = req.headers['user-agent'];
    const deviceInfo = parseUserAgent(userAgent);

    // Get session expiry from cookie
    const session = (req as any).session;
    const expiresAt = session?.cookie?.expires || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Upsert active session
    await pool.query(
      `INSERT INTO active_sessions (user_id, session_id, ip_address, user_agent, device_type, browser, os, is_current, last_activity, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), $8)
       ON CONFLICT (session_id)
       DO UPDATE SET
         last_activity = NOW(),
         is_current = true`,
      [
        userId,
        sessionId,
        ipAddress,
        userAgent,
        deviceInfo.deviceType,
        deviceInfo.browser,
        deviceInfo.os,
        expiresAt
      ]
    );
  } catch (error) {
    console.error('Failed to track session:', error);
  }
}

/**
 * GET /api/sessions
 * Get all active sessions for the current user
 */
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.claims?.sub;
    const currentSessionId = (req as any).sessionID;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query<SessionInfo>(
      `SELECT
        id,
        user_id as "userId",
        session_id as "sessionId",
        ip_address as "ipAddress",
        user_agent as "userAgent",
        device_type as "deviceType",
        browser,
        os,
        (session_id = $2) as "isCurrent",
        last_activity as "lastActivity",
        expires_at as "expiresAt",
        created_at as "createdAt"
       FROM active_sessions
       WHERE user_id = $1
         AND expires_at > NOW()
       ORDER BY last_activity DESC`,
      [userId, currentSessionId]
    );

    res.json({
      sessions: result.rows,
      currentSessionId
    });
  } catch (error) {
    console.error('Failed to get sessions:', error);
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

/**
 * DELETE /api/sessions/:sessionId
 * Revoke a specific session
 */
router.delete('/:sessionId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.claims?.sub;
    const { sessionId } = req.params;
    const currentSessionId = (req as any).sessionID;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Don't allow revoking the current session this way
    if (sessionId === currentSessionId) {
      return res.status(400).json({
        error: 'Cannot revoke current session',
        message: 'Use the logout endpoint to end your current session'
      });
    }

    // Verify the session belongs to the user
    const result = await pool.query(
      'SELECT id FROM active_sessions WHERE session_id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Delete the session
    await pool.query('DELETE FROM active_sessions WHERE session_id = $1', [sessionId]);

    // Log the session revocation
    const { logAuthEvent } = await import('../middleware/authAudit');
    await logAuthEvent({
      userId,
      eventType: 'session_revoked',
      eventStatus: 'success',
      sessionId: currentSessionId,
      metadata: {
        revokedSessionId: sessionId,
        timestamp: new Date().toISOString()
      }
    });

    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Failed to revoke session:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

/**
 * DELETE /api/sessions
 * Revoke all sessions except the current one
 */
router.delete('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.claims?.sub;
    const currentSessionId = (req as any).sessionID;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete all sessions except the current one
    const result = await pool.query(
      'DELETE FROM active_sessions WHERE user_id = $1 AND session_id != $2 RETURNING session_id',
      [userId, currentSessionId]
    );

    // Log the session revocations
    const { logAuthEvent } = await import('../middleware/authAudit');
    await logAuthEvent({
      userId,
      eventType: 'all_sessions_revoked',
      eventStatus: 'success',
      sessionId: currentSessionId,
      metadata: {
        revokedCount: result.rowCount,
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: `Revoked ${result.rowCount} session(s)`,
      revokedCount: result.rowCount
    });
  } catch (error) {
    console.error('Failed to revoke sessions:', error);
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
});

/**
 * GET /api/sessions/current
 * Get current session information
 */
router.get('/current', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.claims?.sub;
    const currentSessionId = (req as any).sessionID;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query<SessionInfo>(
      `SELECT
        id,
        user_id as "userId",
        session_id as "sessionId",
        ip_address as "ipAddress",
        user_agent as "userAgent",
        device_type as "deviceType",
        browser,
        os,
        true as "isCurrent",
        last_activity as "lastActivity",
        expires_at as "expiresAt",
        created_at as "createdAt"
       FROM active_sessions
       WHERE session_id = $1 AND user_id = $2`,
      [currentSessionId, userId]
    );

    if (result.rows.length === 0) {
      // Session not tracked yet, track it now
      await trackSession(req);

      // Retry query
      const retryResult = await pool.query<SessionInfo>(
        `SELECT
          id,
          user_id as "userId",
          session_id as "sessionId",
          ip_address as "ipAddress",
          user_agent as "userAgent",
          device_type as "deviceType",
          browser,
          os,
          true as "isCurrent",
          last_activity as "lastActivity",
          expires_at as "expiresAt",
          created_at as "createdAt"
         FROM active_sessions
         WHERE session_id = $1 AND user_id = $2`,
        [currentSessionId, userId]
      );

      if (retryResult.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      return res.json(retryResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to get current session:', error);
    res.status(500).json({ error: 'Failed to retrieve current session' });
  }
});

/**
 * POST /api/sessions/refresh
 * Refresh the current session (extend expiry)
 */
router.post('/refresh', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;

    // Touch the session to extend its expiry
    session.touch();

    // Update last activity in database
    const currentSessionId = (req as any).sessionID;
    await pool.query(
      'UPDATE active_sessions SET last_activity = NOW() WHERE session_id = $1',
      [currentSessionId]
    );

    res.json({
      success: true,
      message: 'Session refreshed',
      expiresAt: session.cookie.expires
    });
  } catch (error) {
    console.error('Failed to refresh session:', error);
    res.status(500).json({ error: 'Failed to refresh session' });
  }
});

export default router;
