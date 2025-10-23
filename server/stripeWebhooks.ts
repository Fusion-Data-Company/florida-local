/**
 * Stripe Webhook Handler
 * 
 * Comprehensive webhook processing for all Stripe events
 * Handles payment, account, payout, and dispute events with retry logic
 * 
 * @see https://stripe.com/docs/webhooks
 */

import Stripe from "stripe";
import { logger, trackEvent } from "./monitoring";
import { storage } from "./storage";
import type { IStorage } from "./storage";
import { cache, emailQueue } from "./redis";
import { getStripeClient } from "./stripeConnect";
import * as stripePayments from "./stripePayments";

// Event types we handle
export enum WebhookEventType {
  // Payment Intent Events
  PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED = 'payment_intent.payment_failed',
  PAYMENT_INTENT_CANCELED = 'payment_intent.canceled',
  PAYMENT_INTENT_PROCESSING = 'payment_intent.processing',
  PAYMENT_INTENT_REQUIRES_ACTION = 'payment_intent.requires_action',
  
  // Charge Events
  CHARGE_SUCCEEDED = 'charge.succeeded',
  CHARGE_FAILED = 'charge.failed',
  CHARGE_REFUNDED = 'charge.refunded',
  CHARGE_DISPUTE_CREATED = 'charge.dispute.created',
  CHARGE_DISPUTE_UPDATED = 'charge.dispute.updated',
  CHARGE_DISPUTE_CLOSED = 'charge.dispute.closed',
  
  // Connect Account Events
  ACCOUNT_UPDATED = 'account.updated',
  ACCOUNT_APPLICATION_DEAUTHORIZED = 'account.application.deauthorized',
  ACCOUNT_EXTERNAL_ACCOUNT_CREATED = 'account.external_account.created',
  ACCOUNT_EXTERNAL_ACCOUNT_DELETED = 'account.external_account.deleted',
  ACCOUNT_EXTERNAL_ACCOUNT_UPDATED = 'account.external_account.updated',
  
  // Payout Events
  PAYOUT_CREATED = 'payout.created',
  PAYOUT_UPDATED = 'payout.updated',
  PAYOUT_PAID = 'payout.paid',
  PAYOUT_FAILED = 'payout.failed',
  PAYOUT_CANCELED = 'payout.canceled',
  
  // Transfer Events
  TRANSFER_CREATED = 'transfer.created',
  TRANSFER_UPDATED = 'transfer.updated',
  TRANSFER_REVERSED = 'transfer.reversed',
  
  // Balance Events
  BALANCE_AVAILABLE = 'balance.available',
  
  // Payment Method Events
  PAYMENT_METHOD_ATTACHED = 'payment_method.attached',
  PAYMENT_METHOD_DETACHED = 'payment_method.detached',
  PAYMENT_METHOD_UPDATED = 'payment_method.updated',
  
  // Customer Events
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_DELETED = 'customer.deleted',
  CUSTOMER_SUBSCRIPTION_CREATED = 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED = 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
  
  // Invoice Events
  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  
  // Checkout Session Events
  CHECKOUT_SESSION_COMPLETED = 'checkout.session.completed',
  CHECKOUT_SESSION_EXPIRED = 'checkout.session.expired',
  
  // Capability Events
  CAPABILITY_UPDATED = 'capability.updated',
  
  // Person Events (for Connect)
  PERSON_CREATED = 'person.created',
  PERSON_UPDATED = 'person.updated',
  PERSON_DELETED = 'person.deleted',
}

// Webhook processing result
export interface WebhookProcessingResult {
  success: boolean;
  eventId: string;
  eventType: string;
  processed: boolean;
  error?: string;
  retryable?: boolean;
}

// Store processed events to prevent duplicates
const PROCESSED_EVENTS_KEY = 'stripe:webhook:processed';
const EVENT_LOCK_KEY = 'stripe:webhook:lock';
const EVENT_TTL = 86400; // 24 hours

/**
 * Check if an event has already been processed
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  if (!cache) return false;
  
  const key = `${PROCESSED_EVENTS_KEY}:${eventId}`;
  const exists = await cache.get(key);
  return !!exists;
}

/**
 * Mark an event as processed
 */
