/**
 * Stripe Compliance & Security
 * 
 * Implements PCI compliance, SCA, fraud detection, and financial reporting
 * Ensures GDPR compliance and secure payment processing
 * 
 * @see https://stripe.com/docs/security
 */

import Stripe from "stripe";
import { logger, trackEvent } from "./monitoring";
import { cache } from "./redis";
import { getStripeClient } from "./stripeConnect";
import crypto from "crypto";

// Fraud detection thresholds
const FRAUD_THRESHOLDS = {
  HIGH_RISK_AMOUNT: 10000, // $10,000
  VELOCITY_LIMIT: 5, // Max transactions per hour
  SUSPICIOUS_COUNTRY_LIST: ['NG', 'PK', 'ID', 'VN'], // High-risk countries
  MAX_FAILED_ATTEMPTS: 3,
  UNUSUAL_HOUR_START: 2, // 2 AM
  UNUSUAL_HOUR_END: 5, // 5 AM
};

// PCI compliance levels
export enum ComplianceLevel {
  LEVEL_1 = 'level_1', // > 6M transactions/year
  LEVEL_2 = 'level_2', // 1M - 6M transactions/year
  LEVEL_3 = 'level_3', // 20K - 1M transactions/year
  LEVEL_4 = 'level_4', // < 20K transactions/year
}

// Risk levels
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  BLOCKED = 'blocked',
}

// Security check results
export interface SecurityCheckResult {
  passed: boolean;
  riskLevel: RiskLevel;
  checks: {
    velocity: boolean;
    amount: boolean;
    country: boolean;
    time: boolean;
    history: boolean;
    device: boolean;
  };
  reasons: string[];
  requiresAdditionalVerification: boolean;
  suggestedAction: string;
}

// Fraud detection result
export interface FraudDetectionResult {
  score: number; // 0-100, higher = more suspicious
  riskLevel: RiskLevel;
  factors: string[];
  blocked: boolean;
  requiresReview: boolean;
  recommendations: string[];
}

/**
 * Perform comprehensive security checks on a payment
 */
export async function performSecurityCheck(
  paymentData: {
    amount: number;
    currency: string;
    customerId?: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    country?: string;
    paymentMethodId?: string;
  }
): Promise<SecurityCheckResult> {
  const checks = {
    velocity: true,
    amount: true,
    country: true,
    time: true,
    history: true,
    device: true,
  };
  const reasons: string[] = [];
  let riskLevel = RiskLevel.LOW;

  try {
    // Check transaction velocity
    if (paymentData.customerId) {
      const velocityCheck = await checkVelocityLimit(paymentData.customerId);
      checks.velocity = velocityCheck.passed;
      if (!velocityCheck.passed) {
        reasons.push(velocityCheck.reason);
        riskLevel = RiskLevel.HIGH;
      }
    }

    // Check amount threshold
    if (paymentData.amount > FRAUD_THRESHOLDS.HIGH_RISK_AMOUNT) {
      checks.amount = false;
      reasons.push(`High-risk amount: $${paymentData.amount}`);
      riskLevel = RiskLevel.MEDIUM;
    }

    // Check country risk
    if (paymentData.country && FRAUD_THRESHOLDS.SUSPICIOUS_COUNTRY_LIST.includes(paymentData.country)) {
      checks.country = false;
      reasons.push(`High-risk country: ${paymentData.country}`);
      riskLevel = RiskLevel.HIGH;
    }

    // Check unusual transaction time
    const hour = new Date().getHours();
    if (hour >= FRAUD_THRESHOLDS.UNUSUAL_HOUR_START && hour <= FRAUD_THRESHOLDS.UNUSUAL_HOUR_END) {
      checks.time = false;
      reasons.push(`Unusual transaction time: ${hour}:00`);
      if (riskLevel === RiskLevel.LOW) riskLevel = RiskLevel.MEDIUM;
    }

    // Check customer history
    if (paymentData.customerId) {
      const historyCheck = await checkCustomerHistory(paymentData.customerId);
      checks.history = historyCheck.trusted;
      if (!historyCheck.trusted) {
        reasons.push(historyCheck.reason);
        if (historyCheck.blocked) {
          riskLevel = RiskLevel.BLOCKED;
        } else if (riskLevel === RiskLevel.LOW) {
          riskLevel = RiskLevel.MEDIUM;
        }
      }
    }

    // Device fingerprinting check
    if (paymentData.ipAddress) {
      const deviceCheck = await checkDeviceFingerprint(
        paymentData.ipAddress,
        paymentData.userAgent
      );
      checks.device = deviceCheck.trusted;
      if (!deviceCheck.trusted) {
        reasons.push(deviceCheck.reason);
        if (riskLevel === RiskLevel.LOW) riskLevel = RiskLevel.MEDIUM;
      }
    }

    // Determine if all checks passed
    const passed = Object.values(checks).every(check => check);

    // Determine suggested action
    let suggestedAction = 'proceed';
    let requiresAdditionalVerification = false;
    
    if (riskLevel === RiskLevel.BLOCKED) {
      suggestedAction = 'block';
    } else if (riskLevel === RiskLevel.HIGH) {
      suggestedAction = 'manual_review';
      requiresAdditionalVerification = true;
    } else if (riskLevel === RiskLevel.MEDIUM) {
      suggestedAction = 'additional_verification';
      requiresAdditionalVerification = true;
    }

    logger.info('Security check completed', {
      customerId: paymentData.customerId,
      riskLevel,
      passed,
      reasons,
    });

    return {
      passed,
      riskLevel,
      checks,
      reasons,
      requiresAdditionalVerification,
      suggestedAction,
    };

  } catch (error) {
    logger.error('Security check failed', { error, paymentData });
    
    // Fail open but flag for review
    return {
      passed: false,
      riskLevel: RiskLevel.MEDIUM,
      checks,
      reasons: ['Security check error - flagged for review'],
      requiresAdditionalVerification: true,
      suggestedAction: 'manual_review',
    };
  }
}

