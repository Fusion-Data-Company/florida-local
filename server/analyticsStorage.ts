import { db } from "./db";
import {
  dailyMetrics,
  businessMetrics,
  userMetrics,
  productMetrics,
  analyticsEvents,
  customerCohorts,
  conversionFunnels,
  users,
  businesses,
  products,
  orders,
  orderItems,
  loyaltyTransactions,
  type DailyMetrics,
  type BusinessMetrics,
  type UserMetrics,
  type ProductMetrics,
  type AnalyticsEvent,
  type CustomerCohort,
  type ConversionFunnel,
} from "@shared/schema";
import { eq, and, gte, lte, desc, sql, count, sum, avg } from "drizzle-orm";

/**
 * Analytics Storage Layer
 * Handles all analytics data operations including:
 * - Event tracking
 * - Metrics aggregation
 * - Cohort analysis
 * - Funnel tracking
 * - Business intelligence queries
 */
export class AnalyticsStorage {

  // ========================================
  // EVENT TRACKING
  // ========================================

  /**
   * Track a single analytics event in real-time
   */
  async trackEvent(eventData: {
    eventType: string;
    eventCategory?: string;
    userId?: string;
    businessId?: string;
    productId?: string;
    orderId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    eventData?: any;
    metadata?: any;
  }): Promise<AnalyticsEvent> {
    const startTime = Date.now();

    const [event] = await db.insert(analyticsEvents).values({
      eventType: eventData.eventType,
      eventCategory: eventData.eventCategory,
      userId: eventData.userId,
      businessId: eventData.businessId,
      productId: eventData.productId,
      orderId: eventData.orderId,
      sessionId: eventData.sessionId,
      ipAddress: eventData.ipAddress,
      userAgent: eventData.userAgent,
      eventData: eventData.eventData,
      processingTime: Date.now() - startTime,
      metadata: eventData.metadata,
    }).returning();

    return event;
  }

  /**
   * Get events for a specific time range
   */
  async getEvents(filters: {
    startDate: Date;
    endDate: Date;
    eventType?: string;
    userId?: string;
    businessId?: string;
    productId?: string;
    limit?: number;
  }): Promise<AnalyticsEvent[]> {
    const conditions = [
      gte(analyticsEvents.timestamp, filters.startDate),
      lte(analyticsEvents.timestamp, filters.endDate),
    ];

    if (filters.eventType) {
      conditions.push(eq(analyticsEvents.eventType, filters.eventType));
    }
    if (filters.userId) {
      conditions.push(eq(analyticsEvents.userId, filters.userId));
    }
    if (filters.businessId) {
      conditions.push(eq(analyticsEvents.businessId, filters.businessId));
    }
    if (filters.productId) {
      conditions.push(eq(analyticsEvents.productId, filters.productId));
    }

    let query = db
      .select()
      .from(analyticsEvents)
      .where(and(...conditions))
      .orderBy(desc(analyticsEvents.timestamp));

    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  // ========================================
  // DAILY METRICS AGGREGATION
  // ========================================

  /**
   * Aggregate and store daily platform metrics
   */
  async aggregateDailyMetrics(date: Date): Promise<DailyMetrics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Calculate revenue metrics
    const revenueData = await db
      .select({
        totalRevenue: sum(orders.total),
        orderCount: count(orders.id),
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfDay),
          lte(orders.createdAt, endOfDay),
          eq(orders.status, "completed")
        )
      );

    const totalRevenue = parseFloat(revenueData[0]?.totalRevenue || "0");
    const orderCount = revenueData[0]?.orderCount || 0;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Calculate user metrics
    const newUsersData = await db
      .select({ count: count(users.id) })
      .from(users)
      .where(
        and(
          gte(users.createdAt, startOfDay),
          lte(users.createdAt, endOfDay)
        )
      );

    const activeUsersData = await db
      .select({ count: count(users.id) })
      .from(users)
      .where(
        and(
          gte(users.lastSeenAt, startOfDay),
          lte(users.lastSeenAt, endOfDay)
        )
      );

    // Calculate business metrics
    const newBusinessesData = await db
      .select({ count: count(businesses.id) })
      .from(businesses)
      .where(
        and(
          gte(businesses.createdAt, startOfDay),
          lte(businesses.createdAt, endOfDay)
        )
      );

