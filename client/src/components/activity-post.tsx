import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Post } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AIGeneratedBadge from "@/components/ai-generated-badge";

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
  const { data: likeStatus } = useQuery<{ isLiked: boolean }>({
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
    <article className="elite-post-card group" data-testid={`post-${post.id}`}>
      {/* Marble Texture Overlay */}
      <div className="elite-post-marble-overlay"></div>
      
      {/* Post Content */}
      <div className="relative z-10">
        <div className="flex items-start space-x-4 mb-5">
          {/* Elite Avatar with Glass Morphism */}
          <div className="elite-post-avatar-container flex-shrink-0">
            <div className="elite-post-avatar-frame">
              <div className="w-12 h-12 bg-gradient-to-br from-primary via-accent to-secondary rounded-full flex items-center justify-center relative overflow-hidden">
                <i className={`${getPostIcon()} text-primary-foreground text-lg relative z-10`}></i>
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* User Info Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="elite-post-author font-serif font-bold text-lg mb-1">
                  Local Business
                </h4>
                <time className="elite-post-timestamp text-sm">
                  {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Unknown date'}
                </time>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {getPostBadge()}
                {/* Show AI badge if post was AI-generated */}
                {(post as any).isAiGenerated && (
                  <AIGeneratedBadge variant="subtle" size="sm" />
                )}
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="elite-post-action-btn h-8 w-8 p-0"
                    data-testid={`button-follow-post-${post.id}`}
                  >
                    <i className="fas fa-user-plus text-sm"></i>
                  </Button>
                )}
              </div>
            </div>
            
            {/* Post Content Text */}
            <div className="elite-post-content mb-4">
              <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>
            
            {/* Post Images Gallery */}
            {getPostImages().length > 0 && (
              <div className={`elite-post-gallery mb-4 ${
                getPostImages().length === 1 ? 'elite-post-gallery-single' :
                getPostImages().length === 2 ? 'elite-post-gallery-double' :
                'elite-post-gallery-multiple'
              }`}>
                {getPostImages().slice(0, 3).map((image: string, index: number) => (
                  <div
                    key={index}
                    className="elite-post-image-frame"
                  >
                    <div 
                      className="elite-post-image"
                      style={{
                        backgroundImage: `url(${image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {index === 2 && getPostImages().length > 3 && (
                        <div className="elite-post-image-overlay">
                          <span className="text-white font-semibold text-lg font-serif">
                            +{getPostImages().length - 3} more
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Engagement Actions */}
        <div className="flex items-center justify-between pt-5 border-t elite-post-divider">
          <div className="flex space-x-2">
            <button
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending || !isAuthenticated}
              className={`elite-post-interaction-btn ${isLiked ? 'elite-post-interaction-active' : ''}`}
              data-testid={`button-like-post-${post.id}`}
            >
              <i className={`${isLiked ? "fas fa-heart" : "far fa-heart"} elite-post-icon`}></i>
              <span className="elite-post-count">{localLikeCount}</span>
            </button>
            
            <button
              className="elite-post-interaction-btn"
              data-testid={`button-comment-post-${post.id}`}
            >
              <i className="far fa-comment elite-post-icon"></i>
              <span className="elite-post-count">{post.commentCount || 0}</span>
            </button>
            
            <button
              onClick={sharePost}
              className="elite-post-interaction-btn"
              data-testid={`button-share-post-${post.id}`}
            >
              <i className="fas fa-share elite-post-icon"></i>
              <span className="elite-post-count">{post.shareCount || 0}</span>
            </button>
          </div>
          
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !isAuthenticated}
            className={`elite-post-save-btn ${isSaved ? 'elite-post-save-active' : ''}`}
            data-testid={`button-save-post-${post.id}`}
          >
            <i className={`${isSaved ? "fas fa-bookmark" : "far fa-bookmark"} text-lg`}></i>
          </button>
        </div>
      </div>
    </article>
  );
}
