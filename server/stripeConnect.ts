/**
 * Stripe Connect Integration
 * 
 * Production-ready Stripe Connect implementation for marketplace/vendor payouts.
 * Implements:
 * - Connect account creation and onboarding
 * - Balance and payout management
 * - Transaction tracking
 * - Webhook processing
 * 
 * @see https://stripe.com/docs/connect
 */

import Stripe from "stripe";
import { logger, trackEvent } from "./monitoring";
import { cache } from "./redis";
import { emailQueue } from "./redis";
import type { IStorage } from "./storage";

// Lazy Stripe initialization - defers error until actual use
let stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        'STRIPE_SECRET_KEY environment variable is required for payment processing. ' +
        'Please configure Stripe keys in your environment.'
      );
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
      telemetry: false, // Disable telemetry in production
    });
  }
  return stripe;
}

export interface ConnectAccountData {
  businessId: string;
  userId: string;
  email: string;
  businessName: string;
  businessType: string;
  country?: string;
}

export interface PayoutSettings {
  interval?: 'daily' | 'weekly' | 'monthly' | 'manual';
  delayDays?: number;
}

/**
 * Create a Stripe Connect account for a business
 * @throws {Error} If account creation fails
 */
export async function createConnectAccount(data: ConnectAccountData): Promise<Stripe.Account> {
  try {
    const stripeClient = getStripeClient();
    const account = await stripeClient.accounts.create({
      type: 'express', // Express accounts have simplified onboarding
      country: data.country || 'US',
      email: data.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      business_profile: {
        name: data.businessName,
        product_description: 'Marketplace vendor services',
        mcc: '5734', // Computer software stores
      },
      metadata: {
        businessId: data.businessId,
        userId: data.userId,
      },
    });

    logger.info('Stripe Connect account created', {
      accountId: account.id,
      businessId: data.businessId,
      userId: data.userId,
    });

    trackEvent(
      data.userId,
      'stripe_connect_account_created',
      {
        accountId: account.id,
        businessId: data.businessId,
      }
    );

    return account;
  } catch (error) {
    logger.error('Failed to create Stripe Connect account', {
      error,
      businessId: data.businessId,
    });
    throw new Error(
      `Failed to create payment account: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get a Stripe Connect account by ID
 * @throws {Error} If account retrieval fails
 */
export async function getConnectAccount(accountId: string): Promise<Stripe.Account> {
  try {
    // Try cache first
    const cacheKey = `stripe:account:${accountId}`;
    const cached = await cache?.get<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const stripeClient = getStripeClient();
    const account = await stripeClient.accounts.retrieve(accountId);

    // Cache for 5 minutes
    if (cache) {
      await cache.set(cacheKey, JSON.stringify(account), 300);
    }

    return account;
  } catch (error) {
    logger.error('Failed to retrieve Stripe Connect account', {
      error,
      accountId,
    });
    throw new Error(
      `Failed to retrieve payment account: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create an account link for onboarding
 * @throws {Error} If link creation fails
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink> {
  try {
    const stripeClient = getStripeClient();
    const accountLink = await stripeClient.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    logger.info('Account onboarding link created', { 
      accountId,
      url: accountLink.url,
    });

    return accountLink;
  } catch (error) {
    logger.error('Failed to create account link', { error, accountId });
    throw new Error(
      `Failed to create onboarding link: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a Connect account has completed onboarding
 */
export function isAccountOnboarded(account: Stripe.Account): boolean {
  return (
    account.charges_enabled === true &&
    account.payouts_enabled === true &&
    account.details_submitted === true
  );
}

/**
 * Get account balance
 * @throws {Error} If balance retrieval fails
 */
export async function getAccountBalance(accountId: string): Promise<Stripe.Balance> {
  try {
    const stripeClient = getStripeClient();
    const balance = await stripeClient.balance.retrieve({
      stripeAccount: accountId,
    });

    return balance;
  } catch (error) {
    logger.error('Failed to retrieve account balance', { error, accountId });
    throw new Error(
      `Failed to retrieve balance: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * List payouts for an account
 * @throws {Error} If payout listing fails
 */
export async function listPayouts(
  accountId: string,
  limit: number = 10
): Promise<{ data: Stripe.Payout[]; hasMore: boolean }> {
  try {
    const stripeClient = getStripeClient();
    const payouts = await stripeClient.payouts.list(
      { limit },
      { stripeAccount: accountId }
    );

    return {
      data: payouts.data,
      hasMore: payouts.has_more,
    };
  } catch (error) {
    logger.error('Failed to list payouts', { error, accountId });
    throw new Error(
      `Failed to retrieve payouts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create a payout
 * @throws {Error} If payout creation fails
 */
export async function createPayout(
  accountId: string,
  amount: number,
  currency: string = 'usd',
  description?: string
): Promise<Stripe.Payout> {
  try {
    const stripeClient = getStripeClient();
    const payout = await stripeClient.payouts.create(
      {
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        description: description || 'Marketplace payout',
      },
      { stripeAccount: accountId }
    );

    logger.info('Payout created', {
      accountId,
      payoutId: payout.id,
      amount,
      currency,
    });

    trackEvent(
      accountId,
      'stripe_payout_created',
      {
        payoutId: payout.id,
        amount,
        currency,
      }
    );

    return payout;
  } catch (error) {
    logger.error('Failed to create payout', { error, accountId, amount });
    throw new Error(
      `Failed to create payout: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get payout settings for an account
 * @throws {Error} If settings retrieval fails
 */
export async function getPayoutSettings(accountId: string): Promise<{
  interval: string;
  delayDays: number;
}> {
  try {
    const account = await getConnectAccount(accountId);

    return {
      interval: account.settings?.payouts?.schedule?.interval || 'daily',
      delayDays: account.settings?.payouts?.schedule?.delay_days || 2,
    };
  } catch (error) {
    logger.error('Failed to get payout settings', { error, accountId });
    throw new Error(
      `Failed to retrieve payout settings: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update payout settings for an account
 * @throws {Error} If settings update fails
 */
export async function updatePayoutSettings(
  accountId: string,
  settings: PayoutSettings
): Promise<Stripe.Account> {
  try {
    const updateData: Stripe.AccountUpdateParams = {
      settings: {
        payouts: {
          schedule: {
            interval: settings.interval || 'daily',
            delay_days: settings.delayDays || 2,
          },
        },
      },
    };

    const stripeClient = getStripeClient();
    const account = await stripeClient.accounts.update(accountId, updateData);

    // Invalidate cache
    const cacheKey = `stripe:account:${accountId}`;
    if (cache) {
      await cache.delete(cacheKey);
    }

    logger.info('Payout settings updated', { accountId, settings });

    return account;
  } catch (error) {
    logger.error('Failed to update payout settings', { error, accountId, settings });
    throw new Error(
      `Failed to update payout settings: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * List balance transactions (for transaction history)
 * @throws {Error} If transaction listing fails
 */
export async function listBalanceTransactions(
  accountId: string,
  options: { limit?: number; startingAfter?: string } = {}
): Promise<{ data: Stripe.BalanceTransaction[]; hasMore: boolean }> {
  try {
    const stripeClient = getStripeClient();
    const transactions = await stripeClient.balanceTransactions.list(
      {
        limit: options.limit || 10,
        ...(options.startingAfter && { starting_after: options.startingAfter }),
      },
      { stripeAccount: accountId }
    );

    return {
      data: transactions.data,
      hasMore: transactions.has_more,
    };
  } catch (error) {
    logger.error('Failed to list balance transactions', { error, accountId });
    throw new Error(
      `Failed to retrieve transactions: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Handle Stripe Connect webhook events
 * @throws {Error} If webhook processing fails
 */
export async function handleConnectWebhook(
  event: Stripe.Event,
  storage: IStorage
): Promise<void> {
  try {
    logger.info('Processing Stripe webhook', { 
      eventType: event.type,
      eventId: event.id,
    });

    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const businessId = account.metadata?.businessId;

        if (businessId && isAccountOnboarded(account)) {
          logger.info('Connect account onboarded', {
            accountId: account.id,
            businessId,
          });

          trackEvent(
            businessId,
            'stripe_connect_onboarded',
            {
              accountId: account.id,
            }
          );

          // Send notification email
          if (emailQueue) {
            try {
              await emailQueue.add('connect-onboarded', {
                businessId,
                accountId: account.id,
              });
            } catch (emailError) {
              logger.error('Failed to queue onboarding email', { 
                error: emailError, 
                businessId, 
                accountId: account.id 
              });
            }
          }
        }
        break;
      }

      case 'payout.paid':
      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        const status = event.type === 'payout.paid' ? 'paid' : 'failed';

        logger.info('Payout status updated', {
          payoutId: payout.id,
          status,
          amount: payout.amount / 100,
        });

        trackEvent(
          payout.id,
          'stripe_payout_updated',
          {
            status,
            amount: payout.amount / 100,
          }
        );
        break;
      }

      case 'account.external_account.created':
      case 'account.external_account.deleted': {
        const externalAccount = event.data.object;
        logger.info('External account updated', {
          eventType: event.type,
          accountId: externalAccount.account,
        });
        break;
      }

      default:
        logger.debug('Unhandled webhook event', { eventType: event.type });
    }
  } catch (error) {
    logger.error('Failed to process webhook', { 
      error, 
      eventType: event.type,
      eventId: event.id,
    });
    throw new Error(
      `Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Verify webhook signature
 * @throws {Error} If signature verification fails or webhook secret is missing
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET environment variable is required for webhook verification. ' +
        'Please configure webhook secret in your environment.'
      );
    }
    
    const stripeClient = getStripeClient();
    return stripeClient.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    logger.error('Webhook signature verification failed', { error });
    throw new Error(
      `Webhook verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Export Stripe client getter for advanced usage
export { getStripeClient };
