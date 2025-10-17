/**
 * Google My Business Enhanced Sync Service
 * Orchestrates comprehensive data synchronization with real-time updates and webhook support
 */

import { gmbService } from './gmbService';
import { businessVerificationService } from './businessVerificationService';
import { dataSyncService } from './dataSyncService';
import { gmbReviewService } from './gmbReviewService';
import { gmbPostService } from './gmbPostService';
import { gmbInsightsService } from './gmbInsightsService';
import { gmbErrorHandler } from './gmbErrorHandler';
import { storage } from './storage';
import { Server as SocketServer } from 'socket.io';

export type SyncType = 'full' | 'incremental' | 'selective' | 'real-time';
export type SyncStatus = 'idle' | 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused';
export type ConflictStrategy = 'local_wins' | 'gmb_wins' | 'merge' | 'manual' | 'newest_wins';

export interface SyncConfiguration {
  businessId: string;
  syncType: SyncType;
  autoSync: boolean;
  syncInterval?: number; // minutes
  conflictStrategy: ConflictStrategy;
  dataTypes: {
    businessInfo: boolean;
    reviews: boolean;
    posts: boolean;
    photos: boolean;
    insights: boolean;
  };
  webhookEnabled: boolean;
  webhookUrl?: string;
  notifyOnComplete: boolean;
  notifyOnError: boolean;
  retryOnFailure: boolean;
  maxRetries: number;
}

export interface SyncSession {
  id: string;
  businessId: string;
  startTime: Date;
  endTime?: Date;
  status: SyncStatus;
  type: SyncType;
  progress: {
    total: number;
    completed: number;
    failed: number;
    percentage: number;
  };
  dataChanges: {
    businessInfo?: DataChange[];
    reviews?: DataChange[];
    posts?: DataChange[];
    photos?: DataChange[];
    insights?: DataChange[];
  };
  errors: SyncError[];
  warnings: string[];
  stats: SyncStatistics;
}

export interface DataChange {
  field: string;
  oldValue: any;
  newValue: any;
  source: 'local' | 'gmb';
  action: 'create' | 'update' | 'delete';
  timestamp: Date;
}

export interface SyncError {
  code: string;
  message: string;
  dataType: string;
  item?: any;
  retryable: boolean;
  timestamp: Date;
}

export interface SyncStatistics {
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsDeleted: number;
  itemsFailed: number;
  dataTransferred: number; // bytes
  apiCallsMade: number;
  duration: number; // milliseconds
}

export interface WebhookPayload {
  eventType: 'sync.started' | 'sync.progress' | 'sync.completed' | 'sync.failed' | 'data.changed';
  businessId: string;
  sessionId: string;
  data: any;
  timestamp: Date;
}

export class GMBSyncService {
  private activeSessions = new Map<string, SyncSession>();
  private syncConfigurations = new Map<string, SyncConfiguration>();
  private syncSchedules = new Map<string, NodeJS.Timeout>();
  private webhookClients = new Map<string, string>();
  private io?: SocketServer;
  
  /**
   * Initialize sync service with WebSocket support
   */
  initialize(socketServer?: SocketServer): void {
    this.io = socketServer;
    
    if (this.io) {
      this.io.on('connection', (socket) => {
        console.log('GMB Sync WebSocket client connected:', socket.id);
        
        socket.on('subscribe', (businessId: string) => {
          socket.join(`gmb_${businessId}`);
          console.log(`Client ${socket.id} subscribed to GMB updates for business ${businessId}`);
        });
        
        socket.on('unsubscribe', (businessId: string) => {
          socket.leave(`gmb_${businessId}`);
        });
        
        socket.on('disconnect', () => {
          console.log('GMB Sync WebSocket client disconnected:', socket.id);
        });
      });
    }
  }