async function markEventProcessed(eventId: string): Promise<void> {
  if (!cache) return;
  
  const key = `${PROCESSED_EVENTS_KEY}:${eventId}`;
  await cache.set(key, '1', EVENT_TTL);
}

/**
 * Acquire a lock for processing an event (prevent race conditions)
 */
async function acquireEventLock(eventId: string, ttl: number = 30): Promise<boolean> {
  if (!cache) return true;
  
  const key = `${EVENT_LOCK_KEY}:${eventId}`;
  const acquired = await cache.setNX(key, '1', ttl);
  return acquired;
}

/**
 * Release an event lock
 */
async function releaseEventLock(eventId: string): Promise<void> {
  if (!cache) return;
  
  const key = `${EVENT_LOCK_KEY}:${eventId}`;
  await cache.delete(key);
}

/**
 * Main webhook handler with idempotency and retry logic
 */
export async function handleWebhookEvent(
  event: Stripe.Event,
  storage: IStorage
): Promise<WebhookProcessingResult> {
  const startTime = Date.now();
  
  try {
    // Check for duplicate processing
    if (await isEventProcessed(event.id)) {
      logger.info('Webhook event already processed', {
        eventId: event.id,
        eventType: event.type,
      });
      
      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        processed: false,
      };
    }
    
    // Acquire lock to prevent race conditions
    const lockAcquired = await acquireEventLock(event.id);
    if (!lockAcquired) {
      logger.info('Could not acquire lock for webhook event', {
        eventId: event.id,
        eventType: event.type,
      });
      
      return {
        success: false,
        eventId: event.id,
        eventType: event.type,
        processed: false,
        error: 'Could not acquire processing lock',
        retryable: true,
      };
    }
    
    try {
      // Process based on event type
      switch (event.type as WebhookEventType) {
        // Payment Intent Events
        case WebhookEventType.PAYMENT_INTENT_SUCCEEDED:
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, storage);
          break;
          
        case WebhookEventType.PAYMENT_INTENT_FAILED:
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, storage);
          break;
          
        case WebhookEventType.PAYMENT_INTENT_CANCELED:
          await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent, storage);
          break;
          
        case WebhookEventType.PAYMENT_INTENT_REQUIRES_ACTION:
          await handlePaymentIntentRequiresAction(event.data.object as Stripe.PaymentIntent, storage);
          break;
          
        // Charge Events
        case WebhookEventType.CHARGE_SUCCEEDED:
          await handleChargeSucceeded(event.data.object as Stripe.Charge, storage);
          break;
          
        case WebhookEventType.CHARGE_REFUNDED:
          await handleChargeRefunded(event.data.object as Stripe.Charge, storage);
          break;
          
        case WebhookEventType.CHARGE_DISPUTE_CREATED:
          await handleDisputeCreated(event.data.object as Stripe.Dispute, storage);
          break;
          
        // Connect Account Events
        case WebhookEventType.ACCOUNT_UPDATED:
          await handleAccountUpdated(event.data.object as Stripe.Account, storage);
          break;
          
        case WebhookEventType.ACCOUNT_APPLICATION_DEAUTHORIZED:
          await handleAccountDeauthorized(event.data.object as Stripe.Account, storage);
          break;
          
        // Payout Events
        case WebhookEventType.PAYOUT_PAID:
          await handlePayoutPaid(event.data.object as Stripe.Payout, storage);
          break;
          
        case WebhookEventType.PAYOUT_FAILED:
          await handlePayoutFailed(event.data.object as Stripe.Payout, storage);
          break;
          
        // Transfer Events
        case WebhookEventType.TRANSFER_CREATED:
          await handleTransferCreated(event.data.object as Stripe.Transfer, storage);
          break;
          
        case WebhookEventType.TRANSFER_REVERSED:
          await handleTransferReversed(event.data.object as Stripe.Transfer, storage);
          break;
          
        // Balance Events
        case WebhookEventType.BALANCE_AVAILABLE:
          await handleBalanceAvailable(event.data.object as Stripe.Balance, event.account as string, storage);
          break;
          
        // Payment Method Events
        case WebhookEventType.PAYMENT_METHOD_ATTACHED:
          await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod, storage);
          break;
          
        // Subscription Events
        case WebhookEventType.CUSTOMER_SUBSCRIPTION_CREATED:
        case WebhookEventType.CUSTOMER_SUBSCRIPTION_UPDATED:
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, storage);
          break;
          
        case WebhookEventType.CUSTOMER_SUBSCRIPTION_DELETED:
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, storage);
          break;
          
        // Checkout Events
        case WebhookEventType.CHECKOUT_SESSION_COMPLETED:
          await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, storage);
          break;
          
        // Capability Events
        case WebhookEventType.CAPABILITY_UPDATED:
          await handleCapabilityUpdated(event.data.object as Stripe.Capability, event.account as string, storage);
          break;
          
        default:
          logger.debug('Unhandled webhook event type', { eventType: event.type });
      }
      
      // Mark event as processed
      await markEventProcessed(event.id);
      
      // Track processing time
      const processingTime = Date.now() - startTime;
      logger.info('Webhook event processed successfully', {
        eventId: event.id,
        eventType: event.type,
        processingTime,
      });
      
      trackEvent(
        'system',
        'webhook_processed',
        {
          eventId: event.id,
          eventType: event.type,
          processingTime,
        }
      );
      
      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        processed: true,
      };
      
    } finally {
      // Always release the lock
      await releaseEventLock(event.id);
    }
    
  } catch (error) {
    logger.error('Failed to process webhook event', {
      error,
      eventId: event.id,
      eventType: event.type,
    });
    
    return {
      success: false,
      eventId: event.id,
      eventType: event.type,
      processed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      retryable: true,
    };
  }
}

