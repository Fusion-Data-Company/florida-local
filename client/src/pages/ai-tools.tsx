import { useState, useEffect } from "react";
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
import { Scene } from "@/components/ui/hero-section";
import { motion } from "framer-motion";
import { HolographicCard } from "@/components/ui/holographic-card";
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
  Layers,
  Cpu,
  ShieldCheck
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

  // Check URL params for tab parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  const stats = [
    { label: 'AI Agents', value: '15', icon: <Bot className="w-5 h-5" /> },
    { label: 'Models Available', value: '12+', icon: <Brain className="w-5 h-5" /> },
    { label: 'Tasks Automated', value: '50+', icon: <Zap className="w-5 h-5" /> },
    { label: 'Time Saved', value: '10h/week', icon: <TrendingUp className="w-5 h-5" /> }
  ];

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/backgrounds/glowing-bubbles-orange-blue.avif')",
        backgroundSize: '100% auto',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: '#000'
      }}
    >

      {/* Hero Section */}
      <div className="min-h-svh w-full text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* 3D Animation Layer - Behind content */}
        <div className='absolute inset-0 z-0'>
          <Scene />
        </div>
        
        <div className="w-full max-w-6xl space-y-12 relative z-10">
          <div className="flex flex-col items-center text-center space-y-8">
            <Badge 
              variant="secondary" 
              className="bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:backdrop-blur-sm px-4 py-2 rounded-full relative overflow-hidden"
              data-testid="badge-hero"
            >
              <span className="relative z-10">✨ AI Tools Command Center</span>
              <div className="absolute inset-0 opacity-0 hover:opacity-100 cyber-metallic-shine" />
            </Badge>
            
            <div className="space-y-6 flex items-center justify-center flex-col">
              <h1 className="text-3xl md:text-6xl font-semibold tracking-tight max-w-3xl cyber-chromatic-text" data-testid="text-hero-title">
                Harness the power of advanced AI automation
              </h1>
              <p className="text-lg text-neutral-300 max-w-2xl" data-testid="text-hero-description">
                Transform your business with intelligent automation, content generation, and predictive insights. Experience ultra-fast processing, advanced security, and intuitive design.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button 
                  className="text-sm px-8 py-3 rounded-xl bg-white text-black border border-white/10 shadow-none hover:bg-white/90 transition-all duration-200 relative overflow-hidden group cyber-3d-lift"
                  onClick={() => setActiveTab('agents')}
                  data-testid="button-get-started"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 cyber-metallic-shine opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
                <Button 
                  className="text-sm px-8 py-3 rounded-xl bg-transparent text-white border border-white/20 shadow-none hover:bg-white/10 transition-all duration-200 relative overflow-hidden group cyber-3d-lift cyber-energy-border"
                  onClick={() => setActiveTab('overview')}
                  data-testid="button-learn-more"
                >
                  <span className="relative z-10">Learn More</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="backdrop-blur-sm bg-white/5 border-2 border-white/10 rounded-xl p-4 md:p-6 h-40 md:h-48 flex flex-col justify-start items-start space-y-2 md:space-y-3 hover:bg-white/10 transition-all duration-200 relative overflow-hidden group cyber-3d-lift"
                data-testid={`card-stat-${idx}`}
              >
                {/* Circuit pattern */}
                <div className="absolute inset-0 cyber-circuit-pattern opacity-5 group-hover:opacity-10 transition-opacity" />
                
                {/* Energy border */}
                <div className="absolute inset-0 cyber-energy-border opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="text-white/80 md:w-5 md:h-5 relative z-10 group-hover:cyber-text-glow">
                  {stat.icon}
                </div>
                <h3 className="text-2xl font-bold relative z-10 group-hover:cyber-chromatic-text">{stat.value}</h3>
                <p className="text-xs md:text-sm text-neutral-400 relative z-10">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative">
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 relative z-10">
          <TabsList className="grid w-full grid-cols-7 h-auto p-1 bg-black backdrop-blur-sm border border-gray-800 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <TabsTrigger
              value="overview"
              className="flex flex-col py-3 data-[state=active]:bg-gray-900 data-[state=active]:border-gray-700 data-[state=active]:border data-[state=active]:shadow-none rounded-xl transition-all duration-300 text-gray-400 data-[state=active]:text-gray-200"
              data-testid="tab-overview"
            >
              <Sparkles className="w-4 h-4 mb-1" />
              <span className="text-xs">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="agents"
              className="flex flex-col py-3 data-[state=active]:bg-gray-900 data-[state=active]:border-gray-700 data-[state=active]:border data-[state=active]:shadow-none rounded-xl transition-all duration-300 text-gray-400 data-[state=active]:text-gray-200"
              data-testid="tab-agents"
            >
              <Bot className="w-4 h-4 mb-1" />
              <span className="text-xs">Agents</span>
            </TabsTrigger>
            <TabsTrigger
              value="visual"
              className="flex flex-col py-3 data-[state=active]:bg-gray-900 data-[state=active]:border-gray-700 data-[state=active]:border data-[state=active]:shadow-none rounded-xl transition-all duration-300 text-gray-400 data-[state=active]:text-gray-200"
              data-testid="tab-visual"
            >
              <Eye className="w-4 h-4 mb-1" />
              <span className="text-xs">Visual</span>
            </TabsTrigger>
            <TabsTrigger
              value="voice"
              className="flex flex-col py-3 data-[state=active]:bg-gray-900 data-[state=active]:border-gray-700 data-[state=active]:border data-[state=active]:shadow-none rounded-xl transition-all duration-300 text-gray-400 data-[state=active]:text-gray-200"
              data-testid="tab-voice"
            >
              <Mic className="w-4 h-4 mb-1" />
              <span className="text-xs">Voice</span>
            </TabsTrigger>
            <TabsTrigger
              value="generate"
              className="flex flex-col py-3 data-[state=active]:bg-gray-900 data-[state=active]:border-gray-700 data-[state=active]:border data-[state=active]:shadow-none rounded-xl transition-all duration-300 text-gray-400 data-[state=active]:text-gray-200"
              data-testid="tab-generate"
            >
              <Wand2 className="w-4 h-4 mb-1" />
              <span className="text-xs">Images</span>
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="flex flex-col py-3 data-[state=active]:bg-gray-900 data-[state=active]:border-gray-700 data-[state=active]:border data-[state=active]:shadow-none rounded-xl transition-all duration-300 text-gray-400 data-[state=active]:text-gray-200"
              data-testid="tab-content"
            >
              <FileText className="w-4 h-4 mb-1" />
              <span className="text-xs">Content</span>
            </TabsTrigger>
            <TabsTrigger
              value="visual-commerce"
              className="flex flex-col py-3 data-[state=active]:bg-gray-900 data-[state=active]:border-gray-700 data-[state=active]:border data-[state=active]:shadow-none rounded-xl transition-all duration-300 text-gray-400 data-[state=active]:text-gray-200"
              data-testid="tab-visual-commerce"
            >
              <Layers className="w-4 h-4 mb-1" />
              <span className="text-xs">Shop Visual</span>
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
                  <HolographicCard
                    className={`cursor-pointer h-full ${i % 3 === 0 ? 'holo-teal' : i % 3 === 1 ? 'holo-gold' : 'holo-bronze'}`}
                    intensity="medium"
                  >
                    <div
                      className="holo-content h-full flex flex-col"
                      onClick={() => setActiveTab(tool.id)}
                      data-testid={`card-tool-${tool.id}`}
                    >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 relative`}>
                          {/* Metallic overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
                          <div className="relative">{tool.icon}</div>
                        </div>
                        {tool.badge && (
                          <Badge 
                            variant="secondary"
                            className="bg-cyan-500/20 text-cyan-900 border-cyan-600/50"
                          >
                            {tool.badge}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl text-gray-900">{tool.title}</CardTitle>
                      <CardDescription className="text-gray-700">{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <ul className="space-y-2">
                        {tool.features.map((feature, j) => (
                          <li key={j} className="flex items-center text-sm text-gray-800">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-600 mr-2 shadow-[0_0_8px_rgba(8,145,178,0.6)]" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full mt-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-600/50 hover:from-cyan-500/30 hover:to-blue-500/30 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-300 text-gray-900 font-semibold"
                        variant="outline"
                        data-testid={`button-explore-${tool.id}`}
                      >
                        Explore Tool
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                    </div>
                  </HolographicCard>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
              {/* Metallic shine */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
              
              {/* Holographic overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
              
              {/* Scan line */}
              <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-white">Quick AI Actions</CardTitle>
                <CardDescription className="text-gray-400">Get started with common AI tasks</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto flex flex-col py-4 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-600/50 hover:border-blue-400/80 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-300 text-white cyber-3d-lift relative overflow-hidden group"
                    onClick={() => setActiveTab('agents')}
                    data-testid="button-quick-optimize"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                    <TrendingUp className="w-6 h-6 mb-2 text-blue-400 relative z-10" />
                    <span className="text-xs relative z-10">Optimize Campaign</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex flex-col py-4 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-600/50 hover:border-purple-400/80 hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300 text-white cyber-3d-lift relative overflow-hidden group"
                    onClick={() => setActiveTab('generate')}
                    data-testid="button-quick-images"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                    <Package className="w-6 h-6 mb-2 text-purple-400 relative z-10" />
                    <span className="text-xs relative z-10">Product Images</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex flex-col py-4 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-600/50 hover:border-green-400/80 hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300 text-white cyber-3d-lift relative overflow-hidden group"
                    onClick={() => setActiveTab('content')}
                    data-testid="button-quick-content"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                    <FileText className="w-6 h-6 mb-2 text-green-400 relative z-10" />
                    <span className="text-xs relative z-10">Write Content</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex flex-col py-4 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-600/50 hover:border-red-400/80 hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-300 text-white cyber-3d-lift relative overflow-hidden group"
                    onClick={() => setActiveTab('voice')}
                    data-testid="button-quick-voice"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                    <Shield className="w-6 h-6 mb-2 text-red-400 relative z-10" />
                    <span className="text-xs relative z-10">Voice Search</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Section */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-purple-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] cyber-3d-lift relative overflow-hidden group">
                {/* Metallic shine */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                
                {/* Holographic overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
                
                {/* Scan line */}
                <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
                
                {/* Circuit pattern */}
                <div className="absolute inset-0 cyber-circuit-pattern opacity-5 group-hover:opacity-10 transition-opacity z-0" />
                
                <CardHeader className="relative z-10">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white w-fit shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 mb-2">
                    <Rocket className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-white">Accelerate Growth</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-sm text-gray-400">
                    Automate repetitive tasks and focus on strategic growth with AI-powered tools
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
                {/* Metallic shine */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                
                {/* Holographic overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
                
                {/* Scan line */}
                <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
                
                {/* Circuit pattern */}
                <div className="absolute inset-0 cyber-circuit-pattern opacity-5 group-hover:opacity-10 transition-opacity z-0" />
                
                <CardHeader className="relative z-10">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white w-fit shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 mb-2">
                    <BarChart className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-white">Data-Driven Insights</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-sm text-gray-400">
                    Make informed decisions with predictive analytics and intelligent recommendations
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-green-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(34,197,94,0.4)] cyber-3d-lift relative overflow-hidden group">
                {/* Metallic shine */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                
                {/* Holographic overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
                
                {/* Scan line */}
                <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
                
                {/* Circuit pattern */}
                <div className="absolute inset-0 cyber-circuit-pattern opacity-5 group-hover:opacity-10 transition-opacity z-0" />
                
                <CardHeader className="relative z-10">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white w-fit shadow-[0_0_20px_rgba(34,197,94,0.4)] group-hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all duration-300 mb-2">
                    <Users className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-white">Enhanced Experience</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-sm text-gray-400">
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

          <TabsContent value="voice" className="bg-black rounded-xl p-6">
            <VoiceSearch />
          </TabsContent>

          <TabsContent value="generate">
            <PiAPIImageGenerator />
          </TabsContent>

          <TabsContent value="content">
            <AIContentGenerator businessId="demo" />
          </TabsContent>

          <TabsContent value="visual-commerce">
            <VisualCommerce />
          </TabsContent>

          <TabsContent value="voice-commerce" className="bg-black rounded-xl p-6">
            <VoiceCommerce />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}