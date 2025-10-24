import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
// STRIPE INTEGRATION PLACEHOLDER
// import { loadStripe } from "@stripe/stripe-js";
// import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { StardustButton } from "@/components/ui/stardust-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Lock, ShoppingBag, Shield, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { ApiCartItem } from "@/lib/types";
import {
  PremiumLoader,
  Transform3DCard,
} from "@/components/premium-ultra";
import { PremiumGlassCard, PremiumBadge } from "@/components/premium-ui";

// STRIPE INTEGRATION PLACEHOLDER
// Initialize Stripe here when integration is added
// const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
//   ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
//   : Promise.resolve(null);

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


// STRIPE INTEGRATION PLACEHOLDER - Payment form component
function CheckoutForm({ clientSecret, orderId }: { clientSecret: string; orderId: string }) {
  // const stripe = useStripe();
  // const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // STRIPE INTEGRATION PLACEHOLDER
    // Replace this with actual Stripe payment confirmation
    // const { error, paymentIntent } = await stripe.confirmPayment({...});
    
    // For now, simulate successful payment
    toast({
      title: "Payment Processing",
      description: "Stripe integration will be added here. Order placed successfully!",
    });
    setLocation(`/order-confirmation?order_id=${orderId}`);
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 entrance-fade-up">
      <div className="p-4 border rounded-lg glass-elevated mouse-spotlight">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5" />
          <h3 className="font-semibold">Payment Information</h3>
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        {/* STRIPE INTEGRATION PLACEHOLDER */}
        {/* <PaymentElement /> */}
        <div className="p-8 text-center bg-muted/50 rounded-lg border-2 border-dashed">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">Stripe Payment Integration</p>
          <p className="text-xs text-muted-foreground">Payment processing will be added here</p>
        </div>
      </div>

      <StardustButton
        type="submit"
        disabled={isProcessing}
        variant="gold"
        className="w-full shimmer-gold-hover"
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
      </StardustButton>
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
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        shippingAddress: data.shippingAddress,
        billingAddress: sameBillingAddress ? data.shippingAddress : data.billingAddress,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        notes: data.notes,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setOrderId(data.orderId);
      setClientSecret(data.clientSecret);
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
      <div
        className="premium-page-wrapper premium-surface min-h-screen relative"
        style={{
          backgroundImage: "url('/backgrounds/360_F_652778958_COkVj7I3ibeJHDY0fKzEuHj5ptec0AB3.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
        data-surface-intensity="delicate"
        data-surface-tone="cool"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-green-50/88 to-blue-50/88 backdrop-blur-md" />
        <div className="relative z-10">
        <div className="container mx-auto px-4 py-12 text-center relative z-10">
          <Transform3DCard className="entrance-scale-fade">
            <PremiumGlassCard className="ambient-glow-teal elevation-3">
              <CardContent className="py-16">
                <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h1 className="text-3xl font-bold mb-4">Please log in to checkout</h1>
                <p className="text-muted-foreground mb-6">Access your cart and complete your purchase</p>
                <Button size="lg" className="shimmer-gold-hover" onClick={() => window.location.href = '/api/login'} data-testid="button-login">
                  Log In
                </Button>
              </CardContent>
            </PremiumGlassCard>
          </Transform3DCard>
        </div>
        </div>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light flex items-center justify-center"
        data-surface-intensity="delicate"
        data-surface-tone="cool"
      >
        <PremiumLoader text="Loading checkout..." />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light relative"
        data-surface-intensity="delicate"
        data-surface-tone="cool"
      >
        <div className="container mx-auto px-4 py-12 text-center relative z-10">
          <Transform3DCard className="entrance-scale-fade">
            <PremiumGlassCard className="ambient-glow-purple elevation-3">
              <CardContent className="py-16">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
                <p className="text-muted-foreground mb-6">Add some items to your cart before checking out</p>
                <Button asChild size="lg" className="shimmer-gold-hover">
                  <Link href="/marketplace" data-testid="link-marketplace">
                    Browse Products
                  </Link>
                </Button>
              </CardContent>
            </PremiumGlassCard>
          </Transform3DCard>
        </div>
      </div>
    );
  }

  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen relative"
      style={{
        backgroundImage: "url('/backgrounds/360_F_652778958_COkVj7I3ibeJHDY0fKzEuHj5ptec0AB3.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
      data-surface-intensity="delicate"
      data-surface-tone="cool"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-green-50/88 to-blue-50/88 backdrop-blur-md" />

      <div className="relative z-10">

      {/* FLORIDA LOCAL CHECKOUT HERO */}
      <div className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--fl-teal-lagoon)]/10 via-background to-[var(--fl-sunset-gold)]/10" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <Button variant="ghost" asChild className="mb-4 hover:bg-white/10" data-testid="button-back-to-cart">
            <Link href="/cart">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[var(--fl-teal-lagoon)] to-[var(--fl-sunset-gold)] shadow-[0_8px_30px_rgba(0,139,139,0.25)]">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[var(--fl-teal-lagoon)] via-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] bg-clip-text text-transparent" data-testid="text-checkout-title">
              Secure Checkout
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <PremiumBadge color="emerald" size="sm">
              <Shield className="h-4 w-4 mr-1" />
              Secure Payment
            </PremiumBadge>
            <PremiumBadge color="topaz" size="sm">
              <Lock className="h-4 w-4 mr-1" />
              SSL Encrypted
            </PremiumBadge>
          </div>
        </div>
      </div>

      <div className="checkout-container container mx-auto px-4 py-8 lg:px-8">

        <div className="marble-content grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {!clientSecret ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Customer Information */}
                  <Transform3DCard>
                    <PremiumGlassCard className="checkout-form-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--fl-teal-lagoon)' }} />
                          Contact Information
                        </CardTitle>
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
                    </PremiumGlassCard>
                  </Transform3DCard>

                  {/* Shipping Address */}
                  <Transform3DCard>
                    <PremiumGlassCard className="checkout-form-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShoppingBag className="h-5 w-5" style={{ color: 'var(--fl-sunset-gold)' }} />
                          Shipping Address
                        </CardTitle>
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
                    </PremiumGlassCard>
                  </Transform3DCard>

                  {/* Order Notes */}
                  <Transform3DCard>
                    <PremiumGlassCard className="checkout-form-card">
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
                                  className="min-h-24"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </PremiumGlassCard>
                  </Transform3DCard>

                  <StardustButton
                    type="submit"
                    disabled={createPaymentIntentMutation.isPending}
                    variant="gold"
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
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Continue to Payment
                      </>
                    )}
                  </StardustButton>
                </form>
              </Form>
            ) : (
              <Transform3DCard>
                <PremiumGlassCard className="checkout-payment-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" style={{ color: 'var(--fl-teal-lagoon)' }} />
                      Complete Your Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* STRIPE INTEGRATION PLACEHOLDER */}
                    {/* <Elements stripe={stripePromise} options={{ clientSecret }}> */}
                      <CheckoutForm clientSecret={clientSecret} orderId={orderId} />
                    {/* </Elements> */}
                  </CardContent>
                </PremiumGlassCard>
              </Transform3DCard>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 h-fit">
            <Transform3DCard>
              <PremiumGlassCard className="checkout-summary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" style={{ color: 'var(--fl-sunset-gold)' }} />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-3 rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <p className="font-bold">{item.product.name}</p>
                        <PremiumBadge color="emerald" size="sm" className="mt-1">
                          Qty: {item.quantity}
                        </PremiumBadge>
                      </div>
                      <p className="font-black text-lg bg-gradient-to-r from-[var(--fl-teal-lagoon)] to-[var(--fl-sunset-gold)] bg-clip-text text-transparent">
                        ${(parseFloat(String(item.product.price)) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold" data-testid="text-checkout-subtotal">Calculating...</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="text-sm" data-testid="text-checkout-tax">Calculating...</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-sm" data-testid="text-checkout-shipping">
                      Calculating...
                    </span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center p-4 rounded-lg bg-gradient-to-r from-[var(--fl-teal-lagoon)]/10 to-[var(--fl-sunset-gold)]/10">
                    <span className="text-xl font-black">Total</span>
                    <span className="text-2xl font-black bg-gradient-to-r from-[var(--fl-teal-lagoon)] via-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] bg-clip-text text-transparent" data-testid="text-checkout-total">
                      Calculating...
                    </span>
                  </div>
                </div>
              </CardContent>
              </PremiumGlassCard>
            </Transform3DCard>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
