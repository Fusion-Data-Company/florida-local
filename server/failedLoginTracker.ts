/**
 * Failed Login Tracking & Account Lockout System
 *
 * Enterprise-grade security features:
 * - Track all failed login attempts
 * - Progressive delays (1s, 2s, 5s, 10s, 30s)
 * - Temporary lockout after 5 failures (15 minutes)
 * - Permanent lockout after 10 failures (requires admin)
 * - IP-based tracking
 * - Email notifications
 */

import { db } from './db';
import { sql } from 'drizzle-orm';
import { redis, cache } from './redis';
import { logger } from './monitoring';
import type { Request } from 'express';

// Configuration
const LOCKOUT_CONFIG = {
  // Progressive delay multipliers (in seconds)
  delays: [1, 2, 5, 10, 30],

  // Temporary lockout after 5 failed attempts
  temporaryLockoutThreshold: 5,
  temporaryLockoutDuration: 15 * 60 * 1000, // 15 minutes

  // Permanent lockout after 10 failed attempts
  permanentLockoutThreshold: 10,

  // Time window for counting attempts (1 hour)
  attemptWindow: 60 * 60 * 1000,

  // Clean old attempts after 24 hours
  cleanupAge: 24 * 60 * 60 * 1000,
};

interface FailedAttemptInfo {
  count: number;
  lastAttempt: Date;
  lockoutUntil?: Date;
  isLocked: boolean;
  delay: number; // seconds to wait
}

/**
 * Record a failed login attempt
 */
export async function recordFailedLogin(
  email: string,
  ipAddress: string,
  userAgent: string,
  reason: string
): Promise<void> {
  try {
    // Record in database
    await db.execute(sql`
      INSERT INTO failed_login_attempts (email, ip_address, user_agent, failure_reason)
      VALUES (${email}, ${ipAddress}, ${userAgent}, ${reason})
    `);

    logger.warn('Failed login attempt recorded', {
      email,
      ipAddress,
      reason,
    });
  } catch (error) {
    logger.error('Error recording failed login', { error, email });
  }
}

/**
 * Get failed attempt count for email in the last hour
 */
