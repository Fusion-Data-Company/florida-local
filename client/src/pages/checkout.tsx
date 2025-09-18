import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import NavigationHeader from "@/components/navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Lock } from "lucide-react";
import { Link } from "wouter";
import { ApiCartItem } from "@/lib/types";

// Initialize Stripe - from the blueprint integration
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const checkoutSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1, "Full name is required"),
    addressLine1: z.string().min(1, "Address is required"),
    addressLine2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(5, "ZIP code must be at least 5 characters"),
    country: z.string().default("US"),
  }),
  billingAddress: z.object({
    fullName: z.string().min(1, "Full name is required"),
    addressLine1: z.string().min(1, "Address is required"),
    addressLine2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(5, "ZIP code must be at least 5 characters"),
    country: z.string().default("US"),
  }),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  sameBillingAddress: z.boolean().default(true),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;


function CheckoutForm({ clientSecret, orderId }: { clientSecret: string; orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (paymentIntent?.status === "succeeded") {
      toast({
        title: "Payment Successful",
        description: "Your order has been confirmed!",
      });
      setLocation(`/order-confirmation?payment_intent=${paymentIntent.id}&order_id=${orderId}`);
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5" />
          <h3 className="font-semibold">Payment Information</h3>
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <PaymentElement />
      </div>
      
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
        data-testid="button-complete-payment"
      >
        {isProcessing ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Processing Payment...
          </>
        ) : (
          "Complete Payment"
        )}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState("");

  const { data: cartItems = [], isLoading: cartLoading } = useQuery<ApiCartItem[]>({
    queryKey: ['/api/cart'],
    enabled: isAuthenticated,
  });

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerEmail: user?.email || "",
      sameBillingAddress: true,
      shippingAddress: {
        country: "US",
      },
      billingAddress: {
        country: "US",
      },
    },
  });

  const sameBillingAddress = form.watch("sameBillingAddress");

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (data: CheckoutForm) => {
      return await apiRequest('POST', '/api/create-payment-intent', {
        shippingAddress: data.shippingAddress,
        billingAddress: sameBillingAddress ? data.shippingAddress : data.billingAddress,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        notes: data.notes,
      });
    },
    onSuccess: (response) => {
      setOrderId(response.orderId);
      setClientSecret(response.clientSecret);
      toast({
        title: "Ready to Pay",
        description: "Payment form loaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CheckoutForm) => {
    createPaymentIntentMutation.mutate(data);
  };

  // Remove client-side calculations - server handles all pricing calculations for security

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to checkout</h1>
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

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4">Loading checkout...</p>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some items to your cart before checking out</p>
          <Button asChild>
            <Link href="/marketplace" data-testid="link-marketplace">
              Browse Products
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
          <Button variant="ghost" asChild className="mb-4" data-testid="button-back-to-cart">
            <Link href="/cart">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Link>
          </Button>
          <h1 className="text-3xl font-serif font-bold" data-testid="text-checkout-title">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {!clientSecret ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Customer Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="john@example.com" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Shipping Address */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="shippingAddress.fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} data-testid="input-shipping-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shippingAddress.addressLine1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St" {...field} data-testid="input-shipping-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shippingAddress.addressLine2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apartment, suite, etc. (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Apt 4B" {...field} data-testid="input-shipping-address2" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="shippingAddress.city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="Miami" {...field} data-testid="input-shipping-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="shippingAddress.state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="FL" {...field} data-testid="input-shipping-state" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="shippingAddress.zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input placeholder="33101" {...field} data-testid="input-shipping-zip" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Notes (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                placeholder="Special delivery instructions, gift message, etc." 
                                {...field}
                                data-testid="textarea-notes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Button
                    type="submit"
                    disabled={createPaymentIntentMutation.isPending}
                    className="w-full"
                    size="lg"
                    data-testid="button-create-order"
                  >
                    {createPaymentIntentMutation.isPending ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Creating Order...
                      </>
                    ) : (
                      "Continue to Payment"
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Complete Your Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm clientSecret={clientSecret} orderId={orderId} />
                  </Elements>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">
                        ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span data-testid="text-checkout-subtotal">Calculating...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span data-testid="text-checkout-tax">Calculating...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span data-testid="text-checkout-shipping">
                      Calculating...
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span data-testid="text-checkout-total">Calculating...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}