// Individual event handlers

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  storage: IStorage
): Promise<void> {
  try {
    // Update payment status in database
    const orderId = paymentIntent.metadata?.orderId;
    if (orderId) {
      await storage.updateOrderStatus(orderId, 'paid');
      await storage.updatePaymentStatus(paymentIntent.id, 'succeeded');
    }
    
    // Send confirmation email
    if (emailQueue && paymentIntent.receipt_email) {
      await emailQueue.add('payment-confirmation', {
        email: paymentIntent.receipt_email,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      });
    }
    
    // Track successful payment
    trackEvent(
      paymentIntent.metadata?.userId || 'guest',
      'payment_succeeded',
      {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      }
    );
    
  } catch (error) {
    logger.error('Failed to handle payment intent succeeded', {
      error,
      paymentIntentId: paymentIntent.id,
    });
    throw error;
  }
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  storage: IStorage
): Promise<void> {
  try {
    // Update payment status in database
    const orderId = paymentIntent.metadata?.orderId;
    if (orderId) {
      await storage.updateOrderStatus(orderId, 'failed');
      await storage.updatePaymentStatus(paymentIntent.id, 'failed');
    }
    
    // Send failure notification
    if (emailQueue && paymentIntent.receipt_email) {
      await emailQueue.add('payment-failed', {
        email: paymentIntent.receipt_email,
        paymentIntentId: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message,
      });
    }
    
    // Track failed payment
    trackEvent(
      paymentIntent.metadata?.userId || 'guest',
      'payment_failed',
      {
        paymentIntentId: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message,
      }
    );
    
  } catch (error) {
    logger.error('Failed to handle payment intent failed', {
      error,
      paymentIntentId: paymentIntent.id,
    });
    throw error;
  }
}

async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent,
  storage: IStorage
): Promise<void> {
  try {
    const orderId = paymentIntent.metadata?.orderId;
    if (orderId) {
      await storage.updateOrderStatus(orderId, 'canceled');
      await storage.updatePaymentStatus(paymentIntent.id, 'canceled');
    }
  } catch (error) {
    logger.error('Failed to handle payment intent canceled', {
      error,
      paymentIntentId: paymentIntent.id,
    });
    throw error;
  }
}

