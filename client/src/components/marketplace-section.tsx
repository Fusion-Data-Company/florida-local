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
    <section className="py-20 bg-background miami-marketplace-section relative overflow-hidden">
      {/* Animated Background Orbs - Limited to 2 for performance */}
      <div className="absolute top-20 left-10 w-96 h-96 gradient-iridescent float-dynamic rounded-full opacity-[0.08] blur-3xl will-change-transform"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 gradient-iridescent float-gentle rounded-full opacity-[0.08] blur-3xl will-change-transform"></div>
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-16">
          <div className="lg:w-1/2 mb-8 lg:mb-0">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 miami-gradient-text">
              Local Marketplace
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-6 miami-body-text">
              Discover unique products and services from Florida's most innovative businesses. 
              Support local entrepreneurs while finding exactly what you need.
            </p>
            <Link href="/marketplace">
              <Button 
                className="gradient-metallic-gold border-animated-gradient miami-hover-lift px-8 py-4 font-semibold group transition-all duration-300 transform-3d-float shadow-lg"
                data-testid="button-explore-marketplace"
              >
                <ShoppingBag className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10">Explore Marketplace</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </Button>
            </Link>
          </div>
          
          <div className="lg:w-1/2">
            {/* Premium Search and Filter Bar - ELITE LUXURY TRANSFORMATION */}
            <div className="premium-search-panel relative backdrop-ultra border-animated-gradient rounded-2xl p-8 miami-card-glow transform-3d-float transition-all duration-300 search-panel-container">
              <div className="relative z-10">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  <Input 
                    type="search" 
                    placeholder="Search premium products..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-4 backdrop-luxury filter-luxury-glow transform-depth border-border/30 hover:border-primary/50 focus:border-primary/70 transition-all duration-300"
                    data-testid="input-marketplace-search"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                <div className="relative group">
                  <Layers className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300" />
                  <div className="pl-12 pr-4 py-4 min-w-[240px] backdrop-luxury border border-border/30 rounded-md">
                    <div className="flex flex-wrap gap-2">
                      {['Food & Beverage','Fashion','Home & Garden','Health & Beauty'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleArrayValue(categories, c, setCategories)}
                          className={`px-2 py-1 rounded-md text-sm border transform-3d-card float-gentle filter-premium-depth transition-all duration-300 ${categories.includes(c) ? 'gradient-metallic-gold border-primary text-white shadow-lg' : 'bg-background/80 border-border text-foreground hover:border-secondary'}`}
                        >
                          {categories.includes(c) && <Check className="inline h-3 w-3 mr-1" />} {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleSearch} 
                  className="px-8 py-4 gradient-metallic-gold border-animated-gradient miami-hover-lift group font-semibold transform-3d-float shadow-lg"
                  data-testid="button-marketplace-search"
                >
                  <Search className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10">Search</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                </Button>
              </div>
              
              {/* Premium Filter Tags - ELITE LUXURY */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Badge className="gradient-iridescent float-gentle transform-3d-card filter-elite-shimmer hover-lift group cursor-pointer transition-all duration-300 shadow-lg" data-testid="filter-local-made">
                  <Award className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10 text-white">Local Made</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                </Badge>
                <Badge className="gradient-iridescent float-gentle transform-3d-card filter-elite-shimmer hover-lift group cursor-pointer transition-all duration-300 shadow-lg" data-testid="filter-eco-friendly">
                  <Heart className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10 text-white">Eco-Friendly</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                </Badge>
                <Badge className="gradient-iridescent float-gentle transform-3d-card filter-elite-shimmer hover-lift group cursor-pointer transition-all duration-300 shadow-lg" data-testid="filter-small-batch">
                  <Star className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10 text-white">Small Batch</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                </Badge>
                <Badge className="gradient-iridescent float-gentle transform-3d-card filter-elite-shimmer hover-lift group cursor-pointer transition-all duration-300 shadow-lg" data-testid="filter-free-shipping">
                  <Truck className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10 text-white">Free Shipping</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                </Badge>
              </div>

              {/* Advanced Filters - ELITE LUXURY */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 transform-3d-float">
                <div className="relative rounded-lg p-4 filter-section-1">
                  <div className="relative">
                    <label className="text-sm font-medium mb-2 flex items-center"><DollarSign className="h-4 w-4 mr-2" /> Price Range</label>
                    <div className="flex gap-2">
                      <Input type="number" min={0} placeholder="Min" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} className="filter-luxury-glow backdrop-luxury" />
                      <Input type="number" min={0} placeholder="Max" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} className="filter-luxury-glow backdrop-luxury" />
                    </div>
                  </div>
                </div>
                <div className="relative rounded-lg p-4 filter-section-2">
                  <div className="relative">
                    <label className="text-sm font-medium mb-2 flex items-center"><Star className="h-4 w-4 mr-2" /> Min Rating</label>
                    <Select value={minRating} onValueChange={setMinRating}>
                      <SelectTrigger className="backdrop-luxury border-animated-gradient">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        {["3","3.5","4","4.5"].map(r => (
                          <SelectItem key={r} value={r}>{r}+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="relative rounded-lg p-4 filter-section-3">
                  <div className="relative">
                    <label className="text-sm font-medium mb-2 flex items-center"><SortAsc className="h-4 w-4 mr-2" /> Sort</label>
                    <Select value={sort} onValueChange={(v)=>setSort(v as any)}>
                      <SelectTrigger className="backdrop-luxury border-animated-gradient">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating_desc">Top Rated</SelectItem>
                        <SelectItem value="price_asc">Price: Low to High</SelectItem>
                        <SelectItem value="price_desc">Price: High to Low</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="popular">Most Reviewed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
                <div className="flex items-center gap-6 mt-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={inStock} onChange={(e)=>setInStock(e.target.checked)} /> In Stock
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={isDigital} onChange={(e)=>setIsDigital(e.target.checked)} /> Digital Only
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Search Results (Top Matches) */}
        {searchData?.items && (debouncedQuery || categories.length || selectedCategory || minPrice || maxPrice || minRating || inStock || isDigital || tags.length) ? (
          <div className="mb-12">
            <div className="miami-section-header mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-serif font-bold miami-heading">Top Matches</h3>
              <Link href={`/marketplace?${searchParams.toString()}`}>
                <Button variant="outline" className="btn-magic">See all ({searchData?.total || 0})</Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {searchData.items.slice(0, pageSize).map((product: Product, index: number) => (
                <MagicEliteProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        ) : null}

        {/* Miami Elite Featured Products Grid */}
        <div className="miami-section-header mb-12">
          <h3 className="text-3xl font-serif font-bold text-center mb-4 miami-heading">
            Featured Products
          </h3>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 mx-auto rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
              <h3 className="text-2xl font-bold mb-4 miami-gradient-text text-luxury font-serif">No products available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Check back soon for featured products from local businesses.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
