import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  Phone,
  Map,
  Globe,
  Search,
  Calendar,
  Download,
  Info,
  ArrowUp,
  ArrowDown,
  Activity
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface GMBInsightsViewerProps {
  businessId: string;
}

interface MetricValue {
  date: string;
  value: number;
}

interface Insights {
  metrics: {
    queries: {
      direct: MetricValue[];
      indirect: MetricValue[];
      chain: MetricValue[];
      total: number;
      growthRate: number;
    };
    views: {
      maps: MetricValue[];
      search: MetricValue[];
      total: number;
      growthRate: number;
    };
    actions: {
      website: MetricValue[];
      phone: MetricValue[];
      directions: MetricValue[];
      total: number;
      conversionRate: number;
    };
    photos: {
      merchantViews: MetricValue[];
      customerViews: MetricValue[];
      merchantCount: number;
      customerCount: number;
      engagementRate: number;
    };
  };
  topSearchQueries: Array<{
    query: string;
    impressions: number;
    clicks: number;
    ctr: number;
    averagePosition: number;
  }>;
  trends: {
    peakDays: string[];
    peakHours: number[];
    growthTrend: 'increasing' | 'stable' | 'declining';
  };
  recommendations: Array<{
    category: string;
    priority: string;
    title: string;
    description: string;
    potentialImpact: string;
    actionItems: string[];
  }>;
  competitorAnalysis?: {
    averageRating: number;
    totalReviews: number;
    responseRate: number;
    photoCount: number;
    marketShare: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function GMBInsightsViewer({ businessId }: GMBInsightsViewerProps) {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('30');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch insights
  const { data: insights, isLoading, error, refetch } = useQuery<Insights>({
    queryKey: ['/api/businesses', businessId, 'gmb/insights', dateRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const response = await fetch(
        `/api/businesses/${businessId}/gmb/insights?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&includeCompetitors=true`
      );
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    }
  });

  // Fetch performance trends
  const { data: trends } = useQuery({
    queryKey: ['/api/businesses', businessId, 'gmb/insights/trends'],
    queryFn: async () => {
      const response = await fetch(
        `/api/businesses/${businessId}/gmb/insights/trends?metricType=VIEWS_SEARCH&periods=12`
      );
      if (!response.ok) throw new Error('Failed to fetch trends');
      return response.json();
    }
  });

  // Generate report mutation
  const generateReport = async (format: string) => {
    try {
      const response = await apiRequest(`/api/businesses/${businessId}/gmb/insights/report`, {
        method: 'POST',
        body: JSON.stringify({
          reportType: 'monthly',
          format
        })
      });
      
      toast({
        title: 'Report Generated',
        description: `Your ${format.toUpperCase()} report has been generated`
      });
      
      if (response.exportUrl) {
        window.open(response.exportUrl, '_blank');
      }
    } catch (error: any) {
      toast({
        title: 'Report Generation Failed',
        description: error.message || 'Failed to generate report',
        variant: 'destructive'
      });
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (growth < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !insights) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading insights</AlertTitle>
        <AlertDescription>
          Unable to fetch GMB insights. Please ensure your business is connected to Google My Business.
        </AlertDescription>
      </Alert>
    );
  }

  // Prepare chart data
  const viewsChartData = insights.metrics.views.search.slice(-30).map((item, index) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    search: item.value,
    maps: insights.metrics.views.maps[index]?.value || 0
  }));

