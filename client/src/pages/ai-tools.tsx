import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import AIAgentsHub from "@/components/ai-agents-hub";
import VisualSearch from "@/components/visual-search";
import VoiceSearch from "@/components/voice-search";
import PiAPIImageGenerator from "@/components/piapi-image-generator";
import AIContentGenerator from "@/components/ai-content-generator";
import VisualCommerce from "@/components/visual-commerce";
import VoiceCommerce from "@/components/voice-commerce";
import { motion } from "framer-motion";
import {
  Bot,
  Eye,
  Mic,
  Wand2,
  FileText,
  Brain,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp,
  Shield,
  Users,
  Package,
  BarChart,
  Rocket,
  ShoppingCart,
  Headphones,
  Layers
} from "lucide-react";

interface AIToolCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  color: string;
  features: string[];
}

const AI_TOOLS: AIToolCard[] = [
  {
    id: 'agents',
    title: 'AI Agents Hub',
    description: '15 specialized AI agents for marketing and business optimization',
    icon: <Bot className="w-6 h-6" />,
    badge: '15 Agents',
    color: 'from-purple-500 to-blue-500',
    features: [
      'Campaign optimization',
      'Content generation',
      'Fraud detection',
      'Customer success prediction'
    ]
  },
  {
    id: 'visual',
    title: 'Visual Search',
    description: 'Search products using images with GPT-4 Vision',
    icon: <Eye className="w-6 h-6" />,
    badge: 'GPT-4 Vision',
    color: 'from-blue-500 to-cyan-500',
    features: [
      'Image analysis',
      'Product matching',
      'Style detection',
      'Color extraction'
    ]
  },
  {
    id: 'voice',
    title: 'Voice Search',
    description: 'Hands-free search with Whisper API transcription',
    icon: <Mic className="w-6 h-6" />,
    badge: 'Whisper API',
    color: 'from-green-500 to-emerald-500',
    features: [
      'Voice commands',
      'Natural language',
      'Multi-language support',
      'Voice feedback'
    ]
  },
  {
    id: 'generate',
    title: 'Image Studio',
    description: 'Generate stunning images with PiAPI models',
    icon: <Wand2 className="w-6 h-6" />,
    badge: '8 Models',
    color: 'from-purple-500 to-pink-500',
    features: [
      'Product photography',
      'Marketing materials',
      'Social media content',
      'Style presets'
    ]
  },
  {
    id: 'content',
    title: 'Content Generator',
    description: 'AI-powered content creation for all platforms',
    icon: <FileText className="w-6 h-6" />,
    badge: 'GPT-4',
    color: 'from-orange-500 to-red-500',
    features: [
      'Blog posts',
      'Social media',
      'Email campaigns',
      'Product descriptions'
    ]
  },
  {
    id: 'visual-commerce',
    title: 'Visual Commerce',
    description: 'Create shoppable images with product tagging and AR',
    icon: <Layers className="w-6 h-6" />,
    badge: 'NEW',
    color: 'from-purple-500 to-pink-500',
    features: [
      'Shoppable images',
      'Auto product detection',
      'AR product preview',
      'Visual analytics'
    ]
  },
  {
    id: 'voice-commerce',
    title: 'Voice Commerce',
    description: 'Shop hands-free with AI voice assistant',
    icon: <Headphones className="w-6 h-6" />,
    badge: 'ElevenLabs',
    color: 'from-blue-500 to-purple-500',
    features: [
      'Voice shopping',
      'Natural conversation',
      'Multi-voice support',
      'Cart management'
    ]
  }
];

