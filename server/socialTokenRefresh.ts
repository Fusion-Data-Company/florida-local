/**
 * Automatic Social Media Token Refresh Service
 *
 * Automatically refreshes OAuth tokens for social media accounts before they expire.
 * Runs as a background job and ensures uninterrupted social media integrations.
 */

import { db } from './db';
import { socialAccounts, socialTokens } from '@shared/schema';
import { eq, and, lt, isNotNull } from 'drizzle-orm';
import { logger } from './monitoring';

// OAuth configurations (imported from socialAuthRoutes but kept DRY)
const TOKEN_REFRESH_CONFIGS = {
  facebook: {
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  },
  instagram: {
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  },
  twitter: {
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
  },
  linkedin: {
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  },
  tiktok: {
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token',
    clientId: process.env.TIKTOK_CLIENT_KEY,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
  },
  pinterest: {
    tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
    clientId: process.env.PINTEREST_CLIENT_ID,
    clientSecret: process.env.PINTEREST_CLIENT_SECRET,
  },
  youtube: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
};

/**
 * Refresh a single social media token
 */
async function refreshSocialToken(
  accountId: string,
  platform: string,
  refreshToken: string
): Promise<boolean> {
  try {
    const config = TOKEN_REFRESH_CONFIGS[platform as keyof typeof TOKEN_REFRESH_CONFIGS];

    if (!config || !config.clientId || !config.clientSecret) {
      logger.warn(`Token refresh skipped: ${platform} not configured`, { accountId });
      return false;
    }

    logger.info(`Refreshing token for ${platform}`, { accountId });

    // Refresh the token
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      logger.error(`Token refresh failed for ${platform}`, {
        accountId,
        error: tokenData.error || 'No access token in response'
      });
      return false;
    }

    // Update tokens in database
    await db.update(socialTokens)
      .set({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken, // Keep old refresh token if not provided
        expiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        updatedAt: new Date(),
      })
      .where(eq(socialTokens.socialAccountId, accountId));

    logger.info(`✅ Token refreshed successfully for ${platform}`, { accountId });
    return true;
  } catch (error) {
    logger.error(`Token refresh error for ${platform}`, {
      accountId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

/**
 * Find and refresh tokens that are about to expire
 * Refreshes tokens that expire within the next 24 hours
 */
export async function refreshExpiringTokens(): Promise<void> {
  try {
    const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    logger.info('🔄 Starting token refresh job...');

    // Find all tokens expiring within 24 hours
    const expiringTokens = await db
      .select({
        accountId: socialTokens.socialAccountId,
        platform: socialAccounts.platform,
        refreshToken: socialTokens.refreshToken,
        expiresAt: socialTokens.expiresAt,
      })
      .from(socialTokens)
      .innerJoin(socialAccounts, eq(socialTokens.socialAccountId, socialAccounts.id))
      .where(
        and(
          lt(socialTokens.expiresAt, oneDayFromNow), // Expires within 24 hours
          isNotNull(socialTokens.refreshToken), // Has a refresh token
          eq(socialAccounts.isActive, true) // Account is active
        )
      );

    if (expiringTokens.length === 0) {
      logger.info('✅ No tokens need refreshing');
      return;
    }

    logger.info(`Found ${expiringTokens.length} tokens to refresh`, {
      platforms: expiringTokens.map(t => t.platform),
    });

    // Refresh each token
    let successCount = 0;
    let failureCount = 0;

    for (const token of expiringTokens) {
      const success = await refreshSocialToken(
        token.accountId,
        token.platform,
        token.refreshToken!
      );

      if (success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.info(`🎯 Token refresh job completed`, {
      total: expiringTokens.length,
      success: successCount,
      failed: failureCount,
    });
  } catch (error) {
    logger.error('Token refresh job error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Start the automatic token refresh service
 * Runs every 4 hours by default
 */
export function startTokenRefreshService(intervalHours: number = 4): NodeJS.Timeout {
  const intervalMs = intervalHours * 60 * 60 * 1000;

  logger.info(`🚀 Starting automatic token refresh service (every ${intervalHours} hours)`);

  // Run immediately on startup
  refreshExpiringTokens().catch(error => {
    logger.error('Initial token refresh failed', { error });
  });

  // Then run periodically
  const interval = setInterval(() => {
    refreshExpiringTokens().catch(error => {
      logger.error('Scheduled token refresh failed', { error });
    });
  }, intervalMs);

  return interval;
}

/**
 * Manually refresh a specific account's token
 */
export async function refreshAccountToken(accountId: string): Promise<boolean> {
  try {
    const result = await db
      .select({
        platform: socialAccounts.platform,
        refreshToken: socialTokens.refreshToken,
      })
      .from(socialTokens)
      .innerJoin(socialAccounts, eq(socialTokens.socialAccountId, socialAccounts.id))
      .where(eq(socialTokens.socialAccountId, accountId))
      .limit(1);

    if (result.length === 0 || !result[0].refreshToken) {
      logger.warn('Account not found or no refresh token', { accountId });
      return false;
    }

    return await refreshSocialToken(
      accountId,
      result[0].platform,
      result[0].refreshToken
    );
  } catch (error) {
    logger.error('Manual token refresh failed', {
      accountId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

/**
 * Get token refresh status for all accounts
 */
export async function getTokenRefreshStatus() {
  try {
    const allTokens = await db
      .select({
        accountId: socialTokens.socialAccountId,
        platform: socialAccounts.platform,
        userId: socialAccounts.userId,
        hasRefreshToken: isNotNull(socialTokens.refreshToken),
        expiresAt: socialTokens.expiresAt,
        lastUpdated: socialTokens.updatedAt,
      })
      .from(socialTokens)
      .innerJoin(socialAccounts, eq(socialTokens.socialAccountId, socialAccounts.id))
      .where(eq(socialAccounts.isActive, true));

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return allTokens.map(token => ({
      ...token,
      status: !token.expiresAt
        ? 'no_expiry'
        : token.expiresAt < now
        ? 'expired'
        : token.expiresAt < oneDayFromNow
        ? 'expiring_soon'
        : 'valid',
      needsRefresh: token.hasRefreshToken && token.expiresAt && token.expiresAt < oneDayFromNow,
    }));
  } catch (error) {
    logger.error('Failed to get token refresh status', { error });
    return [];
  }
}
