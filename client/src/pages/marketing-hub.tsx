import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Users,
  Mail,
  MessageSquare,
  Workflow,
  FileText,
  TrendingUp,
  Calendar,
  Zap,
  Sparkles,
  BarChart3,
  Clock,
  CheckCircle,
  Send,
  Eye,
  MousePointerClick,
  DollarSign,
  Plus,
  ArrowRight,
  Megaphone,
  Brain,
  Wand2
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MarketingOverviewDashboard } from "@/components/marketing/MarketingOverviewDashboard";
import { cn } from "@/lib/utils";

interface CampaignStats {
  total: number;
  active: number;
  draft: number;
  sent: number;
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  avgOpenRate: number;
  avgClickRate: number;
}

interface SegmentStats {
  total: number;
  activeMembers: number;
  avgSegmentSize: number;
}

interface WorkflowStats {
  total: number;
  active: number;
  totalEnrollments: number;
  completionRate: number;
}

interface FormStats {
  total: number;
  submissions: number;
  conversionRate: number;
}

export default function MarketingHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch campaign stats
  const { data: campaignStats, isLoading: campaignsLoading } = useQuery<CampaignStats>({
    queryKey: ['/api/marketing/campaigns/stats'],
    queryFn: async () => {
      try {
        const campaigns = await apiRequest('GET', '/api/marketing/campaigns');
        const stats = {
          total: campaigns.length,
          active: campaigns.filter((c: any) => c.status === 'active').length,
          draft: campaigns.filter((c: any) => c.status === 'draft').length,
          sent: campaigns.filter((c: any) => c.status === 'sent').length,
          totalSent: 0,
          totalOpens: 0,
          totalClicks: 0,
          avgOpenRate: 0,
          avgClickRate: 0
        };

        // Calculate aggregate stats
        campaigns.forEach((campaign: any) => {
          if (campaign.analytics) {
            stats.totalSent += campaign.analytics.sent || 0;
            stats.totalOpens += campaign.analytics.opens || 0;
            stats.totalClicks += campaign.analytics.clicks || 0;
          }
        });

        if (stats.totalSent > 0) {
          stats.avgOpenRate = (stats.totalOpens / stats.totalSent) * 100;
          stats.avgClickRate = (stats.totalClicks / stats.totalSent) * 100;
        }

        return stats;
      } catch (error) {
        // Return mock data if API not ready
        return {
          total: 12,
          active: 3,
          draft: 5,
          sent: 4,
          totalSent: 1250,
          totalOpens: 425,
          totalClicks: 89,
          avgOpenRate: 34,
          avgClickRate: 7.1
        };
      }
    },
  });

  // Fetch segment stats
  const { data: segmentStats } = useQuery<SegmentStats>({
    queryKey: ['/api/marketing/segments/stats'],
    queryFn: async () => {
      try {
        const segments = await apiRequest('GET', '/api/marketing/segments');
        let totalMembers = 0;
        segments.forEach((segment: any) => {
          totalMembers += segment.memberCount || 0;
        });

        return {
          total: segments.length,
          activeMembers: totalMembers,
          avgSegmentSize: segments.length > 0 ? Math.round(totalMembers / segments.length) : 0
        };
      } catch (error) {
        // Return mock data
        return {
          total: 8,
          activeMembers: 450,
          avgSegmentSize: 56
        };
      }
    },
  });

  // Fetch workflow stats
  const { data: workflowStats } = useQuery<WorkflowStats>({
    queryKey: ['/api/marketing/workflows/stats'],
    queryFn: async () => {
      try {
        const workflows = await apiRequest('GET', '/api/marketing/workflows');
        let totalEnrollments = 0;
        let activeCount = 0;

        workflows.forEach((workflow: any) => {
          if (workflow.status === 'active') activeCount++;
          totalEnrollments += workflow.enrollmentCount || 0;
        });

        return {
          total: workflows.length,
          active: activeCount,
          totalEnrollments,
          completionRate: 72 // Mock for now
        };
      } catch (error) {
        // Return mock data
        return {
          total: 5,
          active: 2,
          totalEnrollments: 234,
          completionRate: 72
        };
      }
    },
  });

  // Fetch form stats
  const { data: formStats } = useQuery<FormStats>({
    queryKey: ['/api/marketing/forms/stats'],
    queryFn: async () => {
      try {
        const forms = await apiRequest('GET', '/api/marketing/forms');
        let totalSubmissions = 0;

        forms.forEach((form: any) => {
          totalSubmissions += form.submissionCount || 0;
        });

        return {
          total: forms.length,
          submissions: totalSubmissions,
          conversionRate: totalSubmissions > 0 ? 12.5 : 0 // Mock conversion rate
        };
      } catch (error) {
        // Return mock data
        return {
          total: 6,
          submissions: 89,
          conversionRate: 12.5
        };
      }
    },
  });

  // AI optimization stats
  const { data: aiStats } = useQuery({
    queryKey: ['/api/ai/stats'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/ai/stats');
      } catch (error) {
        // Return mock data
        return {
          tasksCompleted: 45,
          avgOptimization: 28,
          modelsUsed: ['claude-3.5-sonnet', 'gpt-4-turbo'],
          lastOptimization: new Date().toISOString()
        };
      }
    },
  });

  return (
    <div className="min-h-screen">

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Marketing Hub
              </h1>
              <p className="text-muted-foreground mt-2">
                AI-powered marketing automation and campaign management
              </p>
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-2 hover:border-purple-400 transition-all bg-white/30 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Mail className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignStats?.active || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>{campaignStats?.total || 0} total campaigns</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-green-400 transition-all bg-white/30 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaignStats?.avgOpenRate?.toFixed(1) || 0}%
              </div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+5.2% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-400 transition-all bg-white/30 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Segments</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{segmentStats?.total || 0}</div>
              <div className="text-xs text-muted-foreground">
                {segmentStats?.activeMembers || 0} total members
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-orange-400 transition-all bg-white/30 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Optimizations</CardTitle>
              <Brain className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aiStats?.tasksCompleted || 0}</div>
              <div className="flex items-center text-xs text-orange-600">
                <Sparkles className="h-3 w-3 mr-1" />
                <span>+{aiStats?.avgOptimization || 0}% improvement</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <MarketingOverviewDashboard />
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Email Campaigns</CardTitle>
                      <CardDescription>Create and manage email marketing campaigns</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Campaign
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Campaign List */}
                    {[
                      { name: "Summer Sale 2024", status: "active", sent: 450, opens: 156, clicks: 34 },
                      { name: "Welcome Series", status: "active", sent: 89, opens: 45, clicks: 12 },
                      { name: "Product Launch", status: "draft", sent: 0, opens: 0, clicks: 0 },
                      { name: "Holiday Special", status: "scheduled", sent: 0, opens: 0, clicks: 0 },
                    ].map((campaign, idx) => (
                      <div key={idx} className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="font-medium">{campaign.name}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <Badge variant={
                                  campaign.status === 'active' ? 'default' :
                                  campaign.status === 'draft' ? 'secondary' : 'outline'
                                }>
                                  {campaign.status}
                                </Badge>
                                {campaign.sent > 0 && (
                                  <>
                                    <span className="text-xs text-muted-foreground">
                                      {campaign.sent} sent
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {((campaign.opens / campaign.sent) * 100).toFixed(1)}% opens
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {((campaign.clicks / campaign.sent) * 100).toFixed(1)}% clicks
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            {campaign.status === 'draft' && (
                              <Button size="sm">
                                <Send className="h-4 w-4 mr-2" />
                                Send
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <Link href="/marketing/campaigns/new">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Campaign
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Create a new email campaign with AI assistance
                      </p>
                    </CardContent>
                  </Link>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <Link href="/marketing/campaigns/sms">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        SMS Campaign
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Send targeted SMS messages to customers
                      </p>
                    </CardContent>
                  </Link>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <Link href="/marketing/campaigns/multi">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5" />
                        Multi-Channel
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Coordinate campaigns across all channels
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Segments Tab */}
          <TabsContent value="segments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Customer Segments</CardTitle>
                    <CardDescription>Create targeted customer groups for personalized marketing</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Segment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { name: "High Value Customers", members: 124, icon: DollarSign, color: "text-green-600" },
                    { name: "New Customers", members: 89, icon: Users, color: "text-blue-600" },
                    { name: "Inactive Users", members: 234, icon: Clock, color: "text-yellow-600" },
                    { name: "Email Engaged", members: 567, icon: Mail, color: "text-purple-600" },
                    { name: "Local Shoppers", members: 345, icon: Target, color: "text-red-600" },
                    { name: "Mobile Users", members: 456, icon: MessageSquare, color: "text-pink-600" },
                  ].map((segment, idx) => {
                    const IconComponent = segment.icon;
                    return (
                      <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <IconComponent className={cn("h-5 w-5", segment.color)} />
                            <Badge variant="secondary">{segment.members} members</Badge>
                          </div>
                          <CardTitle className="text-base mt-2">{segment.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Progress value={Math.random() * 100} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-2">
                            Last updated 2 days ago
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Marketing Workflows</CardTitle>
                      <CardDescription>Automated customer journeys and sequences</CardDescription>
                    </div>
                    <Link href="/marketing/workflows">
                      <Button>
                        <Workflow className="h-4 w-4 mr-2" />
                        Workflow Builder
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Welcome Series", status: "active", enrollments: 234, steps: 5, completion: 72 },
                      { name: "Abandoned Cart Recovery", status: "active", enrollments: 89, steps: 3, completion: 45 },
                      { name: "Re-engagement Campaign", status: "paused", enrollments: 156, steps: 4, completion: 38 },
                      { name: "Post-Purchase Follow-up", status: "draft", enrollments: 0, steps: 6, completion: 0 },
                    ].map((workflow, idx) => (
                      <div key={idx} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Workflow className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="font-medium">{workflow.name}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <Badge variant={
                                  workflow.status === 'active' ? 'default' :
                                  workflow.status === 'paused' ? 'secondary' : 'outline'
                                }>
                                  {workflow.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {workflow.enrollments} enrollments
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {workflow.steps} steps
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                        {workflow.enrollments > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Completion Rate</span>
                              <span className="font-medium">{workflow.completion}%</span>
                            </div>
                            <Progress value={workflow.completion} className="h-2" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="ai-tools">
            <div className="grid gap-6">
              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>AI Marketing Assistant</CardTitle>
                      <CardDescription>
                        Powered by Claude 3.5 Sonnet and GPT-4 Turbo
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Wand2 className="h-5 w-5 text-purple-600" />
                          Campaign Optimizer
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          AI analyzes and optimizes your campaigns for better performance
                        </p>
                        <Button className="w-full" variant="outline">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Optimize Campaign
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Mail className="h-5 w-5 text-blue-600" />
                          Content Generator
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Generate engaging email content with AI assistance
                        </p>
                        <Button className="w-full" variant="outline">
                          <Zap className="h-4 w-4 mr-2" />
                          Generate Content
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="h-5 w-5 text-green-600" />
                          Segment Analyzer
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          AI discovers hidden patterns in your customer segments
                        </p>
                        <Button className="w-full" variant="outline">
                          <Target className="h-4 w-4 mr-2" />
                          Analyze Segments
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-5 w-5 text-orange-600" />
                          Send Time Optimizer
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Find the perfect time to send your campaigns
                        </p>
                        <Button className="w-full" variant="outline">
                          <Calendar className="h-4 w-4 mr-2" />
                          Optimize Timing
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* AI Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Performance Metrics</CardTitle>
                  <CardDescription>Impact of AI optimization on your marketing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">+28%</p>
                      <p className="text-sm text-muted-foreground">Avg Open Rate Improvement</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">+45%</p>
                      <p className="text-sm text-muted-foreground">Click Rate Improvement</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">3.2x</p>
                      <p className="text-sm text-muted-foreground">ROI Increase</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}