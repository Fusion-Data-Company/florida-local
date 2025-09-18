import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Star, 
  Loader2, 
  ShoppingCart, 
  Crown, 
  Sparkles, 
  Zap,
  Eye,
  TrendingUp
} from "lucide-react";

interface MagicEliteProductCardProps {
  product: Product;
  index?: number;
}

export default function MagicEliteProductCard({ product, index = 0 }: MagicEliteProductCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Magic MCP Mouse Tracking for Ambient Effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseenter', () => setIsHovered(true));
      card.addEventListener('mouseleave', () => setIsHovered(false));
      
      return () => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseenter', () => setIsHovered(true));
        card.removeEventListener('mouseleave', () => setIsHovered(false));
      };
    }
  }, []);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error("Please sign in to add items to cart");
      }
      return await apiRequest('POST', '/api/cart/items', {
        productId: product.id,
        quantity: 1,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  // Magic MCP Image Fallback System (deterministic)
  const getProductImage = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    const id = String(product.id || '');
    let seed = 0; for (let i=0;i<id.length;i++) seed = ((seed<<5)-seed)+id.charCodeAt(i);
    const pick = (arr: string[]) => arr[Math.abs(seed) % arr.length];
    const category = product.category?.toLowerCase() || '';
    if (category.includes('food') || category.includes('restaurant') || category.includes('beverage')) {
      return pick([
        '/attached_assets/stock_images/fine_dining_food_pre_6c60b0bf.jpg',
        '/attached_assets/stock_images/elegant_restaurant_f_cc520cc1.jpg',
        '/attached_assets/stock_images/elegant_restaurant_f_f8ca8e07.jpg'
      ]);
    }
    if (category.includes('spa') || category.includes('wellness') || category.includes('beauty')) {
      return pick([
        '/attached_assets/stock_images/luxury_spa_wellness__78221b18.jpg',
        '/attached_assets/stock_images/sunset_yoga_studio_p_c38ab4c1.jpg'
      ]);
    }
    if (category.includes('photo') || category.includes('photography')) {
      return pick([
        '/attached_assets/stock_images/professional_photogr_7ec7b11b.jpg',
        '/attached_assets/stock_images/professional_photogr_afdb1a59.jpg'
      ]);
    }
    return pick([
      '/attached_assets/stock_images/luxury_travel_experi_f2b67257.jpg',
      '/attached_assets/stock_images/modern_luxury_hotel__f6015919.jpg'
    ]);
  };

  const getBadgeForProduct = () => {
    if (product.tags && Array.isArray(product.tags)) {
      if (product.tags.includes('premium')) {
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">Premium</Badge>;
      }
      if (product.tags.includes('local-made')) {
        return <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none">Local Made</Badge>;
      }
      if (product.tags.includes('eco-friendly')) {
        return <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none">Eco-Friendly</Badge>;
      }
    }
    return null;
  };

  return (
    <div
      ref={cardRef}
      className="magic-elite-product-card group relative"
      style={{
        animationDelay: `${index * 150}ms`
      }}
    >
      {/* Magic MCP Dynamic Ambient Glow */}
      <div 
        className="absolute -inset-6 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
              rgba(25, 182, 246, 0.3) 0%, 
              rgba(255, 152, 67, 0.2) 30%, 
              rgba(147, 51, 234, 0.1) 60%, 
              transparent 100%)
          `,
          filter: 'blur(20px)'
        }}
      />

      <Card 
        className="relative overflow-hidden rounded-3xl border-2 border-white/30 backdrop-blur-xl magic-hover-lift"
        style={{
          background: `
            linear-gradient(145deg, 
              rgba(255,255,255,0.95) 0%, 
              rgba(255,255,255,0.85) 100%)
          `,
          boxShadow: `
            0 25px 50px rgba(0,0,0,0.1),
            0 0 30px rgba(25, 182, 246, 0.1),
            inset 0 1px 0 rgba(255,255,255,0.9)
          `
        }}
      >
        {/* Magic MCP Interactive Shimmer */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background: `
              linear-gradient(135deg, 
                transparent 0%, 
                rgba(255,255,255,0.1) 50%, 
                transparent 100%)
            `,
            transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
          }}
        />

        {/* Magic MCP Elite Product Image */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={getProductImage()}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = '/attached_assets/stock_images/luxury_travel_experi_f2b67257.jpg';
            }}
          />

          {/* Magic MCP Image Overlay Effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `
                radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
                  rgba(25, 182, 246, 0.2) 0%, 
                  transparent 50%)
              `
            }}
          />

          {/* Magic MCP Floating Elements */}
          <div className="absolute top-4 left-4">
            {getBadgeForProduct()}
          </div>

          {/* Magic MCP Price Badge */}
          <div className="absolute top-4 right-4">
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-1">
                <Crown className="h-4 w-4" />
                <span>${parseFloat(product.price || "0").toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Magic MCP Wishlist Button */}
          <div className="absolute bottom-4 right-4">
            <Button
              size="sm"
              variant="ghost"
              className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-lg group/heart"
            >
              <Heart className="h-5 w-5 text-slate-600 group-hover/heart:text-red-500 group-hover/heart:fill-current transition-all duration-300" />
            </Button>
          </div>

          {/* Magic MCP View Count */}
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-black/20 backdrop-blur-sm text-white text-sm">
              <Eye className="h-3 w-3" />
              <span>{Math.floor(Math.random() * 500) + 100}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-6 relative">
          {/* Magic MCP Content Background */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(25, 182, 246, 0.03) 0%, 
                  rgba(255, 152, 67, 0.02) 100%)
              `
            }}
          />

          <div className="relative z-10">
            {/* Magic MCP Product Title */}
            <h3 className="font-bold text-xl mb-3 miami-heading bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              {product.name}
            </h3>

            {/* Magic MCP Description */}
            {product.description && (
              <p className="text-slate-600 mb-4 miami-body-text line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Magic MCP Pricing Section */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black miami-accent-text">
                  ${parseFloat(product.price || "0").toFixed(2)}
                </span>
                {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                  <span className="text-lg text-slate-400 line-through">
                    ${parseFloat(product.originalPrice).toFixed(2)}
                  </span>
                )}
              </div>
              
              {/* Magic MCP Trending Indicator */}
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Trending</span>
              </div>
            </div>

            {/* Magic MCP Rating Display */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 p-3 rounded-xl magic-glass-elite border border-white/20">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                <span className="font-bold text-lg text-slate-900">
                  {product.rating || "4.8"}
                </span>
                <span className="text-slate-600">
                  ({product.reviewCount || Math.floor(Math.random() * 50) + 10} reviews)
                </span>
              </div>
            </div>

            {/* Magic MCP Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => addToCartMutation.mutate()}
                disabled={addToCartMutation.isPending}
                className="flex-1 btn-miami-primary miami-hover-lift font-semibold py-3 relative overflow-hidden group/cart"
              >
                {/* Magic MCP Button Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 opacity-0 group-hover/cart:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {addToCartMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-5 w-5" />
                  )}
                  <span>Add to Cart</span>
                </div>

                {/* Magic MCP Success Shimmer */}
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover/cart:left-full transition-all duration-1000" />
              </Button>

              <Button
                variant="outline"
                className="px-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 group/view"
              >
                <div className="relative z-10">
                  <Eye className="h-5 w-5 text-slate-700 group-hover/view:text-cyan-600 transition-colors duration-300" />
                </div>
              </Button>
            </div>

            {/* Magic MCP Product Tags */}
            {product.tags && Array.isArray(product.tags) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {product.tags.slice(0, 3).map((tag: string, tagIndex) => (
                  <Badge 
                    key={tagIndex}
                    className="text-xs px-2 py-1 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border border-slate-200 hover:from-cyan-50 hover:to-blue-50 hover:border-cyan-200 transition-all duration-300"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {/* Magic MCP Particle Effects */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400/60 rounded-full animate-ping"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Magic MCP Enhanced Product Grid
export function MagicEliteProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product, index) => (
        <MagicEliteProductCard 
          key={product.id} 
          product={product} 
          index={index}
        />
      ))}
    </div>
  );
}
