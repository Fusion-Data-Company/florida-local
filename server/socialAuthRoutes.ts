/**
 * Social Media OAuth Routes
 *
 * Handles OAuth authentication for social media platforms:
 * - Facebook/Instagram (Meta)
 * - Twitter/X
 * - LinkedIn
 * - TikTok
 * - Pinterest
 * - YouTube (Google)
 */

import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { db } from './db';
import { socialAccounts, socialTokens } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { redis, cache } from './redis';

// OAuth configurations for each platform
const OAUTH_CONFIGS = {
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
      'business_management'
    ],
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET
  },
  instagram: {
    // Instagram uses Facebook OAuth
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: [
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
      'instagram_manage_comments',
      'pages_show_list'
    ],
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: [
      'tweet.read',
      'tweet.write',
      'users.read',
      'follows.read',
      'follows.write',
      'offline.access'
    ],
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: [
      'r_liteprofile',
      'r_emailaddress',
      'w_member_social',
      'r_organization_social',
      'w_organization_social',
      'rw_organization_admin'
    ],
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/v2/auth/authorize',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token',
    scopes: [
      'user.info.basic',
      'video.list',
      'video.upload',
      'video.publish'
    ],
    clientId: process.env.TIKTOK_CLIENT_KEY,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET
  },
  pinterest: {
    authUrl: 'https://www.pinterest.com/oauth/',
    tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
    scopes: [
      'boards:read',
      'boards:write',
      'pins:read',
      'pins:write',
      'user_accounts:read'
    ],
    clientId: process.env.PINTEREST_CLIENT_ID,
    clientSecret: process.env.PINTEREST_CLIENT_SECRET
  },
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly'
    ],
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  }
};

// Generate secure state parameter for OAuth
function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ============================================================================
// PRODUCTION-READY: OAuth State Management with Redis
// ============================================================================
// OAuth state TTL: 10 minutes (states expire automatically)
const OAUTH_STATE_TTL = 600;

async function storeOAuthState(
  state: string,
  data: { userId: string; businessId: string; platform: string }
): Promise<void> {
  const key = `oauth:state:${state}`;
  await cache.set(key, data, OAUTH_STATE_TTL);
  console.log(`✅ OAuth state stored: ${state.substring(0, 8)}... (platform: ${data.platform})`);
}

async function getOAuthState(
  state: string
): Promise<{ userId: string; businessId: string; platform: string } | null> {
  const key = `oauth:state:${state}`;
  const data = await cache.get<{ userId: string; businessId: string; platform: string }>(key);
  if (data) {
    console.log(`✅ OAuth state retrieved: ${state.substring(0, 8)}... (platform: ${data.platform})`);
  } else {
    console.warn(`❌ OAuth state not found or expired: ${state.substring(0, 8)}...`);
  }
  return data;
}

async function deleteOAuthState(state: string): Promise<void> {
  const key = `oauth:state:${state}`;
  await redis.del(key);
  console.log(`🗑️  OAuth state deleted: ${state.substring(0, 8)}...`);
}

