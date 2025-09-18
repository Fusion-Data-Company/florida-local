import Stripe from "stripe";
import { logger, trackEvent } from "./monitoring";
import { cache } from "./redis";
import { emailQueue } from "./redis";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

interface ConnectAccountData {
  businessId: string;
  userId: string;
  email: string;
  businessName: string;
  businessType: string;
  country?: string;
}

// Create a Connect account
export async function createConnectAccount(data: ConnectAccountData): Promise<Stripe.Account | null> {
  if (!stripe) {
    logger.error("Stripe not configured");
    return null;
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: data.country || "US",
      email: data.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "company",
      company: {
        name: data.businessName,
      },
      metadata: {
        businessId: data.businessId,
        userId: data.userId,
        platform: "florida-elite",
      },
      settings: {
        payouts: {
          schedule: {
            interval: "daily",
            delay_days: 2,
          },
        },
      },
    });

    // Cache account data
    await cache.set(`stripe:account:${data.businessId}`, account, 3600);

    // Track event
    trackEvent(data.userId, "stripe_connect_account_created", {
      businessId: data.businessId,
      accountId: account.id,
    });

    // Queue welcome email
    await emailQueue.add("send-email", {
      to: data.email,
      subject: "Welcome to Florida Elite Payments",
      template: "stripeConnectWelcome",
      data: {
        businessName: data.businessName,
        accountId: account.id,
      },
    });

    logger.info("Stripe Connect account created", {
      businessId: data.businessId,
      accountId: account.id,
    });

    return account;
  } catch (error) {
    logger.error("Failed to create Connect account", { error, data });
    throw error;
  }
}

// Create account link for onboarding
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink | null> {
  if (!stripe) {
    logger.error("Stripe not configured");
    return null;
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return accountLink;
  } catch (error) {
    logger.error("Failed to create account link", { error, accountId });
    throw error;
  }
}

// Get Connect account
export async function getConnectAccount(accountId: string): Promise<Stripe.Account | null> {
  if (!stripe) {
    logger.error("Stripe not configured");
    return null;
  }

  try {
    // Check cache first
    const cached = await cache.get<Stripe.Account>(`stripe:account:full:${accountId}`);
    if (cached) {
      return cached;
    }

    const account = await stripe.accounts.retrieve(accountId);
    
    // Cache for 5 minutes
    await cache.set(`stripe:account:full:${accountId}`, account, 300);

    return account;
  } catch (error) {
    logger.error("Failed to retrieve Connect account", { error, accountId });
    throw error;
  }
}

// Check if account is fully onboarded
export function isAccountOnboarded(account: Stripe.Account): boolean {
  return account.charges_enabled && account.payouts_enabled;
}

// Create a payment intent with Connect
export async function createConnectPaymentIntent(
  amount: number,
  currency: string,
  connectedAccountId: string,
  platformFeePercent: number = 2.5, // 2.5% platform fee
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) {
    logger.error("Stripe not configured");
    return null;
  }

  try {
    const platformFee = Math.round(amount * (platformFeePercent / 100));

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      application_fee_amount: platformFee,
      metadata: {
        ...metadata,
        platform: "florida-elite",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    }, {
      stripeAccount: connectedAccountId,
    });

    logger.info("Connect payment intent created", {
      paymentIntentId: paymentIntent.id,
      amount,
      platformFee,
      connectedAccountId,
    });

    return paymentIntent;
  } catch (error) {
    logger.error("Failed to create Connect payment intent", { 
      error, 
      amount, 
      connectedAccountId 
    });
    throw error;
  }
}

// Create a transfer to a Connect account
export async function createTransfer(
  amount: number,
  currency: string,
  destinationAccountId: string,
  description?: string,
  sourceTransaction?: string
): Promise<Stripe.Transfer | null> {
  if (!stripe) {
    logger.error("Stripe not configured");
    return null;
  }

  try {
    const transfer = await stripe.transfers.create({
      amount,
      currency,
      destination: destinationAccountId,
      description: description || "Florida Elite marketplace payout",
      source_transaction: sourceTransaction,
      metadata: {
        platform: "florida-elite",
      },
    });

    logger.info("Transfer created", {
      transferId: transfer.id,
      amount,
      destinationAccountId,
    });

    return transfer;
  } catch (error) {
    logger.error("Failed to create transfer", { 
      error, 
      amount, 
      destinationAccountId 
    });
    throw error;
  }
}

