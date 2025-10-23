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
  businessType: 'individual' | 'company';
  country?: string;
  // Additional KYC fields
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  taxId?: string;
  ssnLast4?: string;
  dateOfBirth?: {
    day: number;
    month: number;
    year: number;
  };
  website?: string;
  mcc?: string; // Merchant Category Code
  productDescription?: string;
  tosAcceptance?: {
    date: number;
    ip: string;
    user_agent?: string;
  };
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
    
    const accountParams: Stripe.AccountCreateParams = {
      type: 'express', // Express accounts have simplified onboarding
      country: data.country || 'US',
      email: data.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
        us_bank_account_ach_payments: { requested: true }, // ACH support
      },
      business_type: data.businessType,
      business_profile: {
        name: data.businessName,
        product_description: data.productDescription || 'Marketplace vendor services',
        mcc: data.mcc || '5734', // Computer software stores
        url: data.website,
      },
      metadata: {
        businessId: data.businessId,
        userId: data.userId,
      },
    };

    // Add individual information if applicable
    if (data.businessType === 'individual' && (data.firstName || data.lastName)) {
      accountParams.individual = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        ssn_last_4: data.ssnLast4,
        dob: data.dateOfBirth,
      } as any;
    }

    // Add company information if applicable
    if (data.businessType === 'company') {
      accountParams.company = {
        name: data.businessName,
        phone: data.phone,
        tax_id: data.taxId,
        address: data.address,
      } as any;
    }

    // Add TOS acceptance
    if (data.tosAcceptance) {
      accountParams.tos_acceptance = data.tosAcceptance;
    }

    const account = await stripeClient.accounts.create(accountParams);

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
 * Create a login link for Express Dashboard
 */
