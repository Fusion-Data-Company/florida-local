/**
 * Loyalty & Rewards Storage Layer
 *
 * Handles all database operations for the loyalty program:
 * - Loyalty accounts and points management
 * - Tier system with automatic upgrades
 * - Points earning rules engine
 * - Rewards catalog and redemptions
 * - Referral system with tracking
 */

import { db } from './db';
import {
  loyaltyTiers,
  loyaltyAccounts,
  loyaltyTransactions,
  loyaltyRules,
  rewards,
  rewardRedemptions,
  referrals,
  users,
  type LoyaltyTier,
  type LoyaltyAccount,
  type LoyaltyTransaction,
  type InsertLoyaltyAccount,
  type InsertLoyaltyTransaction,
  type InsertRewardRedemption,
  type Reward,
  type RewardRedemption,
  type Referral,
} from '../shared/schema';
import { eq, and, desc, sql, gte, lte, isNull, or } from 'drizzle-orm';

export class LoyaltyStorage {
  // ========================================
  // LOYALTY ACCOUNT MANAGEMENT
  // ========================================

  /**
   * Create a new loyalty account for a user (auto-enroll)
   */
  async createLoyaltyAccount(userId: string): Promise<LoyaltyAccount> {
    // Check if account already exists
    const existing = await this.getLoyaltyAccount(userId);
    if (existing) {
      return existing;
    }

    // Get Bronze tier (default)
    const bronzeTier = await db
      .select()
      .from(loyaltyTiers)
      .where(eq(loyaltyTiers.level, 1))
      .limit(1);

    const [account] = await db
      .insert(loyaltyAccounts)
      .values({
        userId,
        currentPoints: 0,
        lifetimePoints: 0,
        tierId: bronzeTier[0]?.id,
        tierName: 'Bronze',
        tierLevel: 1,
      })
      .returning();

    return account;
  }

  /**
   * Get loyalty account for a user
   */
  async getLoyaltyAccount(userId: string): Promise<LoyaltyAccount | null> {
    const [account] = await db
      .select()
      .from(loyaltyAccounts)
      .where(eq(loyaltyAccounts.userId, userId))
      .limit(1);

    return account || null;
  }

  /**
   * Get or create loyalty account (ensures user has an account)
   */
  async getOrCreateLoyaltyAccount(userId: string): Promise<LoyaltyAccount> {
    const existing = await this.getLoyaltyAccount(userId);
    if (existing) {
      return existing;
    }
    return await this.createLoyaltyAccount(userId);
  }

  /**
   * Award points to a user
   */
  async awardPoints(
    userId: string,
    points: number,
    source: string,
    sourceId?: string,
    description?: string,
    metadata?: any
  ): Promise<LoyaltyTransaction> {
    const account = await this.getOrCreateLoyaltyAccount(userId);

    // Calculate expiration (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Update account balance
    const newBalance = account.currentPoints + points;
    const newLifetimePoints = account.lifetimePoints + points;

    await db
      .update(loyaltyAccounts)
      .set({
        currentPoints: newBalance,
        lifetimePoints: newLifetimePoints,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(loyaltyAccounts.id, account.id));

    // Create transaction record
    const [transaction] = await db
      .insert(loyaltyTransactions)
      .values({
        userId,
        accountId: account.id,
        type: 'earned',
        points,
        balanceAfter: newBalance,
        source,
        sourceId,
        description: description || `Earned ${points} points from ${source}`,
        expiresAt,
        metadata,
      })
      .returning();

    // Check if user is eligible for tier upgrade
    await this.checkAndUpgradeTier(userId);

    return transaction;
  }

  /**
   * Redeem (spend) points
   */
  async redeemPoints(
    userId: string,
    points: number,
    source: string,
    sourceId?: string,
    description?: string
  ): Promise<LoyaltyTransaction> {
    const account = await this.getLoyaltyAccount(userId);
    if (!account) {
      throw new Error('Loyalty account not found');
    }

    if (account.currentPoints < points) {
      throw new Error('Insufficient points');
    }

    // Update account balance
    const newBalance = account.currentPoints - points;

    await db
      .update(loyaltyAccounts)
      .set({
        currentPoints: newBalance,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(loyaltyAccounts.id, account.id));

    // Create transaction record
    const [transaction] = await db
      .insert(loyaltyTransactions)
      .values({
        userId,
        accountId: account.id,
        type: 'redeemed',
        points: -points, // Negative for spent points
        balanceAfter: newBalance,
        source,
        sourceId,
        description: description || `Redeemed ${points} points for ${source}`,
      })
      .returning();

    return transaction;
  }

  /**
   * Get user's points transactions
   */
  async getTransactions(
    userId: string,
    filters?: { type?: string; limit?: number; offset?: number }
  ): Promise<LoyaltyTransaction[]> {
    const { type, limit = 50, offset = 0 } = filters || {};

    let query = db
      .select()
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.userId, userId))
      .$dynamic();

    if (type) {
      query = query.where(eq(loyaltyTransactions.type, type));
    }

    query = query
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    return await query;
  }

