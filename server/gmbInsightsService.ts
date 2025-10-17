/**
 * Google My Business Insights and Analytics Service
 * Provides comprehensive insights, analytics, and performance tracking for GMB listings
 */

import { gmbService } from './gmbService';
import { gmbErrorHandler } from './gmbErrorHandler';
import { storage } from './storage';

export type MetricType = 
  | 'QUERIES_DIRECT' 
  | 'QUERIES_INDIRECT' 
  | 'QUERIES_CHAIN'
  | 'VIEWS_MAPS'
  | 'VIEWS_SEARCH'
  | 'ACTIONS_WEBSITE'
  | 'ACTIONS_PHONE'
  | 'ACTIONS_DRIVING_DIRECTIONS'
  | 'PHOTOS_VIEWS_MERCHANT'
  | 'PHOTOS_VIEWS_CUSTOMER'
  | 'PHOTOS_COUNT_MERCHANT'
  | 'PHOTOS_COUNT_CUSTOMER';

export type TimeGranularity = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';

export interface LocationInsights {
  businessId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    queries: QueryMetrics;
    views: ViewMetrics;
    actions: ActionMetrics;
    photos: PhotoMetrics;
  };
  topSearchQueries: SearchQuery[];
  competitorAnalysis?: CompetitorMetrics;
  trends: TrendAnalysis;
  recommendations: PerformanceRecommendation[];
  lastUpdated: Date;
}

export interface QueryMetrics {
  direct: MetricValue[];  // Brand searches
  indirect: MetricValue[]; // Category searches  
  chain: MetricValue[];    // Chain/franchise searches
  total: number;
  growthRate: number; // Percentage change
}

export interface ViewMetrics {
  maps: MetricValue[];
  search: MetricValue[];
  total: number;
  growthRate: number;
}

export interface ActionMetrics {
  website: MetricValue[];
  phone: MetricValue[];
  directions: MetricValue[];
  total: number;
  conversionRate: number; // Actions/Views ratio
}

export interface PhotoMetrics {
  merchantViews: MetricValue[];
  customerViews: MetricValue[];
  merchantCount: number;
  customerCount: number;
  engagementRate: number;
}

export interface MetricValue {
  date: Date;
  value: number;
  dayOfWeek?: number;
  hourOfDay?: number;
}

export interface SearchQuery {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate
  averagePosition: number;
}

export interface CompetitorMetrics {
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  photoCount: number;
  marketShare: number; // Estimated percentage
}

export interface TrendAnalysis {
  peakDays: string[];
  peakHours: number[];
  seasonalPatterns: SeasonalPattern[];
  growthTrend: 'increasing' | 'stable' | 'declining';
  anomalies: AnomalyDetection[];
}

export interface SeasonalPattern {
  period: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface AnomalyDetection {
  date: Date;
  metric: string;
  expectedValue: number;
  actualValue: number;
  severity: 'low' | 'medium' | 'high';
}

export interface PerformanceRecommendation {
  category: 'visibility' | 'engagement' | 'conversion' | 'content';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialImpact: string;
  actionItems: string[];
}

export interface InsightReport {
  id: string;
  businessId: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  dateGenerated: Date;
  insights: LocationInsights;
  summary: ReportSummary;
  exportUrl?: string;
}

export interface ReportSummary {
  highlights: string[];
  keyMetrics: {
    totalViews: number;
    totalActions: number;
    averageRating: number;
    conversionRate: number;
  };
  performanceScore: number; // 0-100
  comparisonPeriod: {
    views: number;
    actions: number;
    change: number; // Percentage
  };
}

export class GMBInsightsService {
  private readonly metricsCache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 60 * 60 * 1000; // 1 hour

