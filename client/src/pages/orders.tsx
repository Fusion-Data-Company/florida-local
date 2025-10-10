import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import EliteNavigationHeader from "@/components/elite-navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Calendar, ArrowRight, ShoppingBag, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";
import {
  AnimatedGradientHero,
  ParticleField,
  AuroraAmbient,
  PremiumLoader,
  HoverTrail,
  Transform3DCard,
} from "@/components/premium-ultra";
import { PremiumGlassCard, PremiumBadge } from "@/components/premium-ui";

interface Order {
  id: string;
  userId: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  shippingAmount: string;
  total: string;
  currency: string;
  shippingAddress: any;
  billingAddress: any;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Orders() {
  const { isAuthenticated } = useAuth();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    enabled: isAuthenticated,
  });

  const getStatusColor = (status: string): "topaz" | "sapphire" | "amethyst" | "emerald" | "crimson" | "pearl" => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'topaz';
      case 'processing':
        return 'sapphire';
      case 'shipped':
        return 'amethyst';
      case 'delivered':
        return 'emerald';
      case 'cancelled':
        return 'crimson';
      default:
        return 'pearl';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Payment pending';
      case 'processing':
        return 'Order being prepared';
      case 'shipped':
        return 'Order has been shipped';
      case 'delivered':
        return 'Order delivered';
      case 'cancelled':
        return 'Order cancelled';
      default:
        return status;
    }
  };

  if (!isAuthenticated) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture relative"
        data-surface-intensity="delicate"
        data-surface-tone="warm"
      >
        <AuroraAmbient intensity="low" />
        <EliteNavigationHeader />
        <div className="container mx-auto px-4 py-12 text-center relative z-10">
          <Transform3DCard>
            <PremiumGlassCard>
              <CardContent className="py-16">
                <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h1 className="text-3xl font-bold mb-4">Please log in to view your orders</h1>
                <p className="text-muted-foreground mb-6">Track your purchases and order history</p>
                <Button asChild size="lg">
                  <Link href="/api/login" data-testid="button-login">
                    Log In
                  </Link>
                </Button>
              </CardContent>
            </PremiumGlassCard>
          </Transform3DCard>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture flex items-center justify-center"
        data-surface-intensity="delicate"
        data-surface-tone="warm"
      >
        <PremiumLoader text="Loading your orders..." />
      </div>
    );
  }

  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen marble-texture relative"
      data-surface-intensity="delicate"
      data-surface-tone="warm"
    >
      {/* ULTRA PREMIUM EFFECTS */}
      <AuroraAmbient intensity="medium" />
      <HoverTrail />

      <EliteNavigationHeader />

      {/* ULTRA PREMIUM HERO */}
      <AnimatedGradientHero className="py-16">
        <ParticleField count={35} color="purple" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent" data-testid="text-orders-title">
                Your Orders
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Track and manage your order history
              </p>
            </div>
          </div>
          {orders.length > 0 && (
            <div className="flex items-center gap-3 mt-4">
              <PremiumBadge color="sapphire" size="md">
                {orders.length} Total Order{orders.length !== 1 ? 's' : ''}
              </PremiumBadge>
              <PremiumBadge color="emerald" size="sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                Active
              </PremiumBadge>
            </div>
          )}
        </div>
      </AnimatedGradientHero>

      <div className="container mx-auto px-4 py-8 lg:px-8">
        {orders.length === 0 ? (
          <Transform3DCard>
            <PremiumGlassCard className="orders-empty-state">
              <CardContent className="text-center py-16">
                <Package className="mx-auto h-20 w-20 text-muted-foreground opacity-50 mb-6" />
                <h2 className="text-3xl font-bold mb-4" data-testid="text-no-orders">
                  No orders yet
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  When you place your first order, it will appear here
                </p>
                <Button asChild size="lg">
                  <Link href="/marketplace" data-testid="link-marketplace">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Start Shopping
                  </Link>
                </Button>
              </CardContent>
            </PremiumGlassCard>
          </Transform3DCard>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Transform3DCard key={order.id}>
                <PremiumGlassCard className="order-card-luxury" data-testid={`order-card-${order.id}`}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2" data-testid={`text-order-id-${order.id}`}>
                          <Package className="h-5 w-5 text-purple-500" />
                          Order #{order.id.slice(-8).toUpperCase()}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground" data-testid={`text-order-date-${order.id}`}>
                            {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                      </div>
                      <PremiumBadge color={getStatusColor(order.status)} size="md" data-testid={`badge-order-status-${order.id}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </PremiumBadge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {getStatusDescription(order.status)}
                        </p>
                        <p className="text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent" data-testid={`text-order-total-${order.id}`}>
                          ${parseFloat(order.total).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.currency.toUpperCase()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                          <span className="text-sm">Subtotal</span>
                          <span className="font-semibold">${parseFloat(order.subtotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                          <span className="text-sm">Tax</span>
                          <span className="font-semibold">${parseFloat(order.taxAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                          <span className="text-sm">Shipping</span>
                          <span className="font-semibold">
                            {parseFloat(order.shippingAmount) === 0 ? (
                              <PremiumBadge color="emerald" size="sm">Free</PremiumBadge>
                            ) : (
                              `$${parseFloat(order.shippingAmount).toFixed(2)}`
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        {order.shippingAddress && (
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            <span>
                              Shipping to: {order.shippingAddress.city}, {order.shippingAddress.state}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="lg" asChild data-testid={`button-view-order-${order.id}`}>
                        <Link href={`/orders/${order.id}`}>
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </PremiumGlassCard>
              </Transform3DCard>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {orders.length > 0 && (
          <div className="mt-12">
            <Transform3DCard>
              <PremiumGlassCard className="orders-quick-actions">
                <CardContent className="text-center py-12">
                  <h3 className="text-2xl font-bold mb-2">Need help with an order?</h3>
                  <p className="text-muted-foreground mb-6">Our support team is here to assist you</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Button variant="outline" size="lg" asChild>
                      <Link href="/marketplace">
                        <ShoppingBag className="h-5 w-5 mr-2" />
                        Continue Shopping
                      </Link>
                    </Button>
                    <Button size="lg" asChild>
                      <Link href="/messages">
                        Contact Support
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </PremiumGlassCard>
            </Transform3DCard>
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}
