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

export default function CommunityPage() {
  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen relative"
      style={{
        backgroundImage: "url('/backgrounds/abstract-composition-with-intertwined-orange-blue-curves-wave-aig51_31965-634212.avif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
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

      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Community Stats Overview */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>Community Impact</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-4 rounded-full bg-purple-100 mb-4">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>2,847</div>
                  <div className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>Active Businesses</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-4 rounded-full bg-blue-100 mb-4">
                    <Star className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>18,392</div>
                  <div className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>Reviews Posted</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-2 border-green-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-4 rounded-full bg-green-100 mb-4">
                    <ShoppingBag className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>45,621</div>
                  <div className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>Orders Completed</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-2 border-orange-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-4 rounded-full bg-orange-100 mb-4">
                    <Heart className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>156K</div>
                  <div className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>Community Votes</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Community Actions */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>Get Involved</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="marble-texture hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader className="marble-content">
                <div className="inline-flex p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-4">
                  <Trophy className="h-6 w-6" />
                </div>
                <CardTitle>Vote for Businesses</CardTitle>
                <CardDescription>
                  Cast your vote for the monthly spotlight and support your favorites
                </CardDescription>
              </CardHeader>
              <CardContent className="marble-content">
                <Link href="/spotlight/voting">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                    <Trophy className="h-4 w-4 mr-2" />
                    Start Voting
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="marble-texture hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader className="marble-content">
                <div className="inline-flex p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white mb-4">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <CardTitle>Write Reviews</CardTitle>
                <CardDescription>
                  Share your experiences and help others discover great businesses
                </CardDescription>
              </CardHeader>
              <CardContent className="marble-content">
                <Link href="/marketplace">
                  <Button className="w-full" variant="outline">
                    <Star className="h-4 w-4 mr-2" />
                    Browse Businesses
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="marble-texture hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader className="marble-content">
                <div className="inline-flex p-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white mb-4">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <CardTitle>Shop Local</CardTitle>
                <CardDescription>
                  Support Florida businesses by shopping in the marketplace
                </CardDescription>
              </CardHeader>
              <CardContent className="marble-content">
                <Link href="/marketplace">
                  <Button className="w-full" variant="outline">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Shop Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Trending Businesses */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold flex items-center gap-3 text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>
              <TrendingUp className="h-8 w-8 text-white" />
              Trending Businesses
            </h2>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <Zap className="h-3 w-3 mr-1" />
              Live Updates
            </Badge>
          </div>
          <TrendingBusinesses limit={6} variant="full" />
        </section>

        {/* Community Leaderboards */}
        <section>
          <Leaderboard variant="full" />
        </section>
      </div>
      </div>
    </div>
  );
}
