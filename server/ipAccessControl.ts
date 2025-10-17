/**
 * IP Access Control System
 * 
 * Fortune 500-grade IP management with:
 * - IP blocking/allowlisting
 * - Automatic blocking after failures
 * - Geographic restrictions
 * - CIDR range support
 * - Redis caching with PostgreSQL fallback
 */

import { db } from './db';
import { 
  ipAccessControl,
  geoRestrictions,
  failedLoginAttempts,
  securityEvents,
  securityNotifications
} from '../shared/schema';
import { eq, and, or, gte, sql, desc, isNull } from 'drizzle-orm';
import { redis, cache } from './redis';
import { logger } from './monitoring';
import { Request } from 'express';
import { SecurityNotificationService } from './securityNotificationService';

// Configuration
const IP_CONTROL_CONFIG = {
  // Auto-blocking thresholds
  autoBlockThreshold: 10, // Block after 10 failed attempts
  autoBlockDuration: 24 * 60 * 60 * 1000, // 24 hours

  // Cache settings
  cachePrefix: 'ip_access:',
  cacheTTL: 300, // 5 minutes

  // Geographic blocking
  enableGeoBlocking: true,
  defaultAllowCountries: ['US', 'CA', 'GB', 'AU'], // Default allowed countries
};

export interface IPCheckResult {
  allowed: boolean;
  blocked: boolean;
  reason?: string;
  country?: string;
  region?: string;
  metadata?: any;
}

export interface GeoLocation {
  country: string;
  countryCode: string;
  region?: string;
  regionCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

/**
 * IP Access Control Service
 */
export class IPAccessControlService {
  private notificationService: SecurityNotificationService;

  constructor() {
    this.notificationService = new SecurityNotificationService();
  }

  /**
   * Extract IP address from request
   */
  getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const real = req.headers['x-real-ip'] as string;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (real) {
      return real;
    }
    
    return req.socket.remoteAddress || '0.0.0.0';
  }

