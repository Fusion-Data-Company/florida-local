/**
 * Seed Loyalty System Initial Data
 *
 * Seeds:
 * - 4 loyalty tiers (Bronze, Silver, Gold, Platinum)
 * - 7 points earning rules
 * - 10+ rewards in the catalog
 */

import { db } from '../server/db';
import {
  loyaltyTiers,
  loyaltyRules,
  rewards,
} from '../shared/schema';
import { eq } from 'drizzle-orm';

async function seedLoyaltyData() {
  console.log('🌱 Seeding loyalty system data...\n');

  try {
    // ========================================
    // 1. SEED LOYALTY TIERS
    // ========================================
    console.log('📊 Seeding loyalty tiers...');

    const tiersData = [
      {
        name: 'Bronze',
        level: 1,
        pointsRequired: 0,
        benefits: [
          'Earn points on purchases',
          'Access to rewards catalog',
          'Birthday bonus points',
          'Email support',
        ],
        discountPercentage: '0',
        freeShippingThreshold: null,
        prioritySupport: false,
        earlyAccess: false,
        color: '#CD7F32', // Bronze color
        icon: '🥉',
      },
      {
        name: 'Silver',
        level: 2,
        pointsRequired: 500,
        benefits: [
          'All Bronze benefits',
          '5% discount on all purchases',
          '1.25x points multiplier',
          'Free shipping on orders $50+',
          'Priority email support',
          'Exclusive Silver rewards',
        ],
        discountPercentage: '5.00',
        freeShippingThreshold: '50.00',
        prioritySupport: true,
        earlyAccess: false,
        color: '#C0C0C0', // Silver color
        icon: '🥈',
      },
      {
        name: 'Gold',
        level: 3,
        pointsRequired: 2000,
        benefits: [
          'All Silver benefits',
          '10% discount on all purchases',
          '1.5x points multiplier',
          'Free shipping on orders $25+',
          'Priority support + live chat',
          'Early access to sales and new products',
          'Exclusive Gold rewards',
          'Birthday surprise gift',
        ],
        discountPercentage: '10.00',
        freeShippingThreshold: '25.00',
        prioritySupport: true,
        earlyAccess: true,
        color: '#FFD700', // Gold color
        icon: '🥇',
      },
      {
        name: 'Platinum',
        level: 4,
        pointsRequired: 5000,
        benefits: [
          'All Gold benefits',
          '15% discount on all purchases',
          '2x points multiplier',
          'Always free shipping',
          'VIP support (phone + priority)',
          'Early access + exclusive products',
          'Exclusive Platinum experiences',
          'Personal shopping assistance',
          'Concierge service',
          'Anniversary gifts',
        ],
        discountPercentage: '15.00',
        freeShippingThreshold: '0.00',
        prioritySupport: true,
        earlyAccess: true,
        color: '#E5E4E2', // Platinum color
        icon: '💎',
      },
    ];

    for (const tierData of tiersData) {
      // Check if tier already exists
      const existing = await db
        .select()
        .from(loyaltyTiers)
        .where(eq(loyaltyTiers.name, tierData.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(loyaltyTiers).values(tierData);
        console.log(`  ✓ Created ${tierData.icon} ${tierData.name} tier (${tierData.pointsRequired}+ points)`);
      } else {
        console.log(`  → ${tierData.name} tier already exists`);
      }
    }

    // ========================================
    // 2. SEED POINTS EARNING RULES
    // ========================================
    console.log('\n💰 Seeding points earning rules...');

    const rulesData = [
      {
        name: 'Purchase Rewards',
        description: 'Earn 1 point for every $1 spent (with tier multipliers)',
        eventType: 'purchase',
        pointsAwarded: 0, // Calculated based on order amount
        calculationType: 'percentage',
        calculationValue: '1.00', // 1% = 1 point per dollar
        minAmount: '0.00',
        maxPoints: null,
        tierMultipliers: {
          Bronze: 1,
          Silver: 1.25,
          Gold: 1.5,
          Platinum: 2,
        },
        isActive: true,
        startDate: new Date(),
        endDate: null,
      },
      {
        name: 'Product Review Bonus',
        description: 'Earn points for leaving a product review',
        eventType: 'review',
        pointsAwarded: 50,
        calculationType: 'fixed',
        calculationValue: null,
        minAmount: null,
        maxPoints: null,
        tierMultipliers: null,
        isActive: true,
        startDate: new Date(),
        endDate: null,
      },
      {
        name: 'Photo Review Bonus',
        description: 'Extra points for reviews with photos',
        eventType: 'photo_review',
        pointsAwarded: 100,
        calculationType: 'fixed',
        calculationValue: null,
        minAmount: null,
        maxPoints: null,
        tierMultipliers: null,
        isActive: true,
        startDate: new Date(),
        endDate: null,
      },
      {
        name: 'Signup Welcome Bonus',
        description: 'Welcome bonus for joining the loyalty program',
        eventType: 'signup',
        pointsAwarded: 100,
        calculationType: 'fixed',
        calculationValue: null,
        minAmount: null,
        maxPoints: null,
        tierMultipliers: null,
        isActive: true,
        startDate: new Date(),
        endDate: null,
      },
      {
        name: 'Referral Signup Bonus',
        description: 'Earn points when your referral signs up',
        eventType: 'referral_signup',
        pointsAwarded: 200,
        calculationType: 'fixed',
        calculationValue: null,
        minAmount: null,
        maxPoints: null,
        tierMultipliers: null,
        isActive: true,
        startDate: new Date(),
        endDate: null,
      },
      {
        name: 'Referral Completion Bonus',
        description: 'Bonus points when your referral makes their first purchase',
        eventType: 'referral_complete',
        pointsAwarded: 500,
        calculationType: 'fixed',
        calculationValue: null,
        minAmount: null,
        maxPoints: null,
        tierMultipliers: null,
        isActive: true,
        startDate: new Date(),
        endDate: null,
      },
      {
        name: 'Social Share Bonus',
        description: 'Earn points for sharing on social media',
        eventType: 'share',
        pointsAwarded: 25,
        calculationType: 'fixed',
        calculationValue: null,
        minAmount: null,
        maxPoints: 100, // Max 100 points per day from shares
        tierMultipliers: null,
        isActive: true,
        startDate: new Date(),
        endDate: null,
      },
    ];

    for (const ruleData of rulesData) {
      const existing = await db
        .select()
        .from(loyaltyRules)
        .where(eq(loyaltyRules.eventType, ruleData.eventType))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(loyaltyRules).values(ruleData);
        console.log(`  ✓ Created rule: ${ruleData.name} (${ruleData.pointsAwarded} points)`);
      } else {
        console.log(`  → Rule for ${ruleData.eventType} already exists`);
      }
    }

    // ========================================
    // 3. SEED REWARDS CATALOG
    // ========================================
    console.log('\n🎁 Seeding rewards catalog...');

    const rewardsData = [
      {
        businessId: null, // Platform-wide
        name: '$5 Off Your Next Order',
        description: 'Get $5 off any purchase of $25 or more',
        imageUrl: null,
        pointsCost: 500,
        rewardType: 'discount',
        rewardValue: '5.00',
        discountType: 'fixed_amount',
        discountAmount: '5.00',
        productId: null,
        category: 'Discount',
        termsConditions: 'Valid on orders $25+. Cannot be combined with other discounts. One use per customer.',
        stockQuantity: null, // Unlimited
        maxRedemptionsPerUser: 5,
        validFrom: new Date(),
        validUntil: null,
        isActive: true,
        isFeatured: true,
        tierRestriction: null, // Available to all tiers
        redemptionCount: 0,
      },
      {
        businessId: null,
        name: '$10 Off Your Next Order',
        description: 'Get $10 off any purchase of $50 or more',
        imageUrl: null,
        pointsCost: 900,
        rewardType: 'discount',
        rewardValue: '10.00',
        discountType: 'fixed_amount',
        discountAmount: '10.00',
        productId: null,
        category: 'Discount',
        termsConditions: 'Valid on orders $50+. Cannot be combined with other discounts. One use per customer.',
        stockQuantity: null,
        maxRedemptionsPerUser: 3,
        validFrom: new Date(),
        validUntil: null,
        isActive: true,
        isFeatured: true,
        tierRestriction: null,
        redemptionCount: 0,
      },
      {
        businessId: null,
        name: '$25 Off Your Next Order',
        description: 'Get $25 off any purchase of $100 or more',
        imageUrl: null,
        pointsCost: 2000,
        rewardType: 'discount',
        rewardValue: '25.00',
        discountType: 'fixed_amount',
        discountAmount: '25.00',
        productId: null,
        category: 'Discount',
        termsConditions: 'Valid on orders $100+. Cannot be combined with other discounts. One use per customer.',
        stockQuantity: null,
        maxRedemptionsPerUser: 2,
        validFrom: new Date(),
        validUntil: null,
        isActive: true,
        isFeatured: false,
        tierRestriction: 2, // Silver and above
        redemptionCount: 0,
      },
      {
        businessId: null,
        name: 'Free Standard Shipping',
        description: 'Free standard shipping on your next order',
        imageUrl: null,
        pointsCost: 250,
        rewardType: 'free_shipping',
        rewardValue: '8.99',
        discountType: null,
        discountAmount: null,
        productId: null,
        category: 'Shipping',
        termsConditions: 'Valid for standard shipping only. Expedited shipping not included.',
        stockQuantity: null,
        maxRedemptionsPerUser: 10,
        validFrom: new Date(),
        validUntil: null,
        isActive: true,
        isFeatured: true,
        tierRestriction: null,
        redemptionCount: 0,
      },
      {
        businessId: null,
        name: '20% Off Entire Order',
        description: 'Get 20% off your entire purchase (max $50 discount)',
        imageUrl: null,
        pointsCost: 1500,
        rewardType: 'discount',
        rewardValue: '50.00',
        discountType: 'percentage',
        discountAmount: '20.00',
        productId: null,
        category: 'Discount',
        termsConditions: 'Maximum discount of $50. Cannot be combined with other offers.',
        stockQuantity: null,
        maxRedemptionsPerUser: 2,
        validFrom: new Date(),
        validUntil: null,
        isActive: true,
        isFeatured: true,
        tierRestriction: 2, // Silver and above
        redemptionCount: 0,
      },
      {
        businessId: null,
        name: 'VIP Early Access Pass',
        description: 'Get 24-hour early access to all sales and new product launches',
        imageUrl: null,
        pointsCost: 3000,
        rewardType: 'experience',
        rewardValue: null,
        discountType: null,
        discountAmount: null,
        productId: null,
        category: 'VIP Experience',
        termsConditions: 'Valid for 30 days from redemption. Early access notifications sent via email.',
        stockQuantity: null,
        maxRedemptionsPerUser: 1,
        validFrom: new Date(),
        validUntil: null,
        isActive: true,
        isFeatured: false,
        tierRestriction: 3, // Gold and above
        redemptionCount: 0,
      },
      {
        businessId: null,
        name: '$50 Gift Card',
        description: 'Redeem for a $50 gift card to use on any purchase',
        imageUrl: null,
        pointsCost: 4500,
        rewardType: 'gift_card',
        rewardValue: '50.00',
        discountType: null,
        discountAmount: null,
        productId: null,
        category: 'Gift Card',
        termsConditions: 'Gift card code valid for 1 year. No cash value. Cannot be combined with other discounts.',
        stockQuantity: null,
        maxRedemptionsPerUser: 2,
        validFrom: new Date(),
        validUntil: null,
        isActive: true,
        isFeatured: true,
        tierRestriction: 3, // Gold and above
        redemptionCount: 0,
      },
      {
        businessId: null,
        name: 'Platinum VIP Experience',
        description: 'Exclusive VIP shopping experience with personal concierge',
        imageUrl: null,
        pointsCost: 10000,
        rewardType: 'experience',
        rewardValue: null,
        discountType: null,
        discountAmount: null,
        productId: null,
        category: 'VIP Experience',
        termsConditions: 'Exclusive to Platinum members. Includes personal shopping session, priority customer service, and exclusive product previews.',
        stockQuantity: 10,
        maxRedemptionsPerUser: 1,
        validFrom: new Date(),
        validUntil: null,
        isActive: true,
        isFeatured: true,
        tierRestriction: 4, // Platinum only
        redemptionCount: 0,
      },
      {
        businessId: null,
        name: 'Double Points Weekend',
        description: 'Earn 2x points on all purchases for one weekend',
        imageUrl: null,
        pointsCost: 2500,
        rewardType: 'experience',
        rewardValue: null,
        discountType: null,
        discountAmount: null,
        productId: null,
        category: 'Points Bonus',
        termsConditions: 'Valid for the next weekend (Friday-Sunday). 2x multiplier applied to base points only.',
        stockQuantity: null,
        maxRedemptionsPerUser: 2,
        validFrom: new Date(),
        validUntil: null,
        isActive: true,
        isFeatured: false,
        tierRestriction: 2, // Silver and above
        redemptionCount: 0,
      },
      {
        businessId: null,
        name: 'Birthday Month Special',
        description: '25% off during your birthday month',
        imageUrl: null,
        pointsCost: 1000,
        rewardType: 'discount',
        rewardValue: null,
        discountType: 'percentage',
        discountAmount: '25.00',
        productId: null,
        category: 'Birthday Special',
        termsConditions: 'Valid during your birthday month only. Maximum discount of $100.',
        stockQuantity: null,
        maxRedemptionsPerUser: 1,
        validFrom: new Date(),
        validUntil: null,
        isActive: true,
        isFeatured: false,
        tierRestriction: null,
        redemptionCount: 0,
      },
    ];

    for (const rewardData of rewardsData) {
      const existing = await db
        .select()
        .from(rewards)
        .where(eq(rewards.name, rewardData.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(rewards).values(rewardData);
        console.log(`  ✓ Created reward: ${rewardData.name} (${rewardData.pointsCost} points)`);
      } else {
        console.log(`  → Reward "${rewardData.name}" already exists`);
      }
    }

    console.log('\n✅ Loyalty system seeding complete!\n');
    console.log('Summary:');
    console.log('  • 4 loyalty tiers (Bronze → Platinum)');
    console.log('  • 7 points earning rules');
    console.log('  • 10 rewards in catalog');
    console.log('');
  } catch (error) {
    console.error('❌ Error seeding loyalty data:', error);
    throw error;
  }
}

// Run the seed function
seedLoyaltyData()
  .then(() => {
    console.log('Seeding completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });

export { seedLoyaltyData };
