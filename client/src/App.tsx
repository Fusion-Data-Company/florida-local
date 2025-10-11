import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WebSocketProvider } from "@/components/WebSocketProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
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
import FloridaLocalElite from "@/pages/florida-local-elite";
import Registry from "@/pages/registry";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public route - accessible to everyone */}
      <Route path="/florida-elite" component={FloridaLocalElite} />
      <Route path="/registry" component={Registry} />

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
      <ThemeProvider>
        <TooltipProvider>
          <WebSocketProvider>
            <Toaster />
            <Router />
          </WebSocketProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
