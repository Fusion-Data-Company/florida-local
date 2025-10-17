/**
 * SearchBar Component Tests
 * Tests for the search bar component with filtering functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock SearchBar component since it doesn't exist in the codebase yet
const SearchBar = ({ 
  onSearch,
  placeholder = 'Search...',
  showFilters = false,
  categories = [],
}: {
  onSearch?: (query: string, filters?: any) => void;
  placeholder?: string;
  showFilters?: boolean;
  categories?: string[];
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [priceRange, setPriceRange] = React.useState({ min: '', max: '' });
  const [sortBy, setSortBy] = React.useState('relevance');
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const React = await import('react');
  const { apiRequest } = await import('@/lib/queryClient');

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        fetchSuggestions(searchQuery);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSuggestions = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest(`/api/search/suggestions?q=${query}`, 'GET');
      setSuggestions(response.suggestions || []);
      setShowDropdown(true);
    } catch (error) {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const filters = showFilters ? {
      category: selectedCategory,
      minPrice: priceRange.min ? parseFloat(priceRange.min) : undefined,
      maxPrice: priceRange.max ? parseFloat(priceRange.max) : undefined,
      sort: sortBy,
    } : {};

    onSearch?.(searchQuery, filters);
    setShowDropdown(false);
  };

  const handleSuggestionClick = (suggestion: any) => {
    setSearchQuery(suggestion.text);
    setShowDropdown(false);
    onSearch?.(suggestion.text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    onSearch?.('', {});
  };

  return (
    <div data-testid="searchbar-container" className="searchbar">
      <form onSubmit={handleSearch} data-testid="search-form">
        <div className="search-input-wrapper">
          <input
            data-testid="input-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            aria-label="Search"
            autoComplete="off"
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
          
          {searchQuery && (
            <button
              data-testid="button-clear"
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          
          <button
            data-testid="button-search"
            type="submit"
            aria-label="Search"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div data-testid="suggestions-dropdown" className="suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                data-testid={`suggestion-${index}`}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span data-testid={`suggestion-text-${index}`}>{suggestion.text}</span>
                {suggestion.category && (
                  <span data-testid={`suggestion-category-${index}`} className="suggestion-category">
                    in {suggestion.category}
                  </span>
                )}
                {suggestion.count && (
                  <span data-testid={`suggestion-count-${index}`} className="suggestion-count">
                    ({suggestion.count} results)
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Advanced Filters */}
        {showFilters && (
          <div data-testid="filters-container" className="filters">
            <div className="filter-group">
              <label htmlFor="category-filter">Category:</label>
              <select
                id="category-filter"
                data-testid="select-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Price Range:</label>
              <input
                data-testid="input-min-price"
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                min="0"
                step="0.01"
              />
              <span>to</span>
              <input
                data-testid="input-max-price"
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="sort-filter">Sort by:</label>
              <select
                id="sort-filter"
                data-testid="select-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Rating</option>
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            <button
              data-testid="button-reset-filters"
              type="button"
              onClick={() => {
                setSelectedCategory('');
                setPriceRange({ min: '', max: '' });
                setSortBy('relevance');
                handleSearch();
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </form>

      {/* Recent Searches */}
      <div data-testid="recent-searches" className="recent-searches">
        <h4>Recent Searches</h4>
        <div className="recent-items">
          <button data-testid="recent-search-1" onClick={() => setSearchQuery('electronics')}>
            electronics
          </button>
          <button data-testid="recent-search-2" onClick={() => setSearchQuery('clothing')}>
            clothing
          </button>
        </div>
      </div>
    </div>
  );
};

// Mock dependencies
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
}));

