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
  tagline?: string | null;
  description?: string | null;
  category?: string | null;
  location?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  operatingHours?: any | null; // JSON field
  socialLinks?: any | null; // JSON field
  googlePlaceId?: string | null;
  isVerified?: boolean | null;
  isActive?: boolean | null;
  
  // Google My Business Integration Fields
  gmbVerified?: boolean | null;
  gmbConnected?: boolean | null;
  gmbAccountId?: string | null;
  gmbLocationId?: string | null;
  gmbSyncStatus?: string | null;
  gmbLastSyncAt?: Date | null;
  gmbLastErrorAt?: Date | null;
  gmbLastError?: string | null;
  gmbDataSources?: any | null; // JSON field
  
  // Stripe Connect fields
  stripeAccountId?: string | null;
  stripeOnboardingStatus?: string | null;
  stripeChargesEnabled?: boolean | null;
  stripePayoutsEnabled?: boolean | null;
  rating?: string | null; // decimal field from schema
  reviewCount?: number | null;
  followerCount?: number | null;
  postCount?: number | null;
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
  tagline?: string;
  description?: string;
  category?: string;
  location?: string;
  address?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  operatingHours?: any; // JSON field
  socialLinks?: any; // JSON field
  googlePlaceId?: string;
  isVerified?: boolean;
  isActive?: boolean;
  
  // Google My Business Integration Fields
  gmbVerified?: boolean;
  gmbConnected?: boolean;
  gmbAccountId?: string;
  gmbLocationId?: string;
  gmbSyncStatus?: string;
  gmbLastSyncAt?: Date;
  gmbLastErrorAt?: Date;
  gmbLastError?: string;
  gmbDataSources?: any; // JSON field
  
  // Stripe Connect fields
  stripeAccountId?: string;
  stripeOnboardingStatus?: string;
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
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
  businessId: string;
  content: string;
  images?: any | null; // JSON field
  type?: string | null;
  likeCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
  isVisible?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface InsertPost {
  businessId: string;
  content: string;
  images?: any; // JSON field
  type?: string;
  isVisible?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderBusinessId?: string | null;
  receiverBusinessId?: string | null;
  content: string;
  messageType?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  sharedBusinessId?: string | null;
  sharedProductId?: string | null;
  isRead?: boolean | null;
  readAt?: Date | null;
  isDelivered?: boolean | null;
  deliveredAt?: Date | null;
  conversationId: string;
  networkingContext?: any | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface InsertMessage {
  senderId: string;
  receiverId: string;
  senderBusinessId?: string | null;
  receiverBusinessId?: string | null;
  content: string;
  messageType?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  sharedBusinessId?: string | null;
  sharedProductId?: string | null;
  conversationId: string;
  networkingContext?: any;
}

// Import zod for schemas
import { z } from "zod";

// Zod schemas for form validation
export const insertBusinessSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  tagline: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  operatingHours: z.any().optional(), // JSON field
  socialLinks: z.any().optional(), // JSON field
  googlePlaceId: z.string().optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  
  // Google My Business Integration Fields
  gmbVerified: z.boolean().optional(),
  gmbConnected: z.boolean().optional(),
  gmbAccountId: z.string().optional(),
  gmbLocationId: z.string().optional(),
  gmbSyncStatus: z.string().optional(),
  gmbLastSyncAt: z.date().optional(),
  gmbLastErrorAt: z.date().optional(),
  gmbLastError: z.string().optional(),
  gmbDataSources: z.any().optional(), // JSON field
  
  // Stripe Connect fields
  stripeAccountId: z.string().optional(),
  stripeOnboardingStatus: z.string().optional(),
  stripeChargesEnabled: z.boolean().optional(),
  stripePayoutsEnabled: z.boolean().optional(),
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
  businessId: z.string(),
  content: z.string().min(1, "Content is required"),
  images: z.any().optional(), // JSON field
  type: z.string().optional(),
  isVisible: z.boolean().optional(),
});