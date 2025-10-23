import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Star,
  MessageCircle,
  Eye,
  TrendingUp,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
  Zap,
  BarChart3,
  Users,
  Phone,
  Globe,
  Image as ImageIcon,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface GMBStatus {
  connected: boolean;
  businessName?: string;
  lastSync?: string;
  nextSync?: string;
  syncStatus?: 'success' | 'error' | 'pending';
  errorMessage?: string;
  accountId?: string;
  locationId?: string;
}

interface GMBMetrics {
  totalReviews: number;
  averageRating: number;
  profileViews: number;
  searchAppearances: number;
  websiteClicks: number;
  phoneCallClicks: number;
  directionRequests: number;
  photoViews: number;
  weeklyChange: {
    views: number;
    searches: number;
  };
}

interface GMBReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface GMBPost {
  id: string;
  type: 'offer' | 'event' | 'update' | 'product';
  title: string;
  content: string;
  callToAction?: string;
  publishedAt: string;
  views: number;
  clicks: number;
}

export default function GMBHub() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch GMB status
  const { data: gmbStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery<GMBStatus>({
    queryKey: ['/api/gmb/status'],
    enabled: isAuthenticated,
  });

  // Fetch GMB metrics
  const { data: gmbMetrics, isLoading: metricsLoading } = useQuery<GMBMetrics>({
    queryKey: ['/api/gmb/metrics'],
    enabled: isAuthenticated && gmbStatus?.connected,
  });

  // Fetch GMB reviews
  const { data: gmbReviews = [], isLoading: reviewsLoading } = useQuery<GMBReview[]>({
    queryKey: ['/api/gmb/reviews'],
    enabled: isAuthenticated && gmbStatus?.connected,
  });

  // Fetch GMB posts
  const { data: gmbPosts = [], isLoading: postsLoading } = useQuery<GMBPost[]>({
    queryKey: ['/api/gmb/posts'],
    enabled: isAuthenticated && gmbStatus?.connected,
  });

  // Connect GMB mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/gmb/connect');
      return response;
    },
    onSuccess: (response) => {
      if (response.authUrl) {
        window.location.href = response.authUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to initiate GMB connection",
        variant: "destructive",
      });
    },
  });

  // Sync GMB mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/gmb/sync');
    },
    onSuccess: () => {
      toast({
        title: "Sync Started",
        description: "GMB data sync has been initiated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/gmb/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gmb/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gmb/reviews'] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync GMB data",
        variant: "destructive",
      });
    },
  });

  // Disconnect GMB mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/gmb/disconnect');
    },
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "GMB account has been disconnected",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/gmb/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect GMB",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light">
        <div className="container mx-auto px-4 py-20 text-center">
          <MapPin className="h-16 w-16 mx-auto mb-6 text-blue-500" />
          <h1 className="text-4xl font-bold mb-4">GMB Integration Hub</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Please sign in to manage your Google My Business integration.
          </p>
          <Button size="lg" onClick={() => window.location.href = '/api/login'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const renderConnectionStatus = () => {
    if (statusLoading) {
      return <Skeleton className="h-48 w-full" />;
    }

    if (!gmbStatus?.connected) {
      return (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 mb-6">
                <MapPin className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Connect Your Google My Business</h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Sync your Google My Business data to Florida Local Elite. Get automatic review
                syncing, performance metrics, and improved local SEO visibility.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-8 text-left max-w-3xl mx-auto">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50">
                  <Star className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Auto-Sync Reviews</h4>
                    <p className="text-xs text-muted-foreground">
                      Reviews sync automatically every hour
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50">
                  <BarChart3 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Performance Insights</h4>
                    <p className="text-xs text-muted-foreground">
                      Track views, searches, and engagement
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50">
                  <Zap className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Enhanced Visibility</h4>
                    <p className="text-xs text-muted-foreground">
                      Boost your local search rankings
                    </p>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {connectMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Connect GMB Account
                  </>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Connected to GMB</CardTitle>
                <CardDescription className="text-lg">
                  {gmbStatus.businessName || "Your Business"}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to disconnect your GMB account?")) {
                    disconnectMutation.mutate();
                  }
                }}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Sync Status</h4>
              <div className="flex items-center gap-2">
                {gmbStatus.syncStatus === 'success' && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Up to date
                  </Badge>
                )}
                {gmbStatus.syncStatus === 'pending' && (
                  <Badge className="bg-blue-500">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Syncing...
                  </Badge>
                )}
                {gmbStatus.syncStatus === 'error' && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Error
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Last Sync</h4>
              <p className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {gmbStatus.lastSync
                  ? format(new Date(gmbStatus.lastSync), 'PPp')
                  : 'Never'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Next Sync</h4>
              <p className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {gmbStatus.nextSync
                  ? format(new Date(gmbStatus.nextSync), 'PPp')
                  : 'Not scheduled'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Account ID</h4>
              <p className="text-sm font-mono">{gmbStatus.accountId || 'N/A'}</p>
            </div>
          </div>

          {gmbStatus.errorMessage && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-red-900 mb-1">Sync Error</h5>
                  <p className="text-sm text-red-700">{gmbStatus.errorMessage}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderMetrics = () => {
    if (!gmbStatus?.connected) return null;

    if (metricsLoading) {
      return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      );
    }

    if (!gmbMetrics) return null;

    const metrics = [
      {
        label: "Total Reviews",
        value: gmbMetrics.totalReviews,
        icon: <Star className="h-6 w-6" />,
        color: "from-yellow-500 to-orange-500",
        bgColor: "from-yellow-50 to-orange-50",
      },
      {
        label: "Average Rating",
        value: gmbMetrics.averageRating.toFixed(1),
        icon: <ThumbsUp className="h-6 w-6" />,
        color: "from-green-500 to-emerald-500",
        bgColor: "from-green-50 to-emerald-50",
      },
      {
        label: "Profile Views",
        value: gmbMetrics.profileViews.toLocaleString(),
        icon: <Eye className="h-6 w-6" />,
        color: "from-blue-500 to-cyan-500",
        bgColor: "from-blue-50 to-cyan-50",
        trend: gmbMetrics.weeklyChange.views,
      },
      {
        label: "Search Appearances",
        value: gmbMetrics.searchAppearances.toLocaleString(),
        icon: <TrendingUp className="h-6 w-6" />,
        color: "from-purple-500 to-pink-500",
        bgColor: "from-purple-50 to-pink-50",
        trend: gmbMetrics.weeklyChange.searches,
      },
      {
        label: "Website Clicks",
        value: gmbMetrics.websiteClicks.toLocaleString(),
        icon: <Globe className="h-6 w-6" />,
        color: "from-indigo-500 to-blue-500",
        bgColor: "from-indigo-50 to-blue-50",
      },
      {
        label: "Phone Calls",
        value: gmbMetrics.phoneCallClicks.toLocaleString(),
        icon: <Phone className="h-6 w-6" />,
        color: "from-green-500 to-teal-500",
        bgColor: "from-green-50 to-teal-50",
      },
      {
        label: "Direction Requests",
        value: gmbMetrics.directionRequests.toLocaleString(),
        icon: <MapPin className="h-6 w-6" />,
        color: "from-red-500 to-pink-500",
        bgColor: "from-red-50 to-pink-50",
      },
      {
        label: "Photo Views",
        value: gmbMetrics.photoViews.toLocaleString(),
        icon: <ImageIcon className="h-6 w-6" />,
        color: "from-orange-500 to-amber-500",
        bgColor: "from-orange-50 to-amber-50",
      },
    ];

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${metric.bgColor} mb-4`}>
                  <div className={`text-transparent bg-clip-text bg-gradient-to-r ${metric.color}`}>
                    {metric.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{metric.value}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-between">
                  <span>{metric.label}</span>
                  {metric.trend !== undefined && (
                    <Badge variant={metric.trend >= 0 ? "default" : "destructive"} className="text-xs">
                      {metric.trend >= 0 ? '+' : ''}{metric.trend}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderReviews = () => {
    if (reviewsLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      );
    }

    if (gmbReviews.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground">
              Your GMB reviews will appear here once they're synced
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {gmbReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{review.author}</h4>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(review.createdAt), 'PPP')}
                  </p>
                </div>
                {review.sentiment && (
                  <Badge
                    variant={
                      review.sentiment === 'positive'
                        ? 'default'
                        : review.sentiment === 'negative'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {review.sentiment === 'positive' ? (
                      <ThumbsUp className="h-3 w-3 mr-1" />
                    ) : review.sentiment === 'negative' ? (
                      <ThumbsDown className="h-3 w-3 mr-1" />
                    ) : null}
                    {review.sentiment}
                  </Badge>
                )}
              </div>

              <p className="text-sm mb-4">{review.text}</p>

              {review.reply && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm font-semibold">Business Response</span>
                    {review.repliedAt && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.repliedAt), 'PP')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{review.reply}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen">

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <MapPin className="h-12 w-12" />
              <h1 className="text-5xl font-bold">GMB Integration Hub</h1>
            </div>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Manage your Google My Business integration, sync data, and track performance metrics
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-8">
        {/* Connection Status */}
        {renderConnectionStatus()}

        {/* Metrics and Details */}
        {gmbStatus?.connected && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star className="h-4 w-4 mr-2" />
                Reviews
              </TabsTrigger>
              <TabsTrigger value="posts">
                <MessageCircle className="h-4 w-4 mr-2" />
                Posts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-6">Performance Metrics</h2>
                {renderMetrics()}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
                {renderReviews()}
              </div>
            </TabsContent>

            <TabsContent value="posts" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-6">GMB Posts</h2>
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Post Management Coming Soon</h3>
                    <p className="text-muted-foreground">
                      GMB post management and scheduling will be available soon
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