    // Calculate loyalty metrics
    const loyaltyData = await db
      .select({
        pointsEarned: sum(
          sql<number>`CASE WHEN ${loyaltyTransactions.type} = 'earn' THEN ${loyaltyTransactions.points} ELSE 0 END`
        ),
        pointsRedeemed: sum(
          sql<number>`CASE WHEN ${loyaltyTransactions.type} = 'redeem' THEN ${loyaltyTransactions.points} ELSE 0 END`
        ),
      })
      .from(loyaltyTransactions)
      .where(
        and(
          gte(loyaltyTransactions.createdAt, startOfDay),
          lte(loyaltyTransactions.createdAt, endOfDay)
        )
      );

    // Calculate engagement metrics
    const reviewsData = await db
      .select({ count: count(reviews.id) })
      .from(reviews)
      .where(
        and(
          gte(reviews.createdAt, startOfDay),
          lte(reviews.createdAt, endOfDay)
        )
      );

    // Upsert daily metrics
    const metrics = {
      date: startOfDay,
      totalRevenue: totalRevenue.toFixed(2),
      orderCount,
      averageOrderValue: averageOrderValue.toFixed(2),
      newUsers: newUsersData[0]?.count || 0,
      activeUsers: activeUsersData[0]?.count || 0,
      returningUsers: 0, // Calculate based on previous visits
      newBusinesses: newBusinessesData[0]?.count || 0,
      activeBusinesses: 0, // Calculate based on activity
      productsListed: 0,
      productsSold: 0,
      pointsEarned: loyaltyData[0]?.pointsEarned || 0,
      pointsRedeemed: loyaltyData[0]?.pointsRedeemed || 0,
      rewardsRedeemed: 0,
      reviewsCreated: reviewsData[0]?.count || 0,
      messagesExchanged: 0,
      socialShares: 0,
      referralsSent: 0,
      referralsCompleted: 0,
    };

