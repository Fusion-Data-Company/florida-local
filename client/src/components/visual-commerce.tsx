import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  Search,
  Image as ImageIcon,
  Sparkles,
  ShoppingCart,
  Tag,
  Plus,
  X,
  Eye,
  Heart,
  Share2,
  Maximize2,
  QrCode,
  Smartphone,
  Layers,
  Zap,
  TrendingUp,
  DollarSign,
  Package,
  Info,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Star,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle
} from "lucide-react";

interface ProductTag {
  id: string;
  x: number; // Percentage from left
  y: number; // Percentage from top
  productId: string;
  productName: string;
  price: number;
  businessName: string;
  confidence: number;
}

interface ShoppableImage {
  id: string;
  imageUrl: string;
  tags: ProductTag[];
  title?: string;
  description?: string;
  totalClicks: number;
  totalViews: number;
  conversionRate: number;
  revenue: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  businessId: string;
  businessName: string;
  rating: number;
  inStock: boolean;
}

interface ARPreview {
  modelUrl: string;
  scaleAR: number;
  placement: 'floor' | 'wall' | 'table';
}

export default function VisualCommerce() {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isTagging, setIsTagging] = useState(false);
  const [currentTags, setCurrentTags] = useState<ProductTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<ProductTag | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("create");
  const [showARPreview, setShowARPreview] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Fetch shoppable images
  const { data: shoppableImages, isLoading } = useQuery<ShoppableImage[]>({
    queryKey: ['/api/visual-commerce/images'],
  });

  // Search products for tagging
  const { data: searchResults } = useQuery<Product[]>({
    queryKey: ['/api/products/search', searchQuery],
    enabled: searchQuery.length > 2,
  });

  // Auto-detect products with AI
  const detectProductsMutation = useMutation({
    mutationFn: async (imageFile: File) => {
      const formData = new FormData();
      formData.append('image', imageFile);

      return await apiRequest('POST', '/api/ai/visual-commerce/detect', formData);
    },
    onSuccess: (data) => {
      if (data.products && data.products.length > 0) {
        const tags = data.products.map((product: any, index: number) => ({
          id: Math.random().toString(36).substr(2, 9),
          x: product.boundingBox?.x || (20 + index * 15),
          y: product.boundingBox?.y || (30 + index * 10),
          productId: product.id,
          productName: product.name,
          price: product.price,
          businessName: product.businessName,
          confidence: product.confidence || 0.85
        }));

        setCurrentTags(tags);
        toast({
          title: "Products Detected",
          description: `Found ${tags.length} products in the image`,
        });
      } else {
        // Mock data for demo
        const mockTags: ProductTag[] = [
          {
            id: "1",
            x: 25,
            y: 40,
            productId: "p1",
            productName: "Beach Umbrella",
            price: 34.99,
            businessName: "Florida Beach Supplies",
            confidence: 0.92
          },
          {
            id: "2",
            x: 65,
            y: 55,
            productId: "p2",
            productName: "Sunset Canvas Print",
            price: 89.99,
            businessName: "Coastal Art Gallery",
            confidence: 0.87
          },
          {
            id: "3",
            x: 45,
            y: 75,
            productId: "p3",
            productName: "Beach Towel Set",
            price: 24.99,
            businessName: "Beach Essentials",
            confidence: 0.95
          }
        ];
        setCurrentTags(mockTags);
        toast({
          title: "Demo Mode",
          description: "Showing sample product tags",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Detection Failed",
        description: "Could not detect products in the image",
        variant: "destructive",
      });
    }
  });

  // Save shoppable image
  const saveImageMutation = useMutation({
    mutationFn: async (data: { image: File; tags: ProductTag[]; title?: string; description?: string }) => {
      const formData = new FormData();
      formData.append('image', data.image);
      formData.append('tags', JSON.stringify(data.tags));
      if (data.title) formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);

      return await apiRequest('POST', '/api/visual-commerce/images', formData);
    },
    onSuccess: () => {
      toast({
        title: "Image Saved",
        description: "Your shoppable image has been created successfully",
      });
      // Reset form
      setSelectedImage(null);
      setImagePreview("");
      setCurrentTags([]);
      setActiveTab("gallery");
    }
  });

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add tag to image
  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isTagging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Show product search dialog
    const newTag: ProductTag = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      productId: "",
      productName: "Select Product",
      price: 0,
      businessName: "",
      confidence: 1
    };

    setCurrentTags([...currentTags, newTag]);
    setSelectedTag(newTag);
  };

  // Remove tag
  const removeTag = (tagId: string) => {
    setCurrentTags(currentTags.filter(tag => tag.id !== tagId));
  };

  // Update tag with product info
  const updateTag = (tagId: string, product: Product) => {
    setCurrentTags(currentTags.map(tag =>
      tag.id === tagId
        ? {
            ...tag,
            productId: product.id,
            productName: product.name,
            price: product.price,
            businessName: product.businessName
          }
        : tag
    ));
    setSelectedTag(null);
  };

  // Generate QR code for AR preview
  const generateARCode = () => {
    toast({
      title: "AR Preview",
      description: "Scan QR code with your phone to view in AR",
    });
    setShowARPreview(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Visual Commerce Studio
          </h2>
          <p className="text-muted-foreground">Create shoppable images and AR experiences</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Beta</Badge>
          <Layers className="w-6 h-6 text-purple-600" />
          <Sparkles className="w-5 h-5 text-pink-600 animate-pulse" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">
            <Plus className="w-4 h-4 mr-2" />
            Create
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <ImageIcon className="w-4 h-4 mr-2" />
            Gallery
            {shoppableImages && shoppableImages.length > 0 && (
              <Badge variant="secondary" className="ml-2">{shoppableImages.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="ar">
            <Smartphone className="w-4 h-4 mr-2" />
            AR Preview
          </TabsTrigger>
        </TabsList>

        {/* Create Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
            <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
            <CardHeader className="relative z-10">
              <CardTitle>Create Shoppable Image</CardTitle>
              <CardDescription>
                Upload an image and tag products to make them shoppable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Drag and drop an image here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="image-upload" className="cursor-pointer">
                      Choose Image
                    </label>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Image with tags */}
                  <div className="relative" ref={imageRef}>
                    <img
                      src={imagePreview}
                      alt="Shoppable"
                      className={`w-full rounded-lg ${isTagging ? 'cursor-crosshair' : ''}`}
                      onClick={handleImageClick}
                    />

                    {/* Product Tags */}
                    {currentTags.map((tag) => (
                      <TooltipProvider key={tag.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                              style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                            >
                              <div className="relative">
                                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75" />
                                <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-8 h-8 flex items-center justify-center text-white shadow-lg">
                                  <Tag className="w-4 h-4" />
                                </div>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -top-2 -right-2 w-5 h-5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeTag(tag.id);
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-semibold">{tag.productName}</p>
                              <p className="text-sm">${tag.price}</p>
                              <p className="text-xs text-muted-foreground">{tag.businessName}</p>
                              {tag.confidence < 1 && (
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(tag.confidence * 100)}% match
                                </Badge>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>

                  {/* Controls */}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button
                        variant={isTagging ? "default" : "outline"}
                        onClick={() => setIsTagging(!isTagging)}
                      >
                        <Tag className="w-4 h-4 mr-2" />
                        {isTagging ? "Tagging Mode On" : "Add Tags"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (selectedImage) {
                            detectProductsMutation.mutate(selectedImage);
                          }
                        }}
                        disabled={detectProductsMutation.isPending}
                      >
                        {detectProductsMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Detecting...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Auto-Detect Products
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {currentTags.length} products tagged
                      </Badge>
                    </div>
                  </div>

                  {/* Tagged Products List */}
                  {currentTags.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Tagged Products</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-32">
                          <div className="space-y-2">
                            {currentTags.map((tag) => (
                              <div key={tag.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                                <div className="flex items-center gap-3">
                                  <Tag className="w-4 h-4 text-purple-600" />
                                  <div>
                                    <p className="font-medium text-sm">{tag.productName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      ${tag.price} • {tag.businessName}
                                    </p>
                                  </div>
                                </div>
                                {tag.confidence < 1 && (
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(tag.confidence * 100)}%
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {/* Save Button */}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        if (selectedImage && currentTags.length > 0) {
                          saveImageMutation.mutate({
                            image: selectedImage,
                            tags: currentTags,
                            title: "Shoppable Image",
                            description: "Click on products to shop"
                          });
                        }
                      }}
                      disabled={!selectedImage || currentTags.length === 0 || saveImageMutation.isPending}
                    >
                      {saveImageMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Save Shoppable Image
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview("");
                        setCurrentTags([]);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-purple-400/30 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.2)] cyber-3d-lift relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
            <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-600" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  Use high-quality images with products clearly visible
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  Auto-detect works best with uncluttered backgrounds
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  Tag up to 10 products per image for best performance
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  Add AR preview for furniture and decor items
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="pt-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : shoppableImages && shoppableImages.length > 0 ? (
              shoppableImages.map((image) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group cursor-pointer">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
                    <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
                    <div className="relative group z-10">
                      <img
                        src={image.imageUrl}
                        alt={image.title || "Shoppable image"}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="secondary">
                          <Share2 className="w-4 h-4 mr-1" />
                          Share
                        </Button>
                      </div>
                      <Badge className="absolute top-2 right-2">
                        {image.tags.length} Products
                      </Badge>
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold line-clamp-1">
                        {image.title || "Untitled"}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {image.description || `${image.tags.length} shoppable products`}
                      </p>
                      <div className="flex items-center justify-between mt-3 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {image.totalViews}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" />
                            {image.totalClicks}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {(image.conversionRate * 100).toFixed(1)}% CTR
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="col-span-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
                <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
                <CardContent className="py-12 text-center relative z-10">
                  <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground mb-4">No shoppable images yet</p>
                  <Button onClick={() => setActiveTab("create")}>
                    Create Your First Shoppable Image
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,453</div>
                <p className="text-xs text-muted-foreground">
                  +15.2% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Product Clicks</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3,234</div>
                <p className="text-xs text-muted-foreground">
                  26% click-through rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">487</div>
                <p className="text-xs text-muted-foreground">
                  15% conversion rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$28,945</div>
                <p className="text-xs text-muted-foreground">
                  +32.1% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Images */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Top Performing Images</CardTitle>
              <CardDescription>Images with highest conversion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={`/api/placeholder/60/60`}
                        alt={`Top ${i}`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium">Beach Lifestyle Collection</p>
                        <p className="text-sm text-muted-foreground">
                          8 products • 2,341 views
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">32% CTR</p>
                      <p className="text-sm text-green-600">$4,231 revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AR Preview Tab */}
        <TabsContent value="ar">
          <Card>
            <CardHeader>
              <CardTitle>AR Product Preview</CardTitle>
              <CardDescription>
                Let customers visualize products in their space using AR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950 rounded-lg flex items-center justify-center">
                {showARPreview ? (
                  <div className="text-center">
                    <QrCode className="w-32 h-32 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Scan with your phone to view in AR
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowARPreview(false)}
                    >
                      Close
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Smartphone className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                    <p className="text-lg font-medium mb-2">AR Preview</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enable AR preview for compatible products
                    </p>
                    <Button onClick={generateARCode}>
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate AR Code
                    </Button>
                  </div>
                )}
              </div>

              {/* AR Features */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 mb-3">
                        <Layers className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="font-medium mb-1">3D Models</h4>
                      <p className="text-sm text-muted-foreground">
                        Upload 3D models for products
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 mb-3">
                        <Smartphone className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-medium mb-1">Mobile Ready</h4>
                      <p className="text-sm text-muted-foreground">
                        Works on iOS and Android
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 mb-3">
                        <Zap className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-medium mb-1">Instant Preview</h4>
                      <p className="text-sm text-muted-foreground">
                        No app download required
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AR Stats */}
              <Card className="border-purple-200 dark:border-purple-900">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">68%</p>
                      <p className="text-sm text-muted-foreground">Higher engagement</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">3.4x</p>
                      <p className="text-sm text-muted-foreground">Conversion boost</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">-64%</p>
                      <p className="text-sm text-muted-foreground">Return rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}