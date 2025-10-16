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
import { LiquidGlassHeaderCard, GlassButton, GlassFilter } from "@/components/ui/liquid-glass";
import { AnimatedHikeCard, type Stat } from "@/components/ui/card-25";
import { Clock, MapPin, Heart, Sparkles } from "lucide-react";

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
      {/* Glass Filter for Liquid Glass Effect */}
      <GlassFilter />

      {/* ULTRA PREMIUM EFFECTS */}
      {/* <AuroraAmbient intensity="medium" /> */}

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
        {/* Removed dark overlay to show clear HD background */}
        {/* <div className="absolute inset-0 bg-gradient-to-br from-slate-900/75 via-slate-800/70 to-slate-900/75 backdrop-blur-sm" /> */}

      {/* FLORIDA LOCAL ULTRA-ELITE HERO */}
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
            <Transform3DCard className="card-entrance stagger-1 apple-hover-depth">
              <Card className="glass-card-futuristic group transition-all duration-300 overflow-hidden metallic-border-animated border-2 border-transparent hover:border-[rgba(0,139,139,0.4)]">
                <CardContent className="p-6 text-center card-tight-layout">
                  <div className="metallic-teal rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shine-sweep-hover">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">
                    Connect with Customers
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Build relationships and grow your customer base in Florida's local community
                  </p>
                </CardContent>
              </Card>
            </Transform3DCard>

            <Transform3DCard className="apple-hover-depth">
              <Card className="glass-card-futuristic group transition-all duration-300 overflow-hidden metallic-border-animated border-2 border-transparent hover:border-[rgba(212,175,55,0.4)]">
                <CardContent className="p-6 text-center card-tight-layout">
                  <div className="metallic-gold rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shine-sweep-hover">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">
                    Boost Your Sales
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Showcase products, run promotions, and drive more revenue through our marketplace
                  </p>
                </CardContent>
              </Card>
            </Transform3DCard>

            <Transform3DCard className="apple-hover-depth">
              <Card className="glass-card-futuristic group transition-all duration-300 overflow-hidden metallic-border-animated border-2 border-transparent hover:border-[rgba(205,127,50,0.4)]">
                <CardContent className="p-6 text-center card-tight-layout">
                  <div className="metallic-bronze rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shine-sweep-hover">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">
                    Build Your Brand
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Create a professional presence and get featured in our business spotlight
                  </p>
                </CardContent>
              </Card>
            </Transform3DCard>
          </div>
        </div>
      </div>

        {/* Featured Florida Businesses */}
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

        {/* Spotlight Voting Interface */}
        <section className="relative py-12">
          <div className="absolute inset-0 glass-tint-light"></div>
          <div className="container mx-auto px-4 relative z-10">
            <VotingInterface variant="homepage" limit={6} />
          </div>
        </section>

        {/* Trending Businesses */}
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

        <SpotlightShowcase />
        <MarketplaceSection />

        {/* Community Activity Section with White Overlay */}
        <section className="relative py-12">
          <div className="absolute inset-0 bg-white/90"></div>
          <div className="relative z-10">
            <SocialFeed />
          </div>
        </section>
      </div>

    </div>
  );
}
