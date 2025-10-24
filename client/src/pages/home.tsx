import { useEffect } from "react";
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
  PremiumLoader,
  Transform3DCard,
  MicroIcon,
} from "@/components/premium-ultra";
import { PremiumButton, PremiumGlassCard } from "@/components/premium-ui";
import { LiquidGlassHeaderCard, GlassButton, GlassFilter } from "@/components/ui/liquid-glass";
import { AnimatedHikeCard, type Stat } from "@/components/ui/card-25";
import { Clock, MapPin, Heart, Sparkles } from "lucide-react";
import { HolographicCard } from "@/components/ui/holographic-card";
import { ParallaxProvider, Parallax } from 'react-scroll-parallax';
// import YouTubeBackground from '@/components/youtube-background'; // Commented out to allow WebGL background

// Import Florida Local business images
import elegantRestaurant1 from "@/assets/stock_images/elegant_restaurant_f_aa323e17.jpg";
import elegantRestaurant2 from "@/assets/stock_images/elegant_restaurant_f_cc520cc1.jpg";
import fineDiningFood from "@/assets/stock_images/fine_dining_food_pre_6c60b0bf.jpg";
import beachWedding1 from "@/assets/stock_images/beachwedding1.jpg";
import beachWedding2 from "@/assets/stock_images/beach_wedding_ceremo_313889d0.jpg";
import beachWedding3 from "@/assets/stock_images/beach_wedding_ceremo_59009157.jpg";
import luxurySpa1 from "@/assets/stock_images/luxury_spa_wellness__78221b18.jpg";
import luxurySpa2 from "@/assets/stock_images/luxury_wellness_spa__482737df.jpg";
import luxurySpa3 from "@/assets/stock_images/luxury_wellness_spa__8f194a3c.jpg";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Add class to body to indicate video background
  useEffect(() => {
    document.body.classList.add('has-video-bg');
    return () => document.body.classList.remove('has-video-bg');
  }, []);

  // Fetch user businesses for dynamic button behavior
  const { data: userBusinesses = [] } = useQuery<Business[]>({
    queryKey: ['/api/businesses/my'],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen flex items-center justify-center"
        data-surface-intensity="delicate"
      >
        <PremiumLoader text="Loading your experience..." />
      </div>
    );
  }

  return (
    <ParallaxProvider>
      <div
        className="min-h-screen relative"
        style={{
          position: 'relative',
          zIndex: 2,
          background: 'transparent',
          backgroundColor: 'transparent'
        }}
      >
      {/* Glass Filter for Liquid Glass Effect */}
      <GlassFilter />

      {/* VIDEO BACKGROUND - Night Cityscape */}
      {/* <YouTubeBackground youtubeUrl="https://youtu.be/Z8ioWqthS-o" overlayOpacity={0} /> */}

      {/* ULTRA PREMIUM EFFECTS */}
      {/* <AuroraAmbient intensity="medium" /> */}

      {/* SHADER ANIMATION HERO */}
      <div className="relative flex h-[650px] w-full flex-col items-center justify-center overflow-hidden" style={{ zIndex: 10 }}>
        <ShaderAnimation/>
        <span className="absolute pointer-events-none z-10 text-center text-7xl leading-none font-semibold tracking-tighter whitespace-pre-wrap text-white">
          {userBusinesses[0]?.name ? `Discover ${userBusinesses[0].name}` : (user ? `Welcome, ${user.firstName || user.email}` : 'Discover The Florida Local')}
        </span>
      </div>

      {/* Background for rest of page */}
      <div className="relative">
        {/* Removed dark overlay to show clear HD background */}
        {/* <div className="absolute inset-0 bg-gradient-to-br from-slate-900/75 via-slate-800/70 to-slate-900/75 backdrop-blur-sm" /> */}

      {/* FLORIDA LOCAL ULTRA-ELITE HERO */}
      <Parallax speed={-5}>
        <div className="relative py-24 overflow-hidden">
        {/* Full-width glass tint overlay - covers entire section edge-to-edge */}
        <div className="absolute inset-0 glass-section-overlay"></div>

        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          {/* Liquid Glass Welcome Card - HERO SIZE */}
          <div className="max-w-7xl mx-auto mb-16 entrance-fade-up">
            <LiquidGlassHeaderCard
              title="Welcome Back to Your Community"
              subtitle="Stay connected with Florida's thriving business network. Discover new opportunities, showcase your latest updates, and grow your local presence."
              size="hero"
              withDarkTint={false}
            />
          </div>

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

          {/* FLORIDA LOCAL BENEFITS CARDS - Futuristic Metallic Theme */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="card-entrance stagger-1">
              <HolographicCard className="holo-teal">
                <div className="holo-content text-center">
                  <div className="metallic-teal rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shine-sweep-hover">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}>
                    Connect with Customers
                  </h3>
                  <p className="text-sm text-white leading-relaxed font-medium" style={{ textShadow: '0 3px 6px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.6)' }}>
                    Build relationships and grow your customer base in Florida's local community
                  </p>
                </div>
              </HolographicCard>
            </div>

            <div className="card-entrance stagger-2">
              <HolographicCard className="holo-gold">
                <div className="holo-content text-center">
                  <div className="metallic-gold rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shine-sweep-hover">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}>
                    Boost Your Sales
                  </h3>
                  <p className="text-sm text-white leading-relaxed font-medium" style={{ textShadow: '0 3px 6px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.6)' }}>
                    Showcase products, run promotions, and drive more revenue through our marketplace
                  </p>
                </div>
              </HolographicCard>
            </div>

            <div className="card-entrance stagger-3">
              <HolographicCard className="holo-bronze">
                <div className="holo-content text-center">
                  <div className="metallic-bronze rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shine-sweep-hover">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}>
                    Build Your Brand
                  </h3>
                  <p className="text-sm text-white leading-relaxed font-medium" style={{ textShadow: '0 3px 6px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.6)' }}>
                    Create a professional presence and get featured in our business spotlight
                  </p>
                </div>
              </HolographicCard>
            </div>
          </div>
        </div>
        </div>
      </Parallax>

        {/* Featured Florida Businesses */}
        <Parallax speed={-8}>
          <section className="relative py-16">
          <div className="absolute inset-0 glass-section-overlay"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto mb-12 entrance-fade-up">
              <LiquidGlassHeaderCard
                title="Featured Local Businesses"
                subtitle="Discover exceptional businesses across Florida"
                withDarkTint={false}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              <AnimatedHikeCard
                title="Fine Dining"
                images={[elegantRestaurant1, elegantRestaurant2, fineDiningFood]}
                stats={[
                  { icon: <Clock className="h-4 w-4" />, label: "Open Daily" } as Stat,
                  { icon: <MapPin className="h-4 w-4" />, label: "Miami, FL" } as Stat,
                  { icon: <Star className="h-4 w-4" />, label: "Premium" } as Stat,
                ]}
                description="Experience Florida's finest dining with world-class cuisine and elegant atmosphere."
                href="/marketplace?category=dining"
              />

              <AnimatedHikeCard
                title="Beach Weddings"
                images={[beachWedding1, beachWedding2, beachWedding3]}
                stats={[
                  { icon: <Heart className="h-4 w-4" />, label: "Full Service" } as Stat,
                  { icon: <MapPin className="h-4 w-4" />, label: "Coastal FL" } as Stat,
                  { icon: <Users className="h-4 w-4" />, label: "50-200 Guests" } as Stat,
                ]}
                description="Create unforgettable memories with stunning beach wedding ceremonies."
                href="/marketplace?category=weddings"
              />

              <AnimatedHikeCard
                title="Luxury Spa & Wellness"
                images={[luxurySpa1, luxurySpa2, luxurySpa3]}
                stats={[
                  { icon: <Sparkles className="h-4 w-4" />, label: "Premium" } as Stat,
                  { icon: <Clock className="h-4 w-4" />, label: "7 Days/Week" } as Stat,
                  { icon: <Star className="h-4 w-4" />, label: "5-Star" } as Stat,
                ]}
                description="Rejuvenate your mind and body with luxury spa treatments and wellness programs."
                href="/marketplace?category=wellness"
              />
            </div>
          </div>
          </section>
        </Parallax>

        {/* Spotlight Voting Interface */}
        <Parallax speed={-12}>
          <section className="relative py-12">
          <div className="absolute inset-0 glass-tint-light"></div>
          <div className="container mx-auto px-4 relative z-10">
            <VotingInterface variant="homepage" limit={6} />
          </div>
          </section>
        </Parallax>

        {/* Trending Businesses */}
        <Parallax speed={-16}>
          <section className="relative py-12">
          <div className="absolute inset-0 backdrop-visible"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto mb-8 entrance-fade-up">
              <LiquidGlassHeaderCard
                title="Trending Now"
                subtitle="See what's hot in your community right now"
              />
            </div>
            <TrendingBusinesses limit={5} variant="compact" />
          </div>
          </section>
        </Parallax>

        <Parallax speed={-20}>
          <SpotlightShowcase />
        </Parallax>

        <Parallax speed={-24}>
          <MarketplaceSection />
        </Parallax>

        {/* Community Activity Section with White Overlay */}
        <Parallax speed={-28}>
          <section className="relative py-12">
          <div className="absolute inset-0 bg-white/90"></div>
          <div className="relative z-10">
            <SocialFeed />
          </div>
          </section>
        </Parallax>
      </div>

    </div>
    </ParallaxProvider>
  );
}
