import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ApiCartItem } from "@/lib/types";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import GlowHero from "@/components/ui/glow-hero";
import {
  PremiumLoader,
  Transform3DCard,
} from "@/components/premium-ultra";
import { PremiumGlassCard, PremiumBadge, PremiumButton } from "@/components/premium-ui";

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<ApiCartItem[]>({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
  });

  const updateQty = useMutation({
    mutationFn: async (params: { productId: string; quantity: number }) => {
      return await apiRequest("PUT", `/api/cart/${params.productId}`, {
        quantity: params.quantity,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("DELETE", `/api/cart/${productId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] }),
  });

  const checkout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/checkout", {});
      return await res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Order created", description: "Your order is pending payment." });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      // Redirect to order confirmation
      window.location.href = `/order-confirmation?orderId=${data.order.id}`;
    },
    onError: async (err: Error) => {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
    },
  });

  const subtotal = items.reduce((sum, i) => sum + (Number(i.product.price) || 0) * i.quantity, 0);

  if (isLoading) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light flex items-center justify-center"
        data-surface-intensity="delicate"
        data-surface-tone="warm"
      >
        <PremiumLoader text="Loading your cart..." />
      </div>
    );
  }

  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen relative"
      style={{
        backgroundImage: "url('/backgrounds/abstract-composition-glowing-bubbles-dark-background-with-orange-blue-tones_1090747-6434.avif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
      data-surface-intensity="delicate"
      data-surface-tone="warm"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-blue-50/88 to-orange-50/88 backdrop-blur-md" />

      <div className="relative z-10">
      {/* HERO SECTION */}
      <div className="py-12">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="flex flex-col items-center gap-4 mb-4">
            <GlowHero
              glowText="Shopping Cart"
              glowTextSize="lg"
              className="entrance-fade-up"
            />
            {items.length > 0 && (
              <PremiumBadge color="sapphire" size="md" className="entrance-scale-fade stagger-1">
                {items.length} {items.length === 1 ? 'Item' : 'Items'}
              </PremiumBadge>
            )}
          </div>
        </div>
      </div>

      <div className="cart-container container mx-auto px-4 lg:px-8 py-10">
        <div className="marble-content">
        {items.length === 0 ? (
          <Transform3DCard className="entrance-scale-fade">
            <PremiumGlassCard className="cart-empty-state ambient-glow-purple">
              <CardContent className="text-center py-16">
                <div className="mb-6">
                  <ShoppingCart className="h-20 w-20 mx-auto text-muted-foreground opacity-50" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">Start shopping to add items to your cart</p>
                <Button asChild size="lg" className="shimmer-gold-hover">
                  <a href="/marketplace">Continue Shopping</a>
                </Button>
              </CardContent>
            </PremiumGlassCard>
          </Transform3DCard>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => (
                <Transform3DCard key={item.id} className="entrance-slide-right" style={{ animationDelay: `${index * 0.1}s` }}>
                  <PremiumGlassCard className="cart-item-card elevation-2 mouse-track-glow">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-32 h-32 object-cover rounded-xl shadow-lg"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-gradient-to-br from-muted to-muted-foreground/20 rounded-xl shadow-lg flex items-center justify-center">
                            <ShoppingCart className="h-12 w-12 text-muted-foreground opacity-50" />
                          </div>
                        )}

                        <div className="flex-1">
                          <h3 className="font-bold text-xl mb-2">{item.product.name}</h3>
                          <div className="flex items-center gap-2 mb-4">
                            <PremiumBadge color="emerald" size="sm">
                              ${item.product.price}
                            </PremiumBadge>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-muted-foreground">Quantity:</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQty.mutate({ productId: item.productId, quantity: Math.max(1, item.quantity - 1) })}
                              className="h-9 w-9 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQty.mutate({ productId: item.productId, quantity: parseInt(e.target.value) || 1 })}
                              className="w-20 text-center font-bold"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQty.mutate({ productId: item.productId, quantity: item.quantity + 1 })}
                              className="h-9 w-9 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="text-right flex flex-col justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Total</p>
                            <p className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              ${((Number(item.product.price) || 0) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem.mutate(item.productId)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </PremiumGlassCard>
                </Transform3DCard>
              ))}
            </div>
            
            <div className="lg:sticky lg:top-24">
              <Transform3DCard>
                <PremiumGlassCard className="cart-summary">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500">
                        <ShoppingCart className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">Order Summary</h2>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-bold text-lg">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="text-sm">At checkout</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-sm">At checkout</span>
                      </div>

                      <div className="border-t-2 border-border pt-4 mt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-black">Total</span>
                          <span className="text-3xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ${subtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full h-14 text-lg font-bold"
                      onClick={() => checkout.mutate()}
                      disabled={checkout.isPending}
                    >
                      {checkout.isPending ? "Processing..." : "Proceed to Checkout"}
                    </Button>

                    <div className="mt-4 text-center">
                      <Button variant="link" asChild>
                        <a href="/marketplace" className="text-sm">
                          Continue Shopping
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </PremiumGlassCard>
              </Transform3DCard>
            </div>
          </div>
        )}
      </div>
      </div>
      </div>
    </div>
  );
}
