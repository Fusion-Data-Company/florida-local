import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type CartProduct = {
  id: string;
  name: string;
  price: string;
  images: string[] | null;
  isDigital: boolean | null;
  inventory: number | null;
  description?: string;
  category?: string;
};

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
};

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<CartItem[]>({
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

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {isLoading ? (
        <div>Loading cart...</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button asChild>
              <a href="/marketplace">Continue Shopping</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {item.product.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-muted rounded" />
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product.name}</h3>
                      <p className="text-muted-foreground">${item.product.price}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQty.mutate({ productId: item.productId, quantity: Math.max(1, item.quantity - 1) })}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQty.mutate({ productId: item.productId, quantity: parseInt(e.target.value) || 1 })}
                          className="w-16 text-center"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQty.mutate({ productId: item.productId, quantity: item.quantity + 1 })}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">${(parseFloat(item.product.price || "0") * item.quantity).toFixed(2)}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem.mutate(item.productId)}
                        className="text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-6" 
                  onClick={() => checkout.mutate()}
                  disabled={checkout.isPending}
                >
                  {checkout.isPending ? "Processing..." : "Proceed to Checkout"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}