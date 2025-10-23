import { useEffect } from "react";
import { AnimatedRoadmap } from "@/components/ui/animated-roadmap";
import { ModernPricingPage, PricingCardProps } from "@/components/ui/animated-glassy-pricing";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import YouTubeBackground from "@/components/youtube-background";

// Milestones for the roadmap showing business growth journey
const milestonesData = [
  {
    id: 1,
    name: "Establish Presence",
    status: "complete" as const,
    position: { top: "70%", left: "5%" },
  },
  {
    id: 2,
    name: "Activate Commerce",
    status: "complete" as const,
    position: { top: "15%", left: "25%" },
  },
  {
    id: 3,
    name: "Accelerate Growth",
    status: "in-progress" as const,
    position: { top: "45%", left: "55%" },
  },
  {
    id: 4,
    name: "Market Leader",
    status: "pending" as const,
    position: { top: "10%", right: "10%" },
  },
];

// Pricing plans customized for Florida Local
const floridaLocalPlans: PricingCardProps[] = [
  {
    planName: 'Local Starter',
    description: 'Your digital foundation. Build trust and connect authentically.',
    price: 'TBD',
    features: [
      'Professional business showcase',
      'Entrepreneur profile & story',
      'Direct customer conversations',
      'Community marketplace access'
    ],
    buttonText: 'Start Your Journey',
    buttonVariant: 'secondary'
  },
  {
    planName: 'Local Market',
    description: 'Transform browsers into buyers. Sell smarter, grow faster.',
    price: 'TBD',
    features: [
      'Everything in Starter',
      'Full-featured online storefront',
      'Unlimited product catalog',
      'AI-powered content creation',
      'Real-time analytics dashboard',
      'Integrated payment processing',
      'Cross-promotion network access',
      '500 automated emails monthly',
      'Priority marketplace placement'
    ],
    buttonText: 'Elevate to Market',
    isPopular: true,
    buttonVariant: 'primary'
  },
  {
    planName: 'Enterprise Local',
    description: 'Dominate your market with enterprise power at local prices.',
    price: 'TBD',
    features: [
      'Everything in Market',
      '15 specialized AI agents',
      'Premium Registry spotlight',
      'Advanced predictive analytics',
      'Unlimited marketing campaigns',
      'White-glove support 24/7',
      'Custom API integration',
      'Multi-location management',
      'Bespoke brand experiences',
      'Dedicated success strategist'
    ],
    buttonText: 'Scale to Enterprise',
    buttonVariant: 'primary'
  },
];

