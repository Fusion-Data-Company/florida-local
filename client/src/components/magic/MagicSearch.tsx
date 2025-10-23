import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp, 
  Filter,
  MapPin,
  Star,
  Users,
  ShoppingBag,
  Building,
  Mic,
  MicOff,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'business' | 'product' | 'location' | 'category';
  image?: string;
  rating?: number;
  reviews?: number;
  distance?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'trending' | 'category' | 'business';
  icon?: React.ReactNode;
}

export interface MagicSearchProps {
  placeholder?: string;
  onSearch: (query: string, filters?: SearchFilters) => Promise<SearchResult[]>;
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  recentSearches?: string[];
  trendingSearches?: string[];
  categories?: Array<{ id: string; name: string; icon?: React.ReactNode }>;
  voiceSearchEnabled?: boolean;
  aiPowered?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface SearchFilters {
  type?: string[];
  location?: string;
  rating?: number;
  priceRange?: [number, number];
  distance?: number;
}

export default function MagicSearch({
  placeholder = "Search businesses, products, locations...",
  onSearch,
  onSuggestionClick,
  recentSearches = [],
  trendingSearches = [],
  categories = [],
  voiceSearchEnabled = false,
  aiPowered = false,
  className,
  size = 'md'
}: MagicSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Voice recognition setup
  useEffect(() => {
    if (voiceSearchEnabled && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setShowSuggestions(false);
        handleSearch(transcript);
      };

      recognitionRef.current.onerror = () => {
        setIsVoiceSearching(false);
      };

      recognitionRef.current.onend = () => {
        setIsVoiceSearching(false);
      };
    }
  }, [voiceSearchEnabled]);

  // Generate suggestions based on query
  useEffect(() => {
    if (!query.trim()) {
      const defaultSuggestions: SearchSuggestion[] = [
        ...recentSearches.slice(0, 3).map(search => ({
          id: `recent-${search}`,
          text: search,
          type: 'recent' as const,
          icon: <Clock className="h-4 w-4" />
        })),
        ...trendingSearches.slice(0, 3).map(search => ({
          id: `trending-${search}`,
          text: search,
          type: 'trending' as const,
          icon: <TrendingUp className="h-4 w-4" />
        })),
        ...categories.slice(0, 4).map(category => ({
          id: `category-${category.id}`,
          text: category.name,
          type: 'category' as const,
          icon: category.icon
        }))
      ];
      setSuggestions(defaultSuggestions);
    } else {
      // Generate AI-powered suggestions
      const aiSuggestions: SearchSuggestion[] = [
        { id: 'ai-1', text: `Best ${query} near me`, type: 'category' },
        { id: 'ai-2', text: `${query} with high ratings`, type: 'category' },
        { id: 'ai-3', text: `Top ${query} businesses`, type: 'category' },
      ];
      setSuggestions(aiSuggestions);
    }
  }, [query, recentSearches, trendingSearches, categories]);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const searchResults = await onSearch(searchQuery, filters);
      setResults(searchResults);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [onSearch, filters]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setShowSuggestions(true);

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(value);
      }, 300);
    } else {
      setResults([]);
    }
  }, [handleSearch]);

  const handleVoiceSearch = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isVoiceSearching) {
      recognitionRef.current.stop();
      setIsVoiceSearching(false);
    } else {
      setIsVoiceSearching(true);
      recognitionRef.current.start();
    }
  }, [isVoiceSearching]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    onSuggestionClick?.(suggestion);
    handleSearch(suggestion.text);
  }, [onSuggestionClick, handleSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  const handleFilterChange = useCallback((filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    if (query.trim()) {
      handleSearch(query);
    }
  }, [query, handleSearch]);

  const sizeClasses = {
    sm: 'h-10 text-sm',
    md: 'h-12 text-base',
    lg: 'h-14 text-lg'
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'business': return <Building className="h-4 w-4" />;
      case 'product': return <ShoppingBag className="h-4 w-4" />;
      case 'location': return <MapPin className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative group">
        <div className={cn(
          "relative flex items-center rounded-2xl transition-all duration-300",
          "miami-glass border border-white/30 hover:border-primary/50 focus-within:border-primary/70",
          "shadow-lg hover:shadow-xl",
          sizeClasses[size]
        )}>
          {/* Search Icon */}
          <Search className="absolute left-4 h-5 w-5 text-slate-500 group-hover:text-primary transition-colors duration-300" />
          
          {/* AI Sparkle */}
          {aiPowered && (
            <Sparkles className="absolute left-10 h-4 w-4 text-primary animate-pulse" />
          )}
          
          {/* Input */}
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className={cn(
              "border-0 bg-transparent pl-12 pr-20 focus:ring-0 focus:outline-none",
              sizeClasses[size]
            )}
          />
          
          {/* Voice Search Button */}
          {voiceSearchEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceSearch}
              className={cn(
                "absolute right-12 p-2 hover:bg-primary/10 transition-colors duration-300",
                isVoiceSearching && "text-red-500 bg-red-50"
              )}
            >
              {isVoiceSearching ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {/* Clear Button */}
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-2 p-2 hover:bg-slate-100 transition-colors duration-300"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          {/* Loading Indicator */}
          {isSearching && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Search Suggestions */}
        <AnimatePresence>
          {showSuggestions && (query || suggestions.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 z-50"
            >
              <Card className="miami-glass miami-card-glow border border-white/30 shadow-2xl">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Quick Filters */}
                    {!query && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {categories.slice(0, 6).map((category) => (
                          <Badge
                            key={category.id}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
                            onClick={() => handleSuggestionClick({
                              id: category.id,
                              text: category.name,
                              type: 'category'
                            })}
                          >
                            {category.icon}
                            <span className="ml-1">{category.name}</span>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="space-y-1">
                        {suggestions.map((suggestion) => (
                          <motion.button
                            key={suggestion.id}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 transition-all duration-200 text-left group"
                            whileHover={{ x: 4 }}
                          >
                            <div className="text-slate-500 group-hover:text-primary transition-colors duration-300">
                              {suggestion.icon || <Search className="h-4 w-4" />}
                            </div>
                            <span className="flex-1 text-slate-700 group-hover:text-slate-900 transition-colors duration-300">
                              {suggestion.text}
                            </span>
                            <Badge 
                              variant="outline" 
                              className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                              {suggestion.type}
                            </Badge>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* No suggestions */}
                    {suggestions.length === 0 && query && (
                      <div className="text-center py-4 text-slate-500">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No suggestions found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="mt-4 space-y-3"
          >
            {results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card className="miami-hover-lift miami-card-glow cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Result Icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300">
                        {getResultIcon(result.type)}
                      </div>
                      
                      {/* Result Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors duration-300 truncate">
                            {result.title}
                          </h3>
                          {result.rating && (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span>{result.rating}</span>
                              {result.reviews && (
                                <span className="text-slate-500">({result.reviews})</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {result.description && (
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {result.type}
                          </Badge>
                          {result.distance && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {result.distance}
                            </span>
                          )}
                          {result.tags && result.tags.length > 0 && (
                            <div className="flex gap-1">
                              {result.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