  /**
   * Configure sync settings for a business
   */
  async configureSyncSettings(config: SyncConfiguration): Promise<void> {
    // Validate configuration
    if (!config.businessId) {
      throw new Error('Business ID is required');
    }

    const business = await storage.getBusinessById(config.businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    if (!business.gmbConnected) {
      throw new Error('Business is not connected to Google My Business');
    }

    // Store configuration
    this.syncConfigurations.set(config.businessId, config);

    // Set up auto-sync if enabled
    if (config.autoSync && config.syncInterval) {
      await this.setupAutoSync(config.businessId, config.syncInterval);
    }

    // Set up webhook if enabled
    if (config.webhookEnabled && config.webhookUrl) {
      this.webhookClients.set(config.businessId, config.webhookUrl);
    }

    // Log configuration
    await storage.createGmbSyncHistory({
      businessId: config.businessId,
      syncType: 'configuration',
      status: 'success',
      dataTypes: Object.keys(config.dataTypes).filter(k => config.dataTypes[k as keyof typeof config.dataTypes]),
      changes: { config },
      errorDetails: null,
      itemsProcessed: 0,
      itemsUpdated: 0,
      itemsErrors: 0,
      durationMs: null,
      triggeredBy: 'manual',
      gmbApiVersion: 'v4.9'
    });
  }

  /**
   * Start a sync session
   */
  async startSync(businessId: string, options: {
    type?: SyncType;
    dataTypes?: Partial<SyncConfiguration['dataTypes']>;
    force?: boolean;
  } = {}): Promise<SyncSession> {
    // Check if sync is already in progress
    const existingSession = Array.from(this.activeSessions.values())
      .find(s => s.businessId === businessId && s.status === 'in_progress');
    
    if (existingSession && !options.force) {
      throw new Error('Sync already in progress for this business');
    }

    // Get or create configuration
    let config = this.syncConfigurations.get(businessId);
    if (!config) {
      config = await this.getDefaultConfiguration(businessId);
    }

    // Override with options
    const syncType = options.type || config.syncType;
    const dataTypes = { ...config.dataTypes, ...options.dataTypes };

    // Create sync session
    const session: SyncSession = {
      id: `sync_${Date.now()}_${businessId}`,
      businessId,
      startTime: new Date(),
      status: 'in_progress',
      type: syncType,
      progress: {
        total: 0,
        completed: 0,
        failed: 0,
        percentage: 0
      },
      dataChanges: {},
      errors: [],
      warnings: [],
      stats: {
        itemsProcessed: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        itemsDeleted: 0,
        itemsFailed: 0,
        dataTransferred: 0,
        apiCallsMade: 0,
        duration: 0
      }
    };

    // Store session
    this.activeSessions.set(session.id, session);

    // Emit start event
    this.emitSyncEvent('sync.started', session);

    // Perform sync based on type
    try {
      switch (syncType) {
        case 'full':
          await this.performFullSync(session, dataTypes, config);
          break;
        case 'incremental':
          await this.performIncrementalSync(session, dataTypes, config);
          break;
        case 'selective':
          await this.performSelectiveSync(session, dataTypes, config);
          break;
        case 'real-time':
          await this.performRealTimeSync(session, dataTypes, config);
          break;
      }

      session.status = 'completed';
      session.endTime = new Date();
      session.stats.duration = session.endTime.getTime() - session.startTime.getTime();

      // Emit completion event
      this.emitSyncEvent('sync.completed', session);

    } catch (error) {
      session.status = 'failed';
      session.endTime = new Date();
      session.stats.duration = session.endTime.getTime() - session.startTime.getTime();
      session.errors.push({
        code: 'SYNC_FAILED',
        message: (error as Error).message,
        dataType: 'general',
        retryable: true,
        timestamp: new Date()
      });

      // Emit failure event
      this.emitSyncEvent('sync.failed', session);

      // Retry if configured
      if (config.retryOnFailure && session.errors.filter(e => e.retryable).length > 0) {
        await this.retrySyncSession(session.id, config.maxRetries);
      }

      throw error;
    }

    return session;
  }

  /**
   * Perform full sync
   */
  private async performFullSync(session: SyncSession, dataTypes: any, config: SyncConfiguration): Promise<void> {
    const tasks = [];
    let totalItems = 0;

    // Sync business information
    if (dataTypes.businessInfo) {
      totalItems += 5; // Estimate
      tasks.push(this.syncBusinessInfo(session, config));
    }

    // Sync reviews
    if (dataTypes.reviews) {
      totalItems += 50; // Estimate
      tasks.push(this.syncReviews(session, config));
    }

    // Sync posts
    if (dataTypes.posts) {
      totalItems += 20; // Estimate
      tasks.push(this.syncPosts(session, config));
    }

    // Sync photos
    if (dataTypes.photos) {
      totalItems += 30; // Estimate
      tasks.push(this.syncPhotos(session, config));
    }

    // Sync insights
    if (dataTypes.insights) {
      totalItems += 10; // Estimate
      tasks.push(this.syncInsights(session, config));
    }

    session.progress.total = totalItems;

    // Execute all sync tasks in parallel
    await Promise.all(tasks);
  }

  /**
   * Perform incremental sync (changes since last sync)
   */
  private async performIncrementalSync(session: SyncSession, dataTypes: any, config: SyncConfiguration): Promise<void> {
    // Get last sync timestamp
    const lastSync = await this.getLastSyncTimestamp(session.businessId);
    
    if (!lastSync) {
      // No previous sync, perform full sync
      return this.performFullSync(session, dataTypes, config);
    }

    // Only sync data that has changed since last sync
    const tasks = [];

    if (dataTypes.businessInfo) {
      tasks.push(this.syncBusinessInfoIncremental(session, config, lastSync));
    }

    if (dataTypes.reviews) {
      tasks.push(this.syncReviewsIncremental(session, config, lastSync));
    }

    if (dataTypes.posts) {
      tasks.push(this.syncPostsIncremental(session, config, lastSync));
    }

    await Promise.all(tasks);
  }

  /**
   * Perform selective sync (specific data items)
   */
  private async performSelectiveSync(session: SyncSession, dataTypes: any, config: SyncConfiguration): Promise<void> {
    // This would sync only specific items selected by the user
    // For now, implement as a filtered full sync
    return this.performFullSync(session, dataTypes, config);
  }

  /**
   * Perform real-time sync (continuous monitoring)
   */
  private async performRealTimeSync(session: SyncSession, dataTypes: any, config: SyncConfiguration): Promise<void> {
    // Set up real-time monitoring
    // This would typically use webhooks or polling
    
    // For demo, perform initial sync and set up monitoring
    await this.performFullSync(session, dataTypes, config);
    
    // Set up periodic checks for changes
    const checkInterval = setInterval(async () => {
      try {
        await this.checkForChanges(session, config);
      } catch (error) {
        console.error('Real-time sync check failed:', error);
        clearInterval(checkInterval);
      }
    }, 60000); // Check every minute

    // Store interval for cleanup
    this.syncSchedules.set(`realtime_${session.id}`, checkInterval);
  }

  /**
   * Sync business information
   */
  private async syncBusinessInfo(session: SyncSession, config: SyncConfiguration): Promise<void> {
    try {
      const result = await dataSyncService.performFullSync(session.businessId, {
        syncBusinessInfo: true,
        syncPhotos: false,
        syncReviews: false,
        conflictResolution: config.conflictStrategy as any
      });

      if (!session.dataChanges.businessInfo) {
        session.dataChanges.businessInfo = [];
      }

      // Track changes
      if (result.syncSummary.businessInfoUpdated) {
        session.dataChanges.businessInfo.push({
          field: 'business_info',
          oldValue: null,
          newValue: result.syncSummary,
          source: 'gmb',
          action: 'update',
          timestamp: new Date()
        });
      }

      session.stats.itemsProcessed += 1;
      session.stats.itemsUpdated += result.syncSummary.businessInfoUpdated ? 1 : 0;
      session.progress.completed += 5;
      session.progress.percentage = (session.progress.completed / session.progress.total) * 100;

      // Emit progress update
      this.emitSyncEvent('sync.progress', session);

    } catch (error) {
      session.errors.push({
        code: 'BUSINESS_INFO_SYNC_ERROR',
        message: (error as Error).message,
        dataType: 'businessInfo',
        retryable: true,
        timestamp: new Date()
      });
      session.stats.itemsFailed++;
      session.progress.failed++;
    }
  }

  /**
   * Sync reviews
   */
  private async syncReviews(session: SyncSession, config: SyncConfiguration): Promise<void> {
    try {
      const { reviews, totalReviews } = await gmbReviewService.fetchReviews(session.businessId);

      if (!session.dataChanges.reviews) {
        session.dataChanges.reviews = [];
      }

      session.dataChanges.reviews.push({
        field: 'reviews',
        oldValue: null,
        newValue: { count: totalReviews },
        source: 'gmb',
        action: 'update',
        timestamp: new Date()
      });

      session.stats.itemsProcessed += totalReviews;
      session.stats.itemsCreated += reviews.filter(r => r.createdAt >= session.startTime).length;
      session.progress.completed += Math.min(50, totalReviews);
      session.progress.percentage = (session.progress.completed / session.progress.total) * 100;

      // Emit progress update
      this.emitSyncEvent('sync.progress', session);

    } catch (error) {
      session.errors.push({
        code: 'REVIEWS_SYNC_ERROR',
        message: (error as Error).message,
        dataType: 'reviews',
        retryable: true,
        timestamp: new Date()
      });
      session.stats.itemsFailed++;
      session.progress.failed++;
    }
  }

  /**
   * Sync posts
   */
  private async syncPosts(session: SyncSession, config: SyncConfiguration): Promise<void> {
    try {
      const { posts, total } = await gmbPostService.getBusinessPosts(session.businessId);

      if (!session.dataChanges.posts) {
        session.dataChanges.posts = [];
      }

      session.dataChanges.posts.push({
        field: 'posts',
        oldValue: null,
        newValue: { count: total },
        source: 'gmb',
        action: 'update',
        timestamp: new Date()
      });

      session.stats.itemsProcessed += total;
      session.progress.completed += Math.min(20, total);
      session.progress.percentage = (session.progress.completed / session.progress.total) * 100;

      // Emit progress update
      this.emitSyncEvent('sync.progress', session);

    } catch (error) {
      session.errors.push({
        code: 'POSTS_SYNC_ERROR',
        message: (error as Error).message,
        dataType: 'posts',
        retryable: true,
        timestamp: new Date()
      });
      session.stats.itemsFailed++;
      session.progress.failed++;
    }
  }

  /**
   * Sync photos
   */
  private async syncPhotos(session: SyncSession, config: SyncConfiguration): Promise<void> {
    try {
      // Photo sync logic
      const photoCount = 30; // Mock value

      if (!session.dataChanges.photos) {
        session.dataChanges.photos = [];
      }

      session.dataChanges.photos.push({
        field: 'photos',
        oldValue: null,
        newValue: { count: photoCount },
        source: 'gmb',
        action: 'update',
        timestamp: new Date()
      });

      session.stats.itemsProcessed += photoCount;
      session.progress.completed += 30;
      session.progress.percentage = (session.progress.completed / session.progress.total) * 100;

      // Emit progress update
      this.emitSyncEvent('sync.progress', session);

    } catch (error) {
      session.errors.push({
        code: 'PHOTOS_SYNC_ERROR',
        message: (error as Error).message,
        dataType: 'photos',
        retryable: true,
        timestamp: new Date()
      });
      session.stats.itemsFailed++;
      session.progress.failed++;
    }
  }

  /**
   * Sync insights
   */
  private async syncInsights(session: SyncSession, config: SyncConfiguration): Promise<void> {
    try {
      const dateRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const insights = await gmbInsightsService.fetchLocationInsights(session.businessId, {
        dateRange
      });

      if (!session.dataChanges.insights) {
        session.dataChanges.insights = [];
      }

      session.dataChanges.insights.push({
        field: 'insights',
        oldValue: null,
        newValue: {
          views: insights.metrics.views.total,
          actions: insights.metrics.actions.total
        },
        source: 'gmb',
        action: 'update',
        timestamp: new Date()
      });

      session.stats.itemsProcessed += 10;
      session.stats.itemsUpdated += 1;
      session.progress.completed += 10;
      session.progress.percentage = (session.progress.completed / session.progress.total) * 100;

      // Emit progress update
      this.emitSyncEvent('sync.progress', session);

    } catch (error) {
      session.errors.push({
        code: 'INSIGHTS_SYNC_ERROR',
        message: (error as Error).message,
        dataType: 'insights',
        retryable: true,
        timestamp: new Date()
      });
      session.stats.itemsFailed++;
      session.progress.failed++;
    }
  }

  /**
   * Incremental sync methods
   */
  private async syncBusinessInfoIncremental(session: SyncSession, config: SyncConfiguration, lastSync: Date): Promise<void> {
    // Only sync if GMB data was modified after last sync
    const business = await storage.getBusinessById(session.businessId);
    if (business && business.updatedAt > lastSync) {
      await this.syncBusinessInfo(session, config);
    }
  }

  private async syncReviewsIncremental(session: SyncSession, config: SyncConfiguration, lastSync: Date): Promise<void> {
    // Fetch only new reviews since last sync
    const { reviews } = await gmbReviewService.fetchReviews(session.businessId);
    const newReviews = reviews.filter(r => r.createdAt >= lastSync);
    
    if (newReviews.length > 0) {
      session.stats.itemsProcessed += newReviews.length;
      session.stats.itemsCreated += newReviews.length;
    }
  }

  private async syncPostsIncremental(session: SyncSession, config: SyncConfiguration, lastSync: Date): Promise<void> {
    // Fetch only new posts since last sync
    const { posts } = await gmbPostService.getBusinessPosts(session.businessId);
    const newPosts = posts.filter(p => p.createdAt >= lastSync);
    
    if (newPosts.length > 0) {
      session.stats.itemsProcessed += newPosts.length;
      session.stats.itemsCreated += newPosts.length;
    }
  }

  /**
   * Check for changes in real-time sync
   */
  private async checkForChanges(session: SyncSession, config: SyncConfiguration): Promise<void> {
    // Check for changes and sync if necessary
    const lastCheck = session.endTime || session.startTime;
    const changes = await this.detectChanges(session.businessId, lastCheck);
    
    if (changes.hasChanges) {
      // Emit change event
      this.emitSyncEvent('data.changed', {
        ...session,
        dataChanges: changes.changes
      });
      
      // Perform incremental sync for changed data
      if (changes.changes.reviews) {
        await this.syncReviewsIncremental(session, config, lastCheck);
      }
      
      if (changes.changes.posts) {
        await this.syncPostsIncremental(session, config, lastCheck);
      }
    }
  }

  /**
   * Detect changes since last check
   */
  private async detectChanges(businessId: string, since: Date): Promise<{
    hasChanges: boolean;
    changes: Record<string, any>;
  }> {
    const changes: Record<string, any> = {};
    let hasChanges = false;

    // Check for new reviews
    const { reviews } = await gmbReviewService.fetchReviews(businessId);
    const newReviews = reviews.filter(r => r.createdAt >= since);
    if (newReviews.length > 0) {
      changes.reviews = newReviews;
      hasChanges = true;
    }

    // Check for new posts
    const { posts } = await gmbPostService.getBusinessPosts(businessId);
    const newPosts = posts.filter(p => p.createdAt >= since);
    if (newPosts.length > 0) {
      changes.posts = newPosts;
      hasChanges = true;
    }

    return { hasChanges, changes };
  }

  /**
   * Get sync session status
   */
  getSyncStatus(sessionId: string): SyncSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all active sync sessions
   */
  getActiveSessions(): SyncSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Cancel a sync session
   */
  cancelSync(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'in_progress') {
      session.status = 'paused';
      session.endTime = new Date();
      
      // Clear any associated schedules
      const scheduleKey = `realtime_${sessionId}`;
      const schedule = this.syncSchedules.get(scheduleKey);
      if (schedule) {
        clearInterval(schedule);
        this.syncSchedules.delete(scheduleKey);
      }
      
      // Emit cancellation event
      this.emitSyncEvent('sync.failed', session);
    }
  }