  /**
   * Check if IP is allowed or blocked
   */
  async checkIPAccess(ipAddress: string): Promise<IPCheckResult> {
    try {
      // Check cache first
      const cacheKey = `${IP_CONTROL_CONFIG.cachePrefix}${ipAddress}`;
      const cached = await cache.get<IPCheckResult>(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Check explicit IP rules
      const ipRule = await this.getIPRule(ipAddress);
      
      if (ipRule) {
        const result: IPCheckResult = {
          allowed: ipRule.accessType === 'allow',
          blocked: ipRule.accessType === 'block',
          reason: ipRule.reason || `IP ${ipRule.accessType}ed by rule`,
        };

        // Cache result
        await cache.set(cacheKey, result, IP_CONTROL_CONFIG.cacheTTL);
        return result;
      }

      // Check geographic restrictions if enabled
      if (IP_CONTROL_CONFIG.enableGeoBlocking) {
        const geoResult = await this.checkGeoRestrictions(ipAddress);
        if (geoResult.blocked) {
          await cache.set(cacheKey, geoResult, IP_CONTROL_CONFIG.cacheTTL);
          return geoResult;
        }
      }

      // Check auto-block based on failed attempts
      const autoBlockResult = await this.checkAutoBlock(ipAddress);
      if (autoBlockResult.blocked) {
        await cache.set(cacheKey, autoBlockResult, IP_CONTROL_CONFIG.cacheTTL);
        return autoBlockResult;
      }

      // Default: allow
      const result: IPCheckResult = { allowed: true, blocked: false };
      await cache.set(cacheKey, result, IP_CONTROL_CONFIG.cacheTTL);
      return result;
    } catch (error) {
      logger.error('Error checking IP access', { error, ipAddress });
      // On error, allow access to prevent lockouts
      return { allowed: true, blocked: false };
    }
  }

  /**
   * Get IP rule from database
   */
  private async getIPRule(ipAddress: string): Promise<typeof ipAccessControl.$inferSelect | null> {
    try {
      const now = new Date();
      
      // Check exact IP match or CIDR range
      const rules = await db
        .select()
        .from(ipAccessControl)
        .where(
          and(
            eq(ipAccessControl.isActive, true),
            or(
              isNull(ipAccessControl.expiresAt),
              gte(ipAccessControl.expiresAt, now)
            )
          )
        );

      // Check exact match
      const exactMatch = rules.find(r => r.ipAddress === ipAddress);
      if (exactMatch) return exactMatch;

      // Check CIDR ranges
      for (const rule of rules) {
        if (rule.ipRange && this.isIPInRange(ipAddress, rule.ipRange)) {
          return rule;
        }
        if (rule.ipAddress.includes('/') && this.isIPInCIDR(ipAddress, rule.ipAddress)) {
          return rule;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error getting IP rule', { error, ipAddress });
      return null;
    }
  }

  /**
   * Check geographic restrictions
   */
  private async checkGeoRestrictions(ipAddress: string): Promise<IPCheckResult> {
    try {
      const geo = await this.getGeoLocation(ipAddress);
      
      if (!geo) {
        return { allowed: true, blocked: false };
      }

      // Get active geo restrictions
      const restrictions = await db
        .select()
        .from(geoRestrictions)
        .where(eq(geoRestrictions.isActive, true));

      // Check country-level restrictions
      const countryRestriction = restrictions.find(
        r => r.countryCode === geo.countryCode && !r.regionCode
      );

      if (countryRestriction) {
        return {
          allowed: countryRestriction.restrictionType === 'allow',
          blocked: countryRestriction.restrictionType === 'block',
          reason: countryRestriction.reason || `Country ${geo.country} is ${countryRestriction.restrictionType}ed`,
          country: geo.country,
          region: geo.region,
        };
      }

      // Check region-level restrictions
      if (geo.regionCode) {
        const regionRestriction = restrictions.find(
          r => r.countryCode === geo.countryCode && r.regionCode === geo.regionCode
        );

        if (regionRestriction) {
          return {
            allowed: regionRestriction.restrictionType === 'allow',
            blocked: regionRestriction.restrictionType === 'block',
            reason: regionRestriction.reason || `Region ${geo.region} is ${regionRestriction.restrictionType}ed`,
            country: geo.country,
            region: geo.region,
          };
        }
      }

      // Default: check if country is in allowed list
      if (IP_CONTROL_CONFIG.defaultAllowCountries.length > 0) {
        const isAllowed = IP_CONTROL_CONFIG.defaultAllowCountries.includes(geo.countryCode);
        return {
          allowed: isAllowed,
          blocked: !isAllowed,
          reason: isAllowed ? undefined : `Country ${geo.country} is not in allowed list`,
          country: geo.country,
          region: geo.region,
        };
      }

      return { allowed: true, blocked: false, country: geo.country, region: geo.region };
    } catch (error) {
      logger.error('Error checking geo restrictions', { error, ipAddress });
      return { allowed: true, blocked: false };
    }
  }

  /**
   * Check for auto-blocking based on failed attempts
   */
  private async checkAutoBlock(ipAddress: string): Promise<IPCheckResult> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Count recent failed attempts from this IP
      const failedCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(failedLoginAttempts)
        .where(
          and(
            eq(failedLoginAttempts.ipAddress, ipAddress),
            gte(failedLoginAttempts.attemptTime, oneHourAgo)
          )
        )
        .then(result => Number(result[0]?.count || 0));

      if (failedCount >= IP_CONTROL_CONFIG.autoBlockThreshold) {
        // Auto-block this IP
        await this.autoBlockIP(ipAddress, failedCount);
        
        return {
          allowed: false,
          blocked: true,
          reason: `IP automatically blocked after ${failedCount} failed attempts`,
          metadata: { failedCount },
        };
      }

      return { allowed: true, blocked: false };
    } catch (error) {
      logger.error('Error checking auto-block', { error, ipAddress });
      return { allowed: true, blocked: false };
    }
  }

  /**
   * Automatically block an IP address
   */
  private async autoBlockIP(ipAddress: string, attemptCount: number): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + IP_CONTROL_CONFIG.autoBlockDuration);
      
