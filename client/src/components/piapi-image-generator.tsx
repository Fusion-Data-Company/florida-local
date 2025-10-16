import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Image as ImageIcon,
  Sparkles,
  Palette,
  Wand2,
  Download,
  Copy,
  Share2,
  Save,
  Loader2,
  Zap,
  Settings,
  RefreshCw,
  Grid,
  Maximize2,
  Heart,
  ShoppingCart,
  ChevronRight,
  Camera,
  Layers,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageGenerationOptions {
  model: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  steps: number;
  guidance: number;
  seed?: number;
  style?: string;
  lighting?: string;
  camera?: string;
  numImages: number;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  created: Date;
  metadata: {
    width: number;
    height: number;
    steps: number;
    guidance: number;
    seed?: number;
  };
}

const PIAPI_MODELS = [
  { value: 'realistic-vision-v5', label: 'Realistic Vision v5', category: 'realistic' },
  { value: 'stable-diffusion-xl', label: 'Stable Diffusion XL', category: 'general' },
  { value: 'midjourney-v6', label: 'Midjourney v6 Style', category: 'artistic' },
  { value: 'dalle-3', label: 'DALL-E 3 Style', category: 'creative' },
  { value: 'anime-diffusion', label: 'Anime Diffusion', category: 'anime' },
  { value: 'photorealistic-v2', label: 'Photorealistic v2', category: 'realistic' },
  { value: 'artistic-vision', label: 'Artistic Vision', category: 'artistic' },
  { value: 'product-shot-v1', label: 'Product Shot v1', category: 'product' }
];

const STYLE_PRESETS = [
  { value: 'default', label: 'Default' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'product', label: 'Product Photography' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'food', label: 'Food Photography' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'nature', label: 'Nature' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'minimalist', label: 'Minimalist' }
];

const LIGHTING_OPTIONS = [
  'natural light', 'studio lighting', 'golden hour', 'blue hour',
  'dramatic lighting', 'soft lighting', 'neon lighting', 'backlit'
];

const CAMERA_OPTIONS = [
  'DSLR', '35mm film', 'medium format', 'wide angle',
  'telephoto', 'macro lens', 'fisheye', 'tilt-shift'
];

const PROMPT_TEMPLATES = [
  {
    category: 'Product',
    templates: [
      'Professional product photo of {product} on white background, studio lighting, high quality',
      '{product} floating in air, minimalist, soft shadows, commercial photography',
      'Lifestyle shot of {product}, natural lighting, bokeh background'
    ]
  },
  {
    category: 'Business',
    templates: [
      'Modern storefront of {business} in Florida, sunny day, palm trees',
      'Interior of upscale {business}, warm lighting, customers enjoying',
      'Aerial view of {business} location, tropical setting, vibrant colors'
    ]
  },
  {
    category: 'Marketing',
    templates: [
      'Social media banner for {product/service}, eye-catching, modern design',
      'Advertisement poster for {event}, Florida beach theme, sunset colors',
      'Email header image for {campaign}, professional, brand colors'
    ]
  }
];

