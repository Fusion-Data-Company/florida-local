/**
 * Stripe Payment Processing
 * 
 * Complete payment processing implementation for marketplace transactions.
 * Implements payment intents, split payments, refunds, and financial operations.
 * 
 * @see https://stripe.com/docs/payments
 */

import Stripe from "stripe";
import { logger, trackEvent } from "./monitoring";
import { cache } from "./redis";
import { storage } from "./storage";
import type { IStorage } from "./storage";
import { getStripeClient } from "./stripeConnect";
import { z } from "zod";

// Platform fee configuration
const PLATFORM_FEE_PERCENTAGE = 5; // 5% platform fee
const PLATFORM_FEE_FIXED_CENTS = 30; // 30 cents fixed fee
const TAX_RATE = 7; // 7% default tax rate (configurable per location)

// Payment method types
export enum PaymentMethodType {
  CARD = 'card',
  ACH_DEBIT = 'ach_debit',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  BANK_TRANSFER = 'bank_transfer',
}

// Payment status types
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  REQUIRES_ACTION = 'requires_action',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

// Transfer types
export enum TransferType {
  IMMEDIATE = 'immediate',
  DELAYED = 'delayed',
  SCHEDULED = 'scheduled',
}

export interface CreatePaymentIntentOptions {
  amount: number; // Amount in dollars (will be converted to cents)
  currency?: string;
  sellerId?: string; // Connect account ID for destination charges
  platformFeeAmount?: number; // Override platform fee
  description?: string;
  metadata?: Record<string, string>;
  customerId?: string; // Stripe customer ID
  paymentMethodTypes?: PaymentMethodType[];
  setupFutureUsage?: 'on_session' | 'off_session';
  captureMethod?: 'automatic' | 'manual';
  transferData?: {
    destination: string;
    amount?: number;
  };
  applicationFeeAmount?: number;
  onBehalfOf?: string;
  statementDescriptor?: string;
  statementDescriptorSuffix?: string;
  receiptEmail?: string;
  shipping?: Stripe.PaymentIntentCreateParams.Shipping;
  returnUrl?: string;
  confirmationMethod?: 'automatic' | 'manual';
  mandateData?: Stripe.PaymentIntentCreateParams.MandateData;
  use3DSecure?: boolean;
  idempotencyKey?: string;
  savePaymentMethod?: boolean;
  couponCode?: string;
  taxAmount?: number;
}

