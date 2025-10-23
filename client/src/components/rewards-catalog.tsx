import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Gift, Sparkles, Tag, TrendingUp, Check, X, Search, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  type: string;
  value: string | null;
  terms: string | null;
  expiryDays: number | null;
  isActive: boolean;
  stockQuantity: number | null;
  imageUrl: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  pointsCost: number;
  redemptionCode: string;
  status: "pending" | "active" | "used" | "expired" | "cancelled";
  expiresAt: string | null;
  usedAt: string | null;
  createdAt: string;
}

interface LoyaltyAccount {
  currentPoints: number;
}

const rewardTypeColors = {
  discount: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  gift_card: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  freebie: "bg-green-500/10 text-green-600 border-green-500/20",
  experience: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  benefit: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

const rewardTypeLabels = {
  discount: "💰 Discount",
  gift_card: "🎁 Gift Card",
  freebie: "🎉 Free Item",
  experience: "✨ Experience",
  benefit: "⭐ Special Benefit",
};

export default function RewardsCatalog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"points_asc" | "points_desc" | "newest">("points_asc");

  // Fetch loyalty account for current points
  const { data: account } = useQuery<LoyaltyAccount>({
    queryKey: ["/api/loyalty/account"],
  });

  // Fetch available rewards
  const { data: rewards, isLoading: rewardsLoading } = useQuery<Reward[]>({
    queryKey: ["/api/loyalty/rewards"],
  });

  // Fetch user's redemptions
  const { data: redemptions } = useQuery<RewardRedemption[]>({
    queryKey: ["/api/loyalty/redemptions"],
  });

  // Redeem reward mutation
  const redeemMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const response = await fetch(`/api/loyalty/rewards/${rewardId}/redeem`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to redeem reward");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/redemptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/transactions"] });

      toast({
        title: "Reward Redeemed! 🎉",
        description: `Your redemption code is: ${data.redemptionCode}`,
      });

      setShowRedeemDialog(false);
      setSelectedReward(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRedeemClick = (reward: Reward) => {
    setSelectedReward(reward);
    setShowRedeemDialog(true);
  };

  const confirmRedeem = () => {
    if (selectedReward) {
      redeemMutation.mutate(selectedReward.id);
    }
  };

  // Filter and sort rewards
  const filteredRewards = rewards
    ?.filter((reward) => {
      // Active filter
      if (!reward.isActive) return false;

      // Type filter
      if (filterType !== "all" && reward.type !== filterType) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          reward.name.toLowerCase().includes(query) ||
          reward.description?.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "points_asc":
          return a.pointsCost - b.pointsCost;
        case "points_desc":
          return b.pointsCost - a.pointsCost;
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const canAfford = (pointsCost: number) => {
    return account ? account.currentPoints >= pointsCost : false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-8 w-8 text-primary" />
            Rewards Catalog
          </h2>
          <p className="text-muted-foreground mt-1">
            Redeem your points for exclusive rewards
          </p>
        </div>
        {account && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-6 py-3">
            <div className="text-sm text-muted-foreground">Available Points</div>
            <div className="text-2xl font-bold text-primary">
              {account.currentPoints.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rewards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="discount">💰 Discounts</SelectItem>
                <SelectItem value="gift_card">🎁 Gift Cards</SelectItem>
                <SelectItem value="freebie">🎉 Free Items</SelectItem>
                <SelectItem value="experience">✨ Experiences</SelectItem>
                <SelectItem value="benefit">⭐ Benefits</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="points_asc">Points: Low to High</SelectItem>
                <SelectItem value="points_desc">Points: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Grid */}
      {rewardsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-slate-200 rounded animate-pulse w-2/3" />
                <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-24 bg-slate-200 rounded animate-pulse" />
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-slate-200 rounded animate-pulse w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredRewards && filteredRewards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward, index) => {
            const affordable = canAfford(reward.pointsCost);
            const typeColor = rewardTypeColors[reward.type as keyof typeof rewardTypeColors] || rewardTypeColors.benefit;
            const typeLabel = rewardTypeLabels[reward.type as keyof typeof rewardTypeLabels] || "⭐ Reward";

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`h-full flex flex-col ${!affordable ? "opacity-60" : ""}`}>
                  {reward.imageUrl && (
                    <div className="h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={reward.imageUrl}
                        alt={reward.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="flex-grow">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge className={`${typeColor} border`}>
                        {typeLabel}
                      </Badge>
                      {reward.stockQuantity !== null && reward.stockQuantity < 10 && (
                        <Badge variant="destructive" className="text-xs">
                          Only {reward.stockQuantity} left!
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{reward.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {reward.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Points Cost</div>
                        <div className="text-xl font-bold flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-primary" />
                          {reward.pointsCost.toLocaleString()}
                        </div>
                      </div>
                      {reward.value && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Value</span>
                          <span className="font-semibold">{reward.value}</span>
                        </div>
                      )}
                      {reward.expiryDays && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Expires</span>
                          <span className="text-sm">{reward.expiryDays} days after redemption</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleRedeemClick(reward)}
                      disabled={!affordable || redeemMutation.isPending}
                    >
                      {affordable ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Redeem Now
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Insufficient Points
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-semibold mb-2">No Rewards Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterType !== "all"
                ? "Try adjusting your filters or search terms"
                : "Check back soon for new rewards!"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active Redemptions */}
      {redemptions && redemptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Your Active Redemptions
            </CardTitle>
            <CardDescription>
              Use these codes to claim your rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {redemptions
                .filter((r) => r.status === "active" || r.status === "pending")
                .map((redemption) => {
                  const reward = rewards?.find((r) => r.id === redemption.rewardId);
                  return (
                    <div
                      key={redemption.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div>
                        <div className="font-semibold">{reward?.name || "Reward"}</div>
                        <div className="text-sm text-muted-foreground">
                          Code: <span className="font-mono font-bold">{redemption.redemptionCode}</span>
                        </div>
                        {redemption.expiresAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Expires: {new Date(redemption.expiresAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={redemption.status === "active" ? "default" : "secondary"}
                      >
                        {redemption.status}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Redeem Confirmation Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this reward?
            </DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">{selectedReward.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedReward.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Points Cost:</span>
                  <span className="text-xl font-bold text-primary">
                    {selectedReward.pointsCost.toLocaleString()}
                  </span>
                </div>
              </div>
              {account && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Current Points:</span>
                    <span className="font-semibold">{account.currentPoints.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>After Redemption:</span>
                    <span className="font-semibold">
                      {(account.currentPoints - selectedReward.pointsCost).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              {selectedReward.terms && (
                <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                  <strong>Terms:</strong> {selectedReward.terms}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRedeemDialog(false)}
              disabled={redeemMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRedeem}
              disabled={redeemMutation.isPending}
            >
              {redeemMutation.isPending ? "Redeeming..." : "Confirm Redemption"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
