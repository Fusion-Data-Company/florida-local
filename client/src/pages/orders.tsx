import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import NavigationHeader from "@/components/navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Calendar, ArrowRight, ShoppingBag } from "lucide-react";
import { format } from "date-fns";

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'processing':
        return 'bg-blue-500 text-white';
      case 'shipped':
        return 'bg-purple-500 text-white';
      case 'delivered':
        return 'bg-green-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
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
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-12 text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Please log in to view your orders</h1>
          <Button asChild>
            <Link href="/api/login" data-testid="button-login">
              Log In
            </Link>
          </Button>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2" data-testid="text-orders-title">
            Your Orders
          </h1>
          <p className="text-muted-foreground">
            Track and manage your order history
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-4" data-testid="text-no-orders">
              No orders yet
            </h2>
            <p className="text-muted-foreground mb-6">
              When you place your first order, it will appear here
            </p>
            <Button asChild>
              <Link href="/marketplace" data-testid="link-marketplace">
                Start Shopping
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow" data-testid={`order-card-${order.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-order-id-${order.id}`}>
                        Order #{order.id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground" data-testid={`text-order-date-${order.id}`}>
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(order.status)} data-testid={`badge-order-status-${order.id}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {getStatusDescription(order.status)}
                      </p>
                      <p className="font-semibold text-lg" data-testid={`text-order-total-${order.id}`}>
                        ${parseFloat(order.total).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {order.currency.toUpperCase()}
                      </p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Subtotal: ${parseFloat(order.subtotal).toFixed(2)}</p>
                        <p>Tax: ${parseFloat(order.taxAmount).toFixed(2)}</p>
                        <p>Shipping: {parseFloat(order.shippingAmount) === 0 ? 'Free' : `$${parseFloat(order.shippingAmount).toFixed(2)}`}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {order.shippingAddress && (
                        <p>
                          Shipping to: {order.shippingAddress.city}, {order.shippingAddress.state}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" asChild data-testid={`button-view-order-${order.id}`}>
                      <Link href={`/orders/${order.id}`}>
                        View Details
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold mb-4">Need help with an order?</h3>
          <div className="flex justify-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/marketplace">
                Continue Shopping
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/messages">
                Contact Support
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}