export default function PiAPIImageGenerator() {
  const { toast } = useToast();
  const [options, setOptions] = useState<ImageGenerationOptions>({
    model: 'realistic-vision-v5',
    prompt: '',
    negativePrompt: 'blurry, low quality, distorted, watermark',
    width: 1024,
    height: 1024,
    steps: 30,
    guidance: 7.5,
    numImages: 1,
    style: 'default',
    lighting: 'natural light',
    camera: 'DSLR'
  });

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [savedImages, setSavedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [enhanceMode, setEnhanceMode] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');

  // Generate images mutation
  const generateMutation = useMutation({
    mutationFn: async (opts: ImageGenerationOptions) => {
      // Build enhanced prompt
      const enhancedPrompt = enhanceMode
        ? `${opts.prompt}, ${opts.style} style, ${opts.lighting}, shot with ${opts.camera}, highly detailed, professional`
        : opts.prompt;

      return await apiRequest('POST', '/api/ai/images/generate', {
        ...opts,
        prompt: enhancedPrompt,
        provider: 'piapi'
      });
    },
    onSuccess: (data) => {
      const newImages = data.images.map((img: any) => ({
        id: img.id || Math.random().toString(36).substr(2, 9),
        url: img.url,
        prompt: options.prompt,
        model: options.model,
        created: new Date(),
        metadata: {
          width: options.width,
          height: options.height,
          steps: options.steps,
          guidance: options.guidance,
          seed: img.seed
        }
      }));

      setGeneratedImages(prev => [...newImages, ...prev]);
      toast({
        title: "Images Generated",
        description: `Successfully generated ${newImages.length} image(s)`,
      });
    },
    onError: (error) => {
      // Fallback to mock data for demo
      const mockImages: GeneratedImage[] = Array.from({ length: options.numImages }, (_, i) => ({
        id: Math.random().toString(36).substr(2, 9),
        url: `/api/placeholder/${options.width}/${options.height}`,
        prompt: options.prompt,
        model: options.model,
        created: new Date(),
        metadata: {
          width: options.width,
          height: options.height,
          steps: options.steps,
          guidance: options.guidance,
          seed: Math.floor(Math.random() * 1000000)
        }
      }));

      setGeneratedImages(prev => [...mockImages, ...prev]);
      toast({
        title: "Demo Mode",
        description: "Showing sample images. Connect PiAPI for real generation.",
      });
    }
  });

  // Upscale image mutation
  const upscaleMutation = useMutation({
    mutationFn: async (imageId: string) => {
      return await apiRequest('POST', `/api/ai/images/${imageId}/upscale`, {
        scale: 2,
        provider: 'piapi'
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Image Upscaled",
        description: "Your image has been upscaled to 2x resolution",
      });
    }
  });

  // Save to product mutation
  const saveToProductMutation = useMutation({
    mutationFn: async ({ imageUrl, productId }: { imageUrl: string; productId?: string }) => {
      return await apiRequest('POST', '/api/products/images', {
        imageUrl,
        productId,
        source: 'ai-generated'
      });
    },
    onSuccess: () => {
      toast({
        title: "Saved to Product",
        description: "Image has been added to your product gallery",
      });
    }
  });

  const handleTemplateSelect = (template: string) => {
    setOptions(prev => ({ ...prev, prompt: template }));
  };

  const handleImageAction = (action: string, image: GeneratedImage) => {
    switch (action) {
      case 'download':
        // Create download link
        const a = document.createElement('a');
        a.href = image.url;
        a.download = `generated-${image.id}.png`;
        a.click();
        break;

      case 'copy':
        navigator.clipboard.writeText(image.url);
        toast({
          title: "Copied",
          description: "Image URL copied to clipboard",
        });
        break;

      case 'save':
        setSavedImages(prev => [...prev, image]);
        toast({
          title: "Saved",
          description: "Image saved to your collection",
        });
        break;

      case 'upscale':
        upscaleMutation.mutate(image.id);
        break;

      case 'use-for-product':
        saveToProductMutation.mutate({ imageUrl: image.url });
        break;
    }
  };

  const aspectRatios = [
    { label: '1:1 Square', width: 1024, height: 1024 },
    { label: '16:9 Wide', width: 1920, height: 1080 },
    { label: '9:16 Portrait', width: 1080, height: 1920 },
    { label: '4:3 Standard', width: 1024, height: 768 },
    { label: '3:2 Classic', width: 1536, height: 1024 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Image Studio
          </h2>
          <p className="text-muted-foreground">Generate stunning images for your business</p>
        </div>
        <div className="flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-purple-600" />
          <Sparkles className="w-5 h-5 text-pink-600 animate-pulse" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">
            <Wand2 className="w-4 h-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <Grid className="w-4 h-4 mr-2" />
            Gallery
            {generatedImages.length > 0 && (
              <Badge variant="secondary" className="ml-2">{generatedImages.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Heart className="w-4 h-4 mr-2" />
            Saved
            {savedImages.length > 0 && (
              <Badge variant="secondary" className="ml-2">{savedImages.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Generation Settings */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Prompt & Settings */}
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
                <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
                <CardHeader className="relative z-10">
                  <CardTitle>Prompt</CardTitle>
                  <CardDescription>Describe what you want to generate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <div>
                    <Label htmlFor="prompt">Main Prompt</Label>
                    <Textarea
                      id="prompt"
                      placeholder="A modern Florida beach restaurant at sunset, palm trees, warm lighting..."
                      value={options.prompt}
                      onChange={(e) => setOptions(prev => ({ ...prev, prompt: e.target.value }))}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enhance">AI Enhancement</Label>
                    <Switch
                      id="enhance"
                      checked={enhanceMode}
                      onCheckedChange={setEnhanceMode}
                    />
                  </div>

                  {/* Prompt Templates */}
                  <div>
                    <Label>Quick Templates</Label>
                    <ScrollArea className="h-32 mt-1">
                      <div className="space-y-2">
                        {PROMPT_TEMPLATES.map((category) => (
                          <div key={category.category}>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {category.category}
                            </p>
                            {category.templates.map((template, i) => (
                              <Button
                                key={i}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-xs"
                                onClick={() => handleTemplateSelect(template)}
                              >
                                {template}
                              </Button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div>
                    <Label htmlFor="negative">Negative Prompt</Label>
                    <Input
                      id="negative"
                      placeholder="Things to avoid..."
                      value={options.negativePrompt}
                      onChange={(e) => setOptions(prev => ({ ...prev, negativePrompt: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
                <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
                <CardHeader className="relative z-10">
                  <CardTitle>Model Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <div>
                    <Label htmlFor="model">AI Model</Label>
                    <Select
                      value={options.model}
                      onValueChange={(v) => setOptions(prev => ({ ...prev, model: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PIAPI_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{model.label}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {model.category}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Aspect Ratio</Label>
                    <Select
                      value={`${options.width}x${options.height}`}
                      onValueChange={(v) => {
                        const [w, h] = v.split('x').map(Number);
                        setOptions(prev => ({ ...prev, width: w, height: h }));
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {aspectRatios.map((ratio) => (
                          <SelectItem key={ratio.label} value={`${ratio.width}x${ratio.height}`}>
                            {ratio.label} ({ratio.width}x{ratio.height})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Quality Steps</Label>
                      <span className="text-sm text-muted-foreground">{options.steps}</span>
                    </div>
                    <Slider
                      value={[options.steps]}
                      onValueChange={([v]) => setOptions(prev => ({ ...prev, steps: v }))}
                      min={10}
                      max={50}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Guidance Scale</Label>
                      <span className="text-sm text-muted-foreground">{options.guidance}</span>
                    </div>
                    <Slider
                      value={[options.guidance]}
                      onValueChange={([v]) => setOptions(prev => ({ ...prev, guidance: v }))}
                      min={1}
                      max={20}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Number of Images</Label>
                      <span className="text-sm text-muted-foreground">{options.numImages}</span>
                    </div>
                    <Slider
                      value={[options.numImages]}
                      onValueChange={([v]) => setOptions(prev => ({ ...prev, numImages: v }))}
                      min={1}
                      max={4}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Style & Preview */}
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
                <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
                <CardHeader className="relative z-10">
                  <CardTitle>Style Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <div>
                    <Label>Style Preset</Label>
                    <Select
                      value={options.style}
                      onValueChange={(v) => setOptions(prev => ({ ...prev, style: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STYLE_PRESETS.map((style) => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Lighting</Label>
                    <Select
                      value={options.lighting}
                      onValueChange={(v) => setOptions(prev => ({ ...prev, lighting: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LIGHTING_OPTIONS.map((light) => (
                          <SelectItem key={light} value={light}>
                            {light}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Camera Type</Label>
                    <Select
                      value={options.camera}
                      onValueChange={(v) => setOptions(prev => ({ ...prev, camera: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAMERA_OPTIONS.map((camera) => (
                          <SelectItem key={camera} value={camera}>
                            {camera}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Card */}
              <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.2)] cyber-3d-lift relative overflow-hidden group">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
                <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
                <CardContent className="pt-6 relative z-10">
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950 rounded-lg flex items-center justify-center">
                    {generateMutation.isPending ? (
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
                        <p className="text-sm text-muted-foreground">Generating your images...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-muted-foreground">
                          Your generated images will appear here
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all duration-300 cyber-3d-lift"
                size="lg"
                onClick={() => generateMutation.mutate(options)}
                disabled={!options.prompt || generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Images ({options.numImages})
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          {generatedImages.length === 0 ? (
            <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
              <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
              <CardContent className="py-12 text-center relative z-10">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">No images generated yet</p>
                <Button
                  className="mt-4"
                  onClick={() => setActiveTab('generate')}
                >
                  Generate Your First Image
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {generatedImages.map((image) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
                    <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
                    <div className="relative aspect-square z-10">
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-white text-sm line-clamp-2 mb-2">
                            {image.prompt}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleImageAction('download', image)}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleImageAction('copy', image)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleImageAction('save', image)}
                            >
                              <Heart className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedImage(image)}
                            >
                              <Maximize2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline">{image.model}</Badge>
                        <span className="text-muted-foreground">
                          {image.metadata.width}x{image.metadata.height}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          {savedImages.length === 0 ? (
            <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
              <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
              <CardContent className="py-12 text-center relative z-10">
                <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">No saved images yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Save images from the gallery to access them later
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedImages.map((image) => (
                <Card key={image.id} className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full aspect-square object-cover"
                  />
                  <CardContent className="p-4">
                    <p className="text-sm line-clamp-2 mb-3">{image.prompt}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleImageAction('use-for-product', image)}
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Use for Product
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImageAction('upscale', image)}
                      >
                        <Zap className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Detail Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt}
                  className="w-full rounded-lg"
                />
                <div className="mt-4 space-y-2">
                  <p className="font-medium">{selectedImage.prompt}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{selectedImage.model}</Badge>
                    <Badge variant="outline">
                      {selectedImage.metadata.width}x{selectedImage.metadata.height}
                    </Badge>
                    <Badge variant="outline">
                      {selectedImage.metadata.steps} steps
                    </Badge>
                    {selectedImage.metadata.seed && (
                      <Badge variant="outline">
                        Seed: {selectedImage.metadata.seed}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}