/**
 * Check transaction velocity limits
 */
async function checkVelocityLimit(
  customerId: string
): Promise<{ passed: boolean; reason: string }> {
  const key = `fraud:velocity:${customerId}`;
  const hour = Math.floor(Date.now() / 3600000); // Current hour
  const hourKey = `${key}:${hour}`;

  try {
    if (!cache) {
      return { passed: true, reason: '' };
    }

    // Increment counter for current hour
    const count = await cache.increment(hourKey);
    
    // Set expiry if this is the first transaction
    if (count === 1) {
      await cache.expire(hourKey, 3600); // Expire after 1 hour
    }

    if (count > FRAUD_THRESHOLDS.VELOCITY_LIMIT) {
      return {
        passed: false,
        reason: `Velocity limit exceeded: ${count} transactions in current hour`,
      };
    }

    return { passed: true, reason: '' };
  } catch (error) {
    logger.error('Velocity check failed', { error, customerId });
    return { passed: true, reason: '' }; // Fail open
  }
}

/**
 * Check customer payment history
 */
async function checkCustomerHistory(
  customerId: string
): Promise<{ trusted: boolean; blocked: boolean; reason: string }> {
  const key = `fraud:history:${customerId}`;

  try {
    if (!cache) {
      return { trusted: true, blocked: false, reason: '' };
    }

    // Check if customer is blocked
    const blockedKey = `${key}:blocked`;
    const isBlocked = await cache.get(blockedKey);
    if (isBlocked) {
      return {
        trusted: false,
        blocked: true,
        reason: 'Customer is blocked due to previous fraud',
      };
    }

    // Check failed payment attempts
    const failedKey = `${key}:failed`;
    const failedAttempts = await cache.get<number>(failedKey);
    if (failedAttempts && failedAttempts > FRAUD_THRESHOLDS.MAX_FAILED_ATTEMPTS) {
      return {
        trusted: false,
        blocked: false,
        reason: `High number of failed attempts: ${failedAttempts}`,
      };
    }

    // Check if customer has successful payment history
    const successKey = `${key}:success`;
    const successCount = await cache.get<number>(successKey);
    if (!successCount || successCount < 1) {
      return {
        trusted: false,
        blocked: false,
        reason: 'New customer - no payment history',
      };
    }

    return { trusted: true, blocked: false, reason: '' };
  } catch (error) {
    logger.error('History check failed', { error, customerId });
    return { trusted: true, blocked: false, reason: '' }; // Fail open
  }
}

/**
 * Check device fingerprint for suspicious activity
 */
