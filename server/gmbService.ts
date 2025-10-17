// Google My Business Service Implementation
// Provides full GMB API integration with graceful demo mode fallback

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { storage } from './storage';
import { InsertGmbToken, InsertGmbSyncHistory, InsertGmbReview } from '@shared/schema';
import { gmbErrorHandler, GMBErrorType } from './gmbErrorHandler';

// Environment variables for GMB API
const GMB_CLIENT_ID = process.env.GMB_CLIENT_ID;
const GMB_CLIENT_SECRET = process.env.GMB_CLIENT_SECRET;
const GMB_REDIRECT_URI = process.env.GMB_REDIRECT_URI || `${process.env.REPLIT_URL || 'http://localhost:5000'}/api/gmb/oauth/callback`;

// GMB API Scopes
const GMB_SCOPES = [
  'https://www.googleapis.com/auth/business.manage'
];

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  requests: new Map<string, number[]>()
};

/**
 * Google My Business API Service
 * Handles OAuth 2.0, API calls, and data synchronization
 */
export class GMBService {
  private oauth2Client: OAuth2Client;
  private encryptionKey: string;

  constructor() {
    // In demo mode, GMB credentials are optional
    const isDemoMode = !GMB_CLIENT_ID || !GMB_CLIENT_SECRET;
    
    if (isDemoMode) {
      console.warn('GMB API credentials not configured. Running in demo mode.');
      // Use dummy credentials for demo mode
      this.oauth2Client = new OAuth2Client(
        'demo-client-id',
        'demo-client-secret',
        GMB_REDIRECT_URI
      );
    } else {
      this.oauth2Client = new OAuth2Client(
        GMB_CLIENT_ID,
        GMB_CLIENT_SECRET,
        GMB_REDIRECT_URI
      );
    }

    // Validate and set encryption key
    if (!process.env.GMB_ENCRYPTION_KEY) {
      // Only require encryption key in production if GMB is actually configured
      if (process.env.NODE_ENV === 'production' && GMB_CLIENT_ID && GMB_CLIENT_SECRET) {
        throw new Error(
          'GMB_ENCRYPTION_KEY must be set in production when GMB is fully configured (both GMB_CLIENT_ID and GMB_CLIENT_SECRET present).\n' +
          'Generate a secure key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n' +
          'Example: GMB_ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd'
        );
      }
      // In development, generate a temporary key with warning
      this.encryptionKey = crypto.randomBytes(32).toString('hex');
      console.warn('⚠️  Using temporary encryption key. Set GMB_ENCRYPTION_KEY environment variable for persistent token encryption.');
    } else {
      // Validate encryption key format: must be exactly 64 hex characters (32 bytes)
      const key = process.env.GMB_ENCRYPTION_KEY;
      if (!/^[0-9a-fA-F]{64}$/.test(key)) {
        throw new Error(
          'GMB_ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes).\n' +
          'Current key length: ' + key.length + ' characters\n' +
          'Generate a valid key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n' +
          'Example: GMB_ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd'
        );
      }
      this.encryptionKey = key;
    }
  }

  /**
   * Check if GMB integration is available
   */
  public isAvailable(): boolean {
    return !!(GMB_CLIENT_ID && GMB_CLIENT_SECRET);
  }

  /**
   * Generate OAuth 2.0 authorization URL
   */
  generateAuthUrl(state?: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GMB_SCOPES,
      prompt: 'consent', // Forces refresh token
      state: state, // Can include business ID for tracking
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, businessId: string, userId: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('GMB integration is not available in demo mode. Please configure GMB_CLIENT_ID and GMB_CLIENT_SECRET.');
    }

    return await gmbErrorHandler.withRetry(
      async () => {
        const { tokens } = await this.oauth2Client.getToken(code);
        
        if (!tokens.access_token || !tokens.refresh_token) {
          throw new Error('Failed to obtain valid tokens from Google');
        }

        // Encrypt tokens before storage
        const encryptedAccessToken = this.encryptToken(tokens.access_token);
        const encryptedRefreshToken = this.encryptToken(tokens.refresh_token);

        // Calculate expiration time
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expiry_date ? (tokens.expiry_date - Date.now()) / 1000 : 3600));