  /**
   * Get transaction summary (total earned, spent, expired)
   */
  async getTransactionSummary(userId: string): Promise<{
    totalEarned: number;
    totalSpent: number;
    totalExpired: number;
    pointsExpiringIn30Days: number;
  }> {
    const account = await this.getLoyaltyAccount(userId);
    if (!account) {
      return { totalEarned: 0, totalSpent: 0, totalExpired: 0, pointsExpiringIn30Days: 0 };
    }

    // Calculate date 30 days from now
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Get expiring points
    const expiringPoints = await db
      .select({
        total: sql<number>`COALESCE(SUM(${loyaltyTransactions.points}), 0)`,
      })
      .from(loyaltyTransactions)
      .where(
        and(
          eq(loyaltyTransactions.userId, userId),
          eq(loyaltyTransactions.type, 'earned'),
          eq(loyaltyTransactions.isExpired, false),
          lte(loyaltyTransactions.expiresAt, thirtyDaysFromNow),
          gte(loyaltyTransactions.expiresAt, new Date())
        )
      );

    return {
      totalEarned: account.lifetimePoints,
      totalSpent: account.lifetimePoints - account.currentPoints,
      totalExpired: 0, // Would need to track expired separately
      pointsExpiringIn30Days: Number(expiringPoints[0]?.total || 0),
    };
  }

  // ========================================
  // TIER MANAGEMENT
  // ========================================

  /**
   * Get all loyalty tiers
   */
  async getTiers(): Promise<LoyaltyTier[]> {
    return await db
      .select()
      .from(loyaltyTiers)
      .orderBy(loyaltyTiers.level);
  }

  /**
   * Get tier by ID
   */
  async getTierById(id: string): Promise<LoyaltyTier | null> {
    const [tier] = await db
      .select()
      .from(loyaltyTiers)
      .where(eq(loyaltyTiers.id, id))
      .limit(1);

    return tier || null;
  }

  /**
   * Check and upgrade user's tier based on lifetime points
   */
  async checkAndUpgradeTier(userId: string): Promise<boolean> {
    const account = await this.getLoyaltyAccount(userId);
    if (!account) return false;

    // Get all tiers
    const tiers = await this.getTiers();

    // Find highest tier user qualifies for
    let newTier: LoyaltyTier | null = null;
    for (const tier of tiers.reverse()) {
      if (account.lifetimePoints >= tier.pointsRequired) {
        newTier = tier;
        break;
      }
    }

    // Check if upgrade is needed
    if (newTier && newTier.level > account.tierLevel) {
      await db
        .update(loyaltyAccounts)
        .set({
          tierId: newTier.id,
          tierName: newTier.name,
          tierLevel: newTier.level,
          updatedAt: new Date(),
        })
        .where(eq(loyaltyAccounts.id, account.id));

      return true; // Upgraded
    }

    return false; // No upgrade
  }

  /**
   * Get user's tier progress (points to next tier)
   */
  async getTierProgress(userId: string): Promise<{
    currentTier: LoyaltyTier | null;
    nextTier: LoyaltyTier | null;
    pointsToNextTier: number;
    progressPercentage: number;
  }> {
    const account = await this.getLoyaltyAccount(userId);
    if (!account) {
      return {
        currentTier: null,
        nextTier: null,
        pointsToNextTier: 0,
        progressPercentage: 0,
      };
    }

    const tiers = await this.getTiers();
    const currentTier = tiers.find(t => t.level === account.tierLevel);
    const nextTier = tiers.find(t => t.level === account.tierLevel + 1);

    if (!nextTier) {
      // Already at max tier
      return {
        currentTier: currentTier || null,
        nextTier: null,
        pointsToNextTier: 0,
        progressPercentage: 100,
      };
    }

    const pointsToNextTier = nextTier.pointsRequired - account.lifetimePoints;
    const pointsInCurrentTier = nextTier.pointsRequired - (currentTier?.pointsRequired || 0);
    const pointsEarned = account.lifetimePoints - (currentTier?.pointsRequired || 0);
    const progressPercentage = Math.min(100, (pointsEarned / pointsInCurrentTier) * 100);

    return {
      currentTier: currentTier || null,
      nextTier,
      pointsToNextTier: Math.max(0, pointsToNextTier),
      progressPercentage: Math.round(progressPercentage),
    };
  }

