import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  X,
  Filter,
  SlidersHorizontal,
  MapPin,
  Star,
  TrendingUp,
  DollarSign,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import type { Product, Business } from "@shared/types";

interface SearchFilters {
  query: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  inStock: boolean;
}

export default function MarketplaceSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "all",
    minPrice: "",
    maxPrice: "",
    sortBy: "relevance",
    inStock: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.query]);

  // Fetch products with filters
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", filters],
    enabled: debouncedQuery.length > 0,
  });

  // Fetch businesses for category filter
  const { data: categories } = useQuery<string[]>({
    queryKey: ["/api/businesses/categories"],
  });

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      category: "all",
      minPrice: "",
      maxPrice: "",
      sortBy: "relevance",
      inStock: true,
    });
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "query" || key === "sortBy") return false;
    if (key === "category") return value !== "all";
    if (key === "inStock") return !value;
    return value !== "";
  }).length;

  // Filter and sort products
  let filteredProducts = products || [];

  if (filters.category !== "all") {
    filteredProducts = filteredProducts.filter(p => p.category === filters.category);
  }

  if (filters.minPrice) {
    filteredProducts = filteredProducts.filter(
      p => parseFloat(p.price) >= parseFloat(filters.minPrice)
    );
  }

  if (filters.maxPrice) {
    filteredProducts = filteredProducts.filter(
      p => parseFloat(p.price) <= parseFloat(filters.maxPrice)
    );
  }

  if (filters.inStock) {
    filteredProducts = filteredProducts.filter(p => (p.stockQuantity || 0) > 0);
  }

  // Sort products
  switch (filters.sortBy) {
    case "price-low":
      filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      break;
    case "price-high":
      filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      break;
    case "newest":
      filteredProducts.sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      break;
    case "popular":
      // Could sort by views or purchases if available
      break;
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products, businesses, or categories..."
            value={filters.query}
            onChange={(e) => handleFilterChange("query", e.target.value)}
            className="pl-10 pr-10 h-12 text-base"
          />
          {filters.query && (
            <button
              onClick={() => handleFilterChange("query", "")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="h-12 px-6"
        >
          <SlidersHorizontal className="h-5 w-5 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select
                      value={filters.category}
                      onValueChange={(value) => handleFilterChange("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Min Price</label>
                    <Input
                      type="number"
                      placeholder="$0"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Price</label>
                    <Input
                      type="number"
                      placeholder="$999"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort By</label>
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) => handleFilterChange("sortBy", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Stock Filter */}
                <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) => handleFilterChange("inStock", e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">In Stock Only</span>
                  </label>

                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      {debouncedQuery && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {isLoading
                ? "Searching..."
                : `${filteredProducts.length} result${filteredProducts.length !== 1 ? "s" : ""} found`}
            </h3>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <CardContent className="pt-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/products/${product.id}`}>
                    <Card className="group hover:shadow-lg transition-all cursor-pointer">
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-16 w-16 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          {product.category}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            ${parseFloat(product.price).toFixed(2)}
                          </span>
                          {(product.stockQuantity || 0) > 0 ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              In Stock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Suggestions (when no query) */}
      {!debouncedQuery && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center mb-6">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Discover Amazing Products</h3>
              <p className="text-muted-foreground">
                Search for products, browse by category, or filter by price
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => handleFilterChange("category", "Food & Beverage")}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div className="font-medium">Food & Beverage</div>
                <div className="text-sm text-muted-foreground">Delicious local fare</div>
              </button>
              <button
                onClick={() => handleFilterChange("category", "Retail")}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div className="font-medium">Retail</div>
                <div className="text-sm text-muted-foreground">Unique local goods</div>
              </button>
              <button
                onClick={() => handleFilterChange("category", "Services")}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div className="font-medium">Services</div>
                <div className="text-sm text-muted-foreground">Professional services</div>
              </button>
              <button
                onClick={() => handleFilterChange("sortBy", "newest")}
                className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div className="font-medium">New Arrivals</div>
                <div className="text-sm text-muted-foreground">Latest products</div>
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
