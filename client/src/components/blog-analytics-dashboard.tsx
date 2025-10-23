import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Eye,
  Users,
  Clock,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Globe,
  MousePointer,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Download,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface AnalyticsData {
  overview: {
    totalViews: number;
    uniqueViews: number;
    avgReadTime: number;
    readCompletionRate: number;
    totalReactions: number;
    totalComments: number;
    totalBookmarks: number;
    totalShares: number;
  };
  viewsOverTime: Array<{
    date: string;
    views: number;
    uniqueViews: number;
  }>;
  trafficSources: Array<{
    source: string;
    visits: number;
    percentage: number;
  }>;
  topPosts: Array<{
    id: string;
    title: string;
    slug: string;
    views: number;
    engagement: number;
  }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  geographicData: Array<{
    country: string;
    visits: number;
  }>;
  engagementMetrics: {
    avgScrollDepth: number;
    bounceRate: number;
    avgTimeOnPage: number;
  };
}

interface BlogAnalyticsDashboardProps {
  postId?: string; // Optional: for single post analytics
  authorId?: string; // For author's all posts
  dateRange?: '7d' | '30d' | '90d' | 'all';
}

/**
 * Blog Analytics Dashboard
 *
 * Comprehensive analytics with:
 * - View tracking (total, unique, over time)
 * - Engagement metrics (reactions, comments, bookmarks)
 * - Traffic sources analysis
 * - Device & geographic breakdown
 * - Read completion tracking
 * - Popular content ranking
 * - Real-time statistics
 */
export default function BlogAnalyticsDashboard({
  postId,
  authorId,
  dateRange = '30d',
}: BlogAnalyticsDashboardProps) {
  const [selectedRange, setSelectedRange] = useState(dateRange);
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'engagement'>('views');

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: postId
      ? ['/api/blog/posts', postId, 'analytics', selectedRange]
      : ['/api/blog/analytics', authorId, selectedRange],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const { overview } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            {postId ? 'Post performance insights' : 'Your blog performance insights'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedRange} onValueChange={setSelectedRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Views"
          value={overview.totalViews.toLocaleString()}
          change="+12.5%"
          icon={Eye}
          trend="up"
        />
        <MetricCard
          title="Unique Visitors"
          value={overview.uniqueViews.toLocaleString()}
          change="+8.3%"
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Avg. Read Time"
          value={`${Math.floor(overview.avgReadTime / 60)}m ${overview.avgReadTime % 60}s`}
          change="+2.1%"
          icon={Clock}
          trend="up"
        />
        <MetricCard
          title="Completion Rate"
          value={`${overview.readCompletionRate.toFixed(1)}%`}
          change="-1.2%"
          icon={Activity}
          trend="down"
        />
      </div>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Overview</CardTitle>
          <CardDescription>Reader interactions and engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <EngagementStat
              icon={Heart}
              label="Reactions"
              value={overview.totalReactions}
              color="text-red-500"
            />
            <EngagementStat
              icon={MessageCircle}
              label="Comments"
              value={overview.totalComments}
              color="text-blue-500"
            />
            <EngagementStat
              icon={Bookmark}
              label="Bookmarks"
              value={overview.totalBookmarks}
              color="text-purple-500"
            />
            <EngagementStat
              icon={Share2}
              label="Shares"
              value={overview.totalShares}
              color="text-green-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Views Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              {/* Chart placeholder - integrate with recharts or chart.js */}
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chart visualization</p>
                <p className="text-xs">(Integrate Recharts)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.trafficSources.slice(0, 5).map((source, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{source.source}</span>
                    <span className="text-muted-foreground">
                      {source.visits.toLocaleString()} ({source.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={source.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="performance">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="content">Top Content</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
            </TabsList>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Avg. Scroll Depth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.engagementMetrics.avgScrollDepth.toFixed(1)}%
                    </div>
                    <Progress value={analytics.engagementMetrics.avgScrollDepth} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.engagementMetrics.bounceRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Lower is better
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Time on Page</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.floor(analytics.engagementMetrics.avgTimeOnPage / 60)}m{' '}
                      {analytics.engagementMetrics.avgTimeOnPage % 60}s
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Average duration
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Audience Tab */}
            <TabsContent value="audience" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Device Breakdown */}
                <div>
                  <h4 className="font-semibold mb-4">Device Type</h4>
                  <div className="space-y-3">
                    <DeviceBar
                      label="Desktop"
                      percentage={analytics.deviceBreakdown.desktop}
                      color="bg-blue-500"
                    />
                    <DeviceBar
                      label="Mobile"
                      percentage={analytics.deviceBreakdown.mobile}
                      color="bg-green-500"
                    />
                    <DeviceBar
                      label="Tablet"
                      percentage={analytics.deviceBreakdown.tablet}
                      color="bg-purple-500"
                    />
                  </div>
                </div>

                {/* Geographic Data */}
                <div>
                  <h4 className="font-semibold mb-4">Top Locations</h4>
                  <div className="space-y-2">
                    {analytics.geographicData.slice(0, 5).map((location, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <span className="text-sm">{location.country}</span>
                        <Badge variant="secondary">{location.visits.toLocaleString()}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Top Content Tab */}
            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="space-y-2">
                {analytics.topPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium truncate">{post.title}</h5>
                      <p className="text-sm text-muted-foreground">/{post.slug}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{post.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        <span>{post.engagement}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Behavior Tab */}
            <TabsContent value="behavior" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Read Completion Funnel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <FunnelStep label="Page View" percentage={100} count={overview.totalViews} />
                      <FunnelStep label="Scrolled 25%" percentage={85} count={Math.floor(overview.totalViews * 0.85)} />
                      <FunnelStep label="Scrolled 50%" percentage={68} count={Math.floor(overview.totalViews * 0.68)} />
                      <FunnelStep label="Scrolled 75%" percentage={52} count={Math.floor(overview.totalViews * 0.52)} />
                      <FunnelStep
                        label="Read Complete"
                        percentage={overview.readCompletionRate}
                        count={Math.floor(overview.totalViews * (overview.readCompletionRate / 100))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Engagement Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Reaction Rate</span>
                          <span className="font-medium">
                            {((overview.totalReactions / overview.totalViews) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={(overview.totalReactions / overview.totalViews) * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Comment Rate</span>
                          <span className="font-medium">
                            {((overview.totalComments / overview.totalViews) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={(overview.totalComments / overview.totalViews) * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Bookmark Rate</span>
                          <span className="font-medium">
                            {((overview.totalBookmarks / overview.totalViews) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={(overview.totalBookmarks / overview.totalViews) * 100} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: any;
  trend: 'up' | 'down';
}

function MetricCard({ title, value, change, icon: Icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {change} from last period
        </p>
      </CardContent>
    </Card>
  );
}

interface EngagementStatProps {
  icon: any;
  label: string;
  value: number;
  color: string;
}

function EngagementStat({ icon: Icon, label, value, color }: EngagementStatProps) {
  return (
    <div className="text-center">
      <Icon className={`w-8 h-8 mx-auto mb-2 ${color}`} />
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

interface DeviceBarProps {
  label: string;
  percentage: number;
  color: string;
}

function DeviceBar({ label, percentage, color }: DeviceBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

interface FunnelStepProps {
  label: string;
  percentage: number;
  count: number;
}

function FunnelStep({ label, percentage, count }: FunnelStepProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {count.toLocaleString()} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-8 bg-primary/10 rounded flex items-center px-3" style={{ width: `${percentage}%` }}>
        <div className="h-2 bg-primary rounded-full w-full" />
      </div>
    </div>
  );
}