  // ========================================
  // POINTS CALCULATION (RULES ENGINE)
  // ========================================

  /**
   * Calculate points for a purchase
   */
  async calculatePointsForPurchase(
    userId: string,
    orderAmount: number
  ): Promise<number> {
    const account = await this.getOrCreateLoyaltyAccount(userId);

    // Get purchase rule
    const [rule] = await db
      .select()
      .from(loyaltyRules)
      .where(
        and(
          eq(loyaltyRules.eventType, 'purchase'),
          eq(loyaltyRules.isActive, true)
        )
      )
      .limit(1);

    if (!rule) {
      // Default: 1 point per dollar
      return Math.floor(orderAmount);
    }

    let points = 0;

    if (rule.calculationType === 'percentage' && rule.calculationValue) {
      // Percentage of order amount
      points = Math.floor(orderAmount * (Number(rule.calculationValue) / 100));
    } else if (rule.calculationType === 'fixed') {
      // Fixed points
      points = rule.pointsAwarded;
    } else {
      // Default calculation: 1 point per dollar
      points = Math.floor(orderAmount);
    }

    // Apply tier multiplier
    const tierMultipliers = rule.tierMultipliers as any;
    if (tierMultipliers && account.tierName) {
      const multiplier = tierMultipliers[account.tierName] || 1;
      points = Math.floor(points * multiplier);
    }

    // Apply maximum if set
    if (rule.maxPoints && points > rule.maxPoints) {
      points = rule.maxPoints;
    }

    return points;
  }

  /**
   * Award points for a specific event
   */
  async awardPointsForEvent(
    userId: string,
    eventType: string,
    sourceId?: string
  ): Promise<LoyaltyTransaction | null> {
    const [rule] = await db
      .select()
      .from(loyaltyRules)
      .where(
        and(
          eq(loyaltyRules.eventType, eventType),
          eq(loyaltyRules.isActive, true)
        )
      )
      .limit(1);

    if (!rule) {
      return null; // No rule for this event
    }

    return await this.awardPoints(
      userId,
      rule.pointsAwarded,
      eventType,
      sourceId,
      rule.description || undefined
    );
  }

  // ========================================
  // REWARDS CATALOG
  // ========================================

