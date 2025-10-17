/**
 * Security Notification Service
 * 
 * Handles all security-related notifications including:
 * - Email alerts for security events
 * - SMS alerts for critical issues
 * - Notification queueing and processing
 * - Template management
 * - Fallback mechanisms
 */

import { db } from './db';
import { 
  securityNotifications,
  securityEvents,
  users,
  failedLoginAttempts,
  accountLockouts
} from '../shared/schema';
import { eq, and, gte, lte, desc, asc, or, inArray } from 'drizzle-orm';
import { EmailService } from './emailService';
import { SMSService } from './smsService';
import { redis, cache } from './redis';
import { logger } from './monitoring';

// Configuration
const NOTIFICATION_CONFIG = {
  // Admin emails for critical alerts
  adminEmails: process.env.ADMIN_EMAILS?.split(',') || ['admin@floridaelite.com'],
  adminPhones: process.env.ADMIN_PHONES?.split(',') || [],
  
  // Notification settings
  maxRetries: 3,
  retryDelay: 5 * 60 * 1000, // 5 minutes
  batchSize: 10,
  processingInterval: 30 * 1000, // 30 seconds
  
  // Priority thresholds
  criticalThreshold: 5, // Send SMS if more than 5 critical events in 15 minutes
  highThreshold: 10, // Escalate if more than 10 high severity events in 1 hour
  
  // Rate limiting
  maxEmailsPerHour: 100,
  maxSMSPerHour: 20,
  
  // Templates
  enableTemplates: true,
};

export interface SecurityAlert {
  type: string;
  severity: 'info' | 'warning' | 'high' | 'critical';
  title: string;
  message: string;
  metadata?: any;
  recipientEmail?: string;
  recipientPhone?: string;
}

export interface NotificationTemplate {
  type: string;
  subject: string;
  emailTemplate: string;
  smsTemplate: string;
}

/**
 * Security Notification Service
 */
export class SecurityNotificationService {
  private emailService: EmailService;
  private smsService: SMSService;
  private processingTimer?: NodeJS.Timeout;
  private templates: Map<string, NotificationTemplate>;

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.templates = new Map();
    
