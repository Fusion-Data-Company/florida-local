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
import AIContentGenerator from "@/pages/ai-content-generator";
import AIAgentsPage from "@/pages/ai-agents";
import AIToolsPage from "@/pages/ai-tools";
import GMBHub from "@/pages/gmb-hub";
import SpotlightVoting from "@/pages/spotlight-voting";
import Community from "@/pages/community";
import Loyalty from "@/pages/loyalty";
import AdminAnalytics from "@/pages/admin-analytics";
import BusinessAnalytics from "@/pages/business-analytics";
import AdminDashboard from "@/pages/admin-dashboard";
import BusinessDashboard from "@/pages/business-dashboard";
import SubscriptionPage from "@/pages/subscription";

// Marketing Pages
import MarketingHub from "@/pages/marketing-hub";
import SocialMediaHub from "@/pages/social-media-hub";

// Entrepreneur Pages
import EntrepreneurProfile from "@/pages/entrepreneur-profile";

// Marketing Components
import { WorkflowBuilder } from "@/components/marketing/WorkflowBuilder";
import { LeadFormBuilder } from "@/components/marketing/LeadFormBuilder";

// Blog Components - These exist but were never routed!
import BlogEditor from "@/components/blog-editor";
import BlogPostManagement from "@/components/blog-post-management";
import BlogDiscovery from "@/components/blog-discovery";
import BlogEngagement from "@/components/blog-engagement";
import BlogAnalyticsDashboard from "@/components/blog-analytics-dashboard";

// Admin Components
import SystemMonitoring from "@/pages/admin/system-monitoring";

// AI Components
import AIBusinessCoachWidget from "@/components/ai-business-coach-widget";
import EliteNavigationHeader from "@/components/elite-navigation-header";
import LuxuryFooter from "@/components/luxury-footer";
import MobileBottomNav from "@/components/mobile-bottom-nav";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes - accessible to everyone */}
      <Route path="/florida-elite" component={FloridaLocalElite} />
      <Route path="/florida-local" component={FloridaLocalElite} />
      <Route path="/registry" component={Registry} />
      <Route path="/subscription" component={SubscriptionPage} />

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
          <Route path="/ai/content-generator" component={AIContentGenerator} />
          <Route path="/ai/agents" component={AIAgentsPage} />
          <Route path="/ai/tools" component={AIToolsPage} />
          <Route path="/integrations/gmb" component={GMBHub} />
          <Route path="/spotlight/voting" component={SpotlightVoting} />
          <Route path="/community" component={Community} />
          <Route path="/loyalty" component={Loyalty} />

          {/* Admin Routes */}
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/analytics" component={AdminAnalytics} />
          <Route path="/admin/monitoring" component={SystemMonitoring} />

          {/* Business Dashboard Routes */}
          <Route path="/business-dashboard" component={BusinessDashboard} />
          <Route path="/business-analytics" component={BusinessAnalytics} />

          {/* Marketing Hub Routes - NOW CONNECTED! */}
          <Route path="/marketing" component={MarketingHub} />
          <Route path="/marketing/workflows" component={WorkflowBuilder} />
          <Route path="/marketing/forms" component={LeadFormBuilder} />

          {/* Social Media Hub */}
          <Route path="/social-hub" component={SocialMediaHub} />

          {/* Entrepreneur Platform */}
          <Route path="/entrepreneur/:id" component={EntrepreneurProfile} />

          {/* Blog Platform Routes - NOW CONNECTED! */}
          <Route path="/blog" component={BlogDiscovery} />
          <Route path="/blog/write" component={BlogEditor} />
          <Route path="/blog/manage" component={BlogPostManagement} />
          <Route path="/blog/engagement" component={BlogEngagement} />
          <Route path="/blog/analytics" component={BlogAnalyticsDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Toaster />
      {isAuthenticated && <AIBusinessCoachWidget />}
      <div
        className="premium-page-wrapper premium-surface min-h-screen relative"
        style={{
          backgroundImage: "url('/backgrounds/abstract-composition-with-intertwined-orange-blue-curves-wave-aig51_31965-634212.avif')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="relative z-10">
          <EliteNavigationHeader />
          <Router />
          <MobileBottomNav />
        </div>
      </div>
      <LuxuryFooter />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WebSocketProvider>
            <AppContent />
          </WebSocketProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