  /**
   * Fetch comprehensive insights for a business location
   */
  async fetchLocationInsights(businessId: string, options: {
    dateRange: { start: Date; end: Date };
    granularity?: TimeGranularity;
    metrics?: MetricType[];
    includeCompetitors?: boolean;
  }): Promise<LocationInsights> {
    const business = await storage.getBusinessById(businessId);
    if (!business?.gmbAccountId || !business?.gmbLocationId) {
      throw new Error('Business is not connected to Google My Business');
    }

    const cacheKey = `insights_${businessId}_${options.dateRange.start.toISOString()}_${options.dateRange.end.toISOString()}`;
    
    // Check cache
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    return await gmbErrorHandler.withRetry(async () => {
      const locationName = `accounts/${business.gmbAccountId}/locations/${business.gmbLocationId}`;
      
      // Fetch different metric types in parallel
      const [queries, views, actions, photos, searchQueries] = await Promise.all([
        this.fetchQueryMetrics(businessId, locationName, options.dateRange),
        this.fetchViewMetrics(businessId, locationName, options.dateRange),
        this.fetchActionMetrics(businessId, locationName, options.dateRange),
        this.fetchPhotoMetrics(businessId, locationName, options.dateRange),
        this.fetchTopSearchQueries(businessId, locationName)
      ]);

      // Analyze trends
      const trends = this.analyzeTrends(queries, views, actions);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations({
        queries, views, actions, photos, trends
      });

      // Compile insights
      const insights: LocationInsights = {
        businessId,
        dateRange: options.dateRange,
        metrics: {
          queries,
          views,
          actions,
          photos
        },
        topSearchQueries: searchQueries,
        trends,
        recommendations,
        lastUpdated: new Date()
      };

      // Include competitor analysis if requested
      if (options.includeCompetitors) {
        insights.competitorAnalysis = await this.fetchCompetitorMetrics(businessId, business.category || '');
      }

      // Cache the results
      this.setCachedData(cacheKey, insights);

      // Store insights in database
      await this.storeInsights(businessId, insights);

      return insights;
    }, { maxRetries: 3 }, { businessId, operation: 'fetch_insights' });
  }