export async function createLoginLink(
  accountId: string
): Promise<Stripe.LoginLink> {
  try {
    const stripeClient = getStripeClient();
    const loginLink = await stripeClient.accounts.createLoginLink(accountId);

    logger.info('Dashboard login link created', {
      accountId,
      url: loginLink.url,
    });

    return loginLink;
  } catch (error) {
    logger.error('Failed to create login link', { error, accountId });
    throw new Error(
      `Failed to create dashboard link: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get account verification status and requirements
 */
export async function getVerificationStatus(accountId: string): Promise<{
  isVerified: boolean;
  currentlyDue: string[];
  eventuallyDue: string[];
  pastDue: string[];
  pendingVerification: string[];
  disabledReason?: string;
  currentDeadline?: Date;
}> {
  try {
    const account = await getConnectAccount(accountId);
    
    return {
      isVerified: !account.requirements?.currently_due?.length,
      currentlyDue: account.requirements?.currently_due || [],
      eventuallyDue: account.requirements?.eventually_due || [],
      pastDue: account.requirements?.past_due || [],
      pendingVerification: account.requirements?.pending_verification || [],
      disabledReason: account.requirements?.disabled_reason,
      currentDeadline: account.requirements?.current_deadline 
        ? new Date(account.requirements.current_deadline * 1000)
        : undefined,
    };
  } catch (error) {
    logger.error('Failed to get verification status', { error, accountId });
    throw new Error(
      `Failed to get verification status: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update account verification information
 */
export async function updateVerificationInfo(
  accountId: string,
  updates: {
    individual?: Partial<Stripe.AccountUpdateParams.Individual>;
    company?: Partial<Stripe.AccountUpdateParams.Company>;
    documents?: {
      businessLogo?: string;
      businessIcon?: string;
      proofOfRegistration?: string;
    };
  }
): Promise<Stripe.Account> {
  try {
    const stripeClient = getStripeClient();
    
    const updateParams: Stripe.AccountUpdateParams = {};
    
    if (updates.individual) {
      updateParams.individual = updates.individual;
    }
    
    if (updates.company) {
      updateParams.company = updates.company;
    }
    
    if (updates.documents) {
      updateParams.documents = updates.documents as any;
    }
    
    const account = await stripeClient.accounts.update(accountId, updateParams);
    
    // Invalidate cache
    const cacheKey = `stripe:account:${accountId}`;
    if (cache) {
      await cache.delete(cacheKey);
    }
    
    logger.info('Account verification info updated', { accountId });
    
    return account;
  } catch (error) {
    logger.error('Failed to update verification info', { error, accountId });
    throw new Error(
      `Failed to update verification: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Add a bank account for payouts
 */
export async function addBankAccount(
  accountId: string,
  bankAccountDetails: {
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
    accountHolderType: 'individual' | 'company';
    currency?: string;
    country?: string;
  }
): Promise<Stripe.BankAccount> {
  try {
    const stripeClient = getStripeClient();
    
    const bankAccount = await stripeClient.accounts.createExternalAccount(accountId, {
      external_account: {
        object: 'bank_account',
        account_number: bankAccountDetails.accountNumber,
        routing_number: bankAccountDetails.routingNumber,
        account_holder_name: bankAccountDetails.accountHolderName,
        account_holder_type: bankAccountDetails.accountHolderType,
        currency: bankAccountDetails.currency || 'usd',
        country: bankAccountDetails.country || 'US',
      } as any,
    }) as Stripe.BankAccount;
    
    logger.info('Bank account added', {
      accountId,
      last4: bankAccount.last4,
    });
    
    return bankAccount;
  } catch (error) {
    logger.error('Failed to add bank account', { error, accountId });
    throw new Error(
      `Failed to add bank account: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Verify a bank account with micro-deposits
 */
export async function verifyBankAccount(
  accountId: string,
  bankAccountId: string,
  amounts: [number, number]
): Promise<Stripe.BankAccount> {
  try {
    const stripeClient = getStripeClient();
    
    const bankAccount = await stripeClient.accounts.verifyExternalAccount(
      accountId,
      bankAccountId,
      {
        amounts: amounts as any,
      }
    ) as Stripe.BankAccount;
    
    logger.info('Bank account verified', {
      accountId,
      bankAccountId,
      verified: bankAccount.status === 'verified',
    });
    
    return bankAccount;
  } catch (error) {
    logger.error('Failed to verify bank account', { error, accountId, bankAccountId });
    throw new Error(
      `Failed to verify bank account: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * List external accounts (bank accounts and cards)
 */
export async function listExternalAccounts(
  accountId: string,
  options: { limit?: number; object?: 'bank_account' | 'card' } = {}
): Promise<Stripe.ApiList<Stripe.BankAccount | Stripe.Card>> {
  try {
    const stripeClient = getStripeClient();
    
    const externalAccounts = await stripeClient.accounts.listExternalAccounts(
      accountId,
      {
        limit: options.limit || 10,
        object: options.object,
      }
    );
    
    return externalAccounts;
  } catch (error) {
    logger.error('Failed to list external accounts', { error, accountId });
    throw new Error(
      `Failed to list bank accounts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete an external account
 */
export async function deleteExternalAccount(
  accountId: string,
  externalAccountId: string
): Promise<Stripe.DeletedBankAccount | Stripe.DeletedCard> {
  try {
    const stripeClient = getStripeClient();
    
    const deleted = await stripeClient.accounts.deleteExternalAccount(
      accountId,
      externalAccountId
    );
    
    logger.info('External account deleted', {
      accountId,
      externalAccountId,
    });
    
    return deleted;
  } catch (error) {
    logger.error('Failed to delete external account', { error, accountId, externalAccountId });
    throw new Error(
      `Failed to delete bank account: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create an instant payout (for eligible accounts)
 */
export async function createInstantPayout(
  accountId: string,
  amount: number,
  currency: string = 'usd',
  destinationId?: string
): Promise<Stripe.Payout> {
  try {
    const stripeClient = getStripeClient();
    
    const payoutParams: Stripe.PayoutCreateParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      method: 'instant',
      description: 'Instant marketplace payout',
    };
    
    if (destinationId) {
      payoutParams.destination = destinationId;
    }
    
    const payout = await stripeClient.payouts.create(
      payoutParams,
      { stripeAccount: accountId }
    );
    
    logger.info('Instant payout created', {
      accountId,
      payoutId: payout.id,
      amount,
      currency,
    });
    
    trackEvent(
      accountId,
      'stripe_instant_payout_created',
      {
        payoutId: payout.id,
        amount,
        currency,
      }
    );
    
    return payout;
  } catch (error) {
    logger.error('Failed to create instant payout', { error, accountId, amount });
    throw new Error(
      `Failed to create instant payout: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get account capabilities (what payment methods are enabled)
 */
export async function getAccountCapabilities(accountId: string): Promise<{
  cardPayments: boolean;
  transfers: boolean;
  achPayments: boolean;
  taxReporting: boolean;
  instantPayouts: boolean;
  capabilities: Record<string, string>;
}> {
  try {
    const account = await getConnectAccount(accountId);
    
    return {
      cardPayments: account.capabilities?.card_payments === 'active',
      transfers: account.capabilities?.transfers === 'active',
      achPayments: account.capabilities?.us_bank_account_ach_payments === 'active',
      taxReporting: account.capabilities?.tax_reporting_us_1099_k === 'active',
      instantPayouts: account.capabilities?.instant_payouts === 'active',
      capabilities: account.capabilities as Record<string, string> || {},
    };
  } catch (error) {
    logger.error('Failed to get account capabilities', { error, accountId });
    throw new Error(
      `Failed to get capabilities: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Enable international payouts by updating supported currencies
 */
export async function enableInternationalPayouts(
  accountId: string,
  currencies: string[]
): Promise<Stripe.Account> {
  try {
    const stripeClient = getStripeClient();
    
    // Request capabilities for international payouts
    const capabilities: Record<string, { requested: boolean }> = {};
    
    // Common international payout capabilities
    if (currencies.includes('eur')) {
      capabilities.sepa_debit_payments = { requested: true };
    }
    if (currencies.includes('gbp')) {
      capabilities.bacs_debit_payments = { requested: true };
    }
    if (currencies.includes('cad')) {
      capabilities.acss_debit_payments = { requested: true };
    }
    
    const account = await stripeClient.accounts.update(accountId, {
      capabilities: capabilities as any,
      settings: {
        payouts: {
          debit_negative_balances: true,
        },
      },
    });
    
    logger.info('International payouts enabled', {
      accountId,
      currencies,
    });
    
    return account;
  } catch (error) {
    logger.error('Failed to enable international payouts', { error, accountId, currencies });
    throw new Error(
      `Failed to enable international payouts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get payout schedule and limits
 */
export async function getPayoutInfo(accountId: string): Promise<{
  schedule: {
    interval: string;
    delayDays: number;
    weeklyAnchor?: string;
    monthlyAnchor?: number;
  };
  instantPayouts: {
    available: boolean;
    minimumAmount: number;
    maximumAmount: number;
    percentageFee: number;
    fixedFee: number;
  };
}> {
  try {
    const account = await getConnectAccount(accountId);
    const stripeClient = getStripeClient();
    
    // Get instant payout limits if available
    let instantPayoutInfo = {
      available: false,
      minimumAmount: 0,
      maximumAmount: 0,
      percentageFee: 1.0,
      fixedFee: 0.25,
    };
    
    if (account.capabilities?.instant_payouts === 'active') {
      try {
        const balance = await stripeClient.balance.retrieve({
          stripeAccount: accountId,
        });
        
        if (balance.instant_available?.[0]) {
          instantPayoutInfo = {
            available: true,
            minimumAmount: 100, // $1.00 minimum
            maximumAmount: 1000000, // $10,000 maximum
            percentageFee: 1.0,
            fixedFee: 0.25,
          };
        }
      } catch (err) {
        logger.debug('Could not retrieve instant payout info', { accountId, error: err });
      }
    }
    
    return {
      schedule: {
        interval: account.settings?.payouts?.schedule?.interval || 'daily',
        delayDays: account.settings?.payouts?.schedule?.delay_days || 2,
        weeklyAnchor: account.settings?.payouts?.schedule?.weekly_anchor,
        monthlyAnchor: account.settings?.payouts?.schedule?.monthly_anchor,
      },
      instantPayouts: instantPayoutInfo,
    };
  } catch (error) {
    logger.error('Failed to get payout info', { error, accountId });
    throw new Error(
      `Failed to get payout information: ${error instanceof Error ? error.message : 'Unknown error'}`
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