  /**
   * Resume a paused sync session
   */
  async resumeSync(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'paused') {
      session.status = 'in_progress';
      
      const config = this.syncConfigurations.get(session.businessId);
      if (config) {
        // Continue from where it left off
        await this.performFullSync(session, config.dataTypes, config);
      }
    }
  }

  /**
   * Retry a failed sync session
   */
  private async retrySyncSession(sessionId: string, maxRetries: number): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'failed') return;

    let retryCount = 0;
    while (retryCount < maxRetries) {
      retryCount++;
      
      try {
        // Reset session status
        session.status = 'in_progress';
        session.errors = [];
        
        const config = this.syncConfigurations.get(session.businessId);
        if (config) {
          await this.performFullSync(session, config.dataTypes, config);
        }
        
        break; // Success, exit retry loop
      } catch (error) {
        session.status = 'failed';
        
        if (retryCount >= maxRetries) {
          throw new Error(`Sync failed after ${maxRetries} retries`);
        }
        
        // Wait before retry with exponential backoff
        await this.sleep(Math.pow(2, retryCount) * 1000);
      }
    }
  }

  /**
   * Set up automatic sync schedule
   */
  private async setupAutoSync(businessId: string, intervalMinutes: number): Promise<void> {
    // Clear existing schedule
    const existingSchedule = this.syncSchedules.get(businessId);
    if (existingSchedule) {
      clearInterval(existingSchedule);
    }

    // Set up new schedule
    const schedule = setInterval(async () => {
      try {
        await this.startSync(businessId, { type: 'incremental' });
      } catch (error) {
        console.error(`Auto-sync failed for business ${businessId}:`, error);
      }
    }, intervalMinutes * 60 * 1000);

    this.syncSchedules.set(businessId, schedule);
  }

  /**
   * Get sync history for a business
   */
  async getSyncHistory(businessId: string, options: {
    limit?: number;
    offset?: number;
    dateRange?: { start: Date; end: Date };
  } = {}): Promise<any[]> {
    return await storage.getGmbSyncHistoryByBusiness(businessId, options.limit || 100);
  }

  /**
   * Generate sync report
   */
  async generateSyncReport(businessId: string, dateRange: { start: Date; end: Date }): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDuration: number;
    totalDataTransferred: number;
    mostSyncedDataType: string;
    recentErrors: SyncError[];
    recommendations: string[];
  }> {
    const history = await this.getSyncHistory(businessId, { dateRange });
    
    const totalSyncs = history.length;
    const successfulSyncs = history.filter(h => h.status === 'success').length;
    const failedSyncs = history.filter(h => h.status === 'error').length;
    
    const durations = history.map(h => h.durationMs || 0).filter(d => d > 0);
    const averageDuration = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;
    
    const dataTypeCount = new Map<string, number>();
    history.forEach(h => {
      h.dataTypes?.forEach((type: string) => {
        dataTypeCount.set(type, (dataTypeCount.get(type) || 0) + 1);
      });
    });
    
    const mostSyncedDataType = Array.from(dataTypeCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
    
    const recentErrors = history
      .filter(h => h.status === 'error')
      .slice(0, 5)
      .map(h => ({
        code: h.errorCode || 'UNKNOWN',
        message: h.errorMessage || 'Unknown error',
        dataType: h.dataTypes?.[0] || 'general',
        retryable: true,
        timestamp: h.createdAt
      }));
    
    const recommendations = this.generateSyncRecommendations(history);
    
    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      averageDuration,
      totalDataTransferred: 0, // Would calculate from actual data
      mostSyncedDataType,
      recentErrors,
      recommendations
    };
  }

  /**
   * Helper: Generate sync recommendations
   */
  private generateSyncRecommendations(history: any[]): string[] {
    const recommendations: string[] = [];
    
    const failureRate = history.filter(h => h.status === 'error').length / history.length;
    if (failureRate > 0.1) {
      recommendations.push('High failure rate detected. Check API credentials and network connectivity.');
    }
    
    const avgDuration = history.reduce((sum, h) => sum + (h.durationMs || 0), 0) / history.length;
    if (avgDuration > 60000) {
      recommendations.push('Sync operations are taking longer than expected. Consider optimizing data queries.');
    }
    
    const recentSyncs = history.filter(h => 
      new Date(h.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );
    if (recentSyncs.length === 0) {
      recommendations.push('No recent syncs detected. Enable auto-sync to keep data up-to-date.');
    }
    
    return recommendations;
  }

  /**
   * Helper: Get default sync configuration
   */
  private async getDefaultConfiguration(businessId: string): Promise<SyncConfiguration> {
    return {
      businessId,
      syncType: 'incremental',
      autoSync: false,
      conflictStrategy: 'gmb_wins',
      dataTypes: {
        businessInfo: true,
        reviews: true,
        posts: true,
        photos: true,
        insights: true
      },
      webhookEnabled: false,
      notifyOnComplete: true,
      notifyOnError: true,
      retryOnFailure: true,
      maxRetries: 3
    };
  }

  /**
   * Helper: Get last sync timestamp
   */
  private async getLastSyncTimestamp(businessId: string): Promise<Date | null> {
    const history = await storage.getGmbSyncHistoryByBusiness(businessId, 1);
    return history.length > 0 ? history[0].createdAt : null;
  }

  /**
   * Helper: Emit sync event via WebSocket and webhook
   */
  private emitSyncEvent(eventType: WebhookPayload['eventType'], session: SyncSession): void {
    const payload: WebhookPayload = {
      eventType,
      businessId: session.businessId,
      sessionId: session.id,
      data: {
        status: session.status,
        progress: session.progress,
        changes: session.dataChanges,
        errors: session.errors
      },
      timestamp: new Date()
    };

    // Emit via WebSocket
    if (this.io) {
      this.io.to(`gmb_${session.businessId}`).emit(eventType, payload);
    }

    // Send webhook
    const webhookUrl = this.webhookClients.get(session.businessId);
    if (webhookUrl) {
      this.sendWebhook(webhookUrl, payload);
    }
  }

  /**
   * Helper: Send webhook notification
   */
  private async sendWebhook(url: string, payload: WebhookPayload): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GMB-Event': payload.eventType
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send webhook:', error);
    }
  }

  /**
   * Helper: Sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Clear all schedules
    this.syncSchedules.forEach(schedule => clearInterval(schedule));
    this.syncSchedules.clear();

    // Clear active sessions
    this.activeSessions.clear();

    // Clear configurations
    this.syncConfigurations.clear();
  }
}

// Export singleton instance
export const gmbSyncService = new GMBSyncService();