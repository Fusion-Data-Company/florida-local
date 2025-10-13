/**
 * SMS Service - Twilio Integration
 *
 * Provides abstraction layer for sending marketing and transactional SMS messages
 */

interface SMSRecipient {
  phone: string;
  firstName?: string;
  lastName?: string;
}

interface SMSOptions {
  to: SMSRecipient | SMSRecipient[];
  from: string; // Phone number
  message: string;
  campaignId?: string;
  recipientId?: string;
  testMode?: boolean;
  metadata?: Record<string, string>;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipientPhone?: string;
  status?: string;
}

interface BulkSMSResult {
  totalSent: number;
  totalFailed: number;
  results: SMSResult[];
}

/**
 * SMS Service Class
 *
 * Handles all SMS sending operations with support for:
 * - Single and bulk SMS sending
 * - Delivery tracking
 * - Test mode (doesn't actually send)
 * - Cost estimation
 */
export class SMSService {
  private accountSid: string;
  private authToken: string;
  private fromPhone: string;
  private baseUrl: string;
  private costPerSMS: number = 0.0075; // Average cost per SMS in USD

  constructor() {
    this.baseUrl = process.env.APP_URL || 'http://localhost:5000';
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromPhone = process.env.TWILIO_PHONE_NUMBER || '';

    if (!this.accountSid || !this.authToken || !this.fromPhone) {
      console.warn('⚠️  Twilio not configured. SMS messages will be logged to console only.');
    }
  }

  /**
   * Send a single SMS
   */
  async sendSMS(options: SMSOptions): Promise<SMSResult> {
    try {
      // Test mode - don't actually send
      if (options.testMode) {
        console.log('📱 [TEST MODE] SMS would be sent:', {
          to: options.to,
          from: options.from,
          message: options.message.substring(0, 50) + '...',
        });
        return {
          success: true,
          messageId: `test-${Date.now()}`,
          recipientPhone: Array.isArray(options.to) ? options.to[0].phone : options.to.phone,
          status: 'test',
        };
      }

      // Validate phone number format
      const recipient = Array.isArray(options.to) ? options.to[0] : options.to;
      if (!this.isValidPhoneNumber(recipient.phone)) {
        return {
          success: false,
          error: 'Invalid phone number format',
          recipientPhone: recipient.phone,
        };
      }

      // Ensure opt-out text is included (required by regulations)
      let message = options.message;
      if (!message.toLowerCase().includes('stop') && !message.toLowerCase().includes('opt out')) {
        message += '\n\nReply STOP to unsubscribe.';
      }

      // Validate message length (SMS is 160 characters, longer messages are split)
      if (message.length > 1600) {
        return {
          success: false,
          error: 'Message too long (max 1600 characters)',
          recipientPhone: recipient.phone,
        };
      }

      // Send via Twilio
      return await this.sendViaTwilio(recipient.phone, options.from, message, options.metadata);
    } catch (error: any) {
      console.error('❌ SMS sending failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        recipientPhone: Array.isArray(options.to) ? options.to[0].phone : options.to.phone,
      };
    }
  }

  /**
   * Send bulk SMS messages (for campaigns)
   */
  async sendBulkSMS(messages: SMSOptions[]): Promise<BulkSMSResult> {
    const results: SMSResult[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    // Send in batches of 50 to avoid rate limiting
    const batchSize = 50;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      // Send all SMS in batch concurrently
      const batchResults = await Promise.all(
        batch.map(sms => this.sendSMS(sms))
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

      // Rate limiting delay between batches (2 seconds)
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return {
      totalSent,
      totalFailed,
      results,
    };
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(
    to: string,
    from: string,
    message: string,
    metadata?: Record<string, string>
  ): Promise<SMSResult> {
    // If no credentials, log to console (development mode)
    if (!this.accountSid || !this.authToken || !this.fromPhone) {
      console.log('📱 [TWILIO MOCK] SMS:', {
        to,
        from: from || this.fromPhone,
        message: message.substring(0, 50) + '...',
      });
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        recipientPhone: to,
        status: 'mock',
      };
    }

    // TODO: Implement actual Twilio integration
    // This requires installing twilio package
    // Example:
    // const twilio = require('twilio');
    // const client = twilio(this.accountSid, this.authToken);
    // const response = await client.messages.create({
    //   body: message,
    //   from: from || this.fromPhone,
    //   to: to,
    // });
    // return {
    //   success: true,
    //   messageId: response.sid,
    //   recipientPhone: to,
    //   status: response.status,
    // };

    throw new Error('Twilio integration not yet implemented. Install twilio package.');
  }

  /**
   * Validate phone number format
   *
   * Accepts formats:
   * - +1234567890 (E.164 format - preferred)
   * - (123) 456-7890
   * - 123-456-7890
   * - 1234567890
   */
  isValidPhoneNumber(phone: string): boolean {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');

    // Check if it starts with + (international format)
    if (cleaned.startsWith('+')) {
      // E.164 format: + followed by 1-15 digits
      return /^\+\d{1,15}$/.test(cleaned);
    }

    // US/Canada format: 10 or 11 digits (with or without country code)
    return /^\d{10,11}$/.test(cleaned);
  }

  /**
   * Format phone number to E.164 format
   *
   * E.164 is the international phone number format: +[country code][number]
   * Example: +14155552671
   */
  formatPhoneNumber(phone: string, defaultCountryCode: string = '+1'): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // If already in E.164 format, return as-is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // If 11 digits starting with 1 (US/Canada with country code), add +
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return '+' + cleaned;
    }

    // If 10 digits (US/Canada without country code), add default country code
    if (cleaned.length === 10) {
      return defaultCountryCode + cleaned;
    }

    // Return original if format unknown
    return phone;
  }

  /**
   * Estimate SMS cost
   *
   * SMS pricing varies by country and carrier, but this provides a rough estimate
   */
  estimateCost(messageCount: number, messageLength: number = 160): number {
    // SMS is 160 characters, longer messages are split into multiple
    const messagesPerRecipient = Math.ceil(messageLength / 160);
    const totalMessages = messageCount * messagesPerRecipient;
    return totalMessages * this.costPerSMS;
  }

  /**
   * Count SMS segments
   *
   * SMS is sent in 160-character segments (or 70 characters for Unicode)
   */
  countSegments(message: string): number {
    // Check if message contains Unicode characters
    const hasUnicode = /[^\x00-\x7F]/.test(message);

    // Unicode messages are limited to 70 characters per segment
    // Standard messages are limited to 160 characters per segment
    const segmentLength = hasUnicode ? 70 : 160;

    return Math.ceil(message.length / segmentLength);
  }

  /**
   * Generate short URL for SMS links
   *
   * Since SMS character count is limited, it's important to use short URLs
   */
  generateShortLink(originalUrl: string, shortCode: string): string {
    return `${this.baseUrl}/s/${shortCode}`;
  }

  /**
   * Get provider info
   */
  getProviderInfo(): { provider: string; configured: boolean } {
    return {
      provider: 'twilio',
      configured: !!(this.accountSid && this.authToken && this.fromPhone),
    };
  }

  /**
   * Check if number is opted out
   *
   * TODO: Implement opt-out tracking in database
   */
  async isOptedOut(phone: string): Promise<boolean> {
    // TODO: Query database for opt-out status
    return false;
  }

  /**
   * Mark number as opted out
   *
   * TODO: Implement opt-out tracking in database
   */
  async markOptedOut(phone: string): Promise<void> {
    // TODO: Update database to mark phone as opted out
    console.log(`📱 Phone number opted out: ${phone}`);
  }
}

// Export singleton instance
export const smsService = new SMSService();
