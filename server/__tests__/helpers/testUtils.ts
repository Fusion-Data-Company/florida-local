/**
 * Test utilities and helpers
 */

import type { Express } from 'express';
import request from 'supertest';

/**
 * Create a test user session
 */
export function createTestSession(app: Express, userId: string) {
  const agent = request.agent(app);

  // Mock session middleware to inject user
  return {
    agent,
    userId,
    async get(url: string) {
      return agent.get(url).set('Cookie', [`user=${userId}`]);
    },
    async post(url: string) {
      return agent.post(url).set('Cookie', [`user=${userId}`]);
    },
    async put(url: string) {
      return agent.put(url).set('Cookie', [`user=${userId}`]);
    },
    async delete(url: string) {
      return agent.delete(url).set('Cookie', [`user=${userId}`]);
    },
  };
}

/**
 * Mock user data
 */
export const mockUsers = {
  regular: {
    id: 'test-user-1',
    username: 'testuser',
    email: 'test@example.com',
    isAdmin: false,
  },
  admin: {
    id: 'test-admin-1',
    username: 'admin',
    email: 'admin@example.com',
    isAdmin: true,
  },
};

/**
 * Mock business data
 */
export const mockBusiness = {
  name: 'Test Business',
  tagline: 'A test business',
  category: 'Retail',
  location: 'Miami, FL',
  description: 'This is a test business',
  contactEmail: 'business@example.com',
  contactPhone: '555-0100',
  websiteUrl: 'https://testbusiness.com',
  isActive: true,
};

/**
 * Mock product data
 */
export const mockProduct = {
  name: 'Test Product',
  description: 'A test product',
  price: 9.99,
  category: 'Electronics',
  inventoryCount: 100,
  isActive: true,
};

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) return;

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Mock environment variables for tests
 */
export function mockEnv(overrides: Record<string, string>) {
  const original = { ...process.env };

  Object.assign(process.env, overrides);

  return () => {
    process.env = original;
  };
}

/**
 * Generate random test data
 */
export const generateTestData = {
  email: () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
  username: () => `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  businessName: () => `Business ${Date.now()}`,
  productName: () => `Product ${Date.now()}`,
};
