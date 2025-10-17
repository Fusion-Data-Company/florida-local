/**
 * Failed Login Tracking & Account Lockout System
 *
 * Enterprise-grade security features:
 * - Track all failed login attempts
 * - Progressive delays (1s, 2s, 5s, 10s, 30s)
 * - Temporary lockout after 5 failures (15 minutes)
 * - Permanent lockout after 10 failures (requires admin)
 * - IP-based tracking
 * - Email/SMS notifications
 * - Database persistence with Redis caching
 * - Automatic IP blocking integration
 */

import { db } from './db';
import { 
  failedLoginAttempts,
  accountLockouts,
  securityEvents,
  users
} from '../shared/schema';
import { eq, and, gte, sql, isNull } from 'drizzle-orm';
import { redis, cache } from './redis';
import { logger } from './monitoring';
import { securityNotificationService } from './securityNotificationService';
import { ipAccessControl as ipAccessControlService } from './ipAccessControl';
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

  // IP auto-block after 15 failed attempts from same IP
  ipBlockThreshold: 15,
  ipBlockDuration: 24 * 60 * 60 * 1000, // 24 hours
};

interface FailedAttemptInfo {
  count: number;
  lastAttempt: Date;
  lockoutUntil?: Date;
  isLocked: boolean;
  delay: number; // seconds to wait
  ipCount?: number; // Failed attempts from IP
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
    // Get geolocation for the IP
    const geoLocation = await getGeoLocation(ipAddress);
    
    // Record in database using Drizzle
    await db.insert(failedLoginAttempts).values({
      email,
      ipAddress,
      userAgent,
      failureReason: reason,
      geoLocation,
    });

    // Log security event
    await db.insert(securityEvents).values({
      eventType: 'login_failed',
      severity: 'warning',
      ipAddress,
      userAgent,
      description: `Failed login attempt for ${email}: ${reason}`,
      metadata: { email, reason, geoLocation },
    });

    // Check if we need to send notifications
    const attemptInfo = await getFailedAttemptInfo(email);
    
    // Send notification after 3 failed attempts
    if (attemptInfo.count === 3) {
      await securityNotificationService.sendFailedLoginNotification(
        email,
        attemptInfo.count,
        ipAddress,
        geoLocation?.country
      );
    }

    // Check for IP-based blocking
    await checkIPFailedAttempts(ipAddress);

