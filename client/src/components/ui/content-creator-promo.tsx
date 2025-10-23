import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Video, Camera, Users, Zap, Award, TrendingUp,
  Heart, Sparkles, ChevronRight, Eye, Play,
  DollarSign, Rocket, Crown, Star, Instagram, Youtube
} from "lucide-react";

// Animated Counter Component
const AnimatedCounter = ({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const increment = value / 50;
      const interval = setInterval(() => {
        setCount(prev => {
          const next = prev + increment;
          if (next >= value) {
            clearInterval(interval);
            return value;
          }
          return next;
        });
      }, 30);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <span className="font-bold text-4xl md:text-5xl">
      {prefix}{Math.floor(count).toLocaleString()}{suffix}
    </span>
  );
};

// Premium Metallic Badge Component
const CreatorBadge = ({ children, icon: Icon }: { children: React.ReactNode; icon?: any }) => (
  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-300">
    {Icon && <Icon className="h-4 w-4" />}
    <span className="text-sm uppercase tracking-wider">{children}</span>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
  </div>
);

// Main Promo Component with 2 Variants for Content Creators
export default function ContentCreatorPromo({
  variant = 1,
  className = ""
}: {
  variant?: 1 | 2;
  className?: string;
}) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0.8]);

  // Variant 1: Compact creator-focused section
  if (variant === 1) {
    return (
      <section className={`relative py-12 lg:py-16 overflow-hidden bg-gradient-to-br from-purple-900 via-fuchsia-900 to-indigo-900 ${className}`}>
        {/* Simple Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15),transparent_70%)]" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500 rounded-full blur-3xl opacity-20" />
        </div>

        <motion.div
          className="container mx-auto px-4 relative z-10"
          style={{ y, opacity }}
        >
          <div className="max-w-6xl mx-auto">
            {/* Top Badge */}
            <div className="flex justify-center mb-6">
              <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-5 py-2 text-sm">
                <Video className="h-4 w-4 mr-2" />
                Featured Creator Spotlight
              </Badge>
            </div>

            {/* Hero Image - Full Width 16:9 */}
            <motion.div
              className="relative mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="/content-creators-showcase.jpg"
                  alt="Content Creators - Showcase Your Content Here"
                  className="w-full h-auto aspect-video object-cover"
                />
              </div>

              {/* Trending Badge */}
              <div className="absolute top-4 right-4">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  TRENDING
                </div>
              </div>
            </motion.div>

            {/* Content Below Image */}
            <motion.div
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  Creators, Get{" "}
                  <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                    Featured
                  </span>
                </h2>

                <p className="text-lg text-gray-300 mb-4 max-w-2xl mx-auto">
                  Showcase your content to Florida's most engaged local audience. 
                  Get discovered by brands and grow your following.
                </p>
              </div>

              {/* Value Props - 2 Column */}
              <div className="grid md:grid-cols-2 gap-5 mb-8">
                {/* Reach Card */}
                <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-pink-400/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-2">Massive Reach</h4>
                      <p className="text-gray-400 text-sm">Get your videos, reels, and posts in front of thousands of engaged Florida locals actively looking for content creators.</p>
                    </div>
                  </div>
                </div>

                {/* Monetization Card */}
                <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-purple-400/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-2">Brand Deals</h4>
                      <p className="text-gray-400 text-sm">Connect directly with local businesses for sponsored content, partnerships, and paid collaborations.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex justify-center mb-6">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Submit Your Content
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-pink-400" />
                  <span>5,000+ Creators</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-purple-400" />
                  <span>2M+ Monthly Views</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>
    );
  }

  // Variant 2: Compact metrics section
  return (
    <section className={`relative py-12 lg:py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden ${className}`}>
      {/* Simple Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.08),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-200 rounded-full blur-3xl opacity-15" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2 text-sm mb-4">
              <Users className="h-4 w-4 mr-2" />
              Join Our Creator Network
            </Badge>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Build Your{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Following
              </span>
            </h2>
            
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Connect with engaged local audiences and grow your creator business in Florida.
            </p>
          </motion.div>

          {/* Hero Image - Full Width 16:9 */}
          <motion.div
            className="relative mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img
                src="/content-creators-showcase.jpg"
                alt="Content Creators - Showcase Your Content Here"
                className="w-full h-auto aspect-video object-cover"
              />
              
              {/* Simple Stats Badges */}
              <div className="absolute top-4 left-4">
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-bold text-gray-800">2.4M Views</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-600 fill-pink-600" />
                    <span className="text-sm font-bold text-gray-800">127K Likes</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <Card className="rounded-2xl shadow-xl overflow-hidden bg-white border border-gray-200">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Left: Metrics */}
              <div className="p-8 bg-gradient-to-br from-purple-600 to-pink-600 text-white flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-6">Why Creators Join</h3>

                {/* Simplified Stats */}
                <div className="space-y-6 mb-8">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold">10x</p>
                      <p className="text-sm opacity-90">Engagement Boost</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold">5,000+</p>
                      <p className="text-sm opacity-90">Active Creators</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Eye className="h-6 w-6 text-yellow-400" />
                    <div>
                      <p className="text-2xl font-bold">2M+</p>
                      <p className="text-sm opacity-90">Monthly Reach</p>
                    </div>
                  </div>
                </div>

                {/* Simple Benefits */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span>Featured placement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span>Brand connections</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span>Analytics access</span>
                  </div>
                </div>
              </div>

              {/* Right: Simple CTA */}
              <div className="p-8 bg-gradient-to-br from-gray-50 to-white flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Start Sharing Today</h3>
                <p className="text-gray-700 mb-6">
                  Join thousands of creators building their brands on Florida's top local platform.
                </p>

                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-3 rounded-full shadow-lg mb-4"
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  Join Now
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>

                <p className="text-sm text-center text-gray-600">
                  Free to join • No setup fees
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

