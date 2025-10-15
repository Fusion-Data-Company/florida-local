import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Bot,
  Sparkles,
  TrendingUp,
  Mail,
  ShoppingCart,
  MapPin,
  Shield,
  Users,
  Trophy,
  Package,
  UserCheck,
  BarChart,
  Clock,
  Workflow,
  FileText,
  Brain,
  Rocket,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from "lucide-react";

interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: 'marketing' | 'marketplace' | 'business';
  icon: React.ReactNode;
  endpoint: string;
  fields: AgentField[];
  color: string;
}

interface AgentField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

const AI_AGENTS: AIAgent[] = [
  // Marketing Agents (7)
  {
    id: 'campaign_optimize',
    name: 'Campaign Optimizer',
    description: 'AI-powered campaign optimization to boost open rates, CTR, and conversions',
    category: 'marketing',
    icon: <TrendingUp className="w-5 h-5" />,
    endpoint: '/api/ai/marketing/campaign/optimize',
    color: 'from-blue-500 to-cyan-500',
    fields: [
      { name: 'subject', label: 'Subject Line', type: 'text', required: true, placeholder: 'Your current subject line' },
      { name: 'content', label: 'Email Content', type: 'textarea', required: true, placeholder: 'Paste your email content here' },
      { name: 'targetAudience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Small business owners in Miami' },
      { name: 'openRate', label: 'Current Open Rate (%)', type: 'number', placeholder: '21' },
      { name: 'clickRate', label: 'Current Click Rate (%)', type: 'number', placeholder: '2.6' }
    ]
  },
  {
    id: 'content_generate',
    name: 'Content Generator',
    description: 'Generate high-converting email copy, subject lines, and CTAs',
    category: 'marketing',
    icon: <FileText className="w-5 h-5" />,
    endpoint: '/api/ai/marketing/content/generate',
    color: 'from-purple-500 to-pink-500',
    fields: [
      { name: 'campaignType', label: 'Campaign Type', type: 'select', required: true, options: [
        { value: 'promotional', label: 'Promotional' },
        { value: 'newsletter', label: 'Newsletter' },
        { value: 'announcement', label: 'Announcement' },
        { value: 'welcome', label: 'Welcome Series' },
        { value: 'abandoned_cart', label: 'Abandoned Cart' }
      ]},
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'Florida restaurant owners' },
      { name: 'goal', label: 'Campaign Goal', type: 'text', placeholder: 'Increase weekend bookings' },
      { name: 'tone', label: 'Brand Tone', type: 'select', options: [
        { value: 'professional', label: 'Professional' },
        { value: 'friendly', label: 'Friendly' },
        { value: 'casual', label: 'Casual' },
        { value: 'urgent', label: 'Urgent' }
      ]},
      { name: 'product', label: 'Product/Service', type: 'text', placeholder: 'Weekend dinner special' },
      { name: 'offer', label: 'Special Offer', type: 'text', placeholder: '20% off for reservations' }
    ]
  },
  {
    id: 'subject_test',
    name: 'Subject Line Tester',
    description: 'Generate A/B test variations with psychological triggers',
    category: 'marketing',
    icon: <Mail className="w-5 h-5" />,
    endpoint: '/api/ai/marketing/subject/test',
    color: 'from-green-500 to-emerald-500',
    fields: [
      { name: 'originalSubject', label: 'Current Subject', type: 'text', required: true },
      { name: 'industry', label: 'Industry', type: 'text', placeholder: 'Restaurant' },
      { name: 'audience', label: 'Target Segment', type: 'text', placeholder: 'Local families' },
      { name: 'goal', label: 'Primary Goal', type: 'select', options: [
        { value: 'open_rate', label: 'Maximize Opens' },
        { value: 'urgency', label: 'Create Urgency' },
        { value: 'curiosity', label: 'Build Curiosity' },
        { value: 'value', label: 'Highlight Value' }
      ]}
    ]
  },
  {
    id: 'send_time_optimize',
    name: 'Send Time Optimizer',
    description: 'Find the perfect send time for maximum engagement',
    category: 'marketing',
    icon: <Clock className="w-5 h-5" />,
    endpoint: '/api/ai/marketing/sendtime/optimize',
    color: 'from-orange-500 to-red-500',
    fields: [
      { name: 'audience', label: 'Audience Type', type: 'select', required: true, options: [
        { value: 'b2b', label: 'Business (B2B)' },
        { value: 'b2c', label: 'Consumer (B2C)' },
        { value: 'mixed', label: 'Mixed Audience' }
      ]},
      { name: 'timezone', label: 'Primary Timezone', type: 'select', options: [
        { value: 'EST', label: 'Eastern Time' },
        { value: 'CST', label: 'Central Time (Panhandle)' }
      ]},
      { name: 'industry', label: 'Industry', type: 'text', placeholder: 'Retail' },
      { name: 'historicalData', label: 'Best Past Performance', type: 'text', placeholder: 'Tuesdays at 10am' }
    ]
  },
  {
    id: 'segment_analyze',
    name: 'Segment Analyzer',
    description: 'AI-powered customer segmentation and behavior prediction',
    category: 'marketing',
    icon: <Users className="w-5 h-5" />,
    endpoint: '/api/ai/marketing/segment/analyze',
    color: 'from-indigo-500 to-purple-500',
    fields: [
      { name: 'segmentName', label: 'Segment Name', type: 'text', required: true },
      { name: 'criteria', label: 'Segment Criteria', type: 'textarea', placeholder: 'Customers who purchased in last 30 days' },
      { name: 'size', label: 'Segment Size', type: 'number', placeholder: '1500' },
      { name: 'avgOrderValue', label: 'Avg Order Value ($)', type: 'number', placeholder: '85' }
    ]
  },
  {
    id: 'workflow_generate',
    name: 'Workflow Builder',
    description: 'Design automated marketing workflows that convert',
    category: 'marketing',
    icon: <Workflow className="w-5 h-5" />,
    endpoint: '/api/ai/marketing/workflow/generate',
    color: 'from-teal-500 to-green-500',
    fields: [
      { name: 'workflowType', label: 'Workflow Type', type: 'select', required: true, options: [
        { value: 'welcome', label: 'Welcome Series' },
        { value: 'nurture', label: 'Lead Nurturing' },
        { value: 'reengagement', label: 'Re-engagement' },
        { value: 'abandoned_cart', label: 'Abandoned Cart' },
        { value: 'post_purchase', label: 'Post-Purchase' }
      ]},
      { name: 'steps', label: 'Number of Steps', type: 'number', placeholder: '5' },
      { name: 'duration', label: 'Total Duration (days)', type: 'number', placeholder: '14' },
      { name: 'goal', label: 'Workflow Goal', type: 'text', placeholder: 'Convert trial users to paid' }
    ]
  },
  {
    id: 'form_optimize',
    name: 'Form Optimizer',
    description: 'Boost form conversion rates by 20-50%',
    category: 'marketing',
    icon: <FileText className="w-5 h-5" />,
    endpoint: '/api/ai/marketing/form/optimize',
    color: 'from-yellow-500 to-orange-500',
    fields: [
      { name: 'formType', label: 'Form Type', type: 'select', required: true, options: [
        { value: 'signup', label: 'Sign Up' },
        { value: 'contact', label: 'Contact' },
        { value: 'checkout', label: 'Checkout' },
        { value: 'survey', label: 'Survey' },
        { value: 'application', label: 'Application' }
      ]},
      { name: 'currentFields', label: 'Current Fields', type: 'textarea', placeholder: 'Name, Email, Phone, Company, Message' },
      { name: 'conversionRate', label: 'Current Conversion (%)', type: 'number', placeholder: '15' },
      { name: 'dropoffPoint', label: 'Main Drop-off Point', type: 'text', placeholder: 'Phone number field' }
    ]
  },

  // Marketplace Agents (8)
  {
    id: 'marketplace_optimize',
    name: 'Marketplace Optimizer',
    description: 'Strategic pricing and category analysis for Florida businesses',
    category: 'marketplace',
    icon: <ShoppingCart className="w-5 h-5" />,
    endpoint: '/api/ai/marketplace/optimize',
    color: 'from-blue-500 to-indigo-500',
    fields: [
      { name: 'businessId', label: 'Business ID', type: 'text', required: true },
      { name: 'category', label: 'Product Category', type: 'text', placeholder: 'Beachwear' },
      { name: 'currentPrice', label: 'Current Price ($)', type: 'number', placeholder: '29.99' },
      { name: 'location', label: 'Florida Region', type: 'select', options: [
        { value: 'south', label: 'South Florida' },
        { value: 'central', label: 'Central Florida' },
        { value: 'north', label: 'North Florida' },
        { value: 'panhandle', label: 'Panhandle' },
        { value: 'keys', label: 'Florida Keys' }
      ]}
    ]
  },
  {
    id: 'gmb_orchestrate',
    name: 'GMB Orchestrator',
    description: 'Google My Business optimization and local SEO',
    category: 'marketplace',
    icon: <MapPin className="w-5 h-5" />,
    endpoint: '/api/ai/gmb/orchestrate',
    color: 'from-green-500 to-teal-500',
    fields: [
      { name: 'businessId', label: 'Business ID', type: 'text', required: true },
      { name: 'gmbId', label: 'GMB Listing ID', type: 'text' },
      { name: 'objective', label: 'Optimization Goal', type: 'select', options: [
        { value: 'reviews', label: 'Improve Reviews' },
        { value: 'visibility', label: 'Increase Visibility' },
        { value: 'posts', label: 'Content Strategy' },
        { value: 'qa', label: 'Q&A Management' }
      ]}
    ]
  },
  {
    id: 'fraud_detect',
    name: 'Fraud Detector',
    description: 'Advanced security and anomaly detection',
    category: 'marketplace',
    icon: <Shield className="w-5 h-5" />,
    endpoint: '/api/ai/security/fraud/detect',
    color: 'from-red-500 to-pink-500',
    fields: [
      { name: 'transactionId', label: 'Transaction ID', type: 'text' },
      { name: 'userId', label: 'User ID', type: 'text' },
      { name: 'amount', label: 'Transaction Amount ($)', type: 'number' },
      { name: 'type', label: 'Check Type', type: 'select', options: [
        { value: 'transaction', label: 'Transaction' },
        { value: 'review', label: 'Review Authenticity' },
        { value: 'account', label: 'Account Activity' },
        { value: 'vendor', label: 'Vendor Verification' }
      ]}
    ]
  },
  {
    id: 'customer_success',
    name: 'Customer Success AI',
    description: 'Predict churn and improve retention',
    category: 'marketplace',
    icon: <UserCheck className="w-5 h-5" />,
    endpoint: '/api/ai/customer/success',
    color: 'from-purple-500 to-indigo-500',
    fields: [
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true },
      { name: 'lastActivity', label: 'Days Since Last Activity', type: 'number' },
      { name: 'totalSpent', label: 'Total Spent ($)', type: 'number' },
      { name: 'supportTickets', label: 'Recent Support Tickets', type: 'number' }
    ]
  },
  {
    id: 'spotlight_curate',
    name: 'Spotlight Curator',
    description: 'AI curation for featured businesses',
    category: 'marketplace',
    icon: <Trophy className="w-5 h-5" />,
    endpoint: '/api/ai/spotlight/curate',
    color: 'from-yellow-500 to-red-500',
    fields: [
      { name: 'category', label: 'Business Category', type: 'text' },
      { name: 'region', label: 'Florida Region', type: 'text' },
      { name: 'criteria', label: 'Selection Criteria', type: 'select', options: [
        { value: 'trending', label: 'Trending Now' },
        { value: 'new', label: 'New & Noteworthy' },
        { value: 'top_rated', label: 'Top Rated' },
        { value: 'seasonal', label: 'Seasonal Picks' }
      ]}
    ]
  },
  {
    id: 'product_intelligence',
    name: 'Product Intelligence',
    description: 'Smart product recommendations and insights',
    category: 'marketplace',
    icon: <Brain className="w-5 h-5" />,
    endpoint: '/api/ai/product/intelligence',
    color: 'from-cyan-500 to-blue-500',
    fields: [
      { name: 'productId', label: 'Product ID', type: 'text' },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'analysisType', label: 'Analysis Type', type: 'select', options: [
        { value: 'pricing', label: 'Pricing Strategy' },
        { value: 'demand', label: 'Demand Forecast' },
        { value: 'competition', label: 'Competitive Analysis' },
        { value: 'bundling', label: 'Bundle Suggestions' }
      ]}
    ]
  },
  {
    id: 'vendor_coach',
    name: 'Vendor Coach',
    description: 'Personalized coaching for vendor success',
    category: 'marketplace',
    icon: <Rocket className="w-5 h-5" />,
    endpoint: '/api/ai/vendor/coach',
    color: 'from-indigo-500 to-blue-500',
    fields: [
      { name: 'vendorId', label: 'Vendor ID', type: 'text', required: true },
      { name: 'metric', label: 'Focus Area', type: 'select', options: [
        { value: 'sales', label: 'Increase Sales' },
        { value: 'conversion', label: 'Improve Conversion' },
        { value: 'inventory', label: 'Inventory Management' },
        { value: 'customer_service', label: 'Customer Service' }
      ]}
    ]
  },
  {
    id: 'inventory_optimize',
    name: 'Inventory Optimizer',
    description: 'Demand forecasting and stock optimization',
    category: 'marketplace',
    icon: <Package className="w-5 h-5" />,
    endpoint: '/api/ai/inventory/optimize',
    color: 'from-green-500 to-cyan-500',
    fields: [
      { name: 'productId', label: 'Product ID', type: 'text', required: true },
      { name: 'currentStock', label: 'Current Stock', type: 'number' },
      { name: 'salesVelocity', label: 'Daily Sales Avg', type: 'number' },
      { name: 'seasonality', label: 'Season', type: 'select', options: [
        { value: 'high', label: 'High Season (Winter)' },
        { value: 'low', label: 'Low Season (Summer)' },
        { value: 'hurricane', label: 'Hurricane Season' },
        { value: 'holiday', label: 'Holiday Period' }
      ]}
    ]
  }
];

