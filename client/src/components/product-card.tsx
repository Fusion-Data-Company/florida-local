import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Star, Loader2, X, ShoppingCart } from "lucide-react";

// Professional Stock Images
import elegantRestaurant1 from "@/assets/stock_images/elegant_restaurant_f_aa323e17.jpg";
import elegantRestaurant2 from "@/assets/stock_images/elegant_restaurant_f_cc520cc1.jpg";
import elegantRestaurant3 from "@/assets/stock_images/elegant_restaurant_f_f8ca8e07.jpg";
import fineDiningFood from "@/assets/stock_images/fine_dining_food_pre_6c60b0bf.jpg";
import gourmetCubanSandwich from "@/assets/stock_images/gourmet_cuban_sandwi_e0346f8d.jpg";

import luxuryWellnessSpa1 from "@/assets/stock_images/luxury_wellness_spa__482737df.jpg";
import luxuryWellnessSpa2 from "@/assets/stock_images/luxury_wellness_spa__8f194a3c.jpg";
import sunsetYogaStudio from "@/assets/stock_images/sunset_yoga_studio_p_c38ab4c1.jpg";
import yogaMeditation1 from "@/assets/stock_images/yoga_meditation_peac_cbdd7863.jpg";

import beachWeddingCeremony1 from "@/assets/stock_images/beach_wedding_ceremo_313889d0.jpg";
import elegantWeddingDecor from "@/assets/stock_images/elegant_wedding_deco_caf9a8bc.jpg";

import artisanCeramicPottery from "@/assets/stock_images/artisan_ceramic_pott_6f7a6640.jpg";
import luxuryTravelExperience from "@/assets/stock_images/luxury_travel_experi_f2b67257.jpg";
import modernLuxuryHotel from "@/assets/stock_images/modern_luxury_hotel__f6015919.jpg";
import professionalPhotography1 from "@/assets/stock_images/professional_photogr_7ec7b11b.jpg";
import professionalPhotography2 from "@/assets/stock_images/professional_photogr_afdb1a59.jpg";
import premiumPhotography from "@/assets/stock_images/premium_photography__509b059a.jpg";

interface ProductCardProps {
  product: Product;
}

// Professional Product Image Mapping System
const getCategoryProductImage = (product: Product): string => {
  const category = product.category?.toLowerCase() || '';
  const tags = ((product as any).tags as string[]) || [];
  const name = product.name?.toLowerCase() || '';
  const description = product.description?.toLowerCase() || '';
  
  // Food & Beverage Products
  if (category.includes('food') || category.includes('beverage') || category.includes('culinary') ||
      tags.some(tag => ['food', 'beverage', 'culinary', 'restaurant', 'gourmet', 'organic'].includes(tag.toLowerCase())) ||
      name.includes('food') || name.includes('drink') || name.includes('coffee') || name.includes('organic') ||
      description.includes('food') || description.includes('beverage') || description.includes('gourmet')) {
    const foodImages = [elegantRestaurant1, elegantRestaurant2, elegantRestaurant3, fineDiningFood, gourmetCubanSandwich];
    return foodImages[Math.floor(Math.random() * foodImages.length)];
  }
  
  // Health & Beauty Products
  if (category.includes('health') || category.includes('beauty') || category.includes('wellness') || category.includes('skincare') ||
      tags.some(tag => ['health', 'beauty', 'wellness', 'skincare', 'organic', 'natural', 'spa'].includes(tag.toLowerCase())) ||
      name.includes('cream') || name.includes('serum') || name.includes('wellness') || name.includes('spa') ||
      description.includes('beauty') || description.includes('wellness') || description.includes('skincare')) {
    const wellnessImages = [luxuryWellnessSpa1, luxuryWellnessSpa2, sunsetYogaStudio, yogaMeditation1];
    return wellnessImages[Math.floor(Math.random() * wellnessImages.length)];
  }
  
  // Art & Crafts Products
  if (category.includes('art') || category.includes('craft') || category.includes('handmade') ||
      tags.some(tag => ['art', 'craft', 'handmade', 'artisan', 'pottery', 'ceramic', 'handcrafted'].includes(tag.toLowerCase())) ||
      name.includes('art') || name.includes('craft') || name.includes('handmade') || name.includes('pottery') ||
      description.includes('handmade') || description.includes('artisan') || description.includes('craft')) {
    return artisanCeramicPottery;
  }
  
  // Fashion & Accessories
  if (category.includes('fashion') || category.includes('clothing') || category.includes('accessories') ||
      tags.some(tag => ['fashion', 'clothing', 'jewelry', 'accessories', 'designer'].includes(tag.toLowerCase())) ||
      name.includes('dress') || name.includes('jewelry') || name.includes('accessories') ||
      description.includes('fashion') || description.includes('clothing') || description.includes('jewelry')) {
    return premiumPhotography;
  }
  
  // Wedding & Event Products
  if (category.includes('wedding') || category.includes('event') ||
      tags.some(tag => ['wedding', 'event', 'celebration', 'party', 'bridal'].includes(tag.toLowerCase())) ||
      name.includes('wedding') || name.includes('bridal') || name.includes('event') ||
      description.includes('wedding') || description.includes('event') || description.includes('bridal')) {
    const weddingImages = [beachWeddingCeremony1, elegantWeddingDecor];
    return weddingImages[Math.floor(Math.random() * weddingImages.length)];
  }
  
  // Travel & Experiences
  if (category.includes('travel') || category.includes('experience') || category.includes('hotel') ||
      tags.some(tag => ['travel', 'experience', 'hotel', 'vacation', 'luxury'].includes(tag.toLowerCase())) ||
      name.includes('travel') || name.includes('hotel') || name.includes('vacation') ||
      description.includes('travel') || description.includes('experience') || description.includes('luxury')) {
    return luxuryTravelExperience;
  }
  
  // Photography & Services
  if (category.includes('photography') || category.includes('service') ||
      tags.some(tag => ['photography', 'service', 'professional', 'creative'].includes(tag.toLowerCase())) ||
      name.includes('photo') || name.includes('service') ||
      description.includes('photography') || description.includes('service')) {
    const photographyImages = [professionalPhotography1, professionalPhotography2, premiumPhotography];
    return photographyImages[Math.floor(Math.random() * photographyImages.length)];
  }
  
  // Premium Default
  const premiumDefaults = [luxuryTravelExperience, modernLuxuryHotel, premiumPhotography, elegantRestaurant1];
  return premiumDefaults[Math.floor(Math.random() * premiumDefaults.length)];
};

