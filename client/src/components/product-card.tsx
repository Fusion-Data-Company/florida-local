import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Product } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Star, Loader2, ShoppingCart, Eye } from "lucide-react";

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

function hashId(id?: string) { return [...(id||'')].reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,0); }
function pick<T>(arr: T[], seed: number): T { return arr[Math.abs(seed) % arr.length]; }

const getCategoryProductImage = (product: Product): string => {
  const seed = hashId(product.id);
  const category = product.category?.toLowerCase() || '';
  const tags = ((product as any).tags as string[]) || [];
  const name = product.name?.toLowerCase() || '';
  const description = product.description?.toLowerCase() || '';
  
  if (category.includes('food') || category.includes('beverage') || category.includes('culinary') ||
      tags.some(tag => ['food', 'beverage', 'culinary', 'restaurant', 'gourmet', 'organic'].includes(tag.toLowerCase())) ||
      name.includes('food') || name.includes('drink') || name.includes('coffee') || name.includes('organic') ||
      description.includes('food') || description.includes('beverage') || description.includes('gourmet')) {
    const foodImages = [elegantRestaurant1, elegantRestaurant2, elegantRestaurant3, fineDiningFood, gourmetCubanSandwich];
    return pick(foodImages, seed);
  }
  
  if (category.includes('health') || category.includes('beauty') || category.includes('wellness') || category.includes('skincare') ||
      tags.some(tag => ['health', 'beauty', 'wellness', 'skincare', 'organic', 'natural', 'spa'].includes(tag.toLowerCase())) ||
      name.includes('cream') || name.includes('serum') || name.includes('wellness') || name.includes('spa') ||
      description.includes('beauty') || description.includes('wellness') || description.includes('skincare')) {
    const wellnessImages = [luxuryWellnessSpa1, luxuryWellnessSpa2, sunsetYogaStudio, yogaMeditation1];
    return pick(wellnessImages, seed);
  }
  
  if (category.includes('art') || category.includes('craft') || category.includes('handmade') ||
      tags.some(tag => ['art', 'craft', 'handmade', 'artisan', 'pottery', 'ceramic', 'handcrafted'].includes(tag.toLowerCase())) ||
      name.includes('art') || name.includes('craft') || name.includes('handmade') || name.includes('pottery') ||
      description.includes('handmade') || description.includes('artisan') || description.includes('craft')) {
    return artisanCeramicPottery;
  }
  
  if (category.includes('fashion') || category.includes('clothing') || category.includes('accessories') ||
      tags.some(tag => ['fashion', 'clothing', 'jewelry', 'accessories', 'designer'].includes(tag.toLowerCase())) ||
      name.includes('dress') || name.includes('jewelry') || name.includes('accessories') ||
      description.includes('fashion') || description.includes('clothing') || description.includes('jewelry')) {
    return premiumPhotography;
  }
  
  if (category.includes('wedding') || category.includes('event') ||
      tags.some(tag => ['wedding', 'event', 'celebration', 'party', 'bridal'].includes(tag.toLowerCase())) ||
      name.includes('wedding') || name.includes('bridal') || name.includes('event') ||
      description.includes('wedding') || description.includes('event') || description.includes('bridal')) {
    const weddingImages = [beachWeddingCeremony1, elegantWeddingDecor];
    return pick(weddingImages, seed);
  }
  
  if (category.includes('travel') || category.includes('experience') || category.includes('hotel') ||
      tags.some(tag => ['travel', 'experience', 'hotel', 'vacation', 'luxury'].includes(tag.toLowerCase())) ||
      name.includes('travel') || name.includes('hotel') || name.includes('vacation') ||
      description.includes('travel') || description.includes('experience') || description.includes('luxury')) {
    return luxuryTravelExperience;
  }
  
  if (category.includes('photography') || category.includes('service') ||
      tags.some(tag => ['photography', 'service', 'professional', 'creative'].includes(tag.toLowerCase())) ||
      name.includes('photo') || name.includes('service') ||
      description.includes('photography') || description.includes('service')) {
    const photographyImages = [professionalPhotography1, professionalPhotography2, premiumPhotography];
    return pick(photographyImages, seed);
  }
  
  const premiumDefaults = [luxuryTravelExperience, modernLuxuryHotel, premiumPhotography, elegantRestaurant1];
  return pick(premiumDefaults, seed);
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
    if (product.imageUrl) {
      return product.imageUrl;
    }
    return getCategoryProductImage(product);
  };

  const getBadgeForProduct = () => {
    if (product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)) {
      const discount = Math.round(((Number(product.compareAtPrice) - Number(product.price)) / Number(product.compareAtPrice)) * 100);
      return <Badge className="luxury-product-badge badge-discount">{discount}% Off</Badge>;
    }
    if (product.tags && Array.isArray(product.tags)) {
      if (product.tags.includes('local-made')) {
        return <Badge className="luxury-product-badge badge-local">Local Made</Badge>;
      }
      if (product.tags.includes('eco-friendly')) {
        return <Badge className="luxury-product-badge badge-eco">Eco-Friendly</Badge>;
      }
      if (product.tags.includes('handcrafted')) {
        return <Badge className="luxury-product-badge badge-craft">Handcrafted</Badge>;
      }
    }
    return null;
  };

  return (
    <Card className="luxury-product-card group" data-testid={`card-product-${product.id}`}>
      
      {/* Marble Texture Overlay */}
      <div className="luxury-marble-overlay" />
      
      {/* Product Image Container */}
      <div className="luxury-product-image-container">
        <div 
          className="luxury-product-image"
          style={{ 
            backgroundImage: `url(${getProductImage()})`
          }}
        />
        
        {/* Elegant Image Overlay */}
        <div className="luxury-image-gradient" />
        
        {/* Wishlist Button */}
        <div className="absolute top-3 right-3 z-20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => wishlistMutation.mutate()}
            disabled={wishlistMutation.isPending || !isAuthenticated}
            className="luxury-wishlist-btn"
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart className={`h-4 w-4 transition-all duration-300 ${
              isWishlisted ? 'fill-current text-rose-500 scale-110' : 'text-slate-600 group-hover:scale-110'
            }`} />
          </Button>
        </div>
        
        {/* Product Badge */}
        <div className="absolute top-3 left-3 z-20">
          {getBadgeForProduct()}
        </div>
      </div>
      
      <CardContent className="p-6 relative">
        {/* Product Name */}
        <h3 className="luxury-product-name font-serif mb-3 line-clamp-2">
          {product.name}
        </h3>
        
        {/* Product Description */}
        <p className="luxury-product-description mb-4 line-clamp-2">
          {product.description || "Premium quality product from a distinguished local business."}
        </p>
        
        {/* Price Section */}
        <div className="luxury-price-container mb-4">
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
        </div>
        
        {/* Rating Section */}
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
            onClick={() => addToCartMutation.mutate(1)}
            disabled={addToCartMutation.isPending || !product.isActive || (product.stockQuantity !== null && product.stockQuantity === 0)}
            className="luxury-add-to-cart-btn flex-1"
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {addToCartMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Adding...
                </>
              ) : (product.stockQuantity !== null && product.stockQuantity === 0) ? (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Out of Stock
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </>
              )}
            </span>
            
            {/* Button Shimmer Effect */}
            {(product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity > 0) && (
              <div className="luxury-button-shimmer" />
            )}
          </Button>

          <Button
            variant="outline"
            className="luxury-view-details-btn"
            data-testid={`button-view-details-${product.id}`}
          >
            <Eye className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
