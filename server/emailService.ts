/**
 * Email Service - Multi-Provider Email Integration
 *
 * Provides abstraction layer for sending marketing and transactional emails
 * Supports: SendGrid, Mailgun, Mailjet, Gmail (Google), AWS SES
 * Features: tracking pixels, link wrapping, bulk sending
 */

interface EmailRecipient {
  email: string;
  firstName?: string;
  lastName?: string;
}

interface EmailOptions {
  to: EmailRecipient | EmailRecipient[];
  from: {
    email: string;
    name: string;
  };
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  campaignId?: string;
  recipientId?: string;
  testMode?: boolean;
  metadata?: Record<string, string>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipientEmail?: string;
}

interface BulkEmailResult {
  totalSent: number;
  totalFailed: number;
  results: EmailResult[];
}

/**
 * Email Service Class
 *
 * Handles all email sending operations with support for:
 * - Single and bulk email sending
 * - Open tracking (1px transparent GIF)
 * - Click tracking (link wrapping)
 * - Test mode (doesn't actually send)
 */
export class EmailService {
  private provider: 'sendgrid' | 'mailgun' | 'mailjet' | 'gmail' | 'ses';
  private apiKey: string;
  private apiSecret?: string;
  private domain?: string;
  private baseUrl: string;
  private gmailCredentials?: any;

