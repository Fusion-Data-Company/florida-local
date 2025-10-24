import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/types";
import ProductCard from "./product-card";
import MagicEliteProductCard from "./magic-elite-product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingBag, Star, Heart, Truck, Award, Filter, Layers, Check, SortAsc, DollarSign } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LiquidGlassHeaderCard, GlassButton, GlassFilter } from "@/components/ui/liquid-glass";

export default function MarketplaceSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  // New advanced filters
  const [categories, setCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minRating, setMinRating] = useState<string>("");
  const [inStock, setInStock] = useState<boolean>(false);
  const [isDigital, setIsDigital] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [sort, setSort] = useState<'rating_desc' | 'price_asc' | 'price_desc' | 'newest' | 'popular'>("rating_desc");
  const [pageSize] = useState<number>(8);
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  const { data: featuredProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/featured', 20, 'unique=images'],
    queryFn: () => fetch(`/api/products/featured?limit=20&unique=images`).then(res => res.json()),
  });

  // Debounce search query
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Build search params
  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    const allCats = categories.length ? categories : (selectedCategory ? [selectedCategory] : []);
    if (allCats.length) params.set('categories', allCats.join(','));
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (minRating) params.set('minRating', minRating);
    if (inStock) params.set('inStock', 'true');
    if (isDigital) params.set('isDigital', 'true');
    if (tags.length) params.set('tags', tags.join(','));
    if (sort) params.set('sort', sort);
    params.set('page', '1');
    params.set('pageSize', String(pageSize));
    return params;
  }, [debouncedQuery, categories, selectedCategory, minPrice, maxPrice, minRating, inStock, isDigital, tags, sort, pageSize]);

  const { data: searchData } = useQuery<{ items: Product[]; total: number }>({
    queryKey: ['/api/products/search', searchParams.toString()],
    queryFn: () => fetch(`/api/products/search?${searchParams}`).then(res => res.json()),
  });

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    // Navigate to full marketplace with current filters
    window.location.href = `/marketplace?${params.toString()}`;
  };

  const toggleArrayValue = (arr: string[], val: string, setter: (v: string[]) => void) => {
    if (arr.includes(val)) setter(arr.filter(v => v !== val)); else setter([...arr, val]);
  };

  return (
    <section className="py-12 lg:py-20 miami-marketplace-section relative overflow-hidden dynamic-gradient-bg">
      {/* Glass Filter for Liquid Glass Effect */}
      <GlassFilter />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Liquid Glass Header Card */}
        <div className="max-w-6xl mx-auto mb-16 entrance-fade-up">
          <LiquidGlassHeaderCard
            title="Local Marketplace"
            subtitle="Discover unique products and services from Florida's most innovative businesses. Support local entrepreneurs while finding exactly what you need."
          />
        </div>

        <div className="max-w-6xl mx-auto mb-16">
          <div className="flex flex-col lg:flex-row items-stretch gap-8">
            <div className="lg:w-auto flex items-center justify-center lg:justify-start">
              <Link href="/marketplace">
                <button className="metallic-chrome px-12 py-6 rounded-3xl shine-sweep-hover apple-hover-depth metallic-button-press transition-all duration-300 hover:shadow-2xl w-full lg:w-auto">
                  <div className="flex items-center text-gray-900 text-lg font-semibold">
                    <ShoppingBag className="h-5 w-5 mr-3" />
                    <span>Explore Marketplace</span>
                  </div>
                </button>
              </Link>
            </div>

            <div className="flex-1">
            {/* Premium Search and Filter Bar - ELITE LUXURY TRANSFORMATION */}
            <div className="search-panel-container premium-search-panel rounded-2xl p-8 transition-all duration-300 entrance-fade-up stagger-3 mouse-spotlight elevation-2">
              <div className="relative z-10">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1 relative luxury-search-input-wrapper">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 luxury-search-icon z-10" />
                  <Input 
                    type="search" 
                    placeholder="Search premium products..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="luxury-search-input pl-12 pr-4 py-6 text-base rounded-xl"
                    data-testid="input-marketplace-search"
                  />
                </div>
                <div className="relative">
                  <Layers className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 luxury-search-icon z-10" />
                  <div className="luxury-category-pills pl-12 pr-4 py-4 min-w-[240px] rounded-xl">
                    <div className="flex flex-wrap gap-2 relative z-10">
                      {['Food & Beverage','Fashion','Home & Garden','Health & Beauty'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleArrayValue(categories, c, setCategories)}
                          className={`px-3 py-1.5 rounded-lg text-sm relative z-10 ${categories.includes(c) ? 'luxury-filter-pill luxury-filter-pill-active' : 'luxury-filter-pill'}`}
                        >
                          {categories.includes(c) && <Check className="inline h-3 w-3 mr-1" />} 
                          <span className="relative z-10">{c}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleSearch} 
                  className="px-8 py-6 gradient-metallic-gold border-animated-gradient group font-semibold shadow-lg rounded-xl"
                  data-testid="button-marketplace-search"
                >
                  <Search className="h-5 w-5 mr-3" />
                  <span className="relative z-10">Search</span>
                </Button>
              </div>
              
              {/* Premium Filter Tags - ELITE LUXURY */}
              <div className="flex flex-wrap gap-3 justify-center mb-8">
                <span className="luxury-badge-pill bg-slate-800/80 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer" data-testid="filter-local-made">
                  <Award className="inline h-3.5 w-3.5 mr-1.5 text-white" />
                  <span className="relative z-10 text-white">Local Made</span>
                </span>
                <span className="luxury-badge-pill bg-slate-800/80 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer" data-testid="filter-eco-friendly">
                  <Heart className="inline h-3.5 w-3.5 mr-1.5 text-white" />
                  <span className="relative z-10 text-white">Eco-Friendly</span>
                </span>
                <span className="luxury-badge-pill bg-slate-800/80 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer" data-testid="filter-small-batch">
                  <Star className="inline h-3.5 w-3.5 mr-1.5 text-white" />
                  <span className="relative z-10 text-white">Small Batch</span>
                </span>
                <span className="luxury-badge-pill bg-slate-800/80 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer" data-testid="filter-free-shipping">
                  <Truck className="inline h-3.5 w-3.5 mr-1.5 text-white" />
                  <span className="relative z-10 text-white">Free Shipping</span>
                </span>
              </div>

              {/* Advanced Filters - ELITE LUXURY */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="filter-section-1 luxury-filter-section rounded-xl p-5">
                  <div className="relative z-10">
                    <label className="luxury-filter-label mb-3 flex items-center text-xs">
                      <DollarSign className="h-4 w-4 mr-2 text-yellow-700" /> Price Range
                    </label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        min={0} 
                        placeholder="Min" 
                        value={minPrice} 
                        onChange={(e)=>setMinPrice(e.target.value)} 
                        className="luxury-price-input text-sm py-2.5 rounded-lg relative z-10" 
                      />
                      <Input 
                        type="number" 
                        min={0} 
                        placeholder="Max" 
                        value={maxPrice} 
                        onChange={(e)=>setMaxPrice(e.target.value)} 
                        className="luxury-price-input text-sm py-2.5 rounded-lg relative z-10" 
                      />
                    </div>
                  </div>
                </div>
                <div className="filter-section-2 luxury-filter-section rounded-xl p-5">
                  <div className="relative z-10">
                    <label className="luxury-filter-label mb-3 flex items-center text-xs">
                      <Star className="h-4 w-4 mr-2 text-yellow-700" /> Min Rating
                    </label>
                    <Select value={minRating} onValueChange={setMinRating}>
                      <SelectTrigger className="luxury-dropdown-trigger rounded-lg py-2.5">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent className="luxury-dropdown-content rounded-xl">
                        {["3","3.5","4","4.5"].map(r => (
                          <SelectItem key={r} value={r} className="luxury-dropdown-item">{r}+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="filter-section-3 luxury-filter-section rounded-xl p-5">
                  <div className="relative z-10">
                    <label className="luxury-filter-label mb-3 flex items-center text-xs">
                      <SortAsc className="h-4 w-4 mr-2 text-yellow-700" /> Sort By
                    </label>
                    <Select value={sort} onValueChange={(v)=>setSort(v as any)}>
                      <SelectTrigger className="luxury-dropdown-trigger rounded-lg py-2.5">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent className="luxury-dropdown-content rounded-xl">
                        <SelectItem value="rating_desc" className="luxury-dropdown-item">Top Rated</SelectItem>
                        <SelectItem value="price_asc" className="luxury-dropdown-item">Price: Low to High</SelectItem>
                        <SelectItem value="price_desc" className="luxury-dropdown-item">Price: High to Low</SelectItem>
                        <SelectItem value="newest" className="luxury-dropdown-item">Newest</SelectItem>
                        <SelectItem value="popular" className="luxury-dropdown-item">Most Reviewed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
                <div className="flex items-center gap-8 mt-6 relative z-10">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={inStock} 
                      onChange={(e)=>setInStock(e.target.checked)} 
                      className="luxury-checkbox" 
                    />
                    <span className="luxury-checkbox-label text-sm">In Stock</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isDigital} 
                      onChange={(e)=>setIsDigital(e.target.checked)} 
                      className="luxury-checkbox" 
                    />
                    <span className="luxury-checkbox-label text-sm">Digital Only</span>
                  </label>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Live Search Results (Top Matches) */}
        {searchData?.items && (debouncedQuery || categories.length || selectedCategory || minPrice || maxPrice || minRating || inStock || isDigital || tags.length) ? (
          <div className="max-w-6xl mx-auto mb-16">
            <div className="miami-section-header mb-8 flex items-center justify-between">
              <h3 className="text-2xl font-serif font-bold text-white">Top Matches</h3>
              <Link href={`/marketplace?${searchParams.toString()}`}>
                <Button variant="outline" className="btn-magic">See all ({searchData?.total || 0})</Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {searchData.items.slice(0, pageSize).map((product: Product, index: number) => (
                <MagicEliteProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        ) : null}

        {/* Miami Elite Featured Products Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 entrance-fade-up">
            <LiquidGlassHeaderCard
              title="Featured Products"
              subtitle=""
              className="py-4"
            />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            // Loading skeletons
            [...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))
          ) : featuredProducts.length > 0 ? (
            featuredProducts.slice(0, 4).map((product: Product, index) => (
              <MagicEliteProductCard key={product.id} product={product} index={index} />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="relative inline-block mb-6">
                <ShoppingBag className="text-6xl text-muted-foreground mx-auto" size={64} />
                <div className="absolute inset-0 text-muted-foreground opacity-20 blur-lg"></div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white font-serif" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>No products available</h3>
              <p className="text-white max-w-md mx-auto" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
                Check back soon for featured products from local businesses.
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
