import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { CartItem } from "@shared/schema";

export default function CartIcon() {
  const { isAuthenticated } = useAuth();

  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    enabled: isAuthenticated,
  });

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button variant="ghost" size="sm" asChild className="relative" data-testid="button-cart">
      <Link href="/cart">
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-primary text-primary-foreground"
            data-testid="text-cart-count"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </Badge>
        )}
      </Link>
    </Button>
  );
}