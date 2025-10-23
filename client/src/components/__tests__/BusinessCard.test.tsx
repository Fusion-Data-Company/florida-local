/**
 * BusinessCard Component Tests
 * Tests for the BusinessCard component with various states and interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import BusinessCard from '../business-card';
import type { Business } from '@shared/types';

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

// Mock business data
const mockBusiness: Business = {
  id: 'business-123',
  ownerId: 'owner-123',
  name: 'Test Business',
  tagline: 'Your trusted partner',
  category: 'Retail',
  location: 'Miami, FL',
  description: 'A great business providing excellent services',
  contactEmail: 'contact@business.com',
  contactPhone: '555-0100',
  websiteUrl: 'https://business.com',
  logoUrl: 'https://example.com/logo.jpg',
  bannerImageUrl: 'https://example.com/banner.jpg',
  socialLinks: {
    facebook: 'https://facebook.com/testbusiness',
    twitter: 'https://twitter.com/testbusiness',
    instagram: 'https://instagram.com/testbusiness',
  },
  businessHours: {
    monday: { open: '09:00', close: '17:00' },
    tuesday: { open: '09:00', close: '17:00' },
    wednesday: { open: '09:00', close: '17:00' },
    thursday: { open: '09:00', close: '17:00' },
    friday: { open: '09:00', close: '17:00' },
    saturday: { open: '10:00', close: '14:00' },
    sunday: { closed: true },
  },
  rating: 4.5,
  reviewCount: 25,
  followerCount: 150,
  isVerified: true,
  verificationTier: 'gold',
  isActive: true,
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
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('BusinessCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render business information correctly', () => {
      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      expect(screen.getByTestId('text-business-name')).toHaveTextContent('Test Business');
      expect(screen.getByTestId('text-business-tagline')).toHaveTextContent('Your trusted partner');
      expect(screen.getByTestId('text-business-category')).toHaveTextContent('Retail');
      expect(screen.getByTestId('text-business-location')).toHaveTextContent('Miami, FL');
      expect(screen.getByTestId('text-business-description')).toHaveTextContent('A great business providing excellent services');
    });

    it('should render verification badge for verified businesses', () => {
      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      expect(screen.getByTestId('badge-verified')).toBeInTheDocument();
      expect(screen.getByTestId('badge-verified-tier')).toHaveTextContent('gold');
    });

    it('should not render verification badge for unverified businesses', () => {
      const unverifiedBusiness = { ...mockBusiness, isVerified: false };
      
      render(
        <TestWrapper>
          <BusinessCard business={unverifiedBusiness} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('badge-verified')).not.toBeInTheDocument();
    });

    it('should display rating and review count', () => {
      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      expect(screen.getByTestId('text-rating')).toHaveTextContent('4.5');
      expect(screen.getByTestId('text-review-count')).toHaveTextContent('25 reviews');
    });

    it('should display follower count', () => {
      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      expect(screen.getByTestId('text-follower-count')).toHaveTextContent('150 followers');
    });
  });

  describe('Spotlight Features', () => {
    it('should display daily spotlight badge', () => {
      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} spotlightType="daily" spotlightPosition={1} />
        </TestWrapper>
      );

      expect(screen.getByTestId('badge-spotlight-daily')).toBeInTheDocument();
      expect(screen.getByTestId('text-spotlight-position')).toHaveTextContent('#1');
    });

    it('should display weekly spotlight badge', () => {
      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} spotlightType="weekly" spotlightPosition={2} />
        </TestWrapper>
      );

      expect(screen.getByTestId('badge-spotlight-weekly')).toBeInTheDocument();
      expect(screen.getByTestId('text-spotlight-position')).toHaveTextContent('#2');
    });

    it('should display monthly spotlight badge', () => {
      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} spotlightType="monthly" spotlightPosition={3} />
        </TestWrapper>
      );

      expect(screen.getByTestId('badge-spotlight-monthly')).toBeInTheDocument();
      expect(screen.getByTestId('text-spotlight-position')).toHaveTextContent('#3');
    });

    it('should not display spotlight badge when not in spotlight', () => {
      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      expect(screen.queryByTestId(/badge-spotlight/)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle follow button click', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      const followButton = screen.getByTestId('button-follow');
      fireEvent.click(followButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          `/api/businesses/${mockBusiness.id}/follow`,
          'POST'
        );
      });
    });

    it('should handle unfollow button click', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ success: true });

      // Mock that user is already following
      const followedBusiness = { ...mockBusiness, isFollowing: true };

      render(
        <TestWrapper>
          <BusinessCard business={followedBusiness} />
        </TestWrapper>
      );

      const unfollowButton = screen.getByTestId('button-unfollow');
      fireEvent.click(unfollowButton);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          `/api/businesses/${mockBusiness.id}/follow`,
          'DELETE'
        );
      });
    });

    it('should navigate to business details on card click', () => {
      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      const businessLink = screen.getByTestId('link-business-details');
      expect(businessLink).toHaveAttribute('href', `/businesses/${mockBusiness.id}`);
    });

    it('should show view products button', () => {
      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      const viewProductsButton = screen.getByTestId('button-view-products');
      expect(viewProductsButton).toBeInTheDocument();
      expect(viewProductsButton).toHaveAttribute('href', `/businesses/${mockBusiness.id}/products`);
    });

    it('should disable follow button when not authenticated', () => {
      const { useAuth } = vi.mocked(await import('@/hooks/useAuth'));
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      const followButton = screen.getByTestId('button-follow');
      expect(followButton).toBeDisabled();
    });
  });

  describe('Business Hours Display', () => {
    it('should show open status during business hours', () => {
      // Mock current time to be during business hours
      const mockDate = new Date('2024-01-15T10:00:00');
      vi.setSystemTime(mockDate);

      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      expect(screen.getByTestId('badge-open-status')).toHaveTextContent('Open');

      vi.useRealTimers();
    });

    it('should show closed status outside business hours', () => {
      // Mock current time to be outside business hours
      const mockDate = new Date('2024-01-15T20:00:00');
      vi.setSystemTime(mockDate);

      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      expect(screen.getByTestId('badge-open-status')).toHaveTextContent('Closed');

      vi.useRealTimers();
    });

    it('should show closed on Sunday', () => {
      // Mock current time to be Sunday
      const mockDate = new Date('2024-01-14T12:00:00'); // Sunday
      vi.setSystemTime(mockDate);

      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      expect(screen.getByTestId('badge-open-status')).toHaveTextContent('Closed');

      vi.useRealTimers();
    });
  });

  describe('Social Links', () => {
    it('should render social media links', () => {
      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      expect(screen.getByTestId('link-facebook')).toHaveAttribute('href', mockBusiness.socialLinks?.facebook);
      expect(screen.getByTestId('link-twitter')).toHaveAttribute('href', mockBusiness.socialLinks?.twitter);
      expect(screen.getByTestId('link-instagram')).toHaveAttribute('href', mockBusiness.socialLinks?.instagram);
    });

    it('should not render social links when not provided', () => {
      const businessWithoutSocial = { ...mockBusiness, socialLinks: undefined };

      render(
        <TestWrapper>
          <BusinessCard business={businessWithoutSocial} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('link-facebook')).not.toBeInTheDocument();
      expect(screen.queryByTestId('link-twitter')).not.toBeInTheDocument();
      expect(screen.queryByTestId('link-instagram')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle follow error gracefully', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      const { useToast } = await import('@/hooks/use-toast');
      const mockToast = vi.fn();
      vi.mocked(useToast).mockReturnValue({ toast: mockToast });
      
      vi.mocked(apiRequest).mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      const followButton = screen.getByTestId('button-follow');
      fireEvent.click(followButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: expect.stringContaining('Failed to follow'),
            variant: 'destructive',
          })
        );
      });
    });

    it('should display placeholder when image fails to load', () => {
      const businessWithBrokenImage = { ...mockBusiness, logoUrl: 'https://broken.url/image.jpg' };

      render(
        <TestWrapper>
          <BusinessCard business={businessWithBrokenImage} />
        </TestWrapper>
      );

      const logo = screen.getByTestId('img-business-logo');
      fireEvent.error(logo);

      expect(screen.getByTestId('img-placeholder')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply correct styles for mobile view', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      const card = screen.getByTestId('card-business');
      expect(card).toHaveClass('flex-col');
    });

    it('should apply correct styles for desktop view', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));

      render(
        <TestWrapper>
          <BusinessCard business={mockBusiness} />
        </TestWrapper>
      );

      const card = screen.getByTestId('card-business');
      expect(card).toHaveClass('flex-row');
    });
  });

  describe('Inactive Business State', () => {
    it('should show inactive badge for inactive businesses', () => {
      const inactiveBusiness = { ...mockBusiness, isActive: false };

      render(
        <TestWrapper>
          <BusinessCard business={inactiveBusiness} />
        </TestWrapper>
      );

      expect(screen.getByTestId('badge-inactive')).toBeInTheDocument();
      expect(screen.getByTestId('badge-inactive')).toHaveTextContent('Inactive');
    });

    it('should disable interactions for inactive businesses', () => {
      const inactiveBusiness = { ...mockBusiness, isActive: false };

      render(
        <TestWrapper>
          <BusinessCard business={inactiveBusiness} />
        </TestWrapper>
      );

      expect(screen.getByTestId('button-follow')).toBeDisabled();
      expect(screen.getByTestId('button-view-products')).toBeDisabled();
    });
  });
});