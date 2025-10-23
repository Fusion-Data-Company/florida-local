/**
 * Session Security Service
 * 
 * Enterprise-grade session management with:
 * - Session invalidation on security events
 * - Concurrent session limits
 * - Device tracking and management
 * - Session hijack detection
 * - Geographic anomaly detection
 */

import { db } from './db';
import {
  userSessions,
  deviceFingerprints,
  sessionEvents,
  securityEvents,
  users
} from '../shared/schema';
import { eq, and, gte, desc, not, or, sql, isNull } from 'drizzle-orm';
import { redis, cache } from './redis';
import { logger } from './monitoring';
import { securityNotificationService } from './securityNotificationService';
import crypto from 'crypto';

// Configuration
const SESSION_CONFIG = {
  // Session limits
  maxConcurrentSessions: 5, // Max sessions per user
  maxDevices: 10, // Max registered devices per user
  
  // Session timeouts
  sessionTimeout: 30 * 60 * 1000, // 30 minutes of inactivity
  absoluteTimeout: 24 * 60 * 60 * 1000, // 24 hours absolute
  
  // Security settings
  detectSessionHijack: true,
  detectGeoAnomalies: true,
  requireDeviceApproval: false, // Require approval for new devices
  
  // Cache settings
  cachePrefix: 'session:',
  cacheTTL: 300, // 5 minutes
};