export default function AIToolsPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { label: 'AI Agents', value: '15', icon: <Bot className="w-5 h-5" /> },
    { label: 'Models Available', value: '12+', icon: <Brain className="w-5 h-5" /> },
    { label: 'Tasks Automated', value: '50+', icon: <Zap className="w-5 h-5" /> },
    { label: 'Time Saved', value: '10h/week', icon: <TrendingUp className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10" />
        <div className="container mx-auto px-4 py-12 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-center">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-2xl">
                  <Brain className="w-12 h-12 text-white" />
                </div>
              </div>

              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Tools Command Center
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Harness the power of advanced AI to transform your business with intelligent automation,
                content generation, and predictive insights
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="border-2 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-center mb-2 text-purple-600">
                          {stat.icon}
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 h-auto p-1">
            <TabsTrigger value="overview" className="flex flex-col py-3">
              <Sparkles className="w-4 h-4 mb-1" />
              <span className="text-xs">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex flex-col py-3">
              <Bot className="w-4 h-4 mb-1" />
              <span className="text-xs">Agents</span>
            </TabsTrigger>
            <TabsTrigger value="visual" className="flex flex-col py-3">
              <Eye className="w-4 h-4 mb-1" />
              <span className="text-xs">Visual</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex flex-col py-3">
              <Mic className="w-4 h-4 mb-1" />
              <span className="text-xs">Voice</span>
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex flex-col py-3">
              <Wand2 className="w-4 h-4 mb-1" />
              <span className="text-xs">Images</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex flex-col py-3">
              <FileText className="w-4 h-4 mb-1" />
              <span className="text-xs">Content</span>
            </TabsTrigger>
            <TabsTrigger value="visual-commerce" className="flex flex-col py-3">
              <Layers className="w-4 h-4 mb-1" />
              <span className="text-xs">Shop Visual</span>
            </TabsTrigger>
            <TabsTrigger value="voice-commerce" className="flex flex-col py-3">
              <Headphones className="w-4 h-4 mb-1" />
              <span className="text-xs">Shop Voice</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {AI_TOOLS.map((tool, i) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="hover:shadow-xl transition-all cursor-pointer group h-full"
                    onClick={() => setActiveTab(tool.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.color} text-white`}>
                          {tool.icon}
                        </div>
                        {tool.badge && (
                          <Badge variant="secondary">{tool.badge}</Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{tool.title}</CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {tool.features.map((feature, j) => (
                          <li key={j} className="flex items-center text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full mt-4 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 transition-all"
                        variant="outline"
                      >
                        Explore Tool
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle>Quick AI Actions</CardTitle>
                <CardDescription>Get started with common AI tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto flex flex-col py-4"
                    onClick={() => setActiveTab('agents')}
                  >
                    <TrendingUp className="w-6 h-6 mb-2 text-blue-600" />
                    <span className="text-xs">Optimize Campaign</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex flex-col py-4"
                    onClick={() => setActiveTab('generate')}
                  >
                    <Package className="w-6 h-6 mb-2 text-purple-600" />
                    <span className="text-xs">Product Images</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex flex-col py-4"
                    onClick={() => setActiveTab('content')}
                  >
                    <FileText className="w-6 h-6 mb-2 text-green-600" />
                    <span className="text-xs">Write Content</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex flex-col py-4"
                    onClick={() => setActiveTab('voice')}
                  >
                    <Shield className="w-6 h-6 mb-2 text-red-600" />
                    <span className="text-xs">Voice Search</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Section */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <Rocket className="w-8 h-8 text-purple-600 mb-2" />
                  <CardTitle>Accelerate Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Automate repetitive tasks and focus on strategic growth with AI-powered tools
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart className="w-8 h-8 text-blue-600 mb-2" />
                  <CardTitle>Data-Driven Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Make informed decisions with predictive analytics and intelligent recommendations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="w-8 h-8 text-green-600 mb-2" />
                  <CardTitle>Enhanced Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Deliver personalized customer experiences with AI-driven content and interactions
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Individual Tool Tabs */}
          <TabsContent value="agents">
            <AIAgentsHub />
          </TabsContent>

          <TabsContent value="visual">
            <VisualSearch />
          </TabsContent>

          <TabsContent value="voice">
            <VoiceSearch />
          </TabsContent>

          <TabsContent value="generate">
            <PiAPIImageGenerator />
          </TabsContent>

          <TabsContent value="content">
            <AIContentGenerator />
          </TabsContent>

          <TabsContent value="visual-commerce">
            <VisualCommerce />
          </TabsContent>

          <TabsContent value="voice-commerce">
            <VoiceCommerce />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}