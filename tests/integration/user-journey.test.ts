/**
 * User Journey Integration Tests
 * End-to-end tests for complete user workflows
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';
import { storage } from '../../server/storage';
import * as stripeConnect from '../../server/stripeConnect';
import { redis } from '../../server/redis';

// Mock external services
vi.mock('../../server/storage');
vi.mock('../../server/stripeConnect');
vi.mock('../../server/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
  isRedisAvailable: vi.fn().mockResolvedValue(true),
  checkRedisConnection: vi.fn().mockResolvedValue(true),
}));

// Test data
const testUser = {
  id: 'user-test-123',
  username: 'testuser',
  email: 'test@example.com',
  isAdmin: false,
};

const testBusiness = {
  id: 'business-test-123',
  ownerId: testUser.id,
  name: 'Test Business',
  category: 'Retail',
  location: 'Miami, FL',
  isActive: true,
};

const testProduct = {
  id: 'product-test-123',
  businessId: testBusiness.id,
  name: 'Test Product',
  price: 29.99,
  inventoryCount: 100,
  isActive: true,
};

describe('User Registration and Authentication Journey', () => {
  it('should complete full registration and login flow', async () => {
    // Step 1: User arrives at platform
    const homeResponse = await request(app)
      .get('/')
      .expect(200);

    // Step 2: User initiates OAuth login
    const loginResponse = await request(app)
      .get('/api/auth/login')
      .expect(302); // Redirect to OAuth provider

    // Step 3: Mock OAuth callback
    vi.mocked(storage).upsertUser = vi.fn().mockResolvedValue(testUser);
    
    const callbackResponse = await request(app)
      .get('/api/auth/callback?code=test-auth-code')
      .expect(302); // Redirect to app

    // Step 4: Verify user is authenticated
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(testUser);

    const agent = request.agent(app);
    const userResponse = await agent
      .get('/api/auth/user')
      .set('Cookie', [`user=${testUser.id}`])
      .expect(200);

    expect(userResponse.body.user).toMatchObject({
      id: testUser.id,
      username: testUser.username,
      email: testUser.email,
    });
  });

  it('should handle logout flow correctly', async () => {
    const agent = request.agent(app);
    
    // Login first
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(testUser);

    // Logout
    await agent
      .post('/api/auth/logout')
      .set('Cookie', [`user=${testUser.id}`])
      .expect(200);

    // Verify user is logged out
    await agent
      .get('/api/auth/user')
      .expect(404);
  });
});

describe('Business Creation and Management Journey', () => {
  it('should complete full business creation and setup flow', async () => {
    const agent = request.agent(app);
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(testUser);

    // Step 1: Create business
    const businessData = {
      name: 'My New Business',
      tagline: 'Quality products and services',
      category: 'Retail',
      location: 'Miami, FL',
      description: 'We provide excellent products',
      contactEmail: 'business@example.com',
      contactPhone: '555-0100',
      websiteUrl: 'https://mybusiness.com',
    };

    vi.mocked(storage).createBusiness = vi.fn().mockResolvedValue({
      id: 'new-business-id',
      ...businessData,
      ownerId: testUser.id,
    });

    const createResponse = await agent
      .post('/api/businesses')
      .set('Cookie', [`user=${testUser.id}`])
      .send(businessData)
      .expect(201);

    expect(createResponse.body.business).toHaveProperty('id');
    const businessId = createResponse.body.business.id;

    // Step 2: Set up Stripe Connect account
    const mockStripeAccount = {
      id: 'acct_stripe123',
      charges_enabled: false,
      payouts_enabled: false,
    };

    vi.mocked(stripeConnect.createConnectAccount).mockResolvedValue(mockStripeAccount);

    await agent
      .post(`/api/businesses/${businessId}/stripe/connect`)
      .set('Cookie', [`user=${testUser.id}`])
      .expect(200);

    // Step 3: Complete Stripe onboarding
    const mockAccountLink = {
      url: 'https://connect.stripe.com/setup/...',
    };

    vi.mocked(stripeConnect.createAccountLink).mockResolvedValue(mockAccountLink);

    const onboardingResponse = await agent
      .get(`/api/businesses/${businessId}/stripe/onboarding`)
      .set('Cookie', [`user=${testUser.id}`])
      .expect(200);

    expect(onboardingResponse.body).toHaveProperty('url');

    // Step 4: Add products
    const productData = {
      businessId,
      name: 'Premium Product',
      description: 'High-quality item',
      price: 49.99,
      category: 'Electronics',
      inventoryCount: 50,
    };

    vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue({
      ...businessData,
      id: businessId,
      ownerId: testUser.id,
    });
    vi.mocked(storage).createProduct = vi.fn().mockResolvedValue({
      id: 'product-id',
      ...productData,
    });

    const productResponse = await agent
      .post('/api/products')
      .set('Cookie', [`user=${testUser.id}`])
      .send(productData)
      .expect(201);

    expect(productResponse.body.product).toHaveProperty('id');

    // Step 5: Publish business
    vi.mocked(storage).updateBusiness = vi.fn().mockResolvedValue({
      ...businessData,
      id: businessId,
      isActive: true,
    });

    await agent
      .patch(`/api/businesses/${businessId}`)
      .set('Cookie', [`user=${testUser.id}`])
      .send({ isActive: true })
      .expect(200);
  });

  it('should handle business verification flow', async () => {
    const agent = request.agent(app);
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(testUser);
    vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue(testBusiness);

    // Step 1: Submit verification request
    const verificationData = {
      businessLicense: 'BL-123456',
      taxId: '12-3456789',
      documents: ['license.pdf', 'tax.pdf'],
    };

    await agent
      .post(`/api/businesses/${testBusiness.id}/verify`)
      .set('Cookie', [`user=${testUser.id}`])
      .send(verificationData)
      .expect(200);

    // Step 2: Admin reviews and approves
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue({
      ...testUser,
      isAdmin: true,
    });

    vi.mocked(storage).updateBusiness = vi.fn().mockResolvedValue({
      ...testBusiness,
      isVerified: true,
      verificationTier: 'gold',
    });

    await agent
      .post(`/api/admin/businesses/${testBusiness.id}/verify`)
      .set('Cookie', [`user=${testUser.id}`])
      .send({ approved: true, tier: 'gold' })
      .expect(200);
  });
});

describe('Shopping and Checkout Journey', () => {
  it('should complete full purchase flow from browsing to order', async () => {
    const agent = request.agent(app);
    const buyerId = 'buyer-123';
    const buyer = { ...testUser, id: buyerId };
    
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(buyer);

    // Step 1: Browse products
    vi.mocked(storage).searchProducts = vi.fn().mockResolvedValue({
      data: [testProduct],
      total: 1,
      page: 1,
      totalPages: 1,
    });

    const browseResponse = await agent
      .get('/api/products?category=Retail')
      .expect(200);

    expect(browseResponse.body.products).toHaveLength(1);

    // Step 2: View product details
    vi.mocked(storage).getProductById = vi.fn().mockResolvedValue(testProduct);

    const productResponse = await agent
      .get(`/api/products/${testProduct.id}`)
      .expect(200);

    expect(productResponse.body.product.id).toBe(testProduct.id);

    // Step 3: Add to cart
    const cartItem = {
      id: 'cart-item-123',
      userId: buyerId,
      productId: testProduct.id,
      quantity: 2,
      price: testProduct.price,
    };

    vi.mocked(storage).addToCart = vi.fn().mockResolvedValue(cartItem);

    await agent
      .post('/api/cart')
      .set('Cookie', [`user=${buyerId}`])
      .send({ productId: testProduct.id, quantity: 2 })
      .expect(201);

    // Step 4: View cart
    vi.mocked(storage).getCartItems = vi.fn().mockResolvedValue([cartItem]);

    const cartResponse = await agent
      .get('/api/cart')
      .set('Cookie', [`user=${buyerId}`])
      .expect(200);

    expect(cartResponse.body.items).toHaveLength(1);

    // Step 5: Create payment intent
    const paymentIntentData = {
      shippingAddress: '123 Main St, Miami, FL 33101',
      billingAddress: '123 Main St, Miami, FL 33101',
      customerEmail: buyer.email,
      customerPhone: '555-0100',
    };

    vi.mocked(stripeConnect.createPaymentIntent).mockResolvedValue({
      id: 'pi_test123',
      client_secret: 'secret_test',
      amount: 5998, // 2 * 29.99
    });

    const paymentResponse = await agent
      .post('/api/orders/create-payment-intent')
      .set('Cookie', [`user=${buyerId}`])
      .send(paymentIntentData)
      .expect(200);

    expect(paymentResponse.body).toHaveProperty('clientSecret');

    // Step 6: Complete order
    const order = {
      id: 'order-123',
      userId: buyerId,
      totalAmount: 59.98,
      status: 'processing',
      items: [{
        productId: testProduct.id,
        quantity: 2,
        price: testProduct.price,
      }],
    };

    vi.mocked(stripeConnect.retrievePaymentIntent).mockResolvedValue({
      id: 'pi_test123',
      status: 'succeeded',
      amount: 5998,
      metadata: { userId: buyerId },
    });

    vi.mocked(storage).createOrderFromPaymentIntent = vi.fn().mockResolvedValue(order);
    vi.mocked(storage).clearCart = vi.fn().mockResolvedValue(undefined);

    const completeResponse = await agent
      .post('/api/orders/complete')
      .set('Cookie', [`user=${buyerId}`])
      .send({ paymentIntentId: 'pi_test123' })
      .expect(200);

    expect(completeResponse.body.order).toHaveProperty('id');
    expect(completeResponse.body.order.status).toBe('processing');
  });

  it('should handle cart management operations', async () => {
    const agent = request.agent(app);
    const buyerId = 'buyer-456';
    
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue({
      ...testUser,
      id: buyerId,
    });

    // Add item to cart
    const cartItem = {
      id: 'cart-item-456',
      userId: buyerId,
      productId: testProduct.id,
      quantity: 1,
      price: testProduct.price,
    };

    vi.mocked(storage).getProductById = vi.fn().mockResolvedValue(testProduct);
    vi.mocked(storage).addToCart = vi.fn().mockResolvedValue(cartItem);

    await agent
      .post('/api/cart')
      .set('Cookie', [`user=${buyerId}`])
      .send({ productId: testProduct.id, quantity: 1 })
      .expect(201);

    // Update quantity
    vi.mocked(storage).getCartItemById = vi.fn().mockResolvedValue(cartItem);
    vi.mocked(storage).updateCartItem = vi.fn().mockResolvedValue({
      ...cartItem,
      quantity: 3,
    });

    await agent
      .patch(`/api/cart/${cartItem.id}`)
      .set('Cookie', [`user=${buyerId}`])
      .send({ quantity: 3 })
      .expect(200);

    // Remove from cart
    vi.mocked(storage).removeFromCart = vi.fn().mockResolvedValue(undefined);

    await agent
      .delete(`/api/cart/${cartItem.id}`)
      .set('Cookie', [`user=${buyerId}`])
      .expect(204);
  });
});

describe('Social Features Journey', () => {
  it('should handle business following and engagement', async () => {
    const agent = request.agent(app);
    const followerId = 'follower-123';
    
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue({
      ...testUser,
      id: followerId,
    });

    // Step 1: Discover business
    vi.mocked(storage).getSpotlightBusinesses = vi.fn().mockResolvedValue([testBusiness]);

    const spotlightResponse = await agent
      .get('/api/spotlight')
      .expect(200);

    expect(spotlightResponse.body).toHaveProperty('daily');

    // Step 2: Follow business
    vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue(testBusiness);
    vi.mocked(storage).isFollowingBusiness = vi.fn().mockResolvedValue(false);
    vi.mocked(storage).followBusiness = vi.fn().mockResolvedValue(undefined);

    await agent
      .post(`/api/businesses/${testBusiness.id}/follow`)
      .set('Cookie', [`user=${followerId}`])
      .expect(200);

    // Step 3: Create and interact with posts
    const post = {
      id: 'post-123',
      businessId: testBusiness.id,
      content: 'Check out our new products!',
      mediaUrls: ['https://example.com/image.jpg'],
    };

    vi.mocked(storage).createPost = vi.fn().mockResolvedValue(post);

    // Business creates post
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(testUser);

    await agent
      .post('/api/posts')
      .set('Cookie', [`user=${testUser.id}`])
      .send({
        businessId: testBusiness.id,
        content: post.content,
        mediaUrls: post.mediaUrls,
      })
      .expect(201);

    // Follower likes post
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue({
      ...testUser,
      id: followerId,
    });
    vi.mocked(storage).getPostById = vi.fn().mockResolvedValue(post);
    vi.mocked(storage).togglePostLike = vi.fn().mockResolvedValue({
      liked: true,
      likesCount: 1,
    });

    await agent
      .post(`/api/posts/${post.id}/like`)
      .set('Cookie', [`user=${followerId}`])
      .expect(200);

    // Follower comments on post
    const comment = {
      id: 'comment-123',
      postId: post.id,
      userId: followerId,
      content: 'Great products!',
    };

    vi.mocked(storage).createPostComment = vi.fn().mockResolvedValue(comment);

    await agent
      .post(`/api/posts/${post.id}/comment`)
      .set('Cookie', [`user=${followerId}`])
      .send({ content: comment.content })
      .expect(201);
  });

  it('should handle spotlight voting', async () => {
    const agent = request.agent(app);
    const voterId = 'voter-123';
    
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue({
      ...testUser,
      id: voterId,
    });

    // Vote for business
    vi.mocked(storage).getBusinessById = vi.fn().mockResolvedValue(testBusiness);
    vi.mocked(storage).hasVotedForSpotlight = vi.fn().mockResolvedValue(false);
    vi.mocked(storage).voteForSpotlight = vi.fn().mockResolvedValue({
      voteCount: 10,
    });

    const voteResponse = await agent
      .post('/api/spotlight/vote')
      .set('Cookie', [`user=${voterId}`])
      .send({ businessId: testBusiness.id })
      .expect(200);

    expect(voteResponse.body).toHaveProperty('voteCount', 10);

    // Cannot vote twice
    vi.mocked(storage).hasVotedForSpotlight = vi.fn().mockResolvedValue(true);

    await agent
      .post('/api/spotlight/vote')
      .set('Cookie', [`user=${voterId}`])
      .send({ businessId: testBusiness.id })
      .expect(400);
  });
});

describe('Order Management Journey', () => {
  it('should handle order fulfillment flow', async () => {
    const agent = request.agent(app);
    const orderId = 'order-456';
    
    // Business owner views orders
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue(testUser);
    vi.mocked(storage).getBusinessOrders = vi.fn().mockResolvedValue([{
      id: orderId,
      businessId: testBusiness.id,
      status: 'processing',
      items: [{
        productId: testProduct.id,
        quantity: 2,
        price: testProduct.price,
      }],
    }]);

    const ordersResponse = await agent
      .get(`/api/businesses/${testBusiness.id}/orders`)
      .set('Cookie', [`user=${testUser.id}`])
      .expect(200);

    expect(ordersResponse.body.orders).toHaveLength(1);

    // Update order status
    vi.mocked(storage).updateOrderStatus = vi.fn().mockResolvedValue({
      id: orderId,
      status: 'shipped',
    });

    await agent
      .patch(`/api/orders/${orderId}/status`)
      .set('Cookie', [`user=${testUser.id}`])
      .send({ status: 'shipped', trackingNumber: 'TRACK123' })
      .expect(200);

    // Generate invoice
    vi.mocked(storage).getOrderById = vi.fn().mockResolvedValue({
      id: orderId,
      invoiceNumber: 'INV-2024-001',
    });

    const invoiceResponse = await agent
      .get(`/api/orders/${orderId}/invoice`)
      .set('Cookie', [`user=${testUser.id}`])
      .expect(200);

    expect(invoiceResponse.headers['content-type']).toContain('application/pdf');
  });
});

describe('Error Recovery Journey', () => {
  it('should handle payment failure and retry', async () => {
    const agent = request.agent(app);
    const buyerId = 'buyer-789';
    
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue({
      ...testUser,
      id: buyerId,
    });

    // Payment fails initially
    vi.mocked(stripeConnect.createPaymentIntent).mockRejectedValueOnce(
      new Error('Card declined')
    );

    await agent
      .post('/api/orders/create-payment-intent')
      .set('Cookie', [`user=${buyerId}`])
      .send({
        shippingAddress: '123 Main St',
        billingAddress: '123 Main St',
        customerEmail: 'buyer@example.com',
      })
      .expect(400);

    // Retry with different payment method
    vi.mocked(stripeConnect.createPaymentIntent).mockResolvedValue({
      id: 'pi_retry',
      client_secret: 'secret_retry',
      amount: 2999,
    });

    const retryResponse = await agent
      .post('/api/orders/create-payment-intent')
      .set('Cookie', [`user=${buyerId}`])
      .send({
        shippingAddress: '123 Main St',
        billingAddress: '123 Main St',
        customerEmail: 'buyer@example.com',
      })
      .expect(200);

    expect(retryResponse.body).toHaveProperty('clientSecret');
  });

  it('should handle out-of-stock scenarios', async () => {
    const agent = request.agent(app);
    const buyerId = 'buyer-out-stock';
    
    vi.mocked(storage).getUser = vi.fn().mockResolvedValue({
      ...testUser,
      id: buyerId,
    });

    // Product goes out of stock during checkout
    const outOfStockProduct = { ...testProduct, inventoryCount: 0 };
    
    vi.mocked(storage).getProductById = vi.fn().mockResolvedValue(outOfStockProduct);

    const response = await agent
      .post('/api/cart')
      .set('Cookie', [`user=${buyerId}`])
      .send({ productId: testProduct.id, quantity: 1 })
      .expect(400);

    expect(response.body.error).toContain('out of stock');
  });
});