export interface SessionInfo {
  id: string;
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  location?: any;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

export interface DeviceInfo {
  id: string;
  fingerprint: string;
  name: string;
  type: string;
  os: string;
  browser: string;
  trusted: boolean;
  lastSeen: Date;
}

/**
 * Session Security Service
 */
export class SessionSecurityService {
  /**
   * Create a new session
   */
  async createSession(data: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    deviceFingerprint?: string;
    location?: any;
  }): Promise<SessionInfo> {
    try {
      // Check concurrent session limit
      await this.enforceSessionLimit(data.userId);
      
      // Check device fingerprint
      let deviceId: string | undefined;
      if (data.deviceFingerprint) {
        deviceId = await this.registerDevice(
          data.userId,
          data.deviceFingerprint,
          data.userAgent
        );
      }
      
      // Generate secure session token
      const token = this.generateSessionToken();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + SESSION_CONFIG.absoluteTimeout);
      
      // Create session in database
      const session = await db.insert(userSessions).values({
        userId: data.userId,
        token,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceId,
        location: data.location,
        lastActivity: now,
        expiresAt,
        isActive: true,
      }).returning();
      
      // Cache session info
      const sessionInfo: SessionInfo = {
        id: session[0].id,
        userId: data.userId,
        token,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceId,
        location: data.location,
        createdAt: session[0].createdAt,
        lastActivity: now,
        expiresAt,
      };
      
      await cache.set(
        `${SESSION_CONFIG.cachePrefix}${token}`,
        sessionInfo,
        SESSION_CONFIG.cacheTTL
      );
      
      // Log session event
      await this.logSessionEvent(session[0].id, 'session_created', data);
      
      logger.info('Session created', {
        userId: data.userId,
        sessionId: session[0].id,
        ipAddress: data.ipAddress,
      });
      
      return sessionInfo;
    } catch (error) {
      logger.error('Error creating session', { error, userId: data.userId });
      throw error;
    }
  }
  
  /**
   * Validate session and check for anomalies
   */
  async validateSession(
    token: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ valid: boolean; reason?: string; session?: SessionInfo }> {
    try {
      // Check cache first
      const cacheKey = `${SESSION_CONFIG.cachePrefix}${token}`;
      let session = await cache.get<SessionInfo>(cacheKey);
      
      if (!session) {
        // Load from database
        const dbSessions = await db
          .select()
          .from(userSessions)
          .where(
            and(
              eq(userSessions.token, token),
              eq(userSessions.isActive, true),
              gte(userSessions.expiresAt, new Date())
            )
          )
          .limit(1);
        
        if (dbSessions.length === 0) {
          return { valid: false, reason: 'Session not found or expired' };
        }
        
        const dbSession = dbSessions[0];
        session = {
          id: dbSession.id,
          userId: dbSession.userId,
          token: dbSession.token,
          ipAddress: dbSession.ipAddress,
          userAgent: dbSession.userAgent,
          deviceId: dbSession.deviceId || undefined,
          location: dbSession.location,
          createdAt: dbSession.createdAt,
          lastActivity: dbSession.lastActivity,
          expiresAt: dbSession.expiresAt,
        };
      }
      
      // Check for session timeout
      const inactivityTime = Date.now() - session.lastActivity.getTime();
      if (inactivityTime > SESSION_CONFIG.sessionTimeout) {
        await this.invalidateSession(token, 'timeout');
        return { valid: false, reason: 'Session timeout due to inactivity' };
      }
      
      // Check for session hijack
      if (SESSION_CONFIG.detectSessionHijack) {
        const hijackDetected = await this.detectSessionHijack(
          session,
          ipAddress,
          userAgent
        );
        
        if (hijackDetected) {
          await this.handleSessionHijack(session, ipAddress, userAgent);
          return { valid: false, reason: 'Session hijack detected' };
        }
      }
      
      // Check for geographic anomaly
      if (SESSION_CONFIG.detectGeoAnomalies && session.ipAddress !== ipAddress) {
        const anomalyDetected = await this.detectGeographicAnomaly(
          session,
          ipAddress
        );
        
        if (anomalyDetected) {
          await this.handleGeographicAnomaly(session, ipAddress);
          return { valid: false, reason: 'Geographic anomaly detected' };
        }
      }
      
      // Update last activity
      await this.updateSessionActivity(session.id);
      
      // Refresh cache
      session.lastActivity = new Date();
      await cache.set(cacheKey, session, SESSION_CONFIG.cacheTTL);
      
      return { valid: true, session };
    } catch (error) {
      logger.error('Error validating session', { error, token });
      return { valid: false, reason: 'Session validation error' };
    }
  }
  
  /**
   * Invalidate a session
   */
  async invalidateSession(
    token: string,
    reason: string,
    invalidatedBy?: string
  ): Promise<void> {
    try {
      // Update database
      await db
        .update(userSessions)
        .set({
          isActive: false,
          invalidatedAt: new Date(),
          invalidationReason: reason,
        })
        .where(eq(userSessions.token, token));
      
      // Clear cache
      await cache.delete(`${SESSION_CONFIG.cachePrefix}${token}`);
      
      // Log event
      const [session] = await db
        .select()
        .from(userSessions)
        .where(eq(userSessions.token, token))
        .limit(1);
      
      if (session) {
        await this.logSessionEvent(session.id, 'session_invalidated', {
          reason,
          invalidatedBy,
        });
      }
      
      logger.info('Session invalidated', { token, reason });
    } catch (error) {
      logger.error('Error invalidating session', { error, token });
    }
  }
  
  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(
    userId: string,
    reason: string,
    exceptToken?: string
  ): Promise<void> {
    try {
      // Get all active sessions
      const sessions = await db
        .select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.userId, userId),
            eq(userSessions.isActive, true),
            exceptToken ? not(eq(userSessions.token, exceptToken)) : undefined
          )
        );
      
      // Invalidate each session
      for (const session of sessions) {
        await this.invalidateSession(session.token, reason);
      }
      
      // Log security event
      await db.insert(securityEvents).values({
        eventType: 'all_sessions_invalidated',
        severity: 'warning',
        userId,
        description: `All sessions invalidated: ${reason}`,
        metadata: { sessionCount: sessions.length, reason },
      });
      
      logger.info('All user sessions invalidated', {
        userId,
        sessionCount: sessions.length,
        reason,
      });
    } catch (error) {
      logger.error('Error invalidating all user sessions', { error, userId });
    }
  }
  
  /**
   * Enforce concurrent session limit
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    try {
      // Get active sessions
      const sessions = await db
        .select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.userId, userId),
            eq(userSessions.isActive, true)
          )
        )
        .orderBy(userSessions.createdAt);
      
      // If over limit, invalidate oldest sessions
      if (sessions.length >= SESSION_CONFIG.maxConcurrentSessions) {
        const sessionsToInvalidate = sessions.slice(
          0,
          sessions.length - SESSION_CONFIG.maxConcurrentSessions + 1
        );
        
        for (const session of sessionsToInvalidate) {
          await this.invalidateSession(
            session.token,
            'concurrent_session_limit_exceeded'
          );
        }
        
        logger.info('Session limit enforced', {
          userId,
          invalidatedCount: sessionsToInvalidate.length,
        });
      }
    } catch (error) {
      logger.error('Error enforcing session limit', { error, userId });
    }
  }
  
  /**
   * Register a device
   */
  private async registerDevice(
    userId: string,
    fingerprint: string,
    userAgent: string
  ): Promise<string> {
    try {
      // Check if device already exists
      const existing = await db
        .select()
        .from(deviceFingerprints)
        .where(
          and(
            eq(deviceFingerprints.userId, userId),
            eq(deviceFingerprints.fingerprint, fingerprint)
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        // Update last seen
        await db
          .update(deviceFingerprints)
          .set({ lastSeenAt: new Date() })
          .where(eq(deviceFingerprints.id, existing[0].id));
        
        return existing[0].id;
      }
      
      // Parse device info from user agent
      const deviceInfo = this.parseUserAgent(userAgent);
      
      // Create new device
      const [device] = await db.insert(deviceFingerprints).values({
        userId,
        fingerprint,
        deviceName: deviceInfo.name,
        deviceType: deviceInfo.type,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        isTrusted: false, // New devices are untrusted by default
        lastSeenAt: new Date(),
      }).returning();
      
      // Check device limit
      const deviceCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(deviceFingerprints)
        .where(eq(deviceFingerprints.userId, userId))
        .then(r => Number(r[0]?.count || 0));
      
      if (deviceCount > SESSION_CONFIG.maxDevices) {
        // Remove oldest untrusted device
        const oldestUntrusted = await db
          .select()
          .from(deviceFingerprints)
          .where(
            and(
              eq(deviceFingerprints.userId, userId),
              eq(deviceFingerprints.isTrusted, false)
            )
          )
          .orderBy(deviceFingerprints.lastSeenAt)
          .limit(1);
        
        if (oldestUntrusted.length > 0) {
          await db
            .delete(deviceFingerprints)
            .where(eq(deviceFingerprints.id, oldestUntrusted[0].id));
        }
      }
      
      // Send notification about new device
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (user.length > 0 && user[0].email) {
        await securityNotificationService.sendSecurityAlert({
          type: 'new_device',
          severity: 'info',
          title: 'New Device Detected',
          message: `A new device has been used to access your account: ${deviceInfo.name}`,
          recipientEmail: user[0].email,
          metadata: { deviceInfo, fingerprint },
        });
      }
      
      logger.info('New device registered', {
        userId,
        deviceId: device.id,
        deviceInfo,
      });
      
      return device.id;
    } catch (error) {
      logger.error('Error registering device', { error, userId });
      throw error;
    }
  }
  
  /**
   * Detect session hijack
   */
  private async detectSessionHijack(
    session: SessionInfo,
    newIP: string,
    newUserAgent: string
  ): Promise<boolean> {
    try {
      // Check for IP change
      const ipChanged = session.ipAddress !== newIP;
      
      // Check for user agent change
      const userAgentChanged = session.userAgent !== newUserAgent;
      
      // If both changed, likely hijack
      if (ipChanged && userAgentChanged) {
        logger.warn('Potential session hijack detected', {
          sessionId: session.id,
          originalIP: session.ipAddress,
          newIP,
          originalUA: session.userAgent,
          newUA: newUserAgent,
        });
        return true;
      }
      
      // If only IP changed, check if it's a known device
      if (ipChanged && session.deviceId) {
        const device = await db
          .select()
          .from(deviceFingerprints)
          .where(
            and(
              eq(deviceFingerprints.id, session.deviceId),
              eq(deviceFingerprints.isTrusted, true)
            )
          )
          .limit(1);
        
        // Trusted device, allow IP change
        if (device.length > 0) {
          return false;
        }
      }
      
      return false;
    } catch (error) {
      logger.error('Error detecting session hijack', { error });
      return false;
    }
  }
  
  /**
   * Handle session hijack
   */
  private async handleSessionHijack(
    session: SessionInfo,
    newIP: string,
    newUserAgent: string
  ): Promise<void> {
    try {
      // Invalidate all user sessions immediately
      await this.invalidateAllUserSessions(
        session.userId,
        'session_hijack_detected'
      );
      
      // Log critical security event
      await db.insert(securityEvents).values({
        eventType: 'session_hijack',
        severity: 'critical',
        userId: session.userId,
        ipAddress: newIP,
        userAgent: newUserAgent,
        description: 'Session hijacking attempt detected and blocked',
        metadata: {
          originalIP: session.ipAddress,
          newIP,
          originalUserAgent: session.userAgent,
          newUserAgent,
          sessionId: session.id,
        },
      });
      
      // Send critical alert
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);
      
      if (user.length > 0 && user[0].email) {
        await securityNotificationService.sendSecurityAlert({
          type: 'session_hijack',
          severity: 'critical',
          title: 'CRITICAL: Session Hijack Detected',
          message: `A session hijacking attempt was detected and blocked. All your sessions have been terminated for security. Please log in again from a trusted device.`,
          recipientEmail: user[0].email,
          metadata: {
            originalIP: session.ipAddress,
            newIP,
            sessionId: session.id,
          },
        });
      }
      
      logger.error('Session hijack handled', {
        userId: session.userId,
        sessionId: session.id,
        originalIP: session.ipAddress,
        newIP,
      });
    } catch (error) {
      logger.error('Error handling session hijack', { error });
    }
  }
  
  /**
   * Detect geographic anomaly
   */
  private async detectGeographicAnomaly(
    session: SessionInfo,
    newIP: string
  ): Promise<boolean> {
    try {
      // Get geographic locations
      const originalLocation = session.location || await this.getIPLocation(session.ipAddress);
      const newLocation = await this.getIPLocation(newIP);
      
      if (!originalLocation || !newLocation) {
        return false;
      }
      
      // Calculate distance between locations
      const distance = this.calculateDistance(
        originalLocation.latitude,
        originalLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      );
      
      // Calculate time difference
      const timeDiff = Date.now() - session.lastActivity.getTime();
      const hoursDiff = timeDiff / (60 * 60 * 1000);
      
      // Check if travel is physically impossible (>500 mph)
      const speed = distance / hoursDiff;
      if (speed > 500) {
        logger.warn('Geographic anomaly detected', {
          sessionId: session.id,
          distance,
          hoursDiff,
          speed,
          originalLocation: originalLocation.country,
          newLocation: newLocation.country,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error detecting geographic anomaly', { error });
      return false;
    }
  }
  
  /**
   * Handle geographic anomaly
   */
  private async handleGeographicAnomaly(
    session: SessionInfo,
    newIP: string
  ): Promise<void> {
    try {
      // Log suspicious activity
      await db.insert(securityEvents).values({
        eventType: 'geographic_anomaly',
        severity: 'high',
        userId: session.userId,
        ipAddress: newIP,
        description: 'Suspicious geographic location change detected',
        metadata: {
          originalIP: session.ipAddress,
          newIP,
          sessionId: session.id,
        },
      });
      
      // Send alert
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);
      
      if (user.length > 0 && user[0].email) {
        await securityNotificationService.sendSecurityAlert({
          type: 'suspicious_activity',
          severity: 'high',
          title: 'Suspicious Activity Detected',
          message: `Your account was accessed from an unusual location. If this wasn't you, please secure your account immediately.`,
          recipientEmail: user[0].email,
          metadata: {
            originalIP: session.ipAddress,
            newIP,
            sessionId: session.id,
          },
        });
      }
      
      logger.warn('Geographic anomaly handled', {
        userId: session.userId,
        sessionId: session.id,
        originalIP: session.ipAddress,
        newIP,
      });
    } catch (error) {
      logger.error('Error handling geographic anomaly', { error });
    }
  }
  
  /**
   * Update session last activity
   */
  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await db
        .update(userSessions)
        .set({ lastActivity: new Date() })
        .where(eq(userSessions.id, sessionId));
    } catch (error) {
      logger.error('Error updating session activity', { error, sessionId });
    }
  }
  
  /**
   * Log session event
   */
  private async logSessionEvent(
    sessionId: string,
    eventType: string,
    metadata?: any
  ): Promise<void> {
    try {
      await db.insert(sessionEvents).values({
        sessionId,
        eventType,
        metadata,
      });
    } catch (error) {
      logger.error('Error logging session event', { error, sessionId, eventType });
    }
  }
  
  /**
   * Generate secure session token
   */
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Parse user agent string
   */
  private parseUserAgent(userAgent: string): {
    name: string;
    type: string;
    os: string;
    browser: string;
  } {
    // Simple parsing - can be enhanced with a proper user-agent library
    let os = 'Unknown';
    let browser = 'Unknown';
    let type = 'desktop';
    
    // Detect OS
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) { os = 'Android'; type = 'mobile'; }
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) { os = 'iOS'; type = 'mobile'; }
    
    // Detect Browser
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    const name = `${browser} on ${os}`;
    
    return { name, type, os, browser };
  }
  
  /**
   * Get IP location (mock implementation)
   */
  private async getIPLocation(ip: string): Promise<any> {
    // TODO: Integrate with real IP geolocation service
    return {
      country: 'United States',
      city: 'Miami',
      latitude: 25.7617,
      longitude: -80.1918,
    };
  }
  
  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
  /**
   * Get session statistics
   */
  async getSessionStats(userId?: string): Promise<{
    activeSessions: number;
    trustedDevices: number;
    recentEvents: number;
    suspiciousActivities: number;
  }> {
    try {
      const conditions = userId ? [eq(userSessions.userId, userId)] : [];
      const deviceConditions = userId ? [eq(deviceFingerprints.userId, userId)] : [];
      
      const [active, devices, events, suspicious] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(userSessions)
          .where(
            and(
              eq(userSessions.isActive, true),
              ...conditions
            )
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(deviceFingerprints)
          .where(
            and(
              eq(deviceFingerprints.isTrusted, true),
              ...deviceConditions
            )
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(sessionEvents)
          .where(
            gte(sessionEvents.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(securityEvents)
          .where(
            and(
              or(
                eq(securityEvents.eventType, 'session_hijack'),
                eq(securityEvents.eventType, 'geographic_anomaly')
              ),
              gte(securityEvents.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
            )
          ),
      ]);
      
      return {
        activeSessions: Number(active[0]?.count || 0),
        trustedDevices: Number(devices[0]?.count || 0),
        recentEvents: Number(events[0]?.count || 0),
        suspiciousActivities: Number(suspicious[0]?.count || 0),
      };
    } catch (error) {
      logger.error('Error getting session stats', { error });
      return {
        activeSessions: 0,
        trustedDevices: 0,
        recentEvents: 0,
        suspiciousActivities: 0,
      };
    }
  }
}

// Export singleton instance
export const sessionSecurity = new SessionSecurityService();