export default function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const addToCartMutation = useMutation({
    mutationFn: async (quantity: number = 1) => {
      return await apiRequest('POST', '/api/cart', { 
        productId: product.id, 
        quantity 
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      // TODO: Implement wishlist API call
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      setIsWishlisted(!isWishlisted);
      toast({
        title: isWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
        description: isWishlisted 
          ? `${product.name} removed from your wishlist`
          : `${product.name} added to your wishlist`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized", 
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    },
  });

  const getProductImage = () => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    // Use professional stock images instead of gradients
    return getCategoryProductImage(product);
  };

  const getBadgeForProduct = () => {
    if (product.isDigital) {
      return <Badge className="glass-panel border-primary/50 text-primary font-bold shadow-sm">Digital</Badge>;
    }
    if (product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price)) {
      const discount = Math.round(((parseFloat(product.originalPrice) - parseFloat(product.price)) / parseFloat(product.originalPrice)) * 100);
      return <Badge className="metallic font-bold shadow-sm">{discount}% Off</Badge>;
    }
    if (product.tags && Array.isArray(product.tags)) {
      if (product.tags.includes('local-made')) {
        return <Badge className="glass-panel border-secondary/50 text-secondary font-bold shadow-sm">Local Made</Badge>;
      }
      if (product.tags.includes('eco-friendly')) {
        return <Badge className="glass-panel border-accent/50 text-accent font-bold shadow-sm">Eco-Friendly</Badge>;
      }
      if (product.tags.includes('handcrafted')) {
        return <Badge className="glass-panel border-accent/50 text-accent font-bold shadow-sm">Handcrafted</Badge>;
      }
    }
    return null;
  };

  return (
    <Card className={`group relative transition-all duration-700 transform hover:scale-[1.02] hover:-translate-y-4 cursor-pointer overflow-hidden rounded-3xl`}
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
            backdropFilter: 'blur(30px) saturate(200%)',
            border: '3px solid rgba(255,255,255,0.3)',
            boxShadow: `
              0 32px 64px rgba(0,0,0,0.12),
              inset 0 1px 0 rgba(255,255,255,1),
              inset 0 -1px 0 rgba(0,0,0,0.05),
              0 0 0 1px rgba(255,255,255,0.1)
            `,
            filter: 'drop-shadow(0 25px 60px rgba(0,0,0,0.15))'
          }}>
      
      {/* Enhanced Product Image with Fortune 500-Level Presentation */}
      <div className="relative h-56 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-115"
          style={{ 
            backgroundImage: `url(${getProductImage()})`,
            filter: 'contrast(1.15) saturate(1.3) brightness(1.08)'
          }}
        />
        
        {/* Sophisticated Multi-Layer Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/15 via-transparent to-primary/8 mix-blend-soft-light"></div>
        
        {/* Premium Frame Effect */}
        <div className="absolute inset-3 border-2 border-slate-200 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        {/* Luxury Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}>
        </div>

        {/* Enhanced Wishlist Button */}
        <div className="absolute top-4 right-4 z-30 transform group-hover:scale-110 transition-transform duration-500">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => wishlistMutation.mutate()}
            disabled={wishlistMutation.isPending || !isAuthenticated}
            className={`p-4 rounded-2xl border-2 transition-all duration-500 hover:scale-110 hover:-translate-y-1 shadow-xl ${ 
              isWishlisted 
                ? "text-accent border-accent/40 shadow-accent/20" 
                : "text-muted-foreground hover:text-accent border-slate-200 hover:border-accent/40"
            }`}
            style={{
              background: isWishlisted 
                ? 'linear-gradient(135deg, rgba(255,20,147,0.15) 0%, rgba(255,20,147,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)',
              backdropFilter: 'blur(25px)'
            }}
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart className={`text-lg transition-all duration-500 ${ 
              isWishlisted ? 'animate-pulse scale-110 fill-current' : 'group-hover:scale-125'
            }`} size={18} />
            {isWishlisted && (
              <div className="absolute inset-0 bg-gradient-to-r from-accent/25 to-primary/25 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            )}
          </Button>
        </div>
        
        {/* Enhanced Badge Positioning */}
        <div className="absolute bottom-4 left-4 z-30 transform group-hover:scale-110 transition-transform duration-500">
          {getBadgeForProduct()}
        </div>
        
        {/* Premium Shimmer Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-1200">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-[-120%] group-hover:translate-x-[420%] transition-transform duration-1200 ease-out"></div>
        </div>
      </div>
      
      <CardContent className="p-8 relative bg-gradient-to-b from-transparent to-white/40">
        {/* Premium Product Category */}
        <div className="text-base gradient-text-cyan font-bold mb-3 uppercase tracking-wider">
          Local Business Product
        </div>
        
        {/* Enhanced Product Title */}
        <h3 className="font-black mb-4 line-clamp-2 text-luxury gradient-text-gold font-serif text-xl leading-tight group-hover:scale-105 transition-transform duration-500">
          {product.name}
        </h3>
        
        {/* Enhanced Description */}
        <p className="text-base text-muted-foreground mb-6 line-clamp-2 leading-relaxed font-light tracking-wide">
          {product.description || "Premium quality product from a distinguished local business, crafted with exceptional attention to detail."}
        </p>
        
        {/* Fortune 500-Level Price & Rating Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <span className="font-black text-2xl gradient-text-gold text-price font-serif">
              ${parseFloat(product.price || "0").toFixed(2)}
            </span>
            {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
              <span className="text-base text-muted-foreground line-through font-medium">
                ${parseFloat(product.originalPrice).toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-base px-4 py-2 rounded-xl border-2 border-border/25"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
              backdropFilter: 'blur(15px)'
            }}>
            <Star className="text-secondary fill-current" size={16} />
            <span className="gradient-text-gold font-bold">{product.rating ? parseFloat(product.rating).toFixed(1) : "4.8"}</span>
            <span className="text-muted-foreground font-medium">
              ({product.reviewCount || 0})
            </span>
          </div>
        </div>
        
        {/* Premium Add to Cart Button */}
        <Button
          onClick={() => addToCartMutation.mutate()}
          disabled={addToCartMutation.isPending || !product.isActive || (product.inventory !== null && product.inventory === 0)}
          className="w-full h-16 text-lg font-black relative overflow-hidden rounded-2xl transition-all duration-700 hover:scale-105 hover:-translate-y-2 shadow-xl hover:shadow-2xl"
          style={{
            background: (product.inventory !== null && product.inventory === 0) 
              ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
              : 'linear-gradient(135deg, hsl(45, 95%, 72%) 0%, hsl(45, 85%, 65%) 25%, hsl(45, 95%, 75%) 50%, hsl(45, 85%, 60%) 75%, hsl(45, 95%, 70%) 100%)',
            boxShadow: (product.inventory !== null && product.inventory === 0) 
              ? '0 12px 35px rgba(75, 85, 99, 0.4)'
              : '0 12px 35px rgba(45, 80, 45, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.95)'
          }}
          data-testid={`button-add-to-cart-${product.id}`}
        >
          <span className="relative z-10 text-white drop-shadow-sm tracking-wide">
            {addToCartMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                Adding to Cart...
              </>
            ) : (product.inventory !== null && product.inventory === 0) ? (
              <>
                <X className="h-5 w-5 mr-3" />
                Out of Stock
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5 mr-3" />
                Add to Cart
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-accent/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          {/* Enhanced metallic shine effect */}
          {(product.inventory === null || product.inventory > 0) && (
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000 ease-out"></div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}