import { useLocation } from "wouter";
import { Bot, Brain, Sparkles, Zap, TrendingUp, Target } from "lucide-react";
import AIAgentsHub from "@/components/ai-agents-hub";
import GlowHero from "@/components/ui/glow-hero";
import {
  AuroraAmbient,
  ParticleField,
  Transform3DCard,
  MicroIcon,
} from "@/components/premium-ultra";
import { PremiumGlassCard } from "@/components/premium-ui";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function AIAgentsPage() {
  const [, navigate] = useLocation();

  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen relative"
      data-surface-intensity="delicate"
      data-surface-tone="cool"
    >
      {/* Premium Effects */}
      <AuroraAmbient intensity="medium" />

      {/* Hero Section */}
      <div className="relative py-24 overflow-hidden gradient-shift">
        {/* Florida Local Brand Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--fl-teal-lagoon)]/10 via-background to-[var(--fl-sunset-gold)]/10" />

        {/* Particle Field with Brand Colors */}
        <ParticleField count={50} color="cyan" />

        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          {/* Hero Title */}
          <GlowHero
            glowText="AI Agents Command Center"
            glowTextSize="xl"
            className="mb-8 entrance-fade-up"
          />

          <motion.div
            className="flex items-center justify-center gap-6 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="p-4 rounded-xl bg-gradient-to-br from-[var(--fl-teal-lagoon)] to-[var(--fl-sunset-gold)] shadow-2xl ambient-glow-teal transform hover:scale-110 transition-transform">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <Brain className="w-12 h-12 text-[var(--fl-teal-lagoon)] animate-pulse" />
            <Sparkles className="w-10 h-10 text-[var(--fl-sunset-gold)] animate-pulse" />
          </motion.div>

          <p className="text-xl text-white max-w-3xl mx-auto leading-relaxed mb-12 entrance-fade-up stagger-1" style={{textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>
            15 specialized AI agents working for your Florida business. Optimize marketing,
            enhance your marketplace presence, and automate success.
          </p>

          {/* Quick Stats - Premium Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <Transform3DCard className="card-entrance stagger-2">
              <PremiumGlassCard className="group hover:shadow-[0_20px_45px_rgba(0,139,139,0.25)] transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <MicroIcon color="rgba(0, 139, 139, 0.8)">
                    <Zap className="h-10 w-10 mx-auto mb-4 text-[var(--fl-teal-lagoon)]" />
                  </MicroIcon>
                  <h3 className="font-bold text-3xl mb-2 text-white" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>
                    15
                  </h3>
                  <p className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
                    AI Agents Ready
                  </p>
                </CardContent>
              </PremiumGlassCard>
            </Transform3DCard>

            <Transform3DCard className="card-entrance stagger-3">
              <PremiumGlassCard className="group hover:shadow-[0_20px_45px_rgba(212,175,55,0.25)] transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <MicroIcon color="rgba(212, 175, 55, 0.8)">
                    <TrendingUp className="h-10 w-10 mx-auto mb-4 text-[var(--fl-sunset-gold)]" />
                  </MicroIcon>
                  <h3 className="font-bold text-3xl mb-2 text-white" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>
                    7
                  </h3>
                  <p className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
                    Marketing Agents
                  </p>
                </CardContent>
              </PremiumGlassCard>
            </Transform3DCard>

            <Transform3DCard className="card-entrance stagger-4">
              <PremiumGlassCard className="group hover:shadow-[0_20px_45px_rgba(205,127,50,0.25)] transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <MicroIcon color="rgba(205, 127, 50, 0.8)">
                    <Target className="h-10 w-10 mx-auto mb-4 text-[var(--fl-bronze)]" />
                  </MicroIcon>
                  <h3 className="font-bold text-3xl mb-2 text-white" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>
                    8
                  </h3>
                  <p className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
                    Marketplace Agents
                  </p>
                </CardContent>
              </PremiumGlassCard>
            </Transform3DCard>
          </div>
        </div>
      </div>

      {/* Main Content with Background */}
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

        <div className="container mx-auto px-4 py-16 relative z-10">
          <AIAgentsHub />
        </div>
      </div>

    </div>
  );
}