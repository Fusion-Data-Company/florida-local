import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Star,
  MessageSquare,
  Reply,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Clock
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  reviewerName: string;
  reviewerPhotoUrl?: string;
  rating: number;
  comment: string;
  reviewTime: string;
  replyComment?: string;
  replyTime?: string;
  hasOwnerResponse?: boolean;
  sentiment?: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;
  };
  tags?: string[];
}

interface GMBReviewManagerProps {
  businessId: string;
}

export default function GMBReviewManager({ businessId }: GMBReviewManagerProps) {
  const { toast } = useToast();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch reviews
  const { data: reviews = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/businesses', businessId, 'gmb/reviews'],
    queryFn: async () => {
      const response = await fetch(`/api/businesses/${businessId}/gmb/reviews`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    }
  });

  // Fetch review insights
  const { data: insights } = useQuery({
    queryKey: ['/api/businesses', businessId, 'gmb/reviews/insights'],
    queryFn: async () => {
      const response = await fetch(`/api/businesses/${businessId}/gmb/reviews/insights`);
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    }
  });

  // Monitor sentiment
  const { data: sentimentAlerts } = useQuery({
    queryKey: ['/api/businesses', businessId, 'gmb/reviews/monitor'],
    queryFn: async () => {
      const response = await fetch(`/api/businesses/${businessId}/gmb/reviews/monitor`);
      if (!response.ok) return { alerts: [] };
      return response.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch new reviews mutation
  const fetchReviews = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/businesses/${businessId}/gmb/reviews/fetch`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/businesses', businessId, 'gmb/reviews'] });
      toast({
        title: 'Reviews Synced',
        description: 'Successfully fetched latest reviews from Google'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to fetch reviews',
        variant: 'destructive'
      });
    }
  });

  // Reply to review mutation
  const replyToReview = useMutation({
    mutationFn: async ({ reviewId, replyText }: { reviewId: string; replyText: string }) => {
      return apiRequest(`/api/businesses/${businessId}/gmb/reviews/${reviewId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ replyText })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/businesses', businessId, 'gmb/reviews'] });
      setIsReplyDialogOpen(false);
      setReplyText('');
      setSelectedReview(null);
      toast({
        title: 'Reply Posted',
        description: 'Your reply has been posted to Google'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Reply Failed',
        description: error.message || 'Failed to post reply',
        variant: 'destructive'
      });
    }
  });

  // Filter reviews
  const filteredReviews = reviews.filter((review: Review) => {
    if (filterRating !== 'all') {
      const rating = parseInt(filterRating);
      if (review.rating !== rating) return false;
    }
    if (filterStatus === 'replied' && !review.hasOwnerResponse) return false;
    if (filterStatus === 'unreplied' && review.hasOwnerResponse) return false;
    return true;
  });

  // Calculate stats
  const stats = {
    total: reviews.length,
    responded: reviews.filter((r: Review) => r.hasOwnerResponse).length,
    avgRating: reviews.length > 0 
      ? (reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0,
    responseRate: reviews.length > 0
      ? Math.round((reviews.filter((r: Review) => r.hasOwnerResponse).length / reviews.length) * 100)
      : 0
  };

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const getSentimentIcon = (sentiment?: { overall: string }) => {
    if (!sentiment) return null;
    switch (sentiment.overall) {
      case 'positive':
        return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <ThumbsDown className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Reviews</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{stats.avgRating}</p>
                {renderRatingStars(Math.round(Number(stats.avgRating)))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Response Rate</p>
              <p className="text-2xl font-bold">{stats.responseRate}%</p>
              <p className="text-xs text-muted-foreground">
                {stats.responded} of {stats.total} replied
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Action Needed</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.total - stats.responded}
              </p>
              <p className="text-xs text-muted-foreground">Pending replies</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Alerts */}
      {sentimentAlerts?.alerts && sentimentAlerts.alerts.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Review Alerts:</strong>
            <ul className="mt-2 space-y-1">
              {sentimentAlerts.alerts.map((alert: any, index: number) => (
                <li key={index} className="text-sm">
                  • {alert.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Review Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Reviews</CardTitle>
              <CardDescription>
                Manage and respond to your Google reviews
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchReviews.mutate()}
                disabled={fetchReviews.isPending}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Reviews
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ratings</SelectItem>
                <SelectItem value="5">5 stars</SelectItem>
                <SelectItem value="4">4 stars</SelectItem>
                <SelectItem value="3">3 stars</SelectItem>
                <SelectItem value="2">2 stars</SelectItem>
                <SelectItem value="1">1 star</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All reviews" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All reviews</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="unreplied">Needs reply</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="ml-auto text-sm text-muted-foreground">
              Showing {filteredReviews.length} of {reviews.length} reviews
            </div>
          </div>

          {/* Reviews List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredReviews.map((review: Review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Review Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarImage src={review.reviewerPhotoUrl} alt={review.reviewerName} />
                            <AvatarFallback>
                              {review.reviewerName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{review.reviewerName}</p>
                              {getSentimentIcon(review.sentiment)}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {renderRatingStars(review.rating)}
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.reviewTime).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {review.hasOwnerResponse ? (
                            <Badge variant="secondary">Replied</Badge>
                          ) : (
                            <Badge variant="outline">Pending Reply</Badge>
                          )}
                        </div>
                      </div>

                      {/* Review Content */}
                      <p className="text-sm">{review.comment}</p>

                      {/* Tags */}
                      {review.tags && review.tags.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {review.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Owner Reply */}
                      {review.replyComment && (
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Reply className="w-3 h-3" />
                            <span>Owner response</span>
                            {review.replyTime && (
                              <span>• {new Date(review.replyTime).toLocaleDateString()}</span>
                            )}
                          </div>
                          <p className="text-sm">{review.replyComment}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {!review.hasOwnerResponse && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReview(review);
                            setIsReplyDialogOpen(true);
                          }}
                        >
                          <Reply className="w-4 h-4 mr-2" />
                          Reply to Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredReviews.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No reviews found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
            <DialogDescription>
              Craft a professional response to this customer review
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              {/* Original Review */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium text-sm">{selectedReview.reviewerName}</p>
                  {renderRatingStars(selectedReview.rating)}
                </div>
                <p className="text-sm">{selectedReview.comment}</p>
              </div>

              {/* Reply Templates */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Quick Templates:</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReplyText(
                      `Thank you so much for your wonderful review, ${selectedReview.reviewerName}! We're thrilled to hear you had such a great experience. We look forward to serving you again soon!`
                    )}
                  >
                    Positive
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReplyText(
                      `Dear ${selectedReview.reviewerName}, we sincerely apologize for your experience. Your feedback is invaluable to us. Please contact us directly so we can make this right.`
                    )}
                  >
                    Apology
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReplyText(
                      `Thank you for your feedback, ${selectedReview.reviewerName}. We're always looking to improve our services. We appreciate you taking the time to share your experience.`
                    )}
                  >
                    Neutral
                  </Button>
                </div>
              </div>

              {/* Reply Text Area */}
              <Textarea
                placeholder="Write your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[120px]"
              />
              
              <p className="text-xs text-muted-foreground">
                {replyText.length} characters
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReplyDialogOpen(false);
                setReplyText('');
                setSelectedReview(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedReview && replyText.trim().length >= 10) {
                  replyToReview.mutate({
                    reviewId: selectedReview.id,
                    replyText: replyText.trim()
                  });
                }
              }}
              disabled={!replyText.trim() || replyText.trim().length < 10 || replyToReview.isPending}
            >
              Post Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}