async function handlePaymentIntentRequiresAction(
  paymentIntent: Stripe.PaymentIntent,
  storage: IStorage
): Promise<void> {
  try {
    // Send notification about required action (3D Secure, etc.)
    if (emailQueue && paymentIntent.receipt_email) {
      await emailQueue.add('payment-action-required', {
        email: paymentIntent.receipt_email,
        paymentIntentId: paymentIntent.id,
        actionType: '3D Secure Authentication',
      });
    }
  } catch (error) {
    logger.error('Failed to handle payment intent requires action', {
      error,
      paymentIntentId: paymentIntent.id,
    });
    throw error;
  }
}

async function handleChargeSucceeded(
  charge: Stripe.Charge,
  storage: IStorage
): Promise<void> {
  try {
    // Log successful charge
    logger.info('Charge succeeded', {
      chargeId: charge.id,
      amount: charge.amount / 100,
      currency: charge.currency,
    });
    
    // Update analytics
    const sellerId = charge.metadata?.sellerId;
    if (sellerId) {
      await storage.updateBusinessMetrics(sellerId, {
        totalRevenue: charge.amount / 100,
        transactionCount: 1,
      });
    }
  } catch (error) {
    logger.error('Failed to handle charge succeeded', {
      error,
      chargeId: charge.id,
    });
    throw error;
  }
}

async function handleChargeRefunded(
  charge: Stripe.Charge,
  storage: IStorage
): Promise<void> {
  try {
    const orderId = charge.metadata?.orderId;
    if (orderId) {
      const refundAmount = charge.amount_refunded / 100;
      const isFullRefund = charge.amount_refunded === charge.amount;
      
      await storage.updateOrderStatus(
        orderId,
        isFullRefund ? 'refunded' : 'partially_refunded'
      );
      
      // Send refund notification
      if (emailQueue && charge.receipt_email) {
        await emailQueue.add('refund-processed', {
          email: charge.receipt_email,
          chargeId: charge.id,
          refundAmount,
          isFullRefund,
        });
      }
    }
  } catch (error) {
    logger.error('Failed to handle charge refunded', {
      error,
      chargeId: charge.id,
    });
    throw error;
  }
}

async function handleDisputeCreated(
  dispute: Stripe.Dispute,
  storage: IStorage
): Promise<void> {
  try {
    // Log dispute for immediate attention
    logger.warn('Dispute created', {
      disputeId: dispute.id,
      amount: dispute.amount / 100,
      reason: dispute.reason,
      chargeId: dispute.charge,
    });
    
    // Send urgent notification
    if (emailQueue) {
      await emailQueue.add('dispute-alert', {
        disputeId: dispute.id,
        amount: dispute.amount / 100,
        reason: dispute.reason,
        evidenceDueBy: dispute.evidence_details?.due_by 
          ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
          : null,
      }, { priority: 1 });
    }
    
    // Track dispute
    trackEvent(
      'system',
      'dispute_created',
      {
        disputeId: dispute.id,
        amount: dispute.amount / 100,
        reason: dispute.reason,
      }
    );
  } catch (error) {
    logger.error('Failed to handle dispute created', {
      error,
      disputeId: dispute.id,
    });
    throw error;
  }
}

async function handleAccountUpdated(
  account: Stripe.Account,
  storage: IStorage
): Promise<void> {
  try {
    const businessId = account.metadata?.businessId;
    if (businessId) {
      // Update account status in database
      await storage.updateBusinessStripeInfo(businessId, {
        stripeAccountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        capabilities: account.capabilities,
      });
      
      // Check if account is now fully onboarded
      if (account.charges_enabled && account.payouts_enabled && account.details_submitted) {
        // Send onboarding complete notification
        if (emailQueue) {
          await emailQueue.add('connect-onboarded', {
            businessId,
            accountId: account.id,
          });
        }
        
        trackEvent(
          businessId,
          'connect_account_activated',
          { accountId: account.id }
        );
      }
      
      // Check for verification requirements
      if (account.requirements?.currently_due?.length) {
        // Send verification reminder
        if (emailQueue) {
          await emailQueue.add('verification-required', {
            businessId,
            requirements: account.requirements.currently_due,
            deadline: account.requirements.current_deadline,
          });
        }
      }
    }
  } catch (error) {
    logger.error('Failed to handle account updated', {
      error,
      accountId: account.id,
    });
    throw error;
  }
}

