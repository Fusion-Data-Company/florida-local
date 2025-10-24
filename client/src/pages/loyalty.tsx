import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Trophy, Gift, Users, Sparkles } from "lucide-react";
import LoyaltyDashboard from "@/components/loyalty-dashboard";
import RewardsCatalog from "@/components/rewards-catalog";
import ReferralCenter from "@/components/referral-center";
import { motion } from "framer-motion";

export default function LoyaltyPage() {
  return (
    <div className="min-h-screen">

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-12 w-12 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Florida Local Elite Rewards
            </h1>
            <Sparkles className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Earn points, unlock exclusive benefits, and get rewarded for supporting local Florida businesses
          </p>
        </motion.div>

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-2 bg-white/20 dark:bg-slate-900/30 shadow-lg backdrop-blur-md">
              <TabsTrigger
                value="dashboard"
                className="flex items-center gap-2 py-3 text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
              >
                <Trophy className="h-5 w-5" />
                <span className="hidden sm:inline">My Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger
                value="rewards"
                className="flex items-center gap-2 py-3 text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                <Gift className="h-5 w-5" />
                <span className="hidden sm:inline">Rewards Catalog</span>
                <span className="sm:hidden">Rewards</span>
              </TabsTrigger>
              <TabsTrigger
                value="referrals"
                className="flex items-center gap-2 py-3 text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white"
              >
                <Users className="h-5 w-5" />
                <span className="hidden sm:inline">Refer & Earn</span>
                <span className="sm:hidden">Referrals</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>

          {/* Tab Content */}
          <TabsContent value="dashboard" className="mt-0">
            <LoyaltyDashboard />
          </TabsContent>

          <TabsContent value="rewards" className="mt-0">
            <RewardsCatalog />
          </TabsContent>

          <TabsContent value="referrals" className="mt-0">
            <ReferralCenter />
          </TabsContent>
        </Tabs>

        {/* How to Earn Points Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12"
        >
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-purple/5 border-primary/20">
            <h2 className="text-2xl font-bold mb-6 text-center text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>Ways to Earn Points</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🛍️</span>
                </div>
                <h3 className="font-semibold mb-2 text-white" style={{textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>Make Purchases</h3>
                <p className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
                  Earn 1 point per $1 spent (multiplied by your tier level)
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">⭐</span>
                </div>
                <h3 className="font-semibold mb-2 text-white" style={{textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>Leave Reviews</h3>
                <p className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
                  Earn 50 points for reviews, 100 points with photos
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">👥</span>
                </div>
                <h3 className="font-semibold mb-2 text-white" style={{textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>Refer Friends</h3>
                <p className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
                  Earn 200 points per signup, 500 bonus on first purchase
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">📱</span>
                </div>
                <h3 className="font-semibold mb-2 text-white" style={{textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}>Share on Social</h3>
                <p className="text-sm text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
                  Earn 25 points per share (max 100 points per day)
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tier Benefits Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>Membership Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Bronze */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-700/10 border-2 border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">🥉</div>
                <h3 className="text-xl font-bold mb-2 text-white" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>Bronze</h3>
                <div className="text-2xl font-bold text-white mb-4" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>0+ Points</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>0% discount</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>1x points multiplier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Basic rewards access</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Silver */}
            <Card className="bg-gradient-to-br from-slate-400/10 to-slate-600/10 border-2 border-slate-500/20 hover:border-slate-500/40 transition-all">
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">🥈</div>
                <h3 className="text-xl font-bold mb-2 text-white" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>Silver</h3>
                <div className="text-2xl font-bold text-white mb-4" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>500+ Points</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>5% discount</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>1.25x points multiplier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Free shipping $50+</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Gold */}
            <Card className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border-2 border-yellow-500/20 hover:border-yellow-500/40 transition-all">
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">🥇</div>
                <h3 className="text-xl font-bold mb-2 text-white" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>Gold</h3>
                <div className="text-2xl font-bold text-white mb-4" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>2,000+ Points</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>10% discount</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>1.5x points multiplier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Free shipping $25+</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Platinum */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-2 border-purple-500/20 hover:border-purple-500/40 transition-all">
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">💎</div>
                <h3 className="text-xl font-bold mb-2 text-white" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>Platinum</h3>
                <div className="text-2xl font-bold text-white mb-4" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>5,000+ Points</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>15% discount</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>2x points multiplier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Always free shipping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>VIP early access</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
