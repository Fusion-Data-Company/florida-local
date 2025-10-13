import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Users,
  Gift,
  TrendingUp,
  Crown,
  Star,
  Sparkles,
} from "lucide-react";

interface LoyaltyData {
  accounts: {
    total: number;
    items: any[];
  };
  tiers: {
    items: any[];
    distribution: Array<{ tier: string; count: number }>;
  };
  rewards: {
    items: any[];
    total: number;
  };
  redemptions: {
    items: any[];
    pending: number;
    completed: number;
  };
  stats: {
    totalPointsIssued: number;
    totalPointsAvailable: number;
    activeMembers: number;
  };
}

export function LoyaltyAdminSection() {
  const { data: loyalty, isLoading } = useQuery<LoyaltyData>({
    queryKey: ["/api/admin/loyalty"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading loyalty data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!loyalty) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">No loyalty data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loyalty.stats.activeMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">Loyalty members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Issued</CardTitle>
            <Sparkles className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loyalty.stats.totalPointsIssued.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Available</CardTitle>
            <Award className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loyalty.stats.totalPointsAvailable.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Current balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <Gift className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loyalty.rewards.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Reward catalog</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Tier Distribution
          </CardTitle>
          <CardDescription>Member distribution across loyalty tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loyalty.tiers.distribution.map((item, index) => {
              const tier = loyalty.tiers.items.find(t => t.name === item.tier);
              const percentage = loyalty.accounts.total > 0
                ? ((item.count / loyalty.accounts.total) * 100).toFixed(1)
                : 0;

              return (
                <Card key={index} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-lg">{item.tier}</h4>
                      {index === 0 && <Star className="h-5 w-5 text-amber-500" />}
                      {index === 1 && <Star className="h-5 w-5 text-gray-400" />}
                      {index === 2 && <Star className="h-5 w-5 text-yellow-600" />}
                      {index === 3 && <Crown className="h-5 w-5 text-purple-600" />}
                    </div>
                    <div className="text-3xl font-bold">{item.count}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {percentage}% of members
                    </p>
                    {tier && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Min: {tier.pointsRequired} pts
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Loyalty Members
          </CardTitle>
          <CardDescription>Members with highest lifetime points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loyalty.accounts.items.slice(0, 10).map((account, index) => (
            <Card key={account.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">User {account.userId.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        Tier: {account.tierName} (Level {account.tierLevel})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-green-600">
                      {account.currentPoints.toLocaleString()} pts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lifetime: {account.lifetimePoints.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Rewards Catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Rewards Catalog
          </CardTitle>
          <CardDescription>Available rewards for redemption</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loyalty.rewards.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rewards available
            </div>
          ) : (
            loyalty.rewards.items.map((reward) => (
              <Card key={reward.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    {reward.imageUrl && (
                      <img
                        src={reward.imageUrl}
                        alt={reward.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{reward.name}</h4>
                          {reward.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {reward.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                              {reward.pointsCost} points
                            </Badge>
                            {reward.businessId ? (
                              <Badge variant="secondary">Business Reward</Badge>
                            ) : (
                              <Badge variant="default">Platform Reward</Badge>
                            )}
                            <Badge variant={reward.isActive ? "default" : "secondary"}>
                              {reward.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Redemptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recent Redemptions
          </CardTitle>
          <CardDescription>
            Latest reward redemptions ({loyalty.redemptions.pending} pending, {loyalty.redemptions.completed} completed)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loyalty.redemptions.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No redemptions yet
            </div>
          ) : (
            loyalty.redemptions.items.map((redemption) => (
              <Card key={redemption.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Reward ID: {redemption.rewardId.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        User: {redemption.userId.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(redemption.redeemedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">-{redemption.pointsCost} pts</p>
                      <Badge variant={
                        redemption.status === "completed" ? "default" :
                        redemption.status === "pending" ? "secondary" :
                        "outline"
                      }>
                        {redemption.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