export default function SubscriptionPage() {
  const { isAuthenticated } = useAuth();

  // Add class to body to indicate video background
  useEffect(() => {
    document.body.classList.add('has-video-bg');
    return () => document.body.classList.remove('has-video-bg');
  }, []);

  return (
    <div
      className="min-h-screen relative"
      style={{
        position: 'relative',
        zIndex: 2,
        background: 'transparent',
        backgroundColor: 'transparent'
      }}
    >
      {/* Video Background - Cityscape Drone */}
      <YouTubeBackground youtubeUrl="https://youtu.be/5xnaoI0cXjs" overlayOpacity={0.4} />

      <div className="w-full relative" style={{ zIndex: 20 }}>
      {/* Hero Section with Roadmap */}
      <div className="container mx-auto flex flex-col items-center px-4 py-16 text-center md:py-24">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl bg-gradient-to-r from-[#008B8B] via-[#d4af37] to-[#008B8B] bg-clip-text text-transparent" style={{textShadow: '0 4px 12px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,1)'}}>
          One Platform. <span className="bg-black/70 p-2 rounded-md text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,1)'}}>Infinite Growth.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white md:text-xl font-medium bg-black/60 backdrop-blur-sm px-6 py-4 rounded-2xl" style={{textShadow: '0 2px 8px rgba(0,0,0,1)'}}>
          Replace 12+ expensive tools. Save $47,000 annually. Join Florida's most successful businesses on the only platform designed for local domination.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4" style={{ position: 'relative', zIndex: 100 }}>
          {!isAuthenticated ? (
            <>
              <Button size="lg" variant="fl-gold" onClick={() => window.location.href = '/api/login'} style={{ position: 'relative', zIndex: 100, pointerEvents: 'auto', cursor: 'pointer' }}>
                Claim Your Space
              </Button>
              <Button size="lg" variant="fl-glass" style={{ position: 'relative', zIndex: 100, pointerEvents: 'auto', cursor: 'pointer' }}>Watch Demo</Button>
            </>
          ) : (
            <>
              <Button size="lg" variant="fl-gold" style={{ position: 'relative', zIndex: 100, pointerEvents: 'auto', cursor: 'pointer' }}>Unlock Full Power</Button>
              <Link href="/business/dashboard">
                <Button size="lg" variant="fl-glass" style={{ position: 'relative', zIndex: 100, pointerEvents: 'auto', cursor: 'pointer' }}>View Dashboard</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Animated Roadmap Component */}
      <AnimatedRoadmap
        milestones={milestonesData}
        mapImageSrc="https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-SsfjxCJh43Hr1dqzkbFWUGH3ICZQbH.png&w=320&q=75"
        aria-label="An animated roadmap showing your business journey from setup to becoming a local legend."
      />

      {/* Pricing Section */}
      <ModernPricingPage
        title={
          <>
            Choose Your <span className="text-cyan-400">Growth</span> Trajectory
          </>
        }
        subtitle="Every tier unlocks exponential value. Start where you are. Scale when you're ready."
        plans={floridaLocalPlans}
        showAnimatedBackground={true}
      />

      {/* Additional Value Proposition Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-light mb-6 tracking-tight">
            The <span className="font-semibold bg-gradient-to-r from-[#008B8B] to-[#d4af37] bg-clip-text text-transparent">Florida Local</span> Advantage
          </h2>
          <p className="text-lg md:text-xl text-white max-w-3xl mx-auto font-medium leading-relaxed bg-black/50 backdrop-blur-sm px-6 py-4 rounded-2xl" style={{textShadow: '0 2px 6px rgba(0,0,0,1)'}}>
            While competitors juggle dozens of disconnected tools, you operate from one intelligent command center.
            <span className="block mt-2 font-semibold text-white">This isn't just software. It's your competitive edge.</span>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto mb-16">
          <div className="text-center group hover:scale-105 transition-transform duration-300 bg-black/50 backdrop-blur-md rounded-2xl p-6">
            <div className="text-5xl md:text-6xl font-extralight text-transparent bg-gradient-to-br from-[#d4af37] to-[#ffd700] bg-clip-text mb-3" style={{filter: 'drop-shadow(0 2px 8px rgba(212,175,55,0.8))'}}>156%</div>
            <div className="text-xl font-semibold mb-2 text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>Revenue Growth</div>
            <div className="text-sm text-white font-medium" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>Proven average in 6 months</div>
          </div>
          <div className="text-center group hover:scale-105 transition-transform duration-300 bg-black/50 backdrop-blur-md rounded-2xl p-6">
            <div className="text-5xl md:text-6xl font-extralight text-transparent bg-gradient-to-br from-[#008B8B] to-[#00A8A8] bg-clip-text mb-3" style={{filter: 'drop-shadow(0 2px 8px rgba(0,139,139,0.8))'}}>$47K</div>
            <div className="text-xl font-semibold mb-2 text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>Annual Savings</div>
            <div className="text-sm text-white font-medium" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>Replace your entire tech stack</div>
          </div>
          <div className="text-center group hover:scale-105 transition-transform duration-300 bg-black/50 backdrop-blur-md rounded-2xl p-6">
            <div className="text-5xl md:text-6xl font-extralight text-transparent bg-gradient-to-br from-[#d4af37] to-[#cd7f32] bg-clip-text mb-3" style={{filter: 'drop-shadow(0 2px 8px rgba(212,175,55,0.8))'}}>32hrs</div>
            <div className="text-xl font-semibold mb-2 text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>Time Reclaimed</div>
            <div className="text-sm text-white font-medium" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>Every week through AI automation</div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-2xl">
          <h3 className="text-2xl md:text-3xl font-light mb-8 text-center">
            What You're Really Buying
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-1 h-12 bg-gradient-to-b from-[#008B8B] to-transparent rounded-full mt-1"></div>
                <div>
                  <h4 className="font-semibold mb-1 text-white">Time Freedom</h4>
                  <p className="text-sm text-white/90">AI handles the repetitive. You focus on growth.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1 h-12 bg-gradient-to-b from-[#d4af37] to-transparent rounded-full mt-1"></div>
                <div>
                  <h4 className="font-semibold mb-1 text-white">Market Authority</h4>
                  <p className="text-sm text-white/90">Dominate local search. Own your category.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-1 h-12 bg-gradient-to-b from-[#008B8B] to-transparent rounded-full mt-1"></div>
                <div>
                  <h4 className="font-semibold mb-1 text-white">Revenue Multiplication</h4>
                  <p className="text-sm text-white/90">Turn browsers into buyers. Automatically.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1 h-12 bg-gradient-to-b from-[#d4af37] to-transparent rounded-full mt-1"></div>
                <div>
                  <h4 className="font-semibold mb-1 text-white">Peace of Mind</h4>
                  <p className="text-sm text-white/90">One platform. One price. Zero complexity.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <p className="text-2xl md:text-3xl font-medium mb-8 max-w-2xl mx-auto text-white bg-black/50 backdrop-blur-sm px-8 py-6 rounded-2xl" style={{textShadow: '0 2px 6px rgba(0,0,0,1)'}}>
            The question isn't <span className="font-bold">if</span> you can afford Florida Local.
            <span className="block mt-2 text-xl text-white/95">It's whether you can afford to wait.</span>
          </p>
          {!isAuthenticated ? (
            <Button 
              size="xl" 
              variant="fl-gold" 
              className="text-lg px-10 py-7 shadow-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all duration-300"
              onClick={() => window.location.href = '/api/login'}
            >
              Transform Your Business Now
            </Button>
          ) : (
            <Button size="xl" variant="fl-gold" className="text-lg px-10 py-7 shadow-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all duration-300">
              Unlock Your Full Potential
            </Button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}