export function registerSocialAuthRoutes(app: Express) {

  /**
   * GET /api/social/auth/:platform
   * Initiate OAuth flow for a social platform
   */
  app.get('/api/social/auth/:platform', async (req: Request, res: Response) => {
    try {
      const { platform } = req.params;
      const { businessId } = req.query;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const config = OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS];
      if (!config) {
        return res.status(400).json({ error: 'Invalid platform' });
      }

      if (!config.clientId) {
        return res.status(500).json({
          error: `${platform} OAuth not configured. Please set environment variables.`
        });
      }

      // Generate state and store it in Redis (production-ready)
      const state = generateState();
      await storeOAuthState(state, {
        userId,
        businessId: businessId as string,
        platform
      });

      // Build redirect URL
      const redirectUri = `${process.env.VITE_API_URL || 'http://localhost:5000'}/api/social/callback/${platform}`;

      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: config.scopes.join(' '),
        state,
        access_type: platform === 'youtube' ? 'offline' : undefined,
        prompt: platform === 'youtube' ? 'consent' : undefined,
      }.filter(([_, v]) => v !== undefined) as any);

      const authUrl = `${config.authUrl}?${params}`;

      res.json({ authUrl });
    } catch (error) {
      console.error('OAuth initiation error:', error);
      res.status(500).json({ error: 'Failed to initiate OAuth flow' });
    }
  });

  /**
   * GET /api/social/callback/:platform
   * Handle OAuth callback from social platform
   */
  app.get('/api/social/callback/:platform', async (req: Request, res: Response) => {
    try {
      const { platform } = req.params;
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(`/social-hub?error=${error}`);
      }

      if (!code || !state) {
        return res.redirect('/social-hub?error=missing_params');
      }

      // Verify state from Redis (production-ready)
      const stateData = await getOAuthState(state as string);
      if (!stateData) {
        console.error('❌ Invalid or expired OAuth state:', state);
        return res.redirect('/social-hub?error=invalid_state');
      }

      // Delete state after use to prevent replay attacks
      await deleteOAuthState(state as string);

      const config = OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS];
      if (!config) {
        return res.redirect('/social-hub?error=invalid_platform');
      }

      // Exchange code for token
      const redirectUri = `${process.env.VITE_API_URL || 'http://localhost:5000'}/api/social/callback/${platform}`;

      const tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: redirectUri,
          client_id: config.clientId!,
          client_secret: config.clientSecret!,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        console.error('Token exchange failed:', tokenData);
        return res.redirect('/social-hub?error=token_exchange_failed');
      }

      // Get user profile from the platform
      const profileData = await fetchSocialProfile(platform, tokenData.access_token);

      // Store the social account
      const [socialAccount] = await db.insert(socialAccounts)
        .values({
          id: crypto.randomUUID(),
          userId: stateData.userId,
          businessId: stateData.businessId,
          platform,
          accountId: profileData.id,
          accountName: profileData.name || profileData.username,
          accountHandle: profileData.username || profileData.handle,
          profileUrl: profileData.profileUrl,
          profileImageUrl: profileData.profileImage,
          isActive: true,
          metadata: profileData,
        })
        .onConflictDoUpdate({
          target: [socialAccounts.userId, socialAccounts.platform, socialAccounts.accountId],
          set: {
            accountName: profileData.name || profileData.username,
            accountHandle: profileData.username || profileData.handle,
            profileUrl: profileData.profileUrl,
            profileImageUrl: profileData.profileImage,
            isActive: true,
            metadata: profileData,
            updatedAt: new Date(),
          }
        })
        .returning();

      // Store tokens securely
      await db.insert(socialTokens)
        .values({
          id: crypto.randomUUID(),
          socialAccountId: socialAccount.id,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null,
          scopes: config.scopes,
        })
        .onConflictDoUpdate({
          target: [socialTokens.socialAccountId],
          set: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: tokenData.expires_in
              ? new Date(Date.now() + tokenData.expires_in * 1000)
              : null,
            updatedAt: new Date(),
          }
        });

      // Redirect back to social hub with success
      res.redirect('/social-hub?connected=' + platform);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/social-hub?error=callback_failed');
    }
  });

  /**
   * GET /api/social/accounts
   * Get connected social accounts for the user
   */
  app.get('/api/social/accounts', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { businessId } = req.query;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const conditions = [eq(socialAccounts.userId, userId)];
      if (businessId) {
        conditions.push(eq(socialAccounts.businessId, businessId as string));
      }

      const accounts = await db.select()
        .from(socialAccounts)
        .where(and(...conditions));

      res.json(accounts);
    } catch (error) {
      console.error('Error fetching social accounts:', error);
      res.status(500).json({ error: 'Failed to fetch social accounts' });
    }
  });

  /**
   * DELETE /api/social/accounts/:id
   * Disconnect a social account
   */
  app.delete('/api/social/accounts/:id', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify ownership
      const [account] = await db.select()
        .from(socialAccounts)
        .where(and(
          eq(socialAccounts.id, id),
          eq(socialAccounts.userId, userId)
        ));

      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Soft delete by marking as inactive
      await db.update(socialAccounts)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(socialAccounts.id, id));

      // Delete tokens
      await db.delete(socialTokens)
        .where(eq(socialTokens.socialAccountId, id));

      res.json({ message: 'Account disconnected successfully' });
    } catch (error) {
      console.error('Error disconnecting social account:', error);
      res.status(500).json({ error: 'Failed to disconnect account' });
    }
  });

  /**
   * POST /api/social/refresh/:platform
   * Refresh OAuth token for a platform
   */
  app.post('/api/social/refresh/:accountId', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { accountId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get account and tokens
      const [account] = await db.select()
        .from(socialAccounts)
        .where(and(
          eq(socialAccounts.id, accountId),
          eq(socialAccounts.userId, userId)
        ));

      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const [token] = await db.select()
        .from(socialTokens)
        .where(eq(socialTokens.socialAccountId, accountId));

      if (!token || !token.refreshToken) {
        return res.status(400).json({ error: 'No refresh token available' });
      }

      const config = OAUTH_CONFIGS[account.platform as keyof typeof OAUTH_CONFIGS];
      if (!config) {
        return res.status(400).json({ error: 'Invalid platform' });
      }

      // Refresh the token
      const tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken,
          client_id: config.clientId!,
          client_secret: config.clientSecret!,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        return res.status(400).json({ error: 'Token refresh failed' });
      }

      // Update tokens
      await db.update(socialTokens)
        .set({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || token.refreshToken,
          expiresAt: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null,
          updatedAt: new Date(),
        })
        .where(eq(socialTokens.socialAccountId, accountId));

      res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(500).json({ error: 'Failed to refresh token' });
    }
  });
}

