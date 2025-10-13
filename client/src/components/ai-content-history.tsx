import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, History, Copy, Trash2, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface AIGeneratedContent {
  id: string;
  type: "post" | "description" | "product" | "response";
  title: string;
  content: string;
  businessId?: string;
  businessName?: string;
  generatedAt: string;
  prompt?: string;
  isPublished: boolean;
}

interface AIContentHistoryProps {
  userId?: string;
  businessId?: string;
  limit?: number;
  className?: string;
  onReuse?: (content: AIGeneratedContent) => void;
}

/**
 * AI Content History Component
 *
 * Shows a history of AI-generated content for a user or business.
 * Allows users to view, copy, reuse, or delete previously generated content.
 *
 * @param userId - Filter by user ID
 * @param businessId - Filter by business ID
 * @param limit - Maximum number of items to show
 * @param className - Additional Tailwind classes
 * @param onReuse - Callback when user clicks to reuse content
 */
export default function AIContentHistory({
  userId,
  businessId,
  limit = 10,
  className = "",
  onReuse
}: AIContentHistoryProps) {
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch AI content history
  const { data: contentHistory = [], isLoading } = useQuery<AIGeneratedContent[]>({
    queryKey: ['/api/ai/content-history', userId, businessId, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      if (businessId) params.set('businessId', businessId);
      params.set('limit', limit.toString());

      // TODO: Replace with actual API call when backend is ready
      // return fetch(`/api/ai/content-history?${params}`).then(res => res.json());

      // Mock data for now
      return [
        {
          id: "1",
          type: "post",
          title: "Summer Special Promotion",
          content: "🌞 Beat the heat with our exclusive summer collection! Enjoy 20% off all beachwear and accessories. Limited time offer - shop now and make waves this season!",
          businessName: "Miami Beach Boutique",
          generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          prompt: "Create a social media post about summer sale",
          isPublished: true,
        },
        {
          id: "2",
          type: "description",
          title: "Business Bio Update",
          content: "Welcome to our award-winning restaurant where coastal cuisine meets modern elegance. Our chef-driven menu features locally sourced ingredients and breathtaking waterfront views.",
          businessName: "Ocean View Restaurant",
          generatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          prompt: "Write a professional business description",
          isPublished: true,
        },
        {
          id: "3",
          type: "product",
          title: "Artisan Coffee Blend Description",
          content: "Experience the rich, smooth taste of our signature medium roast. Hand-selected beans from sustainable Florida farms, expertly roasted to perfection. Notes of caramel and dark chocolate with a clean finish.",
          businessName: "Local Coffee Roasters",
          generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          prompt: "Create product description for coffee",
          isPublished: false,
        },
      ] as AIGeneratedContent[];
    },
    enabled: Boolean(userId || businessId),
  });

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleReuse = (item: AIGeneratedContent) => {
    if (onReuse) {
      onReuse(item);
    }
    toast({
      title: "Content Loaded",
      description: "AI-generated content loaded for editing",
    });
  };

  const handleDelete = async (id: string) => {
    // TODO: Implement delete functionality
    toast({
      title: "Deleted",
      description: "Content removed from history",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "post": return "bg-blue-500/10 text-blue-700 border-blue-500/30";
      case "description": return "bg-purple-500/10 text-purple-700 border-purple-500/30";
      case "product": return "bg-green-500/10 text-green-700 border-green-500/30";
      case "response": return "bg-orange-500/10 text-orange-700 border-orange-500/30";
      default: return "bg-gray-500/10 text-gray-700 border-gray-500/30";
    }
  };

  if (!userId && !businessId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={`entrance-fade-up ${className}`}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (contentHistory.length === 0) {
    return (
      <Card className={`entrance-fade-up ${className}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            <CardTitle>AI Content History</CardTitle>
          </div>
          <CardDescription>
            Your AI-generated content will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-muted-foreground">
              No AI-generated content yet. Start creating with our AI tools!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`entrance-fade-up ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            <CardTitle>AI Content History</CardTitle>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {contentHistory.length} items
          </Badge>
        </div>
        <CardDescription>
          View and reuse your AI-generated content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {contentHistory.map((item, index) => (
          <div
            key={item.id}
            className={`
              border border-gray-200 rounded-lg p-4
              hover:border-purple-300 hover:shadow-md
              transition-all duration-300
              entrance-slide-right stagger-${Math.min(index + 1, 8)}
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getTypeColor(item.type)} variant="outline">
                    {item.type}
                  </Badge>
                  {item.isPublished && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
                      Published
                    </Badge>
                  )}
                </div>
                <h4 className="font-semibold text-sm text-gray-900">
                  {item.title}
                </h4>
                {item.businessName && (
                  <p className="text-xs text-gray-500 mt-1">
                    {item.businessName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(item.content)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                {onReuse && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReuse(item)}
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content Preview */}
            <div className="mb-3">
              <p
                className={`text-sm text-gray-700 leading-relaxed ${
                  expandedId === item.id ? "" : "line-clamp-2"
                }`}
              >
                {item.content}
              </p>
              {item.content.length > 150 && (
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="text-xs text-purple-600 hover:text-purple-700 mt-1 font-medium"
                >
                  {expandedId === item.id ? "Show less" : "Show more"}
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {formatDistanceToNow(new Date(item.generatedAt), { addSuffix: true })}
                </span>
              </div>
              {item.prompt && expandedId === item.id && (
                <div className="text-xs text-gray-400 italic">
                  Prompt: "{item.prompt}"
                </div>
              )}
            </div>
          </div>
        ))}

        {/* View More */}
        {contentHistory.length >= limit && (
          <Button variant="outline" className="w-full mt-4" size="sm">
            View All History
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
