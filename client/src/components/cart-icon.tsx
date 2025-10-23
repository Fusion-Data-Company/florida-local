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
    <>
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="relative rounded-full hover:scale-110 transition-all duration-300"
        style={{
          width: '52px',
          height: '52px',
          padding: 0,
          position: 'relative',
          background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.08) 50%, rgba(168, 85, 247, 0.15) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '2px solid rgba(168, 85, 247, 0.4)',
          borderTop: '2px solid rgba(168, 85, 247, 0.6)',
          borderLeft: '2px solid rgba(168, 85, 247, 0.5)',
          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.35), inset 0 3px 6px rgba(168, 85, 247, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.1), 0 0 30px rgba(168, 85, 247, 0.3)',
          overflow: 'visible',
          zIndex: 1
        }}
        data-testid="button-cart"
      >
        <Link href="/cart">
          <ShoppingCart
            className="h-6 w-6 text-purple-400"
            style={{
              strokeWidth: 2.5,
              position: 'relative',
              zIndex: 1
            }}
          />
          {itemCount > 0 && (
            <Badge
              className="absolute h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold border-2 border-white"
              style={{
                top: '-8px',
                right: '-8px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #CD7F32 100%)',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.5), 0 0 16px rgba(212, 175, 55, 0.4)',
                zIndex: 9999,
                pointerEvents: 'none',
                transform: 'translateZ(100px)'
              }}
              data-testid="text-cart-count"
            >
              {itemCount > 99 ? '99+' : itemCount}
            </Badge>
          )}
        </Link>
      </Button>
    </>
  );
}