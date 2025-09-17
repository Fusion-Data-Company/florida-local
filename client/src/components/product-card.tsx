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
    mutationFn: async () => {
      // TODO: Implement add to cart API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart`,
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
      return <Badge className="bg-blue-500 text-white">Digital</Badge>;
    }
    if (product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price)) {
      const discount = Math.round(((parseFloat(product.originalPrice) - parseFloat(product.price)) / parseFloat(product.originalPrice)) * 100);
      return <Badge className="bg-red-500 text-white">{discount}% Off</Badge>;
    }
    if (product.tags && Array.isArray(product.tags)) {
      if (product.tags.includes('local-made')) {
        return <Badge className="bg-secondary text-secondary-foreground">Local Made</Badge>;
      }
      if (product.tags.includes('eco-friendly')) {
        return <Badge className="bg-green-500 text-white">Eco-Friendly</Badge>;
      }
      if (product.tags.includes('handcrafted')) {
        return <Badge className="bg-accent text-accent-foreground">Handcrafted</Badge>;
      }
    }
    return null;
  };

  return (
    <Card className="hover-lift overflow-hidden">
      {/* Product Image */}
      <div 
        className="h-48 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${getProductImage()})` }}
      >
        <div className="absolute top-3 right-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => wishlistMutation.mutate()}
            disabled={wishlistMutation.isPending || !isAuthenticated}
            className={`bg-white/90 p-2 rounded-full shadow-lg transition-colors ${
              isWishlisted ? "text-accent" : "text-muted-foreground hover:text-accent"
            }`}
            data-testid={`button-wishlist-${product.id}`}
          >
            <i className={isWishlisted ? "fas fa-heart" : "far fa-heart"}></i>
          </Button>
        </div>
        <div className="absolute bottom-3 left-3">
          {getBadgeForProduct()}
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground mb-2">
          Local Business
        </div>
        <h3 className="font-bold mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {product.description || "Quality product from a local business."}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            <span className="font-bold text-lg">
              ${parseFloat(product.price || "0").toFixed(2)}
            </span>
            {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
              <span className="text-sm text-muted-foreground line-through">
                ${parseFloat(product.originalPrice).toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1 text-sm">
            <i className="fas fa-star text-yellow-400"></i>
            <span>{product.rating ? parseFloat(product.rating).toFixed(1) : "4.5"}</span>
            <span className="text-muted-foreground">
              ({product.reviewCount || 0})
            </span>
          </div>
        </div>
        
        <Button
          onClick={() => addToCartMutation.mutate()}
          disabled={addToCartMutation.isPending || !product.isActive}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all"
          data-testid={`button-add-to-cart-${product.id}`}
        >
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
        </Button>
      </CardContent>
    </Card>
  );
}
