import EliteNavigationHeader from "@/components/elite-navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import Leaderboard from "@/components/community/Leaderboard";
import TrendingBusinesses from "@/components/spotlight/TrendingBusinesses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Heart, MessageCircle, ShoppingBag, TrendingUp, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function CommunityPage() {
  return (
    <div className="premium-page-wrapper premium-surface min-h-screen marble-texture">
      <EliteNavigationHeader />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <Users className="h-16 w-16" />
              <h1 className="text-6xl font-bold">Florida Local Community</h1>
            </div>
            <p className="text-2xl opacity-90 max-w-3xl mx-auto">
              Join Florida's most vibrant community of local businesses and supporters
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Community Stats Overview */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Community Impact</h2>
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
                  <div className="text-4xl font-bold text-purple-600 mb-2">2,847</div>
                  <div className="text-sm text-muted-foreground">Active Businesses</div>
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
                  <div className="text-4xl font-bold text-blue-600 mb-2">18,392</div>
                  <div className="text-sm text-muted-foreground">Reviews Posted</div>
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
                  <div className="text-4xl font-bold text-green-600 mb-2">45,621</div>
                  <div className="text-sm text-muted-foreground">Orders Completed</div>
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
                  <div className="text-4xl font-bold text-orange-600 mb-2">156K</div>
                  <div className="text-sm text-muted-foreground">Community Votes</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Community Actions */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Get Involved</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="inline-flex p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-4">
                  <Trophy className="h-6 w-6" />
                </div>
                <CardTitle>Vote for Businesses</CardTitle>
                <CardDescription>
                  Cast your vote for the monthly spotlight and support your favorites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/spotlight/voting">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                    <Trophy className="h-4 w-4 mr-2" />
                    Start Voting
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="inline-flex p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white mb-4">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <CardTitle>Write Reviews</CardTitle>
                <CardDescription>
                  Share your experiences and help others discover great businesses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/marketplace">
                  <Button className="w-full" variant="outline">
                    <Star className="h-4 w-4 mr-2" />
                    Browse Businesses
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="inline-flex p-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white mb-4">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <CardTitle>Shop Local</CardTitle>
                <CardDescription>
                  Support Florida businesses by shopping in the marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
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
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
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

      <MobileBottomNav />
    </div>
  );
}
