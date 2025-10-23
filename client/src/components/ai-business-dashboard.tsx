import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Target,
  Brain,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Lightbulb,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface BusinessMetrics {
  revenue: {
    current: number;
    previous: number;
    trend: 'up' | 'down';
    prediction: number;
  };
  customers: {
    total: number;
    new: number;
    retention: number;
    satisfaction: number;
  };
  products: {
    total: number;
    bestseller: string;
    avgRating: number;
    conversionRate: number;
  };
  engagement: {
    views: number;
    interactions: number;
    socialScore: number;
    viralityIndex: number;
  };
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'recommendation' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
}

export default function AIBusinessDashboard({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Fetch business metrics with AI analysis
  const { data: metrics, isLoading: metricsLoading } = useQuery<BusinessMetrics>({
    queryKey: ['/api/ai/business-metrics', businessId],
    refetchInterval: realTimeUpdates ? 30000 : false, // Real-time updates every 30s
  });

  // Fetch AI-generated insights
  const { data: insights, isLoading: insightsLoading } = useQuery<AIInsight[]>({
    queryKey: ['/api/ai/business-insights', businessId],
    refetchInterval: 300000, // Update insights every 5 minutes
  });

  // Fetch recommendations
  const { data: recommendations } = useQuery({
    queryKey: ['/api/recommendations', { type: 'business' }],
    refetchInterval: 600000, // Update every 10 minutes
  });

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return <Target className="h-4 w-4 text-green-500" />;
      case 'warning': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'trend': return <TrendingUp className="h-4 w-4 text-purple-500" />;
    }
  };

  const getImpactColor = (impact: AIInsight['impact']) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="miami-glass miami-card-glow">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Real-time Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold miami-heading">AI Business Intelligence</h1>
          <p className="text-muted-foreground miami-body-text">
            Powered by advanced analytics and machine learning
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className="miami-glass border-green-400 text-green-700">
            <Activity className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
          <Button
            variant={realTimeUpdates ? "metallic-primary" : "glass-secondary"}
            onClick={() => setRealTimeUpdates(!realTimeUpdates)}
            size="sm"
          >
            <Brain className="h-4 w-4 mr-2" />
            {realTimeUpdates ? 'Real-time ON' : 'Real-time OFF'}
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="miami-glass miami-hover-lift miami-card-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold miami-accent-text">
                  ${metrics?.revenue.current.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  {metrics?.revenue.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ml-1 ${metrics?.revenue.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(((metrics?.revenue.current || 0) - (metrics?.revenue.previous || 0)) / (metrics?.revenue.previous || 1) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>AI Prediction</span>
                <span>${metrics?.revenue.prediction.toLocaleString()}</span>
              </div>
              <Progress 
                value={((metrics?.revenue.current || 0) / (metrics?.revenue.prediction || 1)) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="miami-glass miami-hover-lift miami-card-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customers</p>
                <p className="text-2xl font-bold miami-accent-text">
                  {metrics?.customers.total.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm ml-1 text-blue-600">
                    +{metrics?.customers.new} new
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Retention Rate</span>
                <span>{metrics?.customers.retention}%</span>
              </div>
              <Progress value={metrics?.customers.retention} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="miami-glass miami-hover-lift miami-card-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Products</p>
                <p className="text-2xl font-bold miami-accent-text">
                  {metrics?.products.total}
                </p>
                <div className="flex items-center mt-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm ml-1 text-yellow-600">
                    {metrics?.products.avgRating}/5 avg
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Conversion Rate</span>
                <span>{metrics?.products.conversionRate}%</span>
              </div>
              <Progress value={metrics?.products.conversionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="miami-glass miami-hover-lift miami-card-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement</p>
                <p className="text-2xl font-bold miami-accent-text">
                  {metrics?.engagement.socialScore}
                </p>
                <div className="flex items-center mt-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  <span className="text-sm ml-1 text-orange-600">
                    {metrics?.engagement.interactions} interactions
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-full">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Virality Index</span>
                <span>{metrics?.engagement.viralityIndex}/100</span>
              </div>
              <Progress value={metrics?.engagement.viralityIndex} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 miami-glass miami-card-glow">
          <CardHeader>
            <CardTitle className="flex items-center miami-heading">
              <Brain className="h-5 w-5 mr-2 text-purple-500" />
              AI-Generated Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights?.map((insight) => (
              <div key={insight.id} className="p-4 rounded-lg miami-glass border border-white/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getInsightIcon(insight.type)}
                    <div>
                      <h4 className="font-semibold miami-heading">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground miami-body-text">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getImpactColor(insight.impact)}`} />
                    <Badge variant="outline" className="text-xs">
                      {insight.confidence}% confident
                    </Badge>
                  </div>
                </div>
                {insight.actionable && (
                  <Button variant="fl-gold" size="sm" className="mt-3">
                    Take Action
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="miami-glass miami-card-glow">
          <CardHeader>
            <CardTitle className="flex items-center miami-heading">
              <Target className="h-5 w-5 mr-2 text-green-500" />
              Smart Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations?.recommendations?.slice(0, 5).map((rec: any, index: number) => (
              <div key={index} className="p-3 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{rec.metadata?.name}</p>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                  </div>
                  <Badge className="text-xs bg-gradient-to-r from-cyan-500 to-blue-500">
                    {(rec.score * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
            <Button variant="fl-glass" className="w-full mt-4">
              View All Recommendations
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tabs */}
      <Card className="miami-glass miami-card-glow">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 miami-glass">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
              <TabsTrigger value="competitors">Market</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold miami-heading">Performance Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Revenue Growth</span>
                      <span className="font-medium text-green-600">+24.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Customer Acquisition</span>
                      <span className="font-medium text-blue-600">+18.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Market Share</span>
                      <span className="font-medium text-purple-600">12.8%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold miami-heading">Key Achievements</h3>
                  <div className="space-y-2">
                    <Badge className="bg-green-100 text-green-800">Top Performer in Category</Badge>
                    <Badge className="bg-blue-100 text-blue-800">5-Star Customer Rating</Badge>
                    <Badge className="bg-purple-100 text-purple-800">Trending Business</Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="trends" className="mt-6">
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Advanced Trend Analysis</h3>
                <p className="text-muted-foreground">Interactive charts and trend analysis coming soon</p>
              </div>
            </TabsContent>
            
            <TabsContent value="predictions" className="mt-6">
              <div className="text-center py-12">
                <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">AI Predictions</h3>
                <p className="text-muted-foreground">Predictive analytics and forecasting dashboard</p>
              </div>
            </TabsContent>
            
            <TabsContent value="competitors" className="mt-6">
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Market Intelligence</h3>
                <p className="text-muted-foreground">Competitive analysis and market positioning</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