async function handleAccountDeauthorized(
  account: Stripe.Account,
  storage: IStorage
): Promise<void> {
  try {
    const businessId = account.metadata?.businessId;
    if (businessId) {
      // Disable Stripe integration for business
      await storage.updateBusinessStripeInfo(businessId, {
        stripeAccountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
      });
      
      logger.warn('Connect account deauthorized', {
        accountId: account.id,
        businessId,
      });
    }
  } catch (error) {
    logger.error('Failed to handle account deauthorized', {
      error,
      accountId: account.id,
    });
    throw error;
  }
}

async function handlePayoutPaid(
  payout: Stripe.Payout,
  storage: IStorage
): Promise<void> {
  try {
    // Log successful payout
    logger.info('Payout paid', {
      payoutId: payout.id,
      amount: payout.amount / 100,
      currency: payout.currency,
    });
    
    // Send payout confirmation
    if (emailQueue) {
      const businessId = payout.metadata?.businessId;
      if (businessId) {
        await emailQueue.add('payout-success', {
          businessId,
          payoutId: payout.id,
          amount: payout.amount / 100,
          currency: payout.currency,
          arrivalDate: new Date(payout.arrival_date * 1000).toISOString(),
        });
      }
    }
    
    trackEvent(
      payout.metadata?.businessId || 'system',
      'payout_succeeded',
      {
        payoutId: payout.id,
        amount: payout.amount / 100,
      }
    );
  } catch (error) {
    logger.error('Failed to handle payout paid', {
      error,
      payoutId: payout.id,
    });
    throw error;
  }
}

async function handlePayoutFailed(
  payout: Stripe.Payout,
  storage: IStorage
): Promise<void> {
  try {
    // Log failed payout
    logger.error('Payout failed', {
      payoutId: payout.id,
      amount: payout.amount / 100,
      failureCode: payout.failure_code,
      failureMessage: payout.failure_message,
    });
    
    // Send failure notification
    if (emailQueue) {
      const businessId = payout.metadata?.businessId;
      if (businessId) {
        await emailQueue.add('payout-failed', {
          businessId,
          payoutId: payout.id,
          amount: payout.amount / 100,
          failureReason: payout.failure_message,
        }, { priority: 1 });
      }
    }
  } catch (error) {
    logger.error('Failed to handle payout failed', {
      error,
      payoutId: payout.id,
    });
    throw error;
  }
}

async function handleTransferCreated(
  transfer: Stripe.Transfer,
  storage: IStorage
): Promise<void> {
  try {
    // Log transfer creation
    logger.info('Transfer created', {
      transferId: transfer.id,
      amount: transfer.amount / 100,
      destination: transfer.destination,
    });
    
    // Update vendor transaction records
    const orderId = transfer.metadata?.orderId;
    if (orderId) {
      await storage.createVendorTransaction({
        orderId,
        transferId: transfer.id,
        amount: transfer.amount / 100,
        destinationAccount: transfer.destination as string,
        status: 'pending',
      });
    }
  } catch (error) {
    logger.error('Failed to handle transfer created', {
      error,
      transferId: transfer.id,
    });
    throw error;
  }
}

async function handleTransferReversed(
  transfer: Stripe.Transfer,
  storage: IStorage
): Promise<void> {
  try {
    // Log transfer reversal
    logger.warn('Transfer reversed', {
      transferId: transfer.id,
      amount: transfer.amount_reversed / 100,
    });
    
    // Update vendor transaction
    await storage.updateVendorTransactionStatus(transfer.id, 'reversed');
    
    // Send reversal notification
    if (emailQueue) {
      const businessId = transfer.metadata?.businessId;
      if (businessId) {
        await emailQueue.add('transfer-reversed', {
          businessId,
          transferId: transfer.id,
          reversedAmount: transfer.amount_reversed / 100,
        }, { priority: 1 });
      }
    }
  } catch (error) {
    logger.error('Failed to handle transfer reversed', {
      error,
      transferId: transfer.id,
    });
    throw error;
  }
}