interface TaskStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  progress?: number;
}

export default function AIAgentsHub() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [tasks, setTasks] = useState<Record<string, TaskStatus>>({});
  const [activeCategory, setActiveCategory] = useState<'all' | 'marketing' | 'marketplace'>('all');

  // Execute agent task
  const executeMutation = useMutation({
    mutationFn: async ({ agent, data }: { agent: AIAgent; data: any }) => {
      return await apiRequest('POST', agent.endpoint, data);
    },
    onSuccess: (response, { agent }) => {
      const taskId = response.taskId || response.id;

      if (taskId) {
        // Track task for status updates
        setTasks(prev => ({
          ...prev,
          [taskId]: {
            id: taskId,
            status: 'processing',
            progress: 10
          }
        }));

        // Start polling for results
        pollTaskStatus(taskId);

        toast({
          title: "AI Agent Started",
          description: `${agent.name} is processing your request. Task ID: ${taskId}`,
        });
      } else if (response.result) {
        // Immediate result
        toast({
          title: "AI Agent Completed",
          description: `${agent.name} has completed the task successfully.`,
        });
      }

      // Clear form
      setFormData({});
      setSelectedAgent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Agent Error",
        description: error.message || "Failed to execute AI agent task",
        variant: "destructive",
      });
    }
  });

  // Poll for task status
  const pollTaskStatus = async (taskId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const poll = async () => {
      attempts++;

      try {
        const status = await apiRequest('GET', `/api/ai/tasks/${taskId}`);

        setTasks(prev => ({
          ...prev,
          [taskId]: {
            ...status,
            progress: Math.min(90, attempts * 3)
          }
        }));

        if (status.status === 'completed') {
          toast({
            title: "AI Task Completed",
            description: "Your AI agent task has been completed successfully.",
          });

          // Show results in a modal or dedicated view
          console.log('Task completed:', status.result);
        } else if (status.status === 'failed') {
          toast({
            title: "AI Task Failed",
            description: status.error || "The AI agent task failed to complete.",
            variant: "destructive",
          });
        } else if (attempts < maxAttempts) {
          // Continue polling
          setTimeout(poll, 2000);
        } else {
          toast({
            title: "Task Timeout",
            description: "The AI agent task is taking longer than expected.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error polling task:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        }
      }
    };

    poll();
  };

  const handleSubmit = () => {
    if (!selectedAgent) return;

    // Validate required fields
    const missingFields = selectedAgent.fields
      .filter(f => f.required && !formData[f.name])
      .map(f => f.label);

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    executeMutation.mutate({ agent: selectedAgent, data: formData });
  };

  const filteredAgents = activeCategory === 'all'
    ? AI_AGENTS
    : AI_AGENTS.filter(a => a.category === activeCategory);

  const getTaskIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'processing': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-[var(--fl-teal-lagoon)] via-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] bg-clip-text text-transparent">
          Choose Your AI Agent
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select from our suite of specialized agents designed to supercharge your Florida business
        </p>
      </div>

      {/* Active Tasks */}
      {Object.keys(tasks).length > 0 && (
        <Card className="border-2 border-[var(--fl-teal-lagoon)]/30 bg-gradient-to-br from-white/95 to-[var(--fl-teal-lagoon)]/5 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Workflow className="h-5 w-5 text-[var(--fl-teal-lagoon)]" />
              Active AI Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(tasks).map(([taskId, task]) => (
                <div key={taskId} className="flex items-center justify-between p-4 rounded-lg bg-white/80 border border-[var(--fl-teal-lagoon)]/20 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    {getTaskIcon(task.status)}
                    <span className="text-sm font-medium">Task {taskId.slice(0, 8)}</span>
                    <Badge variant={task.status === 'completed' ? 'success' : 'secondary'}>
                      {task.status}
                    </Badge>
                  </div>
                  {task.progress && task.status === 'processing' && (
                    <Progress value={task.progress} className="w-32" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto h-14 bg-white/80 shadow-lg border border-[var(--fl-teal-lagoon)]/20">
          <TabsTrigger value="all" className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--fl-teal-lagoon)] data-[state=active]:to-[var(--fl-sunset-gold)] data-[state=active]:text-white">
            All Agents
            <Badge variant="secondary" className="ml-2 data-[state=active]:bg-white/20">{AI_AGENTS.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="marketing" className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--fl-sunset-gold)] data-[state=active]:to-[var(--fl-bronze)] data-[state=active]:text-white">
            Marketing
            <Badge variant="secondary" className="ml-2 data-[state=active]:bg-white/20">7</Badge>
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--fl-teal-lagoon)] data-[state=active]:to-blue-500 data-[state=active]:text-white">
            Marketplace
            <Badge variant="secondary" className="ml-2 data-[state=active]:bg-white/20">8</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent, index) => (
              <Card
                key={agent.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-white/95 backdrop-blur-sm ${
                  selectedAgent?.id === agent.id
                    ? 'ring-2 ring-[var(--fl-sunset-gold)] shadow-[0_0_30px_rgba(212,175,55,0.3)]'
                    : 'hover:ring-2 hover:ring-[var(--fl-teal-lagoon)]/30'
                }`}
                onClick={() => setSelectedAgent(agent)}
                style={{
                  animationDelay: `${index * 0.05}s`
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${agent.color} text-white shadow-lg transform group-hover:scale-110 transition-transform`}>
                      {agent.icon}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs font-semibold border-[var(--fl-teal-lagoon)]/30 bg-[var(--fl-teal-lagoon)]/5"
                    >
                      {agent.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {agent.name}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {agent.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className={`w-full font-semibold transition-all ${
                      selectedAgent?.id === agent.id
                        ? 'bg-gradient-to-r from-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] hover:shadow-lg'
                        : 'bg-gradient-to-r from-[var(--fl-teal-lagoon)] to-blue-500 text-white hover:shadow-lg'
                    }`}
                    variant={selectedAgent?.id === agent.id ? "default" : "default"}
                  >
                    {selectedAgent?.id === agent.id ? "✓ Selected" : "Select Agent"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Agent Configuration Panel */}
      {selectedAgent && (
        <Card className="border-2 border-[var(--fl-sunset-gold)]/40 bg-gradient-to-br from-white/95 to-[var(--fl-sunset-gold)]/5 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-[var(--fl-teal-lagoon)]/10 to-[var(--fl-sunset-gold)]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${selectedAgent.color} text-white shadow-lg`}>
                  {selectedAgent.icon}
                </div>
                <div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-[var(--fl-teal-lagoon)] to-[var(--fl-sunset-gold)] bg-clip-text text-transparent">
                    {selectedAgent.name}
                  </CardTitle>
                  <CardDescription className="text-base">{selectedAgent.description}</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedAgent(null);
                  setFormData({});
                }}
                className="hover:bg-red-100 hover:text-red-600 rounded-full"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              {selectedAgent.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name} className="text-sm font-semibold text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="border-[var(--fl-teal-lagoon)]/30 focus:border-[var(--fl-sunset-gold)] focus:ring-[var(--fl-sunset-gold)] bg-white/80"
                      rows={4}
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={formData[field.name] || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, [field.name]: value }))}
                    >
                      <SelectTrigger className="border-[var(--fl-teal-lagoon)]/30 focus:border-[var(--fl-sunset-gold)] focus:ring-[var(--fl-sunset-gold)] bg-white/80">
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="border-[var(--fl-teal-lagoon)]/30 focus:border-[var(--fl-sunset-gold)] focus:ring-[var(--fl-sunset-gold)] bg-white/80"
                    />
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-6 border-t border-[var(--fl-teal-lagoon)]/20">
                <Button
                  onClick={handleSubmit}
                  disabled={executeMutation.isPending}
                  className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] hover:shadow-xl transition-all"
                >
                  {executeMutation.isPending ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Execute AI Agent
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFormData({})}
                  disabled={executeMutation.isPending}
                  className="h-12 px-8 border-[var(--fl-teal-lagoon)]/30 hover:bg-[var(--fl-teal-lagoon)]/10"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}