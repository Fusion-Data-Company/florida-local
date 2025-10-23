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
  Activity,
  Package,
  Store,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  MetricCard,
  RevenueChart,
  OrdersChart,
  UserGrowthChart,
  CategoryDistribution,
  ConversionFunnel,
  CohortRetention,
  ActivityFeed,
} from "./analytics-charts";

interface PlatformOverview {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalUsers: number;
  activeUsers: number;
  totalBusinesses: number;
  totalProducts: number;
  conversionRate: number;
  dailyMetrics: Array<{
    date: string;
    totalRevenue: string;
    orderCount: number;
    averageOrderValue: string;
    newUsers: number;
    activeUsers: number;
  }>;
}

interface RealtimeStats {
  totalEvents: number;
  activeUsers: number;
  recentEvents: Array<{
    id: string;
    eventType: string;
    timestamp: string;
    eventData?: any;
  }>;
}

export default function PlatformAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: overview, isLoading: overviewLoading } = useQuery<PlatformOverview>({
    queryKey: ["/api/analytics/platform/overview", { days: timeRange }],
  });

  const { data: realtimeStats } = useQuery<RealtimeStats>({
    queryKey: ["/api/analytics/realtime"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: funnelData } = useQuery<any>({
    queryKey: ["/api/analytics/funnels/purchase"],
  });

  const { data: cohorts } = useQuery<any[]>({
    queryKey: ["/api/analytics/cohorts", { type: "monthly", limit: 6 }],
  });

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  // Calculate trends (comparing current to previous period)
  const currentPeriodRevenue = overview.dailyMetrics.slice(-7).reduce((sum, day) =>
    sum + parseFloat(day.totalRevenue), 0
  );
  const previousPeriodRevenue = overview.dailyMetrics.slice(-14, -7).reduce((sum, day) =>
    sum + parseFloat(day.totalRevenue), 0
  );
  const revenueTrend = previousPeriodRevenue > 0
    ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
    : 0;

  const currentPeriodOrders = overview.dailyMetrics.slice(-7).reduce((sum, day) =>
    sum + day.orderCount, 0
  );
  const previousPeriodOrders = overview.dailyMetrics.slice(-14, -7).reduce((sum, day) =>
    sum + day.orderCount, 0
  );
  const ordersTrend = previousPeriodOrders > 0
    ? ((currentPeriodOrders - previousPeriodOrders) / previousPeriodOrders) * 100
    : 0;

  const currentPeriodUsers = overview.dailyMetrics.slice(-7).reduce((sum, day) =>
    sum + day.newUsers, 0
  );
  const previousPeriodUsers = overview.dailyMetrics.slice(-14, -7).reduce((sum, day) =>
    sum + day.newUsers, 0
  );
  const usersTrend = previousPeriodUsers > 0
    ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100
    : 0;

  // Format data for charts
  const revenueData = overview.dailyMetrics.map(day => ({
    date: day.date,
    revenue: parseFloat(day.totalRevenue),
    orders: day.orderCount,
  }));

  const userGrowthData = overview.dailyMetrics.map(day => ({
    date: day.date,
    newUsers: day.newUsers,
    activeUsers: day.activeUsers,
  }));

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Platform Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your platform performance
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

      {/* Real-time Stats Banner */}
      {realtimeStats && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600 animate-pulse" />
                Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {realtimeStats.activeUsers}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {realtimeStats.totalEvents}
                  </div>
                  <div className="text-sm text-muted-foreground">Events (5 min)</div>
                </div>
                <Badge variant="outline" className="ml-auto">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
                  Live
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${overview.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={revenueTrend}
          icon={DollarSign}
          trend={revenueTrend > 0 ? "up" : revenueTrend < 0 ? "down" : "neutral"}
          colorClass="text-green-600"
        />
        <MetricCard
          title="Total Orders"
          value={overview.totalOrders.toLocaleString()}
          change={ordersTrend}
          icon={ShoppingCart}
          trend={ordersTrend > 0 ? "up" : ordersTrend < 0 ? "down" : "neutral"}
          colorClass="text-blue-600"
        />
        <MetricCard
          title="Total Users"
          value={overview.totalUsers.toLocaleString()}
          change={usersTrend}
          icon={Users}
          trend={usersTrend > 0 ? "up" : usersTrend < 0 ? "down" : "neutral"}
          colorClass="text-purple-600"
        />
        <MetricCard
          title="Avg Order Value"
          value={`$${overview.averageOrderValue.toFixed(2)}`}
          icon={TrendingUp}
          colorClass="text-orange-600"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Active Users"
          value={overview.activeUsers.toLocaleString()}
          icon={Activity}
          colorClass="text-blue-600"
        />
        <MetricCard
          title="Total Businesses"
          value={overview.totalBusinesses.toLocaleString()}
          icon={Store}
          colorClass="text-purple-600"
        />
        <MetricCard
          title="Total Products"
          value={overview.totalProducts.toLocaleString()}
          icon={Package}
          colorClass="text-green-600"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${overview.conversionRate.toFixed(2)}%`}
          icon={TrendingUp}
          colorClass="text-orange-600"
        />
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <RevenueChart data={revenueData} />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <OrdersChart data={revenueData} />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserGrowthChart data={userGrowthData} />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {funnelData && (
              <ConversionFunnel data={funnelData} />
            )}
            {realtimeStats && (
              <ActivityFeed events={realtimeStats.recentEvents} />
            )}
          </div>
          {cohorts && cohorts.length > 0 && (
            <CohortRetention cohorts={cohorts} />
          )}
        </TabsContent>
      </Tabs>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download analytics reports</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline">
            Export as CSV
          </Button>
          <Button variant="outline">
            Export as PDF
          </Button>
          <Button variant="outline">
            Schedule Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