  /**
   * Fetch specific metric data
   */
  async fetchMetricData(businessId: string, metricType: MetricType, dateRange: { start: Date; end: Date }): Promise<MetricValue[]> {
    const business = await storage.getBusinessById(businessId);
    if (!business?.gmbAccountId || !business?.gmbLocationId) {
      throw new Error('Business is not connected to Google My Business');
    }

    return await gmbErrorHandler.withRetry(async () => {
      const accessToken = await gmbService.getValidAccessToken(businessId);
      const locationName = `accounts/${business.gmbAccountId}/locations/${business.gmbLocationId}`;
      
      const response = await fetch(
        `https://mybusiness.googleapis.com/v4/${locationName}/insights`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            locationNames: [locationName],
            basicRequest: {
              metricRequests: [{
                metric: metricType,
                options: ['AGGREGATED_DAILY']
              }],
              timeRange: {
                startTime: dateRange.start.toISOString(),
                endTime: dateRange.end.toISOString()
              }
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch metric data: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseMetricResponse(data);
    }, { maxRetries: 3 }, { businessId, operation: 'fetch_metric', metricType });
  }

  /**
   * Generate performance report
   */
  async generateReport(businessId: string, options: {
    reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
    dateRange?: { start: Date; end: Date };
    format?: 'json' | 'pdf' | 'csv';
    includeRecommendations?: boolean;
  }): Promise<InsightReport> {
    // Determine date range based on report type
    const dateRange = options.dateRange || this.getDateRangeForReportType(options.reportType);
    
    // Fetch insights
    const insights = await this.fetchLocationInsights(businessId, {
      dateRange,
      includeCompetitors: true
    });

    // Calculate summary metrics
    const summary = this.calculateReportSummary(insights);

    // Create report
    const report: InsightReport = {
      id: `report_${Date.now()}_${businessId}`,
      businessId,
      reportType: options.reportType,
      dateGenerated: new Date(),
      insights,
      summary
    };

    // Export if requested
    if (options.format && options.format !== 'json') {
      report.exportUrl = await this.exportReport(report, options.format);
    }

    return report;
  }

  /**
   * Track performance over time
   */
  async trackPerformanceTrend(businessId: string, metricType: MetricType, periods: number = 12): Promise<{
    trend: 'improving' | 'stable' | 'declining';
    data: Array<{ period: string; value: number; change: number }>;
    forecast: Array<{ period: string; value: number; confidence: number }>;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - periods);

    const metricData = await this.fetchMetricData(businessId, metricType, {
      start: startDate,
      end: endDate
    });

    // Group by period (monthly)
    const periodData = this.groupMetricsByPeriod(metricData, 'monthly');
    
    // Calculate period-over-period changes
    const trendData = periodData.map((period, index) => {
      const previousPeriod = periodData[index - 1];
      const change = previousPeriod ? 
        ((period.value - previousPeriod.value) / previousPeriod.value) * 100 : 0;
      
      return {
        period: period.period,
        value: period.value,
        change
      };
    });

    // Determine overall trend
    const trend = this.calculateOverallTrend(trendData);
    
    // Generate forecast
    const forecast = this.generateForecast(trendData);

    return { trend, data: trendData, forecast };
  }

  /**
   * Compare performance across multiple locations
   */
  async compareLocations(businessIds: string[], dateRange: { start: Date; end: Date }): Promise<{
    locations: Array<{
      businessId: string;
      name: string;
      metrics: {
        views: number;
        actions: number;
        conversionRate: number;
      };
      rank: number;
    }>;
    bestPerformer: string;
    insights: string[];
  }> {
    const locationData = await Promise.all(
      businessIds.map(async (id) => {
        const business = await storage.getBusinessById(id);
        const insights = await this.fetchLocationInsights(id, { dateRange });
        
        return {
          businessId: id,
          name: business?.name || 'Unknown',
          metrics: {
            views: insights.metrics.views.total,
            actions: insights.metrics.actions.total,
            conversionRate: insights.metrics.actions.conversionRate
          },
          rank: 0 // Will be calculated
        };
      })
    );

    // Rank locations by performance
    locationData.sort((a, b) => b.metrics.conversionRate - a.metrics.conversionRate);
    locationData.forEach((loc, index) => {
      loc.rank = index + 1;
    });

    // Generate comparative insights
    const insights = this.generateComparativeInsights(locationData);

    return {
      locations: locationData,
      bestPerformer: locationData[0].businessId,
      insights
    };
  }

  /**
   * Set up automated reporting
   */
  async scheduleAutomatedReports(businessId: string, config: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    includeInsights: boolean;
    includeRecommendations: boolean;
  }): Promise<{ scheduleId: string; nextRun: Date }> {
    // Store schedule configuration
    const scheduleId = `schedule_${Date.now()}_${businessId}`;
    
    // Calculate next run time
    const nextRun = this.calculateNextRunTime(config.frequency);
    
    // In a real implementation, this would set up a cron job or scheduled task
    // For now, we'll just return the schedule info
    
    return { scheduleId, nextRun };
  }

  /**
   * Get actionable insights based on current performance
   */
  async getActionableInsights(businessId: string): Promise<{
    immediate: PerformanceRecommendation[];
    shortTerm: PerformanceRecommendation[];
    longTerm: PerformanceRecommendation[];
  }> {
    const dateRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    };

    const insights = await this.fetchLocationInsights(businessId, { dateRange });
    
    // Categorize recommendations by urgency
    const immediate = insights.recommendations.filter(r => r.priority === 'high');
    const shortTerm = insights.recommendations.filter(r => r.priority === 'medium');
    const longTerm = insights.recommendations.filter(r => r.priority === 'low');

    return { immediate, shortTerm, longTerm };
  }

  /**
   * Helper: Fetch query metrics
   */
  private async fetchQueryMetrics(businessId: string, locationName: string, dateRange: { start: Date; end: Date }): Promise<QueryMetrics> {
    // In a real implementation, make API calls
    // For demo, return mock data
    const mockData = this.generateMockMetricData(dateRange, 100, 500);
    
    return {
      direct: mockData,
      indirect: this.generateMockMetricData(dateRange, 200, 800),
      chain: this.generateMockMetricData(dateRange, 10, 50),
      total: mockData.reduce((sum, m) => sum + m.value, 0),
      growthRate: 15.5
    };
  }

