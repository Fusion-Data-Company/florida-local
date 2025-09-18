// Frontend-safe types extracted from schema.ts
// This file contains only the types needed by the frontend, without drizzle dependencies

export interface User {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  isAdmin?: boolean | null;
  onlineStatus?: string | null;
  lastSeenAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  industry?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  isVerified?: boolean | null;
  isSpotlighted?: boolean | null;
  spotlightStartsAt?: Date | null;
  spotlightEndsAt?: Date | null;
  followerCount?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  category?: string | null;
  imageUrl?: string | null;
  isActive?: boolean | null;
  stockQuantity?: number | null;
  tags?: string[] | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Insert types (for forms)
export interface InsertUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isAdmin?: boolean;
  onlineStatus?: string;
  lastSeenAt?: Date;
}

export interface InsertBusiness {
  ownerId: string;
  name: string;
  description?: string;
  industry?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  isVerified?: boolean;
  isSpotlighted?: boolean;
  spotlightStartsAt?: Date;
  spotlightEndsAt?: Date;
}

export interface InsertProduct {
  businessId: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  category?: string;
  imageUrl?: string;
  isActive?: boolean;
  stockQuantity?: number;
  tags?: string[];
}

export interface InsertCartItem {
  userId: string;
  productId: string;
  quantity: number;
}

export interface Post {
  id: string;
  userId: string;
  businessId?: string | null;
  content: string;
  imageUrl?: string | null;
  likeCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface InsertPost {
  userId: string;
  businessId?: string;
  content: string;
  imageUrl?: string;
}

// Import zod for schemas
import { z } from "zod";

// Zod schemas for form validation
export const insertBusinessSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  description: z.string().optional(),
  industry: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  logoUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  isVerified: z.boolean().optional(),
  isSpotlighted: z.boolean().optional(),
  spotlightStartsAt: z.date().optional(),
  spotlightEndsAt: z.date().optional(),
});

export const updateBusinessSchema = insertBusinessSchema;

export const insertProductSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  compareAtPrice: z.number().min(0).optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  stockQuantity: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

export const insertPostSchema = z.object({
  userId: z.string(),
  businessId: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string().optional(),
});