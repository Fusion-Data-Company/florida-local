import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import BusinessProfile from "@/pages/business-profile";
import Marketplace from "@/pages/marketplace";
import Messages from "@/pages/messages";
import CreateBusiness from "@/pages/create-business";
import EditBusiness from "@/pages/edit-business";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderConfirmation from "@/pages/order-confirmation";
import Orders from "@/pages/orders";
import VendorProducts from "@/pages/vendor-products";
import VendorPayouts from "@/pages/vendor-payouts";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/create-business" component={CreateBusiness} />
          <Route path="/business/:id" component={BusinessProfile} />
          <Route path="/business/:id/edit" component={EditBusiness} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/messages" component={Messages} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/order-confirmation" component={OrderConfirmation} />
          <Route path="/orders" component={Orders} />
          <Route path="/vendor/products" component={VendorProducts} />
          <Route path="/vendor/payouts" component={VendorPayouts} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