    // Check if metrics already exist for this date
    const existing = await db
      .select()
      .from(dailyMetrics)
      .where(eq(dailyMetrics.date, startOfDay))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      const [updated] = await db
        .update(dailyMetrics)
        .set({ ...metrics, updatedAt: new Date() })
        .where(eq(dailyMetrics.date, startOfDay))
        .returning();
      return updated;
    } else {
      // Insert new
      const [created] = await db
        .insert(dailyMetrics)
        .values(metrics)
        .returning();
      return created;
    }
  }

  /**
   * Get daily metrics for a date range
   */
  async getDailyMetrics(startDate: Date, endDate: Date): Promise<DailyMetrics[]> {
    return await db
      .select()
      .from(dailyMetrics)
      .where(
        and(
          gte(dailyMetrics.date, startDate),
          lte(dailyMetrics.date, endDate)
        )
      )
      .orderBy(dailyMetrics.date);
  }

  /**
   * Get platform overview metrics
   */
  async getPlatformOverview(days: number = 30): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await this.getDailyMetrics(startDate, endDate);

    const totals = metrics.reduce((acc, day) => {
      return {
        totalRevenue: acc.totalRevenue + parseFloat(day.totalRevenue),
        totalOrders: acc.totalOrders + day.orderCount,
        totalUsers: acc.totalUsers + day.newUsers,
        totalActiveUsers: acc.totalActiveUsers + day.activeUsers,
        totalBusinesses: acc.totalBusinesses + day.newBusinesses,
        totalPointsEarned: acc.totalPointsEarned + day.pointsEarned,
        totalPointsRedeemed: acc.totalPointsRedeemed + day.pointsRedeemed,
        totalReviews: acc.totalReviews + day.reviewsCreated,
      };
    }, {
      totalRevenue: 0,
      totalOrders: 0,
      totalUsers: 0,
      totalActiveUsers: 0,
      totalBusinesses: 0,
      totalPointsEarned: 0,
      totalPointsRedeemed: 0,
      totalReviews: 0,
    });

    const avgOrderValue = totals.totalOrders > 0
      ? totals.totalRevenue / totals.totalOrders
      : 0;

    return {
      period: `${days} days`,
      startDate,
      endDate,
      ...totals,
      averageOrderValue: avgOrderValue.toFixed(2),
      dailyMetrics: metrics,
    };
  }

  // ========================================
  // BUSINESS ANALYTICS
  // ========================================

  /**
   * Aggregate business metrics for a specific business and date
   */
  async aggregateBusinessMetrics(businessId: string, date: Date): Promise<BusinessMetrics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get business products
    const businessProducts = await db
      .select()
      .from(products)
      .where(eq(products.businessId, businessId));

    const productIds = businessProducts.map(p => p.id);

    // Calculate revenue from orders
    let revenue = 0;
    let ordersCount = 0;

    if (productIds.length > 0) {
      const orderData = await db
        .select({
          totalRevenue: sum(orderItems.totalPrice),
          orderCount: count(sql`DISTINCT ${orderItems.orderId}`),
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            sql`${orderItems.productId} IN ${productIds}`,
            gte(orders.createdAt, startOfDay),
            lte(orders.createdAt, endOfDay),
            eq(orders.status, "completed")
          )
        );

      revenue = parseFloat(orderData[0]?.totalRevenue || "0");
      ordersCount = orderData[0]?.orderCount || 0;
    }

    // Calculate review metrics
    const reviewData = await db
      .select({
        count: count(reviews.id),
        avgRating: avg(reviews.rating),
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.businessId, businessId),
          gte(reviews.createdAt, startOfDay),
          lte(reviews.createdAt, endOfDay)
        )
      );

    const metrics = {
      businessId,
      date: startOfDay,
      views: 0, // Track via events
      uniqueVisitors: 0,
      clicks: 0,
      revenue: revenue.toFixed(2),
      orders: ordersCount,
      productsListedCount: businessProducts.length,
      productsSoldCount: 0,
      newCustomers: 0,
      returningCustomers: 0,
      averageOrderValue: ordersCount > 0 ? (revenue / ordersCount).toFixed(2) : "0",
      reviewsReceived: reviewData[0]?.count || 0,
      averageRating: parseFloat(reviewData[0]?.avgRating || "0").toFixed(2),
      messagesReceived: 0,
      messagesReplied: 0,
      spotlightVotes: 0,
      spotlightWins: 0,
    };

    // Upsert
    const existing = await db
      .select()
      .from(businessMetrics)
      .where(
        and(
          eq(businessMetrics.businessId, businessId),
          eq(businessMetrics.date, startOfDay)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(businessMetrics)
        .set({ ...metrics, updatedAt: new Date() })
        .where(
          and(
            eq(businessMetrics.businessId, businessId),
            eq(businessMetrics.date, startOfDay)
          )
        )
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(businessMetrics)
        .values(metrics)
        .returning();
      return created;
    }
  }

  /**
   * Get business metrics for a date range
   */
  async getBusinessMetrics(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BusinessMetrics[]> {
    return await db
      .select()
      .from(businessMetrics)
      .where(
        and(
          eq(businessMetrics.businessId, businessId),
          gte(businessMetrics.date, startDate),
          lte(businessMetrics.date, endDate)
        )
      )
      .orderBy(businessMetrics.date);
  }

  /**
   * Get business dashboard summary
   */
  async getBusinessDashboard(businessId: string, days: number = 30): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await this.getBusinessMetrics(businessId, startDate, endDate);

    const totals = metrics.reduce((acc, day) => {
      return {
        totalRevenue: acc.totalRevenue + parseFloat(day.revenue),
        totalOrders: acc.totalOrders + day.orders,
        totalViews: acc.totalViews + day.views,
        totalReviews: acc.totalReviews + day.reviewsReceived,
      };
    }, {
      totalRevenue: 0,
      totalOrders: 0,
      totalViews: 0,
      totalReviews: 0,
    });

    const avgOrderValue = totals.totalOrders > 0
      ? totals.totalRevenue / totals.totalOrders
      : 0;

    const avgRating = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + parseFloat(m.averageRating), 0) / metrics.length
      : 0;

    return {
      businessId,
      period: `${days} days`,
      startDate,
      endDate,
      ...totals,
      averageOrderValue: avgOrderValue.toFixed(2),
      averageRating: avgRating.toFixed(2),
      dailyMetrics: metrics,
    };
  }

  // ========================================
  // CUSTOMER COHORT ANALYSIS
  // ========================================

  /**
   * Create or update a cohort
   */
  async createCohort(cohortData: {
    cohortName: string;
    cohortType: string;
    cohortDate: Date;
    userCount?: number;
    activeUsers?: number;
    retentionRate?: string;
    totalRevenue?: string;
    averageRevenuePerUser?: string;
    averageOrdersPerUser?: string;
    averageLifetimeValue?: string;
    metadata?: any;
  }): Promise<CustomerCohort> {
    const existing = await db
      .select()
      .from(customerCohorts)
      .where(
        and(
          eq(customerCohorts.cohortName, cohortData.cohortName),
          eq(customerCohorts.cohortDate, cohortData.cohortDate)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(customerCohorts)
        .set({ ...cohortData, updatedAt: new Date() })
        .where(
          and(
            eq(customerCohorts.cohortName, cohortData.cohortName),
            eq(customerCohorts.cohortDate, cohortData.cohortDate)
          )
        )
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(customerCohorts)
        .values(cohortData)
        .returning();
      return created;
    }
  }

  /**
   * Get cohorts by type
   */
  async getCohorts(cohortType: string, limit: number = 12): Promise<CustomerCohort[]> {
    return await db
      .select()
      .from(customerCohorts)
      .where(eq(customerCohorts.cohortType, cohortType))
      .orderBy(desc(customerCohorts.cohortDate))
      .limit(limit);
  }

  // ========================================
  // CONVERSION FUNNELS
  // ========================================

  /**
   * Track conversion funnel
   */
  async trackFunnel(funnelData: {
    funnelName: string;
    date: Date;
    step1Count: number;
    step2Count: number;
    step3Count: number;
    step4Count?: number;
    step5Count?: number;
    metadata?: any;
  }): Promise<ConversionFunnel> {
    // Calculate conversion rates
    const step1ToStep2Rate = funnelData.step1Count > 0
      ? ((funnelData.step2Count / funnelData.step1Count) * 100).toFixed(2)
      : "0";

    const step2ToStep3Rate = funnelData.step2Count > 0
      ? ((funnelData.step3Count / funnelData.step2Count) * 100).toFixed(2)
      : "0";

    const step3ToStep4Rate = funnelData.step3Count > 0 && funnelData.step4Count
      ? ((funnelData.step4Count / funnelData.step3Count) * 100).toFixed(2)
      : "0";

    const step4ToStep5Rate = funnelData.step4Count && funnelData.step5Count
      ? ((funnelData.step5Count / funnelData.step4Count) * 100).toFixed(2)
      : "0";

    const finalStep = funnelData.step5Count || funnelData.step4Count || funnelData.step3Count;
    const overallConversionRate = funnelData.step1Count > 0
      ? ((finalStep / funnelData.step1Count) * 100).toFixed(2)
      : "0";

    const startOfDay = new Date(funnelData.date);
    startOfDay.setHours(0, 0, 0, 0);

    const data = {
      ...funnelData,
      date: startOfDay,
      step1ToStep2Rate,
      step2ToStep3Rate,
      step3ToStep4Rate,
      step4ToStep5Rate,
      overallConversionRate,
    };

    // Upsert
    const existing = await db
      .select()
      .from(conversionFunnels)
      .where(
        and(
          eq(conversionFunnels.funnelName, funnelData.funnelName),
          eq(conversionFunnels.date, startOfDay)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(conversionFunnels)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(conversionFunnels.funnelName, funnelData.funnelName),
            eq(conversionFunnels.date, startOfDay)
          )
        )
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(conversionFunnels)
        .values(data)
        .returning();
      return created;
    }
  }

  /**
   * Get funnel data for a date range
   */
  async getFunnels(
    funnelName: string,
    startDate: Date,
    endDate: Date
  ): Promise<ConversionFunnel[]> {
    return await db
      .select()
      .from(conversionFunnels)
      .where(
        and(
          eq(conversionFunnels.funnelName, funnelName),
          gte(conversionFunnels.date, startDate),
          lte(conversionFunnels.date, endDate)
        )
      )
      .orderBy(conversionFunnels.date);
  }
}

// Export singleton instance
export const analyticsStorage = new AnalyticsStorage();