  /**
   * Get rewards catalog
   */
  async getRewards(filters?: {
    businessId?: string;
    category?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    minTierLevel?: number;
    limit?: number;
    offset?: number;
  }): Promise<Reward[]> {
    const {
      businessId,
      category,
      isActive = true,
      isFeatured,
      minTierLevel,
      limit = 50,
      offset = 0,
    } = filters || {};

    let query = db.select().from(rewards).$dynamic();

    const conditions = [];
    if (isActive !== undefined) conditions.push(eq(rewards.isActive, isActive));
    if (isFeatured !== undefined) conditions.push(eq(rewards.isFeatured, isFeatured));
    if (businessId) conditions.push(eq(rewards.businessId, businessId));
    if (category) conditions.push(eq(rewards.category, category));
    if (minTierLevel !== undefined) {
      conditions.push(
        or(
          isNull(rewards.tierRestriction),
          lte(rewards.tierRestriction, minTierLevel)
        )!
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query
      .orderBy(desc(rewards.isFeatured), rewards.pointsCost)
      .limit(limit)
      .offset(offset);

    return await query;
  }

  /**
   * Get reward by ID
   */
  async getRewardById(id: string): Promise<Reward | null> {
    const [reward] = await db
      .select()
      .from(rewards)
      .where(eq(rewards.id, id))
      .limit(1);

    return reward || null;
  }

  /**
   * Redeem a reward
   */
  async redeemReward(
    userId: string,
    rewardId: string
  ): Promise<RewardRedemption> {
    const reward = await this.getRewardById(rewardId);
    if (!reward) {
      throw new Error('Reward not found');
    }

    if (!reward.isActive) {
      throw new Error('Reward is not active');
    }

    // Check stock
    if (reward.stockQuantity !== null && reward.stockQuantity <= 0) {
      throw new Error('Reward is out of stock');
    }

    const account = await this.getLoyaltyAccount(userId);
    if (!account) {
      throw new Error('Loyalty account not found');
    }

    // Check points balance
    if (account.currentPoints < reward.pointsCost) {
      throw new Error('Insufficient points');
    }

    // Check tier restriction
    if (reward.tierRestriction && account.tierLevel < reward.tierRestriction) {
      throw new Error('Tier level too low for this reward');
    }

    // Check redemption limit
    if (reward.maxRedemptionsPerUser) {
      const redemptionCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(rewardRedemptions)
        .where(
          and(
            eq(rewardRedemptions.userId, userId),
            eq(rewardRedemptions.rewardId, rewardId)
          )
        );

      if (Number(redemptionCount[0].count) >= reward.maxRedemptionsPerUser) {
        throw new Error('Maximum redemptions per user reached');
      }
    }

    // Deduct points
    const transaction = await this.redeemPoints(
      userId,
      reward.pointsCost,
      'reward_redemption',
      rewardId,
      `Redeemed: ${reward.name}`
    );

    // Generate unique redemption code
    const redemptionCode = this.generateRedemptionCode();

    // Calculate expiration (30 days for most rewards)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create redemption record
    const [redemption] = await db
      .insert(rewardRedemptions)
      .values({
        userId,
        rewardId,
        transactionId: transaction.id,
        pointsSpent: reward.pointsCost,
        status: 'pending',
        redemptionCode,
        expiresAt,
      })
      .returning();

    // Update reward stock and redemption count
    if (reward.stockQuantity !== null) {
      await db
        .update(rewards)
        .set({
          stockQuantity: sql`${rewards.stockQuantity} - 1`,
          redemptionCount: sql`${rewards.redemptionCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(rewards.id, rewardId));
    } else {
      await db
        .update(rewards)
        .set({
          redemptionCount: sql`${rewards.redemptionCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(rewards.id, rewardId));
    }

    return redemption;
  }

  /**
   * Get user's redemptions
   */
  async getUserRedemptions(
    userId: string,
    filters?: { status?: string; limit?: number; offset?: number }
  ): Promise<any[]> {
    const { status, limit = 50, offset = 0 } = filters || {};

    let query = db
      .select({
        redemption: rewardRedemptions,
        reward: rewards,
      })
      .from(rewardRedemptions)
      .leftJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
      .where(eq(rewardRedemptions.userId, userId))
      .$dynamic();

    if (status) {
      query = query.where(eq(rewardRedemptions.status, status));
    }

    query = query
      .orderBy(desc(rewardRedemptions.redeemedAt))
      .limit(limit)
      .offset(offset);

    return await query;
  }

  /**
   * Get redemption by code
   */
  async getRedemptionByCode(code: string): Promise<any | null> {
    const [result] = await db
      .select({
        redemption: rewardRedemptions,
        reward: rewards,
      })
      .from(rewardRedemptions)
      .leftJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
      .where(eq(rewardRedemptions.redemptionCode, code))
      .limit(1);

    return result || null;
  }

  /**
   * Generate unique redemption code
   */
  private generateRedemptionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ========================================
  // REFERRAL SYSTEM
  // ========================================

  /**
   * Generate referral code for a user
   */
  async generateReferralCode(userId: string): Promise<string> {
    // Check if user already has a code
    const [existing] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .limit(1);

    if (existing) {
      return existing.referralCode;
    }

    // Generate unique code (user's ID + random)
    const code = `REF${userId.substring(0, 4).toUpperCase()}${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    // Create referral entry
    await db.insert(referrals).values({
      referrerId: userId,
      referralCode: code,
    });

    return code;
  }

  /**
   * Get referral by code
   */
  async getReferralByCode(code: string): Promise<Referral | null> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referralCode, code))
      .limit(1);

    return referral || null;
  }

  /**
   * Process referral signup (when referee signs up)
   */
  async processReferralSignup(
    referralCode: string,
    newUserId: string
  ): Promise<void> {
    const referral = await this.getReferralByCode(referralCode);
    if (!referral) {
      throw new Error('Invalid referral code');
    }

    if (referral.refereeId) {
      throw new Error('Referral code already used');
    }

    // Update referral with referee info
    await db
      .update(referrals)
      .set({
        refereeId: newUserId,
        status: 'signed_up',
        signedUpAt: new Date(),
      })
      .where(eq(referrals.id, referral.id));

    // Award signup bonus to referee
    await this.awardPointsForEvent(newUserId, 'referral_signup', referral.id);
  }

  /**
   * Process referral completion (when referee makes first purchase)
   */
  async processReferralCompletion(refereeId: string): Promise<void> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.refereeId, refereeId),
          eq(referrals.status, 'signed_up')
        )
      )
      .limit(1);

    if (!referral) {
      return; // Not a referred user or already completed
    }

    // Update referral status
    await db
      .update(referrals)
      .set({
        status: 'completed',
        completedAt: new Date(),
        refereeFirstPurchaseAt: new Date(),
      })
      .where(eq(referrals.id, referral.id));

    // Award completion points to both referrer and referee
    await this.awardPointsForEvent(
      referral.referrerId,
      'referral_complete',
      referral.id
    );
    await this.awardPointsForEvent(refereeId, 'referral_complete', referral.id);
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    pendingReferrals: number;
    completedReferrals: number;
    totalPointsEarned: number;
  }> {
    const allReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId));

    const stats = {
      totalReferrals: allReferrals.length,
      pendingReferrals: allReferrals.filter(r => r.status === 'pending').length,
      completedReferrals: allReferrals.filter(r => r.status === 'completed').length,
      totalPointsEarned: allReferrals.reduce(
        (sum, r) => sum + r.referrerRewardPoints,
        0
      ),
    };

    return stats;
  }

  /**
   * Get referral leaderboard (top referrers)
   */
  async getReferralLeaderboard(limit: number = 10): Promise<any[]> {
    const leaderboard = await db
      .select({
        userId: referrals.referrerId,
        completedReferrals: sql<number>`COUNT(*)`,
        totalPoints: sql<number>`SUM(${referrals.referrerRewardPoints})`,
      })
      .from(referrals)
      .where(eq(referrals.status, 'completed'))
      .groupBy(referrals.referrerId)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(limit);

    // Join with user data
    const leaderboardWithUsers = await Promise.all(
      leaderboard.map(async entry => {
        const [user] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(eq(users.id, entry.userId))
          .limit(1);

        return {
          ...entry,
          user,
        };
      })
    );

    return leaderboardWithUsers;
  }

  // ========================================
  // ADMIN METHODS
  // ========================================

  /**
   * Get all loyalty accounts (admin only)
   */
  async getAllAccounts(filters?: { limit?: number; offset?: number }): Promise<LoyaltyAccount[]> {
    const { limit = 1000, offset = 0 } = filters || {};

    return await db
      .select()
      .from(loyaltyAccounts)
      .orderBy(desc(loyaltyAccounts.lifetimePoints))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get all tiers (admin only)
   */
  async getAllTiers(): Promise<LoyaltyTier[]> {
    return await db
      .select()
      .from(loyaltyTiers)
      .orderBy(loyaltyTiers.level);
  }

  /**
   * Get all rewards (admin only)
   */
  async getAllRewards(filters?: { limit?: number; offset?: number }): Promise<Reward[]> {
    const { limit = 100, offset = 0 } = filters || {};

    return await db
      .select()
      .from(rewards)
      .orderBy(desc(rewards.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get recent redemptions (admin only)
   */
  async getRecentRedemptions(filters?: { limit?: number; offset?: number }): Promise<RewardRedemption[]> {
    const { limit = 50, offset = 0 } = filters || {};

    return await db
      .select()
      .from(rewardRedemptions)
      .orderBy(desc(rewardRedemptions.redeemedAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(userId: string, filters?: { limit?: number }): Promise<LoyaltyTransaction[]> {
    const { limit = 10 } = filters || {};

    return await db
      .select()
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.userId, userId))
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(limit);
  }

  /**
   * Get referrals made by a user
   */
  async getUserReferrals(userId: string): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt));
  }
}

// Export singleton instance
export const loyaltyStorage = new LoyaltyStorage();
