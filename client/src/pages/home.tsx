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
import { StardustButton } from "@/components/ui/stardust-button";
import GlowHero from "@/components/ui/glow-hero";
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

      {/* FLORIDA LOCAL ULTRA-ELITE HERO */}
      <div className="relative py-24 overflow-hidden">
        {/* Teal-Gold Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--fl-teal-lagoon)]/10 via-background to-[var(--fl-sunset-gold)]/10" />
        
        {/* Particle Field with Teal-Gold Colors */}
        <ParticleField count={50} color="cyan" />
        
        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          {!hasBusinesses ? (
            <>
              {/* Florida Local Branded Headline */}
              <GlowHero 
                glowText="Ready to Grow Your Business?"
                glowTextSize="xl"
                className="mb-6"
              />
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
                Join Florida's premier business community. Connect with customers, showcase your products,
                and grow your local presence with our comprehensive platform.
              </p>
              
              {/* Florida Local Branded Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <StardustButton 
                  variant="gold"
                  size="lg" 
                  onClick={() => setLocation('/create-business')}
                  data-testid="button-get-started-create-business"
                >
                  <Store className="h-5 w-5 mr-2" />
                  Get Started - Create Your Business
                </StardustButton>
                <StardustButton 
                  variant="teal"
                  size="lg"
                  onClick={() => setLocation('/marketplace')}
                  data-testid="button-explore-marketplace"
                >
                  Explore Marketplace
                  <ArrowRight className="h-4 w-4 ml-2" />
                </StardustButton>
              </div>

              {/* FLORIDA LOCAL BENEFITS CARDS - Teal-Gold-Bronze Theme */}
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <Transform3DCard>
                  <PremiumGlassCard className="group hover:shadow-[0_20px_45px_rgba(0,139,139,0.25)] transition-shadow duration-300">
                    <CardContent className="p-8 text-center">
                      <MicroIcon color="rgba(0, 139, 139, 0.8)">
                        <Users className="h-14 w-14 mx-auto mb-6 text-[var(--fl-teal-lagoon)]" />
                      </MicroIcon>
                      <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-[var(--fl-teal-lagoon)] to-[var(--fl-teal-lagoon)]/70 bg-clip-text text-transparent">
                        Connect with Customers
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Build relationships and grow your customer base in Florida's local community
                      </p>
                    </CardContent>
                  </PremiumGlassCard>
                </Transform3DCard>

                <Transform3DCard>
                  <PremiumGlassCard className="group hover:shadow-[0_20px_45px_rgba(212,175,55,0.25)] transition-shadow duration-300">
                    <CardContent className="p-8 text-center">
                      <MicroIcon color="rgba(212, 175, 55, 0.8)">
                        <TrendingUp className="h-14 w-14 mx-auto mb-6 text-[var(--fl-sunset-gold)]" />
                      </MicroIcon>
                      <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-[var(--fl-sunset-gold)] to-[var(--fl-sunset-gold)]/70 bg-clip-text text-transparent">
                        Boost Your Sales
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Showcase products, run promotions, and drive more revenue through our marketplace
                      </p>
                    </CardContent>
                  </PremiumGlassCard>
                </Transform3DCard>

                <Transform3DCard>
                  <PremiumGlassCard className="group hover:shadow-[0_20px_45px_rgba(205,127,50,0.25)] transition-shadow duration-300">
                    <CardContent className="p-8 text-center">
                      <MicroIcon color="rgba(205, 127, 50, 0.8)">
                        <Star className="h-14 w-14 mx-auto mb-6 text-[var(--fl-bronze)]" />
                      </MicroIcon>
                      <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-[var(--fl-bronze)] to-[var(--fl-bronze)]/70 bg-clip-text text-transparent">
                        Build Your Brand
                      </h3>
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
              <GlowHero 
                glowText="Welcome Back to Your Community"
                glowTextSize="lg"
                className="mb-6"
              />
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
                Stay connected with Florida's thriving business network. Discover new opportunities, 
                showcase your latest updates, and grow your local presence.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="fl-gold"
                  size="lg"
                  onClick={() => setLocation(`/business/${userBusinesses[0].id}`)}
                  data-testid="button-view-my-business"
                  className="shadow-[0_8px_30px_rgba(212,175,55,0.2)] hover:shadow-[0_12px_40px_rgba(212,175,55,0.35)] transition-shadow"
                >
                  <Store className="h-5 w-5 mr-2" />
                  View My Business
                </Button>
                <Button 
                  variant="fl-teal"
                  size="lg"
                  data-testid="button-create-post"
                  className="shadow-[0_8px_30px_rgba(0,139,139,0.2)] hover:shadow-[0_12px_40px_rgba(0,139,139,0.35)] transition-shadow"
                >
                  <i className="fas fa-plus mr-2"></i>Create Post
                </Button>
                <Button 
                  variant="fl-outline"
                  size="lg"
                  data-testid="button-add-product"
                  className="shadow-[0_8px_30px_rgba(205,127,50,0.15)] hover:shadow-[0_12px_40px_rgba(205,127,50,0.25)] transition-shadow"
                >
                  <i className="fas fa-shopping-bag mr-2"></i>Add Product
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <SpotlightShowcase />
      <MarketplaceSection />
      <SocialFeed />
      <MobileBottomNav />
    </div>
  );
}