  /**
   * Helper: Fetch view metrics
   */
  private async fetchViewMetrics(businessId: string, locationName: string, dateRange: { start: Date; end: Date }): Promise<ViewMetrics> {
    const mapsViews = this.generateMockMetricData(dateRange, 500, 2000);
    const searchViews = this.generateMockMetricData(dateRange, 1000, 5000);
    
    return {
      maps: mapsViews,
      search: searchViews,
      total: mapsViews.reduce((sum, m) => sum + m.value, 0) + searchViews.reduce((sum, m) => sum + m.value, 0),
      growthRate: 22.3
    };
  }

  /**
   * Helper: Fetch action metrics
   */
  private async fetchActionMetrics(businessId: string, locationName: string, dateRange: { start: Date; end: Date }): Promise<ActionMetrics> {
    const websiteClicks = this.generateMockMetricData(dateRange, 50, 200);
    const phoneCalls = this.generateMockMetricData(dateRange, 20, 100);
    const directions = this.generateMockMetricData(dateRange, 30, 150);
    
    const totalActions = websiteClicks.reduce((sum, m) => sum + m.value, 0) +
                        phoneCalls.reduce((sum, m) => sum + m.value, 0) +
                        directions.reduce((sum, m) => sum + m.value, 0);
    
    return {
      website: websiteClicks,
      phone: phoneCalls,
      directions,
      total: totalActions,
      conversionRate: 8.5
    };
  }

  /**
   * Helper: Fetch photo metrics
   */
  private async fetchPhotoMetrics(businessId: string, locationName: string, dateRange: { start: Date; end: Date }): Promise<PhotoMetrics> {
    return {
      merchantViews: this.generateMockMetricData(dateRange, 100, 500),
      customerViews: this.generateMockMetricData(dateRange, 200, 1000),
      merchantCount: 45,
      customerCount: 123,
      engagementRate: 12.8
    };
  }

  /**
   * Helper: Fetch top search queries
   */
  private async fetchTopSearchQueries(businessId: string, locationName: string): Promise<SearchQuery[]> {
    return [
      { query: 'restaurant near me', impressions: 5420, clicks: 432, ctr: 7.96, averagePosition: 2.3 },
      { query: 'best italian food', impressions: 3210, clicks: 298, ctr: 9.28, averagePosition: 1.8 },
      { query: 'pizza delivery', impressions: 2890, clicks: 245, ctr: 8.48, averagePosition: 3.1 },
      { query: 'lunch specials', impressions: 1560, clicks: 178, ctr: 11.41, averagePosition: 2.5 },
      { query: 'outdoor dining', impressions: 980, clicks: 89, ctr: 9.08, averagePosition: 4.2 }
    ];
  }

  /**
   * Helper: Fetch competitor metrics
   */
  private async fetchCompetitorMetrics(businessId: string, category: string): Promise<CompetitorMetrics> {
    // In a real implementation, this would aggregate data from similar businesses
    return {
      averageRating: 4.2,
      totalReviews: 156,
      responseRate: 65,
      photoCount: 38,
      marketShare: 18.5
    };
  }

  /**
   * Helper: Analyze trends
   */
  private analyzeTrends(queries: QueryMetrics, views: ViewMetrics, actions: ActionMetrics): TrendAnalysis {
    return {
      peakDays: ['Saturday', 'Sunday'],
      peakHours: [12, 13, 18, 19],
      seasonalPatterns: [
        { period: 'Weekend', impact: 'high', description: 'Traffic increases 40% on weekends' },
        { period: 'Summer', impact: 'medium', description: 'Seasonal boost in outdoor dining searches' }
      ],
      growthTrend: queries.growthRate > 0 ? 'increasing' : queries.growthRate < -5 ? 'declining' : 'stable',
      anomalies: []
    };
  }

