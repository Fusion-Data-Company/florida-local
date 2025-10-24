import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Product, Business } from "@shared/types";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import GlowHero from "@/components/ui/glow-hero";
import MagicEliteProductCard, { MagicEliteProductGrid } from "@/components/magic-elite-product-card";
import AIRecommendations from "@/components/ai-recommendations";
import AISearchBadge from "@/components/ai-search-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StardustButton } from "@/components/ui/stardust-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Package, Image as ImageIcon } from "lucide-react";
import {
  PremiumLoader,
} from "@/components/premium-ultra";
import { PremiumBadge } from "@/components/premium-ui";
import { CircularTestimonials } from "@/components/ui/circular-testimonials";
import { useTheme } from "@/contexts/ThemeContext";

const createProductSchema = z.object({
  businessId: z.string().min(1, "Business is required"),
  name: z.string().min(1, "Product name is required").max(255, "Product name must be less than 255 characters"),
  description: z.string().min(1, "Product description is required"),
  price: z.string().min(1, "Price is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  stockQuantity: z.number().default(0),
  tags: z.array(z.string()).optional(),
});

type CreateProductForm = z.infer<typeof createProductSchema>;

export default function Marketplace() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);

  const { data: productsData, isLoading } = useQuery<any>({
    queryKey: ['/api/products/search', searchQuery, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      return fetch(`/api/products/search?${params}`).then(res => res.json());
    },
  });

  const products = productsData?.items || [];

  const { data: featuredProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/featured', 20, 'unique=images'],
    queryFn: () => fetch(`/api/products/featured?limit=20&unique=images`).then(res => res.json()),
  });

  const { data: userBusinesses = [] } = useQuery<Business[]>({
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
      imageUrl: "",
      isActive: true,
      stockQuantity: 0,
      tags: [],
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

  const testimonials = [
    {
      quote:
        "Florida Local has been a game changer for my small business! The platform makes it easy to reach customers across the state. The support from the community has been incredible!",
      name: "Maria Rodriguez",
      designation: "Artisan Baker, Miami",
      src:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1368&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      quote:
        "I love discovering unique Florida-made products on this marketplace. The quality is outstanding and I feel great supporting local entrepreneurs. It's my go-to for gifts!",
      name: "James Patterson",
      designation: "Loyal Customer, Orlando",
      src:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1368&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      quote:
        "As a small business owner, Florida Local has given me the visibility I needed. Sales have tripled since joining, and the platform is so easy to use. Highly recommend!",
      name: "Sarah Chen",
      designation: "Jewelry Designer, Tampa",
      src:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1368&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
  ];

  if (isLoading) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light flex items-center justify-center"
        data-surface-intensity="delicate"
        data-surface-tone="cool"
      >
        <PremiumLoader text="Loading marketplace..." />
      </div>
    );
  }

  return (
    <div className="premium-page-wrapper premium-surface min-h-screen">
      {/* AI RECOMMENDATIONS - Show at top for authenticated users */}
      {isAuthenticated && user && (
        <AIRecommendations userId={user.id} limit={6} />
      )}

      {/* FLORIDA LOCAL MARKETPLACE HERO */}
      <div className="relative py-20 overflow-hidden">
        {/* Premium Gradient Overlay - Lighter */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/50 to-white/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,166,251,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,138,0,0.05),transparent_50%)]" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:text-left">
              <div className="flex-1 space-y-6">
                <div className="inline-block">
                  <PremiumBadge color="emerald" size="sm" className="mb-4 shadow-lg shadow-emerald-500/20 border-2 border-emerald-500/30">
                    Florida Local Marketplace
                  </PremiumBadge>
                </div>
                <GlowHero
                  glowText="Premium Marketplace"
                  glowTextSize="xl"
                  className="mb-6"
                />
                <p className="text-xl text-gray-900 max-w-2xl leading-relaxed font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg">
                  Discover <span className="font-bold bg-gradient-to-r from-[var(--fl-teal-lagoon)] to-[var(--fl-sunset-gold)] bg-clip-text text-transparent">unique products</span> from Florida's most innovative businesses.
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
            <div className="relative group">
              {/* Glass morphism background with premium effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-white/70 dark:from-gray-900/80 dark:via-gray-900/60 dark:to-gray-900/70 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10"></div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--fl-teal-lagoon)]/5 via-transparent to-[var(--fl-sunset-gold)]/5"></div>
              <div className="absolute inset-0 rounded-2xl border border-white/40 dark:border-white/10"></div>

              {/* Premium glow effect on hover */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[var(--fl-teal-lagoon)]/0 via-[var(--fl-sunset-gold)]/0 to-[var(--fl-teal-lagoon)]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm group-hover:from-[var(--fl-teal-lagoon)]/20 group-hover:via-[var(--fl-sunset-gold)]/20 group-hover:to-[var(--fl-teal-lagoon)]/20"></div>

              <div className="relative p-8 marketplace-search-panel">
                <div className="flex flex-col md:flex-row gap-4 mb-6 marble-content">
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

              {/* AI SEARCH BADGE */}
              <div className="flex justify-center my-3">
                <AISearchBadge variant="inline" />
              </div>

              {/* PREMIUM FILTER BADGES */}
              <div className="flex flex-wrap gap-3">
                <PremiumBadge color="emerald" size="sm" className="cursor-pointer hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-lg hover:shadow-emerald-500/30" data-testid="filter-local-made">
                  Local Made
                </PremiumBadge>
                <PremiumBadge color="emerald" size="sm" className="cursor-pointer hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-lg hover:shadow-emerald-500/30" data-testid="filter-eco-friendly">
                  Eco-Friendly
                </PremiumBadge>
                <PremiumBadge color="topaz" size="sm" className="cursor-pointer hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-lg hover:shadow-amber-500/30" data-testid="filter-small-batch">
                  Small Batch
                </PremiumBadge>
                <PremiumBadge color="sapphire" size="sm" className="cursor-pointer hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-lg hover:shadow-blue-500/30" data-testid="filter-free-shipping">
                  Free Shipping
                </PremiumBadge>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      {!searchQuery && !selectedCategory && (
        <section className="py-16 lg:py-24 marketplace-product-grid relative">
          {/* Premium section background */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--fl-teal-lagoon)]/5 to-transparent"></div>

          <div className="container mx-auto px-4 lg:px-8 marble-content relative">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[var(--fl-teal-lagoon)] via-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] bg-clip-text text-transparent entrance-fade-up drop-shadow-lg">
                Featured Products
              </h2>
              <div className="w-24 h-1 mx-auto bg-gradient-to-r from-transparent via-[var(--fl-sunset-gold)] to-transparent rounded-full"></div>
            </div>

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
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredProducts.map((product: Product, index: number) => (
                  <div
                    key={product.id}
                    className="card-entrance group relative"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Premium card glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--fl-teal-lagoon)] via-[var(--fl-sunset-gold)] to-[var(--fl-teal-lagoon)] rounded-2xl opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-500"></div>
                    <div className="relative">
                      <MagicEliteProductCard product={product} index={index} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Search Results */}
      <section className="py-16 lg:py-24 marketplace-product-grid relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--fl-sunset-gold)]/5 via-transparent to-[var(--fl-teal-lagoon)]/5"></div>

        <div className="container mx-auto px-4 lg:px-8 marble-content relative">
          {(searchQuery || selectedCategory) && (
            <div className="mb-12 entrance-slide-right">
              <div className="inline-block p-6 rounded-2xl bg-gradient-to-br from-white/90 to-white/80 dark:from-gray-900/90 dark:to-gray-900/80 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-xl">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[var(--fl-teal-lagoon)] to-[var(--fl-sunset-gold)] bg-clip-text text-transparent mb-2" style={{filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'}}>
                  {searchQuery
                    ? `Search results for "${searchQuery}"`
                    : `Products in ${selectedCategory}`
                  }
                </h2>
                <p className="text-gray-900 font-medium">
                  {products.length} product{products.length !== 1 ? 's' : ''} found
                </p>
              </div>
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
            <div className="magic-glow-intense mouse-spotlight">
              <MagicEliteProductGrid products={products} />
            </div>
          ) : (searchQuery || selectedCategory) ? (
            <div className="text-center py-16 entrance-fade-up bg-white/90 rounded-3xl p-12 backdrop-blur-sm">
              <i className="fas fa-search text-4xl text-gray-900 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">No products found</h3>
              <p className="text-gray-900">
                Try adjusting your search terms or browse all categories.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Premium background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--fl-teal-lagoon)]/10 via-transparent to-[var(--fl-sunset-gold)]/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,166,251,0.1),transparent_70%)]"></div>

        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className={`p-12 md:p-20 rounded-3xl min-h-[300px] flex flex-wrap gap-6 items-center justify-center relative backdrop-blur-sm border-2 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-[#060507]/80 via-[#0a0a0c]/70 to-[#060507]/80 border-white/10 shadow-2xl shadow-blue-500/20'
              : 'bg-gradient-to-br from-[#f7f7fa]/90 via-white/80 to-[#f7f7fa]/90 border-white/40 shadow-2xl shadow-blue-500/10'
          }`}>
            {/* Decorative elements */}
            <div className="absolute inset-0 opacity-10">
              <div className={`absolute inset-0 ${
                theme === 'dark'
                  ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(0,166,251,0.2),transparent_70%)]'
                  : 'bg-[radial-gradient(circle_at_50%_50%,rgba(0,166,251,0.12),transparent_70%)]'
              }`} />
            </div>

            <div className="w-full text-center mb-12 relative z-10 space-y-6">
              <div className="inline-block">
                <PremiumBadge color="sapphire" size="sm" className="mb-6 shadow-lg shadow-blue-500/20">
                  Customer Success Stories
                </PremiumBadge>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[var(--fl-teal-lagoon)] via-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] bg-clip-text text-transparent drop-shadow-lg">
                What Our Community Says
              </h2>
              <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-[var(--fl-teal-lagoon)] to-transparent rounded-full mb-4"></div>
              <p className="text-xl text-gray-900 max-w-2xl mx-auto font-light leading-relaxed">
                Join <span className="font-semibold bg-gradient-to-r from-[var(--fl-teal-lagoon)] to-[var(--fl-sunset-gold)] bg-clip-text text-transparent">thousands</span> of satisfied customers and business owners thriving on Florida Local
              </p>
            </div>
          <div
            className="items-center justify-center relative flex w-full"
            style={{ maxWidth: "1456px" }}
          >
            <CircularTestimonials
              testimonials={testimonials}
              autoplay={true}
              colors={theme === 'dark' ? {
                name: "#f7f7ff",
                designation: "#e1e1e1",
                testimony: "#f1f1f7",
                arrowBackground: "#0582CA",
                arrowForeground: "#141414",
                arrowHoverBackground: "#f7f7ff",
              } : {
                name: "#0a0a0a",
                designation: "#454545",
                testimony: "#171717",
                arrowBackground: "#141414",
                arrowForeground: "#f1f1f7",
                arrowHoverBackground: "#00A6FB",
              }}
              fontSizes={{
                name: "32px",
                designation: "20px",
                quote: "22px",
              }}
            />
          </div>
          </div>
        </div>
      </section>

    </div>
  );
}
