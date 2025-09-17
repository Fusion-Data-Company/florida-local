import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import NavigationHeader from "@/components/navigation-header";
import SpotlightShowcase from "@/components/spotlight-showcase";
import MarketplaceSection from "@/components/marketplace-section";
import SocialFeed from "@/components/social-feed";
import MobileBottomNav from "@/components/mobile-bottom-nav";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      {/* Welcome Hero for Authenticated Users */}
      <section className="relative py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 gradient-text">
            Welcome Back to Your Community
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            Stay connected with Florida's thriving business network. Discover new opportunities, 
            showcase your latest updates, and grow your local presence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-all" data-testid="button-create-post">
              <i className="fas fa-plus mr-2"></i>Create Post
            </button>
            <button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-3 rounded-lg font-semibold transition-all" data-testid="button-add-product">
              <i className="fas fa-shopping-bag mr-2"></i>Add Product
            </button>
          </div>
        </div>
      </section>

      <SpotlightShowcase />
      <MarketplaceSection />
      <SocialFeed />
      <MobileBottomNav />
    </div>
  );
}
