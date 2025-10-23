/**
 * Cart Component Tests
 * Tests for the shopping cart component with add/remove functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock Cart component since it doesn't exist in the codebase yet
const Cart = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  const { useQuery, useMutation } = await import('@tanstack/react-query');
  const { apiRequest, queryClient } = await import('@/lib/queryClient');
  
  // Fetch cart items
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['/api/cart'],
    enabled: isOpen,
  });

  // Update item quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      apiRequest(`/api/cart/${itemId}`, 'PATCH', { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest(`/api/cart/${itemId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: () => apiRequest('/api/cart/clear', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const calculateTotal = () => {
    return cartItems.reduce((total: number, item: any) => 
      total + (item.price * item.quantity), 0
    );
  };

  if (!isOpen) return null;

  return (
    <div data-testid="cart-container" className="cart-sidebar">
      <div className="cart-header">
        <h2 data-testid="text-cart-title">Shopping Cart</h2>
        <button data-testid="button-close-cart" onClick={onClose}>×</button>
      </div>

      {isLoading && <div data-testid="loader-cart">Loading cart...</div>}

      {!isLoading && cartItems.length === 0 && (
        <div data-testid="text-empty-cart">Your cart is empty</div>
      )}

      {!isLoading && cartItems.length > 0 && (
        <>
          <div className="cart-items">
            {cartItems.map((item: any) => (
              <div key={item.id} data-testid={`cart-item-${item.id}`} className="cart-item">
                <img 
                  data-testid={`img-cart-item-${item.id}`}
                  src={item.product?.images?.[0] || '/placeholder.jpg'} 
                  alt={item.product?.name} 
                />
                <div className="item-details">
                  <h3 data-testid={`text-item-name-${item.id}`}>{item.product?.name}</h3>
                  <p data-testid={`text-item-price-${item.id}`}>${item.price}</p>
                  
                  <div className="quantity-controls">
                    <button
                      data-testid={`button-decrease-${item.id}`}
                      onClick={() => updateQuantityMutation.mutate({ 
                        itemId: item.id, 
                        quantity: Math.max(1, item.quantity - 1) 
                      })}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span data-testid={`text-quantity-${item.id}`}>{item.quantity}</span>
                    <button
                      data-testid={`button-increase-${item.id}`}
                      onClick={() => updateQuantityMutation.mutate({ 
                        itemId: item.id, 
                        quantity: item.quantity + 1 
                      })}
                    >
                      +
                    </button>
                  </div>
                  
                  <button
                    data-testid={`button-remove-${item.id}`}
                    onClick={() => removeItemMutation.mutate(item.id)}
                  >
                    Remove
                  </button>
                </div>
                <div data-testid={`text-subtotal-${item.id}`}>
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <div className="cart-total">
              <span data-testid="text-total-label">Total:</span>
              <span data-testid="text-total-amount">${calculateTotal().toFixed(2)}</span>
            </div>
            
            <button
              data-testid="button-clear-cart"
              onClick={() => clearCartMutation.mutate()}
              className="btn-secondary"
            >
              Clear Cart
            </button>
            
            <a
              href="/checkout"
              data-testid="button-checkout"
              className="btn-primary"
            >
              Checkout
            </a>
          </div>
        </>
      )}
    </div>
  );
};

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

// Mock cart items data
const mockCartItems = [
  {
    id: 'item-1',
    userId: 'user-123',
    productId: 'product-1',
    quantity: 2,
    price: 29.99,
    product: {
      id: 'product-1',
      name: 'Test Product 1',
      description: 'First test product',
      images: ['https://example.com/product1.jpg'],
      inventoryCount: 50,
    },
  },
  {
    id: 'item-2',
    userId: 'user-123',
    productId: 'product-2',
    quantity: 1,
    price: 49.99,
    product: {
      id: 'product-2',
      name: 'Test Product 2',
      description: 'Second test product',
      images: ['https://example.com/product2.jpg'],
      inventoryCount: 10,
    },
  },
];

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
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('Cart Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render when open', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ items: mockCartItems });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cart-container')).toBeInTheDocument();
        expect(screen.getByTestId('text-cart-title')).toHaveTextContent('Shopping Cart');
      });
    });

    it('should not render when closed', () => {
      render(
        <TestWrapper>
          <Cart isOpen={false} onClose={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('cart-container')).not.toBeInTheDocument();
    });

    it('should show empty cart message', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ items: [] });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('text-empty-cart')).toHaveTextContent('Your cart is empty');
      });
    });

    it('should show loading state', () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.getByTestId('loader-cart')).toHaveTextContent('Loading cart...');
    });
  });

  describe('Cart Items Display', () => {
    it('should display all cart items', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ items: mockCartItems });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cart-item-item-1')).toBeInTheDocument();
        expect(screen.getByTestId('cart-item-item-2')).toBeInTheDocument();
      });

      expect(screen.getByTestId('text-item-name-item-1')).toHaveTextContent('Test Product 1');
      expect(screen.getByTestId('text-item-name-item-2')).toHaveTextContent('Test Product 2');
    });

    it('should display correct prices and quantities', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ items: mockCartItems });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('text-item-price-item-1')).toHaveTextContent('$29.99');
        expect(screen.getByTestId('text-quantity-item-1')).toHaveTextContent('2');
        expect(screen.getByTestId('text-subtotal-item-1')).toHaveTextContent('$59.98');
      });
    });

    it('should calculate and display total correctly', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ items: mockCartItems });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        const total = (29.99 * 2) + (49.99 * 1);
        expect(screen.getByTestId('text-total-amount')).toHaveTextContent(`$${total.toFixed(2)}`);
      });
    });
  });

  describe('Quantity Management', () => {
    it('should increase item quantity', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest)
        .mockResolvedValueOnce({ items: mockCartItems })
        .mockResolvedValueOnce({ success: true });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cart-item-item-1')).toBeInTheDocument();
      });

      const increaseButton = screen.getByTestId('button-increase-item-1');
      fireEvent.click(increaseButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          '/api/cart/item-1',
          'PATCH',
          { quantity: 3 }
        );
      });
    });

    it('should decrease item quantity', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest)
        .mockResolvedValueOnce({ items: mockCartItems })
        .mockResolvedValueOnce({ success: true });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cart-item-item-1')).toBeInTheDocument();
      });

      const decreaseButton = screen.getByTestId('button-decrease-item-1');
      fireEvent.click(decreaseButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          '/api/cart/item-1',
          'PATCH',
          { quantity: 1 }
        );
      });
    });

    it('should disable decrease button at quantity 1', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      const singleItemCart = [{
        ...mockCartItems[1],
        quantity: 1,
      }];
      
      vi.mocked(apiRequest).mockResolvedValue({ items: singleItemCart });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        const decreaseButton = screen.getByTestId('button-decrease-item-2');
        expect(decreaseButton).toBeDisabled();
      });
    });
  });

  describe('Item Removal', () => {
    it('should remove item from cart', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest)
        .mockResolvedValueOnce({ items: mockCartItems })
        .mockResolvedValueOnce({ success: true });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cart-item-item-1')).toBeInTheDocument();
      });

      const removeButton = screen.getByTestId('button-remove-item-1');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('/api/cart/item-1', 'DELETE');
      });
    });

    it('should clear entire cart', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest)
        .mockResolvedValueOnce({ items: mockCartItems })
        .mockResolvedValueOnce({ success: true });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cart-item-item-1')).toBeInTheDocument();
      });

      const clearButton = screen.getByTestId('button-clear-cart');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('/api/cart/clear', 'POST');
      });
    });
  });

  describe('Cart Interactions', () => {
    it('should close cart when close button is clicked', async () => {
      const onClose = vi.fn();
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ items: mockCartItems });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={onClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cart-container')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('button-close-cart');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should navigate to checkout', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ items: mockCartItems });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        const checkoutButton = screen.getByTestId('button-checkout');
        expect(checkoutButton).toHaveAttribute('href', '/checkout');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      const { useToast } = await import('@/hooks/use-toast');
      const mockToast = vi.fn();
      vi.mocked(useToast).mockReturnValue({ toast: mockToast });
      
      vi.mocked(apiRequest).mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loader-cart')).not.toBeInTheDocument();
      });
    });

    it('should handle update quantity errors', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest)
        .mockResolvedValueOnce({ items: mockCartItems })
        .mockRejectedValueOnce(new Error('Update failed'));

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cart-item-item-1')).toBeInTheDocument();
      });

      const increaseButton = screen.getByTestId('button-increase-item-1');
      fireEvent.click(increaseButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          '/api/cart/item-1',
          'PATCH',
          { quantity: 3 }
        );
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh cart after item addition', async () => {
      const { apiRequest, queryClient } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ items: mockCartItems });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cart-item-item-1')).toBeInTheDocument();
      });

      // Simulate external cart update
      await queryClient.invalidateQueries({ queryKey: ['/api/cart'] });

      // Cart should refetch
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('/api/cart'));
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ items: mockCartItems });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('button-close-cart')).toHaveAttribute('aria-label');
        expect(screen.getByTestId('button-increase-item-1')).toHaveAttribute('aria-label');
        expect(screen.getByTestId('button-decrease-item-1')).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ items: mockCartItems });

      render(
        <TestWrapper>
          <Cart isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        const closeButton = screen.getByTestId('button-close-cart');
        closeButton.focus();
        expect(document.activeElement).toBe(closeButton);

        // Tab to next element
        fireEvent.keyDown(closeButton, { key: 'Tab' });
      });
    });
  });
});