async function handleBalanceAvailable(
  balance: Stripe.Balance,
  accountId: string,
  storage: IStorage
): Promise<void> {
  try {
    // Log balance update
    const available = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
    const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;
    
    logger.info('Balance updated', {
      accountId,
      available,
      pending,
    });
    
    // Cache balance for quick retrieval
    if (cache) {
      const cacheKey = `stripe:balance:${accountId}`;
      await cache.set(cacheKey, JSON.stringify({ available, pending }), 300);
    }
  } catch (error) {
    logger.error('Failed to handle balance available', {
      error,
      accountId,
    });
    throw error;
  }
}

async function handlePaymentMethodAttached(
  paymentMethod: Stripe.PaymentMethod,
  storage: IStorage
): Promise<void> {
  try {
    // Log payment method attachment
    logger.info('Payment method attached', {
      paymentMethodId: paymentMethod.id,
      type: paymentMethod.type,
      customerId: paymentMethod.customer,
    });
    
    // Track saved payment method
    if (paymentMethod.customer) {
      trackEvent(
        paymentMethod.customer as string,
        'payment_method_saved',
        {
          paymentMethodId: paymentMethod.id,
          type: paymentMethod.type,
        }
      );
    }
  } catch (error) {
    logger.error('Failed to handle payment method attached', {
      error,
      paymentMethodId: paymentMethod.id,
    });
    throw error;
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  storage: IStorage
): Promise<void> {
  try {
    const userId = subscription.metadata?.userId;
    if (userId) {
      // Update user subscription status
      await storage.updateUserSubscription(userId, {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
      
      // Send subscription update notification
      if (emailQueue && subscription.customer) {
        await emailQueue.add('subscription-updated', {
          customerId: subscription.customer as string,
          subscriptionId: subscription.id,
          status: subscription.status,
        });
      }
    }
  } catch (error) {
    logger.error('Failed to handle subscription updated', {
      error,
      subscriptionId: subscription.id,
    });
    throw error;
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  storage: IStorage
): Promise<void> {
  try {
    const userId = subscription.metadata?.userId;
    if (userId) {
      // Remove subscription from user
      await storage.updateUserSubscription(userId, {
        subscriptionId: null,
        status: 'canceled',
      });
      
      // Send cancellation confirmation
      if (emailQueue && subscription.customer) {
        await emailQueue.add('subscription-canceled', {
          customerId: subscription.customer as string,
          subscriptionId: subscription.id,
        });
      }
    }
  } catch (error) {
    logger.error('Failed to handle subscription deleted', {
      error,
      subscriptionId: subscription.id,
    });
    throw error;
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  storage: IStorage
): Promise<void> {
  try {
    // Process successful checkout
    logger.info('Checkout session completed', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
    });
    
    // Create order from session
    if (session.metadata?.cartId && session.payment_status === 'paid') {
      const order = await storage.createOrderFromCart(
        session.metadata.cartId,
        session.payment_intent as string
      );
      
      // Send order confirmation
      if (emailQueue && session.customer_email) {
        await emailQueue.add('order-confirmation', {
          email: session.customer_email,
          orderId: order.id,
          amount: session.amount_total ? session.amount_total / 100 : 0,
        });
      }
    }
  } catch (error) {
    logger.error('Failed to handle checkout session completed', {
      error,
      sessionId: session.id,
    });
    throw error;
  }
}

async function handleCapabilityUpdated(
  capability: Stripe.Capability,
  accountId: string,
  storage: IStorage
): Promise<void> {
  try {
    // Log capability update
    logger.info('Capability updated', {
      accountId,
      capabilityId: capability.id,
      status: capability.status,
    });
    
    // Update business capabilities
    const businessId = capability.account;
    if (businessId) {
      await storage.updateBusinessCapability(accountId, capability.id, capability.status);
    }
  } catch (error) {
    logger.error('Failed to handle capability updated', {
      error,
      capabilityId: capability.id,
      accountId,
    });
    throw error;
  }
}

export default {
  handleWebhookEvent,
  WebhookEventType,
  isEventProcessed,
  markEventProcessed,
};