import VotingInterface from "@/components/spotlight/VotingInterface";
import TrendingBusinesses from "@/components/spotlight/TrendingBusinesses";
import { WinnerBanner } from "@/components/spotlight/WinnerAnnouncement";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Heart, TrendingUp, Crown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function SpotlightVotingPage() {
  const { data: pastWinners = [] } = useQuery({
    queryKey: ['/api/spotlight/past-winners'],
  });

  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen relative"
      style={{
        backgroundImage: "url('/backgrounds/colorful-painting-with-black-background-white-blue-background_380557-143.avif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/88 via-purple-50/85 to-pink-50/85 backdrop-blur-sm" />
      <div className="relative z-10">

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="absolute inset-0 opacity-20">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <Trophy className="h-16 w-16" />
              <h1 className="text-6xl font-bold">Monthly Spotlight</h1>
              <Crown className="h-16 w-16" />
            </div>
            <p className="text-2xl opacity-90 max-w-3xl mx-auto mb-8">
              Vote for your favorite Florida businesses and help them win the spotlight!
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 flex items-center gap-3">
                  <Heart className="h-8 w-8" />
                  <div className="text-left">
                    <div className="text-3xl font-bold">5 Votes</div>
                    <div className="text-sm opacity-80">per user/month</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 flex items-center gap-3">
                  <Crown className="h-8 w-8" />
                  <div className="text-left">
                    <div className="text-3xl font-bold">1 Winner</div>
                    <div className="text-sm opacity-80">every month</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 flex items-center gap-3">
                  <Sparkles className="h-8 w-8" />
                  <div className="text-left">
                    <div className="text-3xl font-bold">Featured</div>
                    <div className="text-sm opacity-80">on homepage</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Main Voting Interface */}
        <section>
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>
            <Trophy className="h-8 w-8 text-white" />
            Cast Your Votes
          </h2>
          <VotingInterface variant="dedicated" />
        </section>

        {/* Trending Businesses */}
        <section>
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>
            <TrendingUp className="h-8 w-8 text-white" />
            Trending This Week
          </h2>
          <TrendingBusinesses limit={6} variant="full" />
        </section>

        {/* Past Winners */}
        {pastWinners.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>
              <Crown className="h-8 w-8 text-white" />
              Past Winners
            </h2>
            <div className="space-y-4">
              {pastWinners.map((winner: any) => (
                <WinnerBanner key={winner.id} winner={winner} />
              ))}
            </div>
          </section>
        )}
      </div>

      </div>
    </div>
  );
}