      // Check if already blocked
      const existing = await db
        .select()
        .from(ipAccessControl)
        .where(
          and(
            eq(ipAccessControl.ipAddress, ipAddress),
            eq(ipAccessControl.accessType, 'block'),
            eq(ipAccessControl.isActive, true)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        // Add block rule
        await db.insert(ipAccessControl).values({
          ipAddress,
          accessType: 'block',
          reason: `Auto-blocked after ${attemptCount} failed login attempts`,
          expiresAt,
          isActive: true,
        });

        // Log security event
        await db.insert(securityEvents).values({
          eventType: 'ip_auto_blocked',
          severity: 'high',
          ipAddress,
          description: `IP address automatically blocked after ${attemptCount} failed login attempts`,
          metadata: { attemptCount, expiresAt },
        });

        // Send notification
        await this.notificationService.sendSecurityAlert({
          type: 'ip_blocked',
          severity: 'high',
          title: 'IP Address Auto-Blocked',
          message: `IP ${ipAddress} was automatically blocked after ${attemptCount} failed login attempts. Block expires at ${expiresAt.toISOString()}.`,
          metadata: { ipAddress, attemptCount, expiresAt },
        });

        logger.warn('IP auto-blocked', { ipAddress, attemptCount, expiresAt });
      }
    } catch (error) {
      logger.error('Error auto-blocking IP', { error, ipAddress });
    }
  }

  /**
   * Block an IP address manually
   */
  async blockIP(
    ipAddress: string,
    reason: string,
    duration?: number,
    createdBy?: string
  ): Promise<void> {
    try {
      const expiresAt = duration ? new Date(Date.now() + duration) : undefined;
      
      await db.insert(ipAccessControl).values({
        ipAddress,
        accessType: 'block',
        reason,
        expiresAt,
        isActive: true,
        createdBy,
      });

      // Clear cache
      await cache.delete(`${IP_CONTROL_CONFIG.cachePrefix}${ipAddress}`);

      // Log event
      await db.insert(securityEvents).values({
        eventType: 'ip_manually_blocked',
        severity: 'warning',
        userId: createdBy,
        ipAddress,
        description: `IP address manually blocked: ${reason}`,
        metadata: { expiresAt },
      });

      logger.info('IP blocked', { ipAddress, reason, expiresAt, createdBy });
    } catch (error) {
      logger.error('Error blocking IP', { error, ipAddress });
      throw error;
    }
  }

  /**
   * Allow an IP address
   */
  async allowIP(
    ipAddress: string,
    reason: string,
    createdBy?: string
  ): Promise<void> {
    try {
      await db.insert(ipAccessControl).values({
        ipAddress,
        accessType: 'allow',
        reason,
        isActive: true,
        createdBy,
      });

      // Clear cache
      await cache.delete(`${IP_CONTROL_CONFIG.cachePrefix}${ipAddress}`);

      // Log event
      await db.insert(securityEvents).values({
        eventType: 'ip_allowlisted',
        severity: 'info',
        userId: createdBy,
        ipAddress,
        description: `IP address allowlisted: ${reason}`,
      });

      logger.info('IP allowlisted', { ipAddress, reason, createdBy });
    } catch (error) {
      logger.error('Error allowlisting IP', { error, ipAddress });
      throw error;
    }
  }

  /**
   * Unblock an IP address
   */
  async unblockIP(ipAddress: string, unblockedBy: string): Promise<void> {
    try {
      await db
        .update(ipAccessControl)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(ipAccessControl.ipAddress, ipAddress),
            eq(ipAccessControl.accessType, 'block'),
            eq(ipAccessControl.isActive, true)
          )
        );

      // Clear cache
      await cache.delete(`${IP_CONTROL_CONFIG.cachePrefix}${ipAddress}`);

      // Log event
      await db.insert(securityEvents).values({
        eventType: 'ip_unblocked',
        severity: 'info',
        userId: unblockedBy,
        ipAddress,
        description: `IP address unblocked`,
      });

      logger.info('IP unblocked', { ipAddress, unblockedBy });
    } catch (error) {
      logger.error('Error unblocking IP', { error, ipAddress });
      throw error;
    }
  }

  /**
   * Add geographic restriction
   */
  async addGeoRestriction(
    countryCode: string,
    restrictionType: 'block' | 'allow',
    regionCode?: string,
    reason?: string,
    createdBy?: string
  ): Promise<void> {
    try {
      await db.insert(geoRestrictions).values({
        countryCode,
        regionCode,
        restrictionType,
        reason,
        isActive: true,
        createdBy,
      });

      // Clear all IP caches (geo restrictions affect all IPs)
      await this.clearAllIPCaches();

      logger.info('Geo restriction added', { countryCode, regionCode, restrictionType });
    } catch (error) {
      logger.error('Error adding geo restriction', { error, countryCode });
      throw error;
    }
  }

  /**
   * Get geolocation for IP (mock implementation - replace with real service)
   */
  private async getGeoLocation(ipAddress: string): Promise<GeoLocation | null> {
    try {
      // Check if IP is private/local
      if (this.isPrivateIP(ipAddress)) {
        return {
          country: 'Local',
          countryCode: 'US',
          region: 'Local',
          regionCode: 'LOCAL',
        };
      }

      // TODO: Integrate with a real IP geolocation service like:
      // - MaxMind GeoIP2
      // - IP2Location
      // - ipapi.co
      // - ipinfo.io

      // For now, return mock data for testing
      return {
        country: 'United States',
        countryCode: 'US',
        region: 'Florida',
        regionCode: 'FL',
        city: 'Miami',
        latitude: 25.7617,
        longitude: -80.1918,
        timezone: 'America/New_York',
      };
    } catch (error) {
      logger.error('Error getting geo location', { error, ipAddress });
      return null;
    }
  }

  /**
   * Check if IP is in CIDR range
   */
  private isIPInCIDR(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split('/');
      if (!bits) return false;

      const mask = -1 << (32 - parseInt(bits));
      const ipNum = this.ipToNumber(ip);
      const rangeNum = this.ipToNumber(range);

      return (ipNum & mask) === (rangeNum & mask);
    } catch {
      return false;
    }
  }

  /**
   * Check if IP is in range (e.g., "192.168.1.1-192.168.1.255")
   */
  private isIPInRange(ip: string, range: string): boolean {
    try {
      const [start, end] = range.split('-').map(s => s.trim());
      if (!start || !end) return false;

      const ipNum = this.ipToNumber(ip);
      const startNum = this.ipToNumber(start);
      const endNum = this.ipToNumber(end);

      return ipNum >= startNum && ipNum <= endNum;
    } catch {
      return false;
    }
  }

  /**
   * Convert IP address to number for comparison
   */
  private ipToNumber(ip: string): number {
    const parts = ip.split('.');
    return parts.reduce((acc, part, i) => {
      return acc + (parseInt(part) << (8 * (3 - i)));
    }, 0);
  }

  /**
   * Check if IP is private/local
   */
  private isPrivateIP(ip: string): boolean {
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
   * Clear all IP access caches
   */
  private async clearAllIPCaches(): Promise<void> {
    try {
      if (redis) {
        const keys = await redis.keys(`${IP_CONTROL_CONFIG.cachePrefix}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch (error) {
      logger.error('Error clearing IP caches', { error });
    }
  }

  /**
   * Get IP access statistics
   */
  async getIPStats(): Promise<{
    blockedIPs: number;
    allowedIPs: number;
    geoRestrictions: number;
    recentBlocks: number;
  }> {
    try {
      const [blocked, allowed, geoRules, recentEvents] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(ipAccessControl)
          .where(
            and(
              eq(ipAccessControl.accessType, 'block'),
              eq(ipAccessControl.isActive, true)
            )
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(ipAccessControl)
          .where(
            and(
              eq(ipAccessControl.accessType, 'allow'),
              eq(ipAccessControl.isActive, true)
            )
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(geoRestrictions)
          .where(eq(geoRestrictions.isActive, true)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(securityEvents)
          .where(
            and(
              eq(securityEvents.eventType, 'ip_auto_blocked'),
              gte(securityEvents.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
            )
          ),
      ]);

      return {
        blockedIPs: Number(blocked[0]?.count || 0),
        allowedIPs: Number(allowed[0]?.count || 0),
        geoRestrictions: Number(geoRules[0]?.count || 0),
        recentBlocks: Number(recentEvents[0]?.count || 0),
      };
    } catch (error) {
      logger.error('Error getting IP stats', { error });
      return {
        blockedIPs: 0,
        allowedIPs: 0,
        geoRestrictions: 0,
        recentBlocks: 0,
      };
    }
  }
}

// Export singleton instance
export const ipAccessControl = new IPAccessControlService();