export async function getFailedAttemptInfo(email: string): Promise<FailedAttemptInfo> {
  try {
    const oneHourAgo = new Date(Date.now() - LOCKOUT_CONFIG.attemptWindow);

    // Check cache first
    const cacheKey = `failed_attempts:${email}`;
    const cached = await cache.get<FailedAttemptInfo>(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const result = await db.execute(sql`
      SELECT COUNT(*) as count, MAX(attempt_time) as last_attempt
      FROM failed_login_attempts
      WHERE email = ${email}
      AND attempt_time > ${oneHourAgo.toISOString()}
    `);

    const row = (result.rows[0] as any);
    const count = parseInt(row?.count || '0');
    const lastAttempt = row?.last_attempt ? new Date(row.last_attempt) : new Date();

    // Check for active lockout
    const lockoutResult = await db.execute(sql`
      SELECT locked_until, lockout_type
      FROM account_lockouts
      WHERE email = ${email}
      AND unlocked_at IS NULL
      AND (locked_until IS NULL OR locked_until > NOW())
      ORDER BY locked_at DESC
      LIMIT 1
    `);

    const lockout = lockoutResult.rows[0] as any;
    const isLocked = !!lockout;
    const lockoutUntil = lockout?.locked_until ? new Date(lockout.locked_until) : undefined;

    // Calculate progressive delay
    const delayIndex = Math.min(count - 1, LOCKOUT_CONFIG.delays.length - 1);
    const delay = count > 0 ? LOCKOUT_CONFIG.delays[delayIndex] : 0;

    const info: FailedAttemptInfo = {
      count,
      lastAttempt,
      lockoutUntil,
      isLocked,
      delay,
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, info, 300);

    return info;
  } catch (error) {
    logger.error('Error getting failed attempt info', { error, email });
    return {
      count: 0,
      lastAttempt: new Date(),
      isLocked: false,
      delay: 0,
    };
  }
}

/**
 * Check if account should be locked after failed attempt
 */
export async function checkAndApplyLockout(
  email: string,
  userId?: number
): Promise<{ locked: boolean; lockoutType?: string; lockoutUntil?: Date }> {
  try {
    const attemptInfo = await getFailedAttemptInfo(email);

    // Already locked
    if (attemptInfo.isLocked) {
      return {
        locked: true,
        lockoutType: 'existing',
        lockoutUntil: attemptInfo.lockoutUntil,
      };
    }

    // Check for temporary lockout
    if (attemptInfo.count >= LOCKOUT_CONFIG.temporaryLockoutThreshold &&
        attemptInfo.count < LOCKOUT_CONFIG.permanentLockoutThreshold) {

      const lockoutUntil = new Date(Date.now() + LOCKOUT_CONFIG.temporaryLockoutDuration);

      await db.execute(sql`
        INSERT INTO account_lockouts (
          user_id, email, lockout_type, locked_until, locked_by, reason, failed_attempt_count
        ) VALUES (
          ${userId || null},
          ${email},
          'temporary',
          ${lockoutUntil.toISOString()},
          'system',
          'Too many failed login attempts',
          ${attemptInfo.count}
        )
      `);

      // Update user record if user_id exists
      if (userId) {
        await db.execute(sql`
          UPDATE users
          SET is_locked = true, locked_until = ${lockoutUntil.toISOString()}
          WHERE id = ${userId}
        `);
      }

      // Clear cache
      await redis.del(`failed_attempts:${email}`);

      logger.warn('Temporary account lockout applied', {
        email,
        userId,
        attempts: attemptInfo.count,
        lockoutUntil,
      });

      // TODO: Send notification
      await queueSecurityNotification(userId, email, 'account_lockout', {
        type: 'temporary',
        duration: '15 minutes',
        reason: 'Too many failed login attempts',
      });

      return {
        locked: true,
        lockoutType: 'temporary',
        lockoutUntil,
      };
    }

    // Check for permanent lockout
    if (attemptInfo.count >= LOCKOUT_CONFIG.permanentLockoutThreshold) {
      await db.execute(sql`
        INSERT INTO account_lockouts (
          user_id, email, lockout_type, locked_by, reason, failed_attempt_count
        ) VALUES (
          ${userId || null},
          ${email},
          'permanent',
          'system',
          'Excessive failed login attempts - requires admin unlock',
          ${attemptInfo.count}
        )
      `);

      // Update user record if user_id exists
      if (userId) {
        await db.execute(sql`
          UPDATE users
          SET is_locked = true
          WHERE id = ${userId}
        `);
      }

      // Clear cache
      await redis.del(`failed_attempts:${email}`);

      logger.error('Permanent account lockout applied', {
        email,
        userId,
        attempts: attemptInfo.count,
      });

      // TODO: Send critical notification
      await queueSecurityNotification(userId, email, 'account_lockout', {
        type: 'permanent',
        reason: 'Excessive failed login attempts',
        action: 'Contact administrator to unlock',
      });

      return {
        locked: true,
        lockoutType: 'permanent',
      };
    }

    return { locked: false };
  } catch (error) {
    logger.error('Error checking lockout', { error, email });
    return { locked: false };
  }
}

/**
 * Clear failed attempts after successful login
 */
export async function clearFailedAttempts(email: string): Promise<void> {
  try {
    // Clear cache
    await redis.del(`failed_attempts:${email}`);

    // Clear recent failed attempts
    const oneHourAgo = new Date(Date.now() - LOCKOUT_CONFIG.attemptWindow);
    await db.execute(sql`
      DELETE FROM failed_login_attempts
      WHERE email = ${email}
      AND attempt_time > ${oneHourAgo.toISOString()}
    `);

    // Clear failed count on user record
    await db.execute(sql`
      UPDATE users
      SET failed_login_count = 0, last_failed_login = NULL
      WHERE email = ${email}
    `);

    logger.info('Failed attempts cleared after successful login', { email });
  } catch (error) {
    logger.error('Error clearing failed attempts', { error, email });
  }
}

/**
 * Unlock an account (admin action)
 */
export async function unlockAccount(
  email: string,
  adminId: number,
  reason: string
): Promise<boolean> {
  try {
    // Mark lockouts as unlocked
    await db.execute(sql`
      UPDATE account_lockouts
      SET unlocked_at = NOW(), unlocked_by = ${adminId.toString()}
      WHERE email = ${email}
      AND unlocked_at IS NULL
    `);

    // Update user record
    await db.execute(sql`
      UPDATE users
      SET is_locked = false, locked_until = NULL, failed_login_count = 0
      WHERE email = ${email}
    `);

    // Clear cache and failed attempts
    await clearFailedAttempts(email);

    logger.info('Account unlocked by admin', {
      email,
      adminId,
      reason,
    });

    return true;
  } catch (error) {
    logger.error('Error unlocking account', { error, email });
    return false;
  }
}

/**
 * Check if IP is blocked
 */
export async function isIpBlocked(ipAddress: string): Promise<boolean> {
  try {
    // Check cache first
    const cacheKey = `ip_blocked:${ipAddress}`;
    const cached = await cache.get<boolean>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result = await db.execute(sql`
      SELECT 1
      FROM ip_access_control
      WHERE ip_address = ${ipAddress}
      AND list_type = 'blocklist'
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `);

    const blocked = result.rows.length > 0;

    // Cache for 5 minutes
    await cache.set(cacheKey, blocked, 300);

    return blocked;
  } catch (error) {
    logger.error('Error checking IP block status', { error, ipAddress });
    return false;
  }
}

/**
 * Block an IP address
 */
export async function blockIp(
  ipAddress: string,
  reason: string,
  adminId?: number,
  expiresInHours?: number
): Promise<void> {
  try {
    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : null;

    await db.execute(sql`
      INSERT INTO ip_access_control (
        ip_address, list_type, reason, added_by, expires_at
      ) VALUES (
        ${ipAddress},
        'blocklist',
        ${reason},
        ${adminId || null},
        ${expiresAt ? expiresAt.toISOString() : null}
      )
      ON CONFLICT (ip_address) DO UPDATE
      SET is_active = true, expires_at = EXCLUDED.expires_at, reason = EXCLUDED.reason
    `);

    // Clear cache
    await redis.del(`ip_blocked:${ipAddress}`);

    logger.warn('IP address blocked', {
      ipAddress,
      reason,
      adminId,
      expiresAt,
    });
  } catch (error) {
    logger.error('Error blocking IP', { error, ipAddress });
  }
}

/**
 * Queue a security notification (placeholder for email/SMS integration)
 */
async function queueSecurityNotification(
  userId: number | undefined,
  email: string,
  type: string,
  metadata: any
): Promise<void> {
  try {
    if (!userId) return;

    await db.execute(sql`
      INSERT INTO security_notifications (
        user_id, notification_type, severity, title, message, metadata
      ) VALUES (
        ${userId},
        ${type},
        'warning',
        'Account Security Alert',
        ${JSON.stringify(metadata)},
        ${JSON.stringify(metadata)}
      )
    `);

    // TODO: Integrate with email/SMS service
    logger.info('Security notification queued', { userId, email, type });
  } catch (error) {
    logger.error('Error queuing security notification', { error, userId });
  }
}

/**
 * Clean up old failed attempts (run periodically)
 */
export async function cleanupOldAttempts(): Promise<void> {
  try {
    const cutoffDate = new Date(Date.now() - LOCKOUT_CONFIG.cleanupAge);

    const result = await db.execute(sql`
      DELETE FROM failed_login_attempts
      WHERE attempt_time < ${cutoffDate.toISOString()}
    `);

    logger.info('Cleaned up old failed login attempts', {
      deleted: result.rowCount,
    });
  } catch (error) {
    logger.error('Error cleaning up failed attempts', { error });
  }
}

/**
 * Middleware to check for account lockout and apply progressive delays
 */
export async function checkAccountLockout(req: Request, email: string): Promise<{
  allowed: boolean;
  delay?: number;
  message?: string;
}> {
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

  // Check IP blocklist
  if (await isIpBlocked(ipAddress)) {
    return {
      allowed: false,
      message: 'Access denied from this IP address',
    };
  }

  // Check account lockout
  const attemptInfo = await getFailedAttemptInfo(email);

  if (attemptInfo.isLocked) {
    return {
      allowed: false,
      message: attemptInfo.lockoutUntil
        ? `Account temporarily locked until ${attemptInfo.lockoutUntil.toLocaleString()}`
        : 'Account locked. Contact administrator to unlock.',
    };
  }

  // Apply progressive delay if there are failed attempts
  if (attemptInfo.delay > 0) {
    return {
      allowed: true,
      delay: attemptInfo.delay,
      message: `Please wait ${attemptInfo.delay} seconds before trying again`,
    };
  }

  return { allowed: true };
}
