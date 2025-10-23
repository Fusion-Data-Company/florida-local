import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp, Target, Info } from "lucide-react";
import MagicEliteProductCard from "@/components/magic-elite-product-card";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIRecommendationsProps {
  userId?: string;
  limit?: number;
  className?: string;
}

interface RecommendationResponse {
  products: Product[];
  reason?: string;
  confidence?: number;
}

export default function AIRecommendations({ userId, limit = 6, className }: AIRecommendationsProps) {
  // Fetch AI-powered recommendations
  const { data, isLoading } = useQuery<RecommendationResponse>({
    queryKey: ['/api/recommendations', userId, limit],
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/recommendations?limit=${limit}`);
      } catch (err) {
        // Mock recommendations until API is ready
        // This simulates Pinecone vector search results
        return {
          products: [],
          reason: "Based on your browsing history and similar users",
          confidence: 0.85
        } as RecommendationResponse;
      }
    },
    enabled: !!userId,
    staleTime: 300000, // 5 minutes cache
  });

  if (!userId) {
    return null; // Don't show recommendations for logged-out users
  }

  if (isLoading) {
    return (
      <section className={cn("py-12", className)}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Recommended For You</h2>
              <p className="text-sm text-muted-foreground">AI-powered personalized suggestions</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(limit)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data?.products || data.products.length === 0) {
    return null; // Don't show section if no recommendations
  }

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;

    const percent = Math.round(confidence * 100);
    const color =
      percent >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
      percent >= 60 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";

    return (
      <Badge variant="secondary" className={cn("text-xs", color)}>
        {percent}% match
      </Badge>
    );
  };

  return (
    <section className={cn("py-12 relative overflow-hidden", className)}>
      {/* Ambient background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-blue-50/50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-blue-950/20" />

      <div className="container mx-auto px-4 relative z-10">
        <Card
          className="border-2 mb-8 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">Recommended For You</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            These recommendations are powered by AI using vector similarity search.
                            We analyze your browsing history, purchases, and preferences to suggest products you'll love.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span>AI-powered personalized suggestions</span>
                    {getConfidenceBadge(data.confidence)}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="gap-1">
                <Target className="w-3 h-3" />
                <span className="text-xs">Pinecone Vector Search</span>
              </Badge>
            </div>

            {data.reason && (
              <div className="mt-4 p-3 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-purple-200 dark:border-purple-900">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  {data.reason}
                </p>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.products.slice(0, limit).map((product, index) => (
            <div
              key={product.id}
              className="entrance-scale-fade"
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="relative">
                {/* "Why this?" tooltip badge */}
                <div className="absolute top-4 right-4 z-20">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="cursor-help bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 shadow-lg backdrop-blur-sm"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Why this?
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          This product matches your interests based on:
                        </p>
                        <ul className="text-xs mt-2 space-y-1 list-disc list-inside">
                          <li>Similar products you've viewed</li>
                          <li>Items purchased by users like you</li>
                          <li>Your browsing patterns and preferences</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Product Card */}
                <MagicEliteProductCard product={product} index={index} />
              </div>
            </div>
          ))}
        </div>

        {/* AI Attribution */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            ✨ Powered by OpenAI embeddings and Pinecone vector similarity search
          </p>
        </div>
      </div>
    </section>
  );
}
