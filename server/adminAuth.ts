import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// SECURITY: Admin authentication middleware
export const isAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    // First check if user is authenticated
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ 
        message: "Authentication required",
        error: "NOT_AUTHENTICATED" 
      });
    }

    const userId = req.user.claims.sub;
    
    // Get user from database to check admin status
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ 
        message: "User not found",
        error: "USER_NOT_FOUND" 
      });
    }

    if (!user.isAdmin) {
      console.warn(`Unauthorized admin access attempt by user: ${userId} (${user.email})`);
      return res.status(403).json({ 
        message: "Admin access required. This incident has been logged.",
        error: "INSUFFICIENT_PERMISSIONS" 
      });
    }

    // User is authenticated and is an admin
    req.adminUser = user;
    next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    res.status(500).json({ 
      message: "Internal server error during admin verification",
      error: "ADMIN_AUTH_ERROR" 
    });
  }
};

// Utility function to grant admin access to a user (for development/setup)
export const grantAdminAccess = async (userId: string): Promise<boolean> => {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return false;
    }

    // Update user to be admin (this would typically be done through a secure admin panel)
    await storage.updateUserAdminStatus(userId, true);
    console.log(`Admin access granted to user: ${userId} (${user.email})`);
    return true;
  } catch (error) {
    console.error("Error granting admin access:", error);
    return false;
  }
};

// SECURITY: Rate limiting for admin actions to prevent abuse
const adminActionCooldowns = new Map<string, number>();

export const adminRateLimit = (cooldownMs: number = 30000) => {
  return (req: any, res: Response, next: NextFunction) => {
    const userId = req.user?.claims?.sub;
    const action = `${req.method}:${req.route?.path || req.path}`;
    const key = `${userId}:${action}`;
    
    const lastAction = adminActionCooldowns.get(key);
    const now = Date.now();
    
    if (lastAction && (now - lastAction) < cooldownMs) {
      const remainingMs = cooldownMs - (now - lastAction);
      return res.status(429).json({
        message: "Admin action rate limit exceeded",
        retryAfter: Math.ceil(remainingMs / 1000),
        error: "RATE_LIMITED"
      });
    }
    
    adminActionCooldowns.set(key, now);
    
    // Clean up old entries periodically
    if (adminActionCooldowns.size > 1000) {
      const cutoff = now - (cooldownMs * 2);
      for (const [mapKey, timestamp] of adminActionCooldowns.entries()) {
        if (timestamp < cutoff) {
          adminActionCooldowns.delete(mapKey);
        }
      }
    }
    
    next();
  };
};