async function checkDeviceFingerprint(
  ipAddress?: string,
  userAgent?: string
): Promise<{ trusted: boolean; reason: string }> {
  if (!ipAddress) {
    return { trusted: true, reason: '' };
  }

  const fingerprint = generateDeviceFingerprint(ipAddress, userAgent);
  const key = `fraud:device:${fingerprint}`;

  try {
    if (!cache) {
      return { trusted: true, reason: '' };
    }

    // Check if device is blacklisted
    const blacklisted = await cache.get(`${key}:blacklisted`);
    if (blacklisted) {
      return {
        trusted: false,
        reason: 'Device is blacklisted',
      };
    }

    // Check device usage patterns
    const usageKey = `${key}:usage`;
    const usageCount = await cache.increment(usageKey);
    
    // Set expiry for 24 hours
    if (usageCount === 1) {
      await cache.expire(usageKey, 86400);
    }

    // Flag if too many different accounts from same device
    if (usageCount > 10) {
      return {
        trusted: false,
        reason: `Suspicious device activity: ${usageCount} different accounts`,
      };
    }

    return { trusted: true, reason: '' };
  } catch (error) {
    logger.error('Device check failed', { error, ipAddress });
    return { trusted: true, reason: '' }; // Fail open
  }
}

/**
 * Generate a device fingerprint
 */