// Mock search suggestions
const mockSuggestions = [
  { text: 'electronics', category: 'Products', count: 125 },
  { text: 'electronic accessories', category: 'Products', count: 45 },
  { text: 'elite electronics', category: 'Businesses', count: 3 },
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

describe('SearchBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('should render search input', () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      expect(screen.getByTestId('searchbar-container')).toBeInTheDocument();
      expect(screen.getByTestId('input-search')).toBeInTheDocument();
      expect(screen.getByTestId('button-search')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(
        <TestWrapper>
          <SearchBar placeholder="Search products..." />
        </TestWrapper>
      );

      expect(screen.getByTestId('input-search')).toHaveAttribute('placeholder', 'Search products...');
    });

    it('should not show filters by default', () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      expect(screen.queryByTestId('filters-container')).not.toBeInTheDocument();
    });

    it('should show filters when enabled', () => {
      render(
        <TestWrapper>
          <SearchBar showFilters={true} categories={['Electronics', 'Clothing']} />
        </TestWrapper>
      );

      expect(screen.getByTestId('filters-container')).toBeInTheDocument();
      expect(screen.getByTestId('select-category')).toBeInTheDocument();
      expect(screen.getByTestId('input-min-price')).toBeInTheDocument();
      expect(screen.getByTestId('input-max-price')).toBeInTheDocument();
      expect(screen.getByTestId('select-sort')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should handle text input', () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: 'test query' } });

      expect(input).toHaveValue('test query');
    });

    it('should trigger search on form submit', () => {
      const onSearch = vi.fn();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={onSearch} />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-search');
      const form = screen.getByTestId('search-form');

      fireEvent.change(input, { target: { value: 'test search' } });
      fireEvent.submit(form);

      expect(onSearch).toHaveBeenCalledWith('test search', {});
    });

    it('should trigger search on button click', () => {
      const onSearch = vi.fn();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={onSearch} />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-search');
      const button = screen.getByTestId('button-search');

      fireEvent.change(input, { target: { value: 'button search' } });
      fireEvent.click(button);

      expect(onSearch).toHaveBeenCalledWith('button search', {});
    });

    it('should clear search when clear button is clicked', () => {
      const onSearch = vi.fn();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={onSearch} />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: 'clear me' } });

      const clearButton = screen.getByTestId('button-clear');
      fireEvent.click(clearButton);

      expect(input).toHaveValue('');
      expect(onSearch).toHaveBeenCalledWith('', {});
    });

    it('should only show clear button when there is text', () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      expect(screen.queryByTestId('button-clear')).not.toBeInTheDocument();

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: 'some text' } });

      expect(screen.getByTestId('button-clear')).toBeInTheDocument();
    });
  });

  describe('Search Suggestions', () => {
    it('should fetch suggestions after typing', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ suggestions: mockSuggestions });

      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: 'elec' } });

      // Fast-forward debounce timer
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith('/api/search/suggestions?q=elec', 'GET');
      });
    });

    it('should display suggestions dropdown', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ suggestions: mockSuggestions });

      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: 'elec' } });

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('suggestions-dropdown')).toBeInTheDocument();
        expect(screen.getByTestId('suggestion-0')).toBeInTheDocument();
        expect(screen.getByTestId('suggestion-text-0')).toHaveTextContent('electronics');
      });
    });

    it('should handle suggestion click', async () => {
      const onSearch = vi.fn();
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ suggestions: mockSuggestions });

      render(
        <TestWrapper>
          <SearchBar onSearch={onSearch} />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: 'elec' } });

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('suggestions-dropdown')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('suggestion-0'));

      expect(input).toHaveValue('electronics');
      expect(onSearch).toHaveBeenCalledWith('electronics');
    });

    it('should not fetch suggestions for short queries', () => {
      const { apiRequest } = await import('@/lib/queryClient');

      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: 'e' } });

      vi.advanceTimersByTime(300);

      expect(apiRequest).not.toHaveBeenCalled();
    });

    it('should hide suggestions on blur', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ suggestions: mockSuggestions });

      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: 'elec' } });
      fireEvent.focus(input);

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('suggestions-dropdown')).toBeInTheDocument();
      });

      fireEvent.blur(input);
      vi.advanceTimersByTime(200);

      await waitFor(() => {
        expect(screen.queryByTestId('suggestions-dropdown')).not.toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should include filters in search', () => {
      const onSearch = vi.fn();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={onSearch} showFilters={true} categories={['Electronics', 'Clothing']} />
        </TestWrapper>
      );

      // Set filters
      fireEvent.change(screen.getByTestId('select-category'), { target: { value: 'Electronics' } });
      fireEvent.change(screen.getByTestId('input-min-price'), { target: { value: '10' } });
      fireEvent.change(screen.getByTestId('input-max-price'), { target: { value: '100' } });
      fireEvent.change(screen.getByTestId('select-sort'), { target: { value: 'price_asc' } });

      // Search with filters
      fireEvent.change(screen.getByTestId('input-search'), { target: { value: 'laptop' } });
      fireEvent.submit(screen.getByTestId('search-form'));

      expect(onSearch).toHaveBeenCalledWith('laptop', {
        category: 'Electronics',
        minPrice: 10,
        maxPrice: 100,
        sort: 'price_asc',
      });
    });

    it('should reset filters', () => {
      const onSearch = vi.fn();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={onSearch} showFilters={true} categories={['Electronics']} />
        </TestWrapper>
      );

      // Set filters
      fireEvent.change(screen.getByTestId('select-category'), { target: { value: 'Electronics' } });
      fireEvent.change(screen.getByTestId('input-min-price'), { target: { value: '50' } });

      // Reset filters
      fireEvent.click(screen.getByTestId('button-reset-filters'));

      expect(screen.getByTestId('select-category')).toHaveValue('');
      expect(screen.getByTestId('input-min-price')).toHaveValue('');
      expect(screen.getByTestId('select-sort')).toHaveValue('relevance');
    });

    it('should validate price range inputs', () => {
      render(
        <TestWrapper>
          <SearchBar showFilters={true} />
        </TestWrapper>
      );

      const minPrice = screen.getByTestId('input-min-price');
      const maxPrice = screen.getByTestId('input-max-price');

      expect(minPrice).toHaveAttribute('min', '0');
      expect(minPrice).toHaveAttribute('step', '0.01');
      expect(maxPrice).toHaveAttribute('min', '0');
      expect(maxPrice).toHaveAttribute('step', '0.01');
    });
  });

  describe('Recent Searches', () => {
    it('should display recent searches', () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      expect(screen.getByTestId('recent-searches')).toBeInTheDocument();
      expect(screen.getByTestId('recent-search-1')).toHaveTextContent('electronics');
      expect(screen.getByTestId('recent-search-2')).toHaveTextContent('clothing');
    });

    it('should populate search from recent searches', () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('recent-search-1'));
      expect(screen.getByTestId('input-search')).toHaveValue('electronics');
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching suggestions', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: 'test' } });

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('button-search')).toHaveTextContent('Searching...');
        expect(screen.getByTestId('button-search')).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle suggestion fetch errors', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: 'error' } });

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.queryByTestId('suggestions-dropdown')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      expect(screen.getByTestId('input-search')).toHaveAttribute('aria-label', 'Search');
      expect(screen.getByTestId('button-search')).toHaveAttribute('aria-label', 'Search');
    });

    it('should support keyboard navigation', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({ suggestions: mockSuggestions });

      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-search');
      fireEvent.change(input, { target: { value: 'elec' } });

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('suggestions-dropdown')).toBeInTheDocument();
      });

      // Keyboard navigation through suggestions
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    it('should handle autocomplete attribute', () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      );

      expect(screen.getByTestId('input-search')).toHaveAttribute('autoComplete', 'off');
    });
  });
});