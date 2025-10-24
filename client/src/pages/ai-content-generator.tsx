import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Wand2,
  Copy,
  Download,
  Heart,
  TrendingUp,
  Zap,
  Brain,
  FileText,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  Calendar,
  BarChart3,
  Clock,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  prompt: string;
  tone: string;
  length: string;
}

interface GeneratedContent {
  id: string;
  content: string;
  template: string;
  tone: string;
  createdAt: Date;
  isFavorite: boolean;
  usageCount: number;
}

interface AIUsageStats {
  totalGenerations: number;
  favoriteCount: number;
  timeSavedHours: number;
  costSavings: number;
  mostUsedTemplate: string;
  weeklyTrend: number;
}

const contentTemplates: ContentTemplate[] = [
  {
    id: "social-post",
    name: "Social Media Post",
    description: "Engaging social media content for your business",
    category: "social",
    icon: <MessageSquare className="h-5 w-5" />,
    prompt: "Create an engaging social media post about",
    tone: "friendly",
    length: "short",
  },
  {
    id: "product-description",
    name: "Product Description",
    description: "Compelling product descriptions that sell",
    category: "product",
    icon: <FileText className="h-5 w-5" />,
    prompt: "Write a compelling product description for",
    tone: "professional",
    length: "medium",
  },
  {
    id: "email-campaign",
    name: "Email Campaign",
    description: "Persuasive email marketing content",
    category: "email",
    icon: <Mail className="h-5 w-5" />,
    prompt: "Create an email campaign about",
    tone: "persuasive",
    length: "medium",
  },
  {
    id: "blog-post",
    name: "Blog Post",
    description: "SEO-optimized blog content",
    category: "blog",
    icon: <FileText className="h-5 w-5" />,
    prompt: "Write a blog post about",
    tone: "informative",
    length: "long",
  },
  {
    id: "promo-announcement",
    name: "Promotion Announcement",
    description: "Exciting promotional announcements",
    category: "promo",
    icon: <TrendingUp className="h-5 w-5" />,
    prompt: "Create a promotional announcement for",
    tone: "excited",
    length: "short",
  },
  {
    id: "event-invitation",
    name: "Event Invitation",
    description: "Inviting event announcements",
    category: "event",
    icon: <Calendar className="h-5 w-5" />,
    prompt: "Create an event invitation for",
    tone: "inviting",
    length: "medium",
  },
];

const toneOptions = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "casual", label: "Casual" },
  { value: "excited", label: "Excited" },
  { value: "persuasive", label: "Persuasive" },
  { value: "informative", label: "Informative" },
];

const lengthOptions = [
  { value: "short", label: "Short (1-2 paragraphs)" },
  { value: "medium", label: "Medium (3-5 paragraphs)" },
  { value: "long", label: "Long (6+ paragraphs)" },
];

export default function AIContentGenerator() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [generatedContent, setGeneratedContent] = useState("");
  const [activeTab, setActiveTab] = useState("templates");

  // Fetch content history
  const { data: contentHistory = [], isLoading: historyLoading } = useQuery<GeneratedContent[]>({
    queryKey: ['/api/ai/content-history'],
    enabled: isAuthenticated,
  });

  // Fetch usage stats
  const { data: usageStats, isLoading: statsLoading } = useQuery<AIUsageStats>({
    queryKey: ['/api/ai/usage-stats'],
    enabled: isAuthenticated,
  });

  // Generate content mutation
  const generateMutation = useMutation({
    mutationFn: async (data: { prompt: string; tone: string; length: string; template: string }) => {
      return await apiRequest('POST', '/api/ai/generate-content', data);
    },
    onSuccess: (response) => {
      setGeneratedContent(response.content);
      toast({
        title: "Content Generated!",
        description: "Your AI-powered content is ready.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/content-history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/usage-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTemplateSelect = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    setTone(template.tone);
    setLength(template.length);
    setActiveTab("generate");
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter what you want to generate content about.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      prompt,
      tone,
      length,
      template: selectedTemplate?.id || "custom",
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const handleSaveFavorite = () => {
    toast({
      title: "Saved!",
      description: "Content saved to your favorites.",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-20 text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-6 text-purple-500" />
          <h1 className="text-4xl font-bold mb-4">AI Content Generator</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Please sign in to access AI-powered content generation.
          </p>
          <Button size="lg" onClick={() => window.location.href = '/api/login'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white">
        <div className="absolute inset-0 opacity-20">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Brain className="h-12 w-12" />
              <h1 className="text-5xl font-bold">AI Content Generator</h1>
              <Sparkles className="h-12 w-12" />
            </div>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
              Create professional, engaging content in seconds with our AI-powered generator.
              Save hours of work and boost your marketing effectiveness.
            </p>

            {/* Quick Stats */}
            {usageStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center gap-6"
              >
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                  <Zap className="h-5 w-5" />
                  <div className="text-left">
                    <div className="text-2xl font-bold">{usageStats.totalGenerations}</div>
                    <div className="text-xs opacity-80">Generations</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                  <Clock className="h-5 w-5" />
                  <div className="text-left">
                    <div className="text-2xl font-bold">{usageStats.timeSavedHours}h</div>
                    <div className="text-xs opacity-80">Time Saved</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                  <TrendingUp className="h-5 w-5" />
                  <div className="text-left">
                    <div className="text-2xl font-bold">${usageStats.costSavings}</div>
                    <div className="text-xs opacity-80">Cost Savings</div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3 text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>Choose a Template</h2>
              <p className="text-white text-lg" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
                Select from our professionally crafted templates to get started quickly
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contentTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-purple-300"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          {template.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{template.tone}</Badge>
                        <Badge variant="secondary">{template.length}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-purple-500" />
                  Generate Content
                </CardTitle>
                <CardDescription>
                  {selectedTemplate
                    ? `Using template: ${selectedTemplate.name}`
                    : "Create custom content with AI"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">What would you like to create?</label>
                  <Textarea
                    placeholder="Example: A social media post about our new summer menu featuring fresh Florida seafood..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Settings */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tone</label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {toneOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Length</label>
                    <Select value={length} onValueChange={setLength}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {lengthOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !prompt.trim()}
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-700/40 hover:to-pink-700/40 backdrop-blur-md"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>

                {/* Generated Content */}
                <AnimatePresence>
                  {generatedContent && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-500" />
                          Generated Content
                        </h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleCopy}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleSaveFavorite}>
                            <Heart className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerate}
                            disabled={generateMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </Button>
                        </div>
                      </div>

                      <div className="p-6 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
                        <p className="whitespace-pre-wrap leading-relaxed">{generatedContent}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3 text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.4)'}}>Generation History</h2>
              <p className="text-white text-lg" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
                View and reuse your previously generated content
              </p>
            </div>

            {historyLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : contentHistory.length > 0 ? (
              <div className="space-y-4">
                {contentHistory.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Badge>{item.template}</Badge>
                          <Badge variant="outline">{item.tone}</Badge>
                          {item.isFavorite && (
                            <Heart className="h-4 w-4 fill-current text-red-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-sm line-clamp-3 mb-4">{item.content}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGeneratedContent(item.content);
                            setActiveTab("generate");
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Reuse
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start generating content to see your history here
                  </p>
                  <Button onClick={() => setActiveTab("templates")}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Browse Templates
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