        const tokenData: InsertGmbToken = {
          businessId,
          userId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenType: tokens.token_type || 'Bearer',
          expiresAt,
          scope: GMB_SCOPES.join(' '),
          isActive: true
        };

        await storage.createGmbToken(tokenData);

        // Update business GMB connection status
        await storage.updateBusinessGmbStatus(businessId, {
          gmbConnected: true,
          gmbSyncStatus: 'connected'
        });

        // Log the connection event
        await this.logSyncEvent(businessId, 'oauth_connect', 'success', {
          message: 'Successfully connected to Google My Business'
        });
      },
      { maxRetries: 2 },
      { 
        businessId, 
        operation: 'oauth_connect',
        userId 
      }
    );
  }

  /**
   * Get valid access token for a business (refresh if needed)
   */
  async getValidAccessToken(businessId: string): Promise<string> {
    const tokenRecord = await storage.getGmbToken(businessId);
    
    if (!tokenRecord || !tokenRecord.isActive) {
      throw new Error('No active GMB token found for business');
    }

    // Check if token is expired
    const now = new Date();
    if (tokenRecord.expiresAt <= now) {
      // Refresh the token
      await this.refreshAccessToken(businessId);
      return this.getValidAccessToken(businessId); // Recursive call with new token
    }

    return await this.decryptToken(tokenRecord.accessToken, businessId);
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(businessId: string): Promise<void> {
    try {
      const tokenRecord = await storage.getGmbToken(businessId);
      
      if (!tokenRecord) {
        throw new Error('No token record found');
      }

      const refreshToken = await this.decryptToken(tokenRecord.refreshToken, businessId);
      
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      // Update token in database
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (credentials.expiry_date ? (credentials.expiry_date - Date.now()) / 1000 : 3600));

      await storage.updateGmbToken(businessId, {
        accessToken: this.encryptToken(credentials.access_token),
        expiresAt,
        updatedAt: new Date()
      });

    } catch (error: any) {
      await this.logSyncEvent(businessId, 'token_refresh', 'error', {
        error: error.message
      });
      
      // Deactivate token if refresh fails
      await storage.updateGmbToken(businessId, { isActive: false });
      
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Get Google My Business accounts for authenticated user
   */
  async getBusinessAccounts(businessId: string): Promise<any[]> {
    if (!this.isAvailable()) {
      // Return comprehensive demo data for development
      return [
        {
          name: 'accounts/demo-account-123',
          accountName: 'Demo Business Account',
          accountNumber: '123456789',
          role: 'OWNER',
          state: 'VERIFIED',
          type: 'BUSINESS',
          verificationState: 'VERIFIED',
          vettedState: 'VETTED'
        }
      ];
    }

    return await gmbErrorHandler.withRetry(
      async () => {
        await this.checkRateLimit(businessId);
        
        const accessToken = await this.getValidAccessToken(businessId);
        
        const response = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
          (error as any).response = { status: response.status, statusText: response.statusText };
          throw error;
        }

        const data = await response.json();
        return data.accounts || [];
      },
      { maxRetries: 3 },
      { 
        businessId, 
        operation: 'get_accounts'
      }
    );
  }

  /**
   * Get business locations for an account
   */
  async getBusinessLocations(businessId: string, accountName: string): Promise<any[]> {
    if (!this.isAvailable()) {
      // Return demo locations for development
      const business = await storage.getBusinessById(businessId);
      const businessName = business?.name || 'Demo Business';
      const businessAddress = business?.address || '123 Demo Street, Demo City, FL 33101';
      
      return [
        {
          name: `accounts/demo-account-123/locations/demo-location-${businessId}`,
          title: businessName,
          storefrontAddress: {
            addressLines: [businessAddress.split(',')[0]?.trim()],
            locality: 'Miami',
            administrativeArea: 'FL',
            postalCode: '33101',
            regionCode: 'US'
          },
          phoneNumbers: {
            primary: business?.phone || '(555) 123-4567'
          },
          websiteUri: business?.website || 'https://demo-business.com',
          metadata: {
            placeId: business?.googlePlaceId || `demo-place-${businessId}`,
            mapsUri: 'https://maps.google.com/demo'
          },
          categories: {
            primary: {
              displayName: business?.category || 'Local Business',
              categoryId: 'gcid:local_business'
            }
          },
          locationState: {
            isGoogleUpdated: false,
            isVerified: true,
            isPublished: true
          }
        }
      ];
    }
    
    return await gmbErrorHandler.withRetry(
      async () => {
        await this.checkRateLimit(businessId);
        
        const accessToken = await this.getValidAccessToken(businessId);
        
        const response = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
          (error as any).response = { status: response.status, statusText: response.statusText };
          throw error;
        }

        const data = await response.json();
        return data.locations || [];
      },
      { maxRetries: 3 },
      { 
        businessId, 
        operation: 'get_locations',
        accountName 
      }
    );
  }

  /**
   * Get detailed location information
   */
  async getLocationDetails(businessId: string, locationName: string): Promise<any> {
    if (!this.isAvailable()) {
      // Return demo detailed location data
      const business = await storage.getBusinessById(businessId);
      
      return {
        name: locationName,
        title: business?.name || 'Demo Business',
        storefrontAddress: {
          addressLines: [business?.address?.split(',')[0]?.trim() || '123 Demo Street'],
          locality: business?.location?.split(',')[0]?.trim() || 'Miami',
          administrativeArea: 'FL',
          postalCode: '33101',
          regionCode: 'US'
        },
        phoneNumbers: {
          primary: business?.phone || '(555) 123-4567'
        },
        websiteUri: business?.website || 'https://demo-business.com',
        regularHours: {
          periods: [
            { openDay: 'MONDAY', openTime: '09:00', closeTime: '17:00' },
            { openDay: 'TUESDAY', openTime: '09:00', closeTime: '17:00' },
            { openDay: 'WEDNESDAY', openTime: '09:00', closeTime: '17:00' },
            { openDay: 'THURSDAY', openTime: '09:00', closeTime: '17:00' },
            { openDay: 'FRIDAY', openTime: '09:00', closeTime: '17:00' },
            { openDay: 'SATURDAY', openTime: '10:00', closeTime: '14:00' }
          ]
        },
        categories: {
          primary: {
            displayName: business?.category || 'Local Business',
            categoryId: 'gcid:local_business'
          },
          additionalCategories: []
        },
        metadata: {
          placeId: business?.googlePlaceId || `demo-place-${businessId}`,
          mapsUri: 'https://maps.google.com/demo',
          newReviewUri: 'https://search.google.com/local/writereview?placeid=demo'
        },
        profile: {
          description: business?.description || 'Welcome to our business!'
        },
        locationState: {
          isGoogleUpdated: false,
          isVerified: true,
          isPublished: true,
          canModifyServiceList: true,
          canHaveFoodMenus: false
        }
      };
    }
    
    await this.checkRateLimit(businessId);
    
    try {
      const accessToken = await this.getValidAccessToken(businessId);
      
      const response = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error: any) {
      await this.logSyncEvent(businessId, 'get_location_details', 'error', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get reviews for a location
   */
  async getLocationReviews(businessId: string, locationName: string): Promise<any[]> {
    if (!this.isAvailable()) {
      // Return demo reviews for development
      const now = new Date().toISOString();
      const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      return [
        {
          reviewId: `demo-review-1-${businessId}`,
          reviewer: {
            displayName: 'John Smith',
            profilePhotoUrl: 'https://lh3.googleusercontent.com/a/demo-photo1'
          },
          starRating: 'FIVE',
          comment: 'Excellent service! The team was very professional and delivered exactly what I needed. Highly recommend!',
          createTime: daysAgo(7),
          updateTime: daysAgo(7),
          reviewReply: {
            comment: 'Thank you so much for your kind words, John! We\'re thrilled to hear you had a great experience.',
            updateTime: daysAgo(6)
          }
        },
        {
          reviewId: `demo-review-2-${businessId}`,
          reviewer: {
            displayName: 'Sarah Johnson',
            profilePhotoUrl: 'https://lh3.googleusercontent.com/a/demo-photo2'
          },
          starRating: 'FOUR',
          comment: 'Good experience overall. The product quality is great, though delivery took a bit longer than expected.',
          createTime: daysAgo(14),
          updateTime: daysAgo(14),
          reviewReply: null
        },
        {
          reviewId: `demo-review-3-${businessId}`,
          reviewer: {
            displayName: 'Mike Wilson',
            profilePhotoUrl: 'https://lh3.googleusercontent.com/a/demo-photo3'
          },
          starRating: 'FIVE',
          comment: 'Amazing! Best experience I\'ve had with a local business. Will definitely be back!',
          createTime: daysAgo(30),
          updateTime: daysAgo(30),
          reviewReply: {
            comment: 'We appreciate your business, Mike! Looking forward to serving you again soon.',
            updateTime: daysAgo(29)
          }
        }
      ];
    }
    
    return await gmbErrorHandler.withRetry(
      async () => {
        await this.checkRateLimit(businessId);
        
        const accessToken = await this.getValidAccessToken(businessId);
        
        const response = await fetch(`https://mybusiness.googleapis.com/v4/${locationName}/reviews`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
          (error as any).response = { status: response.status, statusText: response.statusText };
          throw error;
        }

        const data = await response.json();
        return data.reviews || [];
      },
      { maxRetries: 3 },
      { 
        businessId, 
        operation: 'get_reviews',
        locationName 
      }
    );
  }

  /**
   * Sync business data from GMB
   */
  async syncBusinessData(businessId: string): Promise<{ success: boolean; changes: any }> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsUpdated = 0;
    let itemsErrors = 0;
    const changes: any = {};

    try {
      await storage.updateBusinessGmbStatus(businessId, {
        gmbSyncStatus: 'syncing',
        gmbLastSyncAt: new Date()
      });

      // In demo mode, simulate a successful sync with demo data
      if (!this.isAvailable()) {
        const business = await storage.getBusinessById(businessId);
        
        // Simulate finding and syncing a matching location
        changes.businessInfo = {
          name: business?.name,
          phone: business?.phone,
          website: business?.website,
          category: business?.category,
          source: 'demo_sync'
        };
        
        // Simulate importing demo reviews
        changes.reviews = { 
          newCount: 3,
          averageRating: 4.7 
        };
        
        itemsProcessed = 5;
        itemsUpdated = 2;
        
        await storage.updateBusinessGmbStatus(businessId, {
          gmbVerified: true,
          gmbConnected: true,
          gmbAccountId: 'demo-account-123',
          gmbLocationId: `demo-location-${businessId}`,
          gmbSyncStatus: 'success',
          gmbLastSyncAt: new Date(),
          gmbLastError: null,
          gmbLastErrorAt: null
        });

        const duration = Date.now() - startTime;
        
        await this.logSyncEvent(businessId, 'full_sync', 'success', {
          changes,
          itemsProcessed,
          itemsUpdated,
          itemsErrors,
          durationMs: duration
        });

        return { success: true, changes };
      }

      // Real GMB API flow
      const accounts = await this.getBusinessAccounts(businessId);
      itemsProcessed++;

      let matchedLocation = null;
      for (const account of accounts) {
        const locations = await this.getBusinessLocations(businessId, account.name);
        itemsProcessed += locations.length;

        // Try to match location with our business
        for (const location of locations) {
          if (await this.isLocationMatch(businessId, location)) {
            matchedLocation = location;
            break;
          }
        }
        if (matchedLocation) break;
      }

      if (!matchedLocation) {
        throw new Error('No matching GMB location found for this business');
      }

      // Get detailed location information
      const locationDetails = await this.getLocationDetails(businessId, matchedLocation.name);
      itemsProcessed++;

      // Update business information
      const businessUpdates = await this.mapGmbDataToBusiness(locationDetails);
      if (Object.keys(businessUpdates).length > 0) {
        await storage.updateBusiness(businessId, businessUpdates);
        changes.businessInfo = businessUpdates;
        itemsUpdated++;
      }

      // Sync reviews
      const reviews = await this.getLocationReviews(businessId, matchedLocation.name);
      const newReviews = await this.syncReviews(businessId, reviews);
      if (newReviews.length > 0) {
        changes.reviews = { newCount: newReviews.length };
        itemsUpdated += newReviews.length;
      }
      itemsProcessed += reviews.length;

      // Update business status
      await storage.updateBusinessGmbStatus(businessId, {
        gmbVerified: true,
        gmbConnected: true,
        gmbAccountId: matchedLocation.name.split('/')[1],
        gmbLocationId: matchedLocation.name.split('/')[3],
        gmbSyncStatus: 'success',
        gmbLastSyncAt: new Date(),
        gmbLastError: null,
        gmbLastErrorAt: null
      });

      const duration = Date.now() - startTime;
      
      await this.logSyncEvent(businessId, 'full_sync', 'success', {
        changes,
        itemsProcessed,
        itemsUpdated,
        itemsErrors,
        durationMs: duration
      });

      return { success: true, changes };

    } catch (error: any) {
      itemsErrors++;
      const duration = Date.now() - startTime;

      await storage.updateBusinessGmbStatus(businessId, {
        gmbSyncStatus: 'error',
        gmbLastError: error.message,
        gmbLastErrorAt: new Date()
      });

      await this.logSyncEvent(businessId, 'full_sync', 'error', {
        error: error.message,
        itemsProcessed,
        itemsUpdated,
        itemsErrors,
        durationMs: duration
      });

      throw error;
    }
  }

  /**
   * Check if GMB location matches our business
   */
  private async isLocationMatch(businessId: string, gmbLocation: any): Promise<boolean> {
    const business = await storage.getBusinessById(businessId);
    if (!business) return false;

    // Check by Google Place ID if available
    if (business.googlePlaceId && gmbLocation.metadata?.placeId) {
      return business.googlePlaceId === gmbLocation.metadata.placeId;
    }

    // Check by name and address
    const businessName = business.name.toLowerCase().trim();
    const gmbName = gmbLocation.title?.toLowerCase().trim() || '';
    
    const nameMatch = businessName === gmbName || 
                     businessName.includes(gmbName) || 
                     gmbName.includes(businessName);

    // Basic address matching (could be enhanced)
    const businessAddress = business.address?.toLowerCase().trim() || '';
    const gmbAddress = gmbLocation.storefrontAddress?.addressLines?.join(' ').toLowerCase().trim() || '';
    
    const addressMatch = businessAddress && gmbAddress && 
                        (businessAddress.includes(gmbAddress) || gmbAddress.includes(businessAddress));

    return nameMatch && (addressMatch || !businessAddress);
  }

  /**
   * Map GMB location data to our business schema
   */
  private async mapGmbDataToBusiness(gmbLocation: any): Promise<any> {
    const updates: any = {};
    
    // Basic information
    if (gmbLocation.title) {
      updates.name = gmbLocation.title;
    }
    
    if (gmbLocation.phoneNumbers?.primary) {
      updates.phone = gmbLocation.phoneNumbers.primary;
    }
    
    if (gmbLocation.websiteUri) {
      updates.website = gmbLocation.websiteUri;
    }

    // Address
    if (gmbLocation.storefrontAddress) {
      const address = gmbLocation.storefrontAddress;
      const fullAddress = [
        address.addressLines?.join(', '),
        address.locality,
        address.administrativeArea,
        address.postalCode
      ].filter(Boolean).join(', ');
      
      updates.address = fullAddress;
      updates.location = `${address.locality}, ${address.administrativeArea}`;
    }

    // Operating hours
    if (gmbLocation.regularHours) {
      updates.operatingHours = this.formatOperatingHours(gmbLocation.regularHours);
    }

    // Categories
    if (gmbLocation.categories?.primary) {
      updates.category = gmbLocation.categories.primary.displayName;
    }

    // Mark data source
    updates.gmbDataSources = {
      name: gmbLocation.title ? 'gmb' : 'local',
      phone: gmbLocation.phoneNumbers?.primary ? 'gmb' : 'local',
      website: gmbLocation.websiteUri ? 'gmb' : 'local',
      address: gmbLocation.storefrontAddress ? 'gmb' : 'local',
      operatingHours: gmbLocation.regularHours ? 'gmb' : 'local',
      category: gmbLocation.categories?.primary ? 'gmb' : 'local'
    };

    return updates;
  }

  /**
   * Format operating hours from GMB format
   */
  private formatOperatingHours(regularHours: any): any {
    const formatted: any = {};
    
    for (const period of regularHours.periods || []) {
      if (period.openDay && period.openTime && period.closeTime) {
        const day = this.mapGmbDayToWeekday(period.openDay);
        formatted[day] = {
          open: period.openTime,
          close: period.closeTime,
          isClosed: false
        };
      }
    }

    return formatted;
  }

  /**
   * Map GMB day format to our weekday format
   */
  private mapGmbDayToWeekday(gmbDay: string): string {
    const mapping: Record<string, string> = {
      'MONDAY': 'monday',
      'TUESDAY': 'tuesday', 
      'WEDNESDAY': 'wednesday',
      'THURSDAY': 'thursday',
      'FRIDAY': 'friday',
      'SATURDAY': 'saturday',
      'SUNDAY': 'sunday'
    };
    return mapping[gmbDay] || gmbDay.toLowerCase();
  }

  /**
   * Sync reviews from GMB
   */
  private async syncReviews(businessId: string, gmbReviews: any[]): Promise<any[]> {
    const newReviews: any[] = [];

    for (const gmbReview of gmbReviews) {
      try {
        // Check if review already exists
        const existingReview = await storage.getGmbReviewByGmbId(businessId, gmbReview.reviewId);
        
        if (!existingReview) {
          // Convert star rating from string to number
          const ratingMap: Record<string, number> = {
            'ONE': 1,
            'TWO': 2,
            'THREE': 3,
            'FOUR': 4,
            'FIVE': 5
          };
          
          const reviewData: InsertGmbReview = {
            businessId,
            gmbReviewId: gmbReview.reviewId,
            reviewerName: gmbReview.reviewer?.displayName || 'Anonymous',
            reviewerPhotoUrl: gmbReview.reviewer?.profilePhotoUrl || null,
            rating: ratingMap[gmbReview.starRating] || 5,
            comment: gmbReview.comment || '',
            reviewTime: new Date(gmbReview.createTime),
            replyComment: gmbReview.reviewReply?.comment || null,
            replyTime: gmbReview.reviewReply?.updateTime ? new Date(gmbReview.reviewReply.updateTime) : null,
            gmbCreateTime: new Date(gmbReview.createTime),
            gmbUpdateTime: new Date(gmbReview.updateTime)
          };

          await storage.createGmbReview(reviewData);
          newReviews.push(reviewData);
        } else {
          // Update existing review if reply was added
          if (gmbReview.reviewReply?.comment && !existingReview.replyComment) {
            await storage.updateGmbReview(existingReview.id, {
              replyComment: gmbReview.reviewReply.comment,
              replyTime: gmbReview.reviewReply?.updateTime ? new Date(gmbReview.reviewReply.updateTime) : null,
              lastSyncedAt: new Date()
            });
          }
        }
      } catch (error) {
        console.error('Error syncing review:', error);
      }
    }

    return newReviews;
  }

  /**
   * Rate limiting check
   */
  private async checkRateLimit(businessId: string): Promise<void> {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT.windowMs;
    
    if (!RATE_LIMIT.requests.has(businessId)) {
      RATE_LIMIT.requests.set(businessId, []);
    }

    const requests = RATE_LIMIT.requests.get(businessId)!;
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= RATE_LIMIT.maxRequests) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    validRequests.push(now);
    RATE_LIMIT.requests.set(businessId, validRequests);
  }

  /**
   * Log sync events for audit trail
   */
  private async logSyncEvent(
    businessId: string, 
    syncType: string, 
    status: 'success' | 'error' | 'partial', 
    details: any
  ): Promise<void> {
    try {
      const syncData: InsertGmbSyncHistory = {
        businessId,
        syncType,
        status,
        dataTypes: details.changes ? Object.keys(details.changes) : [],
        changes: details.changes || null,
        errorDetails: details.error || null,
        itemsProcessed: details.itemsProcessed || 0,
        itemsUpdated: details.itemsUpdated || 0,
        itemsErrors: details.itemsErrors || 0,
        durationMs: details.durationMs || null,
        triggeredBy: 'manual',
        gmbApiVersion: 'v4.9'
      };

      await storage.createGmbSyncHistory(syncData);
    } catch (error) {
      console.error('Failed to log sync event:', error);
    }
  }

  /**
   * Encrypt token for secure storage using AES-256-GCM (authenticated encryption)
   * Format: v2:iv:ciphertext:authTag (all hex-encoded)
   */
  private encryptToken(token: string): string {
    // Generate a random initialization vector (12 bytes is standard for GCM)
    const iv = crypto.randomBytes(12);
    
    // Create cipher with key (must be 32 bytes for aes-256)
    const keyBuffer = Buffer.from(this.encryptionKey, 'hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    
    // Encrypt the token
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the authentication tag (16 bytes)
    const authTag = cipher.getAuthTag();
    
    // Return versioned format: v2:iv:ciphertext:authTag
    return `v2:${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  }

  /**
   * Decrypt token from storage with backward compatibility
   * Supports v2 (AES-256-GCM), legacy CBC (iv:ciphertext), and oldest password-based formats
   * Automatically migrates legacy tokens to v2 format
   */
  private async decryptToken(encryptedToken: string, businessId?: string): Promise<string> {
    // Check if this is a v2 token (GCM with auth tag)
    if (encryptedToken.startsWith('v2:')) {
      return this.decryptTokenV2(encryptedToken);
    }
    
    // Check if this is a legacy token with IV (CBC format: iv:ciphertext)
    if (encryptedToken.includes(':')) {
      const parts = encryptedToken.split(':');
      if (parts.length === 2) {
        // Attempt legacy CBC decryption
        const decrypted = this.decryptTokenLegacyCBC(encryptedToken);
        
        // If we have a businessId, migrate the token to v2 format
        if (businessId && decrypted) {
          try {
            const reencrypted = this.encryptToken(decrypted);
            
            // Update the token in database with new encrypted value
            const tokenRecord = await storage.getGmbToken(businessId);
            if (tokenRecord) {
              // Check if this is the access token or refresh token being decrypted
              const isAccessToken = tokenRecord.accessToken === encryptedToken;
              const isRefreshToken = tokenRecord.refreshToken === encryptedToken;
              
              if (isAccessToken) {
                await storage.updateGmbToken(businessId, {
                  accessToken: reencrypted,
                  updatedAt: new Date()
                });
                console.info(`✓ Migrated access token from legacy CBC to v2 format for business ${businessId}`);
              } else if (isRefreshToken) {
                await storage.updateGmbToken(businessId, {
                  refreshToken: reencrypted,
                  updatedAt: new Date()
                });
                console.info(`✓ Migrated refresh token from legacy CBC to v2 format for business ${businessId}`);
              }
            }
          } catch (migrationError) {
            console.error('Failed to migrate CBC token to v2 format:', migrationError);
            // Continue with decrypted value even if migration fails
          }
        }
        
        return decrypted;
      }
    }
    
    // This must be the oldest legacy format (single hex string, no colons, password-based KDF)
    return await this.decryptTokenLegacyPassword(encryptedToken, businessId);
  }

  /**
   * Decrypt v2 token using AES-256-GCM
   */
  private decryptTokenV2(encryptedToken: string): string {
    // Parse format: v2:iv:ciphertext:authTag
    const parts = encryptedToken.split(':');
    
    if (parts.length !== 4 || parts[0] !== 'v2') {
      throw new Error('Invalid v2 token format');
    }
    
    const iv = Buffer.from(parts[1], 'hex');
    const encryptedData = parts[2];
    const authTag = Buffer.from(parts[3], 'hex');
    
    // Create decipher with key (must be 32 bytes for aes-256)
    const keyBuffer = Buffer.from(this.encryptionKey, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    
    // Set the authentication tag
    decipher.setAuthTag(authTag);
    
    // Decrypt the token
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Decrypt legacy CBC token using AES-256-CBC with explicit IV (for backward compatibility)
   * Format: iv:ciphertext
   */
  private decryptTokenLegacyCBC(encryptedToken: string): string {
    // Parse format: iv:ciphertext
    const parts = encryptedToken.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid legacy CBC token format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    // Create decipher with key (must be 32 bytes for aes-256)
    const keyBuffer = Buffer.from(this.encryptionKey, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    
    // Decrypt the token
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Decrypt oldest legacy token using password-based KDF (for backward compatibility)
   * Format: single hex string (no IV, no colons)
   * Uses OpenSSL-compatible password-based key derivation
   */
  private async decryptTokenLegacyPassword(encryptedToken: string, businessId?: string): Promise<string> {
    try {
      // Validate it's a hex string
      if (!/^[0-9a-fA-F]+$/.test(encryptedToken)) {
        throw new Error('Invalid token format: not a valid hex string');
      }
      
      // Use createDecipher which implements OpenSSL's EVP_BytesToKey for password-based KDF
      // This is the oldest format that derives key and IV from the password
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      
      // Decrypt the token
      let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // If we have a businessId, migrate the token to v2 format
      if (businessId && decrypted) {
        try {
          const reencrypted = this.encryptToken(decrypted);
          
          // Update the token in database with new encrypted value
          const tokenRecord = await storage.getGmbToken(businessId);
          if (tokenRecord) {
            // Check if this is the access token or refresh token being decrypted
            const isAccessToken = tokenRecord.accessToken === encryptedToken;
            const isRefreshToken = tokenRecord.refreshToken === encryptedToken;
            
            if (isAccessToken) {
              await storage.updateGmbToken(businessId, {
                accessToken: reencrypted,
                updatedAt: new Date()
              });
              console.info(`✓ Migrated access token from oldest password-based format to v2 for business ${businessId}`);
            } else if (isRefreshToken) {
              await storage.updateGmbToken(businessId, {
                refreshToken: reencrypted,
                updatedAt: new Date()
              });
              console.info(`✓ Migrated refresh token from oldest password-based format to v2 for business ${businessId}`);
            }
          }
        } catch (migrationError) {
          console.error('Failed to migrate password-based token to v2 format:', migrationError);
          // Continue with decrypted value even if migration fails
        }
      }
      
      return decrypted;
    } catch (error: any) {
      throw new Error('Failed to decrypt token: invalid format or encryption key');
    }
  }

  /**
   * Disconnect GMB integration for a business
   */
  async disconnectBusiness(businessId: string): Promise<void> {
    try {
      // Deactivate token
      await storage.updateGmbToken(businessId, { isActive: false });
      
      // Update business status
      await storage.updateBusinessGmbStatus(businessId, {
        gmbConnected: false,
        gmbVerified: false,
        gmbSyncStatus: 'disconnected',
        gmbAccountId: null,
        gmbLocationId: null
      });

      await this.logSyncEvent(businessId, 'disconnect', 'success', {
        message: 'Successfully disconnected from Google My Business'
      });

    } catch (error: any) {
      await this.logSyncEvent(businessId, 'disconnect', 'error', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get sync status for a business
   */
  async getSyncStatus(businessId: string): Promise<any> {
    const business = await storage.getBusinessById(businessId);
    const token = await storage.getGmbToken(businessId);
    const recentSyncHistory = await storage.getRecentGmbSyncHistory(businessId, 5);

    return {
      connected: business?.gmbConnected || false,
      verified: business?.gmbVerified || false,
      syncStatus: business?.gmbSyncStatus || 'none',
      lastSync: business?.gmbLastSyncAt,
      lastError: business?.gmbLastError,
      lastErrorAt: business?.gmbLastErrorAt,
      tokenValid: token?.isActive && token.expiresAt > new Date(),
      accountId: business?.gmbAccountId,
      locationId: business?.gmbLocationId,
      recentHistory: recentSyncHistory
    };
  }
}

// Export singleton instance
export const gmbService = new GMBService();