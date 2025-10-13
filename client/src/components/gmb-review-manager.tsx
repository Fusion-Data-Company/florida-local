import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, Reply, MessageSquare, Filter, Search, CheckCircle2, Clock, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import AIGeneratedBadge from "@/components/ai-generated-badge";

interface GMBReview {
  id: string;
  reviewId: string;
  authorName: string;
  authorPhotoUrl?: string;
  rating: number;
  comment: string;
  reviewTime: string;
  hasReply: boolean;
  reply?: {
    text: string;
    updateTime: string;
    isAiGenerated?: boolean;
  };
  needsResponse: boolean;
}

interface GMBReviewManagerProps {
  businessId: string;
  className?: string;
}

/**
 * GMB Review Manager Component
 *
 * Comprehensive interface for managing Google My Business reviews.
 * Features: View reviews, respond with AI assistance, filter, search, analytics.
 *
 * @param businessId - The business to manage reviews for
 * @param className - Additional Tailwind classes
 */
export default function GMBReviewManager({
  businessId,
  className = ""
}: GMBReviewManagerProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedReview, setSelectedReview] = useState<GMBReview | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);

  // Fetch reviews
  const { data: reviews = [], isLoading } = useQuery<GMBReview[]>({
    queryKey: ['/api/gmb/reviews', businessId, filterRating, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterRating !== "all") params.set('rating', filterRating);
      if (filterStatus !== "all") params.set('status', filterStatus);

      // TODO: Replace with actual API call
      // return fetch(`/api/gmb/reviews/${businessId}?${params}`).then(res => res.json());

      // Mock data
      return [
        {
          id: "1",
          reviewId: "gmb-review-1",
          authorName: "Sarah Johnson",
          rating: 5,
          comment: "Amazing service! The staff was incredibly friendly and knowledgeable. I've already recommended this place to all my friends. Will definitely be back!",
          reviewTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          hasReply: true,
          reply: {
            text: "Thank you so much for the wonderful review, Sarah! We're thrilled to hear you had such a great experience. We look forward to serving you again soon!",
            updateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            isAiGenerated: true,
          },
          needsResponse: false,
        },
        {
          id: "2",
          reviewId: "gmb-review-2",
          authorName: "Michael Chen",
          rating: 4,
          comment: "Great products and atmosphere. Only issue was the wait time, but overall worth it!",
          reviewTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          hasReply: false,
          needsResponse: true,
        },
        {
          id: "3",
          reviewId: "gmb-review-3",
          authorName: "Emma Rodriguez",
          rating: 5,
          comment: "Best experience I've had in years! Professional, efficient, and the results exceeded my expectations.",
          reviewTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          hasReply: false,
          needsResponse: true,
        },
        {
          id: "4",
          reviewId: "gmb-review-4",
          authorName: "David Thompson",
          rating: 3,
          comment: "Decent service but felt it was a bit overpriced for what we got. Staff was nice though.",
          reviewTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          hasReply: false,
          needsResponse: true,
        },
      ] as GMBReview[];
    },
    enabled: Boolean(businessId),
  });

  // Generate AI reply mutation
  const generateReplyMutation = useMutation({
    mutationFn: async (review: GMBReview) => {
      setIsGeneratingReply(true);
      // TODO: Call actual AI endpoint
      // const response = await fetch(`/api/ai/generate-review-reply`, {
      //   method: 'POST',
      //   body: JSON.stringify({ review: review.comment, rating: review.rating })
      // });
      // return response.json();

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock AI-generated responses
      const responses = {
        5: `Thank you so much for the wonderful ${review.rating}-star review, ${review.authorName}! We're thrilled to hear you had such a positive experience. Your kind words mean the world to our team, and we look forward to serving you again soon!`,
        4: `Thank you for your feedback, ${review.authorName}! We're glad you enjoyed your experience. We appreciate you mentioning the wait time - we're always working to improve. Hope to see you again soon!`,
        3: `Thank you for your honest feedback, ${review.authorName}. We appreciate your comments about pricing and are always evaluating our value proposition. We're glad our staff made a positive impression, and we hope to exceed your expectations next time!`,
      };

      return { reply: responses[review.rating as keyof typeof responses] || responses[4] };
    },
    onSuccess: (data) => {
      setReplyText(data.reply);
      setIsGeneratingReply(false);
      toast({
        title: "Reply Generated",
        description: "AI has drafted a response. Feel free to edit before posting.",
      });
    },
    onError: () => {
      setIsGeneratingReply(false);
      toast({
        title: "Generation Failed",
        description: "Failed to generate reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Post reply mutation
  const postReplyMutation = useMutation({
    mutationFn: async ({ reviewId, reply }: { reviewId: string; reply: string }) => {
      // TODO: Call actual API endpoint
      // await fetch(`/api/gmb/reviews/${reviewId}/reply`, {
      //   method: 'POST',
      //   body: JSON.stringify({ reply })
      // });
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Reply Posted",
        description: "Your reply has been posted to Google My Business.",
      });
      setSelectedReview(null);
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ['/api/gmb/reviews', businessId] });
    },
    onError: () => {
      toast({
        title: "Post Failed",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateReply = () => {
    if (selectedReview) {
      generateReplyMutation.mutate(selectedReview);
    }
  };

  const handlePostReply = () => {
    if (selectedReview && replyText.trim()) {
      postReplyMutation.mutate({
        reviewId: selectedReview.reviewId,
        reply: replyText.trim()
      });
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-emerald-600";
    if (rating >= 3.5) return "text-blue-600";
    if (rating >= 2.5) return "text-amber-600";
    return "text-red-600";
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchQuery === "" ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const needsResponseCount = reviews.filter(r => r.needsResponse).length;
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (isLoading) {
    return (
      <Card className={`entrance-fade-up ${className}`}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`entrance-fade-up ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Review Management
            </CardTitle>
            <CardDescription>
              Manage and respond to Google My Business reviews
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold flex items-center gap-1">
                {averageRating.toFixed(1)}
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-xs text-muted-foreground">
                {reviews.length} reviews
              </div>
            </div>
            {needsResponseCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {needsResponseCount} pending
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-5 gap-2">
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => r.rating === star).length;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className={`w-3 h-3 ${star >= 4 ? "text-amber-500 fill-amber-500" : "text-gray-400"}`} />
                  <span className="text-xs font-medium">{star}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">{count}</div>
              </div>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="needs-response">Needs Response</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No reviews found</p>
            </div>
          ) : (
            filteredReviews.map((review, index) => (
              <div
                key={review.id}
                className={`
                  border border-gray-200 rounded-lg p-4
                  hover:border-blue-300 hover:shadow-md
                  transition-all duration-300
                  entrance-slide-right stagger-${Math.min(index + 1, 8)}
                `}
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {review.authorName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{review.authorName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < review.rating
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(review.reviewTime), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.needsResponse && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {review.hasReply && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Replied
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Review Content */}
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  {review.comment}
                </p>

                {/* Existing Reply */}
                {review.reply && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Reply className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-900">Your Response</span>
                      {review.reply.isAiGenerated && (
                        <AIGeneratedBadge variant="minimal" size="sm" />
                      )}
                      <span className="text-xs text-blue-600 ml-auto">
                        {formatDistanceToNow(new Date(review.reply.updateTime), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-blue-900">{review.reply.text}</p>
                  </div>
                )}

                {/* Reply Button */}
                {!review.hasReply && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedReview(review)}
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Respond to Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Respond to Review</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Original Review */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < review.rating
                                      ? "text-amber-500 fill-amber-500"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-semibold">{review.authorName}</span>
                          </div>
                          <p className="text-sm text-gray-700">{review.comment}</p>
                        </div>

                        {/* AI Generate Button */}
                        <Button
                          onClick={handleGenerateReply}
                          disabled={isGeneratingReply}
                          variant="outline"
                          className="w-full"
                        >
                          {isGeneratingReply ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Generating AI Response...
                            </>
                          ) : (
                            <>
                              <Star className="w-4 h-4 mr-2" />
                              Generate AI Response
                            </>
                          )}
                        </Button>

                        {/* Reply Textarea */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Your Response
                          </label>
                          <Textarea
                            placeholder="Write your response..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={6}
                            className="resize-none"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {replyText.length} characters
                          </p>
                        </div>

                        {/* Post Button */}
                        <div className="flex gap-2">
                          <Button
                            onClick={handlePostReply}
                            disabled={!replyText.trim() || postReplyMutation.isPending}
                            className="flex-1"
                          >
                            {postReplyMutation.isPending ? "Posting..." : "Post Reply"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedReview(null);
                              setReplyText("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
