/**
 * Marketing Storage Layer
 *
 * Handles all database operations for marketing automation features:
 * - Campaigns (email, SMS)
 * - Customer segments
 * - Marketing workflows
 * - Lead capture forms
 */

import { db } from './db';
import {
  marketingCampaigns,
  campaignRecipients,
  campaignLinks,
  campaignClicks,
  customerSegments,
  segmentMembers,
  marketingWorkflows,
  workflowEnrollments,
  workflowStepLogs,
  leadCaptureForms,
  leadSubmissions,
  users,
  businesses,
  type MarketingCampaign,
  type InsertMarketingCampaign,
  type UpdateMarketingCampaign,
  type CampaignRecipient,
  type InsertCampaignRecipient,
  type UpdateCampaignRecipient,
  type CampaignLink,
  type InsertCampaignLink,
  type CampaignClick,
  type InsertCampaignClick,
  type CustomerSegment,
  type InsertCustomerSegment,
  type UpdateCustomerSegment,
  type SegmentMember,
  type InsertSegmentMember,
  type MarketingWorkflow,
  type InsertMarketingWorkflow,
  type UpdateMarketingWorkflow,
  type WorkflowEnrollment,
  type InsertWorkflowEnrollment,
  type UpdateWorkflowEnrollment,
  type WorkflowStepLog,
  type InsertWorkflowStepLog,
  type LeadCaptureForm,
  type InsertLeadCaptureForm,
  type UpdateLeadCaptureForm,
  type LeadSubmission,
  type InsertLeadSubmission,
  type UpdateLeadSubmission,
} from '../shared/schema';
import { eq, and, or, desc, sql, inArray, gt, lt, gte, lte } from 'drizzle-orm';

export class MarketingStorage {
  // ========================================
  // MARKETING CAMPAIGNS
  // ========================================

