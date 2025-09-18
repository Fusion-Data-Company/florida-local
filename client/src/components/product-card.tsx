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

interface ProductCardProps {
  product: Product;
}

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
    // Fallback gradient based on product category
    const categoryGradients = {
      'Food & Beverage': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      'Fashion': 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      'Health & Beauty': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'Art & Crafts': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      'Electronics': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      default: 'linear-gradient(135deg, hsl(198 93% 60%) 0%, hsl(25 75% 47%) 100%)'
    };
    
    return categoryGradients[product.category as keyof typeof categoryGradients] || categoryGradients.default;
  };

  const getBadgeForProduct = () => {
    if (product.isDigital) {
      return <Badge className="glass-panel border-primary/50 glow-primary text-primary font-semibold">Digital</Badge>;
    }
    if (product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price)) {
      const discount = Math.round(((parseFloat(product.originalPrice) - parseFloat(product.price)) / parseFloat(product.originalPrice)) * 100);
      return <Badge className="metallic glow-secondary neon-glow font-semibold">{discount}% Off</Badge>;
    }
    if (product.tags && Array.isArray(product.tags)) {
      if (product.tags.includes('local-made')) {
        return <Badge className="glass-panel border-secondary/50 glow-secondary text-secondary font-semibold">Local Made</Badge>;
      }
      if (product.tags.includes('eco-friendly')) {
        return <Badge className="glass-panel border-accent/50 glow-accent text-accent font-semibold">Eco-Friendly</Badge>;
      }
      if (product.tags.includes('handcrafted')) {
        return <Badge className="glass-panel border-accent/50 glow-accent text-accent font-semibold">Handcrafted</Badge>;
      }
    }
    return null;
  };

  return (
    <Card className="glass-panel hover-lift card-rim-light ambient-particles overflow-hidden rounded-2xl transition-all duration-500">
      {/* Product Image */}
      <div 
        className="h-48 bg-cover bg-center relative overflow-hidden"
        style={{ backgroundImage: `url(${getProductImage()})` }}
      >
        {/* Luxury Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
        
        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => wishlistMutation.mutate()}
            disabled={wishlistMutation.isPending || !isAuthenticated}
            className={`glass-panel p-3 rounded-full hover-lift btn-press transition-all duration-300 group ${
              isWishlisted ? "text-accent neon-glow border-accent/50" : "text-muted-foreground hover:text-accent border-border/30"
            }`}
            data-testid={`button-wishlist-${product.id}`}
          >
            <i className={`${isWishlisted ? "fas fa-heart" : "far fa-heart"} transition-transform duration-300 group-hover:scale-110`}></i>
            {isWishlisted && <div className="absolute inset-0 bg-accent/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>}
          </Button>
        </div>
        <div className="absolute bottom-3 left-3 z-10">
          {getBadgeForProduct()}
        </div>
      </div>
      
      <CardContent className="p-6 relative">
        <div className="text-sm gradient-text-cyan font-medium mb-2 uppercase tracking-wide">
          Local Business
        </div>
        <h3 className="font-bold mb-3 line-clamp-2 text-luxury gradient-text-gold font-serif text-lg">{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {product.description || "Premium quality product from a distinguished local business."}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl gradient-text-gold text-price">
              ${parseFloat(product.price || "0").toFixed(2)}
            </span>
            {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
              <span className="text-sm text-muted-foreground line-through">
                ${parseFloat(product.originalPrice).toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1 text-sm glass-panel px-3 py-1 rounded-lg border-border/20">
            <i className="fas fa-star text-secondary glow-secondary"></i>
            <span className="gradient-text-gold font-medium">{product.rating ? parseFloat(product.rating).toFixed(1) : "4.5"}</span>
            <span className="text-muted-foreground">
              ({product.reviewCount || 0})
            </span>
          </div>
        </div>
        
        <Button
          onClick={() => addToCartMutation.mutate()}
          disabled={addToCartMutation.isPending || !product.isActive}
          className="w-full metallic hover-lift btn-press font-semibold transition-all duration-300 group relative overflow-hidden"
          data-testid={`button-add-to-cart-${product.id}`}
        >
          <span className="relative z-10">
            {addToCartMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Adding...
              </>
            ) : product.inventory === 0 ? (
              "Out of Stock"
            ) : (
              "Add to Cart"
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Button>
      </CardContent>
    </Card>
  );
}