    this.initializeTemplates();
    this.startProcessing();
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates(): void {
    // Failed login template
    this.templates.set('failed_login', {
      type: 'failed_login',
      subject: '🔒 Security Alert: Failed Login Attempts',
      emailTemplate: `
        <h2>Security Alert: Failed Login Attempts</h2>
        <p>Multiple failed login attempts have been detected for your account.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> {{email}}</p>
          <p><strong>Attempts:</strong> {{attempts}}</p>
          <p><strong>IP Address:</strong> {{ipAddress}}</p>
          <p><strong>Time:</strong> {{timestamp}}</p>
          <p><strong>Location:</strong> {{location}}</p>
        </div>
        <p>If this wasn't you, please secure your account immediately.</p>
        <p style="margin-top: 30px;">
          <a href="{{resetLink}}" style="background: #ff6b6b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
      `,
      smsTemplate: 'Security Alert: {{attempts}} failed login attempts from {{ipAddress}}. If this wasn\'t you, secure your account at {{resetLink}}'
    });

    // Account locked template
    this.templates.set('account_locked', {
      type: 'account_locked',
      subject: '🚫 Account Locked for Security',
      emailTemplate: `
        <h2>Your Account Has Been Locked</h2>
        <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Lock Type:</strong> {{lockType}}</p>
          <p><strong>Locked Until:</strong> {{lockedUntil}}</p>
          <p><strong>Reason:</strong> {{reason}}</p>
        </div>
        <p>To unlock your account, please contact support or wait for the lockout period to expire.</p>
      `,
      smsTemplate: 'Your account has been locked due to security concerns. {{lockType}} lock until {{lockedUntil}}. Contact support for assistance.'
    });

    // IP blocked template
    this.templates.set('ip_blocked', {
      type: 'ip_blocked',
      subject: '🛡️ IP Address Blocked',
      emailTemplate: `
        <h2>IP Address Has Been Blocked</h2>
        <p>An IP address has been blocked from accessing the platform.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>IP Address:</strong> {{ipAddress}}</p>
          <p><strong>Reason:</strong> {{reason}}</p>
          <p><strong>Attempts:</strong> {{attemptCount}}</p>
          <p><strong>Expires:</strong> {{expiresAt}}</p>
        </div>
        <p>This is an automated security measure. The block will expire automatically or can be removed by an administrator.</p>
      `,
      smsTemplate: 'CRITICAL: IP {{ipAddress}} blocked after {{attemptCount}} failed attempts. Expires: {{expiresAt}}'
    });

    // Suspicious activity template
    this.templates.set('suspicious_activity', {
      type: 'suspicious_activity',
      subject: '⚠️ Suspicious Activity Detected',
      emailTemplate: `
        <h2>Suspicious Activity Detected</h2>
        <p>Unusual activity has been detected on your account.</p>
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Activity Type:</strong> {{activityType}}</p>
          <p><strong>Description:</strong> {{description}}</p>
          <p><strong>IP Address:</strong> {{ipAddress}}</p>
          <p><strong>Location:</strong> {{location}}</p>
          <p><strong>Time:</strong> {{timestamp}}</p>
        </div>
        <h3>Recommended Actions:</h3>
        <ul>
          <li>Review your recent account activity</li>
          <li>Change your password if you don't recognize this activity</li>
          <li>Enable two-factor authentication</li>
          <li>Contact support if you need assistance</li>
        </ul>
      `,
      smsTemplate: 'Suspicious activity: {{activityType}} from {{location}}. Secure your account if this wasn\'t you.'
    });

    // Session hijack template
    this.templates.set('session_hijack', {
      type: 'session_hijack',
      subject: '🚨 CRITICAL: Potential Session Hijack Detected',
      emailTemplate: `
        <h2 style="color: #dc3545;">CRITICAL SECURITY ALERT</h2>
        <p>A potential session hijacking attempt has been detected on your account.</p>
        <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Original IP:</strong> {{originalIP}}</p>
          <p><strong>New IP:</strong> {{newIP}}</p>
          <p><strong>Original User Agent:</strong> {{originalUserAgent}}</p>
          <p><strong>New User Agent:</strong> {{newUserAgent}}</p>
          <p><strong>Session ID:</strong> {{sessionId}}</p>
        </div>
        <h3>IMMEDIATE ACTIONS REQUIRED:</h3>
        <ol>
          <li>All sessions have been terminated for security</li>
          <li>Please log in again from a trusted device</li>
          <li>Change your password immediately</li>
          <li>Review all recent account activity</li>
        </ol>
        <p style="margin-top: 30px;">
          <a href="{{securityLink}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Secure My Account Now
          </a>
        </p>
      `,
      smsTemplate: 'CRITICAL: Session hijack detected! All sessions terminated. Change password immediately at {{securityLink}}'
    });

    // Password changed template
    this.templates.set('password_changed', {
      type: 'password_changed',
      subject: '🔑 Password Changed Successfully',
      emailTemplate: `
        <h2>Password Changed</h2>
        <p>Your password has been changed successfully.</p>
        <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Changed at:</strong> {{timestamp}}</p>
          <p><strong>IP Address:</strong> {{ipAddress}}</p>
          <p><strong>Location:</strong> {{location}}</p>
        </div>
        <p>If you didn't make this change, please contact support immediately.</p>
      `,
      smsTemplate: 'Your password was changed from {{location}}. If this wasn\'t you, contact support immediately.'
    });
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(alert: SecurityAlert): Promise<void> {
    try {
      // Determine recipients
      const recipients = this.determineRecipients(alert);
      
      // Queue notifications
      for (const recipient of recipients) {
        await this.queueNotification({
          recipientEmail: recipient.email,
          recipientPhone: recipient.phone,
          notificationType: this.getNotificationType(alert.severity),
          subject: alert.title,
          message: alert.message,
          priority: alert.severity,
          metadata: alert.metadata,
        });
      }

      // Process immediately for critical alerts
      if (alert.severity === 'critical') {
        await this.processNotifications();
      }
    } catch (error) {
      logger.error('Error sending security alert', { error, alert });
    }
  }

  /**
   * Send failed login notification
   */
  async sendFailedLoginNotification(
    email: string,
    attemptCount: number,
    ipAddress: string,
    location?: string
  ): Promise<void> {
    try {
      const template = this.templates.get('failed_login');
      if (!template) return;

      const data = {
        email,
        attempts: attemptCount,
        ipAddress,
        location: location || 'Unknown',
        timestamp: new Date().toISOString(),
        resetLink: `${process.env.APP_URL || 'http://localhost:5000'}/reset-password`,
      };

      const emailContent = this.renderTemplate(template.emailTemplate, data);
      const smsContent = this.renderTemplate(template.smsTemplate, data);

      // Send email to user
      await this.emailService.sendEmail({
        to: { email },
        from: {
          email: 'security@floridaelite.com',
          name: 'Florida Elite Security',
        },
        subject: template.subject,
        html: emailContent,
        text: smsContent,
      });

      // Send SMS if critical (more than 5 attempts)
      if (attemptCount >= 5) {
        const user = await this.getUserByEmail(email);
        if (user?.phone) {
          await this.smsService.sendSMS({
            to: { phone: user.phone },
            from: process.env.TWILIO_PHONE_NUMBER || '',
            message: smsContent,
          });
        }
      }

      logger.info('Failed login notification sent', { email, attemptCount });
    } catch (error) {
      logger.error('Error sending failed login notification', { error, email });
    }
  }

  /**
   * Send account locked notification
   */
  async sendAccountLockedNotification(
    email: string,
    lockType: 'temporary' | 'permanent',
    lockedUntil?: Date,
    reason?: string
  ): Promise<void> {
    try {
      const template = this.templates.get('account_locked');
      if (!template) return;

      const data = {
        email,
        lockType: lockType === 'temporary' ? 'Temporary' : 'Permanent',
        lockedUntil: lockedUntil ? lockedUntil.toISOString() : 'Indefinitely',
        reason: reason || 'Multiple failed login attempts',
      };

      const emailContent = this.renderTemplate(template.emailTemplate, data);

      await this.emailService.sendEmail({
        to: { email },
        from: {
          email: 'security@floridaelite.com',
          name: 'Florida Elite Security',
        },
        subject: template.subject,
        html: emailContent,
        text: this.renderTemplate(template.smsTemplate, data),
      });

      // Also notify admins for permanent locks
      if (lockType === 'permanent') {
        await this.notifyAdmins('Account Permanently Locked', `Account ${email} has been permanently locked. Reason: ${reason}`);
      }

      logger.info('Account locked notification sent', { email, lockType });
    } catch (error) {
      logger.error('Error sending account locked notification', { error, email });
    }
  }

  /**
   * Queue notification for processing
   */
  private async queueNotification(notification: {
    recipientEmail: string;
    recipientPhone?: string;
    notificationType: string;
    subject: string;
    message: string;
    priority: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await db.insert(securityNotifications).values({
        ...notification,
        status: 'pending',
        attempts: 0,
      });

      logger.debug('Notification queued', { recipientEmail: notification.recipientEmail, subject: notification.subject });
    } catch (error) {
      logger.error('Error queueing notification', { error, notification });
    }
  }

  /**
   * Process pending notifications
   */
  async processNotifications(): Promise<void> {
    try {
      // Get pending notifications
      const pending = await db
        .select()
        .from(securityNotifications)
        .where(
          and(
            eq(securityNotifications.status, 'pending'),
            lte(securityNotifications.attempts, NOTIFICATION_CONFIG.maxRetries)
          )
        )
        .orderBy(
          desc(securityNotifications.priority),
          asc(securityNotifications.createdAt)
        )
        .limit(NOTIFICATION_CONFIG.batchSize);

      for (const notification of pending) {
        await this.sendNotification(notification);
      }
    } catch (error) {
      logger.error('Error processing notifications', { error });
    }
  }

  /**
   * Send individual notification
   */
  private async sendNotification(notification: typeof securityNotifications.$inferSelect): Promise<void> {
    try {
      // Update status to processing
      await db
        .update(securityNotifications)
        .set({ 
          status: 'processing',
          attempts: (notification.attempts || 0) + 1,
        })
        .where(eq(securityNotifications.id, notification.id));

      let success = false;
      let failureReason: string | undefined;

      // Send email if specified
      if (notification.recipientEmail && notification.notificationType !== 'sms') {
        try {
          const result = await this.emailService.sendEmail({
            to: { email: notification.recipientEmail },
            from: {
              email: 'security@floridaelite.com',
              name: 'Florida Elite Security',
            },
            subject: notification.subject,
            html: notification.message,
            text: notification.message,
          });
          
          success = result.success;
          if (!success) {
            failureReason = result.error;
          }
        } catch (error: any) {
          failureReason = error.message;
        }
      }

      // Send SMS if specified and critical
      if (notification.recipientPhone && 
          (notification.notificationType === 'sms' || notification.notificationType === 'both') &&
          notification.priority === 'critical') {
        try {
          const result = await this.smsService.sendSMS({
            to: { phone: notification.recipientPhone },
            from: process.env.TWILIO_PHONE_NUMBER || '',
            message: notification.message,
          });
          
          success = result.success;
          if (!success && !failureReason) {
            failureReason = result.error;
          }
        } catch (error: any) {
          if (!failureReason) {
            failureReason = error.message;
          }
        }
      }

      // Update notification status
      if (success) {
        await db
          .update(securityNotifications)
          .set({ 
            status: 'sent',
            sentAt: new Date(),
          })
          .where(eq(securityNotifications.id, notification.id));
      } else {
        const shouldRetry = (notification.attempts || 0) < NOTIFICATION_CONFIG.maxRetries;
        
        await db
          .update(securityNotifications)
          .set({ 
            status: shouldRetry ? 'pending' : 'failed',
            failureReason,
          })
          .where(eq(securityNotifications.id, notification.id));
      }
    } catch (error) {
      logger.error('Error sending notification', { error, notificationId: notification.id });
    }
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/{{(\w+)}}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Determine recipients for alert
   */
  private determineRecipients(alert: SecurityAlert): Array<{ email: string; phone?: string }> {
    const recipients: Array<{ email: string; phone?: string }> = [];

    // Add specific recipient if provided
    if (alert.recipientEmail) {
      recipients.push({
        email: alert.recipientEmail,
        phone: alert.recipientPhone,
      });
    }

    // Add admins for high/critical alerts
    if (alert.severity === 'high' || alert.severity === 'critical') {
      for (const email of NOTIFICATION_CONFIG.adminEmails) {
        recipients.push({ email });
      }
      
      // Add admin phones for critical
      if (alert.severity === 'critical') {
        for (const phone of NOTIFICATION_CONFIG.adminPhones) {
          const existing = recipients.find(r => r.email === NOTIFICATION_CONFIG.adminEmails[0]);
          if (existing) {
            existing.phone = phone;
          }
        }
      }
    }

    return recipients;
  }

  /**
   * Get notification type based on severity
   */
  private getNotificationType(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'both'; // Email and SMS
      case 'high':
        return 'email';
      default:
        return 'email';
    }
  }

  /**
   * Get user by email
   */
  private async getUserByEmail(email: string): Promise<{ email: string; phone?: string } | null> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (user.length > 0) {
        // TODO: Add phone field to users table if not exists
        return {
          email: user[0].email || '',
          phone: undefined, // Users table doesn't have phone field yet
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting user by email', { error, email });
      return null;
    }
  }

  /**
   * Notify all admins
   */
  private async notifyAdmins(subject: string, message: string): Promise<void> {
    try {
      for (const email of NOTIFICATION_CONFIG.adminEmails) {
        await this.queueNotification({
          recipientEmail: email,
          notificationType: 'email',
          subject: `[Admin Alert] ${subject}`,
          message,
          priority: 'high',
        });
      }
    } catch (error) {
      logger.error('Error notifying admins', { error });
    }
  }

  /**
   * Start notification processing
   */
  private startProcessing(): void {
    // Process notifications periodically
    this.processingTimer = setInterval(() => {
      this.processNotifications().catch(error => {
        logger.error('Error in notification processing', { error });
      });
    }, NOTIFICATION_CONFIG.processingInterval);

    logger.info('Security notification service started');
  }

  /**
   * Stop notification processing
   */
  stopProcessing(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = undefined;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    pending: number;
    sent: number;
    failed: number;
    recentCritical: number;
  }> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const [pending, sent, failed, critical] = await Promise.all([
        db
          .select()
          .from(securityNotifications)
          .where(eq(securityNotifications.status, 'pending'))
          .then(r => r.length),
        db
          .select()
          .from(securityNotifications)
          .where(
            and(
              eq(securityNotifications.status, 'sent'),
              gte(securityNotifications.sentAt, oneDayAgo)
            )
          )
          .then(r => r.length),
        db
          .select()
          .from(securityNotifications)
          .where(eq(securityNotifications.status, 'failed'))
          .then(r => r.length),
        db
          .select()
          .from(securityNotifications)
          .where(
            and(
              eq(securityNotifications.priority, 'critical'),
              gte(securityNotifications.createdAt, oneDayAgo)
            )
          )
          .then(r => r.length),
      ]);

      return {
        pending,
        sent,
        failed,
        recentCritical: critical,
      };
    } catch (error) {
      logger.error('Error getting notification stats', { error });
      return {
        pending: 0,
        sent: 0,
        failed: 0,
        recentCritical: 0,
      };
    }
  }
}

// Export singleton instance
export const securityNotificationService = new SecurityNotificationService();