  /**
   * Get all campaigns for a business
   */
  async getMarketingCampaigns(businessId: string, filters?: any): Promise<MarketingCampaign[]> {
    const {
      status,
      type,
      limit = 50,
      offset = 0,
    } = filters || {};

    let query = db
      .select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.businessId, businessId))
      .$dynamic();

    // Apply filters
    const conditions = [];
    if (status) conditions.push(eq(marketingCampaigns.status, status));
    if (type) conditions.push(eq(marketingCampaigns.type, type));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query
      .orderBy(desc(marketingCampaigns.createdAt))
      .limit(limit)
      .offset(offset);

    return await query;
  }

  /**
   * Get a single campaign by ID
   */
  async getMarketingCampaign(id: string): Promise<MarketingCampaign | null> {
    const [campaign] = await db
      .select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, id))
      .limit(1);

    return campaign || null;
  }

  /**
   * Create a new marketing campaign
   */
  async createMarketingCampaign(data: InsertMarketingCampaign): Promise<MarketingCampaign> {
    const [campaign] = await db
      .insert(marketingCampaigns)
      .values(data)
      .returning();

    return campaign;
  }

  /**
   * Update a marketing campaign
   */
  async updateMarketingCampaign(id: string, data: UpdateMarketingCampaign): Promise<MarketingCampaign> {
    const [campaign] = await db
      .update(marketingCampaigns)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketingCampaigns.id, id))
      .returning();

    return campaign;
  }

  /**
   * Delete a marketing campaign
   */
  async deleteMarketingCampaign(id: string): Promise<void> {
    await db
      .delete(marketingCampaigns)
      .where(eq(marketingCampaigns.id, id));
  }

  /**
   * Mark campaign as sent
   */
  async markCampaignAsSent(id: string): Promise<void> {
    await db
      .update(marketingCampaigns)
      .set({
        status: 'active',
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(marketingCampaigns.id, id));
  }

  /**
   * Update campaign metrics
   */
  async updateCampaignMetrics(id: string, metrics: {
    sentCount?: number;
    deliveredCount?: number;
    openedCount?: number;
    clickedCount?: number;
    bouncedCount?: number;
    unsubscribedCount?: number;
  }): Promise<void> {
    const updates: any = { updatedAt: new Date() };

    // Build increment SQL for each metric
    if (metrics.sentCount !== undefined) {
      updates.sentCount = sql`${marketingCampaigns.sentCount} + ${metrics.sentCount}`;
    }
    if (metrics.deliveredCount !== undefined) {
      updates.deliveredCount = sql`${marketingCampaigns.deliveredCount} + ${metrics.deliveredCount}`;
    }
    if (metrics.openedCount !== undefined) {
      updates.openedCount = sql`${marketingCampaigns.openedCount} + ${metrics.openedCount}`;
    }
    if (metrics.clickedCount !== undefined) {
      updates.clickedCount = sql`${marketingCampaigns.clickedCount} + ${metrics.clickedCount}`;
    }
    if (metrics.bouncedCount !== undefined) {
      updates.bouncedCount = sql`${marketingCampaigns.bouncedCount} + ${metrics.bouncedCount}`;
    }
    if (metrics.unsubscribedCount !== undefined) {
      updates.unsubscribedCount = sql`${marketingCampaigns.unsubscribedCount} + ${metrics.unsubscribedCount}`;
    }

    await db
      .update(marketingCampaigns)
      .set(updates)
      .where(eq(marketingCampaigns.id, id));

    // Recalculate rates
    await this.recalculateCampaignRates(id);
  }

  /**
   * Recalculate campaign performance rates
   */
  private async recalculateCampaignRates(id: string): Promise<void> {
    const [campaign] = await db
      .select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, id))
      .limit(1);

    if (!campaign) return;

    const deliveryRate = campaign.sentCount > 0
      ? (campaign.deliveredCount / campaign.sentCount) * 100
      : 0;

    const openRate = campaign.deliveredCount > 0
      ? (campaign.openedCount / campaign.deliveredCount) * 100
      : 0;

    const clickRate = campaign.deliveredCount > 0
      ? (campaign.clickedCount / campaign.deliveredCount) * 100
      : 0;

    await db
      .update(marketingCampaigns)
      .set({
        deliveryRate: deliveryRate.toFixed(2),
        openRate: openRate.toFixed(2),
        clickRate: clickRate.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(marketingCampaigns.id, id));
  }

  // ========================================
  // CAMPAIGN RECIPIENTS
  // ========================================

  /**
   * Get all recipients for a campaign
   */
  async getCampaignRecipients(campaignId: string, filters?: any): Promise<CampaignRecipient[]> {
    const { status, limit = 100, offset = 0 } = filters || {};

    let query = db
      .select()
      .from(campaignRecipients)
      .where(eq(campaignRecipients.campaignId, campaignId))
      .$dynamic();

    if (status) {
      query = query.where(eq(campaignRecipients.status, status));
    }

    query = query.limit(limit).offset(offset);

    return await query;
  }

  /**
   * Create campaign recipients (bulk)
   */
  async createCampaignRecipients(recipients: InsertCampaignRecipient[]): Promise<CampaignRecipient[]> {
    if (recipients.length === 0) return [];

    return await db
      .insert(campaignRecipients)
      .values(recipients)
      .returning();
  }

  /**
   * Update campaign recipient status
   */
  async updateCampaignRecipient(id: string, data: UpdateCampaignRecipient): Promise<CampaignRecipient> {
    const [recipient] = await db
      .update(campaignRecipients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(campaignRecipients.id, id))
      .returning();

    return recipient;
  }

  /**
   * Track email open
   */
  async trackEmailOpen(recipientId: string): Promise<void> {
    const [recipient] = await db
      .select()
      .from(campaignRecipients)
      .where(eq(campaignRecipients.id, recipientId))
      .limit(1);

    if (!recipient) return;

    // Update recipient
    await db
      .update(campaignRecipients)
      .set({
        status: 'opened',
        openCount: sql`${campaignRecipients.openCount} + 1`,
        lastOpenedAt: new Date(),
        openedAt: recipient.openedAt || new Date(), // Only set first time
        updatedAt: new Date(),
      })
      .where(eq(campaignRecipients.id, recipientId));

    // Update campaign metrics
    if (!recipient.openedAt) {
      // First open - increment campaign opened count
      await this.updateCampaignMetrics(recipient.campaignId, { openedCount: 1 });
    }
  }

  // ========================================
  // CAMPAIGN LINKS & CLICKS
  // ========================================

  /**
   * Create a campaign link
   */
  async createCampaignLink(data: InsertCampaignLink): Promise<CampaignLink> {
    const [link] = await db
      .insert(campaignLinks)
      .values(data)
      .returning();

    return link;
  }

  /**
   * Get campaign link by short code
   */
  async getCampaignLinkByShortCode(shortCode: string): Promise<CampaignLink | null> {
    const [link] = await db
      .select()
      .from(campaignLinks)
      .where(eq(campaignLinks.shortCode, shortCode))
      .limit(1);

    return link || null;
  }

  /**
   * Track link click
   */
  async trackLinkClick(data: InsertCampaignClick): Promise<void> {
    // Insert click record
    await db.insert(campaignClicks).values(data);

    // Update link click counts
    await db
      .update(campaignLinks)
      .set({
        clickCount: sql`${campaignLinks.clickCount} + 1`,
      })
      .where(eq(campaignLinks.id, data.linkId));

    // Update recipient click status
    const [recipient] = await db
      .select()
      .from(campaignRecipients)
      .where(eq(campaignRecipients.id, data.recipientId))
      .limit(1);

    if (recipient) {
      await db
        .update(campaignRecipients)
        .set({
          status: 'clicked',
          clickCount: sql`${campaignRecipients.clickCount} + 1`,
          lastClickedAt: new Date(),
          firstClickedAt: recipient.firstClickedAt || new Date(),
          updatedAt: new Date(),
        })
        .where(eq(campaignRecipients.id, data.recipientId));

      // Update campaign metrics (first click only)
      if (!recipient.firstClickedAt) {
        await this.updateCampaignMetrics(data.campaignId, { clickedCount: 1 });
      }
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<any> {
    // Get campaign with basic metrics
    const [campaign] = await db
      .select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, campaignId))
      .limit(1);

    if (!campaign) return null;

    // Get link performance
    const links = await db
      .select()
      .from(campaignLinks)
      .where(eq(campaignLinks.campaignId, campaignId))
      .orderBy(desc(campaignLinks.clickCount));

    // Get geographic data from clicks
    const clickData = await db
      .select({
        country: campaignClicks.country,
        city: campaignClicks.city,
        deviceType: campaignClicks.deviceType,
        browser: campaignClicks.browser,
      })
      .from(campaignClicks)
      .where(eq(campaignClicks.campaignId, campaignId));

    // Aggregate geographic data
    const geographicData: Record<string, number> = {};
    const deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
    const browserBreakdown: Record<string, number> = {};

    for (const click of clickData) {
      if (click.country) {
        geographicData[click.country] = (geographicData[click.country] || 0) + 1;
      }

      if (click.deviceType) {
        if (click.deviceType in deviceBreakdown) {
          deviceBreakdown[click.deviceType as keyof typeof deviceBreakdown]++;
        } else {
          deviceBreakdown.unknown++;
        }
      }

      if (click.browser) {
        browserBreakdown[click.browser] = (browserBreakdown[click.browser] || 0) + 1;
      }
    }

    return {
      campaign,
      links: links.map(link => ({
        url: link.originalUrl,
        clicks: link.clickCount,
        uniqueClicks: link.uniqueClickCount,
      })),
      geographicData: Object.entries(geographicData).map(([country, count]) => ({
        country,
        count,
      })),
      deviceBreakdown,
      browserBreakdown: Object.entries(browserBreakdown).map(([browser, count]) => ({
        browser,
        count,
      })),
    };
  }

  // ========================================
  // CUSTOMER SEGMENTS
  // ========================================

  /**
   * Get all segments for a business
   */
  async getCustomerSegments(businessId: string): Promise<CustomerSegment[]> {
    return await db
      .select()
      .from(customerSegments)
      .where(and(
        eq(customerSegments.businessId, businessId),
        eq(customerSegments.isActive, true)
      ))
      .orderBy(desc(customerSegments.createdAt));
  }

  /**
   * Get a single segment
   */
  async getCustomerSegment(id: string): Promise<CustomerSegment | null> {
    const [segment] = await db
      .select()
      .from(customerSegments)
      .where(eq(customerSegments.id, id))
      .limit(1);

    return segment || null;
  }

  /**
   * Create a customer segment
   */
  async createCustomerSegment(data: InsertCustomerSegment): Promise<CustomerSegment> {
    const [segment] = await db
      .insert(customerSegments)
      .values(data)
      .returning();

    return segment;
  }

  /**
   * Update a customer segment
   */
  async updateCustomerSegment(id: string, data: UpdateCustomerSegment): Promise<CustomerSegment> {
    const [segment] = await db
      .update(customerSegments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customerSegments.id, id))
      .returning();

    return segment;
  }

  /**
   * Delete a customer segment
   */
  async deleteCustomerSegment(id: string): Promise<void> {
    await db
      .delete(customerSegments)
      .where(eq(customerSegments.id, id));
  }

  /**
   * Calculate segment members based on criteria
   *
   * This evaluates the segment's criteria rules and returns matching user IDs
   */
  async calculateSegmentMembers(segmentId: string): Promise<string[]> {
    const segment = await this.getCustomerSegment(segmentId);
    if (!segment || !segment.criteria) return [];

    const criteria = segment.criteria as any;
    const rules = criteria.rules || [];
    const logic = criteria.logic || 'AND';

    if (rules.length === 0) {
      return [];
    }

    try {
      // Build WHERE conditions for each rule
      const conditions: any[] = [];
      
      for (const rule of rules) {
        const { field, operator, value } = rule;
        
        // Map field names to database columns
        const fieldMap: Record<string, any> = {
          'email': users.email,
          'firstName': users.firstName,
          'lastName': users.lastName,
          'phoneNumber': users.phoneNumber,
          'createdAt': users.createdAt,
          'lastActive': users.lastActive,
          'emailVerified': users.emailVerified,
          'role': users.role,
          'totalSpent': sql`(SELECT COALESCE(SUM(amount), 0) FROM orders WHERE user_id = ${users.id})`,
          'orderCount': sql`(SELECT COUNT(*) FROM orders WHERE user_id = ${users.id})`,
          'lastOrderDate': sql`(SELECT MAX(created_at) FROM orders WHERE user_id = ${users.id})`,
        };
        
        const column = fieldMap[field];
        if (!column) {
          console.warn(`Unknown field in segment rule: ${field}`);
          continue;
        }
        
        // Build condition based on operator
        let condition;
        switch (operator) {
          case 'equals':
          case '=':
            condition = eq(column, value);
            break;
          case 'not_equals':
          case '!=':
            condition = sql`${column} != ${value}`;
            break;
          case 'contains':
            condition = sql`${column} LIKE ${'%' + value + '%'}`;
            break;
          case 'not_contains':
            condition = sql`${column} NOT LIKE ${'%' + value + '%'}`;
            break;
          case 'starts_with':
            condition = sql`${column} LIKE ${value + '%'}`;
            break;
          case 'ends_with':
            condition = sql`${column} LIKE ${'%' + value}`;
            break;
          case 'greater_than':
          case '>':
            condition = gt(column, value);
            break;
          case 'less_than':
          case '<':
            condition = lt(column, value);
            break;
          case 'greater_or_equal':
          case '>=':
            condition = gte(column, value);
            break;
          case 'less_or_equal':
          case '<=':
            condition = lte(column, value);
            break;
          case 'is_empty':
            condition = or(eq(column, ''), sql`${column} IS NULL`);
            break;
          case 'is_not_empty':
            condition = and(sql`${column} != ''`, sql`${column} IS NOT NULL`);
            break;
          case 'in':
            const values = Array.isArray(value) ? value : [value];
            condition = inArray(column, values);
            break;
          case 'not_in':
            const notValues = Array.isArray(value) ? value : [value];
            condition = sql`${column} NOT IN (${sql.join(notValues.map(v => sql`${v}`), sql`, `)})`;
            break;
          default:
            console.warn(`Unknown operator in segment rule: ${operator}`);
            continue;
        }
        
        if (condition) {
          conditions.push(condition);
        }
      }
      
      if (conditions.length === 0) {
        return [];
      }
      
      // Combine conditions with AND/OR logic
      const whereClause = logic === 'OR' ? or(...conditions) : and(...conditions);
      
      // Execute query to get matching user IDs
      const matchingUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(whereClause)
        .limit(10000); // Limit to prevent memory issues
      
      const userIds = matchingUsers.map(u => u.id);
      
      console.log(`Calculated segment ${segmentId}: ${userIds.length} members found`);
      return userIds;
    } catch (error) {
      console.error(`Error calculating segment members for ${segmentId}:`, error);
      return [];
    }
  }

  /**
   * Add members to a segment
   */
  async addSegmentMembers(segmentId: string, userIds: string[], source: string = 'automatic'): Promise<void> {
    const members: InsertSegmentMember[] = userIds.map(userId => ({
      segmentId,
      userId,
      source,
    }));

    // Insert, ignoring duplicates
    try {
      await db.insert(segmentMembers).values(members);

      // Update segment member count
      await db
        .update(customerSegments)
        .set({
          memberCount: sql`${customerSegments.memberCount} + ${userIds.length}`,
          lastCalculatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(customerSegments.id, segmentId));
    } catch (error) {
      // Ignore duplicate key errors
      console.error('Error adding segment members:', error);
    }
  }

  /**
   * Get segment members
   */
  async getSegmentMembers(segmentId: string, limit: number = 100, offset: number = 0): Promise<any[]> {
    return await db
      .select({
        member: segmentMembers,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phoneNumber: users.phoneNumber,
        },
      })
      .from(segmentMembers)
      .leftJoin(users, eq(segmentMembers.userId, users.id))
      .where(eq(segmentMembers.segmentId, segmentId))
      .limit(limit)
      .offset(offset);
  }

  // ========================================
  // MARKETING WORKFLOWS
  // ========================================

  /**
   * Get all workflows for a business
   */
  async getMarketingWorkflows(businessId: string): Promise<MarketingWorkflow[]> {
    return await db
      .select()
      .from(marketingWorkflows)
      .where(eq(marketingWorkflows.businessId, businessId))
      .orderBy(desc(marketingWorkflows.createdAt));
  }

  /**
   * Get a single workflow
   */
  async getMarketingWorkflow(id: string): Promise<MarketingWorkflow | null> {
    const [workflow] = await db
      .select()
      .from(marketingWorkflows)
      .where(eq(marketingWorkflows.id, id))
      .limit(1);

    return workflow || null;
  }

  /**
   * Create a marketing workflow
   */
  async createMarketingWorkflow(data: InsertMarketingWorkflow): Promise<MarketingWorkflow> {
    const [workflow] = await db
      .insert(marketingWorkflows)
      .values(data)
      .returning();

    return workflow;
  }

  /**
   * Update a marketing workflow
   */
  async updateMarketingWorkflow(id: string, data: UpdateMarketingWorkflow): Promise<MarketingWorkflow> {
    const [workflow] = await db
      .update(marketingWorkflows)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketingWorkflows.id, id))
      .returning();

    return workflow;
  }

  /**
   * Delete a marketing workflow
   */
  async deleteMarketingWorkflow(id: string): Promise<void> {
    await db
      .delete(marketingWorkflows)
      .where(eq(marketingWorkflows.id, id));
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(id: string): Promise<void> {
    await db
      .update(marketingWorkflows)
      .set({
        status: 'active',
        activatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(marketingWorkflows.id, id));
  }

  /**
   * Pause a workflow
   */
  async pauseWorkflow(id: string): Promise<void> {
    await db
      .update(marketingWorkflows)
      .set({
        status: 'paused',
        updatedAt: new Date(),
      })
      .where(eq(marketingWorkflows.id, id));
  }

  /**
   * Enroll a user in a workflow
   */
  async enrollInWorkflow(data: InsertWorkflowEnrollment): Promise<WorkflowEnrollment> {
    const [enrollment] = await db
      .insert(workflowEnrollments)
      .values(data)
      .returning();

    // Increment workflow enrollment count
    await db
      .update(marketingWorkflows)
      .set({
        totalEnrolled: sql`${marketingWorkflows.totalEnrolled} + 1`,
        activeEnrollments: sql`${marketingWorkflows.activeEnrollments} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(marketingWorkflows.id, data.workflowId));

    return enrollment;
  }

  /**
   * Get workflow enrollments
   */
  async getWorkflowEnrollments(workflowId: string, filters?: any): Promise<any[]> {
    const { status, limit = 100, offset = 0 } = filters || {};

    let query = db
      .select({
        enrollment: workflowEnrollments,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(workflowEnrollments)
      .leftJoin(users, eq(workflowEnrollments.userId, users.id))
      .where(eq(workflowEnrollments.workflowId, workflowId))
      .$dynamic();

    if (status) {
      query = query.where(eq(workflowEnrollments.status, status));
    }

    query = query
      .orderBy(desc(workflowEnrollments.enrolledAt))
      .limit(limit)
      .offset(offset);

    return await query;
  }

  /**
   * Update workflow enrollment
   */
  async updateWorkflowEnrollment(id: string, data: UpdateWorkflowEnrollment): Promise<WorkflowEnrollment> {
    const [enrollment] = await db
      .update(workflowEnrollments)
      .set(data)
      .where(eq(workflowEnrollments.id, id))
      .returning();

    return enrollment;
  }

  /**
   * Complete workflow enrollment
   */
  async completeWorkflowEnrollment(id: string): Promise<void> {
    const [enrollment] = await db
      .select()
      .from(workflowEnrollments)
      .where(eq(workflowEnrollments.id, id))
      .limit(1);

    if (!enrollment) return;

    await db
      .update(workflowEnrollments)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(workflowEnrollments.id, id));

    // Update workflow metrics
    await db
      .update(marketingWorkflows)
      .set({
        activeEnrollments: sql`${marketingWorkflows.activeEnrollments} - 1`,
        completedEnrollments: sql`${marketingWorkflows.completedEnrollments} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(marketingWorkflows.id, enrollment.workflowId));
  }

  /**
   * Log workflow step execution
   */
  async logWorkflowStep(data: InsertWorkflowStepLog): Promise<WorkflowStepLog> {
    const [log] = await db
      .insert(workflowStepLogs)
      .values(data)
      .returning();

    return log;
  }

  /**
   * Update workflow step log
   */
  async updateWorkflowStepLog(id: string, data: Partial<InsertWorkflowStepLog>): Promise<void> {
    await db
      .update(workflowStepLogs)
      .set(data)
      .where(eq(workflowStepLogs.id, id));
  }

  /**
   * Get workflow step logs for an enrollment
   */
  async getWorkflowStepLogs(enrollmentId: string): Promise<WorkflowStepLog[]> {
    return await db
      .select()
      .from(workflowStepLogs)
      .where(eq(workflowStepLogs.enrollmentId, enrollmentId))
      .orderBy(workflowStepLogs.startedAt);
  }

  // ========================================
  // LEAD CAPTURE FORMS
  // ========================================

  /**
   * Get all forms for a business
   */
  async getLeadCaptureForms(businessId: string): Promise<LeadCaptureForm[]> {
    return await db
      .select()
      .from(leadCaptureForms)
      .where(eq(leadCaptureForms.businessId, businessId))
      .orderBy(desc(leadCaptureForms.createdAt));
  }

  /**
   * Get a single form
   */
  async getLeadCaptureForm(id: string): Promise<LeadCaptureForm | null> {
    const [form] = await db
      .select()
      .from(leadCaptureForms)
      .where(eq(leadCaptureForms.id, id))
      .limit(1);

    return form || null;
  }

  /**
   * Create a lead capture form
   */
  async createLeadCaptureForm(data: InsertLeadCaptureForm): Promise<LeadCaptureForm> {
    const [form] = await db
      .insert(leadCaptureForms)
      .values(data)
      .returning();

    return form;
  }

  /**
   * Update a lead capture form
   */
  async updateLeadCaptureForm(id: string, data: UpdateLeadCaptureForm): Promise<LeadCaptureForm> {
    const [form] = await db
      .update(leadCaptureForms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leadCaptureForms.id, id))
      .returning();

    return form;
  }

  /**
   * Delete a lead capture form
   */
  async deleteLeadCaptureForm(id: string): Promise<void> {
    await db
      .delete(leadCaptureForms)
      .where(eq(leadCaptureForms.id, id));
  }

  /**
   * Submit a lead capture form
   */
  async submitLeadForm(data: InsertLeadSubmission): Promise<LeadSubmission> {
    const [submission] = await db
      .insert(leadSubmissions)
      .values(data)
      .returning();

    // Increment form submission count
    await db
      .update(leadCaptureForms)
      .set({
        submissionCount: sql`${leadCaptureForms.submissionCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(leadCaptureForms.id, data.formId));

    return submission;
  }

  /**
   * Get lead submissions for a form
   */
  async getLeadSubmissions(formId: string, filters?: any): Promise<LeadSubmission[]> {
    const { status, limit = 100, offset = 0 } = filters || {};

    let query = db
      .select()
      .from(leadSubmissions)
      .where(eq(leadSubmissions.formId, formId))
      .$dynamic();

    if (status) {
      query = query.where(eq(leadSubmissions.status, status));
    }

    query = query
      .orderBy(desc(leadSubmissions.submittedAt))
      .limit(limit)
      .offset(offset);

    return await query;
  }

  /**
   * Update lead submission status
   */
  async updateLeadSubmission(id: string, data: UpdateLeadSubmission): Promise<LeadSubmission> {
    const [submission] = await db
      .update(leadSubmissions)
      .set(data)
      .where(eq(leadSubmissions.id, id))
      .returning();

    return submission;
  }

  // ========================================
  // ADMIN METHODS
  // ========================================

  /**
   * Get all campaigns across all businesses (admin only)
   */
  async getAllCampaigns(filters?: { limit?: number; offset?: number }): Promise<MarketingCampaign[]> {
    const { limit = 100, offset = 0 } = filters || {};

    return await db
      .select()
      .from(marketingCampaigns)
      .orderBy(desc(marketingCampaigns.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get all segments across all businesses (admin only)
   */
  async getAllSegments(filters?: { limit?: number; offset?: number }): Promise<CustomerSegment[]> {
    const { limit = 100, offset = 0 } = filters || {};

    return await db
      .select()
      .from(customerSegments)
      .orderBy(desc(customerSegments.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  // ========================================
  // SMS OPT-OUT TRACKING
  // ========================================
  
  /**
   * Check if phone number is opted out of SMS
   */
  async isSMSOptedOut(phoneNumber: string): Promise<boolean> {
    try {
      // Check if there's a user with this phone number who has opted out
      const [user] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.phoneNumber, phoneNumber),
          eq(users.smsOptOut, true)
        ))
        .limit(1);
      
      return !!user;
    } catch (error) {
      console.error('Error checking SMS opt-out status:', error);
      // Default to not opted out if there's an error
      return false;
    }
  }
  
  /**
   * Mark phone number as opted out of SMS
   */
  async markSMSOptedOut(phoneNumber: string): Promise<void> {
    try {
      // Update all users with this phone number
      await db
        .update(users)
        .set({
          smsOptOut: true,
          smsOptOutDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.phoneNumber, phoneNumber));
      
      console.log(`📱 Marked ${phoneNumber} as opted out of SMS`);
      
      // Also update any campaign recipients with this phone
      await db
        .update(campaignRecipients)
        .set({
          status: 'unsubscribed',
          unsubscribedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(campaignRecipients.phone, phoneNumber),
          sql`${campaignRecipients.status} != 'unsubscribed'`
        ));
    } catch (error) {
      console.error('Error marking SMS opt-out:', error);
    }
  }
  
  /**
   * Mark phone number as opted in to SMS (resubscribe)
   */
  async markSMSOptedIn(phoneNumber: string): Promise<void> {
    try {
      // Update all users with this phone number
      await db
        .update(users)
        .set({
          smsOptOut: false,
          smsOptOutDate: null,
          updatedAt: new Date(),
        })
        .where(eq(users.phoneNumber, phoneNumber));
      
      console.log(`📱 Marked ${phoneNumber} as opted in to SMS`);
    } catch (error) {
      console.error('Error marking SMS opt-in:', error);
    }
  }
  
  /**
   * Get all opted-out phone numbers
   */
  async getOptedOutPhoneNumbers(): Promise<string[]> {
    try {
      const optedOut = await db
        .select({ phoneNumber: users.phoneNumber })
        .from(users)
        .where(and(
          sql`${users.phoneNumber} IS NOT NULL`,
          eq(users.smsOptOut, true)
        ));
      
      return optedOut.map(u => u.phoneNumber).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error getting opted-out phone numbers:', error);
      return [];
    }
  }
  
  /**
   * Send email with tracking (integrates with email service)
   */
  async sendEmail(campaign: MarketingCampaign, recipient: CampaignRecipient): Promise<boolean> {
    try {
      const { emailService } = await import('./emailService');
      
      // Prepare email options
      const emailOptions = {
        to: {
          email: recipient.email,
          firstName: recipient.firstName || undefined,
          lastName: recipient.lastName || undefined,
        },
        from: {
          email: campaign.fromEmail || 'noreply@example.com',
          name: campaign.fromName || 'Marketing Team',
        },
        subject: campaign.subject || 'Marketing Message',
        html: campaign.content || '',
        text: campaign.textContent || undefined,
        replyTo: campaign.replyTo || undefined,
        trackOpens: true,
        trackClicks: true,
        campaignId: campaign.id,
        recipientId: recipient.id,
        testMode: campaign.status === 'draft',
      };
      
      // Send the email
      const result = await emailService.sendEmail(emailOptions);
      
      if (result.success) {
        // Update recipient status
        await this.updateCampaignRecipient(recipient.id, {
          status: 'sent',
          sentAt: new Date(),
          messageId: result.messageId,
        });
        
        // Update campaign metrics
        await this.updateCampaignMetrics(campaign.id, { sentCount: 1 });
        
        return true;
      } else {
        // Update recipient with error
        await this.updateCampaignRecipient(recipient.id, {
          status: 'failed',
          failedAt: new Date(),
          failureReason: result.error,
        });
        
        return false;
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}

// Export singleton instance
export const marketingStorage = new MarketingStorage();
