/**
 * AI-Enhanced Marketing Routes
 *
 * Enterprise-grade marketing automation endpoints with AI assistance:
 * - Campaign optimization with AI suggestions
 * - Content generation
 * - Subject line A/B testing
 * - Send time optimization
 * - Segment analysis and predictions
 * - Workflow generation
 * - Form optimization
 */

import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { aiAgentOrchestrator } from './aiAgentOrchestrator';
import { asyncHandler, OperationalError, ErrorCategory, ErrorSeverity, auditLogger } from './errorHandler';

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    throw new OperationalError(
      'Authentication required',
      401,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.MEDIUM
    );
  }
  next();
};

export function registerAIMarketingRoutes(app: Express) {
  /**
   * POST /api/ai/marketing/campaign/optimize
   * Optimize an email campaign with AI suggestions
   */
  app.post(
    '/api/ai/marketing/campaign/optimize',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const schema = z.object({
        campaignId: z.string().uuid().optional(),
        subject: z.string(),
        content: z.string(),
        targetAudience: z.string().optional(),
        openRate: z.number().optional(),
        clickRate: z.number().optional(),
      });

      const data = schema.parse(req.body);

      // Queue AI task
      const taskId = await aiAgentOrchestrator.addTask(
        'campaign_optimize',
        data,
        'high'
      );

      // Audit log
      auditLogger.log({
        userId: (req.user as any)?.id,
        action: 'AI_CAMPAIGN_OPTIMIZE',
        resource: 'campaign',
        resourceId: data.campaignId,
        result: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        taskId,
        message: 'Campaign optimization started. Use /api/ai/tasks/:taskId to check status.',
      });
    })
  );

  /**
   * POST /api/ai/marketing/content/generate
   * Generate email content with AI
   */
  app.post(
    '/api/ai/marketing/content/generate',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const schema = z.object({
        campaignType: z.string(),
        audience: z.string().optional(),
        goal: z.string().optional(),
        tone: z.string().optional(),
        product: z.string().optional(),
        offer: z.string().optional(),
      });

      const data = schema.parse(req.body);

      const taskId = await aiAgentOrchestrator.addTask(
        'content_generate',
        data,
        'medium'
      );

      auditLogger.log({
        userId: (req.user as any)?.id,
        action: 'AI_CONTENT_GENERATE',
        resource: 'campaign_content',
        result: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        taskId,
        message: 'Content generation started. Check status with /api/ai/tasks/:taskId',
      });
    })
  );

  /**
   * POST /api/ai/marketing/subject/test
   * Generate A/B test subject line variations
   */
  app.post(
    '/api/ai/marketing/subject/test',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const schema = z.object({
        subject: z.string(),
        goal: z.string().optional(),
        audienceProfile: z.string().optional(),
      });

      const data = schema.parse(req.body);

      const taskId = await aiAgentOrchestrator.addTask(
        'subject_test',
        data,
        'medium'
      );

      auditLogger.log({
        userId: (req.user as any)?.id,
        action: 'AI_SUBJECT_TEST',
        resource: 'campaign_subject',
        result: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        taskId,
        message: 'Subject line variations generated. Check /api/ai/tasks/:taskId',
      });
    })
  );

  /**
   * POST /api/ai/marketing/segment/analyze
   * Analyze customer segment with AI
   */
  app.post(
    '/api/ai/marketing/segment/analyze',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const schema = z.object({
        segmentId: z.string().uuid(),
        memberCount: z.number(),
        rules: z.any(),
        performance: z.any().optional(),
      });

      const data = schema.parse(req.body);

      const taskId = await aiAgentOrchestrator.addTask(
        'segment_analyze',
        data,
        'medium'
      );

      auditLogger.log({
        userId: (req.user as any)?.id,
        action: 'AI_SEGMENT_ANALYZE',
        resource: 'segment',
        resourceId: data.segmentId,
        result: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        taskId,
        message: 'Segment analysis started. Check /api/ai/tasks/:taskId',
      });
    })
  );

  /**
   * POST /api/ai/marketing/sendtime/optimize
   * Optimize send time with AI
   */
  app.post(
    '/api/ai/marketing/sendtime/optimize',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const schema = z.object({
        campaignId: z.string().uuid().optional(),
        historicalData: z.any().optional(),
        industry: z.string().optional(),
        demographics: z.any().optional(),
        timeZones: z.any().optional(),
      });

      const data = schema.parse(req.body);

      const taskId = await aiAgentOrchestrator.addTask(
        'send_time_optimize',
        data,
        'low'
      );

      auditLogger.log({
        userId: (req.user as any)?.id,
        action: 'AI_SENDTIME_OPTIMIZE',
        resource: 'campaign',
        resourceId: data.campaignId,
        result: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        taskId,
        message: 'Send time optimization started. Check /api/ai/tasks/:taskId',
      });
    })
  );

  /**
   * POST /api/ai/marketing/workflow/generate
   * Generate marketing workflow with AI
   */
  app.post(
    '/api/ai/marketing/workflow/generate',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const schema = z.object({
        goal: z.string(),
        trigger: z.string(),
        audience: z.string(),
        campaignType: z.string().optional(),
      });

      const data = schema.parse(req.body);

      const taskId = await aiAgentOrchestrator.addTask(
        'workflow_generate',
        data,
        'medium'
      );

      auditLogger.log({
        userId: (req.user as any)?.id,
        action: 'AI_WORKFLOW_GENERATE',
        resource: 'workflow',
        result: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        taskId,
        message: 'Workflow generation started. Check /api/ai/tasks/:taskId',
      });
    })
  );

  /**
   * POST /api/ai/marketing/form/optimize
   * Optimize lead capture form with AI
   */
  app.post(
    '/api/ai/marketing/form/optimize',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const schema = z.object({
        formId: z.string().uuid().optional(),
        fields: z.any(),
        conversionRate: z.number().optional(),
        dropOffPoint: z.string().optional(),
      });

      const data = schema.parse(req.body);

      const taskId = await aiAgentOrchestrator.addTask(
        'form_optimize',
        data,
        'medium'
      );

      auditLogger.log({
        userId: (req.user as any)?.id,
        action: 'AI_FORM_OPTIMIZE',
        resource: 'form',
        resourceId: data.formId,
        result: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        taskId,
        message: 'Form optimization started. Check /api/ai/tasks/:taskId',
      });
    })
  );

  /**
   * GET /api/ai/tasks/:taskId
   * Check AI task status
   */
  app.get(
    '/api/ai/tasks/:taskId',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { taskId } = req.params;

      const task = aiAgentOrchestrator.getTaskStatus(taskId);

      if (!task) {
        throw new OperationalError(
          'Task not found',
          404,
          ErrorCategory.NOT_FOUND,
          ErrorSeverity.LOW
        );
      }

      res.json({
        taskId: task.id,
        type: task.type,
        status: task.status,
        priority: task.priority,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        result: task.result,
        error: task.error,
        retries: task.retries,
      });
    })
  );

  /**
   * GET /api/ai/stats
   * Get AI agent statistics
   */
  app.get(
    '/api/ai/stats',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const stats = aiAgentOrchestrator.getStats();

      res.json({
        queueStats: stats,
        timestamp: new Date(),
      });
    })
  );

  /**
   * POST /api/ai/marketing/campaign/bulk-optimize
   * Optimize multiple campaigns in bulk
   */
  app.post(
    '/api/ai/marketing/campaign/bulk-optimize',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const schema = z.object({
        campaigns: z.array(z.object({
          campaignId: z.string().uuid(),
          subject: z.string(),
          content: z.string(),
        })),
      });

      const { campaigns } = schema.parse(req.body);

      const taskIds = await Promise.all(
        campaigns.map(campaign =>
          aiAgentOrchestrator.addTask('campaign_optimize', campaign, 'medium')
        )
      );

      auditLogger.log({
        userId: (req.user as any)?.id,
        action: 'AI_BULK_OPTIMIZE',
        resource: 'campaigns',
        result: 'success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        taskIds,
        count: taskIds.length,
        message: 'Bulk optimization started. Check each task with /api/ai/tasks/:taskId',
      });
    })
  );

  console.log('✅ AI-enhanced marketing routes registered');
}
