import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Product } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { VerifiedBadge, getVerificationTier } from "@/components/ui/verified-badge";
import {
  Heart,
  Star,
  Loader2,
  ShoppingCart,
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

  const getProductImage = () => {
    if (product.imageUrl) {
      return product.imageUrl;
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
        return <Badge className="luxury-product-badge badge-premium">Premium</Badge>;
      }
      if (product.tags.includes('local-made')) {
        return <Badge className="luxury-product-badge badge-local">Local Made</Badge>;
      }
      if (product.tags.includes('eco-friendly')) {
        return <Badge className="luxury-product-badge badge-eco">Eco-Friendly</Badge>;
      }
    }
    return null;
  };

  return (
    <div
      ref={cardRef}
      className="relative group"
      style={{
        animationDelay: `${index * 150}ms`
      }}
    >
      {/* Magic Dynamic Ambient Glow */}
      <div 
        className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none blur-xl"
        style={{
          background: `
            radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
              rgba(212, 175, 55, 0.3) 0%, 
              rgba(205, 127, 50, 0.2) 30%, 
              rgba(184, 134, 11, 0.1) 60%, 
              transparent 100%)
          `
        }}
      />

      <Card className="luxury-product-card">
        {/* Marble Texture Overlay */}
        <div className="luxury-marble-overlay" />
        
        {/* Interactive Shimmer */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: `
              linear-gradient(135deg, 
                transparent 0%, 
                rgba(255,255,255,0.15) 50%, 
                transparent 100%)
            `,
            transform: `translate(${mousePosition.x * 0.08}px, ${mousePosition.y * 0.08}px)`
          }}
        />

        {/* Product Image Container */}
        <div className="luxury-product-image-container">
          <img
            src={getProductImage()}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = '/attached_assets/stock_images/luxury_travel_experi_f2b67257.jpg';
            }}
          />

          {/* Elegant Image Overlay */}
          <div className="luxury-image-gradient" />
          
          {/* Interactive Mouse Overlay */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `
                radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
                  rgba(212, 175, 55, 0.2) 0%, 
                  transparent 50%)
              `
            }}
          />

          {/* Product Badge & Verification */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
            {getBadgeForProduct()}
            {product.business && getVerificationTier({
              gmbConnected: product.business.gmbConnected,
              averageRating: product.business.rating,
              totalReviews: product.business.reviewCount,
              monthlyEngagement: (product.business.followerCount || 0) + (product.business.postCount || 0) * 10,
              isSpotlightFeatured: product.business.isVerified
            }) && (
              <VerifiedBadge
                type={getVerificationTier({
                  gmbConnected: product.business.gmbConnected,
                  averageRating: product.business.rating,
                  totalReviews: product.business.reviewCount,
                  monthlyEngagement: (product.business.followerCount || 0) + (product.business.postCount || 0) * 10,
                  isSpotlightFeatured: product.business.isVerified
                })!}
                size="sm"
                showLabel
              />
            )}
          </div>

          {/* Price Badge */}
          <div className="absolute top-3 right-3 z-20">
            <div className="luxury-price-badge">
              <span className="font-bold">${Number(product.price).toFixed(2)}</span>
            </div>
          </div>

          {/* Wishlist Button */}
          <div className="absolute bottom-3 right-3 z-20">
            <Button
              size="sm"
              variant="ghost"
              className="luxury-wishlist-btn"
            >
              <Heart className="h-4 w-4 text-slate-600 group-hover:text-rose-500 group-hover:fill-current transition-all duration-300" />
            </Button>
          </div>
        </div>

        <CardContent className="p-6 relative">
          {/* Content Background Gradient */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(212, 175, 55, 0.03) 0%, 
                  rgba(205, 127, 50, 0.02) 100%)
              `
            }}
          />

          <div className="relative z-10">
            {/* Product Name */}
            <h3 className="luxury-product-name font-serif mb-3 line-clamp-2">
              {product.name}
            </h3>

            {/* Product Description */}
            {product.description && (
              <p className="luxury-product-description mb-4 line-clamp-2">
                {product.description}
              </p>
            )}

            {/* Pricing & Trending Section */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-2">
                <span className="luxury-product-price font-serif">
                  ${Number(product.price).toFixed(2)}
                </span>
                {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                  <span className="luxury-original-price">
                    ${Number(product.compareAtPrice).toFixed(2)}
                  </span>
                )}
              </div>
              
              {/* Trending Indicator */}
              <div className="luxury-trending-badge">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">Trending</span>
              </div>
            </div>

            {/* Rating Display */}
            <div className="luxury-rating-container mb-5">
              <Star className="h-4 w-4 text-amber-400 fill-current" />
              <span className="luxury-rating-score">
                4.8
              </span>
              <span className="luxury-rating-count">
                ({Math.floor(Math.random() * 50) + 10} reviews)
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => addToCartMutation.mutate()}
                disabled={addToCartMutation.isPending}
                className="luxury-add-to-cart-btn flex-1"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {addToCartMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </span>
                
                {/* Button Shimmer Effect */}
                <div className="luxury-button-shimmer" />
              </Button>

              <Button
                variant="outline"
                className="luxury-view-details-btn"
              >
                <Eye className="h-5 w-5" />
              </Button>
            </div>

            {/* Product Tags */}
            {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {product.tags.slice(0, 3).map((tag: string, tagIndex) => (
                  <Badge 
                    key={tagIndex}
                    className="luxury-tag-badge"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {/* Particle Effects */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-amber-400/60 rounded-full animate-ping"
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
