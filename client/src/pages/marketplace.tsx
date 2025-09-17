import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import ProductCard from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products/search', searchQuery, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      return fetch(`/api/products/search?${params}`).then(res => res.json());
    },
  });

  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['/api/products/featured'],
  });

  const categories = [
    "Food & Beverage",
    "Fashion", 
    "Home & Garden",
    "Health & Beauty",
    "Electronics",
    "Art & Crafts",
    "Sports & Fitness",
    "Books & Media"
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      {/* Marketplace Header */}
      <section className="py-12 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 gradient-text">
              Local Marketplace
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover unique products from Florida's most innovative businesses. 
              Support local entrepreneurs while finding exactly what you need.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12"
                    data-testid="input-search-products"
                  />
                </div>
                <div className="md:w-48">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-12" data-testid="select-category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Tags */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" className="cursor-pointer" data-testid="filter-local-made">
                  Local Made
                </Badge>
                <Badge variant="secondary" className="cursor-pointer" data-testid="filter-eco-friendly">
                  Eco-Friendly
                </Badge>
                <Badge variant="outline" className="cursor-pointer" data-testid="filter-small-batch">
                  Small Batch
                </Badge>
                <Badge variant="outline" className="cursor-pointer" data-testid="filter-free-shipping">
                  Free Shipping
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {!searchQuery && !selectedCategory && (
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-3xl font-bold mb-8 text-center">Featured Products</h2>
            
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Search Results */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          {(searchQuery || selectedCategory) && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold">
                {searchQuery 
                  ? `Search results for "${searchQuery}"` 
                  : `Products in ${selectedCategory}`
                }
              </h2>
              <p className="text-muted-foreground">
                {products.length} product{products.length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (searchQuery || selectedCategory) ? (
            <div className="text-center py-16">
              <i className="fas fa-search text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse all categories.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <MobileBottomNav />
    </div>
  );
}
