import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Business } from "@shared/types";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  Trophy,
  TrendingUp,
  Star,
  Users,
  Zap,
  Crown,
  ArrowUp,
  Check,
  Loader2,
  Clock,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays } from "date-fns";

interface VotingBusiness {
  id: string;
  name: string;
  category: string;
  tagline?: string;
  logoUrl?: string;
  rating?: number;
  reviewCount?: number;
  voteCount: number;
  voteTrend: number; // +/- percentage from last period
  rank: number;
  previousRank?: number;
  isRising: boolean;
}

interface VotingStats {
  totalVotes: number;
  totalVoters: number;
  userVotesRemaining: number;
  votingEndsAt: Date;
  currentLeader: string;
}

interface VotingInterfaceProps {
  variant?: 'homepage' | 'dedicated';
  limit?: number;
}

export default function VotingInterface({
  variant = 'homepage',
  limit = 6
}: VotingInterfaceProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [votedBusinessIds, setVotedBusinessIds] = useState<Set<string>>(new Set());

  // Fetch eligible businesses for voting
  const { data: eligibleBusinesses = [], isLoading: businessesLoading } = useQuery<VotingBusiness[]>({
    queryKey: ['/api/spotlight/voting/eligible', limit],
    refetchInterval: 10000, // Refresh every 10 seconds for live updates
  });

  // Fetch voting stats
  const { data: votingStats, isLoading: statsLoading } = useQuery<VotingStats>({
    queryKey: ['/api/spotlight/voting/stats'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch user's voted businesses
  const { data: userVotes = [] } = useQuery<string[]>({
    queryKey: ['/api/spotlight/voting/my-votes'],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (userVotes) {
      setVotedBusinessIds(prev => {
        const newSet = new Set(userVotes);
        const hasChanged = prev.size !== newSet.size || 
          [...newSet].some(id => !prev.has(id));
        return hasChanged ? newSet : prev;
      });
    }
  }, [userVotes]);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (businessId: string) => {
      return await apiRequest('POST', '/api/spotlight/vote', { businessId });
    },
    onSuccess: (_, businessId) => {
      setVotedBusinessIds(prev => new Set([...prev, businessId]));
      toast({
        title: "Vote Cast! 🎉",
        description: "Your vote has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/spotlight/voting/eligible'] });
      queryClient.invalidateQueries({ queryKey: ['/api/spotlight/voting/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/spotlight/voting/my-votes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Vote Failed",
        description: error.message || "Failed to cast your vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = (businessId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to vote for your favorite businesses.",
        variant: "destructive",
      });
      return;
    }

    if (votingStats && votingStats.userVotesRemaining <= 0) {
      toast({
        title: "No Votes Remaining",
        description: "You've used all your votes for this month.",
        variant: "destructive",
      });
      return;
    }

    setSelectedBusinessId(businessId);
    voteMutation.mutate(businessId);
  };

  const getRankBadge = (rank: number) => {
    const badges = {
      1: { icon: Crown, className: "metallic-gold", text: "text-white" },
      2: { icon: Trophy, className: "metallic-chrome", text: "text-gray-900" },
      3: { icon: Trophy, className: "metallic-bronze", text: "text-white" },
    };

    const badge = badges[rank as keyof typeof badges];
    if (!badge) return null;

    const Icon = badge.icon;
    return (
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${badge.className} shine-sweep-hover shadow-lg`}>
        <Icon className={`h-5 w-5 ${badge.text}`} />
      </div>
    );
  };

  const getRankChange = (business: VotingBusiness) => {
    if (!business.previousRank) return null;
    const change = business.previousRank - business.rank;
    if (change === 0) return null;

    return (
      <Badge
        variant={change > 0 ? "default" : "destructive"}
        className="ml-2"
      >
        <ArrowUp className={`h-3 w-3 mr-1 ${change < 0 ? 'rotate-180' : ''}`} />
        {Math.abs(change)}
      </Badge>
    );
  };

  const getTimeRemaining = () => {
    if (!votingStats) return "";
    const days = differenceInDays(new Date(votingStats.votingEndsAt), new Date());
    if (days > 1) return `${days} days remaining`;
    if (days === 1) return "1 day remaining";
    return "Ends today";
  };

  if (businessesLoading || statsLoading) {
    return (
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <CardTitle>Loading Spotlight Voting...</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'homepage') {
    return (
      <Card className="glass-card-futuristic border-2 metallic-border-animated overflow-hidden">
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="metallic-chrome p-3 rounded-full shine-sweep-hover">
                <Trophy className="h-6 w-6 text-gray-900" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="metallic-gradient-text">Monthly Spotlight Voting</span>
                  <Badge className="led-badge-live px-3 py-1 rounded-full">
                    <Flame className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base font-medium text-gray-700">
                  Vote for your favorite Florida businesses
                </CardDescription>
              </div>
            </div>
            {votingStats && (
              <div className="text-right">
                <div className="text-sm text-gray-600 flex items-center gap-1 justify-end mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{getTimeRemaining()}</span>
                </div>
                <div className="led-counter inline-block px-4 py-1 rounded-lg">
                  {votingStats.totalVotes.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 mt-1 font-medium">total votes</div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Votes Remaining */}
          {isAuthenticated && votingStats && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">
                    Your Votes: {votingStats.userVotesRemaining} remaining
                  </span>
                </div>
                <Badge variant="outline" className="text-blue-700">
                  {userVotes.length} cast
                </Badge>
              </div>
              <Progress
                value={(votingStats.userVotesRemaining / 5) * 100}
                className="h-2"
              />
            </motion.div>
          )}

          {/* Top 3 Businesses */}
          <div className="grid gap-3">
            {eligibleBusinesses.slice(0, 3).map((business, index) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="apple-hover-depth"
              >
                <Card className={`frosted-panel overflow-hidden transition-all duration-300 ${
                  business.rank === 1 ? 'metallic-border-animated border-2' : 'border border-white/30'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0">
                        {getRankBadge(business.rank)}
                      </div>

                      {/* Business Logo */}
                      <Avatar className="h-10 w-10 border-2 border-white/50 shadow-md">
                        <AvatarImage src={business.logoUrl} />
                        <AvatarFallback className="metallic-chrome text-gray-900 font-bold">
                          {business.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Business Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-bold text-base truncate text-gray-900">{business.name}</h4>
                          {getRankChange(business)}
                          {business.isRising && (
                            <Badge className="metallic-teal text-white px-2 py-0.5 text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Rising
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 truncate font-medium">
                          {business.tagline || business.category}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs">
                          <span className="flex items-center gap-1 font-semibold text-gray-700">
                            <Heart className="h-3 w-3 fill-current text-red-500" />
                            {business.voteCount}
                          </span>
                          {business.voteTrend !== 0 && (
                            <Badge className={`px-2 py-0.5 text-xs ${
                              business.voteTrend > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                              <TrendingUp className={`h-3 w-3 mr-0.5 ${business.voteTrend < 0 ? 'rotate-180' : ''}`} />
                              {business.voteTrend > 0 ? '+' : ''}{business.voteTrend}%
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Vote Button */}
                      <div className="flex-shrink-0">
                        {votedBusinessIds.has(business.id) ? (
                          <Button disabled className="metallic-teal text-white px-4 py-2 h-9">
                            <Check className="h-4 w-4 mr-1" />
                            Voted
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleVote(business.id)}
                            disabled={voteMutation.isPending && selectedBusinessId === business.id}
                            className="metallic-chrome text-gray-900 hover:shadow-lg px-4 py-2 h-9 shine-sweep-hover metallic-button-press"
                          >
                            {voteMutation.isPending && selectedBusinessId === business.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Heart className="h-4 w-4 mr-1" />
                                Vote
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* View All Link */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = '/spotlight/voting'}
          >
            View All Candidates ({eligibleBusinesses.length})
            <ArrowUp className="h-4 w-4 ml-2 rotate-90" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Dedicated page variant with full list
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      {votingStats && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{votingStats.totalVotes.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Votes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{votingStats.totalVoters.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Voters</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100">
                  <Crown className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-lg font-bold truncate">{votingStats.currentLeader}</div>
                  <div className="text-sm text-muted-foreground">Current Leader</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-lg font-bold">{getTimeRemaining()}</div>
                  <div className="text-sm text-muted-foreground">Time Left</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* All Businesses Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {eligibleBusinesses.map((business, index) => (
          <motion.div
            key={business.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
              business.rank <= 3 ? 'border-2 border-purple-200' : ''
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl font-bold text-muted-foreground">
                      #{business.rank}
                    </div>
                    {business.rank <= 3 && getRankBadge(business.rank)}
                  </div>

                  {/* Business Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                          <AvatarImage src={business.logoUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-bold">
                            {business.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-xl">{business.name}</h3>
                            {getRankChange(business)}
                          </div>
                          <p className="text-sm text-muted-foreground">{business.category}</p>
                          {business.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-semibold">{business.rating}</span>
                              <span className="text-xs text-muted-foreground">
                                ({business.reviewCount} reviews)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {business.tagline && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {business.tagline}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 font-semibold">
                          <Heart className="h-4 w-4 fill-current text-red-500" />
                          {business.voteCount} votes
                        </span>
                        {business.voteTrend !== 0 && (
                          <Badge variant={business.voteTrend > 0 ? "default" : "destructive"}>
                            {business.voteTrend > 0 ? '+' : ''}{business.voteTrend}%
                          </Badge>
                        )}
                        {business.isRising && (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">
                            <Zap className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>

                      {votedBusinessIds.has(business.id) ? (
                        <Button disabled className="bg-green-500 text-white">
                          <Check className="h-4 w-4 mr-2" />
                          Voted
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleVote(business.id)}
                          disabled={voteMutation.isPending && selectedBusinessId === business.id}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          {voteMutation.isPending && selectedBusinessId === business.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Heart className="h-4 w-4 mr-2" />
                              Vote
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
