import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Eye,
  Heart,
  Star,
  Package,
  MessageSquare,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  MetricCard,
  RevenueChart,
  OrdersChart,
  CategoryDistribution,
} from "./analytics-charts";

interface BusinessDashboard {
  businessId: string;
  businessName: string;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  productViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  totalReviews: number;
  averageRating: number;
  favoriteCount: number;
  shareCount: number;
  dailyMetrics: Array<{
    date: string;
    revenue: string;
    orders: number;
    views: number;
    visitors: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    revenue: number;
    orderCount: number;
    views: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    orderCount: number;
  }>;
}

interface BusinessAnalyticsProps {
  businessId: string;
}

export default function BusinessAnalyticsDashboard({ businessId }: BusinessAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("30");

  const { data: dashboard, isLoading } = useQuery<BusinessDashboard>({
    queryKey: [`/api/analytics/business/${businessId}/dashboard`, { days: timeRange }],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading business analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available for this business</p>
      </div>
    );
  }

  // Calculate trends
  const currentPeriodRevenue = dashboard.dailyMetrics.slice(-7).reduce((sum, day) =>
    sum + parseFloat(day.revenue), 0
  );
  const previousPeriodRevenue = dashboard.dailyMetrics.slice(-14, -7).reduce((sum, day) =>
    sum + parseFloat(day.revenue), 0
  );
  const revenueTrend = previousPeriodRevenue > 0
    ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
    : 0;

  const currentPeriodOrders = dashboard.dailyMetrics.slice(-7).reduce((sum, day) =>
    sum + day.orders, 0
  );
  const previousPeriodOrders = dashboard.dailyMetrics.slice(-14, -7).reduce((sum, day) =>
    sum + day.orders, 0
  );
  const ordersTrend = previousPeriodOrders > 0
    ? ((currentPeriodOrders - previousPeriodOrders) / previousPeriodOrders) * 100
    : 0;

  const currentPeriodViews = dashboard.dailyMetrics.slice(-7).reduce((sum, day) =>
    sum + day.views, 0
  );
  const previousPeriodViews = dashboard.dailyMetrics.slice(-14, -7).reduce((sum, day) =>
    sum + day.views, 0
  );
  const viewsTrend = previousPeriodViews > 0
    ? ((currentPeriodViews - previousPeriodViews) / previousPeriodViews) * 100
    : 0;

  // Format data for charts
  const revenueData = dashboard.dailyMetrics.map(day => ({
    date: day.date,
    revenue: parseFloat(day.revenue),
    orders: day.orders,
  }));

  const categoryData = dashboard.categoryBreakdown.map(cat => ({
    category: cat.category,
    value: cat.revenue,
    percentage: (cat.revenue / dashboard.totalRevenue * 100).toFixed(1),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{dashboard.businessName} - Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Business performance insights
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${dashboard.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={revenueTrend}
          icon={DollarSign}
          trend={revenueTrend > 0 ? "up" : revenueTrend < 0 ? "down" : "neutral"}
          colorClass="text-green-600"
        />
        <MetricCard
          title="Total Orders"
          value={dashboard.orderCount.toLocaleString()}
          change={ordersTrend}
          icon={ShoppingCart}
          trend={ordersTrend > 0 ? "up" : ordersTrend < 0 ? "down" : "neutral"}
          colorClass="text-blue-600"
        />
        <MetricCard
          title="Product Views"
          value={dashboard.productViews.toLocaleString()}
          change={viewsTrend}
          icon={Eye}
          trend={viewsTrend > 0 ? "up" : viewsTrend < 0 ? "down" : "neutral"}
          colorClass="text-purple-600"
        />
        <MetricCard
          title="Avg Order Value"
          value={`$${dashboard.averageOrderValue.toFixed(2)}`}
          icon={TrendingUp}
          colorClass="text-orange-600"
        />
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Unique Visitors"
          value={dashboard.uniqueVisitors.toLocaleString()}
          icon={Users}
          colorClass="text-blue-600"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${dashboard.conversionRate.toFixed(2)}%`}
          icon={TrendingUp}
          colorClass="text-green-600"
        />
        <MetricCard
          title="Average Rating"
          value={dashboard.averageRating.toFixed(1)}
          icon={Star}
          colorClass="text-yellow-600"
        />
        <MetricCard
          title="Total Reviews"
          value={dashboard.totalReviews.toLocaleString()}
          icon={MessageSquare}
          colorClass="text-purple-600"
        />
      </div>

      {/* Social Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Favorites"
          value={dashboard.favoriteCount.toLocaleString()}
          icon={Heart}
          colorClass="text-red-600"
        />
        <MetricCard
          title="Shares"
          value={dashboard.shareCount.toLocaleString()}
          icon={Share2}
          colorClass="text-blue-600"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart data={revenueData} />
            {categoryData.length > 0 && (
              <CategoryDistribution data={categoryData} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <OrdersChart data={revenueData} />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Best sellers by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.topProducts.map((product, index) => (
                  <motion.div
                    key={product.productId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{product.productName}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.orderCount} orders · {product.views} views
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ${product.revenue.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${(product.revenue / product.orderCount).toFixed(2)} avg
                      </div>
                    </div>
                  </motion.div>
                ))}
                {dashboard.topProducts.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No product sales data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>AI-powered recommendations to improve your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dashboard.conversionRate < 2 && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-semibold text-yellow-900">Low Conversion Rate</div>
                <div className="text-sm text-yellow-800">
                  Your conversion rate is {dashboard.conversionRate.toFixed(2)}%. Consider improving product images, descriptions, and pricing.
                </div>
              </div>
            </div>
          )}
          {dashboard.averageRating < 4 && dashboard.totalReviews > 0 && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <Star className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <div className="font-semibold text-orange-900">Improve Customer Satisfaction</div>
                <div className="text-sm text-orange-800">
                  Your average rating is {dashboard.averageRating.toFixed(1)} stars. Focus on customer service and product quality.
                </div>
              </div>
            </div>
          )}
          {dashboard.totalReviews < 10 && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-semibold text-blue-900">Get More Reviews</div>
                <div className="text-sm text-blue-800">
                  You have {dashboard.totalReviews} reviews. Encourage customers to leave reviews to build trust.
                </div>
              </div>
            </div>
          )}
          {revenueTrend > 20 && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-semibold text-green-900">Strong Growth!</div>
                <div className="text-sm text-green-800">
                  Your revenue is up {revenueTrend.toFixed(1)}% from last period. Keep up the great work!
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>Download your business analytics</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Export as CSV
          </Button>
          <Button variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Export as PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