  /**
   * Helper: Generate recommendations
   */
  private generateRecommendations(data: any): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // Check photo engagement
    if (data.photos.merchantCount < 20) {
      recommendations.push({
        category: 'content',
        priority: 'high',
        title: 'Add More Photos',
        description: 'Your business has fewer photos than 80% of similar businesses',
        potentialImpact: 'Could increase views by up to 30%',
        actionItems: [
          'Upload high-quality photos of your products/services',
          'Add photos of your team and workspace',
          'Include seasonal and event photos'
        ]
      });
    }

    // Check conversion rate
    if (data.actions.conversionRate < 5) {
      recommendations.push({
        category: 'conversion',
        priority: 'medium',
        title: 'Improve Call-to-Actions',
        description: 'Your conversion rate is below industry average',
        potentialImpact: 'Could increase customer actions by 20%',
        actionItems: [
          'Add clear business hours',
          'Enable messaging features',
          'Update your website link',
          'Add booking/ordering links'
        ]
      });
    }

    // Check response to reviews
    const reviewResponseRate = 75; // Mock value
    if (reviewResponseRate < 80) {
      recommendations.push({
        category: 'engagement',
        priority: 'high',
        title: 'Respond to More Reviews',
        description: 'Responding to reviews improves customer trust',
        potentialImpact: 'Can improve rating by 0.2-0.5 stars',
        actionItems: [
          'Respond to all reviews within 48 hours',
          'Thank customers for positive reviews',
          'Address concerns in negative reviews professionally'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Helper: Store insights in database
   */
  private async storeInsights(businessId: string, insights: LocationInsights): Promise<void> {
    // Store in database for historical tracking
    await storage.createGmbSyncHistory({
      businessId,
      syncType: 'insights_fetch',
      status: 'success',
      dataTypes: ['insights'],
      changes: {
        totalViews: insights.metrics.views.total,
        totalActions: insights.metrics.actions.total
      },
      errorDetails: null,
      itemsProcessed: 1,
      itemsUpdated: 1,
      itemsErrors: 0,
      durationMs: null,
      triggeredBy: 'manual',
      gmbApiVersion: 'v4.9'
    });
  }

  /**
   * Helper: Parse metric response from GMB API
   */
  private parseMetricResponse(response: any): MetricValue[] {
    const values: MetricValue[] = [];
    
    if (response.locationMetrics && response.locationMetrics[0]) {
      const metrics = response.locationMetrics[0].metricValues || [];
      
      metrics.forEach((metric: any) => {
        if (metric.dimensionalValues) {
          metric.dimensionalValues.forEach((dim: any) => {
            values.push({
              date: new Date(dim.timeDimension.timeRange.startTime),
              value: parseInt(dim.value) || 0
            });
          });
        }
      });
    }
    
    return values;
  }

  /**
   * Helper: Generate mock metric data
   */
  private generateMockMetricData(dateRange: { start: Date; end: Date }, min: number, max: number): MetricValue[] {
    const data: MetricValue[] = [];
    const currentDate = new Date(dateRange.start);
    
    while (currentDate <= dateRange.end) {
      data.push({
        date: new Date(currentDate),
        value: Math.floor(Math.random() * (max - min) + min),
        dayOfWeek: currentDate.getDay()
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  }

  /**
   * Helper: Calculate report summary
   */
  private calculateReportSummary(insights: LocationInsights): ReportSummary {
    const totalViews = insights.metrics.views.total;
    const totalActions = insights.metrics.actions.total;
    const conversionRate = insights.metrics.actions.conversionRate;
    
    // Calculate performance score (0-100)
    let performanceScore = 50;
    if (conversionRate > 10) performanceScore += 20;
    if (totalViews > 5000) performanceScore += 15;
    if (totalActions > 500) performanceScore += 15;
    
    return {
      highlights: [
        `${totalViews.toLocaleString()} total views this period`,
        `${conversionRate.toFixed(1)}% conversion rate`,
        `${insights.recommendations.length} recommendations for improvement`
      ],
      keyMetrics: {
        totalViews,
        totalActions,
        averageRating: 4.5, // Would come from review data
        conversionRate
      },
      performanceScore: Math.min(100, performanceScore),
      comparisonPeriod: {
        views: Math.floor(totalViews * 0.85),
        actions: Math.floor(totalActions * 0.82),
        change: 18.5
      }
    };
  }

  /**
   * Helper: Get date range for report type
   */
  private getDateRangeForReportType(reportType: 'daily' | 'weekly' | 'monthly' | 'custom'): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    
    switch (reportType) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
    }
    
    return { start, end };
  }

  /**
   * Helper: Export report to specified format
   */
  private async exportReport(report: InsightReport, format: 'pdf' | 'csv'): Promise<string> {
    // In a real implementation, generate and store the export file
    return `https://api.example.com/exports/${report.id}.${format}`;
  }

  /**
   * Helper: Group metrics by period
   */
  private groupMetricsByPeriod(data: MetricValue[], period: 'daily' | 'weekly' | 'monthly'): Array<{ period: string; value: number }> {
    const grouped = new Map<string, number>();
    
    data.forEach(metric => {
      let key: string;
      
      switch (period) {
        case 'daily':
          key = metric.date.toISOString().split('T')[0];
          break;
        case 'weekly':
          key = `${metric.date.getFullYear()}-W${Math.ceil(metric.date.getDate() / 7)}`;
          break;
        case 'monthly':
          key = `${metric.date.getFullYear()}-${String(metric.date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }
      
      grouped.set(key, (grouped.get(key) || 0) + metric.value);
    });
    
    return Array.from(grouped.entries()).map(([period, value]) => ({ period, value }));
  }

  /**
   * Helper: Calculate overall trend
   */
  private calculateOverallTrend(data: Array<{ change: number }>): 'improving' | 'stable' | 'declining' {
    const averageChange = data.reduce((sum, d) => sum + d.change, 0) / data.length;
    
    if (averageChange > 5) return 'improving';
    if (averageChange < -5) return 'declining';
    return 'stable';
  }

  /**
   * Helper: Generate forecast
   */
  private generateForecast(data: Array<{ period: string; value: number }>): Array<{ period: string; value: number; confidence: number }> {
    // Simple linear forecast
    const lastValue = data[data.length - 1]?.value || 0;
    const trend = (data[data.length - 1]?.value - data[0]?.value) / data.length;
    
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      forecast.push({
        period: `Forecast +${i}`,
        value: Math.round(lastValue + (trend * i)),
        confidence: Math.max(0.5, 1 - (i * 0.15))
      });
    }
    
    return forecast;
  }

  /**
   * Helper: Generate comparative insights
   */
  private generateComparativeInsights(locations: any[]): string[] {
    const insights: string[] = [];
    
    if (locations.length > 0) {
      const best = locations[0];
      const worst = locations[locations.length - 1];
      
      insights.push(`${best.name} has the highest conversion rate at ${best.metrics.conversionRate.toFixed(1)}%`);
      insights.push(`${worst.name} has opportunity for improvement with ${worst.metrics.conversionRate.toFixed(1)}% conversion`);
      
      const avgViews = locations.reduce((sum, loc) => sum + loc.metrics.views, 0) / locations.length;
      insights.push(`Average views across all locations: ${Math.round(avgViews).toLocaleString()}`);
    }
    
    return insights;
  }

  /**
   * Helper: Calculate next run time
   */
  private calculateNextRunTime(frequency: 'daily' | 'weekly' | 'monthly'): Date {
    const next = new Date();
    
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        next.setHours(9, 0, 0, 0);
        break;
      case 'weekly':
        next.setDate(next.getDate() + (8 - next.getDay()) % 7);
        next.setHours(9, 0, 0, 0);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(9, 0, 0, 0);
        break;
    }
    
    return next;
  }

  /**
   * Helper: Get cached data
   */
  private getCachedData(key: string): any | null {
    const cached = this.metricsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Helper: Set cached data
   */
  private setCachedData(key: string, data: any): void {
    this.metricsCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Export singleton instance
export const gmbInsightsService = new GMBInsightsService();