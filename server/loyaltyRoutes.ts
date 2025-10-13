/**
 * Loyalty & Rewards API Routes
 *
 * Endpoints for:
 * - Loyalty accounts and points management
 * - Tier system
 * - Rewards catalog and redemptions
 * - Referral system
 * - Points transfers
 */

import { Express, Request, Response } from 'express';
import { loyaltyStorage } from './loyaltyStorage';

// Authentication middleware (assuming it exists)
const isAuthenticated = (req: any, res: Response, next: Function) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

export function registerLoyaltyRoutes(app: Express) {
  console.log('💎 Registering loyalty & rewards routes...');

  // ========================================
  // LOYALTY ACCOUNT ENDPOINTS
  // ========================================

  /**
   * GET /api/loyalty/account
   * Get user's loyalty account (points, tier, etc.)
   */
  app.get('/api/loyalty/account', isAuthenticated, async (req: any, res: Response) => {
    try {
      const account = await loyaltyStorage.getLoyaltyAccount(req.user.id);

      if (!account) {
        return res.status(404).json({
          message: 'Loyalty account not found. Enroll to get started!',
        });
      }

      res.json(account);
    } catch (error: any) {
      console.error('Error fetching loyalty account:', error);
      res.status(500).json({ message: 'Failed to fetch loyalty account' });
    }
  });

  /**
   * POST /api/loyalty/account/enroll
   * Enroll user in loyalty program
   */
  app.post('/api/loyalty/account/enroll', isAuthenticated, async (req: any, res: Response) => {
    try {
      const account = await loyaltyStorage.createLoyaltyAccount(req.user.id);

      // Award signup bonus points
      await loyaltyStorage.awardPointsForEvent(
        req.user.id,
        'signup',
        account.id
      );

      res.json({
        message: 'Welcome to the loyalty program!',
        account,
      });
    } catch (error: any) {
      console.error('Error enrolling in loyalty program:', error);
      res.status(500).json({ message: 'Failed to enroll in loyalty program' });
    }
  });

  /**
   * GET /api/loyalty/transactions
   * Get user's points transaction history
   */
  app.get('/api/loyalty/transactions', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { type, limit, offset } = req.query;

      const transactions = await loyaltyStorage.getTransactions(req.user.id, {
        type: type as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json(transactions);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  /**
   * GET /api/loyalty/transactions/summary
   * Get summary of points (earned, spent, expiring)
   */
  app.get(
    '/api/loyalty/transactions/summary',
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const summary = await loyaltyStorage.getTransactionSummary(req.user.id);
        res.json(summary);
      } catch (error: any) {
        console.error('Error fetching transaction summary:', error);
        res.status(500).json({ message: 'Failed to fetch summary' });
      }
    }
  );

  // ========================================
  // TIER ENDPOINTS
  // ========================================

  /**
   * GET /api/loyalty/tiers
   * Get all available tiers
   */
  app.get('/api/loyalty/tiers', async (req: Request, res: Response) => {
    try {
      const tiers = await loyaltyStorage.getTiers();
      res.json(tiers);
    } catch (error: any) {
      console.error('Error fetching tiers:', error);
      res.status(500).json({ message: 'Failed to fetch tiers' });
    }
  });

  /**
   * GET /api/loyalty/tiers/:id
   * Get specific tier details
   */
  app.get('/api/loyalty/tiers/:id', async (req: Request, res: Response) => {
    try {
      const tier = await loyaltyStorage.getTierById(req.params.id);

      if (!tier) {
        return res.status(404).json({ message: 'Tier not found' });
      }

      res.json(tier);
    } catch (error: any) {
      console.error('Error fetching tier:', error);
      res.status(500).json({ message: 'Failed to fetch tier' });
    }
  });

  /**
   * GET /api/loyalty/tier/current
   * Get user's current tier
   */
  app.get('/api/loyalty/tier/current', isAuthenticated, async (req: any, res: Response) => {
    try {
      const account = await loyaltyStorage.getLoyaltyAccount(req.user.id);

      if (!account) {
        return res.status(404).json({ message: 'Loyalty account not found' });
      }

      const tier = await loyaltyStorage.getTierById(account.tierId!);
      res.json(tier);
    } catch (error: any) {
      console.error('Error fetching current tier:', error);
      res.status(500).json({ message: 'Failed to fetch current tier' });
    }
  });

  /**
   * GET /api/loyalty/tier/progress
   * Get user's progress to next tier
   */
  app.get('/api/loyalty/tier/progress', isAuthenticated, async (req: any, res: Response) => {
    try {
      const progress = await loyaltyStorage.getTierProgress(req.user.id);
      res.json(progress);
    } catch (error: any) {
      console.error('Error fetching tier progress:', error);
      res.status(500).json({ message: 'Failed to fetch tier progress' });
    }
  });

  // ========================================
  // REWARDS CATALOG ENDPOINTS
  // ========================================

  /**
   * GET /api/loyalty/rewards
   * Browse rewards catalog with filters
   */
  app.get('/api/loyalty/rewards', async (req: Request, res: Response) => {
    try {
      const { businessId, category, isFeatured, minTierLevel, limit, offset } = req.query;

      const rewards = await loyaltyStorage.getRewards({
        businessId: businessId as string,
        category: category as string,
        isFeatured: isFeatured === 'true',
        minTierLevel: minTierLevel ? parseInt(minTierLevel as string) : undefined,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json(rewards);
    } catch (error: any) {
      console.error('Error fetching rewards:', error);
      res.status(500).json({ message: 'Failed to fetch rewards' });
    }
  });

  /**
   * GET /api/loyalty/rewards/:id
   * Get specific reward details
   */
  app.get('/api/loyalty/rewards/:id', async (req: Request, res: Response) => {
    try {
      const reward = await loyaltyStorage.getRewardById(req.params.id);

      if (!reward) {
        return res.status(404).json({ message: 'Reward not found' });
      }

      res.json(reward);
    } catch (error: any) {
      console.error('Error fetching reward:', error);
      res.status(500).json({ message: 'Failed to fetch reward' });
    }
  });

  /**
   * POST /api/loyalty/rewards/:id/redeem
   * Redeem a reward
   */
  app.post(
    '/api/loyalty/rewards/:id/redeem',
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const redemption = await loyaltyStorage.redeemReward(
          req.user.id,
          req.params.id
        );

        res.json({
          message: 'Reward redeemed successfully!',
          redemption,
        });
      } catch (error: any) {
        console.error('Error redeeming reward:', error);

        // Handle specific errors
        if (error.message === 'Insufficient points') {
          return res.status(400).json({ message: 'Not enough points' });
        }
        if (error.message === 'Reward is out of stock') {
          return res.status(400).json({ message: 'This reward is currently out of stock' });
        }
        if (error.message === 'Tier level too low for this reward') {
          return res.status(403).json({ message: 'Your tier level is too low for this reward' });
        }

        res.status(500).json({ message: 'Failed to redeem reward' });
      }
    }
  );

  /**
   * GET /api/loyalty/redemptions
   * Get user's redemption history
   */
  app.get('/api/loyalty/redemptions', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { status, limit, offset } = req.query;

      const redemptions = await loyaltyStorage.getUserRedemptions(req.user.id, {
        status: status as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json(redemptions);
    } catch (error: any) {
      console.error('Error fetching redemptions:', error);
      res.status(500).json({ message: 'Failed to fetch redemptions' });
    }
  });

  /**
   * GET /api/loyalty/redemptions/:code
   * Get redemption by code (for validation)
   */
  app.get('/api/loyalty/redemptions/:code', async (req: Request, res: Response) => {
    try {
      const redemption = await loyaltyStorage.getRedemptionByCode(req.params.code);

      if (!redemption) {
        return res.status(404).json({ message: 'Redemption not found' });
      }

      res.json(redemption);
    } catch (error: any) {
      console.error('Error fetching redemption:', error);
      res.status(500).json({ message: 'Failed to fetch redemption' });
    }
  });

  // ========================================
  // REFERRAL ENDPOINTS
  // ========================================

  /**
   * GET /api/loyalty/referral/code
   * Get user's referral code (or generate if doesn't exist)
   */
  app.get('/api/loyalty/referral/code', isAuthenticated, async (req: any, res: Response) => {
    try {
      const code = await loyaltyStorage.generateReferralCode(req.user.id);
      res.json({ code });
    } catch (error: any) {
      console.error('Error generating referral code:', error);
      res.status(500).json({ message: 'Failed to generate referral code' });
    }
  });

  /**
   * POST /api/loyalty/referral/send
   * Send referral invitation
   */
  app.post('/api/loyalty/referral/send', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Get or generate referral code
      const code = await loyaltyStorage.generateReferralCode(req.user.id);

      // TODO: Send email invitation with referral code
      // This would integrate with your email service

      res.json({
        message: 'Referral invitation sent!',
        code,
      });
    } catch (error: any) {
      console.error('Error sending referral:', error);
      res.status(500).json({ message: 'Failed to send referral' });
    }
  });

  /**
   * POST /api/loyalty/referral/signup
   * Process referral signup (called when new user signs up with referral code)
   */
  app.post('/api/loyalty/referral/signup', async (req: Request, res: Response) => {
    try {
      const { referralCode, newUserId } = req.body;

      if (!referralCode || !newUserId) {
        return res.status(400).json({ message: 'Referral code and user ID required' });
      }

      await loyaltyStorage.processReferralSignup(referralCode, newUserId);

      res.json({
        message: 'Referral signup processed! Bonus points awarded.',
      });
    } catch (error: any) {
      console.error('Error processing referral signup:', error);

      if (error.message === 'Invalid referral code') {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
      if (error.message === 'Referral code already used') {
        return res.status(400).json({ message: 'This referral code has already been used' });
      }

      res.status(500).json({ message: 'Failed to process referral signup' });
    }
  });

  /**
   * GET /api/loyalty/referral/stats
   * Get user's referral statistics
   */
  app.get('/api/loyalty/referral/stats', isAuthenticated, async (req: any, res: Response) => {
    try {
      const stats = await loyaltyStorage.getReferralStats(req.user.id);
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching referral stats:', error);
      res.status(500).json({ message: 'Failed to fetch referral stats' });
    }
  });

  /**
   * GET /api/loyalty/referral/leaderboard
   * Get referral leaderboard (top referrers)
   */
  app.get('/api/loyalty/referral/leaderboard', async (req: Request, res: Response) => {
    try {
      const { limit } = req.query;
      const leaderboard = await loyaltyStorage.getReferralLeaderboard(
        limit ? parseInt(limit as string) : 10
      );
      res.json(leaderboard);
    } catch (error: any) {
      console.error('Error fetching referral leaderboard:', error);
      res.status(500).json({ message: 'Failed to fetch referral leaderboard' });
    }
  });

  // ========================================
  // POINTS CALCULATION ENDPOINTS (Internal)
  // ========================================

  /**
   * POST /api/loyalty/calculate-points/purchase
   * Calculate points for a purchase (internal use)
   */
  app.post(
    '/api/loyalty/calculate-points/purchase',
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const { orderAmount } = req.body;

        if (!orderAmount || orderAmount <= 0) {
          return res.status(400).json({ message: 'Valid order amount required' });
        }

        const points = await loyaltyStorage.calculatePointsForPurchase(
          req.user.id,
          orderAmount
        );

        res.json({ points });
      } catch (error: any) {
        console.error('Error calculating points:', error);
        res.status(500).json({ message: 'Failed to calculate points' });
      }
    }
  );

  /**
   * POST /api/loyalty/award-points
   * Award points for an event (internal use)
   */
  app.post('/api/loyalty/award-points', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { eventType, sourceId } = req.body;

      if (!eventType) {
        return res.status(400).json({ message: 'Event type required' });
      }

      const transaction = await loyaltyStorage.awardPointsForEvent(
        req.user.id,
        eventType,
        sourceId
      );

      if (!transaction) {
        return res.status(404).json({ message: 'No points rule found for this event' });
      }

      res.json({
        message: 'Points awarded!',
        transaction,
      });
    } catch (error: any) {
      console.error('Error awarding points:', error);
      res.status(500).json({ message: 'Failed to award points' });
    }
  });

  console.log('✅ Loyalty & rewards routes registered');
}
