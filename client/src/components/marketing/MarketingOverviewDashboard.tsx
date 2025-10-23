import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  TrendingDown,
  Mail,
  Users,
  Target,
  DollarSign,
  Activity,
  Send,
  Eye,
  MousePointer,
  UserPlus,
  ShoppingCart,
  GitBranch,
  FileText,
  Sparkles,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
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
  AreaChart,
  Area,
} from 'recharts';

interface MarketingMetrics {
  campaigns: {
    total: number;
    active: number;
    scheduled: number;
    completed: number;
  };
  emails: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  audience: {
    total: number;
    segments: number;
    activeSubscribers: number;
    unsubscribed: number;
    growthRate: number;
  };
  workflows: {
    total: number;
    active: number;
    enrolled: number;
    completed: number;
  };
  forms: {
    total: number;
    submissions: number;
    conversionRate: number;
  };
  revenue: {
    total: number;
    fromCampaigns: number;
    roi: number;
  };
  aiTasks: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
  };
}

interface ChartDataPoint {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  conversions?: number;
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#a855f7',
  teal: '#14b8a6',
};

export function MarketingOverviewDashboard() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load metrics
      const metricsResponse = await fetch(`/api/marketing/analytics/overview?range=${timeRange}`, {
        credentials: 'include',
      });

      if (metricsResponse.ok) {
        const data = await metricsResponse.json();
        setMetrics(data.metrics);
        setChartData(data.chartData || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate trend indicators
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  // Pie chart data for email performance
  const emailPerformanceData = [
    { name: 'Opened', value: metrics.emails.opened, color: COLORS.success },
    { name: 'Clicked', value: metrics.emails.clicked, color: COLORS.primary },
    {
      name: 'Unopened',
      value: metrics.emails.delivered - metrics.emails.opened,
      color: COLORS.warning,
    },
  ];

  // Campaign status data
  const campaignStatusData = [
    { name: 'Active', value: metrics.campaigns.active, color: COLORS.success },
    { name: 'Scheduled', value: metrics.campaigns.scheduled, color: COLORS.warning },
    { name: 'Completed', value: metrics.campaigns.completed, color: COLORS.primary },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marketing Overview</h2>
          <p className="text-muted-foreground">
            Comprehensive view of your marketing performance
          </p>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.campaigns.total}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {metrics.campaigns.active} active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.campaigns.scheduled} scheduled
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Performance</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.emails.openRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Open Rate</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Click Rate</span>
                  <span className="font-medium">{metrics.emails.clickRate.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.emails.clickRate} className="h-1" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Audience</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.audience.total.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(metrics.audience.growthRate)}
                <span className={`text-xs font-medium ${getTrendColor(metrics.audience.growthRate)}`}>
                  {metrics.audience.growthRate > 0 ? '+' : ''}
                  {metrics.audience.growthRate.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">growth</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.audience.segments} segments
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marketing ROI</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.revenue.roi.toFixed(1)}x</div>
              <p className="text-xs text-muted-foreground mt-1">Return on Investment</p>
              <p className="text-xs font-medium text-green-600 mt-2">
                ${metrics.revenue.total.toLocaleString()} revenue
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Performance Over Time */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Email Performance Trends</CardTitle>
            <CardDescription>Track email engagement metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stackId="1"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.6}
                  name="Sent"
                />
                <Area
                  type="monotone"
                  dataKey="opened"
                  stackId="2"
                  stroke={COLORS.success}
                  fill={COLORS.success}
                  fillOpacity={0.6}
                  name="Opened"
                />
                <Area
                  type="monotone"
                  dataKey="clicked"
                  stackId="3"
                  stroke={COLORS.purple}
                  fill={COLORS.purple}
                  fillOpacity={0.6}
                  name="Clicked"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Email Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Email Engagement Distribution</CardTitle>
            <CardDescription>Breakdown of email interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={emailPerformanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {emailPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Campaign Status */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Status</CardTitle>
            <CardDescription>Distribution by campaign status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={campaignStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {campaignStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="grid w-full max-w-3xl grid-cols-5">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="ai">AI Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.campaigns.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.campaigns.active}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Scheduled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.campaigns.scheduled}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.campaigns.completed}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Emails Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.emails.sent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.emails.delivered.toLocaleString()} delivered
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Open Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.emails.openRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.emails.opened.toLocaleString()} opens
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  Click Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.emails.clickRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.emails.clicked.toLocaleString()} clicks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Bounce Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.emails.bounceRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.emails.bounced.toLocaleString()} bounces
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Unsubscribes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics.emails.unsubscribed.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((metrics.emails.unsubscribed / metrics.emails.sent) * 100).toFixed(2)}% rate
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics.audience.total.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {getTrendIcon(metrics.audience.growthRate)}
                  <span className={`text-sm font-medium ${getTrendColor(metrics.audience.growthRate)}`}>
                    {metrics.audience.growthRate > 0 ? '+' : ''}
                    {metrics.audience.growthRate.toFixed(1)}% growth
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Segments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.audience.segments}</div>
                <p className="text-xs text-muted-foreground mt-2">Active segments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Active Subscribers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics.audience.activeSubscribers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {((metrics.audience.activeSubscribers / metrics.audience.total) * 100).toFixed(1)}
                  % of total
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Workflows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.workflows.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.workflows.active} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Enrolled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics.workflows.enrolled.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total contacts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics.workflows.completed.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((metrics.workflows.completed / metrics.workflows.enrolled) * 100).toFixed(1)}%
                  completion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Lead Forms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.forms.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.forms.conversionRate.toFixed(1)}% conversion
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Total AI Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.aiTasks.total}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {metrics.aiTasks.completed}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((metrics.aiTasks.completed / metrics.aiTasks.total) * 100).toFixed(1)}% success
                  rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {metrics.aiTasks.pending}
                </div>
                <p className="text-xs text-muted-foreground mt-1">In queue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{metrics.aiTasks.failed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((metrics.aiTasks.failed / metrics.aiTasks.total) * 100).toFixed(1)}% failure
                  rate
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
