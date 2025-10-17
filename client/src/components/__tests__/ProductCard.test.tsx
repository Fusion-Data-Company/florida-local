/**
 * ProductCard Component Tests
 * Tests for the ProductCard component with various states and interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import ProductCard from '../product-card';
import type { Product } from '@shared/types';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123', username: 'testuser', isAdmin: false },
    isAuthenticated: true,
  })),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
}));

// Mock product data
const mockProduct: Product = {
  id: 'product-123',
  businessId: 'business-123',
  name: 'Test Product',
  description: 'A high-quality product for testing',
  price: 29.99,
  salePrice: 24.99,
  category: 'Electronics',
  tags: ['tech', 'gadget', 'popular'],
  images: [
    'https://example.com/product1.jpg',
    'https://example.com/product2.jpg',
  ],
  inventoryCount: 50,
  isActive: true,
  isDigital: false,
  shippingInfo: {
    weight: 1.5,
    dimensions: { length: 10, width: 8, height: 5 },
    shippingCost: 5.99,
  },
  rating: 4.2,
  reviewCount: 18,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('ProductCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render product information correctly', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('text-product-name')).toHaveTextContent('Test Product');
      expect(screen.getByTestId('text-product-description')).toHaveTextContent('A high-quality product for testing');
      expect(screen.getByTestId('text-product-category')).toHaveTextContent('Electronics');
      expect(screen.getByTestId('text-product-price')).toHaveTextContent('$29.99');
    });

    it('should display sale price when available', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('text-sale-price')).toHaveTextContent('$24.99');
      expect(screen.getByTestId('text-original-price')).toHaveTextContent('$29.99');
      expect(screen.getByTestId('text-original-price')).toHaveClass('line-through');
    });

    it('should not display sale price when not on sale', () => {
      const regularProduct = { ...mockProduct, salePrice: undefined };

      render(
        <TestWrapper>
          <ProductCard product={regularProduct} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('text-sale-price')).not.toBeInTheDocument();
      expect(screen.getByTestId('text-product-price')).not.toHaveClass('line-through');
    });

    it('should display discount percentage', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const discountPercentage = Math.round(((29.99 - 24.99) / 29.99) * 100);
      expect(screen.getByTestId('badge-discount')).toHaveTextContent(`${discountPercentage}% OFF`);
    });

    it('should display product tags', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('tag-tech')).toHaveTextContent('tech');
      expect(screen.getByTestId('tag-gadget')).toHaveTextContent('gadget');
      expect(screen.getByTestId('tag-popular')).toHaveTextContent('popular');
    });
  });

  describe('Inventory Display', () => {
    it('should show in-stock status when inventory is available', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('badge-stock-status')).toHaveTextContent('In Stock');
      expect(screen.getByTestId('text-inventory-count')).toHaveTextContent('50 available');
    });

    it('should show out-of-stock status when inventory is zero', () => {
      const outOfStockProduct = { ...mockProduct, inventoryCount: 0 };

      render(
        <TestWrapper>
          <ProductCard product={outOfStockProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('badge-stock-status')).toHaveTextContent('Out of Stock');
      expect(screen.getByTestId('button-add-to-cart')).toBeDisabled();
    });

    it('should show low stock warning', () => {
      const lowStockProduct = { ...mockProduct, inventoryCount: 3 };

      render(
        <TestWrapper>
          <ProductCard product={lowStockProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('badge-low-stock')).toHaveTextContent('Only 3 left!');
    });
  });

  describe('User Interactions', () => {
    it('should handle add to cart button click', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const addToCartButton = screen.getByTestId('button-add-to-cart');
      fireEvent.click(addToCartButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          '/api/cart',
          'POST',
          {
            productId: mockProduct.id,
            quantity: 1,
          }
        );
      });
    });

    it('should handle quantity selection before adding to cart', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const quantityInput = screen.getByTestId('input-quantity');
      fireEvent.change(quantityInput, { target: { value: '3' } });

      const addToCartButton = screen.getByTestId('button-add-to-cart');
      fireEvent.click(addToCartButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          '/api/cart',
          'POST',
          {
            productId: mockProduct.id,
            quantity: 3,
          }
        );
      });
    });

    it('should handle wishlist button click', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const wishlistButton = screen.getByTestId('button-wishlist');
      fireEvent.click(wishlistButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          `/api/wishlist/${mockProduct.id}`,
          'POST'
        );
      });
    });

    it('should open quick view modal', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const quickViewButton = screen.getByTestId('button-quick-view');
      fireEvent.click(quickViewButton);

      expect(screen.getByTestId('modal-quick-view')).toBeInTheDocument();
    });

    it('should navigate to product details', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const productLink = screen.getByTestId('link-product-details');
      expect(productLink).toHaveAttribute('href', `/products/${mockProduct.id}`);
    });
  });

  describe('Image Gallery', () => {
    it('should display main product image', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const mainImage = screen.getByTestId('img-product-main');
      expect(mainImage).toHaveAttribute('src', mockProduct.images?.[0]);
    });

    it('should handle image carousel navigation', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const nextButton = screen.getByTestId('button-next-image');
      fireEvent.click(nextButton);

      const mainImage = screen.getByTestId('img-product-main');
      expect(mainImage).toHaveAttribute('src', mockProduct.images?.[1]);
    });

    it('should display thumbnail images', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const thumbnail1 = screen.getByTestId('img-thumbnail-0');
      const thumbnail2 = screen.getByTestId('img-thumbnail-1');

      expect(thumbnail1).toHaveAttribute('src', mockProduct.images?.[0]);
      expect(thumbnail2).toHaveAttribute('src', mockProduct.images?.[1]);
    });

    it('should change main image on thumbnail click', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const thumbnail2 = screen.getByTestId('img-thumbnail-1');
      fireEvent.click(thumbnail2);

      const mainImage = screen.getByTestId('img-product-main');
      expect(mainImage).toHaveAttribute('src', mockProduct.images?.[1]);
    });
  });

  describe('Digital Products', () => {
    it('should display digital product badge', () => {
      const digitalProduct = { ...mockProduct, isDigital: true };

      render(
        <TestWrapper>
          <ProductCard product={digitalProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('badge-digital')).toHaveTextContent('Digital Product');
    });

    it('should not show shipping info for digital products', () => {
      const digitalProduct = { ...mockProduct, isDigital: true };

      render(
        <TestWrapper>
          <ProductCard product={digitalProduct} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('text-shipping-cost')).not.toBeInTheDocument();
    });

    it('should show instant delivery message for digital products', () => {
      const digitalProduct = { ...mockProduct, isDigital: true };

      render(
        <TestWrapper>
          <ProductCard product={digitalProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('text-delivery-info')).toHaveTextContent('Instant Delivery');
    });
  });

  describe('Ratings and Reviews', () => {
    it('should display product rating', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('text-rating')).toHaveTextContent('4.2');
      expect(screen.getByTestId('text-review-count')).toHaveTextContent('(18 reviews)');
    });

    it('should display star rating visualization', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const stars = screen.getAllByTestId(/star-/);
      expect(stars).toHaveLength(5);

      // Check that 4 stars are filled (4.2 rating)
      expect(screen.getByTestId('star-1')).toHaveClass('filled');
      expect(screen.getByTestId('star-2')).toHaveClass('filled');
      expect(screen.getByTestId('star-3')).toHaveClass('filled');
      expect(screen.getByTestId('star-4')).toHaveClass('filled');
      expect(screen.getByTestId('star-5')).not.toHaveClass('filled');
    });

    it('should show no ratings message when not rated', () => {
      const unratedProduct = { ...mockProduct, rating: undefined, reviewCount: 0 };

      render(
        <TestWrapper>
          <ProductCard product={unratedProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('text-no-ratings')).toHaveTextContent('No ratings yet');
    });
  });

  describe('Shipping Information', () => {
    it('should display shipping cost', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('text-shipping-cost')).toHaveTextContent('$5.99 shipping');
    });

    it('should display free shipping for qualifying products', () => {
      const freeShippingProduct = { 
        ...mockProduct, 
        shippingInfo: { ...mockProduct.shippingInfo, shippingCost: 0 },
      };

      render(
        <TestWrapper>
          <ProductCard product={freeShippingProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('badge-free-shipping')).toHaveTextContent('Free Shipping');
    });

    it('should display product weight and dimensions', () => {
      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('text-product-weight')).toHaveTextContent('1.5 lbs');
      expect(screen.getByTestId('text-product-dimensions')).toHaveTextContent('10" × 8" × 5"');
    });
  });

  describe('Error Handling', () => {
    it('should handle add to cart error gracefully', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      const { useToast } = await import('@/hooks/use-toast');
      const mockToast = vi.fn();
      vi.mocked(useToast).mockReturnValue({ toast: mockToast });
      
      vi.mocked(apiRequest).mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const addToCartButton = screen.getByTestId('button-add-to-cart');
      fireEvent.click(addToCartButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: expect.stringContaining('Failed to add to cart'),
            variant: 'destructive',
          })
        );
      });
    });

    it('should display placeholder when image fails to load', () => {
      const productWithBrokenImage = { 
        ...mockProduct, 
        images: ['https://broken.url/image.jpg'],
      };

      render(
        <TestWrapper>
          <ProductCard product={productWithBrokenImage} />
        </TestWrapper>
      );

      const image = screen.getByTestId('img-product-main');
      fireEvent.error(image);

      expect(screen.getByTestId('img-placeholder')).toBeInTheDocument();
    });
  });

  describe('Inactive Product State', () => {
    it('should show unavailable badge for inactive products', () => {
      const inactiveProduct = { ...mockProduct, isActive: false };

      render(
        <TestWrapper>
          <ProductCard product={inactiveProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('badge-unavailable')).toHaveTextContent('Unavailable');
    });

    it('should disable add to cart for inactive products', () => {
      const inactiveProduct = { ...mockProduct, isActive: false };

      render(
        <TestWrapper>
          <ProductCard product={inactiveProduct} />
        </TestWrapper>
      );

      expect(screen.getByTestId('button-add-to-cart')).toBeDisabled();
    });
  });

  describe('Authentication State', () => {
    it('should show login prompt when not authenticated', () => {
      const { useAuth } = vi.mocked(await import('@/hooks/useAuth'));
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const addToCartButton = screen.getByTestId('button-add-to-cart');
      fireEvent.click(addToCartButton);

      expect(screen.getByTestId('text-login-prompt')).toHaveTextContent('Please login to add items to cart');
    });
  });
});