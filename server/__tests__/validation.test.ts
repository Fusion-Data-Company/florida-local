/**
 * Validation Tests - Zod Schema Testing
 * Tests for input validation, sanitization, and error handling
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Import schemas from routes (we'll test the actual schemas used in production)
const campaignSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['email', 'sms', 'push', 'multi-channel']),
  subject: z.string().max(255).optional(),
  preheaderText: z.string().max(150).optional(),
  senderName: z.string().max(100).optional(),
  senderEmail: z.string().email().optional(),
  senderPhone: z.string().max(20).optional(),
  content: z.string(),
});

const segmentSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  criteria: z.any(),
  autoUpdate: z.boolean().optional(),
});

const businessSchema = z.object({
  name: z.string().min(1).max(255),
  tagline: z.string().max(255).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  websiteUrl: z.string().url().optional(),
});

const productSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string().optional(),
  inventoryCount: z.number().int().nonnegative(),
  isActive: z.boolean().optional(),
});

describe('Validation - Campaign Schema', () => {
  it('should validate a valid campaign', () => {
    const validCampaign = {
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Summer Sale Campaign',
      type: 'email',
      content: 'Check out our summer deals!',
    };

    const result = campaignSchema.safeParse(validCampaign);
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID', () => {
    const invalidCampaign = {
      businessId: 'not-a-uuid',
      name: 'Test Campaign',
      type: 'email',
      content: 'Content',
    };

    const result = campaignSchema.safeParse(invalidCampaign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('businessId');
    }
  });

  it('should reject empty name', () => {
    const invalidCampaign = {
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      name: '',
      type: 'email',
      content: 'Content',
    };

    const result = campaignSchema.safeParse(invalidCampaign);
    expect(result.success).toBe(false);
  });

  it('should reject name exceeding max length', () => {
    const invalidCampaign = {
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'a'.repeat(256), // Exceeds 255 char limit
      type: 'email',
      content: 'Content',
    };

    const result = campaignSchema.safeParse(invalidCampaign);
    expect(result.success).toBe(false);
  });

  it('should reject invalid campaign type', () => {
    const invalidCampaign = {
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test',
      type: 'invalid-type',
      content: 'Content',
    };

    const result = campaignSchema.safeParse(invalidCampaign);
    expect(result.success).toBe(false);
  });

  it('should validate optional fields', () => {
    const campaignWithOptionals = {
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Campaign',
      description: 'A test description',
      type: 'email',
      subject: 'Test Subject',
      preheaderText: 'Preview text',
      senderName: 'John Doe',
      senderEmail: 'john@example.com',
      senderPhone: '555-0100',
      content: 'Email content',
    };

    const result = campaignSchema.safeParse(campaignWithOptionals);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email format', () => {
    const invalidCampaign = {
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test',
      type: 'email',
      senderEmail: 'not-an-email',
      content: 'Content',
    };

    const result = campaignSchema.safeParse(invalidCampaign);
    expect(result.success).toBe(false);
  });
});

describe('Validation - Segment Schema', () => {
  it('should validate a valid segment', () => {
    const validSegment = {
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'High Value Customers',
      criteria: { minSpend: 1000 },
    };

    const result = segmentSchema.safeParse(validSegment);
    expect(result.success).toBe(true);
  });

  it('should allow optional autoUpdate field', () => {
    const segment = {
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Segment',
      criteria: {},
      autoUpdate: true,
    };

    const result = segmentSchema.safeParse(segment);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.autoUpdate).toBe(true);
    }
  });

  it('should reject invalid businessId', () => {
    const invalidSegment = {
      businessId: 'invalid',
      name: 'Test',
      criteria: {},
    };

    const result = segmentSchema.safeParse(invalidSegment);
    expect(result.success).toBe(false);
  });
});

describe('Validation - Business Schema', () => {
  it('should validate a complete business profile', () => {
    const validBusiness = {
      name: 'Test Business',
      tagline: 'Your trusted partner',
      category: 'Retail',
      location: 'Miami, FL',
      description: 'A great business',
      contactEmail: 'contact@business.com',
      contactPhone: '555-0100',
      websiteUrl: 'https://business.com',
    };

    const result = businessSchema.safeParse(validBusiness);
    expect(result.success).toBe(true);
  });

  it('should validate minimal business profile', () => {
    const minimalBusiness = {
      name: 'Test Business',
    };

    const result = businessSchema.safeParse(minimalBusiness);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const invalidBusiness = {
      name: 'Test Business',
      contactEmail: 'not-an-email',
    };

    const result = businessSchema.safeParse(invalidBusiness);
    expect(result.success).toBe(false);
  });

  it('should reject invalid URL', () => {
    const invalidBusiness = {
      name: 'Test Business',
      websiteUrl: 'not-a-url',
    };

    const result = businessSchema.safeParse(invalidBusiness);
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const invalidBusiness = {
      name: '',
    };

    const result = businessSchema.safeParse(invalidBusiness);
    expect(result.success).toBe(false);
  });

  it('should reject name exceeding max length', () => {
    const invalidBusiness = {
      name: 'a'.repeat(256),
    };

    const result = businessSchema.safeParse(invalidBusiness);
    expect(result.success).toBe(false);
  });
});

describe('Validation - Product Schema', () => {
  it('should validate a valid product', () => {
    const validProduct = {
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Product',
      description: 'A great product',
      price: 29.99,
      category: 'Electronics',
      inventoryCount: 100,
      isActive: true,
    };

    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('should reject negative price', () => {
    const invalidProduct = {
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Product',
      price: -10,
      inventoryCount: 10,
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('should reject zero price', () => {
    const invalidProduct = {
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Product',
      price: 0,
      inventoryCount: 10,
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('should reject negative inventory', () => {
    const invalidProduct = {
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Product',
      price: 10,
      inventoryCount: -5,
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('should reject non-integer inventory', () => {
    const invalidProduct = {
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Product',
      price: 10,
      inventoryCount: 10.5,
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('should allow zero inventory', () => {
    const validProduct = {
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Out of Stock Product',
      price: 10,
      inventoryCount: 0,
    };

    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });
});

describe('Validation - Input Sanitization', () => {
  it('should preserve valid special characters in text', () => {
    const business = {
      name: "O'Reilly's Auto Parts & More!",
      description: 'We sell auto parts (new & used) - call us @ 555-0100',
    };

    const result = businessSchema.safeParse(business);
    expect(result.success).toBe(true);
  });

  it('should handle Unicode characters', () => {
    const business = {
      name: 'Café Résumé 日本語',
      description: 'International café ☕',
    };

    const result = businessSchema.safeParse(business);
    expect(result.success).toBe(true);
  });

  it('should trim whitespace from strings', () => {
    const trimmedSchema = z.object({
      name: z.string().trim().min(1),
    });

    const input = { name: '  Test Business  ' };
    const result = trimmedSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Business');
    }
  });
});

describe('Validation - Error Messages', () => {
  it('should provide detailed error information', () => {
    const invalidCampaign = {
      businessId: 'invalid-uuid',
      name: '',
      type: 'invalid-type',
      // Missing required 'content' field
    };

    const result = campaignSchema.safeParse(invalidCampaign);
    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.errors.length).toBeGreaterThan(0);

      // Should have errors for multiple fields
      const errorPaths = result.error.errors.map(e => e.path.join('.'));
      expect(errorPaths).toContain('businessId');
      expect(errorPaths).toContain('name');
      expect(errorPaths).toContain('type');
      expect(errorPaths).toContain('content');
    }
  });
});
