import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingBag,
  Eye,
  Heart,
  MessageSquare,
  Package,
  Settings,
  Plus,
  Sparkles,
  MapPin,
  Bot,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import AIContentGenerator from "@/components/ai-content-generator";
import GMBSyncDashboard from "@/components/gmb-sync-dashboard";
import GMBReviewManager from "@/components/gmb-review-manager";
import GMBAutoPost from "@/components/gmb-auto-post";
import GMBLocationInsights from "@/components/gmb-location-insights";
import AIContentHistory from "@/components/ai-content-history";
import { GMBStatusWidget } from "@/components/widgets/GMBStatusWidget";
import type { Business, Product, Post } from "@shared/types";
import { motion } from "framer-motion";

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user's businesses first
  const { data: userBusinesses = [] } = useQuery<Business[]>({
    queryKey: ['/api/businesses/my'],
    enabled: !!user,
  });

  // Use user's first business
  const businessId = userBusinesses[0]?.id;

  // Fetch business data
  const { data: business, isLoading: businessLoading } = useQuery<Business>({
    queryKey: [`/api/businesses/${businessId}`],
    enabled: !!businessId,
  });

  // Fetch business products
  const { data: products } = useQuery<Product[]>({
    queryKey: [`/api/products/business/${businessId}`],
    enabled: !!businessId,
  });

  // Fetch business posts
  const { data: posts } = useQuery<Post[]>({
    queryKey: [`/api/posts/business/${businessId}`],
    enabled: !!businessId,
  });

  // Check if user owns this business
  const isOwner = user && business && business.ownerId === user.id;

  if (businessLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!business || !isOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto mt-20">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view this dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/marketplace">
              <Button className="w-full">Go to Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const totalProducts = products?.length || 0;
  const totalPosts = posts?.length || 0;
  const totalLikes = posts?.reduce((sum, post) => sum + (post.likeCount || 0), 0) || 0;
  const totalComments = posts?.reduce((sum, post) => sum + (post.commentCount || 0), 0) || 0;
  const avgRating = parseFloat(business.rating || "0");
  const reviewCount = business.reviewCount || 0;
  const followers = business.followerCount || 0;

  return (
    <div className="min-h-screen">
      {/* Hero Section with Business Info */}
      <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {business.logoUrl && (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-24 h-24 rounded-2xl shadow-2xl border-4 border-white/20 object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{business.name}</h1>
              <p className="text-xl text-white/90 mb-4">{business.tagline}</p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {business.category}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {business.location}
                </Badge>
                {business.isVerified && (
                  <Badge variant="secondary" className="bg-green-500/20 text-white border-green-300">
                    ✓ Verified
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Link href={`/edit-business/${business.id}`}>
                <Button variant="secondary" size="lg">
                  <Settings className="mr-2 h-5 w-5" />
                  Settings
                </Button>
              </Link>
              <Link href={`/business/${business.id}`}>
                <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Eye className="mr-2 h-5 w-5" />
                  View Public Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="gmb" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Google My Business</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI Content</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Posts</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-2 hover:shadow-lg transition-shadow bg-white/20 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                  <Users className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{followers.toLocaleString()}</div>
                  <p className="text-xs text-gray-900 mt-1">Your audience reach</p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow bg-white/20 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <Package className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalProducts}</div>
                  <p className="text-xs text-gray-900 mt-1">
                    Listed in your store
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow bg-white/20 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rating</CardTitle>
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{avgRating.toFixed(1)} ⭐</div>
                  <p className="text-xs text-gray-900 mt-1">
                    {reviewCount} reviews
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow bg-white/20 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                  <Heart className="h-5 w-5 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalLikes + totalComments}</div>
                  <p className="text-xs text-gray-900 mt-1">
                    {totalLikes} likes, {totalComments} comments
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI-Powered Features Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/90 to-pink-50/90 dark:from-purple-950/30 dark:to-pink-950/30 backdrop-blur-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">AI-Powered Tools</CardTitle>
                        <CardDescription>
                          Save time with intelligent content generation and automation
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
                      NEW
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    className="w-full h-auto py-6 flex-col gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                    onClick={() => window.location.href = '/ai/content-generator'}
                  >
                    <Sparkles className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-bold">Generate Content</div>
                      <div className="text-xs opacity-90">AI-powered posts & descriptions</div>
                    </div>
                  </Button>

                  <Button
                    className="w-full h-auto py-6 flex-col gap-2 bg-white/20 hover:bg-white/30 dark:bg-gray-800/30 dark:hover:bg-gray-700/40 text-gray-900 dark:text-white shadow-lg hover:shadow-xl transition-all border-2 border-purple-200 dark:border-purple-800"
                    variant="outline"
                    size="lg"
                    onClick={() => window.location.href = '/integrations/gmb'}
                  >
                    <MapPin className="h-6 w-6 text-blue-600" />
                    <div className="text-center">
                      <div className="font-bold">GMB Integration</div>
                      <div className="text-xs opacity-70">Sync with Google My Business</div>
                    </div>
                  </Button>

                  <Button
                    className="w-full h-auto py-6 flex-col gap-2 bg-white/20 hover:bg-white/30 dark:bg-gray-800/30 dark:hover:bg-gray-700/40 text-gray-900 dark:text-white shadow-lg hover:shadow-xl transition-all border-2 border-purple-200 dark:border-purple-800"
                    variant="outline"
                    size="lg"
                    onClick={() => window.open(`/ai/insights/${business.id}`, '_blank')}
                  >
                    <BarChart3 className="h-6 w-6 text-green-600" />
                    <div className="text-center">
                      <div className="font-bold">AI Insights</div>
                      <div className="text-xs opacity-70">Performance recommendations</div>
                    </div>
                  </Button>

                  <Button
                    className="w-full h-auto py-6 flex-col gap-2 bg-white/20 hover:bg-white/30 dark:bg-gray-800/30 dark:hover:bg-gray-700/40 text-gray-900 dark:text-white shadow-lg hover:shadow-xl transition-all border-2 border-purple-200 dark:border-purple-800"
                    variant="outline"
                    size="lg"
                    onClick={() => window.open(`/ai/campaigns/${business.id}`, '_blank')}
                  >
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                    <div className="text-center">
                      <div className="font-bold">Smart Campaigns</div>
                      <div className="text-xs opacity-70">AI-optimized marketing</div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* GMB Status Widget */}
            <GMBStatusWidget businessId={Number(business.id)} variant="full" />

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your business day-to-day</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href={`/vendor-products?businessId=${business.id}`}>
                  <Button className="w-full" variant="outline" size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Add Product
                  </Button>
                </Link>
                <Link href={`/edit-business/${business.id}`}>
                  <Button className="w-full" variant="outline" size="lg">
                    <Settings className="mr-2 h-5 w-5" />
                    Edit Business
                  </Button>
                </Link>
                <Link href={`/business/${business.id}`}>
                  <Button className="w-full" variant="outline" size="lg">
                    <Eye className="mr-2 h-5 w-5" />
                    View Profile
                  </Button>
                </Link>
                <Link href="/ai/agents">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white" size="lg">
                    <Bot className="mr-2 h-5 w-5" />
                    AI Agents
                    <Badge className="ml-2 bg-white/20 text-white">15</Badge>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Recent Products</CardTitle>
                  <CardDescription>Your latest product listings</CardDescription>
                </CardHeader>
                <CardContent>
                  {products && products.length > 0 ? (
                    <div className="space-y-4">
                      {products.slice(0, 5).map((product) => (
                        <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex-1">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-900">${product.price}</p>
                          </div>
                          <Badge variant={product.isActive ? "default" : "secondary"}>
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-gray-900 mb-4" />
                      <p className="text-gray-900 mb-4">No products yet</p>
                      <Link href={`/vendor-products?businessId=${business.id}`}>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Your First Product
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Recent Posts</CardTitle>
                  <CardDescription>Your latest social updates</CardDescription>
                </CardHeader>
                <CardContent>
                  {posts && posts.length > 0 ? (
                    <div className="space-y-4">
                      {posts.slice(0, 5).map((post) => (
                        <div key={post.id} className="py-2 border-b last:border-0">
                          <p className="text-sm line-clamp-2">{post.content}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-900">
                            <span>{post.likeCount || 0} likes</span>
                            <span>{post.commentCount || 0} comments</span>
                            <span>{post.shareCount || 0} shares</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-gray-900 mb-4" />
                      <p className="text-gray-900 mb-4">No posts yet</p>
                      <Button onClick={() => setActiveTab("content")}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Create Your First Post
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Google My Business Tab */}
          <TabsContent value="gmb" className="space-y-6">
            {/* GMB Sync Status */}
            <GMBSyncDashboard businessId={business.id} />

            {/* Two-column layout for Reviews and Auto-Post */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GMBLocationInsights businessId={business.id} />
              <GMBAutoPost businessId={business.id} />
            </div>

            {/* Full-width Review Manager */}
            <GMBReviewManager businessId={business.id} />
          </TabsContent>

          {/* AI Content Generator Tab */}
          <TabsContent value="content" className="space-y-6">
            <AIContentGenerator businessId={business.id} />
            <AIContentHistory businessId={business.id} userId={user?.id} limit={10} />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="bg-white/80 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Management</CardTitle>
                    <CardDescription>Manage your product catalog</CardDescription>
                  </div>
                  <Link href={`/vendor-products?businessId=${business.id}`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {products && products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <Card key={product.id} className="overflow-hidden">
                        {product.imageUrl && (
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">{product.name}</h3>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold">${product.price}</span>
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-900">
                            Inventory: {product.stockQuantity || 0}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 mx-auto text-gray-900 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No products yet</h3>
                    <p className="text-gray-900 mb-6">
                      Start selling by adding your first product
                    </p>
                    <Link href={`/vendor-products?businessId=${business.id}`}>
                      <Button size="lg">
                        <Plus className="mr-2 h-5 w-5" />
                        Add Your First Product
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <Card className="bg-white/80 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Post Management</CardTitle>
                    <CardDescription>View and manage your social posts</CardDescription>
                  </div>
                  <Button onClick={() => setActiveTab("content")}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create New Post
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {posts && posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <Card key={post.id}>
                        <CardContent className="pt-6">
                          <p className="mb-4">{post.content}</p>
                          <div className="flex items-center gap-6 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4" />
                              <span>{post.likeCount || 0} likes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              <span>{post.commentCount || 0} comments</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              <span>{post.shareCount || 0} shares</span>
                            </div>
                            <Badge variant="outline" className="ml-auto">
                              {post.type}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 mx-auto text-gray-900 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                    <p className="text-gray-900 mb-6">
                      Start engaging your audience with your first post
                    </p>
                    <Button size="lg" onClick={() => setActiveTab("content")}>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Create Your First Post
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