// Fetch user profile from social platforms
async function fetchSocialProfile(platform: string, accessToken: string): Promise<any> {
  switch (platform) {
    case 'facebook':
    case 'instagram': {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${accessToken}`
      );
      const data = await response.json();

      // For Instagram, also get Instagram account ID
      if (platform === 'instagram') {
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
        );
        const pagesData = await pagesResponse.json();

        if (pagesData.data && pagesData.data.length > 0) {
          const pageId = pagesData.data[0].id;
          const igResponse = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
          );
          const igData = await igResponse.json();

          if (igData.instagram_business_account) {
            data.instagramId = igData.instagram_business_account.id;
          }
        }
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        profileImage: data.picture?.data?.url,
        profileUrl: `https://facebook.com/${data.id}`,
        ...data
      };
    }

    case 'twitter': {
      const response = await fetch(
        'https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name,description',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const { data } = await response.json();
      return {
        id: data.id,
        name: data.name,
        username: data.username,
        profileImage: data.profile_image_url,
        profileUrl: `https://twitter.com/${data.username}`,
        description: data.description,
        ...data
      };
    }

    case 'linkedin': {
      const response = await fetch(
        'https://api.linkedin.com/v2/me',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const data = await response.json();

      // Get profile picture
      const pictureResponse = await fetch(
        'https://api.linkedin.com/v2/me?projection=(profilePicture(displayImage~:playableStreams))',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const pictureData = await pictureResponse.json();

      return {
        id: data.id,
        name: `${data.localizedFirstName} ${data.localizedLastName}`,
        profileImage: pictureData.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier,
        profileUrl: `https://linkedin.com/in/${data.vanityName || data.id}`,
        ...data
      };
    }

    case 'tiktok': {
      const response = await fetch(
        'https://open.tiktokapis.com/v2/user/info/',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const { data } = await response.json();
      return {
        id: data.user.open_id,
        name: data.user.display_name,
        username: data.user.username,
        profileImage: data.user.avatar_url,
        profileUrl: `https://tiktok.com/@${data.user.username}`,
        ...data.user
      };
    }

    case 'pinterest': {
      const response = await fetch(
        'https://api.pinterest.com/v5/user_account',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const data = await response.json();
      return {
        id: data.id,
        name: data.username,
        username: data.username,
        profileImage: data.profile_image,
        profileUrl: `https://pinterest.com/${data.username}`,
        ...data
      };
    }

    case 'youtube': {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const data = await response.json();
      const channel = data.items?.[0];
      return {
        id: channel?.id,
        name: channel?.snippet?.title,
        username: channel?.snippet?.customUrl,
        profileImage: channel?.snippet?.thumbnails?.high?.url,
        profileUrl: `https://youtube.com/channel/${channel?.id}`,
        description: channel?.snippet?.description,
        ...channel
      };
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}