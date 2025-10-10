import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ApiCartItem } from "@/lib/types";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import EliteNavigationHeader from "@/components/elite-navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import {
  AnimatedGradientHero,
  ParticleField,
  AuroraAmbient,
  PremiumLoader,
  HoverTrail,
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

  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.product.price || "0") * i.quantity, 0);

  if (isLoading) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen bg-background flex items-center justify-center"
        data-surface-intensity="delicate"
        data-surface-tone="warm"
      >
        <PremiumLoader text="Loading your cart..." />
      </div>
    );
  }

  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen bg-background relative"
      data-surface-intensity="delicate"
      data-surface-tone="warm"
    >
      {/* ULTRA PREMIUM EFFECTS */}
      <AuroraAmbient intensity="low" />
      <HoverTrail />

      <EliteNavigationHeader />

      {/* ULTRA PREMIUM HERO */}
      <AnimatedGradientHero className="py-12">
        <ParticleField count={30} color="purple" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                Shopping Cart
              </h1>
            </div>
            {items.length > 0 && (
              <PremiumBadge color="sapphire" size="md">
                {items.length} {items.length === 1 ? 'Item' : 'Items'}
              </PremiumBadge>
            )}
          </div>
        </div>
      </AnimatedGradientHero>

      <div className="cart-container container mx-auto px-4 lg:px-8 py-10">
        <div className="marble-content">
        {items.length === 0 ? (
          <Transform3DCard>
            <PremiumGlassCard className="cart-empty-state">
              <CardContent className="text-center py-16">
                <div className="mb-6">
                  <ShoppingCart className="h-20 w-20 mx-auto text-muted-foreground opacity-50" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">Start shopping to add items to your cart</p>
                <Button asChild size="lg">
                  <a href="/marketplace">Continue Shopping</a>
                </Button>
              </CardContent>
            </PremiumGlassCard>
          </Transform3DCard>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Transform3DCard key={item.id}>
                  <PremiumGlassCard className="cart-item-card">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        {Array.isArray(item.product.images) && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
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
                              ${(parseFloat(item.product.price || "0") * item.quantity).toFixed(2)}
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

      <MobileBottomNav />
    </div>
  );
}
