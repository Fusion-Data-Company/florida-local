import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import GlowHero from "@/components/ui/glow-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, ArrowRight, Home } from "lucide-react";

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
  orderItems: Array<{
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    productPrice: string;
    quantity: number;
    totalPrice: string;
    createdAt: string;
    product: {
      id: string;
      businessId: string;
      name: string;
      description: string;
      price: string;
      originalPrice?: string;
      category: string;
      images?: string[];
      inventory: number;
      isActive: boolean;
      isDigital: boolean;
      tags?: string[];
      rating: string;
      reviewCount: number;
      createdAt: string;
      updatedAt: string;
    };
  }>;
}

export default function OrderConfirmation() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get payment intent ID and order ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const paymentIntentId = urlParams.get('payment_intent');
  const orderId = urlParams.get('orderId') || urlParams.get('order_id');

  const completeOrderMutation = useMutation({
    mutationFn: async (data: { orderId: string; paymentIntentId: string }) => {
      const res = await apiRequest('POST', `/api/orders/${data.orderId}/complete`, {
        paymentIntentId: data.paymentIntentId,
      });
      return await res.json();
    },
    onSuccess: (response) => {
      setOrder(response.order);
      setIsLoading(false);
    },
    onError: (error: any) => {
      console.error('Order completion error:', error);
      setIsLoading(false);
      // Stay on page but show error - don't redirect automatically
      // User can manually go back to cart if needed
    },
  });

  useEffect(() => {
    if (!orderId) {
      console.error('Missing order ID in URL');
      setIsLoading(false);
      return;
    }

    if (paymentIntentId) {
      // Complete the order with the payment intent (Stripe flow)
      completeOrderMutation.mutate({ 
        orderId: orderId, 
        paymentIntentId: paymentIntentId 
      });
    } else {
      // Manual checkout flow - just fetch the order
      fetchOrder();
    }
  }, [paymentIntentId, orderId]);

  const fetchOrder = async () => {
    try {
      const res = await apiRequest('GET', `/api/orders/${orderId}`);
      const orderData = await res.json();
      setOrder(orderData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching order:', error);
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light"
        data-surface-intensity="delicate"
        data-surface-tone="warm"
      >
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view order confirmation</h1>
          <Button onClick={() => window.location.href = '/api/login'} data-testid="button-login">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light"
        data-surface-intensity="delicate"
        data-surface-tone="warm"
      >
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Confirming your order...</h2>
          <p className="text-muted-foreground mt-2">Please wait while we process your payment</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light"
      data-surface-intensity="delicate"
      data-surface-tone="warm"
    >

      <div className="container mx-auto px-4 py-8 lg:px-8">
        {/* Success Header */}
        <div className="confirmation-success-header relative text-center mb-8 p-8 rounded-2xl">
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-4">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <GlowHero 
              glowText="Order Confirmed!"
              glowTextSize="md"
              className="mb-2"
              data-testid="text-order-success"
            />
            <p className="text-lg text-muted-foreground">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
            {order && (
              <div className="mt-4">
                <Badge variant="secondary" className="text-sm">
                  Order #{order.id.slice(-8).toUpperCase()}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Next Steps */}
            <Card className="confirmation-card relative">
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  What happens next?
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">Order Processing</h4>
                    <p className="text-sm text-muted-foreground">
                      We're preparing your order and will send you a confirmation email shortly.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-muted text-muted-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">Shipping</h4>
                    <p className="text-sm text-muted-foreground">
                      Your items will be shipped within 2-3 business days. You'll receive tracking information via email.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-muted text-muted-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Delivery</h4>
                    <p className="text-sm text-muted-foreground">
                      Estimated delivery: 5-7 business days for standard shipping.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items (if available) */}
            {order && (
              <Card className="confirmation-card relative">
                <CardHeader className="relative z-10">
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex gap-4" data-testid={`order-item-${item.productId}`}>
                        <div 
                          className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-orange-500 flex-shrink-0"
                          data-testid={`img-order-product-${item.productId}`}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold" data-testid={`text-order-product-name-${item.productId}`}>
                            {item.productName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${parseFloat(item.productPrice).toFixed(2)} each
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold" data-testid={`text-order-item-total-${item.productId}`}>
                            ${parseFloat(item.totalPrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Information */}
            {order && (
              <Card className="confirmation-card relative">
                <CardHeader className="relative z-10">
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-2">
                    <p><strong>Email:</strong> {order.customerEmail}</p>
                    {order.customerPhone && (
                      <p><strong>Phone:</strong> {order.customerPhone}</p>
                    )}
                    {order.shippingAddress && (
                      <div>
                        <p><strong>Shipping Address:</strong></p>
                        <div className="ml-4 text-sm text-muted-foreground">
                          <p>{order.shippingAddress.fullName}</p>
                          <p>{order.shippingAddress.addressLine1}</p>
                          {order.shippingAddress.addressLine2 && (
                            <p>{order.shippingAddress.addressLine2}</p>
                          )}
                          <p>
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="order-summary-card relative sticky top-4">
              <CardHeader className="relative z-10">
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                {order ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span data-testid="text-order-subtotal">${parseFloat(order.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span data-testid="text-order-tax">${parseFloat(order.taxAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span data-testid="text-order-shipping">
                        {parseFloat(order.shippingAmount) === 0 ? 'Free' : `$${parseFloat(order.shippingAmount).toFixed(2)}`}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span data-testid="text-order-total">${parseFloat(order.total).toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Paid via credit card
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Order Total</span>
                      <span className="font-semibold">Payment Confirmed</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your payment has been successfully processed. You'll receive an email confirmation shortly.
                    </p>
                  </div>
                )}

                <div className="space-y-3 mt-6">
                  <Button asChild className="w-full" data-testid="button-continue-shopping">
                    <Link href="/marketplace">
                      Continue Shopping
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full" data-testid="button-view-orders">
                    <Link href="/orders">
                      View Order History
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="w-full" data-testid="button-home">
                    <Link href="/">
                      <Home className="mr-2 h-4 w-4" />
                      Back to Home
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
