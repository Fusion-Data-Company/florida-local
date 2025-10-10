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
import {
  AnimatedGradientHero,
  ParticleField,
  AuroraAmbient,
  PremiumLoader,
  Transform3DCard,
  MicroIcon,
} from "@/components/premium-ultra";
import { PremiumButton, PremiumGlassCard } from "@/components/premium-ui";

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
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture flex items-center justify-center"
        data-surface-intensity="delicate"
      >
        <PremiumLoader text="Loading your experience..." />
      </div>
    );
  }

  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen marble-texture relative"
      data-surface-intensity="delicate"
      data-surface-tone="cool"
    >
      {/* ULTRA PREMIUM EFFECTS */}
      <AuroraAmbient intensity="medium" />

      <EliteNavigationHeader />

      {/* ULTRA PREMIUM HERO - ANIMATED GRADIENT */}
      <AnimatedGradientHero className="relative py-20 overflow-hidden">
        <ParticleField count={50} color="cyan" />
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

              {/* PREMIUM 3D BENEFITS CARDS */}
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <Transform3DCard>
                  <PremiumGlassCard className="group">
                    <CardContent className="p-8 text-center">
                      <MicroIcon color="rgba(6, 182, 212, 0.8)">
                        <Users className="h-14 w-14 text-cyan-500 mx-auto mb-6" />
                      </MicroIcon>
                      <h3 className="font-bold text-xl mb-3">Connect with Customers</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Build relationships and grow your customer base in Florida's local community
                      </p>
                    </CardContent>
                  </PremiumGlassCard>
                </Transform3DCard>

                <Transform3DCard>
                  <PremiumGlassCard className="group">
                    <CardContent className="p-8 text-center">
                      <MicroIcon color="rgba(251, 146, 60, 0.8)">
                        <TrendingUp className="h-14 w-14 text-orange-500 mx-auto mb-6" />
                      </MicroIcon>
                      <h3 className="font-bold text-xl mb-3">Boost Your Sales</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Showcase products, run promotions, and drive more revenue through our marketplace
                      </p>
                    </CardContent>
                  </PremiumGlassCard>
                </Transform3DCard>

                <Transform3DCard>
                  <PremiumGlassCard className="group">
                    <CardContent className="p-8 text-center">
                      <MicroIcon color="rgba(236, 72, 153, 0.8)">
                        <Star className="h-14 w-14 text-pink-500 mx-auto mb-6" />
                      </MicroIcon>
                      <h3 className="font-bold text-xl mb-3">Build Your Brand</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Create a professional presence and get featured in our business spotlight
                      </p>
                    </CardContent>
                  </PremiumGlassCard>
                </Transform3DCard>
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
      </AnimatedGradientHero>

      <SpotlightShowcase />
      <MarketplaceSection />
      <SocialFeed />
      <MobileBottomNav />
    </div>
  );
}
