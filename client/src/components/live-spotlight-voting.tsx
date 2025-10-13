import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Trophy, Users, Zap, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SpotlightCandidate {
  id: string;
  businessId: string;
  businessName: string;
  businessLogo?: string;
  category: string;
  votes: number;
  rank: number;
  previousRank: number;
  trend: "up" | "down" | "stable";
  recentVotes: number; // Votes in last minute
  percentage: number;
}

interface LiveSpotlightVotingProps {
  categoryId: string;
  categoryName: string;
  userBusinessId?: string;
  onVote?: (businessId: string) => void;
  showRankings?: boolean;
  maxCandidates?: number;
  className?: string;
}

/**
 * Live Spotlight Voting Component
 *
 * Real-time voting visualization with live updates, rank changes,
 * and animated vote counts.
 *
 * @param categoryId - Category to display voting for
 * @param categoryName - Display name of category
 * @param userBusinessId - Current user's business (if any)
 * @param onVote - Callback when user votes
 * @param showRankings - Show rank numbers (default: true)
 * @param maxCandidates - Max candidates to display (default: 10)
 * @param className - Additional Tailwind classes
 */
export default function LiveSpotlightVoting({
  categoryId,
  categoryName,
  userBusinessId,
  onVote,
  showRankings = true,
  maxCandidates = 10,
  className = ""
}: LiveSpotlightVotingProps) {
  const [candidates, setCandidates] = useState<SpotlightCandidate[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [recentVoter, setRecentVoter] = useState<string | null>(null);

  // Initialize data and simulate real-time updates
  useEffect(() => {
    setIsLive(true);

    // Mock initial data
    const mockCandidates: SpotlightCandidate[]= [
      {
        id: "1",
        businessId: "bus1",
        businessName: "Miami Beach Boutique",
        category: categoryName,
        votes: 247,
        rank: 1,
        previousRank: 2,
        trend: "up",
        recentVotes: 12,
        percentage: 28.5,
      },
      {
        id: "2",
        businessId: "bus2",
        businessName: "Sunset Wellness Spa",
        category: categoryName,
        votes: 235,
        rank: 2,
        previousRank: 1,
        trend: "down",
        recentVotes: 8,
        percentage: 27.1,
      },
      {
        id: "3",
        businessId: "bus3",
        businessName: "Ocean View Restaurant",
        category: categoryName,
        votes: 198,
        rank: 3,
        previousRank: 3,
        trend: "stable",
        recentVotes: 10,
        percentage: 22.8,
      },
      {
        id: "4",
        businessId: "bus4",
        businessName: "Art Gallery Downtown",
        category: categoryName,
        votes: 187,
        rank: 4,
        previousRank: 5,
        trend: "up",
        recentVotes: 15,
        percentage: 21.6,
      },
    ];

    setCandidates(mockCandidates);
    setTotalVotes(mockCandidates.reduce((sum, c) => sum + c.votes, 0));

    // Simulate live vote updates
    const interval = setInterval(() => {
      setCandidates((prev) => {
        const updated = [...prev];
        const randomIndex = Math.floor(Math.random() * updated.length);
        const voteIncrease = Math.floor(Math.random() * 3) + 1;

        updated[randomIndex] = {
          ...updated[randomIndex],
          votes: updated[randomIndex].votes + voteIncrease,
          recentVotes: updated[randomIndex].recentVotes + voteIncrease,
        };

        // Recalculate percentages
        const newTotal = updated.reduce((sum, c) => sum + c.votes, 0);
        updated.forEach((c) => {
          c.percentage = (c.votes / newTotal) * 100;
        });

        // Update ranks
        updated.sort((a, b) => b.votes - a.votes);
        updated.forEach((c, i) => {
          c.previousRank = c.rank;
          c.rank = i + 1;
          c.trend = c.rank < c.previousRank ? "up" : c.rank > c.previousRank ? "down" : "stable";
        });

        setTotalVotes(newTotal);
        setRecentVoter(updated[randomIndex].businessName);
        setTimeout(() => setRecentVoter(null), 2000);

        return updated;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [categoryId, categoryName]);

  const handleVote = (businessId: string) => {
    // Optimistic update
    setCandidates((prev) =>
      prev.map((c) =>
        c.businessId === businessId
          ? { ...c, votes: c.votes + 1, recentVotes: c.recentVotes + 1 }
          : c
      )
    );

    setTotalVotes((prev) => prev + 1);

    if (onVote) {
      onVote(businessId);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0">
          <Trophy className="w-3 h-3 mr-1" />
          #1
        </Badge>
      );
    }
    if (rank === 2) {
      return (
        <Badge className="bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 border-0">
          #2
        </Badge>
      );
    }
    if (rank === 3) {
      return (
        <Badge className="bg-gradient-to-r from-amber-600 to-amber-800 text-white border-0">
          #3
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-50">
        #{rank}
      </Badge>
    );
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") {
      return <ChevronUp className="w-4 h-4 text-emerald-600" />;
    }
    if (trend === "down") {
      return <ChevronDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  return (
    <Card className={`entrance-fade-up ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-pink-600" />
              {categoryName} Spotlight
            </CardTitle>
            <CardDescription>Live voting results</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                LIVE
              </Badge>
            )}
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
              <Users className="w-3 h-3 mr-1" />
              {totalVotes.toLocaleString()} votes
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Recent vote notification */}
        <AnimatePresence>
          {recentVoter && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-4 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200"
            >
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-900">
                  New vote for {recentVoter}!
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Candidates list */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {candidates.slice(0, maxCandidates).map((candidate, index) => (
              <motion.div
                key={candidate.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  layout: { type: "spring", stiffness: 300, damping: 30 },
                }}
                className={`
                  relative overflow-hidden rounded-xl border-2
                  ${candidate.businessId === userBusinessId ? "border-purple-400 bg-purple-50" : "border-gray-200 bg-white"}
                  hover:border-purple-300 hover:shadow-lg
                  transition-all duration-300
                `}
              >
                {/* Rank change animation */}
                {candidate.trend !== "stable" && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute top-2 left-2 z-10"
                  >
                    {getTrendIcon(candidate.trend)}
                  </motion.div>
                )}

                {/* New votes pulse */}
                {candidate.recentVotes > 0 && (
                  <motion.div
                    className="absolute top-0 right-0 bottom-0 left-0 bg-purple-400/10"
                    animate={{
                      opacity: [0, 0.3, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                )}

                <div className="relative p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {/* Rank badge */}
                    {showRankings && (
                      <div className="flex-shrink-0">
                        {getRankBadge(candidate.rank)}
                      </div>
                    )}

                    {/* Business info */}
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <Avatar className="w-10 h-10 border-2 border-white shadow">
                        {candidate.businessLogo ? (
                          <AvatarImage src={candidate.businessLogo} alt={candidate.businessName} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white font-semibold">
                            {candidate.businessName.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {candidate.businessName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">
                            {candidate.votes.toLocaleString()} votes
                          </span>
                          {candidate.recentVotes > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs px-1.5 py-0">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                              +{candidate.recentVotes} live
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Vote button */}
                    <Button
                      size="sm"
                      onClick={() => handleVote(candidate.businessId)}
                      disabled={candidate.businessId === userBusinessId}
                      className={`
                        flex-shrink-0
                        ${candidate.businessId === userBusinessId ? "" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"}
                      `}
                    >
                      {candidate.businessId === userBusinessId ? "Your Business" : "Vote"}
                    </Button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Vote share</span>
                      <motion.span
                        key={candidate.percentage}
                        initial={{ scale: 1.2, color: "#9333ea" }}
                        animate={{ scale: 1, color: "#6b7280" }}
                        className="font-semibold"
                      >
                        {candidate.percentage.toFixed(1)}%
                      </motion.span>
                    </div>
                    <motion.div
                      className="relative"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Progress
                        value={candidate.percentage}
                        className="h-2"
                      />
                      {/* Animated shimmer effect for leaders */}
                      {candidate.rank <= 3 && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          animate={{
                            x: ["-100%", "100%"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                          }}
                        />
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer stats */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Updated in real-time</span>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="font-medium">
                {candidates.reduce((sum, c) => sum + c.recentVotes, 0)} votes in last minute
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact Spotlight Widget
 *
 * Smaller version showing top 3 candidates
 */
interface LiveSpotlightWidgetProps {
  categoryId: string;
  categoryName: string;
  className?: string;
}

export function LiveSpotlightWidget({
  categoryId,
  categoryName,
  className = ""
}: LiveSpotlightWidgetProps) {
  const [topThree, setTopThree] = useState<SpotlightCandidate[]>([]);

  useEffect(() => {
    // Mock data for top 3
    setTopThree([
      {
        id: "1",
        businessId: "bus1",
        businessName: "Miami Beach Boutique",
        category: categoryName,
        votes: 247,
        rank: 1,
        previousRank: 1,
        trend: "stable",
        recentVotes: 12,
        percentage: 35,
      },
      {
        id: "2",
        businessId: "bus2",
        businessName: "Sunset Wellness",
        category: categoryName,
        votes: 235,
        rank: 2,
        previousRank: 2,
        trend: "stable",
        recentVotes: 8,
        percentage: 33,
      },
      {
        id: "3",
        businessId: "bus3",
        businessName: "Ocean View",
        category: categoryName,
        votes: 198,
        rank: 3,
        previousRank: 3,
        trend: "stable",
        recentVotes: 10,
        percentage: 28,
      },
    ]);
  }, [categoryId, categoryName]);

  return (
    <Card className={`entrance-fade-up ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            {categoryName}
          </h4>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse" />
            LIVE
          </Badge>
        </div>
        <div className="space-y-2">
          {topThree.map((candidate, index) => (
            <div key={candidate.id} className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-400 w-6">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {candidate.businessName}
                </p>
                <Progress value={candidate.percentage} className="h-1.5 mt-1" />
              </div>
              <span className="text-xs font-semibold text-gray-600">
                {candidate.votes}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
