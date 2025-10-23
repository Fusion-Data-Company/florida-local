import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Building2,
  ShoppingCart,
  Award,
  Users as UsersIcon,
  Mail,
  Calendar,
  Crown,
  TrendingUp,
  DollarSign,
} from "lucide-react";

interface UserDetailModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserDetails {
  user: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    isAdmin?: boolean;
    createdAt?: string;
    lastSeenAt?: string;
  };
  businesses: any[];
  orders: any[];
  loyaltyAccount: any;
  loyaltyTransactions: any[];
  referrals: any[];
  stats: {
    totalBusinesses: number;
    totalOrders: number;
    totalSpent: number;
    loyaltyPoints: number;
    referralCount: number;
  };
}

export function UserDetailModal({ userId, open, onOpenChange }: UserDetailModalProps) {
  const { data: details, isLoading } = useQuery<UserDetails>({
    queryKey: [`/api/admin/users/${userId}/details`],
    enabled: open && !!userId,
  });

  if (!details && isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading User Details...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!details) return null;

  const { user, businesses, orders, loyaltyAccount, loyaltyTransactions, referrals, stats } = details;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="relative">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.firstName || "User"}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              )}
              {user.isAdmin && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                  <Crown className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="text-xl font-bold">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-sm text-muted-foreground font-normal">{user.email}</div>
            </div>
          </DialogTitle>
          <DialogDescription>Complete user profile and activity</DialogDescription>
        </DialogHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <Building2 className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">{stats.totalBusinesses}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Businesses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{stats.totalOrders}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                <span className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Spent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <Award className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold">{stats.loyaltyPoints}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Points</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <UsersIcon className="h-5 w-5 text-pink-600" />
                <span className="text-2xl font-bold">{stats.referralCount}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Referrals</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge variant={user.isAdmin ? "default" : "secondary"}>
                      {user.isAdmin ? "Admin" : "User"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Seen</p>
                    <p className="font-medium">
                      {user.lastSeenAt ? new Date(user.lastSeenAt).toLocaleString() : "Never"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loyaltyAccount && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Loyalty Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Tier</p>
                      <p className="text-2xl font-bold">{loyaltyAccount.tierName}</p>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      Level {loyaltyAccount.tierLevel}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Points</p>
                      <p className="text-xl font-bold text-green-600">{loyaltyAccount.currentPoints}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lifetime Points</p>
                      <p className="text-xl font-bold">{loyaltyAccount.lifetimePoints}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="businesses" className="space-y-3">
            {businesses.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No businesses registered
                </CardContent>
              </Card>
            ) : (
              businesses.map((business) => (
                <Card key={business.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      {business.logoUrl && (
                        <img
                          src={business.logoUrl}
                          alt={business.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{business.name}</h4>
                          {business.isVerified && (
                            <Badge variant="default" className="text-xs">Verified</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{business.category}</p>
                        <p className="text-xs text-muted-foreground mt-1">{business.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-3">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No orders placed
                </CardContent>
              </Card>
            ) : (
              orders.slice(0, 10).map((order) => (
                <Card key={order.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${order.total}</p>
                        <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="loyalty" className="space-y-3">
            {loyaltyTransactions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No loyalty transactions
                </CardContent>
              </Card>
            ) : (
              loyaltyTransactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className={`text-right font-bold text-lg ${
                        transaction.points >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {transaction.points >= 0 ? "+" : ""}{transaction.points} pts
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="referrals" className="space-y-3">
            {referrals.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No referrals made
                </CardContent>
              </Card>
            ) : (
              referrals.map((referral) => (
                <Card key={referral.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Referral Code: {referral.code}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={referral.status === "completed" ? "default" : "secondary"}>
                        {referral.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
