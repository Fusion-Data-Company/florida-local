import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { rateLimiter } from "./rateLimiter";

// Middleware to check if user is admin
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const isUserAdmin = await storage.isUserAdmin(user.id);
    
    if (!isUserAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Rate limiter for admin endpoints
export const adminRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  keyPrefix: 'admin',
  message: "Too many admin requests, please try again later",
});