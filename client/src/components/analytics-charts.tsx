import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Eye,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  colorClass?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon: Icon,
  trend = "neutral",
  colorClass = "text-blue-600"
}: MetricCardProps) {
  const trendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600";
  const TrendIcon = trendIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendIcon className={`h-3 w-3 mr-1 ${trendColor}`} />
              <span className={trendColor}>{change > 0 ? "+" : ""}{change}%</span>
              <span className="ml-1">{changeLabel}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Revenue Chart Component
interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <CardDescription>Daily revenue over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Orders Chart Component
interface OrdersChartProps {
  data: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

export function OrdersChart({ data }: OrdersChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders Volume</CardTitle>
        <CardDescription>Daily orders count</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="orders" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// User Growth Chart Component
interface UserGrowthChartProps {
  data: Array<{
    date: string;
    newUsers: number;
    activeUsers: number;
  }>;
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>New vs Active Users</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="newUsers"
              stroke="#10b981"
              strokeWidth={2}
              name="New Users"
            />
            <Line
              type="monotone"
              dataKey="activeUsers"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Active Users"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Category Distribution Chart
interface CategoryDistributionProps {
  data: Array<{
    category: string;
    value: number;
    percentage: number;
  }>;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function CategoryDistribution({ data }: CategoryDistributionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Category</CardTitle>
        <CardDescription>Distribution across product categories</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category, percentage }) => `${category}: ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={item.category} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span>{item.category}</span>
              </div>
              <span className="font-semibold">${item.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Conversion Funnel Chart
interface ConversionFunnelProps {
  data: {
    funnelName: string;
    steps: Array<{
      stepName: string;
      userCount: number;
      conversionRate: number;
    }>;
  };
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const chartData = data.steps.map(step => ({
    name: step.stepName,
    users: step.userCount,
    rate: step.conversionRate,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.funnelName}</CardTitle>
        <CardDescription>Step-by-step conversion analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'users') return [value, 'Users'];
                return [`${value.toFixed(2)}%`, 'Conversion Rate'];
              }}
            />
            <Legend />
            <Bar dataKey="users" fill="#3b82f6" name="Users" />
            <Bar dataKey="rate" fill="#10b981" name="Rate %" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {data.steps.map((step, index) => (
            <div key={index} className="flex items-center justify-between text-sm border-b pb-2">
              <span className="font-medium">{step.stepName}</span>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">{step.userCount} users</span>
                <Badge variant={step.conversionRate > 50 ? "default" : "secondary"}>
                  {step.conversionRate.toFixed(1)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Cohort Retention Chart
interface CohortRetentionProps {
  cohorts: Array<{
    cohortName: string;
    cohortDate: string;
    totalUsers: number;
    activeUsers: number;
    retentionRate: number;
    averageLifetimeValue: number;
  }>;
}

export function CohortRetention({ cohorts }: CohortRetentionProps) {
  const chartData = cohorts.map(cohort => ({
    name: cohort.cohortName,
    retention: cohort.retentionRate,
    ltv: parseFloat(cohort.averageLifetimeValue.toFixed(2)),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cohort Analysis</CardTitle>
        <CardDescription>User retention and lifetime value by cohort</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="retention"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Retention Rate %"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ltv"
              stroke="#10b981"
              strokeWidth={2}
              name="Avg LTV $"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cohorts.map((cohort, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="font-semibold text-sm">{cohort.cohortName}</div>
                <div className="text-xs text-muted-foreground mb-2">
                  {new Date(cohort.cohortDate).toLocaleDateString()}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Total Users:</span>
                    <span className="font-medium">{cohort.totalUsers}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Active:</span>
                    <span className="font-medium">{cohort.activeUsers}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Retention:</span>
                    <span className="font-medium text-blue-600">
                      {cohort.retentionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Avg LTV:</span>
                    <span className="font-medium text-green-600">
                      ${cohort.averageLifetimeValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Real-time Activity Feed
interface ActivityFeedProps {
  events: Array<{
    id: string;
    eventType: string;
    timestamp: string;
    eventData?: any;
  }>;
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'page_view': return Eye;
      case 'order_created': return ShoppingCart;
      case 'user_signup': return Users;
      case 'purchase_completed': return DollarSign;
      default: return Activity;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'page_view': return 'text-blue-600';
      case 'order_created': return 'text-purple-600';
      case 'user_signup': return 'text-green-600';
      case 'purchase_completed': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600 animate-pulse" />
          Real-time Activity
        </CardTitle>
        <CardDescription>Live user events (last 5 minutes)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No recent activity
            </div>
          ) : (
            events.map((event) => {
              const Icon = getEventIcon(event.eventType);
              const colorClass = getEventColor(event.eventType);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 border-b pb-3"
                >
                  <Icon className={`h-4 w-4 mt-1 ${colorClass}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {event.eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
