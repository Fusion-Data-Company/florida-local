import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Gift, Award, Crown, Star, Sparkles, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useState, useEffect } from "react";

interface LoyaltyAccount {
  id: string;
  userId: string;
  currentPoints: number;
  lifetimePoints: number;
  tierId: string | null;
  tierName: string;
  tierLevel: number;
  streakDays: number;
  lastActivityDate: string | null;
  anniversaryDate: string;
  createdAt: string;
  updatedAt: string;
}

interface TierProgress {
  currentTier: {
    id: string;
    name: string;
    level: number;
    pointsRequired: number;
    benefits: any;
    discountPercentage: string;
    multiplier: string;
  } | null;
  nextTier: {
    id: string;
    name: string;
    level: number;
    pointsRequired: number;
    benefits: any;
    discountPercentage: string;
    multiplier: string;
  } | null;
  pointsToNextTier: number;
  progressPercentage: number;
}

interface Transaction {
  id: string;
  userId: string;
  type: "earn" | "redeem" | "expire" | "adjust";
  points: number;
  source: string;
  sourceId: string | null;
  description: string | null;
  metadata: any;
  createdAt: string;
}

interface TransactionsSummary {
  totalEarned: number;
  totalRedeemed: number;
  totalExpired: number;
  netPoints: number;
}

const tierIcons = {
  Bronze: Trophy,
  Silver: Award,
  Gold: Crown,
  Platinum: Sparkles,
};

const tierColors = {
  Bronze: "from-orange-600 to-orange-800",
  Silver: "from-slate-400 to-slate-600",
  Gold: "from-yellow-400 to-yellow-600",
  Platinum: "from-purple-500 to-pink-600",
};

const tierGradients = {
  Bronze: "bg-gradient-to-br from-orange-500/20 to-orange-700/20 border-orange-500",
  Silver: "bg-gradient-to-br from-slate-400/20 to-slate-600/20 border-slate-500",
  Gold: "bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border-yellow-500",
  Platinum: "bg-gradient-to-br from-purple-500/20 to-pink-600/20 border-purple-500",
};

export default function LoyaltyDashboard() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch loyalty account
  const { data: account, isLoading: accountLoading } = useQuery<LoyaltyAccount>({
    queryKey: ["/api/loyalty/account"],
  });

  // Fetch tier progress
  const { data: tierProgress, isLoading: tierLoading } = useQuery<TierProgress>({
    queryKey: ["/api/loyalty/tier/progress"],
    enabled: !!account,
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/loyalty/transactions"],
    enabled: !!account,
  });

  // Fetch transaction summary
  const { data: summary, isLoading: summaryLoading } = useQuery<TransactionsSummary>({
    queryKey: ["/api/loyalty/transactions/summary"],
    enabled: !!account,
  });

  // Trigger confetti on tier upgrade
  useEffect(() => {
    if (tierProgress?.progressPercentage === 100) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [tierProgress?.progressPercentage]);

  const isLoading = accountLoading || tierLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-8 bg-slate-200 rounded animate-pulse w-1/3" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-slate-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Join Our Loyalty Program</CardTitle>
          <CardDescription>
            Earn points with every purchase and unlock exclusive rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Enroll Now</Button>
        </CardContent>
      </Card>
    );
  }

  const TierIcon = tierIcons[account.tierName as keyof typeof tierIcons] || Trophy;
  const tierColor = tierColors[account.tierName as keyof typeof tierColors];
  const tierGradient = tierGradients[account.tierName as keyof typeof tierGradients];

  return (
    <div className="space-y-6">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Hero Card - Current Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={`${tierGradient} border-2 overflow-hidden`}>
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <TierIcon className="w-full h-full" />
          </div>
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold flex items-center gap-3">
                  <TierIcon className="h-8 w-8" />
                  {account.tierName} Member
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Member since {new Date(account.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Level {account.tierLevel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6">
            {/* Points Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Current Points</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {account.currentPoints.toLocaleString()}
                </div>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Lifetime Points</div>
                <div className="text-3xl font-bold">
                  {account.lifetimePoints.toLocaleString()}
                </div>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Current Streak</div>
                <div className="text-3xl font-bold flex items-center gap-2">
                  🔥 {account.streakDays} days
                </div>
              </div>
            </div>

            {/* Tier Progress */}
            {tierProgress && tierProgress.nextTier && (
              <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">
                    Progress to {tierProgress.nextTier.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tierProgress.pointsToNextTier.toLocaleString()} points to go
                  </div>
                </div>
                <Progress value={tierProgress.progressPercentage} className="h-3" />
                <div className="mt-2 text-xs text-muted-foreground">
                  {tierProgress.progressPercentage.toFixed(1)}% complete
                </div>
              </div>
            )}

            {tierProgress && !tierProgress.nextTier && (
              <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-4 text-center">
                <Crown className="h-12 w-12 mx-auto mb-2 text-purple-600" />
                <div className="text-lg font-bold">Maximum Tier Achieved!</div>
                <div className="text-sm text-muted-foreground">
                  You're at the highest tier. Keep earning points for rewards!
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tier Benefits */}
      {tierProgress?.currentTier && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Your {account.tierName} Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Gift className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">
                      {tierProgress.currentTier.discountPercentage}% Discount
                    </div>
                    <div className="text-sm text-muted-foreground">
                      On all purchases
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">
                      {tierProgress.currentTier.multiplier}x Points Multiplier
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Earn points faster
                    </div>
                  </div>
                </div>
                {tierProgress.currentTier.benefits && (
                  <>
                    {Object.entries(tierProgress.currentTier.benefits as Record<string, any>).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                        >
                          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <div className="font-semibold capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {typeof value === "boolean" ? "Included" : value}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Activity Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <Tabs defaultValue="recent" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recent">Recent Activity</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="recent" className="space-y-4">
                {transactionsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-slate-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.slice(0, 10).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              transaction.type === "earn"
                                ? "bg-green-500/20 text-green-600"
                                : transaction.type === "redeem"
                                ? "bg-blue-500/20 text-blue-600"
                                : "bg-red-500/20 text-red-600"
                            }`}
                          >
                            {transaction.type === "earn" ? (
                              <TrendingUp className="h-5 w-5" />
                            ) : transaction.type === "redeem" ? (
                              <Gift className="h-5 w-5" />
                            ) : (
                              <span className="text-xs">⏱️</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {transaction.description || transaction.source}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString()} at{" "}
                              {new Date(transaction.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            transaction.type === "earn"
                              ? "text-green-600"
                              : transaction.type === "redeem"
                              ? "text-blue-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "earn" ? "+" : "-"}
                          {transaction.points.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <div>No activity yet</div>
                    <div className="text-sm">
                      Start earning points by making purchases and engaging with businesses!
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                {summaryLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-slate-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : summary ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Total Earned</div>
                      <div className="text-2xl font-bold text-green-600">
                        +{summary.totalEarned.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Total Redeemed</div>
                      <div className="text-2xl font-bold text-blue-600">
                        -{summary.totalRedeemed.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Expired</div>
                      <div className="text-2xl font-bold text-red-600">
                        -{summary.totalExpired.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Net Points</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {summary.netPoints.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ) : null}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
}
