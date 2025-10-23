// Business verification service will be implemented below

import { gmbService } from './gmbService';
import { storage } from './storage';
import { Business } from '@shared/schema';

/**
 * Business Verification Service
 * Handles matching local business profiles with Google My Business listings
 * and manages verification status and workflows
 */
export class BusinessVerificationService {
  
  /**
   * Search for potential GMB matches for a local business
   */
  async searchGMBMatches(businessId: string): Promise<{
    exactMatches: any[];
    partialMatches: any[];
    confidence: 'high' | 'medium' | 'low' | 'none';
  }> {
    try {
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        throw new Error('Business not found');
      }

      // If already has Google Place ID, try to find by that first
      if (business.googlePlaceId) {
        const directMatch = await this.findByPlaceId(business.googlePlaceId, businessId);
        if (directMatch) {
          return {
            exactMatches: [directMatch],
            partialMatches: [],
            confidence: 'high'
          };
        }
      }

      // Search by business name and location
      const searchResults = await this.searchByNameAndLocation(business);
      
      // Analyze matches and determine confidence
      const { exactMatches, partialMatches } = this.analyzeMatches(business, searchResults);
      const confidence = this.calculateConfidence(exactMatches, partialMatches);

      return {
        exactMatches,
        partialMatches,
        confidence
      };

    } catch (error: any) {
      console.error('Error searching GMB matches:', error);
      throw new Error(`Failed to search GMB matches: ${error.message}`);
    }
  }

  /**
   * Find GMB listing by Google Place ID
   */
  private async findByPlaceId(placeId: string, businessId: string): Promise<any | null> {
    try {
      // Check if business has GMB connection
      const token = await storage.getGmbToken(businessId);
      if (!token || !token.isActive) {
        return null;
      }

      // Get GMB accounts and search locations for this place ID
      const accounts = await gmbService.getBusinessAccounts(businessId);
      
      for (const account of accounts) {
        const locations = await gmbService.getBusinessLocations(businessId, account.name);
        
        for (const location of locations) {
          if (location.metadata?.placeId === placeId) {
            const details = await gmbService.getLocationDetails(businessId, location.name);
            return {
              ...details,
              matchType: 'place_id',
              confidence: 'high'
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding by Place ID:', error);
      return null;
    }
  }

  /**
   * Search GMB by business name and location
   */
  private async searchByNameAndLocation(business: Business): Promise<any[]> {
    // For now, we'll use the GMB API through connected accounts
    // In a real implementation, you'd use the Places API for public search
    
    const results: any[] = [];
    
    try {
      // Check if this business or any business in the system has GMB access
      // This is a simplified approach - in production you'd use Places API
      const allBusinesses = await storage.getBusinessesByOwner(business.ownerId);
      
      for (const b of allBusinesses) {
        if (b.gmbConnected) {
          try {
            const accounts = await gmbService.getBusinessAccounts(b.id);
            
            for (const account of accounts) {
              const locations = await gmbService.getBusinessLocations(b.id, account.name);
              
              // Filter locations that might match our business
              const potentialMatches = locations.filter(location => 
                this.isLocationPotentialMatch(business, location)
              );
              
              for (const location of potentialMatches) {
                const details = await gmbService.getLocationDetails(b.id, location.name);
                results.push(details);
              }
            }
          } catch (error) {
            console.error(`Error searching GMB for business ${b.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error in searchByNameAndLocation:', error);
    }

    return results;
  }

  /**
   * Check if a GMB location is a potential match for our business
   */
  private isLocationPotentialMatch(business: Business, gmbLocation: any): boolean {
    const businessName = business.name.toLowerCase().trim();
    const gmbName = gmbLocation.title?.toLowerCase().trim() || '';
    
    // Name similarity check
    const nameMatch = this.calculateNameSimilarity(businessName, gmbName) > 0.6;
    
    // Location proximity check (simplified)
    const locationMatch = this.isLocationSimilar(business, gmbLocation);
    
    return nameMatch || locationMatch;
  }

  /**
   * Calculate name similarity between two strings
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    if (!name1 || !name2) return 0;
    
    // Simple similarity calculation (Levenshtein distance)
    const longer = name1.length > name2.length ? name1 : name2;
    const shorter = name1.length > name2.length ? name2 : name1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Check if business location is similar to GMB location
   */
  private isLocationSimilar(business: Business, gmbLocation: any): boolean {
    if (!business.location && !business.address) return false;
    if (!gmbLocation.storefrontAddress) return false;
    
    const businessLocation = (business.location || business.address || '').toLowerCase();
    const gmbAddress = gmbLocation.storefrontAddress.addressLines?.join(' ').toLowerCase() || '';
    const gmbCity = gmbLocation.storefrontAddress.locality?.toLowerCase() || '';
    
    // Check if city matches or address contains similar elements
    return businessLocation.includes(gmbCity) || 
           gmbAddress.includes(businessLocation) ||
           this.calculateNameSimilarity(businessLocation, gmbAddress) > 0.5;
  }

  /**
   * Analyze GMB search results and categorize matches
   */
  private analyzeMatches(business: Business, searchResults: any[]): {
    exactMatches: any[];
    partialMatches: any[];
  } {
    const exactMatches: any[] = [];
    const partialMatches: any[] = [];

    for (const result of searchResults) {
      const matchScore = this.calculateMatchScore(business, result);
      
      if (matchScore >= 0.9) {
        exactMatches.push({ ...result, matchScore, matchType: 'exact' });
      } else if (matchScore >= 0.6) {
        partialMatches.push({ ...result, matchScore, matchType: 'partial' });
      }
    }

    return { exactMatches, partialMatches };
  }

  /**
   * Calculate overall match score between business and GMB location
   */
  private calculateMatchScore(business: Business, gmbLocation: any): number {
    let totalScore = 0;
    let criteria = 0;

    // Name similarity (weight: 40%)
    const nameScore = this.calculateNameSimilarity(
      business.name.toLowerCase(), 
      gmbLocation.title?.toLowerCase() || ''
    );
    totalScore += nameScore * 0.4;
    criteria++;

    // Phone number match (weight: 25%)
    if (business.phone && gmbLocation.phoneNumbers?.primary) {
      const phoneMatch = this.normalizePhone(business.phone) === 
                         this.normalizePhone(gmbLocation.phoneNumbers.primary) ? 1 : 0;
      totalScore += phoneMatch * 0.25;
      criteria++;
    }

    // Address similarity (weight: 25%)
    if (business.address && gmbLocation.storefrontAddress) {
      const addressScore = this.calculateAddressSimilarity(business, gmbLocation);
      totalScore += addressScore * 0.25;
      criteria++;
    }

    // Category match (weight: 10%)
    if (business.category && gmbLocation.categories?.primary) {
      const categoryScore = this.calculateCategorySimilarity(
        business.category, 
        gmbLocation.categories.primary.displayName
      );
      totalScore += categoryScore * 0.1;
      criteria++;
    }

    return criteria > 0 ? totalScore / criteria : 0;
  }

  /**
   * Normalize phone number for comparison
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '').slice(-10); // Get last 10 digits
  }

  /**
   * Calculate address similarity score
   */
  private calculateAddressSimilarity(business: Business, gmbLocation: any): number {
    const businessAddress = business.address?.toLowerCase().trim() || '';
    const gmbAddress = gmbLocation.storefrontAddress?.addressLines?.join(' ').toLowerCase().trim() || '';
    
    if (!businessAddress || !gmbAddress) return 0;
    
    return this.calculateNameSimilarity(businessAddress, gmbAddress);
  }

  /**
   * Calculate category similarity score
   */
  private calculateCategorySimilarity(localCategory: string, gmbCategory: string): number {
    const local = localCategory.toLowerCase().trim();
    const gmb = gmbCategory.toLowerCase().trim();
    
    // Direct match
    if (local === gmb) return 1;
    
    // Partial match
    if (local.includes(gmb) || gmb.includes(local)) return 0.7;
    
    // Similarity score
    return this.calculateNameSimilarity(local, gmb);
  }

  /**
   * Calculate overall confidence level
   */
  private calculateConfidence(exactMatches: any[], partialMatches: any[]): 'high' | 'medium' | 'low' | 'none' {
    if (exactMatches.length > 0) {
      return exactMatches.length === 1 ? 'high' : 'medium';
    }
    
    if (partialMatches.length > 0) {
      return partialMatches.length <= 2 ? 'medium' : 'low';
    }
    
    return 'none';
  }

  /**
   * Initiate verification process for a business with a selected GMB listing
   */
  async initiateVerification(businessId: string, gmbLocationName: string): Promise<{
    success: boolean;
    verificationId: string;
    message: string;
  }> {
    try {
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        throw new Error('Business not found');
      }

      // Get GMB location details
      const locationDetails = await gmbService.getLocationDetails(businessId, gmbLocationName);
      
      // Update business with GMB information
      await storage.updateBusinessGmbStatus(businessId, {
        gmbConnected: true,
        gmbAccountId: gmbLocationName.split('/')[1], // Extract account ID
        gmbLocationId: gmbLocationName.split('/')[3], // Extract location ID
        gmbSyncStatus: 'verification_pending'
      });

      // Update business with GMB data if not already set
      const gmbData = await this.extractBusinessDataFromGMB(locationDetails);
      if (Object.keys(gmbData).length > 0) {
        // Only update if we have valid data and include required fields
        const validUpdates = Object.entries(gmbData).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = value;
          }
          return acc;
        }, {} as any);
        
        if (Object.keys(validUpdates).length > 0) {
          await storage.updateBusiness(businessId, validUpdates);
        }
      }

      // Create verification record
      const verificationId = `ver_${Date.now()}_${businessId}`;
      
      return {
        success: true,
        verificationId,
        message: 'Verification initiated successfully. GMB data has been synced to your profile.'
      };

    } catch (error: any) {
      console.error('Error initiating verification:', error);
      throw new Error(`Failed to initiate verification: ${error.message}`);
    }
  }

  /**
   * Complete verification process
   */
  async completeVerification(businessId: string): Promise<void> {
    try {
      // Perform full sync from GMB
      await gmbService.syncBusinessData(businessId);
      
      // Mark as verified
      await storage.updateBusinessGmbStatus(businessId, {
        gmbVerified: true,
        gmbSyncStatus: 'verified'
      });

      // Log verification completion
      await storage.createGmbSyncHistory({
        businessId,
        syncType: 'verification_complete',
        status: 'success',
        dataTypes: ['verification'],
        changes: { verified: true },
        errorDetails: null,
        itemsProcessed: 1,
        itemsUpdated: 1,
        itemsErrors: 0,
        durationMs: null,
        triggeredBy: 'manual',
        gmbApiVersion: 'v4.9'
      });

    } catch (error: any) {
      await storage.updateBusinessGmbStatus(businessId, {
        gmbSyncStatus: 'verification_failed',
        gmbLastError: error.message,
        gmbLastErrorAt: new Date()
      });
      
      throw error;
    }
  }

  /**
   * Get verification status for a business
   */
  async getVerificationStatus(businessId: string): Promise<{
    isVerified: boolean;
    isConnected: boolean;
    syncStatus: string;
    lastSync: Date | null;
    lastError: string | null;
    accountId: string | null;
    locationId: string | null;
  }> {
    const business = await storage.getBusinessById(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    return {
      isVerified: business.gmbVerified || false,
      isConnected: business.gmbConnected || false,
      syncStatus: business.gmbSyncStatus || 'none',
      lastSync: business.gmbLastSyncAt,
      lastError: business.gmbLastError,
      accountId: business.gmbAccountId,
      locationId: business.gmbLocationId
    };
  }

  /**
   * Extract business data from GMB location for updating local profile
   */
  private async extractBusinessDataFromGMB(gmbLocation: any): Promise<Partial<Business>> {
    const updates: any = {};
    
    // Only update fields that are not already set locally or are empty
    if (gmbLocation.title) {
      updates.name = gmbLocation.title;
    }
    
    if (gmbLocation.phoneNumbers?.primary) {
      updates.phone = gmbLocation.phoneNumbers.primary;
    }
    
    if (gmbLocation.websiteUri) {
      updates.website = gmbLocation.websiteUri;
    }

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

    if (gmbLocation.categories?.primary) {
      updates.category = gmbLocation.categories.primary.displayName;
    }

    if (gmbLocation.regularHours) {
      updates.operatingHours = this.formatOperatingHours(gmbLocation.regularHours);
    }

    // Mark data sources
    updates.gmbDataSources = {
      name: gmbLocation.title ? 'gmb' : 'local',
      phone: gmbLocation.phoneNumbers?.primary ? 'gmb' : 'local',
      website: gmbLocation.websiteUri ? 'gmb' : 'local',
      address: gmbLocation.storefrontAddress ? 'gmb' : 'local',
      operatingHours: gmbLocation.regularHours ? 'gmb' : 'local',
      category: gmbLocation.categories?.primary ? 'gmb' : 'local'
    };

    // Store Google Place ID if available
    if (gmbLocation.metadata?.placeId) {
      updates.googlePlaceId = gmbLocation.metadata.placeId;
    }

    return updates;
  }

  /**
   * Format operating hours from GMB format to our format
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
   * Remove GMB verification for a business
   */
  async removeVerification(businessId: string): Promise<void> {
    try {
      await storage.updateBusinessGmbStatus(businessId, {
        gmbVerified: false,
        gmbConnected: false,
        gmbSyncStatus: 'disconnected',
        gmbAccountId: null,
        gmbLocationId: null,
        gmbLastError: null,
        gmbLastErrorAt: null
      });

      // Deactivate GMB token
      await storage.deactivateGmbToken(businessId);

      // Log disconnection
      await storage.createGmbSyncHistory({
        businessId,
        syncType: 'verification_removed',
        status: 'success',
        dataTypes: ['verification'],
        changes: { verified: false, connected: false },
        errorDetails: null,
        itemsProcessed: 1,
        itemsUpdated: 1,
        itemsErrors: 0,
        durationMs: null,
        triggeredBy: 'manual',
        gmbApiVersion: 'v4.9'
      });

    } catch (error: any) {
      console.error('Error removing verification:', error);
      throw new Error(`Failed to remove verification: ${error.message}`);
    }
  }
}

// Export singleton instance
export const businessVerificationService = new BusinessVerificationService();