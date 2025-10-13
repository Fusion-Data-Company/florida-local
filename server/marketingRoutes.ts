/**
 * Marketing Automation Routes
 *
 * API endpoints for:
 * - Marketing campaigns (email/SMS)
 * - Customer segments
 * - Marketing workflows
 * - Lead capture forms
 * - Tracking (opens, clicks)
 */

import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { marketingStorage } from './marketingStorage';
import { emailService } from './emailService';
import { smsService } from './smsService';

// Middleware for authentication (assumes you have this from previous phases)
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Middleware for business ownership verification
const verifyBusinessOwnership = async (req: Request, res: Response, next: Function) => {
  // TODO: Implement actual business ownership check
  // For now, just check if user is authenticated
  if (!req.user) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Rate limiting helper
const RATE_LIMITS = {
  campaigns: 100,
  segments: 50,
  workflows: 50,
  forms: 100,
};

export function registerMarketingRoutes(app: Express) {
  // ========================================
  // MARKETING CAMPAIGNS
  // ========================================

  /**
   * GET /api/marketing/campaigns
   * List all campaigns for a business
   */
  app.get('/api/marketing/campaigns', requireAuth, async (req: Request, res: Response) => {
    try {
      const { businessId, status, type, limit, offset } = req.query;

      if (!businessId) {
        return res.status(400).json({ error: 'businessId is required' });
      }

      const campaigns = await marketingStorage.getMarketingCampaigns(
        businessId as string,
        { status, type, limit: Number(limit) || 50, offset: Number(offset) || 0 }
      );

      res.json(campaigns);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/marketing/campaigns/:id
   * Get a single campaign by ID
   */
  app.get('/api/marketing/campaigns/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const campaign = await marketingStorage.getMarketingCampaign(id);

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      res.json(campaign);
    } catch (error: any) {
      console.error('Error fetching campaign:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/marketing/campaigns
   * Create a new marketing campaign
   */
  app.post('/api/marketing/campaigns', requireAuth, async (req: Request, res: Response) => {
    try {
      const campaignSchema = z.object({
        businessId: z.string().uuid(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        type: z.enum(['email', 'sms', 'push', 'multi-channel']),
        subject: z.string().max(255).optional(),
        preheaderText: z.string().max(150).optional(),
        senderName: z.string().max(100).optional(),
        senderEmail: z.string().email().optional(),
        senderPhone: z.string().max(20).optional(),
        content: z.string(),
        plainTextContent: z.string().optional(),
        targetSegmentId: z.string().uuid().optional(),
        scheduledAt: z.string().datetime().optional(),
        trackOpens: z.boolean().optional(),
        trackClicks: z.boolean().optional(),
      });

      const data = campaignSchema.parse(req.body);
      const campaign = await marketingStorage.createMarketingCampaign(data as any);

      res.status(201).json(campaign);
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PUT /api/marketing/campaigns/:id
   * Update a marketing campaign
   */
  app.put('/api/marketing/campaigns/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const campaign = await marketingStorage.updateMarketingCampaign(id, req.body);

      res.json(campaign);
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/marketing/campaigns/:id
   * Delete a marketing campaign
   */
  app.delete('/api/marketing/campaigns/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await marketingStorage.deleteMarketingCampaign(id);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/marketing/campaigns/:id/send
   * Send a campaign immediately
   */
  app.post('/api/marketing/campaigns/:id/send', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { testMode = false } = req.body;

      const campaign = await marketingStorage.getMarketingCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Get recipients
      let recipients;
      if (campaign.targetSegmentId) {
        const segmentMembers = await marketingStorage.getSegmentMembers(campaign.targetSegmentId, 10000, 0);
        recipients = segmentMembers.map(m => m.user);
      } else {
        // TODO: Get all customers for business
        recipients = [];
      }

      // Create campaign recipients
      const campaignRecipients = recipients.map(user => ({
        campaignId: id,
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }));

      await marketingStorage.createCampaignRecipients(campaignRecipients as any);

      // Send based on campaign type
      if (campaign.type === 'email') {
        const emails = campaignRecipients.map(recipient => ({
          to: {
            email: recipient.email!,
            firstName: recipient.firstName,
            lastName: recipient.lastName,
          },
          from: {
            email: campaign.senderEmail || 'noreply@floridalocalelite.com',
            name: campaign.senderName || 'Florida Local Elite',
          },
          subject: campaign.subject || 'No subject',
          html: campaign.content,
          text: campaign.plainTextContent,
          trackOpens: campaign.trackOpens,
          trackClicks: campaign.trackClicks,
          campaignId: id,
          testMode,
        }));

        const result = await emailService.sendBulkEmails(emails);

        // Update campaign metrics
        await marketingStorage.updateCampaignMetrics(id, {
          sentCount: result.totalSent,
        });

        await marketingStorage.markCampaignAsSent(id);

        res.json({ success: true, sent: result.totalSent, failed: result.totalFailed });
      } else if (campaign.type === 'sms') {
        const messages = campaignRecipients.map(recipient => ({
          to: {
            phone: recipient.email!, // TODO: Use actual phone number
            firstName: recipient.firstName,
            lastName: recipient.lastName,
          },
          from: campaign.senderPhone || '',
          message: campaign.content,
          campaignId: id,
          testMode,
        }));

        const result = await smsService.sendBulkSMS(messages);

        await marketingStorage.updateCampaignMetrics(id, {
          sentCount: result.totalSent,
        });

        await marketingStorage.markCampaignAsSent(id);

        res.json({ success: true, sent: result.totalSent, failed: result.totalFailed });
      } else {
        res.status(400).json({ error: 'Unsupported campaign type' });
      }
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/marketing/campaigns/:id/test
   * Send a test campaign to specific email/phone
   */
  app.post('/api/marketing/campaigns/:id/test', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { email, phone } = req.body;

      const campaign = await marketingStorage.getMarketingCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.type === 'email' && email) {
        const result = await emailService.sendEmail({
          to: { email },
          from: {
            email: campaign.senderEmail || 'noreply@floridalocalelite.com',
            name: campaign.senderName || 'Florida Local Elite',
          },
          subject: `[TEST] ${campaign.subject}`,
          html: campaign.content,
          text: campaign.plainTextContent,
          testMode: false,
        });

        res.json({ success: result.success, messageId: result.messageId });
      } else if (campaign.type === 'sms' && phone) {
        const result = await smsService.sendSMS({
          to: { phone },
          from: campaign.senderPhone || '',
          message: `[TEST] ${campaign.content}`,
          testMode: false,
        });

        res.json({ success: result.success, messageId: result.messageId });
      } else {
        res.status(400).json({ error: 'Invalid test parameters' });
      }
    } catch (error: any) {
      console.error('Error sending test campaign:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/marketing/campaigns/:id/recipients
   * Get all recipients for a campaign
   */
  app.get('/api/marketing/campaigns/:id/recipients', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, limit, offset } = req.query;

      const recipients = await marketingStorage.getCampaignRecipients(id, {
        status,
        limit: Number(limit) || 100,
        offset: Number(offset) || 0,
      });

      res.json(recipients);
    } catch (error: any) {
      console.error('Error fetching recipients:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/marketing/campaigns/:id/analytics
   * Get campaign analytics
   */
  app.get('/api/marketing/campaigns/:id/analytics', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const analytics = await marketingStorage.getCampaignAnalytics(id);

      if (!analytics) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      res.json(analytics);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/marketing/campaigns/:id/duplicate
   * Duplicate a campaign
   */
  app.post('/api/marketing/campaigns/:id/duplicate', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const campaign = await marketingStorage.getMarketingCampaign(id);

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const newCampaign = await marketingStorage.createMarketingCampaign({
        ...campaign,
        id: undefined,
        name: `${campaign.name} (Copy)`,
        status: 'draft',
        sentAt: null,
        completedAt: null,
        sentCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        bouncedCount: 0,
        unsubscribedCount: 0,
      } as any);

      res.status(201).json(newCampaign);
    } catch (error: any) {
      console.error('Error duplicating campaign:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========================================
  // CUSTOMER SEGMENTS
  // ========================================

  /**
   * GET /api/marketing/segments
   * List all segments for a business
   */
  app.get('/api/marketing/segments', requireAuth, async (req: Request, res: Response) => {
    try {
      const { businessId } = req.query;

      if (!businessId) {
        return res.status(400).json({ error: 'businessId is required' });
      }

      const segments = await marketingStorage.getCustomerSegments(businessId as string);
      res.json(segments);
    } catch (error: any) {
      console.error('Error fetching segments:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/marketing/segments/:id
   * Get a single segment
   */
  app.get('/api/marketing/segments/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const segment = await marketingStorage.getCustomerSegment(id);

      if (!segment) {
        return res.status(404).json({ error: 'Segment not found' });
      }

      res.json(segment);
    } catch (error: any) {
      console.error('Error fetching segment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/marketing/segments
   * Create a new customer segment
   */
  app.post('/api/marketing/segments', requireAuth, async (req: Request, res: Response) => {
    try {
      const segmentSchema = z.object({
        businessId: z.string().uuid(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        criteria: z.any(), // JSON object
        autoUpdate: z.boolean().optional(),
      });

      const data = segmentSchema.parse(req.body);
      const segment = await marketingStorage.createCustomerSegment(data as any);

      // Calculate initial members
      const memberIds = await marketingStorage.calculateSegmentMembers(segment.id);
      if (memberIds.length > 0) {
        await marketingStorage.addSegmentMembers(segment.id, memberIds, 'automatic');
      }

      res.status(201).json(segment);
    } catch (error: any) {
      console.error('Error creating segment:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PUT /api/marketing/segments/:id
   * Update a customer segment
   */
  app.put('/api/marketing/segments/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const segment = await marketingStorage.updateCustomerSegment(id, req.body);

      res.json(segment);
    } catch (error: any) {
      console.error('Error updating segment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/marketing/segments/:id
   * Delete a customer segment
   */
  app.delete('/api/marketing/segments/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await marketingStorage.deleteCustomerSegment(id);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting segment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/marketing/segments/:id/members
   * Get all members of a segment
   */
  app.get('/api/marketing/segments/:id/members', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;

      const members = await marketingStorage.getSegmentMembers(
        id,
        Number(limit) || 100,
        Number(offset) || 0
      );

      res.json(members);
    } catch (error: any) {
      console.error('Error fetching segment members:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/marketing/segments/:id/calculate
   * Recalculate segment members based on criteria
   */
  app.post('/api/marketing/segments/:id/calculate', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const memberIds = await marketingStorage.calculateSegmentMembers(id);
      if (memberIds.length > 0) {
        await marketingStorage.addSegmentMembers(id, memberIds, 'automatic');
      }

      res.json({ success: true, memberCount: memberIds.length });
    } catch (error: any) {
      console.error('Error calculating segment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========================================
  // MARKETING WORKFLOWS
  // ========================================

  /**
   * GET /api/marketing/workflows
   * List all workflows for a business
   */
  app.get('/api/marketing/workflows', requireAuth, async (req: Request, res: Response) => {
    try {
      const { businessId } = req.query;

      if (!businessId) {
        return res.status(400).json({ error: 'businessId is required' });
      }

      const workflows = await marketingStorage.getMarketingWorkflows(businessId as string);
      res.json(workflows);
    } catch (error: any) {
      console.error('Error fetching workflows:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/marketing/workflows/:id
   * Get a single workflow
   */
  app.get('/api/marketing/workflows/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const workflow = await marketingStorage.getMarketingWorkflow(id);

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      res.json(workflow);
    } catch (error: any) {
      console.error('Error fetching workflow:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/marketing/workflows
   * Create a new marketing workflow
   */
  app.post('/api/marketing/workflows', requireAuth, async (req: Request, res: Response) => {
    try {
      const workflowSchema = z.object({
        businessId: z.string().uuid(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        triggerType: z.string(),
        triggerConfig: z.any().optional(),
        steps: z.any(), // JSON array
      });

      const data = workflowSchema.parse(req.body);
      const workflow = await marketingStorage.createMarketingWorkflow(data as any);

      res.status(201).json(workflow);
    } catch (error: any) {
      console.error('Error creating workflow:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PUT /api/marketing/workflows/:id
   * Update a marketing workflow
   */
  app.put('/api/marketing/workflows/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const workflow = await marketingStorage.updateMarketingWorkflow(id, req.body);

      res.json(workflow);
    } catch (error: any) {
      console.error('Error updating workflow:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/marketing/workflows/:id
   * Delete a marketing workflow
   */
  app.delete('/api/marketing/workflows/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await marketingStorage.deleteMarketingWorkflow(id);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting workflow:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/marketing/workflows/:id/activate
   * Activate a workflow
   */
  app.post('/api/marketing/workflows/:id/activate', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await marketingStorage.activateWorkflow(id);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error activating workflow:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/marketing/workflows/:id/pause
   * Pause a workflow
   */
  app.post('/api/marketing/workflows/:id/pause', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await marketingStorage.pauseWorkflow(id);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error pausing workflow:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/marketing/workflows/:id/enrollments
   * Get all enrollments for a workflow
   */
  app.get('/api/marketing/workflows/:id/enrollments', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, limit, offset } = req.query;

      const enrollments = await marketingStorage.getWorkflowEnrollments(id, {
        status,
        limit: Number(limit) || 100,
        offset: Number(offset) || 0,
      });

      res.json(enrollments);
    } catch (error: any) {
      console.error('Error fetching enrollments:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========================================
  // LEAD CAPTURE FORMS
  // ========================================

  /**
   * GET /api/marketing/forms
   * List all forms for a business
   */
  app.get('/api/marketing/forms', requireAuth, async (req: Request, res: Response) => {
    try {
      const { businessId } = req.query;

      if (!businessId) {
        return res.status(400).json({ error: 'businessId is required' });
      }

      const forms = await marketingStorage.getLeadCaptureForms(businessId as string);
      res.json(forms);
    } catch (error: any) {
      console.error('Error fetching forms:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/marketing/forms/:id
   * Get a single form
   */
  app.get('/api/marketing/forms/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const form = await marketingStorage.getLeadCaptureForm(id);

      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }

      res.json(form);
    } catch (error: any) {
      console.error('Error fetching form:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/marketing/forms
   * Create a new lead capture form
   */
  app.post('/api/marketing/forms', requireAuth, async (req: Request, res: Response) => {
    try {
      const formSchema = z.object({
        businessId: z.string().uuid(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        fields: z.any(), // JSON array
        successMessage: z.string().optional(),
        redirectUrl: z.string().url().optional(),
        addToSegmentId: z.string().uuid().optional(),
        enrollInWorkflowId: z.string().uuid().optional(),
      });

      const data = formSchema.parse(req.body);
      const form = await marketingStorage.createLeadCaptureForm(data as any);

      res.status(201).json(form);
    } catch (error: any) {
      console.error('Error creating form:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PUT /api/marketing/forms/:id
   * Update a lead capture form
   */
  app.put('/api/marketing/forms/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const form = await marketingStorage.updateLeadCaptureForm(id, req.body);

      res.json(form);
    } catch (error: any) {
      console.error('Error updating form:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/marketing/forms/:id
   * Delete a lead capture form
   */
  app.delete('/api/marketing/forms/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await marketingStorage.deleteLeadCaptureForm(id);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting form:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/marketing/forms/:id/submit
   * Submit a lead capture form (PUBLIC ENDPOINT)
   */
  app.post('/api/marketing/forms/:id/submit', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const form = await marketingStorage.getLeadCaptureForm(id);

      if (!form || !form.isActive) {
        return res.status(404).json({ error: 'Form not found or inactive' });
      }

      // Extract submission data
      const submissionSchema = z.object({
        formData: z.any(), // JSON object with form field values
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
      });

      const data = submissionSchema.parse(req.body);

      // Create submission
      const submission = await marketingStorage.submitLeadForm({
        formId: id,
        businessId: form.businessId,
        formData: data.formData,
        email: data.formData.email,
        phone: data.formData.phone,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        referrer: req.headers.referer,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
      } as any);

      // Auto-enroll in workflow if configured
      if (form.enrollInWorkflowId) {
        // TODO: Implement workflow enrollment
        console.log(`Auto-enrolling in workflow ${form.enrollInWorkflowId}`);
      }

      // Auto-add to segment if configured
      if (form.addToSegmentId) {
        // TODO: Implement segment addition
        console.log(`Auto-adding to segment ${form.addToSegmentId}`);
      }

      res.json({
        success: true,
        message: form.successMessage,
        redirectUrl: form.redirectUrl,
      });
    } catch (error: any) {
      console.error('Error submitting form:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/marketing/forms/:id/submissions
   * Get all submissions for a form
   */
  app.get('/api/marketing/forms/:id/submissions', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, limit, offset } = req.query;

      const submissions = await marketingStorage.getLeadSubmissions(id, {
        status,
        limit: Number(limit) || 100,
        offset: Number(offset) || 0,
      });

      res.json(submissions);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========================================
  // TRACKING ENDPOINTS
  // ========================================

  /**
   * GET /api/marketing/track/open/:recipientId
   * Track email open (1px transparent GIF)
   */
  app.get('/api/marketing/track/open/:recipientId', async (req: Request, res: Response) => {
    try {
      const { recipientId } = req.params;

      // Track the open
      await marketingStorage.trackEmailOpen(recipientId);

      // Return 1x1 transparent GIF
      const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(gif);
    } catch (error: any) {
      console.error('Error tracking open:', error);
      // Still return GIF even on error
      const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set('Content-Type', 'image/gif');
      res.send(gif);
    }
  });

  /**
   * GET /api/marketing/track/click/:shortCode
   * Track link click and redirect
   */
  app.get('/api/marketing/track/click/:shortCode', async (req: Request, res: Response) => {
    try {
      const { shortCode } = req.params;

      // Get link
      const link = await marketingStorage.getCampaignLinkByShortCode(shortCode);

      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }

      // Track click (if recipientId is provided in query)
      const { recipientId } = req.query;
      if (recipientId) {
        await marketingStorage.trackLinkClick({
          campaignId: link.campaignId,
          recipientId: recipientId as string,
          linkId: link.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          deviceType: 'desktop', // TODO: Parse user agent
          browser: 'unknown', // TODO: Parse user agent
          os: 'unknown', // TODO: Parse user agent
        } as any);
      }

      // Redirect to original URL
      res.redirect(link.originalUrl);
    } catch (error: any) {
      console.error('Error tracking click:', error);
      res.status(500).json({ error: error.message });
    }
  });

  console.log('✅ Marketing automation routes registered');
}
