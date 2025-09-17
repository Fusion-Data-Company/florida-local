import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Post } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ActivityPostProps {
  post: Post;
}

export default function ActivityPost({ post }: ActivityPostProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likeCount || 0);

  // Check if current user has liked this post
  const { data: likeStatus } = useQuery({
    queryKey: ['/api/posts', post.id, 'liked'],
    enabled: isAuthenticated,
  });

  // Update isLiked state when likeStatus is loaded
  useEffect(() => {
    if (likeStatus?.isLiked !== undefined) {
      setIsLiked(likeStatus.isLiked);
    }
  }, [likeStatus]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await apiRequest('DELETE', `/api/posts/${post.id}/like`);
      } else {
        await apiRequest('POST', `/api/posts/${post.id}/like`);
      }
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      setLocalLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts', post.id, 'liked'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // TODO: Implement save post API call
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      setIsSaved(!isSaved);
      toast({
        title: isSaved ? "Removed from Saved" : "Saved",
        description: isSaved ? "Post removed from your saved items" : "Post saved to your collection",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      });
    },
  });

  const sharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: `Check out this post from Local Business`,
        text: post.content,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Post link copied to clipboard",
      });
    }
  };

  const getPostIcon = () => {
    switch (post.type) {
      case 'achievement':
        return 'fas fa-trophy';
      case 'partnership':
        return 'fas fa-handshake';
      case 'product':
        return 'fas fa-shopping-bag';
      default:
        return 'fas fa-store';
    }
  };

  const getPostBadge = () => {
    switch (post.type) {
      case 'achievement':
        return <Badge className="bg-accent text-accent-foreground"><i className="fas fa-award mr-1"></i>Achievement</Badge>;
      case 'partnership':
        return <Badge className="bg-primary text-primary-foreground"><i className="fas fa-handshake mr-1"></i>Partnership</Badge>;
      case 'product':
        return <Badge className="bg-secondary text-secondary-foreground"><i className="fas fa-shopping-bag mr-1"></i>New Product</Badge>;
      default:
        return null;
    }
  };

  const getPostImages = () => {
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      return post.images;
    }
    return [];
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-lg p-6">
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
          <i className={`${getPostIcon()} text-white`}></i>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-bold">Local Business</h4>
              <p className="text-sm text-muted-foreground">
                {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Unknown date'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {getPostBadge()}
              {isAuthenticated && (
                <Button variant="ghost" size="sm" data-testid={`button-follow-post-${post.id}`}>
                  <i className="fas fa-user-plus"></i>
                </Button>
              )}
            </div>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
          </div>
          
          {/* Post Images */}
          {getPostImages().length > 0 && (
            <div className={`grid gap-2 mb-4 ${
              getPostImages().length === 1 ? 'grid-cols-1' :
              getPostImages().length === 2 ? 'grid-cols-2' :
              'grid-cols-2 md:grid-cols-3'
            }`}>
              {getPostImages().slice(0, 3).map((image: string, index: number) => (
                <div
                  key={index}
                  className="relative rounded-lg overflow-hidden aspect-video bg-muted"
                  style={{
                    backgroundImage: `url(${image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {index === 2 && getPostImages().length > 3 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        +{getPostImages().length - 3} more
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Engagement Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending || !isAuthenticated}
            className={`flex items-center space-x-2 transition-colors ${
              isLiked ? "text-accent" : "text-muted-foreground hover:text-accent"
            }`}
            data-testid={`button-like-post-${post.id}`}
          >
            <i className={isLiked ? "fas fa-heart" : "far fa-heart"}></i>
            <span>{localLikeCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
            data-testid={`button-comment-post-${post.id}`}
          >
            <i className="far fa-comment"></i>
            <span>{post.commentCount || 0}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={sharePost}
            className="flex items-center space-x-2 text-muted-foreground hover:text-secondary transition-colors"
            data-testid={`button-share-post-${post.id}`}
          >
            <i className="fas fa-share"></i>
            <span>{post.shareCount || 0}</span>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !isAuthenticated}
          className={`transition-colors ${
            isSaved ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid={`button-save-post-${post.id}`}
        >
          <i className={isSaved ? "fas fa-bookmark" : "far fa-bookmark"}></i>
        </Button>
      </div>
    </div>
  );
}