// Create a payout for a Connect account
export async function createPayout(
  accountId: string,
  amount: number,
  currency: string = "usd",
  description?: string
): Promise<Stripe.Payout | null> {
  if (!stripe) {
    logger.error("Stripe not configured");
    return null;
  }

  try {
    const payout = await stripe.payouts.create({
      amount,
      currency,
      description: description || "Florida Elite earnings payout",
      metadata: {
        platform: "florida-elite",
      },
    }, {
      stripeAccount: accountId,
    });

    logger.info("Payout created", {
      payoutId: payout.id,
      amount,
      accountId,
    });

    return payout;
  } catch (error) {
    logger.error("Failed to create payout", { 
      error, 
      amount, 
      accountId 
    });
    throw error;
  }
}

// Get balance for a Connect account
export async function getAccountBalance(accountId: string): Promise<Stripe.Balance | null> {
  if (!stripe) {
    logger.error("Stripe not configured");
    return null;
  }

  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    return balance;
  } catch (error) {
    logger.error("Failed to get account balance", { error, accountId });
    throw error;
  }
}

// List payouts for a Connect account
export async function listPayouts(
  accountId: string,
  limit: number = 10
): Promise<Stripe.Payout[] | null> {
  if (!stripe) {
    logger.error("Stripe not configured");
    return null;
  }

  try {
    const payouts = await stripe.payouts.list({
      limit,
    }, {
      stripeAccount: accountId,
    });

    return payouts.data;
  } catch (error) {
    logger.error("Failed to list payouts", { error, accountId });
    throw error;
  }
}

// Handle Connect webhooks
export async function handleConnectWebhook(
  event: Stripe.Event,
  accountId?: string
): Promise<void> {
  switch (event.type) {
    case "account.updated":
      const account = event.data.object as Stripe.Account;
      
      // Clear cache
      await cache.delete(`stripe:account:full:${account.id}`);
      
      // Check if onboarding completed
      if (isAccountOnboarded(account)) {
        // Queue notification email
        await emailQueue.add("send-email", {
          to: account.email || "",
          subject: "Your Florida Elite account is ready!",
          template: "stripeConnectOnboarded",
          data: {
            businessName: account.business_profile?.name,
          },
        });
        
        // Update business record
        // await storage.updateBusinessStripeStatus(account.metadata.businessId, "active");
      }
      break;

    case "payout.paid":
      const payout = event.data.object as Stripe.Payout;
      logger.info("Payout completed", {
        payoutId: payout.id,
        amount: payout.amount,
        accountId,
      });
      break;

    case "payout.failed":
      const failedPayout = event.data.object as Stripe.Payout;
      logger.error("Payout failed", {
        payoutId: failedPayout.id,
        failure: failedPayout.failure_message,
        accountId,
      });
      
      // Queue failure notification
      await emailQueue.add("send-email", {
        to: event.account || "",
        subject: "Payout failed - Action required",
        template: "payoutFailed",
        data: {
          amount: failedPayout.amount,
          reason: failedPayout.failure_message,
        },
      });
      break;

    case "capability.updated":
      const capability = event.data.object as Stripe.Capability;
      logger.info("Capability updated", {
        capability: capability.id,
        status: capability.status,
        accountId,
      });
      break;
  }
}

// Generate 1099 forms (for US vendors)
export async function generate1099(
  accountId: string,
  year: number
): Promise<any> {
  // This would integrate with a service like Abound or Track1099
  // For now, return placeholder
  logger.info("1099 generation requested", { accountId, year });
  
  return {
    status: "pending",
    message: "1099 generation will be available in production",
  };
}
