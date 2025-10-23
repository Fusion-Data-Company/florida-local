import Leaderboard from "@/components/community/Leaderboard";
import TrendingBusinesses from "@/components/spotlight/TrendingBusinesses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Heart, MessageCircle, ShoppingBag, TrendingUp, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { CtaCard } from "@/components/ui/call-to-action-cta";
import SphereHero from "@/components/ui/geometric-sphere";
import { HolographicCard } from "@/components/ui/holographic-card";
import YouTubeBackground from '@/components/youtube-background';

export default function CommunityPage() {
  return (
    <div className="min-h-screen relative">
      {/* Video Background */}
      <YouTubeBackground youtubeUrl="https://youtu.be/5xnaoI0cXjs" overlayOpacity={0.35} />

      <div className="relative z-10">
      {/* Geometric Sphere Hero Section */}
      <SphereHero />

      {/* CTA Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <CtaCard
          title="Florida Local Community"
          description="Join Florida's most vibrant community of local businesses and supporters"
          buttonText="Join Community"
          inputPlaceholder="Enter your email"
          imageSrc="https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80"
          onButtonClick={(email) => {
            console.log("Community signup:", email);
            // Add your signup logic here
          }}
        />
      </div>

      {/* Community Stats Overview */}
      <section className="relative py-16">
        <div className="absolute inset-0 glass-section-overlay"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>Community Impact</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <HolographicCard className="holo-teal" intensity="medium">
                <div className="holo-content p-6 text-center">
                  <div className="inline-flex p-4 rounded-full metallic-teal mb-4 shine-sweep-hover">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2" style={{textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>2,847</div>
                  <div className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>Active Businesses</div>
                </div>
              </HolographicCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <HolographicCard className="holo-gold" intensity="medium">
                <div className="holo-content p-6 text-center">
                  <div className="inline-flex p-4 rounded-full metallic-gold mb-4 shine-sweep-hover">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2" style={{textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>18,392</div>
                  <div className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>Reviews Posted</div>
                </div>
              </HolographicCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <HolographicCard className="holo-bronze" intensity="medium">
                <div className="holo-content p-6 text-center">
                  <div className="inline-flex p-4 rounded-full metallic-bronze mb-4 shine-sweep-hover">
                    <ShoppingBag className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2" style={{textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>45,621</div>
                  <div className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>Orders Completed</div>
                </div>
              </HolographicCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <HolographicCard className="holo-teal" intensity="medium">
                <div className="holo-content p-6 text-center">
                  <div className="inline-flex p-4 rounded-full metallic-teal mb-4 shine-sweep-hover">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2" style={{textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>156K</div>
                  <div className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>Community Votes</div>
                </div>
              </HolographicCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Community Actions */}
      <section className="relative py-16">
        <div className="absolute inset-0 glass-tint-light"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>Get Involved</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <HolographicCard className="holo-teal" intensity="medium">
              <div className="holo-content p-8">
                <div className="inline-flex p-4 rounded-full metallic-teal mb-6 shine-sweep-hover">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>Vote for Businesses</h3>
                <p className="text-white mb-6 leading-relaxed" style={{textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>
                  Cast your vote for the monthly spotlight and support your favorites
                </p>
                <Link href="/spotlight/voting">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg">
                    <Trophy className="h-4 w-4 mr-2" />
                    Start Voting
                  </Button>
                </Link>
              </div>
            </HolographicCard>

            <HolographicCard className="holo-gold" intensity="medium">
              <div className="holo-content p-8">
                <div className="inline-flex p-4 rounded-full metallic-gold mb-6 shine-sweep-hover">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>Write Reviews</h3>
                <p className="text-white mb-6 leading-relaxed" style={{textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>
                  Share your experiences and help others discover great businesses
                </p>
                <Link href="/marketplace">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg">
                    <Star className="h-4 w-4 mr-2" />
                    Browse Businesses
                  </Button>
                </Link>
              </div>
            </HolographicCard>

            <HolographicCard className="holo-bronze" intensity="medium">
              <div className="holo-content p-8">
                <div className="inline-flex p-4 rounded-full metallic-bronze mb-6 shine-sweep-hover">
                  <ShoppingBag className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>Shop Local</h3>
                <p className="text-white mb-6 leading-relaxed" style={{textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>
                  Support Florida businesses by shopping in the marketplace
                </p>
                <Link href="/marketplace">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Shop Now
                  </Button>
                </Link>
              </div>
            </HolographicCard>
          </div>
        </div>
      </section>

      {/* Trending Businesses */}
      <section className="relative py-16">
        <div className="absolute inset-0 backdrop-visible"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
            <h2 className="text-3xl md:text-5xl font-bold flex items-center gap-3 text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>
              <TrendingUp className="h-8 w-8 text-white" />
              Trending Businesses
            </h2>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 text-sm">
              <Zap className="h-4 w-4 mr-1" />
              Live Updates
            </Badge>
          </div>
          <TrendingBusinesses limit={6} variant="full" />
        </div>
      </section>

      {/* Community Leaderboards */}
      <section className="relative py-16">
        <div className="absolute inset-0 glass-section-overlay"></div>
        <div className="container mx-auto px-4 relative z-10">
          <Leaderboard variant="full" />
        </div>
      </section>

      </div>
    </div>
  );
}