    logger.warn('Failed login attempt recorded', {
      email,
      ipAddress,
      reason,
      attemptCount: attemptInfo.count,
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

    // Query database for failed attempts
    const attempts = await db
      .select({
        count: sql<number>`count(*)`,
        lastAttempt: sql<Date>`MAX(attempt_time)`,
      })
      .from(failedLoginAttempts)
      .where(
        and(
          eq(failedLoginAttempts.email, email),
          gte(failedLoginAttempts.attemptTime, oneHourAgo)
        )
      );

    const count = Number(attempts[0]?.count || 0);
    const lastAttempt = attempts[0]?.lastAttempt || new Date();

    // Check for active lockout
    const lockouts = await db
      .select()
      .from(accountLockouts)
      .where(
        and(
          eq(accountLockouts.email, email),
          isNull(accountLockouts.unlockedAt),
          or(
            isNull(accountLockouts.lockedUntil),
            gte(accountLockouts.lockedUntil, new Date())
          )
        )
      )
      .orderBy(accountLockouts.lockedAt)
      .limit(1);

    const lockout = lockouts[0];
    const isLocked = !!lockout;
    const lockoutUntil = lockout?.lockedUntil || undefined;

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
  userId?: string
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

      await db.insert(accountLockouts).values({
        email,
        lockoutType: 'temporary',
        lockedUntil: lockoutUntil,
        unlockedBy: userId,
        reason: 'Too many failed login attempts',
        attemptCount: attemptInfo.count,
      });

      // Update user record if user exists
      if (userId) {
        await db
          .update(users)
          .set({
            isAdmin: false, // Revoke admin access for security
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }

      // Clear cache
      await cache.delete(`failed_attempts:${email}`);

      // Log security event
      await db.insert(securityEvents).values({
        eventType: 'account_locked_temporary',
        severity: 'high',
        userId,
        description: `Account temporarily locked: ${email}`,
        metadata: {
          attempts: attemptInfo.count,
          lockoutUntil,
          reason: 'Too many failed login attempts',
        },
      });

      // Send notification
      await securityNotificationService.sendAccountLockedNotification(
        email,
        'temporary',
        lockoutUntil,
        'Too many failed login attempts'
      );

      logger.warn('Temporary account lockout applied', {
        email,
        userId,
        attempts: attemptInfo.count,
        lockoutUntil,
      });

      return {
        locked: true,
        lockoutType: 'temporary',
        lockoutUntil,
      };
    }

    // Check for permanent lockout
    if (attemptInfo.count >= LOCKOUT_CONFIG.permanentLockoutThreshold) {
      await db.insert(accountLockouts).values({
        email,
        lockoutType: 'permanent',
        unlockedBy: userId,
        reason: 'Excessive failed login attempts - requires admin unlock',
        attemptCount: attemptInfo.count,
      });

      // Update user record if user exists
      if (userId) {
        await db
          .update(users)
          .set({
            isAdmin: false,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }

      // Clear cache
      await cache.delete(`failed_attempts:${email}`);

      // Log critical security event
      await db.insert(securityEvents).values({
        eventType: 'account_locked_permanent',
        severity: 'critical',
        userId,
        description: `Account permanently locked: ${email}`,
        metadata: {
          attempts: attemptInfo.count,
          reason: 'Excessive failed login attempts',
          action: 'Requires admin unlock',
        },
      });

      // Send critical notification
      await securityNotificationService.sendAccountLockedNotification(
        email,
        'permanent',
        undefined,
        'Excessive failed login attempts - contact administrator'
      );

      // Also notify admins
      await securityNotificationService.sendSecurityAlert({
        type: 'account_locked',
        severity: 'critical',
        title: 'Account Permanently Locked',
        message: `Account ${email} has been permanently locked after ${attemptInfo.count} failed attempts. Manual admin intervention required.`,
        metadata: { email, attempts: attemptInfo.count },
      });

      logger.error('Permanent account lockout applied', {
        email,
        userId,
        attempts: attemptInfo.count,
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
 * Check IP-based failed attempts and auto-block if necessary
 */
async function checkIPFailedAttempts(ipAddress: string): Promise<void> {
  try {
    const oneHourAgo = new Date(Date.now() - LOCKOUT_CONFIG.attemptWindow);
    
    // Count failed attempts from this IP
    const result = await db
      .select({
        count: sql<number>`count(*)`,
        emails: sql<string[]>`array_agg(DISTINCT email)`,
      })
      .from(failedLoginAttempts)
      .where(
        and(
          eq(failedLoginAttempts.ipAddress, ipAddress),
          gte(failedLoginAttempts.attemptTime, oneHourAgo)
        )
      );

    const count = Number(result[0]?.count || 0);
    const emails = result[0]?.emails || [];

    // Auto-block IP if threshold reached
    if (count >= LOCKOUT_CONFIG.ipBlockThreshold) {
      await ipAccessControlService.blockIP(
        ipAddress,
        `Automatically blocked after ${count} failed login attempts affecting ${emails.length} accounts`,
        LOCKOUT_CONFIG.ipBlockDuration
      );

      // Log critical event
      await db.insert(securityEvents).values({
        eventType: 'ip_auto_blocked',
        severity: 'critical',
        ipAddress,
        description: `IP automatically blocked after ${count} failed attempts`,
        metadata: {
          attemptCount: count,
          affectedAccounts: emails,
          blockDuration: '24 hours',
        },
      });

      logger.warn('IP auto-blocked for excessive failed attempts', {
        ipAddress,
        attemptCount: count,
        affectedAccounts: emails.length,
      });
    }
  } catch (error) {
    logger.error('Error checking IP failed attempts', { error, ipAddress });
  }
}

/**
 * Clear failed attempts after successful login
 */
export async function clearFailedAttempts(email: string): Promise<void> {
  try {
    // Clear cache
    await cache.delete(`failed_attempts:${email}`);

    // Clear recent failed attempts
    const oneHourAgo = new Date(Date.now() - LOCKOUT_CONFIG.attemptWindow);
    await db
      .delete(failedLoginAttempts)
      .where(
        and(
          eq(failedLoginAttempts.email, email),
          gte(failedLoginAttempts.attemptTime, oneHourAgo)
        )
      );

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
  adminId: string,
  reason: string
): Promise<boolean> {
  try {
    // Mark lockouts as unlocked
    await db
      .update(accountLockouts)
      .set({
        unlockedAt: new Date(),
        unlockedBy: adminId,
      })
      .where(
        and(
          eq(accountLockouts.email, email),
          isNull(accountLockouts.unlockedAt)
        )
      );

    // Clear cache and failed attempts
    await clearFailedAttempts(email);

    // Log admin action
    await db.insert(securityEvents).values({
      eventType: 'account_unlocked',
      severity: 'info',
      userId: adminId,
      description: `Account ${email} unlocked by admin`,
      metadata: {
        email,
        reason,
        adminId,
      },
    });

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
 * Middleware to check for account lockout and apply progressive delays
 */
export async function checkAccountLockout(req: Request, email: string): Promise<{
  allowed: boolean;
  delay?: number;
  message?: string;
}> {
  const ipAddress = ipAccessControlService.getClientIP(req);

  // Check IP access control
  const ipCheck = await ipAccessControlService.checkIPAccess(ipAddress);
  if (ipCheck.blocked) {
    return {
      allowed: false,
      message: ipCheck.reason || 'Access denied from this IP address',
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

/**
 * Get geolocation for IP (basic implementation)
 */
async function getGeoLocation(ipAddress: string): Promise<any> {
  try {
    // Check if IP is private/local
    if (isPrivateIP(ipAddress)) {
      return {
        country: 'Local',
        city: 'Local',
        region: 'Local',
      };
    }

    // TODO: Integrate with real geolocation service
    // For now, return basic info
    return {
      country: 'Unknown',
      city: 'Unknown',
      region: 'Unknown',
    };
  } catch (error) {
    logger.error('Error getting geo location', { error, ipAddress });
    return null;
  }
}

/**
 * Check if IP is private/local
 */
function isPrivateIP(ip: string): boolean {
  return (
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('192.168.') ||
    ip === '127.0.0.1' ||
    ip === 'localhost' ||
    ip === '::1'
  );
}

/**
 * Clean up old failed attempts (run periodically)
 */
export async function cleanupOldAttempts(): Promise<void> {
  try {
    const cutoffDate = new Date(Date.now() - LOCKOUT_CONFIG.cleanupAge);

    const result = await db
      .delete(failedLoginAttempts)
      .where(gte(cutoffDate, failedLoginAttempts.attemptTime));

    logger.info('Cleaned up old failed login attempts', {
      deleted: result.length,
    });
  } catch (error) {
    logger.error('Error cleaning up failed attempts', { error });
  }
}

/**
 * Get failed login statistics
 */
export async function getFailedLoginStats(): Promise<{
  totalAttempts: number;
  uniqueEmails: number;
  uniqueIPs: number;
  lockedAccounts: number;
}> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [attempts, locked] = await Promise.all([
      db
        .select({
          total: sql<number>`count(*)`,
          emails: sql<number>`count(DISTINCT email)`,
          ips: sql<number>`count(DISTINCT ip_address)`,
        })
        .from(failedLoginAttempts)
        .where(gte(failedLoginAttempts.attemptTime, oneDayAgo)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(accountLockouts)
        .where(isNull(accountLockouts.unlockedAt)),
    ]);

    return {
      totalAttempts: Number(attempts[0]?.total || 0),
      uniqueEmails: Number(attempts[0]?.emails || 0),
      uniqueIPs: Number(attempts[0]?.ips || 0),
      lockedAccounts: Number(locked[0]?.count || 0),
    };
  } catch (error) {
    logger.error('Error getting failed login stats', { error });
    return {
      totalAttempts: 0,
      uniqueEmails: 0,
      uniqueIPs: 0,
      lockedAccounts: 0,
    };
  }
}

// Export the service
export default {
  recordFailedLogin,
  getFailedAttemptInfo,
  checkAndApplyLockout,
  clearFailedAttempts,
  unlockAccount,
  checkAccountLockout,
  cleanupOldAttempts,
  getFailedLoginStats,
};