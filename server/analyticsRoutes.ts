import type { Express, Request, Response } from "express";
import { analyticsStorage } from "./analyticsStorage";

/**
 * Analytics & Business Intelligence API Routes
 * Provides comprehensive analytics endpoints for:
 * - Platform overview metrics
 * - Business performance analytics
 * - User behavior insights
 * - Product performance tracking
 * - Real-time event tracking
 * - Cohort analysis
 * - Conversion funnels
 */
export function registerAnalyticsRoutes(app: Express) {
  console.log("📊 Registering analytics & BI routes...");

  // ========================================
  // EVENT TRACKING
  // ========================================

  /**
   * Track a real-time analytics event
   * POST /api/analytics/events
   */
  app.post("/api/analytics/events", async (req: any, res: Response) => {
    try {
      const event = await analyticsStorage.trackEvent({
        ...req.body,
        userId: req.user?.claims?.sub,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      res.json({ success: true, eventId: event.id });
    } catch (error: any) {
      console.error("Error tracking event:", error);
      res.status(500).json({ message: "Failed to track event" });
    }
  });

  /**
   * Get analytics events
   * GET /api/analytics/events?startDate=2025-01-01&endDate=2025-01-31&eventType=page_view
   */
  app.get("/api/analytics/events", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, eventType, userId, businessId, productId, limit } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }

      const events = await analyticsStorage.getEvents({
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        eventType: eventType as string,
        userId: userId as string,
        businessId: businessId as string,
        productId: productId as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(events);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // ========================================
  // PLATFORM METRICS
  // ========================================

  /**
   * Get platform overview metrics
   * GET /api/analytics/platform/overview?days=30
   */
  app.get("/api/analytics/platform/overview", async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const overview = await analyticsStorage.getPlatformOverview(days);
      res.json(overview);
    } catch (error: any) {
      console.error("Error fetching platform overview:", error);
      res.status(500).json({ message: "Failed to fetch platform overview" });
    }
  });

  /**
   * Get daily metrics for a date range
   * GET /api/analytics/platform/daily?startDate=2025-01-01&endDate=2025-01-31
   */
  app.get("/api/analytics/platform/daily", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }

      const metrics = await analyticsStorage.getDailyMetrics(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching daily metrics:", error);
      res.status(500).json({ message: "Failed to fetch daily metrics" });
    }
  });

  /**
   * Manually trigger daily metrics aggregation
   * POST /api/analytics/platform/aggregate
   */
  app.post("/api/analytics/platform/aggregate", async (req: Request, res: Response) => {
    try {
      const { date } = req.body;
      const targetDate = date ? new Date(date) : new Date();

      const metrics = await analyticsStorage.aggregateDailyMetrics(targetDate);
      res.json({ success: true, metrics });
    } catch (error: any) {
      console.error("Error aggregating metrics:", error);
      res.status(500).json({ message: "Failed to aggregate metrics" });
    }
  });

  // ========================================
  // BUSINESS ANALYTICS
  // ========================================

  /**
   * Get business dashboard summary
   * GET /api/analytics/business/:businessId/dashboard?days=30
   */
  app.get("/api/analytics/business/:businessId/dashboard", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      const dashboard = await analyticsStorage.getBusinessDashboard(businessId, days);
      res.json(dashboard);
    } catch (error: any) {
      console.error("Error fetching business dashboard:", error);
      res.status(500).json({ message: "Failed to fetch business dashboard" });
    }
  });

  /**
   * Get business metrics for a date range
   * GET /api/analytics/business/:businessId/metrics?startDate=2025-01-01&endDate=2025-01-31
   */
  app.get("/api/analytics/business/:businessId/metrics", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }

      const metrics = await analyticsStorage.getBusinessMetrics(
        businessId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching business metrics:", error);
      res.status(500).json({ message: "Failed to fetch business metrics" });
    }
  });

  /**
   * Manually trigger business metrics aggregation
   * POST /api/analytics/business/:businessId/aggregate
   */
  app.post("/api/analytics/business/:businessId/aggregate", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const { date } = req.body;
      const targetDate = date ? new Date(date) : new Date();

      const metrics = await analyticsStorage.aggregateBusinessMetrics(businessId, targetDate);
      res.json({ success: true, metrics });
    } catch (error: any) {
      console.error("Error aggregating business metrics:", error);
      res.status(500).json({ message: "Failed to aggregate business metrics" });
    }
  });

  // ========================================
  // COHORT ANALYSIS
  // ========================================

  /**
   * Get cohorts by type
   * GET /api/analytics/cohorts?type=signup_month&limit=12
   */
  app.get("/api/analytics/cohorts", async (req: Request, res: Response) => {
    try {
      const { type, limit } = req.query;

      if (!type) {
        return res.status(400).json({ message: "type is required" });
      }

      const cohorts = await analyticsStorage.getCohorts(
        type as string,
        limit ? parseInt(limit as string) : 12
      );

      res.json(cohorts);
    } catch (error: any) {
      console.error("Error fetching cohorts:", error);
      res.status(500).json({ message: "Failed to fetch cohorts" });
    }
  });

  /**
   * Create or update a cohort
   * POST /api/analytics/cohorts
   */
  app.post("/api/analytics/cohorts", async (req: Request, res: Response) => {
    try {
      const cohort = await analyticsStorage.createCohort(req.body);
      res.json(cohort);
    } catch (error: any) {
      console.error("Error creating cohort:", error);
      res.status(500).json({ message: "Failed to create cohort" });
    }
  });

  // ========================================
  // CONVERSION FUNNELS
  // ========================================

  /**
   * Get funnel data
   * GET /api/analytics/funnels/:funnelName?startDate=2025-01-01&endDate=2025-01-31
   */
  app.get("/api/analytics/funnels/:funnelName", async (req: Request, res: Response) => {
    try {
      const { funnelName } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }

      const funnels = await analyticsStorage.getFunnels(
        funnelName,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(funnels);
    } catch (error: any) {
      console.error("Error fetching funnels:", error);
      res.status(500).json({ message: "Failed to fetch funnels" });
    }
  });

  /**
   * Track funnel data
   * POST /api/analytics/funnels
   */
  app.post("/api/analytics/funnels", async (req: Request, res: Response) => {
    try {
      const funnel = await analyticsStorage.trackFunnel(req.body);
      res.json(funnel);
    } catch (error: any) {
      console.error("Error tracking funnel:", error);
      res.status(500).json({ message: "Failed to track funnel" });
    }
  });

  // ========================================
  // REAL-TIME STATS
  // ========================================

  /**
   * Get real-time platform stats
   * GET /api/analytics/realtime
   */
  app.get("/api/analytics/realtime", async (req: Request, res: Response) => {
    try {
      // Get events from last 5 minutes for real-time view
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const now = new Date();

      const recentEvents = await analyticsStorage.getEvents({
        startDate: fiveMinutesAgo,
        endDate: now,
        limit: 100,
      });

      // Group by event type
      const eventCounts: Record<string, number> = {};
      recentEvents.forEach(event => {
        eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
      });

      // Get unique users
      const uniqueUsers = new Set(
        recentEvents
          .filter(e => e.userId)
          .map(e => e.userId)
      ).size;

      res.json({
        timestamp: now,
        period: "5 minutes",
        totalEvents: recentEvents.length,
        uniqueUsers,
        eventBreakdown: eventCounts,
        recentEvents: recentEvents.slice(0, 10), // Latest 10 events
      });
    } catch (error: any) {
      console.error("Error fetching realtime stats:", error);
      res.status(500).json({ message: "Failed to fetch realtime stats" });
    }
  });

  console.log("📊 Analytics & BI routes registered");
}
