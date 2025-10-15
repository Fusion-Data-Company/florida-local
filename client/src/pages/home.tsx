import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { type Business } from "@shared/types";
import SpotlightShowcase from "@/components/spotlight-showcase";
import MarketplaceSection from "@/components/marketplace-section";
import VotingInterface from "@/components/spotlight/VotingInterface";
import TrendingBusinesses from "@/components/spotlight/TrendingBusinesses";
import SocialFeed from "@/components/social-feed";
import { Button } from "@/components/ui/button";
import { StardustButton } from "@/components/ui/stardust-button";
import { ShaderAnimation } from "@/components/ui/shader-animation";
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
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user businesses for dynamic button behavior
  const { data: userBusinesses = [] } = useQuery<Business[]>({
    queryKey: ['/api/businesses/my'],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light flex items-center justify-center"
        data-surface-intensity="delicate"
      >
        <PremiumLoader text="Loading your experience..." />
      </div>
    );
  }

  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen relative"
      data-surface-intensity="delicate"
      data-surface-tone="cool"
    >
      {/* ULTRA PREMIUM EFFECTS */}
      <AuroraAmbient intensity="medium" />

      {/* SHADER ANIMATION HERO */}
      <div className="relative flex h-[650px] w-full flex-col items-center justify-center overflow-hidden">
        <ShaderAnimation/>
        <span className="absolute pointer-events-none z-10 text-center text-7xl leading-none font-semibold tracking-tighter whitespace-pre-wrap text-white">
          {userBusinesses[0]?.name || (user?.username ? `Hello, ${user.username}` : 'Welcome to Florida Local')}
        </span>
      </div>

      {/* Background for rest of page */}
      <div
        className="relative"
        style={{
          backgroundImage: "url('/backgrounds/colorful-series-circles-with-orange-blue-colors_889056-245202.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/88 via-blue-50/85 to-orange-50/85 backdrop-blur-sm" />

      {/* FLORIDA LOCAL ULTRA-ELITE HERO */}
      <div className="relative py-24 overflow-hidden gradient-shift">
        {/* Teal-Gold Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--fl-teal-lagoon)]/10 via-background to-[var(--fl-sunset-gold)]/10" />

        {/* Particle Field with Teal-Gold Colors */}
        <ParticleField count={50} color="cyan" />

        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          {/* Florida Local Branded Headline */}
          <GlowHero
            glowText="Welcome Back to Your Community"
            glowTextSize="xl"
            className="mb-6 entrance-fade-up"
          />
          <p className="text-xl text-white max-w-3xl mx-auto leading-relaxed mb-8 entrance-fade-up stagger-1" style={{textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>
            Stay connected with Florida's thriving business network. Discover new opportunities,
            showcase your latest updates, and grow your local presence.
          </p>

          {/* Florida Local Branded Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <StardustButton
              variant="gold"
              size="lg"
              onClick={() => setLocation(userBusinesses[0]?.id ? `/business/${userBusinesses[0].id}` : '/create-business')}
              data-testid="button-view-my-business"
              className="entrance-scale-fade stagger-2 shimmer-gold-hover"
            >
              <Store className="h-5 w-5 mr-2" />
              {userBusinesses[0]?.id ? 'View My Business' : 'Create Your Business'}
            </StardustButton>
            <StardustButton
              variant="teal"
              size="lg"
              onClick={() => setLocation('/create-post')}
              data-testid="button-create-post"
              className="entrance-scale-fade stagger-3 shimmer-on-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </StardustButton>
          </div>

          {/* FLORIDA LOCAL BENEFITS CARDS - Teal-Gold-Bronze Theme */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Transform3DCard className="card-entrance stagger-1">
              <PremiumGlassCard className="group hover:shadow-[0_20px_45px_rgba(0,139,139,0.25)] transition-shadow duration-300 ambient-glow-teal">
                <CardContent className="p-8 text-center">
                  <MicroIcon color="rgba(0, 139, 139, 0.8)">
                    <Users className="h-14 w-14 mx-auto mb-6 text-[var(--fl-teal-lagoon)]" />
                  </MicroIcon>
                  <h3 className="font-bold text-xl mb-3 text-white" style={{textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>
                    Connect with Customers
                  </h3>
                  <p className="text-sm text-white leading-relaxed" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
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
                  <h3 className="font-bold text-xl mb-3 text-white" style={{textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>
                    Boost Your Sales
                  </h3>
                  <p className="text-sm text-white leading-relaxed" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
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
                  <h3 className="font-bold text-xl mb-3 text-white" style={{textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>
                    Build Your Brand
                  </h3>
                  <p className="text-sm text-white leading-relaxed" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
                    Create a professional presence and get featured in our business spotlight
                  </p>
                </CardContent>
              </PremiumGlassCard>
            </Transform3DCard>
          </div>
        </div>
      </div>

        {/* Spotlight Voting Interface */}
        <section className="py-12 container mx-auto px-4 relative z-10">
          <VotingInterface variant="homepage" limit={6} />
        </section>

        {/* Trending Businesses */}
        <section className="py-12 container mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold mb-8 text-center text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>
            Trending Now
          </h2>
          <TrendingBusinesses limit={5} variant="compact" />
        </section>

        <SpotlightShowcase />
        <MarketplaceSection />
        <SocialFeed />
      </div>

    </div>
  );
}
