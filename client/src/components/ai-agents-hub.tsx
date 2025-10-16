import { useState, useEffect, type ReactNode } from "react";
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
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
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
  RefreshCw,
  Star,
  Flame,
  ChevronRight
} from "lucide-react";

interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: 'marketing' | 'marketplace' | 'business';
  icon: ReactNode;
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const heroVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

export default function AIAgentsHub() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [tasks, setTasks] = useState<Record<string, TaskStatus>>({});
  const [activeCategory, setActiveCategory] = useState<'all' | 'marketing' | 'marketplace'>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  // Check for reduced motion preference (with safe check for SSR/test environments)
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Execute agent task
  const executeMutation = useMutation({
    mutationFn: async ({ agent, data }: { agent: AIAgent; data: any }) => {
      const response = await apiRequest('POST', agent.endpoint, data);
      return await response.json();
    },
    onSuccess: (data, { agent }) => {
      const taskId = data.taskId || data.id;

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
      } else if (data.result) {
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
        const response = await apiRequest('GET', `/api/ai/tasks/${taskId}`);
        const status = await response.json();

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
      case 'processing': return <RefreshCw className={`w-4 h-4 text-blue-600 ${prefersReducedMotion ? '' : 'animate-spin'}`} />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--fl-teal-lagoon)]/5 via-transparent to-[var(--fl-sunset-gold)]/5 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--fl-teal-lagoon)]/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--fl-sunset-gold)]/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />
      
      <div className="relative z-10 space-y-8 pb-12">
        {/* Premium Hero Section */}
        <motion.div 
          className="text-center py-12 relative"
          initial="hidden"
          animate="visible"
          variants={heroVariants}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--fl-teal-lagoon)]/5 to-transparent" />
          <div className="relative">
            <motion.div
              animate={prefersReducedMotion ? {} : { 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
              className="inline-block mb-4"
            >
              <Sparkles className="w-16 h-16 text-[var(--fl-sunset-gold)] drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
            </motion.div>
            
            <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[var(--fl-teal-lagoon)] via-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] bg-clip-text text-transparent drop-shadow-2xl">
              AI Command Center
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light">
              Unleash the power of <span className="font-semibold text-[var(--fl-sunset-gold)]">15 specialized AI agents</span> designed to supercharge your business
            </p>
            
            {/* Floating stats */}
            <div className="flex justify-center gap-6 mt-8">
              <motion.div 
                className="px-6 py-3 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-[var(--fl-teal-lagoon)]/30 shadow-lg"
                whileHover={prefersReducedMotion ? {} : { scale: 1.05, y: -2 }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[var(--fl-sunset-gold)]" />
                  <span className="font-semibold text-sm">Ultra Fast</span>
                </div>
              </motion.div>
              <motion.div 
                className="px-6 py-3 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-[var(--fl-sunset-gold)]/30 shadow-lg"
                whileHover={prefersReducedMotion ? {} : { scale: 1.05, y: -2 }}
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[var(--fl-teal-lagoon)]" />
                  <span className="font-semibold text-sm">AI Powered</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

      {/* Active Tasks with Premium Design */}
      <AnimatePresence>
        {Object.keys(tasks).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
              {/* Metallic shine */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
              
              {/* Holographic overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
              
              {/* Scan line */}
              <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-xl flex items-center gap-3">
                  <motion.div
                    animate={prefersReducedMotion ? {} : { rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Workflow className="h-6 w-6 text-[var(--fl-teal-lagoon)]" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-[var(--fl-teal-lagoon)] to-[var(--fl-sunset-gold)] bg-clip-text text-transparent">
                    Active AI Tasks
                  </span>
                  <Badge variant="secondary" className="bg-[var(--fl-sunset-gold)]/20 text-[var(--fl-sunset-gold)]">
                    {Object.keys(tasks).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-3">
                  {Object.entries(tasks).map(([taskId, task], index) => (
                    <motion.div
                      key={taskId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/90 dark:bg-black/40 border-2 border-[var(--fl-teal-lagoon)]/30 shadow-lg hover:shadow-2xl hover:border-[var(--fl-sunset-gold)]/50 transition-all duration-300 backdrop-blur-sm relative overflow-hidden group"
                    >
                      {/* Pulsing background for processing tasks */}
                      {task.status === 'processing' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--fl-teal-lagoon)]/10 to-[var(--fl-sunset-gold)]/10 animate-pulse" />
                      )}
                      
                      <div className="flex items-center gap-3 relative z-10">
                        <motion.div
                          animate={task.status === 'processing' && !prefersReducedMotion ? { 
                            scale: [1, 1.2, 1],
                            rotate: [0, 180, 360]
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {getTaskIcon(task.status)}
                        </motion.div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Task {taskId.slice(0, 8)}
                          </span>
                          <Badge 
                            variant="secondary"
                            className={`ml-2 ${
                              task.status === 'completed' 
                                ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50'
                                : task.status === 'processing'
                                ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50'
                                : 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/50'
                            }`}
                          >
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                      {task.progress !== undefined && task.status === 'processing' && (
                        <div className="flex items-center gap-3 relative z-10">
                          <span className="text-xs font-semibold text-[var(--fl-teal-lagoon)]">{task.progress}%</span>
                          <Progress 
                            value={task.progress} 
                            className="w-32 h-2 bg-gray-200 dark:bg-gray-700"
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto h-16 bg-white/90 dark:bg-black/40 backdrop-blur-xl shadow-2xl border-2 border-[var(--fl-teal-lagoon)]/30 rounded-2xl p-1 relative overflow-hidden">
          {/* Animated glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--fl-teal-lagoon)]/10 via-[var(--fl-sunset-gold)]/10 to-[var(--fl-teal-lagoon)]/10 opacity-50 blur-xl" />
          
          <TabsTrigger 
            value="all" 
            className="text-base font-bold relative z-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--fl-teal-lagoon)] data-[state=active]:to-[var(--fl-sunset-gold)] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(0,128,128,0.5)] transition-all duration-300 rounded-xl data-[state=inactive]:hover:bg-[var(--fl-teal-lagoon)]/10"
            data-testid="tab-all"
          >
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-4 h-4" />
              All Agents
              <Badge variant="secondary" className="ml-1 bg-[var(--fl-sunset-gold)]/20 text-[var(--fl-sunset-gold)] data-[state=active]:bg-white/30 data-[state=active]:text-white border-0">
                {AI_AGENTS.length}
              </Badge>
            </motion.div>
          </TabsTrigger>
          <TabsTrigger 
            value="marketing" 
            className="text-base font-bold relative z-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--fl-sunset-gold)] data-[state=active]:to-[var(--fl-bronze)] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(212,175,55,0.5)] transition-all duration-300 rounded-xl data-[state=inactive]:hover:bg-[var(--fl-sunset-gold)]/10"
            data-testid="tab-marketing"
          >
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <TrendingUp className="w-4 h-4" />
              Marketing
              <Badge variant="secondary" className="ml-1 bg-[var(--fl-teal-lagoon)]/20 text-[var(--fl-teal-lagoon)] data-[state=active]:bg-white/30 data-[state=active]:text-white border-0">
                7
              </Badge>
            </motion.div>
          </TabsTrigger>
          <TabsTrigger 
            value="marketplace" 
            className="text-base font-bold relative z-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--fl-teal-lagoon)] data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(0,128,128,0.5)] transition-all duration-300 rounded-xl data-[state=inactive]:hover:bg-blue-500/10"
            data-testid="tab-marketplace"
          >
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart className="w-4 h-4" />
              Marketplace
              <Badge variant="secondary" className="ml-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 data-[state=active]:bg-white/30 data-[state=active]:text-white border-0">
                8
              </Badge>
            </motion.div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-8">
          <motion.div 
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredAgents.map((agent, index) => (
              <motion.div
                key={agent.id}
                variants={cardVariants}
                whileHover={prefersReducedMotion ? {} : { 
                  scale: 1.03,
                  rotateY: 5,
                  z: 50
                }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                onHoverStart={() => setHoveredCard(agent.id)}
                onHoverEnd={() => setHoveredCard(null)}
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: 1000
                }}
              >
                <Card
                  className={`h-full cursor-pointer bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group ${
                    selectedAgent?.id === agent.id
                      ? 'ring-4 ring-cyan-400/50 shadow-[0_0_50px_rgba(0,255,255,0.4)] border-cyan-400'
                      : ''
                  }`}
                  onClick={() => setSelectedAgent(agent)}
                  data-testid={`card-agent-${agent.id}`}
                >
                  {/* Metallic shine */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                  
                  {/* Holographic overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
                  
                  {/* Scan line */}
                  <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
                  
                  {/* Circuit pattern */}
                  <div className="absolute inset-0 cyber-circuit-pattern opacity-5 group-hover:opacity-10 transition-opacity z-0" />

                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <motion.div 
                        className={`p-3 rounded-xl bg-gradient-to-br ${agent.color} text-white shadow-lg relative overflow-hidden`}
                        whileHover={prefersReducedMotion ? {} : { rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        {/* Icon glow effect */}
                        <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm group-hover:bg-white/40 transition-all" />
                        <div className="relative z-10">{agent.icon}</div>
                      </motion.div>
                      <Badge
                        variant="outline"
                        className="text-xs font-semibold border-[var(--fl-teal-lagoon)]/40 bg-gradient-to-r from-[var(--fl-teal-lagoon)]/10 to-[var(--fl-sunset-gold)]/10 backdrop-blur-sm"
                      >
                        {agent.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-gray-900 dark:from-gray-100 to-gray-600 dark:to-gray-400 bg-clip-text text-transparent group-hover:from-[var(--fl-teal-lagoon)] group-hover:to-[var(--fl-sunset-gold)] transition-all duration-300">
                      {agent.name}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <Button
                      className={`w-full font-semibold transition-all duration-300 relative overflow-hidden group/btn ${
                        selectedAgent?.id === agent.id
                          ? 'bg-gradient-to-r from-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] text-white'
                          : 'bg-gradient-to-r from-[var(--fl-teal-lagoon)] to-blue-500 text-white hover:shadow-[0_0_30px_rgba(0,128,128,0.5)]'
                      }`}
                      data-testid={`button-select-${agent.id}`}
                    >
                      {/* Button shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {selectedAgent?.id === agent.id ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Selected
                          </>
                        ) : (
                          <>
                            Select Agent
                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                          </>
                        )}
                      </span>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Agent Configuration Panel with Premium Design */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
          >
            <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
              {/* Metallic shine */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
              
              {/* Holographic overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
              
              {/* Scan line */}
              <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
              
              {/* Circuit pattern */}
              <div className="absolute inset-0 cyber-circuit-pattern opacity-5 group-hover:opacity-10 transition-opacity z-0" />
              
              <CardHeader className="bg-gradient-to-r from-[var(--fl-teal-lagoon)]/10 to-[var(--fl-sunset-gold)]/10 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={`p-4 rounded-2xl bg-gradient-to-br ${selectedAgent.color} text-white shadow-2xl relative overflow-hidden`}
                      whileHover={prefersReducedMotion ? {} : { rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm" />
                      <div className="relative z-10">
                        {selectedAgent.icon}
                      </div>
                    </motion.div>
                    <div>
                      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[var(--fl-teal-lagoon)] via-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] bg-clip-text text-transparent">
                        {selectedAgent.name}
                      </CardTitle>
                      <CardDescription className="text-base mt-1 text-gray-600 dark:text-gray-400">{selectedAgent.description}</CardDescription>
                    </div>
                  </div>
                  <motion.div
                    whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: 90 }}
                    whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAgent(null);
                        setFormData({});
                      }}
                      className="hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-full h-10 w-10 p-0"
                      data-testid="button-close-agent"
                    >
                      ✕
                    </Button>
                  </motion.div>
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
      </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}