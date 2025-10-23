/**
 * Stripe Connect Integration Tests
 * Tests for Stripe Connect account management, payments, and webhooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Stripe from 'stripe';
import {
  createConnectAccount,
  getConnectAccount,
  createAccountLink,
  createPaymentIntent,
  retrievePaymentIntent,
  createPayout,
  updatePayoutSettings,
  getAccountBalance,
  getAccountTransactions,
  handleWebhook,
  type ConnectAccountData,
  type PayoutSettings,
} from '../stripeConnect';
import { logger } from '../monitoring';

// Mock Stripe
vi.mock('stripe', () => {
  const StripeMock = vi.fn();
  StripeMock.prototype.accounts = {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    del: vi.fn(),
    listCapabilities: vi.fn(),
  };
  StripeMock.prototype.accountLinks = {
    create: vi.fn(),
  };
  StripeMock.prototype.paymentIntents = {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
  };
  StripeMock.prototype.payouts = {
    create: vi.fn(),
    retrieve: vi.fn(),
    cancel: vi.fn(),
  };
  StripeMock.prototype.balance = {
    retrieve: vi.fn(),
  };
  StripeMock.prototype.balanceTransactions = {
    list: vi.fn(),
  };
  StripeMock.prototype.transfers = {
    create: vi.fn(),
  };
  StripeMock.prototype.webhooks = {
    constructEvent: vi.fn(),
  };
  return { default: StripeMock };
});

// Mock dependencies
vi.mock('../monitoring', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  trackEvent: vi.fn(),
}));

vi.mock('../redis', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
  emailQueue: {
    add: vi.fn(),
  },
}));

// Setup environment variables
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

let stripeMock: any;

beforeEach(() => {
  vi.clearAllMocks();
  // Reset Stripe mock instance
  const StripeConstructor = vi.mocked(Stripe);
  stripeMock = new StripeConstructor('test-key', {} as any);
});

describe('Connect Account Management', () => {
  describe('createConnectAccount', () => {
    it('should create a new Connect account', async () => {
      const accountData: ConnectAccountData = {
        businessId: 'business-123',
        userId: 'user-123',
        email: 'business@example.com',
        businessName: 'Test Business',
        businessType: 'company',
        country: 'US',
      };

      const mockAccount = {
        id: 'acct_test123',
        type: 'express',
        country: 'US',
        email: accountData.email,
        charges_enabled: false,
        payouts_enabled: false,
      };

      stripeMock.accounts.create.mockResolvedValue(mockAccount);

      const result = await createConnectAccount(accountData);

      expect(result).toEqual(mockAccount);
      expect(stripeMock.accounts.create).toHaveBeenCalledWith({
        type: 'express',
        country: 'US',
        email: accountData.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        business_profile: {
          name: accountData.businessName,
          product_description: 'Marketplace vendor services',
          mcc: '5734',
        },
        metadata: {
          businessId: accountData.businessId,
          userId: accountData.userId,
        },
      });
    });

    it('should handle account creation errors', async () => {
      const accountData: ConnectAccountData = {
        businessId: 'business-123',
        userId: 'user-123',
        email: 'invalid-email',
        businessName: 'Test Business',
        businessType: 'company',
      };

      const stripeError = new Error('Invalid email address');
      stripeMock.accounts.create.mockRejectedValue(stripeError);

      await expect(createConnectAccount(accountData)).rejects.toThrow('Failed to create payment account');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create Stripe Connect account',
        expect.objectContaining({
          error: stripeError,
          businessId: accountData.businessId,
        })
      );
    });

    it('should use default country if not provided', async () => {
      const accountData: ConnectAccountData = {
        businessId: 'business-123',
        userId: 'user-123',
        email: 'business@example.com',
        businessName: 'Test Business',
        businessType: 'company',
      };

      stripeMock.accounts.create.mockResolvedValue({ id: 'acct_test' });

      await createConnectAccount(accountData);

      expect(stripeMock.accounts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          country: 'US',
        })
      );
    });
  });

  describe('getConnectAccount', () => {
    it('should retrieve account from cache if available', async () => {
      const accountId = 'acct_test123';
      const cachedAccount = {
        id: accountId,
        charges_enabled: true,
        payouts_enabled: true,
      };

      const { cache } = await import('../redis');
      vi.mocked(cache.get).mockResolvedValue(JSON.stringify(cachedAccount));

      const result = await getConnectAccount(accountId);

      expect(result).toEqual(cachedAccount);
      expect(stripeMock.accounts.retrieve).not.toHaveBeenCalled();
    });

    it('should fetch from Stripe if not in cache', async () => {
      const accountId = 'acct_test123';
      const stripeAccount = {
        id: accountId,
        charges_enabled: true,
        payouts_enabled: true,
      };

      const { cache } = await import('../redis');
      vi.mocked(cache.get).mockResolvedValue(null);
      stripeMock.accounts.retrieve.mockResolvedValue(stripeAccount);

      const result = await getConnectAccount(accountId);

      expect(result).toEqual(stripeAccount);
      expect(stripeMock.accounts.retrieve).toHaveBeenCalledWith(accountId);
      expect(cache.set).toHaveBeenCalledWith(
        `stripe:account:${accountId}`,
        JSON.stringify(stripeAccount),
        300
      );
    });

    it('should handle retrieval errors', async () => {
      const accountId = 'acct_invalid';
      const stripeError = new Error('Account not found');

      const { cache } = await import('../redis');
      vi.mocked(cache.get).mockResolvedValue(null);
      stripeMock.accounts.retrieve.mockRejectedValue(stripeError);

      await expect(getConnectAccount(accountId)).rejects.toThrow('Failed to retrieve payment account');
    });
  });

  describe('createAccountLink', () => {
    it('should create an onboarding link', async () => {
      const accountId = 'acct_test123';
      const refreshUrl = 'https://example.com/refresh';
      const returnUrl = 'https://example.com/return';

      const mockLink = {
        object: 'account_link',
        created: Date.now(),
        expires_at: Date.now() + 300,
        url: 'https://connect.stripe.com/setup/...',
      };

      stripeMock.accountLinks.create.mockResolvedValue(mockLink);

      const result = await createAccountLink(accountId, refreshUrl, returnUrl);

      expect(result).toEqual(mockLink);
      expect(stripeMock.accountLinks.create).toHaveBeenCalledWith({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
        collect: 'eventually_due',
      });
    });

    it('should handle link creation errors', async () => {
      const accountId = 'acct_test123';
      const stripeError = new Error('Invalid account');

      stripeMock.accountLinks.create.mockRejectedValue(stripeError);

      await expect(
        createAccountLink(accountId, 'http://refresh', 'http://return')
      ).rejects.toThrow('Failed to create account link');
    });
  });
});

describe('Payment Processing', () => {
  describe('createPaymentIntent', () => {
    it('should create a payment intent with platform fee', async () => {
      const paymentData = {
        amount: 10000, // $100.00
        currency: 'usd',
        connectedAccountId: 'acct_test123',
        platformFeeAmount: 300, // $3.00 platform fee
        description: 'Test purchase',
        metadata: {
          orderId: 'order-123',
          businessId: 'business-123',
        },
      };

      const mockPaymentIntent = {
        id: 'pi_test123',
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: 'requires_payment_method',
        client_secret: 'pi_test_secret',
      };

      stripeMock.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await createPaymentIntent(paymentData);

      expect(result).toEqual(mockPaymentIntent);
      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith({
        amount: paymentData.amount,
        currency: paymentData.currency,
        description: paymentData.description,
        metadata: paymentData.metadata,
        application_fee_amount: paymentData.platformFeeAmount,
        transfer_data: {
          destination: paymentData.connectedAccountId,
        },
      });
    });

    it('should create payment intent without platform fee', async () => {
      const paymentData = {
        amount: 5000,
        currency: 'usd',
        connectedAccountId: 'acct_test123',
        description: 'No fee purchase',
      };

      stripeMock.paymentIntents.create.mockResolvedValue({ id: 'pi_test' });

      await createPaymentIntent(paymentData);

      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(
        expect.not.objectContaining({
          application_fee_amount: expect.anything(),
        })
      );
    });

    it('should handle payment intent creation errors', async () => {
      const paymentData = {
        amount: -100, // Invalid negative amount
        currency: 'usd',
        connectedAccountId: 'acct_test123',
      };

      const stripeError = new Error('Amount must be positive');
      stripeMock.paymentIntents.create.mockRejectedValue(stripeError);

      await expect(createPaymentIntent(paymentData)).rejects.toThrow('Failed to create payment intent');
    });
  });

  describe('retrievePaymentIntent', () => {
    it('should retrieve a payment intent', async () => {
      const paymentIntentId = 'pi_test123';
      const mockPaymentIntent = {
        id: paymentIntentId,
        amount: 10000,
        status: 'succeeded',
        charges: {
          data: [{ id: 'ch_test123' }],
        },
      };

      stripeMock.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await retrievePaymentIntent(paymentIntentId);

      expect(result).toEqual(mockPaymentIntent);
      expect(stripeMock.paymentIntents.retrieve).toHaveBeenCalledWith(paymentIntentId, {
        expand: ['charges'],
      });
    });
  });
});

describe('Payout Management', () => {
  describe('createPayout', () => {
    it('should create a manual payout', async () => {
      const accountId = 'acct_test123';
      const amount = 50000; // $500.00
      const currency = 'usd';

      const mockPayout = {
        id: 'po_test123',
        amount,
        currency,
        status: 'pending',
        arrival_date: Date.now() + 86400000,
      };

      stripeMock.payouts.create.mockResolvedValue(mockPayout);

      const result = await createPayout(accountId, amount, currency, 'Manual payout');

      expect(result).toEqual(mockPayout);
      expect(stripeMock.payouts.create).toHaveBeenCalledWith(
        {
          amount,
          currency,
          description: 'Manual payout',
          metadata: {
            type: 'manual',
            requested_at: expect.any(String),
          },
        },
        { stripeAccount: accountId }
      );
    });

    it('should validate minimum payout amount', async () => {
      const accountId = 'acct_test123';
      const amount = 50; // $0.50 - below minimum

      await expect(createPayout(accountId, amount, 'usd')).rejects.toThrow('Amount must be at least');
    });

    it('should handle payout creation errors', async () => {
      const accountId = 'acct_test123';
      const amount = 100000;
      const stripeError = new Error('Insufficient balance');

      stripeMock.payouts.create.mockRejectedValue(stripeError);

      await expect(createPayout(accountId, amount, 'usd')).rejects.toThrow('Failed to create payout');
    });
  });

  describe('updatePayoutSettings', () => {
    it('should update payout schedule', async () => {
      const accountId = 'acct_test123';
      const settings: PayoutSettings = {
        interval: 'weekly',
        delayDays: 7,
      };

      const updatedAccount = {
        id: accountId,
        settings: {
          payouts: {
            schedule: {
              interval: 'weekly',
              weekly_anchor: 'monday',
              delay_days: 7,
            },
          },
        },
      };

      stripeMock.accounts.update.mockResolvedValue(updatedAccount);

      const result = await updatePayoutSettings(accountId, settings);

      expect(result).toEqual(updatedAccount);
      expect(stripeMock.accounts.update).toHaveBeenCalledWith(accountId, {
        settings: {
          payouts: {
            schedule: {
              interval: 'weekly',
              weekly_anchor: 'monday',
              delay_days: 7,
            },
          },
        },
      });
    });

    it('should set manual payout schedule', async () => {
      const accountId = 'acct_test123';
      const settings: PayoutSettings = {
        interval: 'manual',
      };

      stripeMock.accounts.update.mockResolvedValue({ id: accountId });

      await updatePayoutSettings(accountId, settings);

      expect(stripeMock.accounts.update).toHaveBeenCalledWith(accountId, {
        settings: {
          payouts: {
            schedule: {
              interval: 'manual',
            },
          },
        },
      });
    });
  });
});

describe('Balance and Transactions', () => {
  describe('getAccountBalance', () => {
    it('should retrieve account balance', async () => {
      const accountId = 'acct_test123';
      const mockBalance = {
        object: 'balance',
        available: [
          { amount: 150000, currency: 'usd' },
        ],
        pending: [
          { amount: 25000, currency: 'usd' },
        ],
      };

      stripeMock.balance.retrieve.mockResolvedValue(mockBalance);

      const result = await getAccountBalance(accountId);

      expect(result).toEqual(mockBalance);
      expect(stripeMock.balance.retrieve).toHaveBeenCalledWith({ stripeAccount: accountId });
    });
  });

  describe('getAccountTransactions', () => {
    it('should retrieve account transactions with pagination', async () => {
      const accountId = 'acct_test123';
      const limit = 20;
      const startingAfter = 'txn_test123';

      const mockTransactions = {
        object: 'list',
        data: [
          { id: 'txn_1', amount: 10000, type: 'charge' },
          { id: 'txn_2', amount: -300, type: 'application_fee' },
        ],
        has_more: true,
      };

      stripeMock.balanceTransactions.list.mockResolvedValue(mockTransactions);

      const result = await getAccountTransactions(accountId, limit, startingAfter);

      expect(result).toEqual(mockTransactions);
      expect(stripeMock.balanceTransactions.list).toHaveBeenCalledWith(
        { limit, starting_after: startingAfter },
        { stripeAccount: accountId }
      );
    });

    it('should use default pagination values', async () => {
      const accountId = 'acct_test123';

      stripeMock.balanceTransactions.list.mockResolvedValue({ data: [] });

      await getAccountTransactions(accountId);

      expect(stripeMock.balanceTransactions.list).toHaveBeenCalledWith(
        { limit: 10, starting_after: undefined },
        { stripeAccount: accountId }
      );
    });
  });
});

describe('Webhook Handling', () => {
  describe('handleWebhook', () => {
    it('should process account.updated event', async () => {
      const payload = JSON.stringify({
        type: 'account.updated',
        data: {
          object: {
            id: 'acct_test123',
            charges_enabled: true,
            payouts_enabled: true,
          },
        },
      });

      const signature = 'test-signature';
      const mockEvent = JSON.parse(payload);

      stripeMock.webhooks.constructEvent.mockReturnValue(mockEvent);

      const { cache } = await import('../redis');
      const result = await handleWebhook(payload, signature);

      expect(result).toEqual({ received: true, type: 'account.updated' });
      expect(cache.del).toHaveBeenCalledWith('stripe:account:acct_test123');
    });

    it('should process payment_intent.succeeded event', async () => {
      const payload = JSON.stringify({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            amount: 10000,
            metadata: {
              orderId: 'order-123',
              userId: 'user-123',
            },
          },
        },
      });

      const signature = 'test-signature';
      const mockEvent = JSON.parse(payload);

      stripeMock.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = await handleWebhook(payload, signature);

      expect(result).toEqual({ received: true, type: 'payment_intent.succeeded' });
      expect(logger.info).toHaveBeenCalledWith(
        'Payment succeeded',
        expect.objectContaining({
          paymentIntentId: 'pi_test123',
          amount: 10000,
        })
      );
    });

    it('should process payout.paid event', async () => {
      const payload = JSON.stringify({
        type: 'payout.paid',
        data: {
          object: {
            id: 'po_test123',
            amount: 50000,
            arrival_date: Date.now(),
          },
        },
      });

      const signature = 'test-signature';
      const mockEvent = JSON.parse(payload);

      stripeMock.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = await handleWebhook(payload, signature);

      expect(result).toEqual({ received: true, type: 'payout.paid' });
    });

    it('should handle webhook signature verification failure', async () => {
      const payload = 'invalid-payload';
      const signature = 'invalid-signature';

      stripeMock.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Webhook signature verification failed');
      });

      await expect(handleWebhook(payload, signature)).rejects.toThrow('signature verification failed');
    });

    it('should handle unknown event types', async () => {
      const payload = JSON.stringify({
        type: 'unknown.event',
        data: { object: {} },
      });

      const signature = 'test-signature';
      const mockEvent = JSON.parse(payload);

      stripeMock.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = await handleWebhook(payload, signature);

      expect(result).toEqual({ received: true, type: 'unknown.event' });
      expect(logger.info).toHaveBeenCalledWith(
        'Unhandled Stripe webhook event',
        expect.objectContaining({ type: 'unknown.event' })
      );
    });
  });
});

describe('Error Scenarios and Edge Cases', () => {
  it('should handle missing Stripe secret key', async () => {
    const originalKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    await expect(createConnectAccount({
      businessId: 'test',
      userId: 'test',
      email: 'test@example.com',
      businessName: 'Test',
      businessType: 'company',
    })).rejects.toThrow('STRIPE_SECRET_KEY environment variable is required');

    process.env.STRIPE_SECRET_KEY = originalKey;
  });

  it('should handle network timeouts gracefully', async () => {
    const timeoutError = new Error('Network timeout');
    timeoutError.name = 'TimeoutError';

    stripeMock.accounts.create.mockRejectedValue(timeoutError);

    await expect(createConnectAccount({
      businessId: 'test',
      userId: 'test',
      email: 'test@example.com',
      businessName: 'Test',
      businessType: 'company',
    })).rejects.toThrow('Failed to create payment account');
  });

  it('should handle rate limiting from Stripe', async () => {
    const rateLimitError: any = new Error('Too many requests');
    rateLimitError.statusCode = 429;
    rateLimitError.headers = { 'retry-after': '60' };

    stripeMock.paymentIntents.create.mockRejectedValue(rateLimitError);

    await expect(createPaymentIntent({
      amount: 1000,
      currency: 'usd',
      connectedAccountId: 'acct_test',
    })).rejects.toThrow('Failed to create payment intent');

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to create payment intent',
      expect.objectContaining({ error: rateLimitError })
    );
  });
});