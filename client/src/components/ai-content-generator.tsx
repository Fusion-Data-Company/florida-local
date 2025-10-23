import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Copy,
  Download,
  RefreshCw,
  Loader2,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Globe,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Business } from "@shared/types";

interface GeneratedContent {
  platform: string;
  content: string;
  hashtags?: string[];
  metadata?: {
    characterCount: number;
    wordCount: number;
    estimatedReadTime?: string;
  };
}

const platformConfigs = {
  facebook: {
    name: "Facebook",
    icon: Facebook,
    maxLength: 63206,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    features: ["Long-form content", "Links", "Images", "Videos"]
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    maxLength: 2200,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    features: ["Visual focus", "Hashtags", "Stories", "Reels"]
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    maxLength: 3000,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    features: ["Professional tone", "Industry insights", "Networking"]
  },
  gmb: {
    name: "Google My Business",
    icon: Globe,
    maxLength: 1500,
    color: "text-green-600",
    bgColor: "bg-green-50",
    features: ["Local SEO", "Updates", "Offers", "Events"]
  },
  email: {
    name: "Email Newsletter",
    icon: Mail,
    maxLength: 50000,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    features: ["Personalization", "CTA buttons", "Rich formatting"]
  }
};

const toneOptions = [
  { value: "professional", label: "Professional", description: "Formal and business-focused" },
  { value: "casual", label: "Casual", description: "Friendly and conversational" },
  { value: "promotional", label: "Promotional", description: "Marketing and sales-driven" },
  { value: "educational", label: "Educational", description: "Informative and helpful" },
  { value: "inspirational", label: "Inspirational", description: "Motivational and uplifting" },
];

interface AIContentGeneratorProps {
  businessId: string;
}

export default function AIContentGenerator({ businessId }: AIContentGeneratorProps) {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<string>("facebook");
  const [postIdea, setPostIdea] = useState("");
  const [tone, setTone] = useState("professional");
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([]);
  const [activePreview, setActivePreview] = useState(0);

  // Fetch business data to inject into content
  const { data: business, isLoading: businessLoading } = useQuery<Business>({
    queryKey: [`/api/businesses/${businessId}`],
  });

  // Generate content mutation
  const generateContentMutation = useMutation({
    mutationFn: async (data: { businessId: string; platform: string; idea: string; tone: string }) => {
      return await apiRequest('POST', '/api/ai/generate-content', data);
    },
    onSuccess: (data) => {
      setGeneratedContents([data]);
      setActivePreview(0);
      toast({
        title: "Content generated!",
        description: "Your AI-powered content is ready to use.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!postIdea.trim()) {
      toast({
        title: "Post idea required",
        description: "Please enter an idea or topic for your content.",
        variant: "destructive",
      });
      return;
    }

    generateContentMutation.mutate({
      businessId,
      platform: selectedPlatform,
      idea: postIdea,
      tone,
    });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const handleExport = (content: string, platform: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${platform}_post_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported!",
      description: "Content downloaded as text file.",
    });
  };

  const currentPlatform = platformConfigs[selectedPlatform as keyof typeof platformConfigs];
  const PlatformIcon = currentPlatform.icon;

  if (businessLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
      <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">AI Content Generator</CardTitle>
            <CardDescription className="text-base">
              Generate platform-specific content with your business data auto-injected
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6 relative z-10">
        {/* Business Info Display */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950 border relative overflow-hidden group">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
          <div className="flex items-start gap-4">
            {business?.logoUrl && (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h3 className="font-bold text-lg">{business?.name}</h3>
              <p className="text-sm text-muted-foreground">{business?.tagline}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{business?.category}</Badge>
                <Badge variant="outline">{business?.location}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Selection */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">1. Select Platform</Label>
          <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {Object.entries(platformConfigs).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="hidden sm:inline">{config.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {/* Platform Features */}
          <div className={`p-4 rounded-lg ${currentPlatform.bgColor} border relative overflow-hidden group`}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
            <div className="flex items-center gap-2 mb-2">
              <PlatformIcon className={`h-5 w-5 ${currentPlatform.color}`} />
              <span className="font-semibold">{currentPlatform.name}</span>
              <Badge variant="outline" className="ml-auto">
                {currentPlatform.maxLength.toLocaleString()} chars max
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentPlatform.features.map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Post Idea Input */}
        <div className="space-y-2">
          <Label htmlFor="post-idea" className="text-base font-semibold">
            2. Enter Your Post Idea or Topic
          </Label>
          <Textarea
            id="post-idea"
            placeholder="Example: Announcing our new summer menu with fresh seafood dishes..."
            value={postIdea}
            onChange={(e) => setPostIdea(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Be specific! The AI will inject your business name, location, and other details automatically.
          </p>
        </div>

        {/* Tone Selection */}
        <div className="space-y-2">
          <Label htmlFor="tone" className="text-base font-semibold">3. Select Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger id="tone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {toneOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={generateContentMutation.isPending || !postIdea.trim()}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all duration-300 cyber-3d-lift text-lg py-6"
          size="lg"
        >
          {generateContentMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating AI Content...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Content
            </>
          )}
        </Button>

        {/* Generated Content Preview */}
        {generatedContents.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">4. Preview & Export</Label>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Generated
              </Badge>
            </div>

            <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
              <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
              <CardHeader className="bg-muted/50 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlatformIcon className={`h-5 w-5 ${currentPlatform.color}`} />
                    <CardTitle className="text-lg">{currentPlatform.name} Post</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(generatedContents[activePreview].content)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(generatedContents[activePreview].content, selectedPlatform)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {generatedContents[activePreview].content}
                  </div>
                </div>

                {generatedContents[activePreview].hashtags && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Suggested Hashtags:
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {generatedContents[activePreview].hashtags!.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {generatedContents[activePreview].metadata && (
                  <div className="mt-4 pt-4 border-t flex gap-4 text-xs text-muted-foreground">
                    <div>
                      <strong>Characters:</strong> {generatedContents[activePreview].metadata!.characterCount}
                    </div>
                    <div>
                      <strong>Words:</strong> {generatedContents[activePreview].metadata!.wordCount}
                    </div>
                    {generatedContents[activePreview].metadata!.estimatedReadTime && (
                      <div>
                        <strong>Read Time:</strong> {generatedContents[activePreview].metadata!.estimatedReadTime}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 <strong>Pro Tip:</strong> You can edit the generated content before posting. The AI has automatically injected your business name ({business?.name}), location ({business?.location}), and tagline.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
