import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  TrendingUp, Target, Users, Zap, Award, BarChart3,
  Globe, Shield, Sparkles, ChevronRight, Eye, MousePointer,
  DollarSign, Rocket, Crown, Star
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
const EliteBadge = ({ children, icon: Icon }: { children: React.ReactNode; icon?: any }) => (
  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 text-black font-bold shadow-lg transform hover:scale-105 transition-all duration-300">
    {Icon && <Icon className="h-4 w-4" />}
    <span className="text-sm uppercase tracking-wider">{children}</span>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
  </div>
);

// Main Promo Component with 3 Variants
export default function BusinessAdvertPromo({
  variant = 1,
  className = ""
}: {
  variant?: 1 | 2 | 3;
  className?: string;
}) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0.8]);

  // Variant 1: Hero-style with parallax effect - Prime Above-the-Fold
  if (variant === 1) {
    return (
      <section className={`relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${className}`}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            >
              <Sparkles className="h-4 w-4 text-yellow-400 opacity-60" />
            </div>
          ))}
        </div>

        <motion.div
          className="container mx-auto px-4 relative z-10"
          style={{ y, opacity }}
        >
          <div className="max-w-7xl mx-auto">
            {/* Top Badge */}
            <div className="flex justify-center mb-8">
              <EliteBadge icon={Crown}>Limited Premium Placement Available</EliteBadge>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Image Showcase */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-all duration-500">
                  <img
                    src="/your-company-here.png"
                    alt="Your Company Here - Premium Advertisement"
                    className="w-full h-auto"
                  />
                </div>

                {/* Floating Badge */}
                <div className="absolute -top-4 -right-4 z-30">
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg animate-bounce">
                    <span className="font-bold text-sm">HOT SPOT</span>
                  </div>
                </div>
              </motion.div>

              {/* Right: Premium Copy */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <h2 className="text-5xl md:text-6xl font-black mb-6 text-white">
                  Amplify Your Brand's{" "}
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Digital Presence
                  </span>
                </h2>

                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Secure your premium placement in Florida's most elite digital marketplace.
                  Our high-conversion advertising ecosystem delivers <span className="text-yellow-400 font-bold">
                  unparalleled ROI</span> through strategic positioning, targeted audience segmentation,
                  and data-driven optimization protocols.
                </p>

                {/* Value Props */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <Target className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-bold mb-1">Laser-Targeted Demographics</h4>
                      <p className="text-gray-400 text-sm">Reach your ideal customer profile with precision-engineered audience targeting delivering 3x industry-standard engagement rates.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-bold mb-1">Performance-Driven Analytics</h4>
                      <p className="text-gray-400 text-sm">Real-time KPI dashboards with conversion tracking, attribution modeling, and predictive performance insights.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-bold mb-1">Brand Safety Guaranteed</h4>
                      <p className="text-gray-400 text-sm">Premium placement alongside curated, brand-safe content with full transparency and viewability metrics.</p>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-bold px-8 py-6 text-lg rounded-full shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                    Claim Your Premium Spot
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black font-bold px-8 py-6 text-lg rounded-full"
                  >
                    View Success Stories
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="mt-8 pt-8 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <span className="text-gray-400 ml-2">5.0 Advertiser Rating</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-400">
                      <Award className="h-3 w-3 mr-1" />
                      Top 1% Platform
                    </Badge>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>
    );
  }

  // Variant 2: Split-screen with animated metrics - Mid-Content
  if (variant === 2) {
    return (
      <section className={`relative py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 overflow-hidden ${className}`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,0,0,0.05) 35px, rgba(0,0,0,0.05) 70px)`
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 text-lg mb-4">
                <Zap className="h-4 w-4 mr-2" />
                CONVERSION OPTIMIZATION ZONE
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Transform{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Browsers into Loyal Customers
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Leverage our advanced conversion funnel optimization and behavioral targeting
                to maximize your customer acquisition efficiency.
              </p>
            </motion.div>

            <Card className="rounded-3xl shadow-2xl overflow-hidden bg-white/95 backdrop-blur-lg border-0">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Left: Metrics Dashboard */}
                <div className="p-12 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                  <h3 className="text-3xl font-bold mb-8">Performance Metrics That Matter</h3>

                  {/* Animated Metrics */}
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="h-5 w-5 text-yellow-400" />
                          <span className="text-sm uppercase tracking-wider opacity-80">Average CTR</span>
                        </div>
                        <AnimatedCounter value={12.8} suffix="%" />
                      </div>
                      <div className="text-green-400 text-sm font-bold">
                        +285% vs Industry
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-5 w-5 text-green-400" />
                          <span className="text-sm uppercase tracking-wider opacity-80">Qualified Leads</span>
                        </div>
                        <AnimatedCounter value={847} suffix="/mo" />
                      </div>
                      <div className="text-green-400 text-sm font-bold">
                        +42% MoM Growth
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-5 w-5 text-orange-400" />
                          <span className="text-sm uppercase tracking-wider opacity-80">ROI Average</span>
                        </div>
                        <AnimatedCounter value={426} suffix="%" />
                      </div>
                      <div className="text-green-400 text-sm font-bold">
                        Top Performer
                      </div>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="mt-10 pt-10 border-t border-white/20">
                    <h4 className="font-bold mb-4">Included Premium Features:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                          </svg>
                        </div>
                        <span>Multi-touch Attribution Tracking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                          </svg>
                        </div>
                        <span>A/B Testing Framework</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                          </svg>
                        </div>
                        <span>Retargeting Pixel Integration</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                          </svg>
                        </div>
                        <span>Custom Audience Segmentation</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right: Image and CTA */}
                <div className="relative h-full min-h-[600px] flex flex-col justify-center p-12">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50" />

                  <div className="relative z-10">
                    <img
                      src="/your-company-here.png"
                      alt="Your Company Here - Premium Advertisement"
                      className="w-full h-auto rounded-2xl shadow-2xl mb-8 transform hover:scale-105 transition-all duration-500"
                    />

                    <div className="text-center">
                      <p className="text-gray-700 mb-6 text-lg">
                        Join <span className="font-bold text-purple-600">200+ successful brands</span> already
                        maximizing their digital footprint with our premium placement solutions.
                      </p>

                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-10 py-6 text-lg rounded-full shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        <Globe className="mr-2 h-5 w-5" />
                        Reserve Your Premium Space
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>

                      <p className="mt-4 text-sm text-gray-500">
                        Limited availability • No setup fees • Cancel anytime
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    );
  }

  // Variant 3: Interactive showcase with hover effects - Deep Content
  return (
    <section className={`relative py-16 lg:py-24 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 overflow-hidden ${className}`}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-300 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-300 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 text-lg mb-4">
              <Crown className="h-4 w-4 mr-2" />
              MARKET DOMINATION PLATFORM
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Dominate Your{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Market Vertical
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Establish unshakeable brand authority with our enterprise-grade advertising
              infrastructure and competitive intelligence systems.
            </p>
          </motion.div>

          {/* Interactive Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Features */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="h-full rounded-2xl shadow-xl bg-white/90 backdrop-blur-lg p-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-800">Market Intelligence</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <Target className="h-5 w-5 text-emerald-600" />
                      <h4 className="font-bold text-gray-800">Competitor Analysis</h4>
                    </div>
                    <p className="text-sm text-gray-600">Real-time competitive landscape monitoring</p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="h-5 w-5 text-teal-600" />
                      <h4 className="font-bold text-gray-800">Trend Forecasting</h4>
                    </div>
                    <p className="text-sm text-gray-600">AI-powered market trend predictions</p>
                  </div>
                  <div className="p-4 bg-cyan-50 rounded-xl hover:bg-cyan-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-5 w-5 text-cyan-600" />
                      <h4 className="font-bold text-gray-800">Brand Protection</h4>
                    </div>
                    <p className="text-sm text-gray-600">Reputation management & crisis prevention</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Center: Main Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className="rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
                <img
                  src="/your-company-here.png"
                  alt="Your Company Here - Premium Advertisement"
                  className="w-full h-full object-cover"
                />
              </Card>

              {/* Floating Action Button */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-20">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold px-8 py-4 rounded-full shadow-xl transform hover:scale-110 transition-all duration-300"
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  Launch Your Campaign
                </Button>
              </div>
            </motion.div>

            {/* Right: Success Metrics */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Card className="h-full rounded-2xl shadow-xl bg-white/90 backdrop-blur-lg p-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-800">Success Metrics</h3>

                {/* Client Success Story */}
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2 italic">
                    "The ROI we've seen has been phenomenal. Our brand visibility
                    increased by 400% within the first quarter."
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">Sarah Johnson</p>
                      <p className="text-xs text-gray-600">CEO, TechStart Inc.</p>
                    </div>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Brand Recall</span>
                    <span className="font-bold text-emerald-600">+67%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Market Share</span>
                    <span className="font-bold text-teal-600">+23%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Customer LTV</span>
                    <span className="font-bold text-cyan-600">+145%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">NPS Score</span>
                    <span className="font-bold text-emerald-600">82</span>
                  </div>
                </div>

                {/* Trust Badge */}
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl text-center">
                  <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-800">CERTIFIED PARTNER</p>
                  <p className="text-xs text-gray-600">Google Premier • Meta Business</p>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Bottom CTA Bar */}
          <motion.div
            className="mt-12 p-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl text-white text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-lg mb-2">
              <span className="font-bold">Limited Time Offer:</span> Get 30% off your first 3 months + Free creative services
            </p>
            <p className="text-sm opacity-90">Offer expires in 48 hours • Only 3 spots remaining</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}