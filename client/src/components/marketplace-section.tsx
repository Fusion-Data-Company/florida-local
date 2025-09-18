import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import ProductCard from "./product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingBag, Star, Heart, Truck, Award, Filter } from "lucide-react";
import { useState } from "react";

export default function MarketplaceSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: featuredProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/featured'],
  });

  const handleSearch = () => {
    if (searchQuery || selectedCategory) {
      // TODO: Navigate to marketplace with search params
      window.location.href = `/marketplace?q=${searchQuery}&category=${selectedCategory}`;
    }
  };

  return (
    <section className="py-20 bg-background miami-marketplace-section">
      <div className="container mx-auto px-4 lg:px-8">
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
                className="btn-miami-primary miami-hover-lift px-8 py-4 font-semibold group transition-all duration-300"
                data-testid="button-explore-marketplace"
              >
                <ShoppingBag className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10">Explore Marketplace</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </Button>
            </Link>
          </div>
          
          <div className="lg:w-1/2">
            {/* Premium Search and Filter Bar */}
            <div className="premium-search-panel miami-glass rounded-2xl p-8 miami-card-glow miami-hover-lift transition-all duration-300">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  <Input 
                    type="search" 
                    placeholder="Search premium products..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-4 premium-search-input border-border/30 hover:border-primary/50 focus:border-primary/70 transition-all duration-300"
                    data-testid="input-marketplace-search"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                <div className="relative group">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors duration-300" />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="pl-12 pr-4 py-4 min-w-[200px] premium-search-input border-border/30 hover:border-secondary/50 focus:border-secondary/70 transition-all duration-300" data-testid="select-marketplace-category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="premium-dropdown">
                      <SelectItem value="Food & Beverage">🍽️ Food & Beverage</SelectItem>
                      <SelectItem value="Fashion">👗 Fashion</SelectItem>
                      <SelectItem value="Home & Garden">🏡 Home & Garden</SelectItem>
                      <SelectItem value="Health & Beauty">💅 Health & Beauty</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-secondary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                <Button 
                  onClick={handleSearch} 
                  className="px-8 py-4 btn-miami-glass miami-hover-lift group font-semibold"
                  data-testid="button-marketplace-search"
                >
                  <Search className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10">Search</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                </Button>
              </div>
              
              {/* Premium Filter Tags */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Badge className="premium-filter-tag bg-gradient-to-r from-primary/20 to-primary/30 text-primary border-primary/30 hover-lift group cursor-pointer transition-all duration-300" data-testid="filter-local-made">
                  <Award className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10">Local Made</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                </Badge>
                <Badge className="premium-filter-tag bg-gradient-to-r from-secondary/20 to-secondary/30 text-secondary border-secondary/30 hover-lift group cursor-pointer transition-all duration-300" data-testid="filter-eco-friendly">
                  <Heart className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10">Eco-Friendly</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                </Badge>
                <Badge className="premium-filter-tag bg-gradient-to-r from-accent/20 to-accent/30 text-accent border-accent/30 hover-lift group cursor-pointer transition-all duration-300" data-testid="filter-small-batch">
                  <Star className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10">Small Batch</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                </Badge>
                <Badge className="premium-filter-tag glass-panel text-foreground border-border/30 hover:border-primary/50 hover-lift group cursor-pointer transition-all duration-300" data-testid="filter-free-shipping">
                  <Truck className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10">Free Shipping</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                </Badge>
              </div>
            </div>
          </div>
        </div>

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
            featuredProducts.slice(0, 4).map((product: Product) => (
              <ProductCard key={product.id} product={product} />
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
