/**
 * API Endpoint Tests
 * Comprehensive testing for all REST API endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { storage } from '../storage';
import { createTestSession, mockUsers, mockBusiness, mockProduct, generateTestData } from './helpers/testUtils';
import * as stripeConnect from '../stripeConnect';
import { rateLimiter } from '../rateLimiter';

// Mock dependencies
vi.mock('../storage');
vi.mock('../redis', () => ({
  redis: null,
  isRedisAvailable: vi.fn().mockResolvedValue(false),
  checkRedisConnection: vi.fn().mockResolvedValue(false),
  cache: null,
  createRedisStore: vi.fn(),
  emailQueue: null,
}));
vi.mock('../stripeConnect');
vi.mock('../rateLimiter', () => ({
  rateLimiter: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));
vi.mock('../objectStorage', () => ({
  ObjectStorageService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(true),
    uploadBuffer: vi.fn().mockResolvedValue({ url: 'https://storage.test/file.jpg' }),
    getSignedUrl: vi.fn().mockResolvedValue('https://storage.test/signed-url'),
    deleteObject: vi.fn().mockResolvedValue(true),
  })),
}));

let app: express.Application;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET = 'test-secret-key-minimum-32-characters-long';
  
  // Import app after mocks are set up
  const appModule = await import('../index');
  app = appModule.app || appModule.default;
});

afterAll(async () => {
  // Cleanup
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Business Endpoints', () => {
  describe('GET /api/businesses', () => {
    it('should return all businesses', async () => {
      const mockBusinesses = [
        { id: '1', ...mockBusiness },
        { id: '2', ...mockBusiness, name: 'Another Business' },
      ];
      
      vi.mocked(storage).searchBusinesses = vi.fn().mockResolvedValue(mockBusinesses);

      const response = await request(app)
        .get('/api/businesses')
        .expect(200);

      expect(response.body).toEqual({ businesses: mockBusinesses });
      expect(storage.searchBusinesses).toHaveBeenCalledWith('', undefined);
    });

    it('should search businesses with query parameters', async () => {
      vi.mocked(storage).searchBusinesses = vi.fn().mockResolvedValue([]);

      await request(app)
        .get('/api/businesses?q=restaurant&category=food')
        .expect(200);

      expect(storage.searchBusinesses).toHaveBeenCalledWith('restaurant', 'food');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(storage).searchBusinesses = vi.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/businesses')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/businesses/:id', () => {
    it('should return a business by ID', async () => {
      const mockBusinessData = { id: 'test-id', ...mockBusiness };
      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue(mockBusinessData);

      const response = await request(app)
        .get('/api/businesses/test-id')
        .expect(200);

      expect(response.body).toEqual({ business: mockBusinessData });
    });

    it('should return 404 for non-existent business', async () => {
      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue(undefined);

      await request(app)
        .get('/api/businesses/non-existent')
        .expect(404);
    });

    it('should validate UUID format', async () => {
      await request(app)
        .get('/api/businesses/invalid-uuid')
        .expect(400);
    });
  });

  describe('POST /api/businesses', () => {
    it('should create a new business for authenticated user', async () => {
      const newBusiness = {
        name: 'New Business',
        tagline: 'Great tagline',
        category: 'Retail',
        location: 'Miami, FL',
      };

      const createdBusiness = {
        id: 'new-id',
        ...newBusiness,
        ownerId: mockUsers.regular.id,
      };

      vi.mocked(storage).createBusiness = vi.fn().mockResolvedValue(createdBusiness);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      const response = await request(app)
        .post('/api/businesses')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(newBusiness)
        .expect(201);

      expect(response.body).toEqual({ business: createdBusiness });
      expect(storage.createBusiness).toHaveBeenCalledWith(expect.objectContaining({
        ...newBusiness,
        ownerId: mockUsers.regular.id,
      }));
    });

    it('should reject invalid business data', async () => {
      const invalidBusiness = {
        name: '', // Empty name
        tagline: 'a'.repeat(256), // Exceeds max length
      };

      await request(app)
        .post('/api/businesses')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(invalidBusiness)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/businesses')
        .send(mockBusiness)
        .expect(401);
    });
  });

  describe('PATCH /api/businesses/:id', () => {
    it('should update business for owner', async () => {
      const updates = { name: 'Updated Name', tagline: 'New Tagline' };
      const updatedBusiness = { id: 'test-id', ...mockBusiness, ...updates, ownerId: mockUsers.regular.id };

      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue({ ...mockBusiness, ownerId: mockUsers.regular.id });
      vi.mocked(storage).updateBusiness = vi.fn().mockResolvedValue(updatedBusiness);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      const response = await request(app)
        .patch('/api/businesses/test-id')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(updates)
        .expect(200);

      expect(response.body).toEqual({ business: updatedBusiness });
    });

    it('should reject update from non-owner', async () => {
      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue({ ...mockBusiness, ownerId: 'another-user' });
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      await request(app)
        .patch('/api/businesses/test-id')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send({ name: 'Hacked' })
        .expect(403);
    });

    it('should allow admin to update any business', async () => {
      const updates = { name: 'Admin Updated' };
      const updatedBusiness = { id: 'test-id', ...mockBusiness, ...updates, ownerId: 'another-user' };

      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue({ ...mockBusiness, ownerId: 'another-user' });
      vi.mocked(storage).updateBusiness = vi.fn().mockResolvedValue(updatedBusiness);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.admin);

      const response = await request(app)
        .patch('/api/businesses/test-id')
        .set('Cookie', [`user=${mockUsers.admin.id}`])
        .send(updates)
        .expect(200);

      expect(response.body).toEqual({ business: updatedBusiness });
    });
  });

  describe('DELETE /api/businesses/:id', () => {
    it('should delete business for owner', async () => {
      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue({ ...mockBusiness, ownerId: mockUsers.regular.id });
      vi.mocked(storage).deleteBusiness = vi.fn().mockResolvedValue(undefined);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      await request(app)
        .delete('/api/businesses/test-id')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .expect(204);

      expect(storage.deleteBusiness).toHaveBeenCalledWith('test-id');
    });

    it('should reject deletion from non-owner', async () => {
      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue({ ...mockBusiness, ownerId: 'another-user' });
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      await request(app)
        .delete('/api/businesses/test-id')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .expect(403);

      expect(storage.deleteBusiness).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/businesses/:id/follow', () => {
    it('should follow a business', async () => {
      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue(mockBusiness);
      vi.mocked(storage).isFollowingBusiness = vi.fn().mockResolvedValue(false);
      vi.mocked(storage).followBusiness = vi.fn().mockResolvedValue(undefined);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      await request(app)
        .post('/api/businesses/test-id/follow')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .expect(200);

      expect(storage.followBusiness).toHaveBeenCalledWith(mockUsers.regular.id, 'test-id');
    });

    it('should return error if already following', async () => {
      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue(mockBusiness);
      vi.mocked(storage).isFollowingBusiness = vi.fn().mockResolvedValue(true);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      const response = await request(app)
        .post('/api/businesses/test-id/follow')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Already following this business');
    });
  });

  describe('DELETE /api/businesses/:id/follow', () => {
    it('should unfollow a business', async () => {
      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue(mockBusiness);
      vi.mocked(storage).isFollowingBusiness = vi.fn().mockResolvedValue(true);
      vi.mocked(storage).unfollowBusiness = vi.fn().mockResolvedValue(undefined);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      await request(app)
        .delete('/api/businesses/test-id/follow')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .expect(200);

      expect(storage.unfollowBusiness).toHaveBeenCalledWith(mockUsers.regular.id, 'test-id');
    });
  });
});

describe('Product Endpoints', () => {
  describe('GET /api/products', () => {
    it('should search products with filters', async () => {
      const mockProducts = [
        { id: '1', ...mockProduct },
        { id: '2', ...mockProduct, name: 'Another Product' },
      ];

      vi.mocked(storage).searchProducts = vi.fn().mockResolvedValue({
        data: mockProducts,
        total: 2,
        page: 1,
        totalPages: 1,
      });

      const response = await request(app)
        .get('/api/products?q=test&minPrice=10&maxPrice=100&category=Electronics')
        .expect(200);

      expect(response.body.products).toEqual(mockProducts);
      expect(storage.searchProducts).toHaveBeenCalledWith('test', expect.objectContaining({
        minPrice: 10,
        maxPrice: 100,
        categories: ['Electronics'],
      }));
    });

    it('should handle pagination', async () => {
      vi.mocked(storage).searchProducts = vi.fn().mockResolvedValue({
        data: [],
        total: 100,
        page: 2,
        totalPages: 5,
      });

      const response = await request(app)
        .get('/api/products?page=2&pageSize=20')
        .expect(200);

      expect(response.body).toHaveProperty('page', 2);
      expect(response.body).toHaveProperty('totalPages', 5);
    });
  });

  describe('POST /api/products', () => {
    it('should create a product for business owner', async () => {
      const newProduct = {
        businessId: 'business-id',
        name: 'New Product',
        description: 'Great product',
        price: 29.99,
        category: 'Electronics',
        inventoryCount: 50,
      };

      const createdProduct = { id: 'product-id', ...newProduct };

      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue({ ...mockBusiness, ownerId: mockUsers.regular.id });
      vi.mocked(storage).createProduct = vi.fn().mockResolvedValue(createdProduct);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      const response = await request(app)
        .post('/api/products')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(newProduct)
        .expect(201);

      expect(response.body).toEqual({ product: createdProduct });
    });

    it('should reject product creation from non-owner', async () => {
      const newProduct = {
        businessId: 'business-id',
        name: 'Hacked Product',
        price: 99.99,
        inventoryCount: 10,
      };

      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue({ ...mockBusiness, ownerId: 'another-user' });
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      await request(app)
        .post('/api/products')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(newProduct)
        .expect(403);
    });

    it('should validate product data', async () => {
      const invalidProduct = {
        businessId: 'business-id',
        name: '', // Empty name
        price: -10, // Negative price
        inventoryCount: -5, // Negative inventory
      };

      await request(app)
        .post('/api/products')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(invalidProduct)
        .expect(400);
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should update product for business owner', async () => {
      const updates = { price: 39.99, inventoryCount: 25 };
      const existingProduct = { ...mockProduct, businessId: 'business-id' };
      const updatedProduct = { ...existingProduct, ...updates };

      vi.mocked(storage).getProductById = vi.fn().mockResolvedValue(existingProduct);
      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue({ ...mockBusiness, ownerId: mockUsers.regular.id });
      vi.mocked(storage).updateProduct = vi.fn().mockResolvedValue(updatedProduct);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      const response = await request(app)
        .patch('/api/products/product-id')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(updates)
        .expect(200);

      expect(response.body).toEqual({ product: updatedProduct });
    });
  });
});

describe('Post Endpoints', () => {
  describe('GET /api/posts', () => {
    it('should return posts with pagination', async () => {
      const mockPosts = [
        { id: '1', businessId: 'b1', content: 'Post 1', createdAt: new Date() },
        { id: '2', businessId: 'b2', content: 'Post 2', createdAt: new Date() },
      ];

      vi.mocked(storage).getPosts = vi.fn().mockResolvedValue({
        posts: mockPosts,
        total: 2,
        hasMore: false,
      });

      const response = await request(app)
        .get('/api/posts?limit=10&offset=0')
        .expect(200);

      expect(response.body.posts).toEqual(mockPosts);
      expect(response.body.total).toBe(2);
    });

    it('should filter posts by business', async () => {
      vi.mocked(storage).getPostsByBusiness = vi.fn().mockResolvedValue([]);

      await request(app)
        .get('/api/posts?businessId=test-business')
        .expect(200);

      expect(storage.getPostsByBusiness).toHaveBeenCalledWith('test-business', 20, 0);
    });
  });

  describe('POST /api/posts', () => {
    it('should create a post for business owner', async () => {
      const newPost = {
        businessId: 'business-id',
        content: 'Check out our new products!',
        mediaUrls: ['https://example.com/image.jpg'],
      };

      const createdPost = { id: 'post-id', ...newPost };

      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue({ ...mockBusiness, ownerId: mockUsers.regular.id });
      vi.mocked(storage).createPost = vi.fn().mockResolvedValue(createdPost);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      const response = await request(app)
        .post('/api/posts')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(newPost)
        .expect(201);

      expect(response.body).toEqual({ post: createdPost });
    });

    it('should validate post content', async () => {
      const invalidPost = {
        businessId: 'business-id',
        content: '', // Empty content
      };

      await request(app)
        .post('/api/posts')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(invalidPost)
        .expect(400);
    });
  });

  describe('POST /api/posts/:id/like', () => {
    it('should toggle post like', async () => {
      vi.mocked(storage).getPostById = vi.fn().mockResolvedValue({ id: 'post-id', content: 'Test' });
      vi.mocked(storage).togglePostLike = vi.fn().mockResolvedValue({ liked: true, likesCount: 10 });
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      const response = await request(app)
        .post('/api/posts/post-id/like')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .expect(200);

      expect(response.body).toEqual({ liked: true, likesCount: 10 });
    });
  });

  describe('POST /api/posts/:id/comment', () => {
    it('should add a comment to a post', async () => {
      const comment = { content: 'Great post!' };
      const createdComment = {
        id: 'comment-id',
        postId: 'post-id',
        userId: mockUsers.regular.id,
        ...comment,
      };

      vi.mocked(storage).getPostById = vi.fn().mockResolvedValue({ id: 'post-id' });
      vi.mocked(storage).createPostComment = vi.fn().mockResolvedValue(createdComment);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      const response = await request(app)
        .post('/api/posts/post-id/comment')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(comment)
        .expect(201);

      expect(response.body).toEqual({ comment: createdComment });
    });
  });
});

describe('Cart and Order Endpoints', () => {
  describe('GET /api/cart', () => {
    it('should return user cart items', async () => {
      const mockCartItems = [
        { id: '1', productId: 'p1', quantity: 2, price: 19.99 },
        { id: '2', productId: 'p2', quantity: 1, price: 29.99 },
      ];

      vi.mocked(storage).getCartItems = vi.fn().mockResolvedValue(mockCartItems);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      const response = await request(app)
        .get('/api/cart')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .expect(200);

      expect(response.body).toEqual({ items: mockCartItems });
    });
  });

  describe('POST /api/cart', () => {
    it('should add item to cart', async () => {
      const cartItem = {
        productId: 'product-id',
        quantity: 2,
      };

      const product = { ...mockProduct, id: 'product-id', price: 29.99 };
      const createdCartItem = {
        id: 'cart-item-id',
        userId: mockUsers.regular.id,
        ...cartItem,
        price: product.price,
      };

      vi.mocked(storage).getProductById = vi.fn().mockResolvedValue(product);
      vi.mocked(storage).addToCart = vi.fn().mockResolvedValue(createdCartItem);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      const response = await request(app)
        .post('/api/cart')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(cartItem)
        .expect(201);

      expect(response.body).toEqual({ item: createdCartItem });
    });

    it('should validate cart item data', async () => {
      const invalidCartItem = {
        productId: 'product-id',
        quantity: -1, // Negative quantity
      };

      await request(app)
        .post('/api/cart')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(invalidCartItem)
        .expect(400);
    });
  });

  describe('PATCH /api/cart/:itemId', () => {
    it('should update cart item quantity', async () => {
      const updates = { quantity: 5 };
      const updatedItem = { id: 'item-id', productId: 'p1', quantity: 5, price: 19.99 };

      vi.mocked(storage).getCartItemById = vi.fn().mockResolvedValue({ id: 'item-id', userId: mockUsers.regular.id });
      vi.mocked(storage).updateCartItem = vi.fn().mockResolvedValue(updatedItem);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      const response = await request(app)
        .patch('/api/cart/item-id')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(updates)
        .expect(200);

      expect(response.body).toEqual({ item: updatedItem });
    });
  });

  describe('DELETE /api/cart/:itemId', () => {
    it('should remove item from cart', async () => {
      vi.mocked(storage).getCartItemById = vi.fn().mockResolvedValue({ id: 'item-id', userId: mockUsers.regular.id });
      vi.mocked(storage).removeFromCart = vi.fn().mockResolvedValue(undefined);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      await request(app)
        .delete('/api/cart/item-id')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .expect(204);

      expect(storage.removeFromCart).toHaveBeenCalledWith('item-id');
    });
  });

  describe('POST /api/orders/create-payment-intent', () => {
    it('should create payment intent for cart', async () => {
      const mockCartItems = [
        { id: '1', productId: 'p1', quantity: 2, price: 19.99 },
      ];

      const orderData = {
        shippingAddress: '123 Main St',
        billingAddress: '123 Main St',
        customerEmail: 'customer@example.com',
      };

      vi.mocked(storage).getCartItems = vi.fn().mockResolvedValue(mockCartItems);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);
      vi.mocked(stripeConnect).createPaymentIntent = vi.fn().mockResolvedValue({
        id: 'pi_test',
        client_secret: 'secret_test',
        amount: 3998,
      });

      const response = await request(app)
        .post('/api/orders/create-payment-intent')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(orderData)
        .expect(200);

      expect(response.body).toHaveProperty('clientSecret', 'secret_test');
      expect(response.body).toHaveProperty('amount', 3998);
    });
  });

  describe('POST /api/orders/complete', () => {
    it('should complete order after payment', async () => {
      const completeData = { paymentIntentId: 'pi_test' };
      const createdOrder = {
        id: 'order-id',
        userId: mockUsers.regular.id,
        status: 'completed',
        totalAmount: 39.98,
      };

      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);
      vi.mocked(stripeConnect).retrievePaymentIntent = vi.fn().mockResolvedValue({
        id: 'pi_test',
        status: 'succeeded',
        amount: 3998,
        metadata: { userId: mockUsers.regular.id },
      });
      vi.mocked(storage).createOrderFromPaymentIntent = vi.fn().mockResolvedValue(createdOrder);

      const response = await request(app)
        .post('/api/orders/complete')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(completeData)
        .expect(200);

      expect(response.body).toEqual({ order: createdOrder });
    });
  });
});

describe('Search and Filter Endpoints', () => {
  describe('GET /api/search', () => {
    it('should perform global search', async () => {
      const searchResults = {
        businesses: [{ id: 'b1', name: 'Test Business' }],
        products: [{ id: 'p1', name: 'Test Product' }],
        posts: [{ id: 'post1', content: 'Test post' }],
      };

      vi.mocked(storage).globalSearch = vi.fn().mockResolvedValue(searchResults);

      const response = await request(app)
        .get('/api/search?q=test')
        .expect(200);

      expect(response.body).toEqual(searchResults);
      expect(storage.globalSearch).toHaveBeenCalledWith('test', {});
    });

    it('should filter search by type', async () => {
      vi.mocked(storage).globalSearch = vi.fn().mockResolvedValue({
        businesses: [],
        products: [{ id: 'p1', name: 'Product' }],
        posts: [],
      });

      await request(app)
        .get('/api/search?q=test&type=products')
        .expect(200);

      expect(storage.globalSearch).toHaveBeenCalledWith('test', { type: 'products' });
    });
  });

  describe('GET /api/spotlight', () => {
    it('should return spotlight businesses', async () => {
      const spotlightBusinesses = {
        daily: { id: 'b1', name: 'Daily Spotlight' },
        weekly: { id: 'b2', name: 'Weekly Spotlight' },
        monthly: { id: 'b3', name: 'Monthly Spotlight' },
      };

      vi.mocked(storage).getSpotlightBusinesses = vi.fn()
        .mockResolvedValueOnce([spotlightBusinesses.daily])
        .mockResolvedValueOnce([spotlightBusinesses.weekly])
        .mockResolvedValueOnce([spotlightBusinesses.monthly]);

      const response = await request(app)
        .get('/api/spotlight')
        .expect(200);

      expect(response.body).toEqual(spotlightBusinesses);
    });
  });

  describe('POST /api/spotlight/vote', () => {
    it('should vote for spotlight business', async () => {
      const voteData = { businessId: 'business-id' };

      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue(mockBusiness);
      vi.mocked(storage).hasVotedForSpotlight = vi.fn().mockResolvedValue(false);
      vi.mocked(storage).voteForSpotlight = vi.fn().mockResolvedValue({ voteCount: 10 });
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      const response = await request(app)
        .post('/api/spotlight/vote')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(voteData)
        .expect(200);

      expect(response.body).toEqual({ success: true, voteCount: 10 });
    });

    it('should prevent duplicate votes', async () => {
      const voteData = { businessId: 'business-id' };

      vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue(mockBusiness);
      vi.mocked(storage).hasVotedForSpotlight = vi.fn().mockResolvedValue(true);
      vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

      const response = await request(app)
        .post('/api/spotlight/vote')
        .set('Cookie', [`user=${mockUsers.regular.id}`])
        .send(voteData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Already voted for this business');
    });
  });
});

describe('Error Handling', () => {
  it('should handle 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/api/non-existent-endpoint')
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('should handle malformed JSON', async () => {
    const response = await request(app)
      .post('/api/businesses')
      .set('Content-Type', 'application/json')
      .send('{ invalid json')
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should handle database connection errors', async () => {
    vi.mocked(storage).searchBusinesses = vi.fn().mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .get('/api/businesses')
      .expect(500);

    expect(response.body).toHaveProperty('error');
  });

  it('should sanitize error messages in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    vi.mocked(storage).searchBusinesses = vi.fn().mockRejectedValue(new Error('Sensitive database error with passwords'));

    const response = await request(app)
      .get('/api/businesses')
      .expect(500);

    expect(response.body.error).not.toContain('password');
    expect(response.body.error).toBe('Internal server error');

    process.env.NODE_ENV = originalEnv;
  });
});

describe('Authentication and Authorization', () => {
  it('should reject requests without authentication', async () => {
    await request(app)
      .post('/api/businesses')
      .send(mockBusiness)
      .expect(401);
  });

  it('should reject requests with invalid session', async () => {
    await request(app)
      .post('/api/businesses')
      .set('Cookie', ['user=invalid-session'])
      .send(mockBusiness)
      .expect(401);
  });

  it('should handle expired sessions', async () => {
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(null);

    await request(app)
      .post('/api/businesses')
      .set('Cookie', ['user=expired-session'])
      .send(mockBusiness)
      .expect(401);
  });

  it('should differentiate between regular users and admins', async () => {
    // Regular user trying to access admin endpoint
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.regular);

    await request(app)
      .post('/api/admin/promote-user')
      .set('Cookie', [`user=${mockUsers.regular.id}`])
      .send({ userId: 'some-user' })
      .expect(403);

    // Admin accessing admin endpoint
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(mockUsers.admin);

    await request(app)
      .post('/api/admin/promote-user')
      .set('Cookie', [`user=${mockUsers.admin.id}`])
      .send({ userId: 'some-user' })
      .expect(200);
  });
});