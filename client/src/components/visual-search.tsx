import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Camera,
  Upload,
  Search,
  Image as ImageIcon,
  Sparkles,
  ShoppingCart,
  MapPin,
  Star,
  TrendingUp,
  Package,
  X,
  Loader2,
  Eye,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

interface VisualSearchResult {
  products: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    businessId: string;
    businessName: string;
    rating: number;
    similarity: number;
    tags: string[];
  }[];
  businesses: {
    id: string;
    name: string;
    description: string;
    image: string;
    category: string;
    rating: number;
    location: string;
    relevance: number;
  }[];
  analysis: {
    detectedObjects: string[];
    colors: string[];
    style: string;
    category: string;
    suggestedSearchTerms: string[];
  };
}

export default function VisualSearch() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchMode, setSearchMode] = useState<'upload' | 'camera' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState("");
  const [searchResults, setSearchResults] = useState<VisualSearchResult | null>(null);

  // Visual search mutation
  const searchMutation = useMutation({
    mutationFn: async (imageData: { file?: File; url?: string; base64?: string }) => {
      const formData = new FormData();

      if (imageData.file) {
        formData.append('image', imageData.file);
      } else if (imageData.url) {
        formData.append('imageUrl', imageData.url);
      } else if (imageData.base64) {
        formData.append('imageBase64', imageData.base64);
      }

      // Call GPT-4 Vision API endpoint
      const res = await fetch('/api/ai/visual-search', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      return await res.json();
    },
    onSuccess: (data: VisualSearchResult) => {
      setSearchResults(data);
      toast({
        title: "Visual Search Complete",
        description: `Found ${data.products.length} products and ${data.businesses.length} businesses`,
      });
    },
    onError: (error: any) => {
      // Fallback to mock data for demo
      const mockResults: VisualSearchResult = {
        products: [
          {
            id: "1",
            name: "Sunset Beach Canvas Print",
            description: "Beautiful Florida sunset captured on canvas",
            price: 89.99,
            image: "/api/placeholder/300/200",
            businessId: "b1",
            businessName: "Florida Art Gallery",
            rating: 4.8,
            similarity: 0.92,
            tags: ["art", "beach", "sunset", "florida"]
          },
          {
            id: "2",
            name: "Beach Photography Workshop",
            description: "Learn to capture stunning beach scenes",
            price: 149.99,
            image: "/api/placeholder/300/200",
            businessId: "b2",
            businessName: "Coastal Photography Studio",
            rating: 4.9,
            similarity: 0.87,
            tags: ["photography", "workshop", "beach"]
          },
          {
            id: "3",
            name: "Tropical Sunset Tour",
            description: "Guided sunset viewing experience",
            price: 45.00,
            image: "/api/placeholder/300/200",
            businessId: "b3",
            businessName: "Florida Adventures",
            rating: 4.7,
            similarity: 0.85,
            tags: ["tours", "sunset", "experience"]
          }
        ],
        businesses: [
          {
            id: "b1",
            name: "Florida Art Gallery",
            description: "Local art featuring Florida landscapes",
            image: "/api/placeholder/400/200",
            category: "Art & Photography",
            rating: 4.8,
            location: "Miami Beach, FL",
            relevance: 0.95
          },
          {
            id: "b2",
            name: "Coastal Photography Studio",
            description: "Professional photography services and workshops",
            image: "/api/placeholder/400/200",
            category: "Photography",
            rating: 4.9,
            location: "Fort Lauderdale, FL",
            relevance: 0.88
          }
        ],
        analysis: {
          detectedObjects: ["sunset", "beach", "palm trees", "ocean", "clouds"],
          colors: ["#FF6B35", "#FFA500", "#4169E1", "#FFD700", "#87CEEB"],
          style: "Landscape Photography",
          category: "Nature & Outdoors",
          suggestedSearchTerms: ["florida sunset", "beach art", "coastal photography", "tropical landscape"]
        }
      };

      setSearchResults(mockResults);
      toast({
        title: "Using Demo Results",
        description: "Showing sample results. Connect GPT-4 Vision API for real search.",
      });
    }
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setSelectedFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to be ready
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);

        // Convert to base64
        const base64 = canvas.toDataURL('image/jpeg');
        setSelectedImage(base64);

        // Stop camera stream
        stream.getTracks().forEach(track => track.stop());

        toast({
          title: "Photo Captured",
          description: "Your photo has been captured successfully",
        });
      }, 1000);
    } catch (error) {
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to use this feature",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleUrlSubmit = () => {
    if (!imageUrl) {
      toast({
        title: "URL Required",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }

    // Validate URL
    try {
      new URL(imageUrl);
      setSelectedImage(imageUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
    }
  };

  const performSearch = () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please select an image to search",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile) {
      searchMutation.mutate({ file: selectedFile });
    } else if (imageUrl) {
      searchMutation.mutate({ url: imageUrl });
    } else if (selectedImage.startsWith('data:')) {
      searchMutation.mutate({ base64: selectedImage });
    }
  };

  const clearSearch = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setImageUrl("");
    setSearchResults(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Visual Search
          </h2>
          <p className="text-muted-foreground">Search for products and businesses using images</p>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="w-6 h-6 text-purple-600" />
          <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
        </div>
      </div>

      {/* Image Input Section */}
      <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
        {/* Metallic shine */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
        
        {/* Holographic overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
        
        {/* Scan line */}
        <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-white">Select Image</CardTitle>
          <CardDescription>Choose how you want to provide an image for search</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="camera">
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </TabsTrigger>
              <TabsTrigger value="url">
                <ImageIcon className="w-4 h-4 mr-2" />
                URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                {selectedImage && !imageUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={selectedImage}
                      alt="Selected"
                      className="max-w-full max-h-64 rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedImage(null);
                        setSelectedFile(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Drag and drop an image here, or click to browse
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Image
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="camera" className="space-y-4">
              <div className="text-center py-8">
                {selectedImage && selectedImage.startsWith('data:') ? (
                  <div className="relative inline-block">
                    <img
                      src={selectedImage}
                      alt="Captured"
                      className="max-w-full max-h-64 rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setSelectedImage(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Use your device camera to capture an image
                    </p>
                    <Button onClick={handleCameraCapture}>
                      <Camera className="w-4 h-4 mr-2" />
                      Open Camera
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="imageUrl"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    <Button onClick={handleUrlSubmit}>Load</Button>
                  </div>
                </div>
                {selectedImage && imageUrl && (
                  <div className="relative inline-block">
                    <img
                      src={selectedImage}
                      alt="From URL"
                      className="max-w-full max-h-64 rounded-lg"
                      onError={() => {
                        setSelectedImage(null);
                        toast({
                          title: "Failed to load image",
                          description: "The image URL could not be loaded",
                          variant: "destructive",
                        });
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedImage(null);
                        setImageUrl("");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Search Button */}
          {selectedImage && (
            <div className="flex gap-3 mt-6">
              <Button
                className="flex-1"
                onClick={performSearch}
                disabled={searchMutation.isPending}
              >
                {searchMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Similar Products
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={clearSearch}>
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Image Analysis */}
            <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-purple-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] cyber-3d-lift relative overflow-hidden group">
              {/* Metallic shine */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
              
              {/* Holographic overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
              
              {/* Scan line */}
              <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
              
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI Image Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div>
                  <p className="text-sm font-medium mb-2">Detected Objects:</p>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.analysis.detectedObjects.map((obj, i) => (
                      <Badge key={i} variant="secondary">{obj}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Color Palette:</p>
                  <div className="flex gap-2">
                    {searchResults.analysis.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-lg border-2 border-gray-300"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Style</p>
                    <p className="font-medium">{searchResults.analysis.style}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{searchResults.analysis.category}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Suggested Searches:</p>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.analysis.suggestedSearchTerms.map((term, i) => (
                      <Button key={i} variant="outline" size="sm">
                        <Search className="w-3 h-3 mr-1" />
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Results */}
            <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
              {/* Metallic shine */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
              
              {/* Holographic overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
              
              {/* Scan line */}
              <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
              
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Similar Products</CardTitle>
                  <Badge variant="secondary">
                    {searchResults.products.length} found
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <ScrollArea className="h-[400px]">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {searchResults.products.map((product) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group cursor-pointer"
                      >
                        <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700/50 hover:border-cyan-400/80 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] overflow-hidden">
                          <div className="relative">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-48 object-cover"
                            />
                            <Badge
                              className="absolute top-2 right-2"
                              variant={product.similarity > 0.9 ? "default" : "secondary"}
                            >
                              {Math.round(product.similarity * 100)}% Match
                            </Badge>
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-semibold line-clamp-1">{product.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {product.description}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-lg font-bold">${product.price}</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm">{product.rating}</span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              by {product.businessName}
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" className="flex-1">
                                <ShoppingCart className="w-3 h-3 mr-1" />
                                Add to Cart
                              </Button>
                              <Link href={`/product/${product.id}`}>
                                <Button size="sm" variant="outline">
                                  View
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Business Results */}
            <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700/50 hover:border-cyan-400/80 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] cyber-3d-lift relative overflow-hidden group">
              {/* Metallic shine */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 cyber-metallic-shine z-0" />
              
              {/* Holographic overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 mix-blend-overlay pointer-events-none z-0" />
              
              {/* Scan line */}
              <div className="absolute inset-0 cyber-scan-line pointer-events-none z-0" />
              
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Related Businesses</CardTitle>
                  <Badge variant="secondary">
                    {searchResults.businesses.length} found
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  {searchResults.businesses.map((business) => (
                    <Link key={business.id} href={`/business/${business.id}`}>
                      <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700/50 hover:border-cyan-400/80 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <img
                              src={business.image}
                              alt={business.name}
                              className="w-24 h-24 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold">{business.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {business.category}
                                  </p>
                                </div>
                                <Badge variant="outline">
                                  {Math.round(business.relevance * 100)}% Relevant
                                </Badge>
                              </div>
                              <p className="text-sm mt-2 line-clamp-2">
                                {business.description}
                              </p>
                              <div className="flex items-center gap-4 mt-3 text-sm">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {business.location}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  {business.rating}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}