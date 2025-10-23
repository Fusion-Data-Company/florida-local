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
  Building2,
  User,
  Package,
  FileText,
  ShoppingCart,
  DollarSign,
  Star,
  Users,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Globe,
  CreditCard,
} from "lucide-react";

interface BusinessDetailModalProps {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BusinessDetails {
  business: any;
  owner: any;
  products: any[];
  posts: any[];
  orders: any[];
  gmbStatus: any;
  stripeStatus: any;
  stats: {
    totalProducts: number;
    totalPosts: number;
    totalOrders: number;
    totalRevenue: number;
    avgRating: number;
    reviewCount: number;
    followerCount: number;
  };
}

export function BusinessDetailModal({ businessId, open, onOpenChange }: BusinessDetailModalProps) {
  const { data: details, isLoading } = useQuery<BusinessDetails>({
    queryKey: [`/api/admin/businesses/${businessId}/details`],
    enabled: open && !!businessId,
  });

  if (!details && isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Business Details...</DialogTitle>
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

  const { business, owner, products, posts, orders, gmbStatus, stripeStatus, stats } = details;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="relative">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
              )}
              {business.isVerified && (
                <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="text-xl font-bold">{business.name}</div>
              <div className="text-sm text-muted-foreground font-normal">{business.tagline}</div>
            </div>
          </DialogTitle>
          <DialogDescription>Complete business profile and performance metrics</DialogDescription>
        </DialogHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <Package className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">{stats.totalProducts}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Products</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{stats.totalPosts}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Posts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold">{stats.totalOrders}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                <span className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-lg font-bold">{stats.avgRating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{stats.reviewCount} reviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-lg font-bold">{stats.followerCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Followers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <Badge variant={business.isActive ? "default" : "secondary"}>
                {business.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="owner">Owner</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="outline">{business.category}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {business.location}
                    </p>
                  </div>
                  {business.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {business.phone}
                      </p>
                    </div>
                  )}
                  {business.website && (
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        Visit Site
                      </a>
                    </div>
                  )}
                </div>
                {business.description && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm mt-1">{business.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="owner" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Business Owner
                </CardTitle>
              </CardHeader>
              <CardContent>
                {owner ? (
                  <div className="flex items-center gap-4">
                    {owner.profileImageUrl ? (
                      <img
                        src={owner.profileImageUrl}
                        alt={owner.firstName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">
                        {owner.firstName} {owner.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{owner.email}</p>
                      {owner.isAdmin && <Badge variant="default" className="mt-1">Admin</Badge>}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Owner information not available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-3">
            {products.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No products listed
                </CardContent>
              </Card>
            ) : (
              products.slice(0, 10).map((product) => (
                <Card key={product.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-bold text-green-600">${product.price}</span>
                          {product.category && <Badge variant="outline">{product.category}</Badge>}
                          {!product.isActive && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-3">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No posts created
                </CardContent>
              </Card>
            ) : (
              posts.slice(0, 10).map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-4">
                    <p className="text-sm">{post.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{post.likeCount || 0} likes</span>
                      <span>{post.commentCount || 0} comments</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            {/* GMB Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Google My Business</CardTitle>
              </CardHeader>
              <CardContent>
                {gmbStatus ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connected</span>
                      {gmbStatus.connected ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Verified</span>
                      {gmbStatus.verified ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    {gmbStatus.syncStatus && (
                      <div>
                        <p className="text-sm text-muted-foreground">Sync Status</p>
                        <Badge variant="outline">{gmbStatus.syncStatus}</Badge>
                      </div>
                    )}
                    {gmbStatus.lastSyncAt && (
                      <div>
                        <p className="text-sm text-muted-foreground">Last Sync</p>
                        <p className="text-sm">{new Date(gmbStatus.lastSyncAt).toLocaleString()}</p>
                      </div>
                    )}
                    {gmbStatus.lastError && (
                      <div>
                        <p className="text-sm text-muted-foreground text-red-600">Last Error</p>
                        <p className="text-xs text-red-600">{gmbStatus.lastError}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not connected</p>
                )}
              </CardContent>
            </Card>

            {/* Stripe Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Stripe Connect
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stripeStatus ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Account ID</p>
                      <p className="text-sm font-mono">{stripeStatus.accountId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Onboarding Status</p>
                      <Badge variant="outline">{stripeStatus.onboardingStatus || "pending"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Charges Enabled</span>
                      {stripeStatus.chargesEnabled ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Payouts Enabled</span>
                      {stripeStatus.payoutsEnabled ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not connected</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-3">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No orders received
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
                        <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
