import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { CartItem } from "@shared/types";

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
    <Button 
      variant="ghost" 
      size="sm" 
      asChild 
      className="relative rounded-lg hover:bg-gradient-to-br hover:from-cyan-50 hover:to-teal-50 transition-all" 
      style={{
        width: '40px',
        height: '40px',
        padding: 0
      }}
      data-testid="button-cart"
    >
      <Link href="/cart">
        <ShoppingCart 
          className="h-5 w-5" 
          style={{ 
            color: '#0891b2',
            strokeWidth: 2 
          }} 
        />
        {itemCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold border-2 border-white"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #CD7F32 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(212, 175, 55, 0.4), 0 0 12px rgba(212, 175, 55, 0.3)'
            }}
            data-testid="text-cart-count"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </Badge>
        )}
      </Link>
    </Button>
  );
}