import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { type Business } from "@shared/types";
import EliteNavigationHeader from "@/components/elite-navigation-header";
import SpotlightShowcase from "@/components/spotlight-showcase";
import MarketplaceSection from "@/components/marketplace-section";
import SocialFeed from "@/components/social-feed";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Plus, ArrowRight, Star, Users, TrendingUp } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user businesses to check if they need onboarding
  const { data: userBusinesses = [] } = useQuery<Business[]>({
    queryKey: ['/api/businesses/my'],
    enabled: isAuthenticated,
  });

  const hasBusinesses = userBusinesses.length > 0;

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
      <EliteNavigationHeader />
      
      {/* Welcome Hero for Authenticated Users - ELITE LUXURY */}
      <section className="relative py-20 overflow-hidden hero-section">
        {/* Floating Gradient Orbs - Limited to 2 for performance */}
        <div className="absolute top-0 left-10 w-96 h-96 gradient-iridescent float-dynamic rounded-full opacity-[0.08] blur-3xl will-change-transform"></div>
        <div className="absolute bottom-0 right-10 w-80 h-80 gradient-iridescent float-gentle rounded-full opacity-[0.08] blur-3xl will-change-transform"></div>
        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          {!hasBusinesses ? (
            <>
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 gradient-text">
                Ready to Grow Your Business?
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
                Join Florida's premier business community. Connect with customers, showcase your products,
                and grow your local presence with our comprehensive platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button 
                  size="lg" 
                  onClick={() => setLocation('/create-business')}
                  data-testid="button-get-started-create-business"
                >
                  <Store className="h-5 w-5 mr-2" />
                  Get Started - Create Your Business
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setLocation('/marketplace')}
                  data-testid="button-explore-marketplace"
                >
                  Explore Marketplace
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {/* Benefits Section - ELITE LUXURY */}
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="relative backdrop-luxury transform-3d-float border-animated-gradient transition-all duration-300 benefit-card-1">
                  <CardContent className="relative z-10 p-6 text-center">
                    <Users className="h-12 w-12 text-primary mx-auto mb-4 gradient-metallic-gold filter-premium-depth p-3 rounded-full" />
                    <h3 className="font-semibold mb-2">Connect with Customers</h3>
                    <p className="text-sm text-muted-foreground">
                      Build relationships and grow your customer base in Florida's local community
                    </p>
                  </CardContent>
                </Card>
                <Card className="relative backdrop-luxury transform-3d-float border-animated-gradient transition-all duration-300 benefit-card-2">
                  <CardContent className="relative z-10 p-6 text-center">
                    <TrendingUp className="h-12 w-12 text-secondary mx-auto mb-4 gradient-metallic-gold filter-premium-depth p-3 rounded-full" />
                    <h3 className="font-semibold mb-2">Boost Your Sales</h3>
                    <p className="text-sm text-muted-foreground">
                      Showcase products, run promotions, and drive more revenue through our marketplace
                    </p>
                  </CardContent>
                </Card>
                <Card className="relative backdrop-luxury transform-3d-float border-animated-gradient transition-all duration-300 benefit-card-3">
                  <CardContent className="relative z-10 p-6 text-center">
                    <Star className="h-12 w-12 text-accent mx-auto mb-4 gradient-metallic-gold filter-premium-depth p-3 rounded-full" />
                    <h3 className="font-semibold mb-2">Build Your Brand</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a professional presence and get featured in our business spotlight
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 miami-gradient-text miami-heading">
                Welcome Back to Your Community
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8 miami-body-text">
                Stay connected with Florida's thriving business network. Discover new opportunities, 
                showcase your latest updates, and grow your local presence.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  onClick={() => setLocation(`/business/${userBusinesses[0].id}`)}
                  data-testid="button-view-my-business"
                >
                  <Store className="h-5 w-5 mr-2" />
                  View My Business
                </Button>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-all" data-testid="button-create-post">
                  <i className="fas fa-plus mr-2"></i>Create Post
                </button>
                <button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-3 rounded-lg font-semibold transition-all" data-testid="button-add-product">
                  <i className="fas fa-shopping-bag mr-2"></i>Add Product
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <SpotlightShowcase />
      <MarketplaceSection />
      <SocialFeed />
      <MobileBottomNav />
    </div>
  );
}
