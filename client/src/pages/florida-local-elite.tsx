import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Facebook, Instagram, Youtube, Twitter, MapPin,
  Star, Phone, Calendar, ChevronLeft, ChevronRight,
  Heart, Bookmark, Play, Sparkles
} from "lucide-react";
import GlowHero from "@/components/ui/glow-hero";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import VaporizeTextCycle, { Tag } from "@/components/ui/vapour-text-effect";
import { ScrollXCarousel, ScrollXCarouselContainer, ScrollXCarouselProgress, ScrollXCarouselWrap } from "@/components/ui/scroll-x-carousel";
import { CardHoverReveal, CardHoverRevealContent, CardHoverRevealMain } from "@/components/ui/reveal-on-hover";
import BusinessAdvertPromo from "@/components/ui/business-advert-promo";
import ContentCreatorPromo from "@/components/ui/content-creator-promo";
import { ThreeDPhotoCarousel } from "@/components/ui/3d-carousel";
import { OfferCarousel, type Offer } from "@/components/ui/offer-carousel";
import { HolographicCard } from "@/components/ui/holographic-card";
// import YouTubeBackground from "@/components/youtube-background"; // Commented out to allow WebGL background

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
  const textColor = color === 'platinum' ? 'text-gray-900' : 'text-white';

  return (
    <div
      className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl overflow-hidden font-bold uppercase tracking-wide ${textColor} transform hover:scale-105 transition-all duration-300 ${className}`}
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

  // Add class to body to indicate video background
  useEffect(() => {
    document.body.classList.add('has-video-bg');
    return () => document.body.classList.remove('has-video-bg');
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'transparent',
        backgroundColor: 'transparent'
      }}
    >
      {/* CONTENT WRAPPER - Above all effects - PROPER Z-INDEX */}
      <div className="relative" style={{ zIndex: 10 }}>

      {/* 2. NEW HERO SECTION WITH VIDEO BACKGROUND - SCROLLS TO FRONT */}
      <section className="relative overflow-hidden min-h-[700px] md:min-h-[850px] lg:min-h-[100vh] bg-gradient-to-br from-gray-900/20 via-blue-900/20 to-purple-900/20 backdrop-blur-sm" style={{ zIndex: 1000 }}>
        {/* Video Background - Trees Fountain Swans - Commented out to allow WebGL background */}
        {/* <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ zIndex: 0 }}>
          <YouTubeBackground youtubeUrl="https://youtu.be/5RVvKpX9eBU" overlayOpacity={0.3} />
        </div> */}

        {/* Content Overlay - Absolutely positioned on video */}
        <div className="relative min-h-[700px] md:min-h-[850px] lg:min-h-[100vh]" style={{ zIndex: 10 }}>

          {/* LARGE CENTERED LOGO - WITH GLOW */}
          <div className="absolute left-1/2 top-[38.5%] -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 100 }}>
            {/* Outer glow ring */}
            <div className="absolute inset-0 animate-pulse" style={{
              background: 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)',
              filter: 'blur(60px)',
              transform: 'scale(1.3)'
            }}></div>

            <img
              src="/logo-big.webp"
              alt="Florida Local"
              className="w-auto object-contain relative z-10"
              style={{
                width: '70vw',
                height: '70vh',
                maxWidth: 'none',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.8)) drop-shadow(0 0 60px rgba(251,191,36,0.5)) drop-shadow(0 0 100px rgba(251,191,36,0.3)) drop-shadow(0 20px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 120px rgba(255,255,255,0.4))'
              }}
            />

            {/* Bottom spotlight effect */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 opacity-50" style={{
              background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.4) 0%, transparent 70%)',
              filter: 'blur(40px)'
            }}></div>
          </div>

          {/* ULTRA ELEGANT TAGLINE WITH STYLED CAPITALS - HIGHER UP */}
          <div className="absolute bottom-32 md:bottom-40 lg:bottom-48 left-0 right-0 w-full px-4" style={{ zIndex: 50 }}>
            <p className="text-center text-5xl md:text-6xl lg:text-7xl leading-relaxed tracking-wide whitespace-nowrap" data-testid="text-hero-tagline">
              <span className="inline-block relative">
                <span className="text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,1)) drop-shadow(0 4px 8px rgba(0,0,0,1)) drop-shadow(0 6px 12px rgba(0,0,0,0.8))' }}>Life is </span>
                <span
                  className="font-bold tracking-wider gold-underline text-yellow-400"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,1)) drop-shadow(0 4px 8px rgba(0,0,0,1)) drop-shadow(0 6px 12px rgba(0,0,0,0.8)) drop-shadow(0 0 20px rgba(251,191,36,0.8))',
                  }}
                >
                  BETTER
                </span>
                <span className="text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,1)) drop-shadow(0 4px 8px rgba(0,0,0,1)) drop-shadow(0 6px 12px rgba(0,0,0,0.8))' }}> when you're </span>
                <span
                  className="font-bold tracking-wider gold-underline text-yellow-400"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,1)) drop-shadow(0 4px 8px rgba(0,0,0,1)) drop-shadow(0 6px 12px rgba(0,0,0,0.8)) drop-shadow(0 0 20px rgba(251,191,36,0.8))',
                  }}
                >
                  LIVING
                </span>
                <span className="text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,1)) drop-shadow(0 4px 8px rgba(0,0,0,1)) drop-shadow(0 6px 12px rgba(0,0,0,0.8))' }}> </span>
                <span
                  className="font-bold tracking-wider gold-underline text-yellow-400"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,1)) drop-shadow(0 4px 8px rgba(0,0,0,1)) drop-shadow(0 6px 12px rgba(0,0,0,0.8)) drop-shadow(0 0 20px rgba(251,191,36,0.8))',
                  }}
                >
                  LIKE
                </span>
                <span className="text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,1)) drop-shadow(0 4px 8px rgba(0,0,0,1)) drop-shadow(0 6px 12px rgba(0,0,0,0.8))' }}> a </span>
                <span
                  className="font-bold tracking-wider gold-underline text-yellow-400"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,1)) drop-shadow(0 4px 8px rgba(0,0,0,1)) drop-shadow(0 6px 12px rgba(0,0,0,0.8)) drop-shadow(0 0 20px rgba(251,191,36,0.8))',
                  }}
                >
                  LOCAL
                </span>
                <span className="text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,1)) drop-shadow(0 4px 8px rgba(0,0,0,1)) drop-shadow(0 6px 12px rgba(0,0,0,0.8))' }}>.</span>
              </span>
            </p>
          </div>

          {/* SCROLLING BRAND BAR - BELOW TAGLINE */}
          <div className="absolute bottom-2 md:bottom-4 lg:bottom-6 left-0 right-0 w-full" style={{ zIndex: 30 }}>
            <div className="mx-auto max-w-7xl px-6 py-4 bg-black/70 backdrop-blur-sm rounded-2xl">
              <div className="group relative m-auto max-w-7xl px-6">
                <div className="flex flex-col items-center md:flex-row">
                  <div className="md:max-w-44 md:border-r md:border-white/30 md:pr-6">
                    <p className="text-end text-sm text-white font-bold">Powering the best teams</p>
                  </div>
                  <div className="relative py-6 md:w-[calc(100%-11rem)]">
                    <InfiniteSlider speedOnHover={40} speed={80} gap={112}>
                      <div className="flex">
                        <img className="mx-auto h-5 w-fit brightness-0 invert" src="https://html.tailus.io/blocks/customers/nvidia.svg" alt="Nvidia Logo" height="20" width="auto" />
                      </div>
                      <div className="flex">
                        <img className="mx-auto h-4 w-fit brightness-0 invert" src="https://html.tailus.io/blocks/customers/column.svg" alt="Column Logo" height="16" width="auto" />
                      </div>
                      <div className="flex">
                        <img className="mx-auto h-4 w-fit brightness-0 invert" src="https://html.tailus.io/blocks/customers/github.svg" alt="GitHub Logo" height="16" width="auto" />
                      </div>
                      <div className="flex">
                        <img className="mx-auto h-5 w-fit brightness-0 invert" src="https://html.tailus.io/blocks/customers/nike.svg" alt="Nike Logo" height="20" width="auto" />
                      </div>
                      <div className="flex">
                        <img className="mx-auto h-5 w-fit brightness-0 invert" src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg" alt="Lemon Squeezy Logo" height="20" width="auto" />
                      </div>
                      <div className="flex">
                        <img className="mx-auto h-4 w-fit brightness-0 invert" src="https://html.tailus.io/blocks/customers/laravel.svg" alt="Laravel Logo" height="16" width="auto" />
                      </div>
                      <div className="flex">
                        <img className="mx-auto h-7 w-fit brightness-0 invert" src="https://html.tailus.io/blocks/customers/lilly.svg" alt="Lilly Logo" height="28" width="auto" />
                      </div>
                      <div className="flex">
                        <img className="mx-auto h-6 w-fit brightness-0 invert" src="https://html.tailus.io/blocks/customers/openai.svg" alt="OpenAI Logo" height="24" width="auto" />
                      </div>
                    </InfiniteSlider>
                    <ProgressiveBlur className="pointer-events-none absolute left-0 top-0 h-full w-20" direction="left" blurIntensity={1} />
                    <ProgressiveBlur className="pointer-events-none absolute right-0 top-0 h-full w-20" direction="right" blurIntensity={1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.6 VAPORIZE TEXT SECTION */}
      <section className="bg-black w-full pt-16 md:pt-20 pb-8">
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

      {/* PREMIUM ADVERTISEMENT BLOCK 1 - Prime Above-the-Fold Position */}
      <BusinessAdvertPromo variant={1} />

      {/* 3. FOODIES, CREATORS & COLLABORATORS CAROUSEL - HORIZONTAL SCROLL */}
      <ScrollXCarousel className="h-auto bg-black pb-16">
        <ScrollXCarouselContainer className="h-auto place-content-center flex flex-col gap-8 py-8">
          <div className="pointer-events-none w-[12vw] h-[103%] absolute inset-[0_auto_0_0] z-10 bg-[linear-gradient(90deg,_rgb(0_0_0)_35%,_transparent)]" />
          <div className="pointer-events-none bg-[linear-gradient(270deg,_rgb(0_0_0)_35%,_transparent)] w-[15vw] h-[103%] absolute inset-[0_0_0_auto] z-10" />

          <ScrollXCarouselWrap className="flex-4/5 flex space-x-8 [&>*:first-child]:ml-8">
            {[
              { 
                id: 'slide-1',
                title: '#4Boho Out In the D.R.',
                description: 'Experience the bohemian lifestyle with our featured local creator, sharing the best of Dominican Republic adventures.',
                services: ['travel', 'lifestyle', 'photography'],
                type: '#4EverTourist',
                imageUrl: '/florida-local/IMG_8619_qri8nygdvbs6m28t7xaxn_3.jpg'
              },
              { 
                id: 'slide-2',
                title: 'Sarah Insure',
                description: 'Your trusted insurance expert bringing peace of mind and comprehensive coverage solutions to the community.',
                services: ['insurance', 'consulting', 'local business'],
                type: '#ipowermoves',
                imageUrl: '/florida-local/Sarah_Insure_qri8nxijohqwaga6d_2.png'
              },
              { 
                id: 'slide-3',
                title: 'Explore With Kenzo & Ben',
                description: 'Join Kenzo & Ben on their exciting adventures exploring the best local spots and hidden gems.',
                services: ['exploration', 'food', 'entertainment'],
                type: '#itsGoodAF',
                imageUrl: '/florida-local/IMG_9321_1_qri8nze825tgxo7g2fp_4.png'
              },
              { 
                id: 'slide-4',
                title: 'OASIS Tropic Wear',
                description: 'Discover trendy tropical fashion that brings island vibes to your everyday style.',
                services: ['fashion', 'tropical wear', 'local brand'],
                type: '#effintrendy',
                imageUrl: '/florida-local/3E6A3388_scaled_qri8nygjylpn3c_7.jpg'
              },
              { 
                id: 'slide-5',
                title: 'HOW TO BE FEATURED',
                description: 'Want to be featured on The Florida Local? Join our community of creators, foodies, and collaborators.',
                services: ['community', 'featured', 'collaboration'],
                type: '#NeverHuntAlone',
                imageUrl: '/florida-local/Never_Hunt_Alone_Logo_47.png'
              }
            ].map((slide) => (
              <CardHoverReveal
                key={slide.id}
                className="min-w-[70vw] md:min-w-[38vw] shadow-xl border xl:min-w-[30vw] rounded-xl"
                data-testid={`card-${slide.id}`}
              >
                <CardHoverRevealMain>
                  <img
                    alt={slide.title}
                    src={slide.imageUrl}
                    className="size-full aspect-square object-cover"
                    data-testid={`img-${slide.id}`}
                  />
                </CardHoverRevealMain>
                <CardHoverRevealContent className="space-y-4 rounded-2xl bg-[rgba(0,0,0,.5)] backdrop-blur-3xl p-4">
                  <div className="space-y-2">
                    <h3 className="text-sm text-white font-bold">Type</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="capitalize rounded-full bg-indigo-500" data-testid={`badge-type-${slide.id}`}>
                        {slide.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm text-white font-bold">Services</h3>
                    <div className="flex flex-wrap gap-2">
                      {slide.services.map((service) => (
                        <Badge
                          key={service}
                          className="capitalize rounded-full"
                          variant={'secondary'}
                          data-testid={`badge-service-${slide.id}-${service}`}
                        >
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    <h3 className="text-white capitalize font-medium" data-testid={`title-${slide.id}`}>
                      {slide.title}
                    </h3>
                    <p className="text-white text-sm" data-testid={`description-${slide.id}`}>{slide.description}</p>
                  </div>
                </CardHoverRevealContent>
              </CardHoverReveal>
            ))}
          </ScrollXCarouselWrap>
          <ScrollXCarouselProgress
            className="bg-secondary mx-8 h-1 rounded-full overflow-hidden"
            progressStyle="size-full bg-indigo-500/70 rounded-full"
          />
        </ScrollXCarouselContainer>
      </ScrollXCarousel>

      {/* 4. FEATURING | THE FLORIDA LOCAL LIFESTYLE - PREMIUM GLASS */}
      <section className="py-20 relative overflow-hidden abstract-glass-premium" style={{
        backgroundImage: "url('/backgrounds/colorful-series-circles-with-orange-blue-colors_889056-245202.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <HolographicCard className="rounded-3xl group">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-12 flex flex-col justify-center holo-content bg-black/40 backdrop-blur-sm">
                  <MetallicBadge color="ruby" className="mb-4">FEATURED LOCAL PAGES</MetallicBadge>
                  <p className="text-sm text-white mb-3 font-bold" style={{ textShadow: '0 4px 8px rgba(0,0,0,1), 0 2px 4px rgba(0,0,0,1)' }}>By The Locals • March 25, 2024</p>
                  <h3 className="text-5xl font-black mb-6 text-white" style={{ textShadow: '0 4px 12px rgba(0,0,0,1), 0 2px 6px rgba(0,0,0,1)' }}>
                    The Florida Local
                  </h3>
                  <p className="text-xl text-white leading-relaxed font-bold" style={{ textShadow: '0 4px 8px rgba(0,0,0,1), 0 2px 4px rgba(0,0,0,1)' }}>
                    It's ALL ABOUT US. Be Featured #ItsGoodAF | #4EverTourist
                  </p>
                </div>
                <div className="relative h-96 md:h-auto overflow-hidden rounded-r-3xl">
                  <img
                    src="/florida-local/IMG_5090_1024x574_15.jpg"
                    alt="Florida Local Lifestyle"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            </HolographicCard>

            <div className="mt-10 text-center">
              <a
                href="#"
                className="inline-flex items-center gap-2 text-white font-bold text-xl hover:scale-105 transition-transform duration-300 bg-blue-600 px-6 py-3 rounded-full"
                style={{
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                }}
              >
                Follow The Orlando Locals On IG!
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FLORIDA LAKE LIFE FEATURE - PREMIUM GLASS */}
      <section className="py-20 relative overflow-hidden abstract-glass-premium" style={{
        backgroundImage: "url('/backgrounds/208414429-a-close-up-of-a-colorful-abstract-painting-generative-ai-image.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <HolographicCard className="rounded-3xl group">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-12 flex flex-col justify-center holo-content bg-black/40 backdrop-blur-sm">
                  <MetallicBadge color="platinum" className="mb-4">FEATURED</MetallicBadge>
                  <p className="text-sm text-white mb-3 font-bold" style={{ textShadow: '0 4px 8px rgba(0,0,0,1), 0 2px 4px rgba(0,0,0,1)' }}>The Locals • July 17, 2023</p>
                  <h3 className="text-5xl font-black mb-6 text-white" style={{ textShadow: '0 4px 12px rgba(0,0,0,1), 0 2px 6px rgba(0,0,0,1)' }}>
                    Florida Lake Life With Kelli & Jason @TheOrlandoLocals
                  </h3>
                </div>
                <div className="relative h-96 md:h-auto overflow-hidden rounded-r-3xl">
                  <img
                    src="/florida-local/Screen_Shot_2023_07_17_at_7_21_79.png"
                    alt="Florida Lake Life"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            </HolographicCard>
          </div>
        </div>
      </section>

      {/* 5.5 SEPARATOR - JOIN THE FLORIDA LOCAL COMMUNITY */}
      <section className="py-16 bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Discover The Florida Local Lifestyle
            </h2>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Join thousands of locals exploring the best food, experiences, and hidden gems across Florida.
              From lake life adventures to foodie hotspots, we're your guide to living like a true local.
            </p>
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300">
                Join Our Community
              </Button>
              <Button variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 rounded-full">
                Explore Features
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">500+</div>
                <div className="text-sm text-gray-600">Local Businesses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
                <div className="text-sm text-gray-600">Community Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">1000+</div>
                <div className="text-sm text-gray-600">Featured Posts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURED | LOCAL YELP ELITE - PREMIUM FOODIE SECTION */}
      <section className="py-20 relative overflow-hidden abstract-glass-premium" style={{
        backgroundImage: "url('/backgrounds/dynamic-abstract-patterns-with-overlapping-circles-spirals-creating-sense-motion_36897-73531.avif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
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
                  <TabsList className="grid w-full grid-cols-3 bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
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

      {/* PREMIUM ADVERTISEMENT BLOCK 2 - Mid-Content High-Engagement Zone */}
      <BusinessAdvertPromo variant={2} />

      {/* 7. LOCALS | EAST ORLANDO FLAVOR - TURULL'S BOQUERIA */}
      <section className="py-12 lg:py-20 relative overflow-hidden abstract-glass-premium" style={{
        backgroundImage: "url('/backgrounds/abstract-composition-glowing-bubbles-dark-background-with-orange-blue-tones_1090747-6434.avif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
            Locals | East Orlando Flavor
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Restaurant Info */}
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-xl">
              <h3 className="text-4xl font-bold mb-4 text-gray-900" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Turull's Boqueria</h3>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 opacity-50" />
                </div>
                <span className="text-gray-900 font-semibold">(52 reviews)</span>
              </div>
              <p className="text-lg mb-4 text-gray-900 font-semibold">$30 and under • Spanish</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Great For Live Music", "Lively", "Great For Brunch"].map((tag, i) => (
                  <Badge key={i} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-semibold">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-gray-900 leading-relaxed mb-4 text-lg">
                Diverse menu with authentic Spanish tapas, paella, and more. Perfect for group dining and celebrations.
              </p>
              <a href="#" className="text-purple-700 font-bold hover:underline text-lg inline-flex items-center gap-1 hover:gap-2 transition-all">
                Read more →
              </a>
            </div>

            {/* Reservation Card */}
            <Card className="p-8 flex flex-col items-center justify-center text-center rounded-3xl shadow-xl bg-white/95 backdrop-blur-sm">
              <div className="text-6xl mb-4">🍷</div>
              <h4 className="text-2xl font-bold mb-6">Reserve Your Table</h4>
              <Button className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-700/40 hover:to-pink-700/40 text-white px-8 py-6 rounded-full text-lg backdrop-blur-md">
                Click Here to Reserve a Table Today!
              </Button>
            </Card>
          </div>

          {/* Image Carousel */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
              <h4 className="text-2xl font-bold text-gray-900">España Cuisine 🇪🇸 | Check Our Menu</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full bg-white/90 backdrop-blur-sm">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full bg-white/90 backdrop-blur-sm">
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
              <div className="w-full h-full flex items-center justify-center text-gray-900">
                <MapPin className="h-12 w-12" />
              </div>
            </Card>
            <div className="flex items-center justify-center">
              <Button className="bg-gradient-to-r from-green-500/30 to-emerald-600/30 hover:from-green-600/40 hover:to-emerald-700/40 text-white text-xl px-12 py-8 rounded-full shadow-2xl backdrop-blur-md">
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
          <p className="text-2xl text-white">– #4EverTourist – | #TheOrlando Locals</p>
        </div>
      </section>

      {/* 9. CENTRAL FLORIDA INSURANCE SCHOOL PROMOTION */}
      <section className="py-12 lg:py-20 bg-gradient-to-br from-blue-600/20 to-blue-800/20 text-white backdrop-blur-sm">
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
      <section className="py-12 lg:py-20 bg-gradient-to-br from-gray-900/20 to-blue-900/20 text-white relative overflow-hidden backdrop-blur-sm">
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
            <p className="text-center text-2xl mb-12 text-white">View Our Next Live Class!</p>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              {/* Video Player */}
              <Card className="rounded-3xl overflow-hidden aspect-video bg-black flex items-center justify-center border-4 border-white/10">
                <div className="text-center">
                  <Play className="h-20 w-20 text-white mx-auto mb-4" />
                  <p className="text-white">Video Unavailable</p>
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
              <div className="flex gap-6 justify-center text-white">
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
      <section className="py-12 lg:py-20 relative overflow-hidden abstract-glass-premium" style={{
        backgroundImage: "url('/backgrounds/360_F_652778958_COkVj7I3ibeJHDY0fKzEuHj5ptec0AB3.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
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

      {/* PREMIUM ADVERTISEMENT BLOCK 3 - Deep-Content Authority Position */}
      <BusinessAdvertPromo variant={3} />

      {/* 12. IPOWER MOVES & CARIBBEAN LOCALS SLIDER */}
      <section className="py-12 lg:py-20 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
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
      <section className="py-12 lg:py-20 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white p-8 rounded-3xl shadow-2xl mb-8" style={{ backdropFilter: 'none' }}>
            <h2 className="text-5xl font-bold text-center mb-4 text-black">
              ORLANDO | Your SMILE Is Contagious
            </h2>
            <p className="text-2xl text-center mb-0 text-black font-bold">
              Dr. Mario | THE ORLANDO LOCAL DENTIST
            </p>
          </div>

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
            <Card className="rounded-2xl overflow-hidden bg-white shadow-2xl">
              <div className="w-full h-full flex flex-col items-center justify-center p-8">
                <MapPin className="h-16 w-16 text-blue-600 mb-4" />
                <h4 className="font-bold text-xl mb-2 text-black">Sian Dental Studio</h4>
                <p className="text-center text-black font-bold">508 N Mills Ave B, Orlando FL</p>
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
      <section className="py-12 lg:py-20 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
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
      <section className="py-12 lg:py-20 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
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
      <section className="py-12 lg:py-20 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
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
      <section className="py-12 lg:py-20 relative overflow-hidden abstract-glass-premium" style={{
        backgroundImage: "url('/backgrounds/360_F_652778958_COkVj7I3ibeJHDY0fKzEuHj5ptec0AB3.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
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

      {/* CONTENT CREATOR PROMO BLOCK 1 - Pre-Creator Section Hook */}
      <ContentCreatorPromo variant={1} />

      {/* 19. #IPOWERMOVES - ENTREPRENEUR SPOTLIGHT & CREATORS GRID */}
      <section className="py-12 lg:py-20 relative overflow-hidden abstract-glass-premium" style={{
        backgroundImage: "url('/backgrounds/dynamic-abstract-patterns-with-overlapping-circles-spirals-creating-sense-motion_36897-73531.avif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-12">
            <MetallicBadge color="platinum" className="text-2xl px-10 py-5">
              #iPowerMoves | Entrepreneur Spotlight – The Florida Local –
            </MetallicBadge>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-2xl mb-12 max-w-4xl mx-auto" style={{ backdropFilter: 'none' }}>
            <h3 className="text-3xl font-bold text-center text-black">The Florida Local Creators & Collaborators</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* Left: Featured Posts Grid */}
            <div className="space-y-6">
              {[
                { title: "Step into the AM | Orlando Aston Martin Unveils The New DB12", tag: "#TheOrlandoLocals", date: "September 8, 2024" },
                { title: "Caribbean Hotspots, Visit Punta Cana D.R. – for Your Next Trip!", tag: "#EffinTrendy", date: "June 11, 2024" },
                { title: "MAIN ENTREE's", tag: "Cilantrillo Entrees", date: "June 11, 2024" },
                { title: "STUFFED MOFONGOS", tag: "Cilantrillo Entrees", date: "June 11, 2024" }
              ].map((post, i) => (
                <Card key={i} className="p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white">
                  <Badge className="bg-purple-100 text-purple-700 mb-3 px-3 py-1 rounded-full text-xs font-semibold">
                    {post.tag}
                  </Badge>
                  <h4 className="font-bold text-xl mb-2 text-black">{post.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-black font-medium">
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
              <div className="bg-white p-4 rounded-2xl shadow-xl" style={{ backdropFilter: 'none' }}>
                <h4 className="text-2xl font-bold text-black">More Stories</h4>
              </div>
              {[
                "Step into the AM | Orlando Aston Martin Unveils The New DB12",
                "iFastSocial – Be Featured in Our Endorsement",
                "iPower Moves | Creating Content For the Insurance Industry",
                "Florida Lake Life With Kelli & Jason @TheOrlandoLocals",
                "I ❤️ PR | Jan & Lauras Island Excursions",
                "The City Council of Palm Bay Joins the Space Coast Locals"
              ].map((title, i) => (
                <Card key={i} className="p-4 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer bg-white shadow-lg">
                  <p className="font-bold text-sm text-black">{title}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT CREATOR PROMO BLOCK 2 - Post-Creator Section Conversion */}
      <ContentCreatorPromo variant={2} />

      {/* 20. EXPLORE BY CATEGORY - OFFER CAROUSEL */}
      <section className="py-12 lg:py-20 relative overflow-hidden abstract-glass-premium" style={{
        backgroundImage: "url('/backgrounds/geometric-lines-intersecting-with-organic-shapes-hd-4k_964851-163761.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E")`
        }} />

        {/* Radial gradient vignette */}
        <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(80%_60%_at_50%_40%,rgba(180,230,255,.3),transparent_70%)]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Premium heading with glass effect */}
            <div className="text-center mb-12 bg-white p-8 rounded-3xl shadow-2xl max-w-4xl mx-auto" style={{ backdropFilter: 'none' }}>
              <h2 className="text-5xl lg:text-6xl font-bold mb-4 text-black tracking-tight">
                Explore By Category
              </h2>
              <p className="text-lg text-black font-bold tracking-wide">
                Discover exclusive local offers and experiences
              </p>
            </div>

            {/* Offer Carousel */}
            <OfferCarousel
              offers={[
                {
                  id: 1,
                  imageSrc: "/florida-local/IMG_6248_120.jpg",
                  imageAlt: "ItsGoodAF - Local food experiences",
                  tag: "Food & Dining",
                  title: "#ItsGoodAF",
                  description: "Discover the best local restaurants and food experiences in Florida.",
                  brandLogoSrc: "/i-am-the-logo.png",
                  brandName: "The Florida Local",
                  promoCode: "30 Featured Posts",
                  href: "#",
                },
                {
                  id: 2,
                  imageSrc: "/florida-local/IMG_9321_1_qri8nzeahveri4j4nbg_65.png",
                  imageAlt: "KidPowerMoves - Family activities",
                  tag: "Family & Kids",
                  title: "#KidPowerMoves",
                  description: "Family-friendly activities and adventures for the young ones.",
                  brandLogoSrc: "/i-am-the-logo.png",
                  brandName: "The Florida Local",
                  promoCode: "1 Featured Post",
                  href: "#",
                },
                {
                  id: 3,
                  imageSrc: "/florida-local/Never_Hunt_Alone_Logo_47.png",
                  imageAlt: "NeverHuntAlone - Community collaboration",
                  tag: "Community",
                  title: "#NeverHuntAlone",
                  description: "Connect with local entrepreneurs, creators, and collaborators.",
                  brandLogoSrc: "/i-am-the-logo.png",
                  brandName: "The Florida Local",
                  promoCode: "1 Featured Post",
                  href: "#",
                },
                {
                  id: 4,
                  imageSrc: "/florida-local/how_to_make_a_website_like_onl_11.png",
                  imageAlt: "SideHustles - Entrepreneurship",
                  tag: "Business",
                  title: "#SideHustles",
                  description: "Explore side hustle opportunities and entrepreneurial ventures.",
                  brandLogoSrc: "/i-am-the-logo.png",
                  brandName: "The Florida Local",
                  promoCode: "3 Featured Posts",
                  href: "#",
                },
                {
                  id: 5,
                  imageSrc: "/florida-local/3E6A3388_scaled_qri8nygjylpn3c_7.jpg",
                  imageAlt: "EffinTrendy - Fashion and lifestyle",
                  tag: "Fashion & Lifestyle",
                  title: "#EffinTrendy",
                  description: "Stay updated with the latest trends in fashion, music, and lifestyle.",
                  brandLogoSrc: "/i-am-the-logo.png",
                  brandName: "The Florida Local",
                  promoCode: "13 Featured Posts",
                  href: "#",
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* 21. DARK PURPLE ARTICLE LIST & FOOTER */}
      <section className="py-12 lg:py-20 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 text-white backdrop-blur-sm">
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
                  <div className="flex items-center gap-3 text-xs text-white">
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
    </div>
  );
}

