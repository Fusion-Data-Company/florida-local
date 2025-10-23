import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Crown,
  Star,
  TrendingUp,
  Heart,
  MessageCircle,
  ShoppingBag,
  Award,
  Zap,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  id: string;
  name: string;
  avatarUrl?: string;
  score: number;
  rank: number;
  previousRank?: number;
  badge?: string;
  stats: {
    primary: number;
    secondary?: number;
  };
}

interface LeaderboardProps {
  variant?: 'compact' | 'full';
}

export default function Leaderboard({ variant = 'full' }: LeaderboardProps) {
  const { data: topBusinesses = [], isLoading: businessesLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/businesses'],
  });

  const { data: topVoters = [], isLoading: votersLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/voters'],
  });

  const { data: topReviewers = [], isLoading: reviewersLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/reviewers'],
  });

  const { data: topBuyers = [], isLoading: buyersLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/buyers'],
  });

  const getRankBadge = (rank: number) => {
    const badges = {
      1: { icon: Crown, color: "from-yellow-400 to-orange-500", text: "1st Place" },
      2: { icon: Trophy, color: "from-gray-300 to-gray-400", text: "2nd Place" },
      3: { icon: Award, color: "from-orange-600 to-orange-700", text: "3rd Place" },
    };

    const badge = badges[rank as keyof typeof badges];
    if (!badge) return null;

    const Icon = badge.icon;
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${badge.color} text-white text-xs font-bold shadow-lg`}>
        <Icon className="h-4 w-4" />
        {badge.text}
      </div>
    );
  };

  const getRankChange = (entry: LeaderboardEntry) => {
    if (!entry.previousRank) return null;
    const change = entry.previousRank - entry.rank;
    if (change === 0) return <Badge variant="secondary" className="ml-2">—</Badge>;

    return (
      <Badge
        variant={change > 0 ? "default" : "destructive"}
        className="ml-2"
      >
        {change > 0 ? '↑' : '↓'} {Math.abs(change)}
      </Badge>
    );
  };

  const renderLeaderboardList = (
    entries: LeaderboardEntry[],
    isLoading: boolean,
    icon: React.ReactNode,
    primaryLabel: string,
    secondaryLabel?: string
  ) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No data available yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
              entry.rank <= 3 ? 'border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 text-center">
                    {entry.rank <= 3 ? (
                      <div className={`text-3xl font-bold ${
                        entry.rank === 1 ? 'text-yellow-500' :
                        entry.rank === 2 ? 'text-gray-400' :
                        'text-orange-600'
                      }`}>
                        #{entry.rank}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground">
                        #{entry.rank}
                      </div>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                    <AvatarImage src={entry.avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg">
                      {entry.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold truncate">{entry.name}</h4>
                      {getRankChange(entry)}
                    </div>
                    {entry.badge && (
                      <Badge variant="outline" className="text-xs">
                        {entry.badge}
                      </Badge>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {icon}
                        <span className="font-semibold">{entry.stats.primary}</span>
                        <span>{primaryLabel}</span>
                      </span>
                      {entry.stats.secondary !== undefined && secondaryLabel && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{entry.stats.secondary}</span>
                          <span>{secondaryLabel}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score Badge */}
                  <div className="flex-shrink-0">
                    <div className="flex flex-col items-end">
                      <div className="text-2xl font-bold text-purple-600">
                        {entry.score.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                </div>

                {/* Top 3 Badge */}
                {entry.rank <= 3 && (
                  <div className="mt-3 pt-3 border-t">
                    {getRankBadge(entry.rank)}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Businesses
          </CardTitle>
          <CardDescription>Leading the community this month</CardDescription>
        </CardHeader>
        <CardContent>
          {renderLeaderboardList(
            topBusinesses.slice(0, 5),
            businessesLoading,
            <TrendingUp className="h-3 w-3" />,
            "engagement"
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <Trophy className="h-7 w-7 text-yellow-500" />
          Community Leaderboards
        </CardTitle>
        <CardDescription className="text-base">
          Celebrating our most engaged community members and businesses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="businesses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="businesses" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Businesses</span>
            </TabsTrigger>
            <TabsTrigger value="voters" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Voters</span>
            </TabsTrigger>
            <TabsTrigger value="reviewers" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Reviewers</span>
            </TabsTrigger>
            <TabsTrigger value="buyers" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Buyers</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="businesses" className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
              <div className="flex items-center gap-2 text-purple-900">
                <Zap className="h-5 w-5" />
                <p className="text-sm font-semibold">
                  Based on total engagement, reviews, followers, and community activity
                </p>
              </div>
            </div>
            {renderLeaderboardList(
              topBusinesses,
              businessesLoading,
              <TrendingUp className="h-3 w-3" />,
              "engagement",
              "avg rating"
            )}
          </TabsContent>

          <TabsContent value="voters" className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 border border-red-200">
              <div className="flex items-center gap-2 text-red-900">
                <Heart className="h-5 w-5" />
                <p className="text-sm font-semibold">
                  Most active voters in spotlight competitions
                </p>
              </div>
            </div>
            {renderLeaderboardList(
              topVoters,
              votersLoading,
              <Heart className="h-3 w-3 fill-current" />,
              "votes cast"
            )}
          </TabsContent>

          <TabsContent value="reviewers" className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-900">
                <MessageCircle className="h-5 w-5" />
                <p className="text-sm font-semibold">
                  Most helpful and detailed reviewers
                </p>
              </div>
            </div>
            {renderLeaderboardList(
              topReviewers,
              reviewersLoading,
              <MessageCircle className="h-3 w-3" />,
              "reviews",
              "helpful votes"
            )}
          </TabsContent>

          <TabsContent value="buyers" className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
              <div className="flex items-center gap-2 text-green-900">
                <ShoppingBag className="h-5 w-5" />
                <p className="text-sm font-semibold">
                  Supporting local businesses through purchases
                </p>
              </div>
            </div>
            {renderLeaderboardList(
              topBuyers,
              buyersLoading,
              <ShoppingBag className="h-3 w-3" />,
              "orders",
              "total spent"
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