  constructor() {
    this.baseUrl = process.env.APP_URL || 'http://localhost:5000';

    // Determine which provider to use based on environment variables
    // Priority: Mailjet > SendGrid > Gmail > Mailgun > SES
    if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
      this.provider = 'mailjet';
      this.apiKey = process.env.MAILJET_API_KEY;
      this.apiSecret = process.env.MAILJET_SECRET_KEY;
      console.log('✅ Email provider: Mailjet');
    } else if (process.env.SENDGRID_API_KEY) {
      this.provider = 'sendgrid';
      this.apiKey = process.env.SENDGRID_API_KEY;
      console.log('✅ Email provider: SendGrid');
    } else if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
      this.provider = 'gmail';
      this.gmailCredentials = {
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        user: process.env.GMAIL_USER || 'me',
      };
      console.log('✅ Email provider: Gmail (Google)');
    } else if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      this.provider = 'mailgun';
      this.apiKey = process.env.MAILGUN_API_KEY;
      this.domain = process.env.MAILGUN_DOMAIN;
      console.log('✅ Email provider: Mailgun');
    } else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.provider = 'ses';
      this.apiKey = process.env.AWS_ACCESS_KEY_ID;
      console.log('✅ Email provider: AWS SES');
    } else {
      // Default to mock mode if no provider configured
      this.provider = 'sendgrid';
      this.apiKey = '';
      console.warn('⚠️  No email provider configured. Emails will be logged to console only.');
    }
  }

  /**
   * Send a single email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Test mode - don't actually send
      if (options.testMode) {
        console.log('📧 [TEST MODE] Email would be sent:', {
          to: options.to,
          subject: options.subject,
          from: options.from,
        });
        return {
          success: true,
          messageId: `test-${Date.now()}`,
          recipientEmail: Array.isArray(options.to) ? options.to[0].email : options.to.email,
        };
      }

      // Apply tracking if enabled
      let html = options.html;
      if (options.trackOpens && options.recipientId) {
        html = this.addTrackingPixel(html, options.recipientId);
      }
      if (options.trackClicks && options.campaignId) {
        html = await this.wrapLinksForTracking(html, options.campaignId);
      }

      // Send based on provider
      switch (this.provider) {
        case 'mailjet':
          return await this.sendViaMailjet(options, html);
        case 'sendgrid':
          return await this.sendViaSendGrid(options, html);
        case 'gmail':
          return await this.sendViaGmail(options, html);
        case 'mailgun':
          return await this.sendViaMailgun(options, html);
        case 'ses':
          return await this.sendViaSES(options, html);
        default:
          throw new Error(`Unsupported email provider: ${this.provider}`);
      }
    } catch (error: any) {
      console.error('❌ Email sending failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        recipientEmail: Array.isArray(options.to) ? options.to[0].email : options.to.email,
      };
    }
  }

  /**
   * Send bulk emails (for campaigns)
   */
  async sendBulkEmails(emails: EmailOptions[]): Promise<BulkEmailResult> {
    const results: EmailResult[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    // Send in batches of 100 to avoid rate limiting
    const batchSize = 100;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      // Send all emails in batch concurrently
      const batchResults = await Promise.all(
        batch.map(email => this.sendEmail(email))
      );

      // Aggregate results
      for (const result of batchResults) {
        results.push(result);
        if (result.success) {
          totalSent++;
        } else {
          totalFailed++;
        }
      }

      // Rate limiting delay between batches (1 second)
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      totalSent,
      totalFailed,
      results,
    };
  }

  /**
   * Add tracking pixel to HTML for open tracking
   */
  private addTrackingPixel(html: string, recipientId: string): string {
    const trackingPixel = `<img src="${this.baseUrl}/api/marketing/track/open/${recipientId}" width="1" height="1" alt="" style="display:block;border:0;outline:none;" />`;

    // Try to insert before closing </body> tag
    if (html.includes('</body>')) {
      return html.replace('</body>', `${trackingPixel}</body>`);
    }

    // Otherwise append to end
    return html + trackingPixel;
  }

  /**
   * Wrap all links in HTML for click tracking
   *
   * This would typically integrate with campaignLinks table to generate
   * tracking URLs. For now, this is a placeholder that returns the HTML as-is.
   *
   * TODO: Implement link wrapping with database storage
   */
  private async wrapLinksForTracking(html: string, campaignId: string): Promise<string> {
    // TODO: Parse HTML, find all <a> tags, replace href with tracking URL
    // For each link:
    // 1. Extract original URL
    // 2. Create campaignLinks record with shortCode
    // 3. Replace href with: ${baseUrl}/api/marketing/track/click/${shortCode}

    // For now, return as-is
    return html;
  }

  /**
   * Send email via Mailjet
   */
  private async sendViaMailjet(options: EmailOptions, html: string): Promise<EmailResult> {
    if (!this.apiKey || !this.apiSecret) {
      console.log('📧 [MAILJET MOCK] Email:', {
        to: options.to,
        from: options.from,
        subject: options.subject,
      });
      return {
        success: true,
        messageId: `mailjet-mock-${Date.now()}`,
        recipientEmail: Array.isArray(options.to) ? options.to[0].email : options.to.email,
      };
    }

    try {
      const Mailjet = (await import('node-mailjet')).default;
      const mailjet = new Mailjet({
        apiKey: this.apiKey,
        apiSecret: this.apiSecret,
      });

      const recipient = Array.isArray(options.to) ? options.to[0] : options.to;

      const request = mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: options.from.email,
              Name: options.from.name,
            },
            To: [
              {
                Email: recipient.email,
                Name: recipient.firstName ? `${recipient.firstName} ${recipient.lastName || ''}`.trim() : undefined,
              },
            ],
            Subject: options.subject,
            HTMLPart: html,
            TextPart: options.text || undefined,
            CustomID: options.recipientId || undefined,
          },
        ],
      });

      const response = await request;
      const messageId = response.body.Messages[0].To[0].MessageID;

      return {
        success: true,
        messageId: messageId.toString(),
        recipientEmail: recipient.email,
      };
    } catch (error: any) {
      console.error('Mailjet send error:', error);
      throw new Error(`Mailjet error: ${error.message}`);
    }
  }

  /**
   * Send email via Gmail (Google API)
   */
  private async sendViaGmail(options: EmailOptions, html: string): Promise<EmailResult> {
    if (!this.gmailCredentials) {
      console.log('📧 [GMAIL MOCK] Email:', {
        to: options.to,
        from: options.from,
        subject: options.subject,
      });
      return {
        success: true,
        messageId: `gmail-mock-${Date.now()}`,
        recipientEmail: Array.isArray(options.to) ? options.to[0].email : options.to.email,
      };
    }

    try {
      const { google } = await import('googleapis');

      const oauth2Client = new google.auth.OAuth2(
        this.gmailCredentials.clientId,
        this.gmailCredentials.clientSecret
      );

      oauth2Client.setCredentials({
        refresh_token: this.gmailCredentials.refreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const recipient = Array.isArray(options.to) ? options.to[0] : options.to;

      // Create email message in RFC 2822 format
      const subject = options.subject;
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `From: ${options.from.name} <${options.from.email}>`,
        `To: ${recipient.email}`,
        `Subject: ${utf8Subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        html,
      ];

      const message = messageParts.join('\n');
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      return {
        success: true,
        messageId: response.data.id || undefined,
        recipientEmail: recipient.email,
      };
    } catch (error: any) {
      console.error('Gmail send error:', error);
      throw new Error(`Gmail error: ${error.message}`);
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(options: EmailOptions, html: string): Promise<EmailResult> {
    // If no API key, log to console (development mode)
    if (!this.apiKey) {
      console.log('📧 [SENDGRID MOCK] Email:', {
        to: options.to,
        from: options.from,
        subject: options.subject,
      });
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        recipientEmail: Array.isArray(options.to) ? options.to[0].email : options.to.email,
      };
    }

    try {
      const sgMail = (await import('@sendgrid/mail')).default;
      sgMail.setApiKey(this.apiKey);

      const recipient = Array.isArray(options.to) ? options.to[0] : options.to;

      const msg = {
        to: recipient.email,
        from: {
          email: options.from.email,
          name: options.from.name,
        },
        subject: options.subject,
        html: html,
        text: options.text,
      };

      const [response] = await sgMail.send(msg);

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
        recipientEmail: recipient.email,
      };
    } catch (error: any) {
      console.error('SendGrid send error:', error);
      throw new Error(`SendGrid error: ${error.message}`);
    }
  }

  /**
   * Send email via Mailgun
   */
  private async sendViaMailgun(options: EmailOptions, html: string): Promise<EmailResult> {
    if (!this.apiKey || !this.domain) {
      throw new Error('Mailgun not configured');
    }

    // TODO: Implement Mailgun integration
    // This requires installing mailgun.js package
    throw new Error('Mailgun integration not yet implemented. Install mailgun.js package.');
  }

  /**
   * Send email via AWS SES
   */
  private async sendViaSES(options: EmailOptions, html: string): Promise<EmailResult> {
    if (!this.apiKey) {
      throw new Error('AWS SES not configured');
    }

    // TODO: Implement AWS SES integration
    // This requires installing aws-sdk package
    throw new Error('AWS SES integration not yet implemented. Install aws-sdk package.');
  }

  /**
   * Validate email address format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate unsubscribe link
   */
  generateUnsubscribeLink(token: string): string {
    return `${this.baseUrl}/unsubscribe?token=${token}`;
  }

  /**
   * Get provider info
   */
  getProviderInfo(): { provider: string; configured: boolean } {
    return {
      provider: this.provider,
      configured: !!this.apiKey,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