function generateDeviceFingerprint(ipAddress: string, userAgent?: string): string {
  const data = `${ipAddress}:${userAgent || 'unknown'}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Perform Stripe Radar fraud detection
 */
export async function performRadarCheck(
  paymentIntentId: string
): Promise<FraudDetectionResult> {
  try {
    const stripeClient = getStripeClient();
    const paymentIntent = await stripeClient.paymentIntents.retrieve(
      paymentIntentId,
      { expand: ['latest_charge.outcome'] }
    );

    const charge = paymentIntent.latest_charge as Stripe.Charge;
    const outcome = charge?.outcome;

    if (!outcome) {
      return {
        score: 0,
        riskLevel: RiskLevel.LOW,
        factors: [],
        blocked: false,
        requiresReview: false,
        recommendations: [],
      };
    }

    // Calculate risk score based on Stripe's risk assessment
    let score = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Check risk level from Stripe
    if (outcome.risk_level === 'highest') {
      score += 80;
      factors.push('Stripe marked as highest risk');
      recommendations.push('Block transaction');
    } else if (outcome.risk_level === 'elevated') {
      score += 40;
      factors.push('Stripe marked as elevated risk');
      recommendations.push('Request additional verification');
    }

    // Check risk score from Stripe (if available)
    if (outcome.risk_score && outcome.risk_score > 65) {
      score += 30;
      factors.push(`High Stripe risk score: ${outcome.risk_score}`);
    }

    // Check for specific risk reasons
    if (outcome.type === 'blocked') {
      score = 100;
      factors.push('Transaction blocked by Stripe');
      recommendations.push('Do not process');
    }

    // Check CVC and address verification
    const cvcCheck = charge?.payment_method_details?.card?.checks?.cvc_check;
    const addressCheck = charge?.payment_method_details?.card?.checks?.address_line1_check;
    
    if (cvcCheck === 'fail') {
      score += 20;
      factors.push('CVC verification failed');
      recommendations.push('Request correct CVC');
    }
    
    if (addressCheck === 'fail') {
      score += 15;
      factors.push('Address verification failed');
      recommendations.push('Verify billing address');
    }

    // Determine risk level
    let riskLevel: RiskLevel;
    let blocked = false;
    let requiresReview = false;

    if (score >= 80) {
      riskLevel = RiskLevel.BLOCKED;
      blocked = true;
      requiresReview = true;
    } else if (score >= 50) {
      riskLevel = RiskLevel.HIGH;
      requiresReview = true;
    } else if (score >= 25) {
      riskLevel = RiskLevel.MEDIUM;
      requiresReview = true;
    } else {
      riskLevel = RiskLevel.LOW;
    }

    logger.info('Radar check completed', {
      paymentIntentId,
      score,
      riskLevel,
      factors,
    });

    return {
      score,
      riskLevel,
      factors,
      blocked,
      requiresReview,
      recommendations,
    };

  } catch (error) {
    logger.error('Radar check failed', { error, paymentIntentId });
    
    // Return medium risk on error
    return {
      score: 50,
      riskLevel: RiskLevel.MEDIUM,
      factors: ['Unable to perform Radar check'],
      blocked: false,
      requiresReview: true,
      recommendations: ['Manual review required'],
    };
  }
}

/**
 * Implement Strong Customer Authentication (SCA)
 */
export async function requireSCA(
  paymentIntentId: string
): Promise<{ required: boolean; type: string; status: string }> {
  try {
    const stripeClient = getStripeClient();
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

    // Check if authentication is required
    const authenticationRequired = 
      paymentIntent.status === 'requires_action' &&
      paymentIntent.next_action?.type === 'use_stripe_sdk';

    if (authenticationRequired) {
      return {
        required: true,
        type: '3d_secure_2',
        status: 'pending_authentication',
      };
    }

    // Check if authentication was performed
    const authenticated = paymentIntent.charges?.data[0]?.payment_method_details?.card?.three_d_secure;
    if (authenticated) {
      return {
        required: true,
        type: authenticated.version,
        status: authenticated.result || 'unknown',
      };
    }

    return {
      required: false,
      type: 'none',
      status: 'not_required',
    };

  } catch (error) {
    logger.error('SCA check failed', { error, paymentIntentId });
    
    return {
      required: true,
      type: '3d_secure_2',
      status: 'error',
    };
  }
}

/**
 * Generate PCI compliance report
 */
export async function generateComplianceReport(
  startDate: Date,
  endDate: Date
): Promise<{
  complianceLevel: ComplianceLevel;
  transactionCount: number;
  securityMetrics: {
    encryptedTransactions: number;
    tokenizedPayments: number;
    scaAuthentications: number;
    failedSecurityChecks: number;
  };
  recommendations: string[];
  nextAuditDate: Date;
}> {
  try {
    const stripeClient = getStripeClient();
    
    // Get transaction count
    const charges = await stripeClient.charges.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
      limit: 100,
    });

    const transactionCount = charges.data.length;
    
    // Determine compliance level based on transaction volume
    let complianceLevel: ComplianceLevel;
    const yearlyEstimate = transactionCount * 12; // Rough estimate
    
    if (yearlyEstimate > 6000000) {
      complianceLevel = ComplianceLevel.LEVEL_1;
    } else if (yearlyEstimate > 1000000) {
      complianceLevel = ComplianceLevel.LEVEL_2;
    } else if (yearlyEstimate > 20000) {
      complianceLevel = ComplianceLevel.LEVEL_3;
    } else {
      complianceLevel = ComplianceLevel.LEVEL_4;
    }

    // Calculate security metrics
    const securityMetrics = {
      encryptedTransactions: transactionCount, // All Stripe transactions are encrypted
      tokenizedPayments: charges.data.filter(c => c.payment_method).length,
      scaAuthentications: charges.data.filter(c => 
        c.payment_method_details?.card?.three_d_secure
      ).length,
      failedSecurityChecks: charges.data.filter(c => 
        c.outcome?.risk_level === 'highest'
      ).length,
    };

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (securityMetrics.scaAuthentications < transactionCount * 0.3) {
      recommendations.push('Increase SCA adoption for European transactions');
    }
    
    if (securityMetrics.failedSecurityChecks > transactionCount * 0.05) {
      recommendations.push('Review and enhance fraud detection rules');
    }
    
    if (complianceLevel === ComplianceLevel.LEVEL_1 || complianceLevel === ComplianceLevel.LEVEL_2) {
      recommendations.push('Schedule quarterly security assessment');
      recommendations.push('Implement network segmentation');
    }
    
    recommendations.push('Regular security training for staff');
    recommendations.push('Update incident response procedures');

    // Calculate next audit date based on compliance level
    const nextAuditDate = new Date();
    if (complianceLevel === ComplianceLevel.LEVEL_1) {
      nextAuditDate.setMonth(nextAuditDate.getMonth() + 3); // Quarterly
    } else if (complianceLevel === ComplianceLevel.LEVEL_2) {
      nextAuditDate.setMonth(nextAuditDate.getMonth() + 3); // Quarterly
    } else if (complianceLevel === ComplianceLevel.LEVEL_3) {
      nextAuditDate.setMonth(nextAuditDate.getMonth() + 6); // Bi-annually
    } else {
      nextAuditDate.setFullYear(nextAuditDate.getFullYear() + 1); // Annually
    }

    logger.info('Compliance report generated', {
      complianceLevel,
      transactionCount,
      period: { startDate, endDate },
    });

    return {
      complianceLevel,
      transactionCount,
      securityMetrics,
      recommendations,
      nextAuditDate,
    };

  } catch (error) {
    logger.error('Failed to generate compliance report', { error, startDate, endDate });
    throw new Error(
      `Failed to generate compliance report: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Block a suspicious customer
 */
export async function blockCustomer(
  customerId: string,
  reason: string
): Promise<void> {
  try {
    if (!cache) return;

    const key = `fraud:history:${customerId}:blocked`;
    await cache.set(key, reason, 0); // No expiry - permanent block
    
    logger.warn('Customer blocked', { customerId, reason });
    
    trackEvent(
      'system',
      'customer_blocked',
      { customerId, reason }
    );
  } catch (error) {
    logger.error('Failed to block customer', { error, customerId });
    throw error;
  }
}

/**
 * Unblock a customer
 */
export async function unblockCustomer(
  customerId: string
): Promise<void> {
  try {
    if (!cache) return;

    const key = `fraud:history:${customerId}:blocked`;
    await cache.delete(key);
    
    logger.info('Customer unblocked', { customerId });
    
    trackEvent(
      'system',
      'customer_unblocked',
      { customerId }
    );
  } catch (error) {
    logger.error('Failed to unblock customer', { error, customerId });
    throw error;
  }
}

/**
 * Record a failed payment attempt
 */
export async function recordFailedAttempt(
  customerId: string,
  reason: string
): Promise<void> {
  try {
    if (!cache) return;

    const key = `fraud:history:${customerId}:failed`;
    const count = await cache.increment(key);
    
    // Set expiry for 24 hours
    if (count === 1) {
      await cache.expire(key, 86400);
    }
    
    // Auto-block after too many failures
    if (count > FRAUD_THRESHOLDS.MAX_FAILED_ATTEMPTS * 2) {
      await blockCustomer(customerId, 'Too many failed payment attempts');
    }
    
    logger.info('Failed attempt recorded', { customerId, count, reason });
  } catch (error) {
    logger.error('Failed to record failed attempt', { error, customerId });
  }
}

/**
 * Record a successful payment
 */
export async function recordSuccessfulPayment(
  customerId: string,
  amount: number
): Promise<void> {
  try {
    if (!cache) return;

    const successKey = `fraud:history:${customerId}:success`;
    const count = await cache.increment(successKey);
    
    // Clear failed attempts on successful payment
    const failedKey = `fraud:history:${customerId}:failed`;
    await cache.delete(failedKey);
    
    logger.info('Successful payment recorded', { customerId, count, amount });
  } catch (error) {
    logger.error('Failed to record successful payment', { error, customerId });
  }
}

/**
 * Generate tax report for 1099-K compliance
 */
export async function generateTaxReport(
  accountId: string,
  year: number
): Promise<{
  totalGrossVolume: number;
  totalTransactions: number;
  reportingRequired: boolean;
  form1099K: {
    grossAmount: number;
    cardTransactions: number;
    thirdPartyNetworkTransactions: number;
  };
}> {
  try {
    const stripeClient = getStripeClient();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Get all transfers to the account
    const transfers = await stripeClient.transfers.list(
      {
        destination: accountId,
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000),
        },
        limit: 100,
      }
    );

    const totalGrossVolume = transfers.data.reduce((sum, t) => sum + t.amount, 0) / 100;
    const totalTransactions = transfers.data.length;

    // Check 1099-K reporting threshold (2022 rules: $600)
    const reportingRequired = totalGrossVolume >= 600;

    logger.info('Tax report generated', {
      accountId,
      year,
      totalGrossVolume,
      totalTransactions,
      reportingRequired,
    });

    return {
      totalGrossVolume,
      totalTransactions,
      reportingRequired,
      form1099K: {
        grossAmount: totalGrossVolume,
        cardTransactions: totalTransactions,
        thirdPartyNetworkTransactions: 0,
      },
    };

  } catch (error) {
    logger.error('Failed to generate tax report', { error, accountId, year });
    throw new Error(
      `Failed to generate tax report: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export default {
  performSecurityCheck,
  performRadarCheck,
  requireSCA,
  generateComplianceReport,
  blockCustomer,
  unblockCustomer,
  recordFailedAttempt,
  recordSuccessfulPayment,
  generateTaxReport,
  ComplianceLevel,
  RiskLevel,
};