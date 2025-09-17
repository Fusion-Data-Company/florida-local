import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import ProductCard from "./product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-16">
          <div className="lg:w-1/2 mb-8 lg:mb-0">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 gradient-text">
              Local Marketplace
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-6">
              Discover unique products and services from Florida's most innovative businesses. 
              Support local entrepreneurs while finding exactly what you need.
            </p>
            <Link href="/marketplace">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-all"
                data-testid="button-explore-marketplace"
              >
                Explore Marketplace
              </Button>
            </Link>
          </div>
          
          <div className="lg:w-1/2">
            {/* Search and Filter Bar */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <Input 
                  type="search" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  data-testid="input-marketplace-search"
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger data-testid="select-marketplace-category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                    <SelectItem value="Fashion">Fashion</SelectItem>
                    <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                    <SelectItem value="Health & Beauty">Health & Beauty</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} data-testid="button-marketplace-search">
                  Search
                </Button>
              </div>
              
              {/* Filter Tags */}
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary text-primary-foreground cursor-pointer" data-testid="filter-local-made">
                  Local Made
                </Badge>
                <Badge className="bg-secondary text-secondary-foreground cursor-pointer" data-testid="filter-eco-friendly">
                  Eco-Friendly
                </Badge>
                <Badge className="bg-accent text-accent-foreground cursor-pointer" data-testid="filter-small-batch">
                  Small Batch
                </Badge>
                <Badge variant="outline" className="cursor-pointer" data-testid="filter-free-shipping">
                  Free Shipping
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Products Grid */}
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
              <i className="fas fa-shopping-bag text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">No products available</h3>
              <p className="text-muted-foreground">
                Check back soon for featured products from local businesses.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
