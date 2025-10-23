import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, MapPin, Search, Phone, Navigation, Eye, Users, Star, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface LocationInsights {
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    views: {
      total: number;
      change: number;
      trend: "up" | "down" | "stable";
      breakdown: {
        search: number;
        maps: number;
      };
    };
    actions: {
      websiteClicks: number;
      phoneCalls: number;
      total: number;
      change: number;
      trend: "up" | "down" | "stable";
    };
    directionRequests: {
      total: number;
      change: number;
      trend: "up" | "down" | "stable";
    };
    photos: {
      viewsFromOwner: number;
      viewsFromCustomers: number;
      totalPhotos: number;
    };
    searchQueries: {
      direct: number;
      discovery: number;
    };
  };
  topSearchQueries: Array<{
    query: string;
    impressions: number;
  }>;
}

interface GMBLocationInsightsProps {
  businessId: string;
  className?: string;
  compact?: boolean;
}

/**
 * GMB Location Insights Component
 *
 * Displays performance metrics and insights from Google My Business listing.
 * Shows views, actions, search queries, and trends.
 *
 * @param businessId - The business to show insights for
 * @param className - Additional Tailwind classes
 * @param compact - Show compact view (default: false)
 */
export default function GMBLocationInsights({
  businessId,
  className = "",
  compact = false
}: GMBLocationInsightsProps) {

  // Fetch location insights
  const { data: insights, isLoading } = useQuery<LocationInsights>({
    queryKey: ['/api/gmb/insights', businessId],
    queryFn: async () => {
      // TODO: Replace with actual API call
      // return fetch(`/api/gmb/insights/${businessId}`).then(res => res.json());

      // Mock data
      return {
        period: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        },
        metrics: {
          views: {
            total: 1245,
            change: 18.5,
            trend: "up",
            breakdown: {
              search: 892,
              maps: 353,
            },
          },
          actions: {
            websiteClicks: 156,
            phoneCalls: 89,
            total: 245,
            change: 12.3,
            trend: "up",
          },
          directionRequests: {
            total: 127,
            change: -5.2,
            trend: "down",
          },
          photos: {
            viewsFromOwner: 3420,
            viewsFromCustomers: 1890,
            totalPhotos: 45,
          },
          searchQueries: {
            direct: 673,
            discovery: 572,
          },
        },
        topSearchQueries: [
          { query: "miami beach boutique", impressions: 234 },
          { query: "clothing store miami", impressions: 187 },
          { query: "boutique near me", impressions: 156 },
          { query: "women's fashion miami", impressions: 123 },
          { query: "beach wear shop", impressions: 92 },
        ],
      } as LocationInsights;
    },
    enabled: Boolean(businessId),
  });

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "stable":
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-emerald-600";
      case "down":
        return "text-red-600";
      case "stable":
        return "text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <Card className={`entrance-fade-up ${className}`}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  // Compact view for dashboard widgets
  if (compact) {
    return (
      <Card className={`entrance-fade-up ${className}`}>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Profile Views</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold">{insights.metrics.views.total.toLocaleString()}</span>
                {getTrendIcon(insights.metrics.views.trend)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Actions</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold">{insights.metrics.actions.total.toLocaleString()}</span>
                {getTrendIcon(insights.metrics.actions.trend)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">Directions</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold">{insights.metrics.directionRequests.total.toLocaleString()}</span>
                {getTrendIcon(insights.metrics.directionRequests.trend)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full insights view
  const searchPercentage = (insights.metrics.views.breakdown.search / insights.metrics.views.total) * 100;
  const mapsPercentage = (insights.metrics.views.breakdown.maps / insights.metrics.views.total) * 100;
  const directPercentage = (insights.metrics.searchQueries.direct / (insights.metrics.searchQueries.direct + insights.metrics.searchQueries.discovery)) * 100;

  return (
    <Card className={`entrance-fade-up ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Location Insights
            </CardTitle>
            <CardDescription>
              Performance metrics from Google My Business (Last 30 days)
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            30 Days
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Views */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(insights.metrics.views.trend)}
                <span className={`text-sm font-semibold ${getTrendColor(insights.metrics.views.trend)}`}>
                  {insights.metrics.views.change > 0 ? "+" : ""}{insights.metrics.views.change.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {insights.metrics.views.total.toLocaleString()}
            </div>
            <div className="text-xs text-blue-700 font-medium">Profile Views</div>
          </div>

          {/* Total Actions */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(insights.metrics.actions.trend)}
                <span className={`text-sm font-semibold ${getTrendColor(insights.metrics.actions.trend)}`}>
                  {insights.metrics.actions.change > 0 ? "+" : ""}{insights.metrics.actions.change.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {insights.metrics.actions.total.toLocaleString()}
            </div>
            <div className="text-xs text-purple-700 font-medium">Customer Actions</div>
          </div>

          {/* Direction Requests */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(insights.metrics.directionRequests.trend)}
                <span className={`text-sm font-semibold ${getTrendColor(insights.metrics.directionRequests.trend)}`}>
                  {insights.metrics.directionRequests.change > 0 ? "+" : ""}{insights.metrics.directionRequests.change.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {insights.metrics.directionRequests.total.toLocaleString()}
            </div>
            <div className="text-xs text-orange-700 font-medium">Direction Requests</div>
          </div>
        </div>

        {/* Views Breakdown */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Views Breakdown</h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Google Search</span>
                </div>
                <span className="text-sm font-semibold">
                  {insights.metrics.views.breakdown.search.toLocaleString()} ({searchPercentage.toFixed(0)}%)
                </span>
              </div>
              <Progress value={searchPercentage} className="h-2 bg-blue-100" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm">Google Maps</span>
                </div>
                <span className="text-sm font-semibold">
                  {insights.metrics.views.breakdown.maps.toLocaleString()} ({mapsPercentage.toFixed(0)}%)
                </span>
              </div>
              <Progress value={mapsPercentage} className="h-2 bg-emerald-100" />
            </div>
          </div>
        </div>

        {/* Customer Actions */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Customer Actions</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium">Website Clicks</span>
              </div>
              <div className="text-xl font-bold">{insights.metrics.actions.websiteClicks.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium">Phone Calls</span>
              </div>
              <div className="text-xl font-bold">{insights.metrics.actions.phoneCalls.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Search Queries */}
        <div>
          <h4 className="text-sm font-semibold mb-3">How Customers Find You</h4>
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Direct Searches (business name)</span>
                <span className="text-sm font-semibold">
                  {insights.metrics.searchQueries.direct.toLocaleString()} ({directPercentage.toFixed(0)}%)
                </span>
              </div>
              <Progress value={directPercentage} className="h-2 bg-purple-100" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Discovery Searches (category/product)</span>
                <span className="text-sm font-semibold">
                  {insights.metrics.searchQueries.discovery.toLocaleString()} ({(100 - directPercentage).toFixed(0)}%)
                </span>
              </div>
              <Progress value={100 - directPercentage} className="h-2 bg-cyan-100" />
            </div>
          </div>

          {/* Top Search Queries */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Top Search Queries
            </h5>
            <div className="space-y-2">
              {insights.topSearchQueries.slice(0, 5).map((query, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-gray-700">{query.query}</span>
                  </div>
                  <span className="text-gray-500 font-medium">
                    {query.impressions.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Photo Stats */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Photo Performance</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100/50 border border-pink-200">
              <div className="text-xl font-bold text-pink-900">
                {insights.metrics.photos.totalPhotos}
              </div>
              <div className="text-xs text-pink-700 font-medium">Total Photos</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
              <div className="text-xl font-bold text-blue-900">
                {insights.metrics.photos.viewsFromOwner.toLocaleString()}
              </div>
              <div className="text-xs text-blue-700 font-medium">Owner Photo Views</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
              <div className="text-xl font-bold text-purple-900">
                {insights.metrics.photos.viewsFromCustomers.toLocaleString()}
              </div>
              <div className="text-xs text-purple-700 font-medium">Customer Photo Views</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
