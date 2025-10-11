import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Product, insertProductSchema } from "@shared/types";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EliteNavigationHeader from "@/components/elite-navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import ProductCard from "@/components/product-card";
import MagicEliteProductCard, { MagicEliteProductGrid } from "@/components/magic-elite-product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StardustButton } from "@/components/ui/stardust-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Package, Image as ImageIcon, Search } from "lucide-react";
import {
  AnimatedGradientHero,
  ParticleField,
  AuroraAmbient,
  PremiumLoader,
} from "@/components/premium-ultra";
import { PremiumBadge } from "@/components/premium-ui";

const createProductSchema = insertProductSchema.omit({ id: true }).extend({
  name: z.string().min(1, "Product name is required").max(255, "Product name must be less than 255 characters"),
  description: z.string().min(1, "Product description is required"),
  price: z.string().min(1, "Price is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
});

type CreateProductForm = z.infer<typeof createProductSchema>;

export default function Marketplace() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/search', searchQuery, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      return fetch(`/api/products/search?${params}`).then(res => res.json());
    },
  });

  const { data: featuredProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/featured', 20, 'unique=images'],
    queryFn: () => fetch(`/api/products/featured?limit=20&unique=images`).then(res => res.json()),
  });

  const { data: userBusinesses = [] } = useQuery({
    queryKey: ['/api/businesses/my'],
    enabled: isAuthenticated,
  });

  const form = useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      businessId: "",
      inventory: 0,
      isActive: true,
      isDigital: false,
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: CreateProductForm) => {
      // Convert price to proper decimal format
      const productData = {
        ...data,
        price: parseFloat(data.price).toFixed(2),
      };
      return await apiRequest('POST', '/api/products', productData);
    },
    onSuccess: () => {
      toast({
        title: "Product created",
        description: "Your product has been added to the marketplace.",
      });
      form.reset();
      setIsCreateProductOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/products/search'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateProductForm) => {
    if (!data.businessId) {
      toast({
        title: "Business required",
        description: "Please select a business to add the product to.",
        variant: "destructive",
      });
      return;
    }
    createProductMutation.mutate(data);
  };

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

  if (isLoading) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture flex items-center justify-center"
        data-surface-intensity="delicate"
        data-surface-tone="cool"
      >
        <PremiumLoader text="Loading marketplace..." />
      </div>
    );
  }

  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen marble-texture relative"
      data-surface-intensity="delicate"
      data-surface-tone="cool"
    >
      {/* ULTRA PREMIUM EFFECTS */}
      <AuroraAmbient intensity="low" />

      <EliteNavigationHeader />

      {/* FLORIDA LOCAL MARKETPLACE HERO */}
      <div className="relative py-16 overflow-hidden">
        {/* Teal-Gold Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--fl-teal-lagoon)]/10 via-background to-[var(--fl-sunset-gold)]/10" />
        
        <ParticleField count={40} color="cyan" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:text-left">
              <div className="flex-1">
                <PremiumBadge color="emerald" size="sm" className="mb-4">
                  Florida Local Marketplace
                </PremiumBadge>
                <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-[var(--fl-teal-lagoon)] via-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] bg-clip-text text-transparent">
                  Local Marketplace
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  Discover unique products from Florida's most innovative businesses.
                  Support local entrepreneurs while finding exactly what you need.
                </p>
              </div>
              {isAuthenticated && userBusinesses.length > 0 && (
                <Dialog open={isCreateProductOpen} onOpenChange={setIsCreateProductOpen}>
                  <DialogTrigger asChild>
                    <StardustButton 
                      variant="gold"
                      size="lg"
                      className="whitespace-nowrap"
                      data-testid="button-add-product"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Product
                    </StardustButton>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl marketplace-dialog">
                    <div className="marble-content">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Add New Product
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="businessId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-product-business">
                                    <SelectValue placeholder="Select your business" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {userBusinesses.map((business: any) => (
                                    <SelectItem key={business.id} value={business.id}>
                                      {business.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter product name"
                                    data-testid="input-product-name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price ($)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    data-testid="input-product-price"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-product-category">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe your product..."
                                  className="min-h-24"
                                  data-testid="textarea-product-description"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex items-center justify-between">
                          <Button type="button" variant="outline" size="sm">
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Add Images
                          </Button>
                          <div className="flex space-x-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsCreateProductOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createProductMutation.isPending}
                              data-testid="button-submit-product"
                            >
                              {createProductMutation.isPending ? "Adding..." : "Add Product"}
                            </Button>
                          </div>
                        </div>
                        </form>
                      </Form>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg marketplace-search-panel">
              <div className="flex flex-col md:flex-row gap-4 mb-4 marble-content">
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
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* PREMIUM FILTER BADGES */}
              <div className="flex flex-wrap gap-3">
                <PremiumBadge color="emerald" size="sm" className="cursor-pointer" data-testid="filter-local-made">
                  Local Made
                </PremiumBadge>
                <PremiumBadge color="jade" size="sm" className="cursor-pointer" data-testid="filter-eco-friendly">
                  Eco-Friendly
                </PremiumBadge>
                <PremiumBadge color="topaz" size="sm" className="cursor-pointer" data-testid="filter-small-batch">
                  Small Batch
                </PremiumBadge>
                <PremiumBadge color="sapphire" size="sm" className="cursor-pointer" data-testid="filter-free-shipping">
                  Free Shipping
                </PremiumBadge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      {!searchQuery && !selectedCategory && (
        <section className="py-16 marketplace-product-grid">
          <div className="container mx-auto px-4 lg:px-8 marble-content">
            <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-[var(--fl-teal-lagoon)] via-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] bg-clip-text text-transparent">Featured Products</h2>
            
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
                {featuredProducts.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Search Results */}
      <section className="py-16 marketplace-product-grid">
        <div className="container mx-auto px-4 lg:px-8 marble-content">
          {(searchQuery || selectedCategory) && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[var(--fl-teal-lagoon)] to-[var(--fl-sunset-gold)] bg-clip-text text-transparent">
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
            <div className="magic-glow-intense">
              <MagicEliteProductGrid products={products} />
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