export interface RefundOptions {
  paymentIntentId: string;
  amount?: number; // Partial refund amount in dollars
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  refundApplicationFee?: boolean;
  reverseTransfer?: boolean;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

export interface CalculatedFees {
  subtotal: number;
  platformFee: number;
  processingFee: number;
  taxAmount: number;
  total: number;
  sellerPayout: number;
}

/**
 * Calculate platform and processing fees
 */
export function calculateFees(
  amount: number,
  options: {
    platformFeePercentage?: number;
    platformFeeFixed?: number;
    taxRate?: number;
    couponDiscount?: number;
  } = {}
): CalculatedFees {
  const subtotal = amount;
  const platformFeePercentage = options.platformFeePercentage ?? PLATFORM_FEE_PERCENTAGE;
  const platformFeeFixed = (options.platformFeeFixed ?? PLATFORM_FEE_FIXED_CENTS) / 100;
  const taxRate = options.taxRate ?? TAX_RATE;
  const couponDiscount = options.couponDiscount ?? 0;

  // Apply coupon discount
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  
  // Calculate fees
  const platformFee = (discountedSubtotal * platformFeePercentage / 100) + platformFeeFixed;
  const processingFee = discountedSubtotal * 0.029 + 0.30; // Stripe's standard processing fee
  const taxAmount = discountedSubtotal * (taxRate / 100);
  const total = discountedSubtotal + taxAmount;
  const sellerPayout = discountedSubtotal - platformFee - processingFee;

  return {
    subtotal: discountedSubtotal,
    platformFee: Math.round(platformFee * 100) / 100,
    processingFee: Math.round(processingFee * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    sellerPayout: Math.max(0, Math.round(sellerPayout * 100) / 100),
  };
}

/**
 * Create a payment intent with split payment support
 */
export async function createPaymentIntent(
  options: CreatePaymentIntentOptions
): Promise<Stripe.PaymentIntent> {
  try {
    const stripeClient = getStripeClient();
    
    // Calculate fees
    const fees = calculateFees(options.amount, {
      taxRate: options.taxAmount ? (options.taxAmount / options.amount * 100) : undefined,
    });

    // Prepare payment intent parameters
    const params: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(fees.total * 100), // Convert to cents
      currency: options.currency || 'usd',
      description: options.description,
      metadata: {
        ...options.metadata,
        platformFee: fees.platformFee.toString(),
        sellerPayout: fees.sellerPayout.toString(),
        taxAmount: fees.taxAmount.toString(),
      },
      payment_method_types: options.paymentMethodTypes?.length 
        ? options.paymentMethodTypes as Stripe.PaymentIntentCreateParams.PaymentMethodType[]
        : ['card'],
      capture_method: options.captureMethod || 'automatic',
      confirmation_method: options.confirmationMethod || 'automatic',
      receipt_email: options.receiptEmail,
      shipping: options.shipping,
    };

    // Add customer if provided
    if (options.customerId) {
      params.customer = options.customerId;
    }

    // Setup future usage if saving payment method
    if (options.savePaymentMethod || options.setupFutureUsage) {
      params.setup_future_usage = options.setupFutureUsage || 'off_session';
    }

    // Add 3D Secure if required
    if (options.use3DSecure) {
      params.payment_method_options = {
        card: {
          request_three_d_secure: 'any',
        },
      };
    }

    // Handle destination charges for Connect accounts
    if (options.sellerId || options.transferData?.destination) {
      const destination = options.sellerId || options.transferData!.destination;
      
      // Destination charge (recommended for marketplaces)
      params.transfer_data = {
        destination,
        amount: options.transferData?.amount 
          ? Math.round(options.transferData.amount * 100)
          : Math.round(fees.sellerPayout * 100),
      };
      
      // Application fee
      params.application_fee_amount = options.applicationFeeAmount 
        ? Math.round(options.applicationFeeAmount * 100)
        : Math.round(fees.platformFee * 100);
    }

    // Add statement descriptor
    if (options.statementDescriptor) {
      params.statement_descriptor = options.statementDescriptor;
    }
    if (options.statementDescriptorSuffix) {
      params.statement_descriptor_suffix = options.statementDescriptorSuffix;
    }

    // Create payment intent with idempotency
    const paymentIntent = await stripeClient.paymentIntents.create(
      params,
      options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}
    );

    logger.info('Payment intent created', {
      paymentIntentId: paymentIntent.id,
      amount: options.amount,
      sellerId: options.sellerId,
      fees,
    });

    trackEvent(
      options.customerId || 'guest',
      'payment_intent_created',
      {
        paymentIntentId: paymentIntent.id,
        amount: options.amount,
        currency: options.currency,
        fees,
      }
    );

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to create payment intent', { error, options });
    throw new Error(
      `Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string,
  returnUrl?: string
): Promise<Stripe.PaymentIntent> {
  try {
    const stripeClient = getStripeClient();
    
    const confirmParams: Stripe.PaymentIntentConfirmParams = {
      return_url: returnUrl,
    };

    if (paymentMethodId) {
      confirmParams.payment_method = paymentMethodId;
    }

    const paymentIntent = await stripeClient.paymentIntents.confirm(
      paymentIntentId,
      confirmParams
    );

    logger.info('Payment intent confirmed', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to confirm payment intent', { error, paymentIntentId });
    throw new Error(
      `Failed to confirm payment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string,
  cancellationReason?: string
): Promise<Stripe.PaymentIntent> {
  try {
    const stripeClient = getStripeClient();
    
    const paymentIntent = await stripeClient.paymentIntents.cancel(
      paymentIntentId,
      cancellationReason ? { cancellation_reason: cancellationReason as any } : {}
    );

    logger.info('Payment intent canceled', {
      paymentIntentId: paymentIntent.id,
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to cancel payment intent', { error, paymentIntentId });
    throw new Error(
      `Failed to cancel payment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Process a refund with support for partial refunds
 */
export async function processRefund(options: RefundOptions): Promise<Stripe.Refund> {
  try {
    const stripeClient = getStripeClient();

    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: options.paymentIntentId,
      amount: options.amount ? Math.round(options.amount * 100) : undefined, // Partial refund
      reason: options.reason,
      metadata: options.metadata,
      refund_application_fee: options.refundApplicationFee,
      reverse_transfer: options.reverseTransfer,
    };

    const refund = await stripeClient.refunds.create(
      refundParams,
      options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}
    );

    logger.info('Refund processed', {
      refundId: refund.id,
      paymentIntentId: options.paymentIntentId,
      amount: refund.amount / 100,
    });

    trackEvent(
      'system',
      'refund_processed',
      {
        refundId: refund.id,
        paymentIntentId: options.paymentIntentId,
        amount: refund.amount / 100,
        reason: options.reason,
      }
    );

    return refund;
  } catch (error) {
    logger.error('Failed to process refund', { error, options });
    throw new Error(
      `Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create or retrieve a Stripe customer
 */
export async function createOrRetrieveCustomer(
  userId: string,
  email?: string,
  name?: string
): Promise<Stripe.Customer> {
  try {
    const stripeClient = getStripeClient();
    
    // Check if customer exists in cache
    const cacheKey = `stripe:customer:${userId}`;
    const cached = await cache?.get<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Search for existing customer by metadata
    const customers = await stripeClient.customers.list({
      limit: 1,
      email: email,
    });

    let customer: Stripe.Customer;
    
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      // Create new customer
      customer = await stripeClient.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      logger.info('Stripe customer created', {
        customerId: customer.id,
        userId,
      });
    }

    // Cache for 1 hour
    if (cache) {
      await cache.set(cacheKey, JSON.stringify(customer), 3600);
    }

    return customer;
  } catch (error) {
    logger.error('Failed to create/retrieve customer', { error, userId });
    throw new Error(
      `Failed to manage customer: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Save a payment method for future use
 */
export async function savePaymentMethod(
  customerId: string,
  paymentMethodId: string,
  setAsDefault: boolean = false
): Promise<Stripe.PaymentMethod> {
  try {
    const stripeClient = getStripeClient();
    
    // Attach payment method to customer
    const paymentMethod = await stripeClient.paymentMethods.attach(
      paymentMethodId,
      { customer: customerId }
    );

    // Set as default if requested
    if (setAsDefault) {
      await stripeClient.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    logger.info('Payment method saved', {
      paymentMethodId,
      customerId,
      setAsDefault,
    });

    return paymentMethod;
  } catch (error) {
    logger.error('Failed to save payment method', { error, customerId, paymentMethodId });
    throw new Error(
      `Failed to save payment method: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * List saved payment methods for a customer
 */
export async function listPaymentMethods(
  customerId: string,
  type: 'card' | 'us_bank_account' = 'card'
): Promise<Stripe.PaymentMethod[]> {
  try {
    const stripeClient = getStripeClient();
    
    const paymentMethods = await stripeClient.paymentMethods.list({
      customer: customerId,
      type,
    });

    return paymentMethods.data;
  } catch (error) {
    logger.error('Failed to list payment methods', { error, customerId });
    throw new Error(
      `Failed to retrieve payment methods: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete a payment method
 */
export async function deletePaymentMethod(
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  try {
    const stripeClient = getStripeClient();
    
    const paymentMethod = await stripeClient.paymentMethods.detach(paymentMethodId);

    logger.info('Payment method deleted', { paymentMethodId });

    return paymentMethod;
  } catch (error) {
    logger.error('Failed to delete payment method', { error, paymentMethodId });
    throw new Error(
      `Failed to delete payment method: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create a subscription for premium features
 */
export async function createSubscription(
  customerId: string,
  priceId: string,
  options: {
    trialDays?: number;
    metadata?: Record<string, string>;
    coupon?: string;
    paymentMethodId?: string;
  } = {}
): Promise<Stripe.Subscription> {
  try {
    const stripeClient = getStripeClient();
    
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      metadata: options.metadata,
      trial_period_days: options.trialDays,
      coupon: options.coupon,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    };

    if (options.paymentMethodId) {
      subscriptionParams.default_payment_method = options.paymentMethodId;
    }

    const subscription = await stripeClient.subscriptions.create(subscriptionParams);

    logger.info('Subscription created', {
      subscriptionId: subscription.id,
      customerId,
      priceId,
    });

    trackEvent(
      customerId,
      'subscription_created',
      {
        subscriptionId: subscription.id,
        priceId,
        trialDays: options.trialDays,
      }
    );

    return subscription;
  } catch (error) {
    logger.error('Failed to create subscription', { error, customerId, priceId });
    throw new Error(
      `Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> {
  try {
    const stripeClient = getStripeClient();
    
    const subscription = immediately
      ? await stripeClient.subscriptions.cancel(subscriptionId)
      : await stripeClient.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });

    logger.info('Subscription canceled', {
      subscriptionId,
      immediately,
    });

    return subscription;
  } catch (error) {
    logger.error('Failed to cancel subscription', { error, subscriptionId });
    throw new Error(
      `Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create a transfer to a Connect account
 */
export async function createTransfer(
  amount: number,
  destinationAccountId: string,
  options: {
    currency?: string;
    description?: string;
    sourceTransaction?: string;
    metadata?: Record<string, string>;
    transferGroup?: string;
  } = {}
): Promise<Stripe.Transfer> {
  try {
    const stripeClient = getStripeClient();
    
    const transfer = await stripeClient.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: options.currency || 'usd',
      destination: destinationAccountId,
      description: options.description,
      source_transaction: options.sourceTransaction,
      metadata: options.metadata,
      transfer_group: options.transferGroup,
    });

    logger.info('Transfer created', {
      transferId: transfer.id,
      amount,
      destination: destinationAccountId,
    });

    return transfer;
  } catch (error) {
    logger.error('Failed to create transfer', { error, amount, destinationAccountId });
    throw new Error(
      `Failed to create transfer: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate a financial report
 */
export async function generateFinancialReport(
  startDate: Date,
  endDate: Date,
  options: {
    accountId?: string; // Connect account ID
    includeTransfers?: boolean;
    includePayouts?: boolean;
    includeCharges?: boolean;
    includeRefunds?: boolean;
    includeDisputes?: boolean;
  } = {}
): Promise<{
  summary: {
    totalRevenue: number;
    totalFees: number;
    totalPayouts: number;
    totalRefunds: number;
    netRevenue: number;
  };
  transactions: any[];
  byDay: Record<string, any>;
}> {
  try {
    const stripeClient = getStripeClient();
    const stripeAccount = options.accountId ? { stripeAccount: options.accountId } : {};

    // Fetch charges
    const charges = options.includeCharges !== false
      ? await stripeClient.charges.list(
          {
            created: {
              gte: Math.floor(startDate.getTime() / 1000),
              lte: Math.floor(endDate.getTime() / 1000),
            },
            limit: 100,
          },
          stripeAccount
        )
      : { data: [] };

    // Fetch refunds
    const refunds = options.includeRefunds !== false
      ? await stripeClient.refunds.list(
          {
            created: {
              gte: Math.floor(startDate.getTime() / 1000),
              lte: Math.floor(endDate.getTime() / 1000),
            },
            limit: 100,
          },
          stripeAccount
        )
      : { data: [] };

    // Fetch payouts
    const payouts = options.includePayouts !== false && options.accountId
      ? await stripeClient.payouts.list(
          {
            created: {
              gte: Math.floor(startDate.getTime() / 1000),
              lte: Math.floor(endDate.getTime() / 1000),
            },
            limit: 100,
          },
          stripeAccount
        )
      : { data: [] };

    // Calculate summary
    const totalRevenue = charges.data.reduce((sum, charge) => sum + charge.amount, 0) / 100;
    const totalRefunds = refunds.data.reduce((sum, refund) => sum + refund.amount, 0) / 100;
    const totalPayouts = payouts.data.reduce((sum, payout) => sum + payout.amount, 0) / 100;
    const totalFees = charges.data.reduce((sum, charge) => 
      sum + (charge.application_fee_amount || 0), 0
    ) / 100;

    const summary = {
      totalRevenue,
      totalFees,
      totalPayouts,
      totalRefunds,
      netRevenue: totalRevenue - totalRefunds - totalFees,
    };

    // Group transactions by day
    const byDay: Record<string, any> = {};
    charges.data.forEach(charge => {
      const date = new Date(charge.created * 1000).toISOString().split('T')[0];
      if (!byDay[date]) byDay[date] = { revenue: 0, refunds: 0, fees: 0, transactions: 0 };
      byDay[date].revenue += charge.amount / 100;
      byDay[date].fees += (charge.application_fee_amount || 0) / 100;
      byDay[date].transactions += 1;
    });

    refunds.data.forEach(refund => {
      const date = new Date(refund.created * 1000).toISOString().split('T')[0];
      if (!byDay[date]) byDay[date] = { revenue: 0, refunds: 0, fees: 0, transactions: 0 };
      byDay[date].refunds += refund.amount / 100;
    });

    // Combine all transactions
    const transactions = [
      ...charges.data.map(c => ({ ...c, type: 'charge' })),
      ...refunds.data.map(r => ({ ...r, type: 'refund' })),
      ...payouts.data.map(p => ({ ...p, type: 'payout' })),
    ].sort((a, b) => b.created - a.created);

    logger.info('Financial report generated', {
      startDate,
      endDate,
      summary,
    });

    return {
      summary,
      transactions,
      byDay,
    };
  } catch (error) {
    logger.error('Failed to generate financial report', { error, startDate, endDate });
    throw new Error(
      `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create a coupon
 */
export async function createCoupon(
  options: {
    percentOff?: number;
    amountOff?: number;
    currency?: string;
    duration: 'once' | 'repeating' | 'forever';
    durationInMonths?: number;
    maxRedemptions?: number;
    redeemBy?: Date;
    id?: string;
    name?: string;
    metadata?: Record<string, string>;
  }
): Promise<Stripe.Coupon> {
  try {
    const stripeClient = getStripeClient();
    
    const couponParams: Stripe.CouponCreateParams = {
      percent_off: options.percentOff,
      amount_off: options.amountOff ? Math.round(options.amountOff * 100) : undefined,
      currency: options.currency || 'usd',
      duration: options.duration,
      duration_in_months: options.durationInMonths,
      max_redemptions: options.maxRedemptions,
      redeem_by: options.redeemBy ? Math.floor(options.redeemBy.getTime() / 1000) : undefined,
      id: options.id,
      name: options.name,
      metadata: options.metadata,
    };

    const coupon = await stripeClient.coupons.create(couponParams);

    logger.info('Coupon created', {
      couponId: coupon.id,
      percentOff: options.percentOff,
      amountOff: options.amountOff,
    });

    return coupon;
  } catch (error) {
    logger.error('Failed to create coupon', { error, options });
    throw new Error(
      `Failed to create coupon: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Apply tax calculation using Stripe Tax
 */
export async function calculateTax(
  amount: number,
  address: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  }
): Promise<{
  taxAmount: number;
  taxRate: number;
  jurisdiction: string;
}> {
  try {
    // For production, you would use Stripe Tax API
    // For now, return a simple calculation
    const taxRate = TAX_RATE; // Default 7%
    const taxAmount = amount * (taxRate / 100);

    return {
      taxAmount: Math.round(taxAmount * 100) / 100,
      taxRate,
      jurisdiction: `${address.state}, ${address.country}`,
    };
  } catch (error) {
    logger.error('Failed to calculate tax', { error, amount, address });
    throw new Error(
      `Failed to calculate tax: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Handle disputes and chargebacks
 */
export async function handleDispute(
  disputeId: string,
  evidence: {
    customerCommunication?: string;
    receipt?: string;
    shippingDocumentation?: string;
    serviceDocumentation?: string;
    refundPolicy?: string;
    metadata?: Record<string, string>;
  }
): Promise<Stripe.Dispute> {
  try {
    const stripeClient = getStripeClient();
    
    const dispute = await stripeClient.disputes.update(disputeId, {
      evidence: {
        customer_communication: evidence.customerCommunication,
        receipt: evidence.receipt,
        shipping_documentation: evidence.shippingDocumentation,
        service_documentation: evidence.serviceDocumentation,
        refund_policy: evidence.refundPolicy,
      },
      metadata: evidence.metadata,
    });

    logger.info('Dispute evidence submitted', {
      disputeId,
      hasReceipt: !!evidence.receipt,
      hasShipping: !!evidence.shippingDocumentation,
    });

    return dispute;
  } catch (error) {
    logger.error('Failed to handle dispute', { error, disputeId });
    throw new Error(
      `Failed to handle dispute: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export default {
  createPaymentIntent,
  confirmPaymentIntent,
  cancelPaymentIntent,
  processRefund,
  createOrRetrieveCustomer,
  savePaymentMethod,
  listPaymentMethods,
  deletePaymentMethod,
  createSubscription,
  cancelSubscription,
  createTransfer,
  generateFinancialReport,
  createCoupon,
  calculateTax,
  calculateFees,
  handleDispute,
};