  const actionsChartData = insights.metrics.actions.website.slice(-30).map((item, index) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    website: item.value,
    phone: insights.metrics.actions.phone[index]?.value || 0,
    directions: insights.metrics.actions.directions[index]?.value || 0
  }));

  const queryTypeData = [
    { name: 'Direct', value: insights.metrics.queries.direct.reduce((sum, q) => sum + q.value, 0) },
    { name: 'Discovery', value: insights.metrics.queries.indirect.reduce((sum, q) => sum + q.value, 0) },
    { name: 'Branded', value: insights.metrics.queries.chain.reduce((sum, q) => sum + q.value, 0) }
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => generateReport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => generateReport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{formatNumber(insights.metrics.views.total)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(insights.metrics.views.growthRate)}
                  <span className={`text-xs ${insights.metrics.views.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(insights.metrics.views.growthRate)}%
                  </span>
                </div>
              </div>
              <Eye className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Search Queries</p>
                <p className="text-2xl font-bold">{formatNumber(insights.metrics.queries.total)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(insights.metrics.queries.growthRate)}
                  <span className={`text-xs ${insights.metrics.queries.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(insights.metrics.queries.growthRate)}%
                  </span>
                </div>
              </div>
              <Search className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Customer Actions</p>
                <p className="text-2xl font-bold">{formatNumber(insights.metrics.actions.total)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {insights.metrics.actions.conversionRate.toFixed(1)}% conversion
                </p>
              </div>
              <MousePointer className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Photo Views</p>
                <p className="text-2xl font-bold">
                  {formatNumber(
                    insights.metrics.photos.merchantViews.reduce((sum, v) => sum + v.value, 0) +
                    insights.metrics.photos.customerViews.reduce((sum, v) => sum + v.value, 0)
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {insights.metrics.photos.engagementRate.toFixed(1)}% engagement
                </p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Views Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
              <CardDescription>How customers find your business listing</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={viewsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="search" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="maps" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Actions</CardTitle>
              <CardDescription>How customers interact with your listing</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={actionsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="website" stroke="#8884d8" />
                  <Line type="monotone" dataKey="phone" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="directions" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discovery" className="space-y-4">
          {/* Query Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Query Types</CardTitle>
                <CardDescription>How customers search for your business</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={queryTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {queryTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Search Queries */}
            <Card>
              <CardHeader>
                <CardTitle>Top Search Queries</CardTitle>
                <CardDescription>Most common searches that show your listing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.topSearchQueries.slice(0, 5).map((query, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{query.query}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{query.impressions} impressions</span>
                          <span>{query.ctr.toFixed(1)}% CTR</span>
                        </div>
                      </div>
                      <Badge variant="outline">#{query.averagePosition.toFixed(1)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Peak Times */}
          <Card>
            <CardHeader>
              <CardTitle>Peak Activity Times</CardTitle>
              <CardDescription>When customers are most active</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Peak Days</p>
                  <div className="flex gap-2">
                    {insights.trends.peakDays.map((day) => (
                      <Badge key={day} variant="secondary">{day}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Peak Hours</p>
                  <div className="flex gap-2">
                    {insights.trends.peakHours.map((hour) => (
                      <Badge key={hour} variant="secondary">
                        {hour}:00 - {hour + 1}:00
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          {/* Action Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Action Distribution</CardTitle>
              <CardDescription>Breakdown of customer actions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: 'Website Clicks',
                      value: insights.metrics.actions.website.reduce((sum, a) => sum + a.value, 0),
                      icon: Globe
                    },
                    {
                      name: 'Phone Calls',
                      value: insights.metrics.actions.phone.reduce((sum, a) => sum + a.value, 0),
                      icon: Phone
                    },
                    {
                      name: 'Direction Requests',
                      value: insights.metrics.actions.directions.reduce((sum, a) => sum + a.value, 0),
                      icon: Map
                    }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Photo Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Photo Performance</CardTitle>
              <CardDescription>How your photos perform compared to customer photos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Your Photos ({insights.metrics.photos.merchantCount})</span>
                    <span className="text-sm font-medium">
                      {formatNumber(insights.metrics.photos.merchantViews.reduce((sum, v) => sum + v.value, 0))} views
                    </span>
                  </div>
                  <Progress value={60} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Customer Photos ({insights.metrics.photos.customerCount})</span>
                    <span className="text-sm font-medium">
                      {formatNumber(insights.metrics.photos.customerViews.reduce((sum, v) => sum + v.value, 0))} views
                    </span>
                  </div>
                  <Progress value={40} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          {insights.competitorAnalysis ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Competitor Comparison</CardTitle>
                  <CardDescription>How you compare to similar businesses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Market Share</p>
                        <div className="flex items-center gap-2">
                          <Progress value={insights.competitorAnalysis.marketShare} className="flex-1" />
                          <span className="text-sm font-medium">{insights.competitorAnalysis.marketShare}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Response Rate</p>
                        <div className="flex items-center gap-2">
                          <Progress value={insights.competitorAnalysis.responseRate} className="flex-1" />
                          <span className="text-sm font-medium">{insights.competitorAnalysis.responseRate}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Rating</p>
                        <p className="text-xl font-bold">{insights.competitorAnalysis.averageRating.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Reviews</p>
                        <p className="text-xl font-bold">{insights.competitorAnalysis.totalReviews}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Photo Count</p>
                        <p className="text-xl font-bold">{insights.competitorAnalysis.photoCount}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No competitor data available</AlertTitle>
              <AlertDescription>
                Competitor analysis requires more data to generate meaningful comparisons.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {insights.recommendations && insights.recommendations.length > 0 ? (
            <div className="space-y-4">
              {insights.recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                          {rec.priority} priority
                        </Badge>
                        <Badge variant="outline">{rec.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    
                    <Alert>
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Potential Impact:</strong> {rec.potentialImpact}
                      </AlertDescription>
                    </Alert>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Action Items:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {rec.actionItems.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No recommendations available</AlertTitle>
              <AlertDescription>
                Continue monitoring your insights to receive personalized recommendations.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}