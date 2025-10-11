import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Facebook, Instagram, Youtube, Twitter, MapPin,
  Star, Phone, Calendar, ChevronLeft, ChevronRight,
  Heart, Bookmark, Play, Sparkles
} from "lucide-react";
import EliteNavigationHeader from "@/components/elite-navigation-header";
import LuxuryFooter from "@/components/luxury-footer";
import {
  AnimatedGradientHero,
  ParticleField,
  AuroraAmbient,
  HoverTrail,
} from "@/components/premium-ultra";
import GlowHero from "@/components/ui/glow-hero";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import VaporizeTextCycle, { Tag } from "@/components/ui/vapour-text-effect";

// Premium Metallic Badge Component
const MetallicBadge = ({ children, color = "gold", className = "" }: { children: React.ReactNode; color?: "gold" | "platinum" | "bronze" | "emerald" | "ruby"; className?: string }) => {
  const colorStyles = {
    gold: {
      background: 'linear-gradient(135deg, #f6d365 0%, #fda085 50%, #f093fb 100%)',
      shadow: '0 4px 20px rgba(246, 211, 101, 0.5), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.2)',
    },
    platinum: {
      background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
      shadow: '0 4px 20px rgba(192, 210, 254, 0.5), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.15)',
    },
    bronze: {
      background: 'linear-gradient(135deg, #cd7f32 0%, #e89b5c 50%, #fbb574 100%)',
      shadow: '0 4px 20px rgba(205, 127, 50, 0.5), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.25)',
    },
    emerald: {
      background: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)',
      shadow: '0 4px 20px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.2)',
    },
    ruby: {
      background: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #fda4af 100%)',
      shadow: '0 4px 20px rgba(244, 63, 94, 0.5), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.2)',
    },
  };

  const style = colorStyles[color];

  return (
    <div
      className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl overflow-hidden font-bold uppercase tracking-wide text-white transform hover:scale-105 transition-all duration-300 ${className}`}
      style={{
        background: style.background,
        boxShadow: style.shadow,
      }}
    >
      {/* Animated shimmer overlay */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.9) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s linear infinite',
        }}
      ></div>
      {/* Glass-face effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
        }}
      ></div>
      <Sparkles className="h-4 w-4 relative z-10" />
      <span className="relative z-10 drop-shadow-md text-sm">{children}</span>
    </div>
  );
};

export default function FloridaLocalElite() {
  const [activeTab, setActiveTab] = useState("restaurants");

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* ULTRA PREMIUM EFFECTS */}
      <AuroraAmbient intensity="medium" />
      <HoverTrail />

      {/* CONTENT WRAPPER - Above all effects - PROPER Z-INDEX */}
      <div className="relative" style={{ zIndex: 10 }}>
      {/* 1. SITE HEADER / NAVIGATION */}
      <EliteNavigationHeader />

      {/* 2. NEW HERO SECTION WITH VIDEO BACKGROUND */}
      <section className="relative overflow-hidden min-h-[600px] md:min-h-[700px] lg:min-h-[800px]">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            src="/attached_assets/17853291-uhd_3840_2160_30fps_1760213055083.mp4"
          />
          {/* Video overlay for better text readability */}
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Content Overlay - Absolutely positioned on video */}
        <div className="relative z-10 min-h-[600px] md:min-h-[700px] lg:min-h-[800px]">
          {/* LOGO WITH SUBTLE GLOW - FORCED TO LEFT EDGE */}
          <div className="absolute bottom-32 md:bottom-40 lg:bottom-48 left-0 -ml-16 md:-ml-24 lg:-ml-32" style={{ transform: 'translateX(-120px)' }}>
            <img
              src="/attached_assets/me_1760215801481.png"
              alt="The Florida Local"
              className="w-[500px] md:w-[800px] lg:w-[1000px] h-auto transition-all duration-500 animate-float logo-subtle-glow"
              data-testid="img-hero-logo"
            />
          </div>

          {/* ULTRA ELEGANT TAGLINE WITH STYLED CAPITALS - CENTERED ACROSS BOTTOM */}
          <div className="absolute bottom-12 md:bottom-16 lg:bottom-20 left-0 right-0 w-full px-4">
            <p className="text-center text-4xl md:text-5xl lg:text-6xl leading-relaxed tracking-wide whitespace-nowrap" data-testid="text-hero-tagline">
              <span className="inline-block relative">
                <span className="text-white/90 drop-shadow-lg">Life's is </span>
                <span 
                  className="font-bold tracking-wider drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] gold-underline"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #fcd34d 50%, #fbbf24 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 30px rgba(251,191,36,0.5)',
                  }}
                >
                  BETTER
                </span>
                <span className="text-white/90 drop-shadow-lg"> when you're </span>
                <span 
                  className="font-bold tracking-wider drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] gold-underline"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #fcd34d 50%, #fbbf24 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 30px rgba(251,191,36,0.5)',
                  }}
                >
                  LIVING
                </span>
                <span className="text-white/90 drop-shadow-lg"> </span>
                <span 
                  className="font-bold tracking-wider drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] gold-underline"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #fcd34d 50%, #fbbf24 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 30px rgba(251,191,36,0.5)',
                  }}
                >
                  LIKE
                </span>
                <span className="text-white/90 drop-shadow-lg"> a </span>
                <span 
                  className="font-bold tracking-wider drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] gold-underline"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #fcd34d 50%, #fbbf24 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 30px rgba(251,191,36,0.5)',
                  }}
                >
                  LOCAL
                </span>
                <span className="text-white/90 drop-shadow-lg">.</span>
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* 2.5 SCROLLING BRAND BAR */}
      <section className="bg-background pb-2">
        <div className="group relative m-auto max-w-7xl px-6">
          <div className="flex flex-col items-center md:flex-row">
            <div className="md:max-w-44 md:border-r md:pr-6">
              <p className="text-end text-sm dark:text-white">Powering the best teams</p>
            </div>
            <div className="relative py-6 md:w-[calc(100%-11rem)]">
              <InfiniteSlider
                speedOnHover={40}
                speed={80}
                gap={112}>
                <div className="flex">
                  <img
                    className="mx-auto h-5 w-fit dark:invert"
                    src="https://html.tailus.io/blocks/customers/nvidia.svg"
                    alt="Nvidia Logo"
                    height="20"
                    width="auto"
                  />
                </div>

                <div className="flex">
                  <img
                    className="mx-auto h-4 w-fit dark:invert"
                    src="https://html.tailus.io/blocks/customers/column.svg"
                    alt="Column Logo"
                    height="16"
                    width="auto"
                  />
                </div>
                <div className="flex">
                  <img
                    className="mx-auto h-4 w-fit dark:invert"
                    src="https://html.tailus.io/blocks/customers/github.svg"
                    alt="GitHub Logo"
                    height="16"
                    width="auto"
                  />
                </div>
                <div className="flex">
                  <img
                    className="mx-auto h-5 w-fit dark:invert"
                    src="https://html.tailus.io/blocks/customers/nike.svg"
                    alt="Nike Logo"
                    height="20"
                    width="auto"
                  />
                </div>
                <div className="flex">
                  <img
                    className="mx-auto h-5 w-fit dark:invert"
                    src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                    alt="Lemon Squeezy Logo"
                    height="20"
                    width="auto"
                  />
                </div>
                <div className="flex">
                  <img
                    className="mx-auto h-4 w-fit dark:invert"
                    src="https://html.tailus.io/blocks/customers/laravel.svg"
                    alt="Laravel Logo"
                    height="16"
                    width="auto"
                  />
                </div>
                <div className="flex">
                  <img
                    className="mx-auto h-7 w-fit dark:invert"
                    src="https://html.tailus.io/blocks/customers/lilly.svg"
                    alt="Lilly Logo"
                    height="28"
                    width="auto"
                  />
                </div>

                <div className="flex">
                  <img
                    className="mx-auto h-6 w-fit dark:invert"
                    src="https://html.tailus.io/blocks/customers/openai.svg"
                    alt="OpenAI Logo"
                    height="24"
                    width="auto"
                  />
                </div>
              </InfiniteSlider>

              <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-20"></div>
              <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-20"></div>
              <ProgressiveBlur
                className="pointer-events-none absolute left-0 top-0 h-full w-20"
                direction="left"
                blurIntensity={1}
              />
              <ProgressiveBlur
                className="pointer-events-none absolute right-0 top-0 h-full w-20"
                direction="right"
                blurIntensity={1}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2.6 VAPORIZE TEXT SECTION */}
      <section className="bg-black w-full py-16 md:py-20">
        <div className="h-32 md:h-40 flex justify-center items-center">
          <VaporizeTextCycle
            texts={["Foodies", "Creators", "Collaborators", "The Florida Local"]}
            font={{
              fontFamily: "Inter, sans-serif",
              fontSize: "70px",
              fontWeight: 600
            }}
            color="rgb(255,255, 255)"
            spread={5}
            density={5}
            animation={{
              vaporizeDuration: 2,
              fadeInDuration: 1,
              waitDuration: 0.5
            }}
            direction="left-to-right"
            alignment="center"
            tag={Tag.H2}
          />
        </div>
      </section>

      {/* 3. FOODIES, CREATORS & COLLABORATORS SLIDER - PREMIUM */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50">
        {/* Glass morphism background */}
        <div className="absolute inset-0 backdrop-blur-sm"></div>

        <div className="container mx-auto px-4 relative z-10">
          <h2
            className="text-4xl md:text-5xl font-black text-center mb-16"
            style={{
              background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            The Florida Local | Foodies, Creators & Collaborators
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { tag: "#4EverTourist", caption: "#4Boho Out In the D.R.", badgeColor: "gold", image: "/florida-local/IMG_8619_qri8nygdvbs6m28t7xaxn_3.jpg" },
              { tag: "#ipowermoves", caption: "Sarah Insure", badgeColor: "platinum", image: "/florida-local/Sarah_Insure_qri8nxijohqwaga6d_2.png" },
              { tag: "#itsGoodAF", caption: "Explore With Kenzo & Ben", badgeColor: "bronze", image: "/florida-local/IMG_9321_1_qri8nze825tgxo7g2fp_4.png" },
              { tag: "#effintrendy", caption: "OASIS Tropic Wear", badgeColor: "ruby", image: "/florida-local/3E6A3388_scaled_qri8nygjylpn3c_7.jpg" },
              { tag: "#NeverHuntAlone", caption: "HOW TO BE FEATURED", badgeColor: "emerald", image: "/florida-local/Never_Hunt_Alone_Logo_47.png" }
            ].map((item, i) => (
              <Card
                key={i}
                className="group overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-3 cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                }}
              >
                <div className="relative h-96 overflow-hidden">
                  {/* Shimmer overlay on image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                  <img
                    src={item.image}
                    alt={item.caption}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Metallic Badge */}
                  <div className="absolute top-4 left-4 z-20">
                    <MetallicBadge color={item.badgeColor as any}>{item.tag}</MetallicBadge>
                  </div>
                  {/* Glass caption bar */}
                  <div
                    className="absolute bottom-0 left-0 right-0 p-6 z-10"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.6), transparent)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <p className="text-white font-bold text-lg drop-shadow-lg">{item.caption}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURING | THE FLORIDA LOCAL LIFESTYLE - PREMIUM GLASS */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card
              className="rounded-3xl overflow-hidden group hover:-translate-y-2 transition-all duration-500"
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(30px) saturate(180%)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,1), 0 0 0 3px rgba(255,255,255,0.5)',
                border: '2px solid rgba(255, 255, 255, 0.8)',
              }}
            >
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-12 flex flex-col justify-center relative z-10">
                  <MetallicBadge color="ruby" className="mb-4">FEATURED LOCAL PAGES</MetallicBadge>
                  <p className="text-sm text-gray-500 mb-3 font-semibold">By The Locals • March 25, 2024</p>
                  <h3
                    className="text-5xl font-black mb-6"
                    style={{
                      background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    The Florida Local
                  </h3>
                  <p className="text-xl text-gray-700 leading-relaxed font-medium">
                    It's ALL ABOUT US. Be Featured #ItsGoodAF | #4EverTourist
                  </p>
                </div>
                <div className="relative h-96 md:h-auto overflow-hidden">
                  <img
                    src="/florida-local/IMG_5090_1024x574_15.jpg"
                    alt="Florida Local Lifestyle"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            </Card>

            <div className="mt-10 text-center">
              <a
                href="#"
                className="inline-flex items-center gap-2 text-blue-600 font-bold text-xl hover:scale-105 transition-transform duration-300"
                style={{
                  textShadow: '0 2px 10px rgba(37, 99, 235, 0.3)',
                }}
              >
                Follow The Orlando Locals On IG!
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FLORIDA LAKE LIFE FEATURE - PREMIUM GLASS */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card
              className="rounded-3xl overflow-hidden group hover:-translate-y-2 transition-all duration-500"
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(30px) saturate(180%)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,1), 0 0 0 3px rgba(255,255,255,0.5)',
                border: '2px solid rgba(255, 255, 255, 0.8)',
              }}
            >
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-12 flex flex-col justify-center relative z-10">
                  <MetallicBadge color="platinum" className="mb-4">FEATURED</MetallicBadge>
                  <p className="text-sm text-gray-500 mb-3 font-semibold">The Locals • July 17, 2023</p>
                  <h3
                    className="text-5xl font-black mb-6"
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Florida Lake Life With Kelli & Jason @TheOrlandoLocals
                  </h3>
                </div>
                <div className="relative h-96 md:h-auto overflow-hidden">
                  <img
                    src="/florida-local/Screen_Shot_2023_07_17_at_7_21_79.jpg"
                    alt="Florida Lake Life"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. FEATURED | LOCAL YELP ELITE - PREMIUM FOODIE SECTION */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Left Column - Premium Glass Card */}
            <Card
              className="rounded-3xl overflow-hidden group hover:-translate-y-2 transition-all duration-500"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 15px 50px rgba(0,0,0,0.18), inset 0 2px 0 rgba(255,255,255,1)',
                border: '2px solid rgba(255, 255, 255, 0.6)',
              }}
            >
              <div className="relative h-full min-h-[400px] overflow-hidden">
                <img
                  src="/florida-local/bavariandonsta_1024x923_58.jpg"
                  alt="Ivanhoe Park Brewing"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div
                  className="absolute inset-0 p-8 flex flex-col justify-end"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.4), transparent)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <MetallicBadge color="gold" className="mb-4">FEATURED</MetallicBadge>
                  <p className="text-white font-bold text-xl drop-shadow-lg">Ivanhoe Park Brewing Co.</p>
                </div>
              </div>
            </Card>

            {/* Center - CTA */}
            <div className="flex flex-col items-center justify-center">
              <Button className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white text-2xl font-bold px-12 py-8 rounded-full shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 mb-12">
                You've GOTTA Try This!
              </Button>

              <div className="w-full">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-white rounded-2xl p-2 shadow-lg">
                    <TabsTrigger value="restaurants" className="rounded-xl">Local Restaurants</TabsTrigger>
                    <TabsTrigger value="reviews" className="rounded-xl">Foodie Reviews</TabsTrigger>
                    <TabsTrigger value="menus" className="rounded-xl">Menus</TabsTrigger>
                  </TabsList>
                  <TabsContent value="restaurants" className="mt-6 space-y-4">
                    {[
                      "Have You Tried Nona's Urban Pizza Yet?",
                      "Paella Tuesday at Turulls",
                      "Cilantrillo New Restaurant Opening in Old Town Kissimmee",
                      "DON TURULL CAFE, Bonafide Agricultural Company w/ Coffee Straight from PR"
                    ].map((title, i) => (
                      <Card key={i} className="p-4 hover:shadow-lg transition-shadow cursor-pointer rounded-2xl">
                        <p className="font-semibold text-gray-800">{title}</p>
                      </Card>
                    ))}
                  </TabsContent>
                  <TabsContent value="reviews" className="mt-6 space-y-4">
                    <Card className="p-4 rounded-2xl">
                      <p className="font-semibold text-gray-800">Foodie reviews coming soon...</p>
                    </Card>
                  </TabsContent>
                  <TabsContent value="menus" className="mt-6 space-y-4">
                    <Card className="p-4 rounded-2xl">
                      <p className="font-semibold text-gray-800">Menu highlights coming soon...</p>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Right Column - Collage */}
            <div className="space-y-4">
              <MetallicBadge color="ruby">
                Local Foodie Verified
              </MetallicBadge>
              <Card className="rounded-3xl overflow-hidden shadow-2xl h-64">
                <img src="/florida-local/elbles_bistello_stacks_2_57.jpg" alt="Local Food" className="w-full h-full object-cover" />
              </Card>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-orange-500" />
                ORLANDO | ✅ Top Recommended Dishes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LOCALS | EAST ORLANDO FLAVOR - TURULL'S BOQUERIA */}
      <section className="py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Locals | East Orlando Flavor
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Restaurant Info */}
            <div>
              <h3 className="text-4xl font-bold mb-4">Turull's Boqueria</h3>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 opacity-50" />
                </div>
                <span className="text-gray-600">(52 reviews)</span>
              </div>
              <p className="text-lg mb-4">$30 and under • Spanish</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Great For Live Music", "Lively", "Great For Brunch"].map((tag, i) => (
                  <Badge key={i} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                Diverse menu with authentic Spanish tapas, paella, and more. Perfect for group dining and celebrations.
              </p>
              <a href="#" className="text-purple-600 font-semibold hover:underline">Read more →</a>
            </div>

            {/* Reservation Card */}
            <Card className="p-8 flex flex-col items-center justify-center text-center rounded-3xl shadow-xl bg-white">
              <div className="text-6xl mb-4">🍷</div>
              <h4 className="text-2xl font-bold mb-6">Reserve Your Table</h4>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 rounded-full text-lg">
                Click Here to Reserve a Table Today!
              </Button>
            </Card>
          </div>

          {/* Image Carousel */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-2xl font-bold">España Cuisine 🇪🇸 | Check Our Menu</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                "/florida-local/Updated_Turulls_Dish_36.png",
                "/florida-local/IMG_1376_2_123.jpg",
                "/florida-local/IMG_1378_124.jpg"
              ].map((img, i) => (
                <Card key={i} className="rounded-2xl overflow-hidden h-64 shadow-lg">
                  <img src={img} alt={`Spanish cuisine ${i + 1}`} className="w-full h-full object-cover" />
                </Card>
              ))}
            </div>
          </div>

          {/* Map & CTA */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="rounded-2xl overflow-hidden h-64 bg-gray-200">
              {/* Google Map Placeholder */}
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <MapPin className="h-12 w-12" />
              </div>
            </Card>
            <div className="flex items-center justify-center">
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xl px-12 py-8 rounded-full shadow-2xl">
                Book a Reservation Today
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. #ITSGOODAF | EVERY DAY IS A VACATION */}
      <section className="relative h-96 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/florida-local/IMG_0655_Optimized_90.jpg" alt="Every Day is A Vacation" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <Badge className="bg-white/20 backdrop-blur-md text-white border-white/40 px-6 py-3 mb-6 text-lg">
            #ItsGoodAF | You've Gotta Try This!
          </Badge>
          <h2 className="text-6xl font-bold text-white mb-4">Every Day is A Vacation</h2>
          <p className="text-2xl text-white/90">– #4EverTourist – | #TheOrlando Locals</p>
        </div>
      </section>

      {/* 9. CENTRAL FLORIDA INSURANCE SCHOOL PROMOTION */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-8">
              Looking For a New Career… It's Always Healthcare Awareness Month
            </h2>
            
            <Card className="bg-white text-gray-900 rounded-3xl shadow-2xl p-8 mb-8">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h3 className="text-2xl font-bold">Central Florida Insurance School</h3>
                <Badge className="bg-blue-600 text-white px-4 py-2">DPS Authorized Insurance Ed Provider</Badge>
              </div>
              <div className="flex gap-6 justify-center text-sm font-semibold flex-wrap">
                <a href="#" className="hover:text-blue-600">Home</a>
                <a href="#" className="hover:text-blue-600">Fast Agent Pre-Licensing</a>
                <a href="#" className="hover:text-blue-600">Continuing Education</a>
                <a href="#" className="hover:text-blue-600">Blog</a>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>Contact</span>
                </div>
              </div>
            </Card>

            <Badge className="bg-white/20 backdrop-blur-md text-white mb-6 px-6 py-3">
              As Seen On...
            </Badge>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                "/florida-local/cropped_Central_Florida_Insura_10.png",
                "/florida-local/Screen_Shot_2023_07_26_at_6_32_12.png",
                "/florida-local/Screen_Shot_2023_07_26_at_6_19_13.png"
              ].map((img, i) => (
                <Card key={i} className="rounded-2xl overflow-hidden h-48">
                  <img src={img} alt={`Insurance school ${i + 1}`} className="w-full h-full object-cover" />
                </Card>
              ))}
            </div>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl p-6">
              <h4 className="text-2xl font-bold mb-2">The Insurance School | We Make Pre-Licensing Easy</h4>
            </Card>
          </div>
        </div>
      </section>

      {/* 10. IPOWERMOVES LIVE PODCAST */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-blue-900 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10 text-4xl font-bold flex flex-wrap">
          {Array(20).fill("NEVER HUNT ALONE – Connect | Collaborate").map((text, i) => (
            <span key={i} className="whitespace-nowrap px-4">{text}</span>
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-8 py-4 text-xl font-bold mb-8 mx-auto block w-fit rounded-full shadow-2xl">
            Enroll Today | Insurance Careers Start Here
          </Badge>

          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-4">iPOWERMOVES LIVE PODCAST</h2>
            <p className="text-center text-2xl mb-12 text-gray-300">View Our Next Live Class!</p>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              {/* Video Player */}
              <Card className="rounded-3xl overflow-hidden aspect-video bg-black flex items-center justify-center border-4 border-white/10">
                <div className="text-center">
                  <Play className="h-20 w-20 text-white/50 mx-auto mb-4" />
                  <p className="text-white/50">Video Unavailable</p>
                </div>
              </Card>

              {/* App Download */}
              <div className="text-center">
                <h3 className="text-3xl font-bold mb-8">Download the iPowerMoves App</h3>
                <div className="mb-8">
                  <img src="/florida-local/iflash4uscreens_1024x1024_1_19.png" alt="iPowerMoves App" className="w-full max-w-md mx-auto mb-6" />
                </div>
                <div className="flex flex-col gap-4 justify-center mb-8">
                  <img src="/florida-local/App_Store_Download_18.png" alt="Download on App Store" className="w-full max-w-xs mx-auto cursor-pointer hover:opacity-80 transition-opacity" />
                  <img src="/florida-local/Get_it_On_Google_Play_Mobile_A_17.png" alt="Get it on Google Play" className="w-full max-w-xs mx-auto cursor-pointer hover:opacity-80 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Social Subscribe Links */}
            <div className="text-center">
              <p className="text-xl mb-6">Subscribe on your favorite platform:</p>
              <div className="flex gap-6 justify-center text-gray-400">
                <a href="#" className="hover:text-white transition-colors">
                  <Youtube className="h-8 w-8" />
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.5,2C7,2 2.5,6.5 2.5,12C2.5,17.5 7,22 12.5,22C18,22 22.5,17.5 22.5,12C22.5,6.5 18,2 12.5,2M12.5,20A8,8 0 0,1 4.5,12A8,8 0 0,1 12.5,4A8,8 0 0,1 20.5,12A8,8 0 0,1 12.5,20M13.19,11.5L10.93,10.82L10.93,12.18L13.19,11.5Z"/>
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M9.5,8.5L14.5,12L9.5,15.5V8.5Z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. ENTREPRENEURS, CREATORS & COLLABORATORS */}
      <section className="py-16 bg-gradient-to-br from-green-50 via-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-12">
            <MetallicBadge color="emerald" className="text-2xl px-10 py-5">
              Entrepreneurs, Creators & Collaborators
            </MetallicBadge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              { title: "The Insurance School | We Make...", image: "/florida-local/Screen_Shot_2023_07_26_at_6_17_14.png" },
              { title: "Power Moves | The Mo-Fo's Who are...", image: "/florida-local/how_to_make_a_website_like_onl_11.png" },
              { title: "Neil Schwabe, MGA With United...", image: "/florida-local/Sample_Logo_6.png" },
              { title: "Tactical Brewing Newest Released...", image: "/florida-local/banner7_3_1_52.jpg" }
            ].map((item, i) => (
              <Card key={i} className="rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                <div className="h-64">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-6">
                  <Badge className="bg-green-500 text-white mb-3 px-3 py-1 rounded-full text-xs">
                    FEATURED
                  </Badge>
                  <h4 className="font-bold text-lg">{item.title}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 12. IPOWER MOVES & CARIBBEAN LOCALS SLIDER */}
      <section className="py-16 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto mb-12">
            <Card className="rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-12 flex flex-col justify-center">
                  <Badge className="bg-pink-500 text-white w-fit mb-4 px-4 py-2">
                    #TheCaribbeanLocals
                  </Badge>
                  <p className="text-sm text-gray-600 mb-2">The Locals • June 10, 2024</p>
                  <h3 className="text-4xl font-bold mb-6">
                    I ❤️ PR | Jan & Lauras Island Excursions
                  </h3>
                </div>
                <div className="relative h-96 md:h-auto">
                  <img src="/florida-local/IMG_4616_2_96.jpg" alt="I Love PR" className="w-full h-full object-cover" />
                </div>
              </div>
            </Card>
          </div>

          <div className="flex justify-center mb-8">
            <MetallicBadge color="emerald" className="text-xl px-8 py-4">
              Power of We | Shop Local #NeverHuntAlone
            </MetallicBadge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Steffieemariee – DR is In", image: "/florida-local/3E6A3770_scaled_qri8nxim47c6uw_64.jpg" },
              { title: "Island Hopping In Punta Cana DR", image: "/florida-local/3E6A3784_2_scaled_qri8nxim47c6_62.jpg" },
              { title: "Clear Water Beach on a Charge", image: "/florida-local/3E6A1746_1_scaled_qri8nyggb1dh_66.jpg" },
              { title: "Caribbean Hotspots, Visit Punta Cana...", image: "/florida-local/IMG_9321_1_qri8nzeahveri4j4nbg_65.png" }
            ].map((item, i) => (
              <Card key={i} className="rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                <div className="h-64">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-6">
                  <h4 className="font-bold text-lg">{item.title}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 13. DENTAL SPOTLIGHT - SIAN DENTAL STUDIO */}
      <section className="py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-5xl font-bold text-center mb-4">
            ORLANDO | Your SMILE Is Contagious
          </h2>
          <p className="text-2xl text-center mb-12 text-gray-600">
            Dr. Mario | THE ORLANDO LOCAL DENTIST
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Before/After Photos Slider */}
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  "/florida-local/ANTES_YD_768x960_2_r0z7vyga2r3_31.png",
                  "/florida-local/999_768x960_2_r0z7w0bygf6dlldx_32.png",
                  "/florida-local/34_1_768x960_2_r0z7w19sn97nx7c_33.jpg",
                  "/florida-local/JJBHJBJH_768x960_2_r0z7w35h0xa_34.png"
                ].map((img, i) => (
                  <Card key={i} className="rounded-2xl overflow-hidden h-48">
                    <img src={img} alt={`Dental work ${i + 1}`} className="w-full h-full object-cover" />
                  </Card>
                ))}
              </div>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                ))}
              </div>
            </div>

            {/* Map */}
            <Card className="rounded-2xl overflow-hidden bg-gray-200">
              <div className="w-full h-full flex flex-col items-center justify-center p-8">
                <MapPin className="h-16 w-16 text-blue-600 mb-4" />
                <h4 className="font-bold text-xl mb-2">Sian Dental Studio</h4>
                <p className="text-center text-gray-600">508 N Mills Ave B, Orlando FL</p>
              </div>
            </Card>
          </div>

          <div className="text-center">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xl px-12 py-8 rounded-full shadow-2xl">
              Sian Dental 🦷 Schedule a Virtual Visit Here
            </Button>
          </div>
        </div>
      </section>

      {/* 14. THE FLORIDA LOCAL - FEATURED COLLABORATORS & FOODIE EXPERTS */}
      <section className="py-16 bg-gradient-to-br from-green-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-6">
            <MetallicBadge color="emerald" className="text-xl px-8 py-4">
              The Florida Local – Featured Collaborators
            </MetallicBadge>
          </div>

          <div className="flex justify-center mb-12">
            <MetallicBadge color="ruby" className="text-2xl px-10 py-5">
              #itsGoodAF | The Local Foodie Experts
            </MetallicBadge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
            {[
              "/florida-local/IMG_6248_120.jpg",
              "/florida-local/Icafe_Cover_1024x576_134.jpg",
              "/florida-local/IMG_0205_scaled_93.jpg"
            ].map((img, i) => (
              <Card key={i} className="rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="h-64">
                  <img src={img} alt={`Foodie ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              </Card>
            ))}
            <Card className="rounded-3xl overflow-hidden shadow-xl bg-yellow-400 flex items-center justify-center">
              <div className="text-center p-8">
                <Heart className="h-16 w-16 mx-auto mb-4 text-white" />
                <Button className="bg-white text-yellow-600 hover:bg-gray-100 rounded-full px-8 py-4 font-bold italic">
                  Read More
                </Button>
              </div>
            </Card>
          </div>

          <div className="max-w-4xl mx-auto mb-12 p-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-3xl text-center text-white shadow-2xl">
            <Heart className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-2">Send Us Your Foodie Reels</h3>
            <p className="text-xl">Featured iFastSocial Subscriptions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              "5 of The Best Spots For Healthy Foodies in Orlando",
              "Happy Birthday! @LexyMonty",
              "Felez Lunes a Todos From Hiram!"
            ].map((title, i) => (
              <Card key={i} className="p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <h4 className="font-bold text-lg mb-2">{title}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Bookmark className="h-4 w-4" />
                  <span>0 Views • 0 Comments</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 15. IPOWERMOVES - INDEPENDENT POWER MOVES */}
      <section className="py-16 bg-gradient-to-br from-orange-50 via-pink-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-12 flex flex-col justify-center">
                  <Badge className="bg-blue-500 text-white w-fit mb-4 px-4 py-2">
                    #SpaceCoastLocals
                  </Badge>
                  <p className="text-sm text-gray-600 mb-2">The Locals • January 8, 2024</p>
                  <h3 className="text-4xl font-bold mb-6">
                    The City Council of Palm Bay Joins the Space Coast Locals
                  </h3>
                </div>
                <div className="relative h-96 md:h-auto">
                  <img src="/florida-local/252864306_118346030630867_6942_139.jpg" alt="City Council Palm Bay" className="w-full h-full object-cover" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 16. CILANTRILLO RESTAURANT MENU & FOODIE POSTS */}
      <section className="py-16 bg-gradient-to-br from-purple-50 via-pink-50 to-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Foodie Posts */}
            <div className="space-y-6">
              <Card className="rounded-3xl overflow-hidden shadow-xl">
                <div className="h-64">
                  <img src="/florida-local/IMG_4953_91.jpg" alt="Pizza Guy" className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-6">
                  <h4 className="font-bold text-xl mb-2">Fly Guy Pizza Guy W/ @EatsWithAlicia</h4>
                  <p className="text-gray-600">Woman enjoying cheesy pizza</p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl overflow-hidden shadow-xl">
                <div className="h-64">
                  <img src="/florida-local/IMG_4962_98.jpg" alt="Tibby's New Orleans" className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-6">
                  <h4 className="font-bold text-xl mb-2">Tibby's New Orleans Kitchen with Baloo Eats</h4>
                  <p className="text-gray-600">Smiling man enjoying a drink</p>
                </CardContent>
              </Card>
            </div>

            {/* Right: Restaurant Menu */}
            <Card className="rounded-3xl shadow-xl p-8">
              <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                El Cilantrillo Restaurant
              </h3>

              <Tabs defaultValue="entrees" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-2xl p-2">
                  <TabsTrigger value="entrees" className="rounded-xl">Cilantrillo Entrees</TabsTrigger>
                  <TabsTrigger value="appetizers" className="rounded-xl">Appetizers</TabsTrigger>
                  <TabsTrigger value="news" className="rounded-xl">News</TabsTrigger>
                </TabsList>
                <TabsContent value="entrees" className="mt-6 space-y-4">
                  {[
                    "MAIN ENTREES 🇵🇷",
                    "EL PARRADÓN 🇵🇷",
                    "STUFFED MOFONGOS 🇵🇷",
                    "AFRENTAOS 🇵🇷"
                  ].map((item, i) => (
                    <Card key={i} className="p-4 hover:shadow-lg transition-shadow cursor-pointer rounded-2xl">
                      <p className="font-semibold text-lg">{item}</p>
                    </Card>
                  ))}
                </TabsContent>
                <TabsContent value="appetizers" className="mt-6">
                  <Card className="p-4 rounded-2xl">
                    <p className="text-gray-600">Appetizers menu coming soon...</p>
                  </Card>
                </TabsContent>
                <TabsContent value="news" className="mt-6">
                  <Card className="p-4 rounded-2xl">
                    <p className="font-semibold mb-2">Los pasteles llevan Ketchup?</p>
                    <p className="text-gray-600">Ayúdanos a resolver este problema</p>
                  </Card>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </section>

      {/* 17. #EFFINTRENDY - MUSIC, FASHION & LIFESTYLE (Already included earlier, enhanced version) */}

      {/* 18. FEATURED ENTREPRENEURS - IFASTSOCIAL ENDORSEMENT */}
      <section className="py-16 bg-gradient-to-br from-yellow-50 via-orange-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-12 flex flex-col justify-center bg-gradient-to-br from-yellow-100 to-pink-100">
                  <Badge className="bg-purple-500 text-white w-fit mb-4 px-4 py-2">
                    #iPowerMoves
                  </Badge>
                  <p className="text-sm text-gray-600 mb-2">The Locals • August 6, 2023</p>
                  <h3 className="text-4xl font-bold mb-6">
                    iFastSocial – Be Featured in Our Endorsement…
                  </h3>
                </div>
                <div className="relative h-96 md:h-auto bg-yellow-400 flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-4">iFastSocial</div>
                    <p className="text-2xl font-semibold">Connecting Local Businesses</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 19. #IPOWERMOVES - ENTREPRENEUR SPOTLIGHT & CREATORS GRID */}
      <section className="py-16 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-12">
            <MetallicBadge color="platinum" className="text-2xl px-10 py-5">
              #iPowerMoves | Entrepreneur Spotlight – The Florida Local –
            </MetallicBadge>
          </div>

          <h3 className="text-3xl font-bold text-center mb-12">The Florida Local Creators & Collaborators</h3>

          <div className="grid md:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* Left: Featured Posts Grid */}
            <div className="space-y-6">
              {[
                { title: "Step into the AM | Orlando Aston Martin Unveils The New DB12", tag: "#TheOrlandoLocals", date: "September 8, 2024" },
                { title: "Caribbean Hotspots, Visit Punta Cana D.R. – for Your Next Trip!", tag: "#EffinTrendy", date: "June 11, 2024" },
                { title: "MAIN ENTREE's", tag: "Cilantrillo Entrees", date: "June 11, 2024" },
                { title: "STUFFED MOFONGOS", tag: "Cilantrillo Entrees", date: "June 11, 2024" }
              ].map((post, i) => (
                <Card key={i} className="p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <Badge className="bg-purple-100 text-purple-700 mb-3 px-3 py-1 rounded-full text-xs">
                    {post.tag}
                  </Badge>
                  <h4 className="font-bold text-xl mb-2">{post.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{post.date}</span>
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4" />
                      <span>0 Views</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Right: Additional Links */}
            <div className="space-y-4">
              <h4 className="text-2xl font-bold mb-6">More Stories</h4>
              {[
                "Step into the AM | Orlando Aston Martin Unveils The New DB12",
                "iFastSocial – Be Featured in Our Endorsement",
                "iPower Moves | Creating Content For the Insurance Industry",
                "Florida Lake Life With Kelli & Jason @TheOrlandoLocals",
                "I ❤️ PR | Jan & Lauras Island Excursions",
                "The City Council of Palm Bay Joins the Space Coast Locals"
              ].map((title, i) => (
                <Card key={i} className="p-4 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer">
                  <p className="font-semibold text-sm">{title}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 20. CATEGORIES & TAG CLUSTERS */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Explore By Category</h2>
          
          <div className="flex gap-4 overflow-x-auto pb-4 max-w-7xl mx-auto scrollbar-hide">
            {[
              { tag: "#ItsGoodAf", count: 30, color: "from-orange-400 to-red-500" },
              { tag: "#KidPowerMoves", count: 1, color: "from-blue-400 to-cyan-500" },
              { tag: "#NeverHuntAlone", count: 1, color: "from-green-400 to-emerald-500" },
              { tag: "#SideHustles", count: 3, color: "from-purple-400 to-pink-500" },
              { tag: "#EffinTrendy", count: 13, color: "from-pink-400 to-rose-500" },
              { tag: "#iFastSocial", count: 14, color: "from-yellow-400 to-orange-500" },
              { tag: "#incrediblein", count: 18, color: "from-indigo-400 to-purple-500" },
              { tag: "#iPowerMoves", count: 6, color: "from-teal-400 to-blue-500" }
            ].map((item, i) => (
              <Card key={i} className={`flex-shrink-0 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer min-w-[280px]`}>
                <div className={`h-32 bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm"></div>
                </div>
                <CardContent className="p-6">
                  <h4 className="font-bold text-xl mb-2">{item.tag}</h4>
                  <p className="text-gray-600">{item.count} Post{item.count !== 1 ? 's' : ''}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 21. DARK PURPLE ARTICLE LIST & FOOTER */}
      <section className="py-12 bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Step into the AM | Orlando Aston Martin Unveils The New DB12",
              "Caribbean Hotspots, Visit Punta Cana D.R. – for Your Next Trip!",
              "MAIN ENTREE's",
              "EL PARRADÓN",
              "STUFFED MOFONGOS",
              "AFRENTAOS"
            ].map((title, i) => (
              <Card key={i} className="bg-white/10 backdrop-blur-md border-white/20 p-4 rounded-2xl hover:bg-white/20 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{title}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-300">
                    <span>0 View</span>
                    <span>0 Comment</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      </div>
      {/* End Content Wrapper */}
      
      <LuxuryFooter />
    </div>
  );
}

