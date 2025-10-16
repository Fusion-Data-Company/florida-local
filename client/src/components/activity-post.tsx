import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Post, Business } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AIGeneratedBadge from "@/components/ai-generated-badge";
import { AnimatedHikeCard, type Stat } from "@/components/ui/card-25";
import { Clock, Heart, Award, Handshake, ShoppingBag, Store } from "lucide-react";

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

  // Fetch business data for the post
  const { data: business } = useQuery<Business>({
    queryKey: [`/api/businesses/${post.businessId}`],
    enabled: !!post.businessId,
  });

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
        return <Badge className="metallic-gold text-white px-3 py-1 shine-sweep-hover"><i className="fas fa-award mr-1.5"></i>Achievement</Badge>;
      case 'partnership':
        return <Badge className="metallic-teal text-white px-3 py-1 shine-sweep-hover"><i className="fas fa-handshake mr-1.5"></i>Partnership</Badge>;
      case 'product':
        return <Badge className="led-badge-live px-3 py-1"><i className="fas fa-shopping-bag mr-1.5"></i>New Product</Badge>;
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

  // Get icon based on post type for AnimatedHikeCard stats
  const getPostTypeIcon = () => {
    switch (post.type) {
      case 'achievement':
        return <Award className="h-4 w-4" />;
      case 'partnership':
        return <Handshake className="h-4 w-4" />;
      case 'product':
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <Store className="h-4 w-4" />;
    }
  };

  // Get post type label
  const getPostTypeLabel = () => {
    switch (post.type) {
      case 'achievement':
        return 'Achievement';
      case 'partnership':
        return 'Partnership';
      case 'product':
        return 'New Product';
      default:
        return 'Update';
    }
  };

  // Check if we should render as AnimatedHikeCard (3 images)
  const shouldRenderAsAnimatedCard = () => {
    const images = getPostImages();
    return images.length === 3 && business;
  };

  // Render AnimatedHikeCard version for posts with exactly 3 images
  if (shouldRenderAsAnimatedCard()) {
    const images = getPostImages();

    // Format date more elegantly
    const formattedDate = post.createdAt
      ? new Date(post.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: new Date(post.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        })
      : 'Recent';

    const stats: Stat[] = [
      {
        icon: <Clock className="h-4 w-4" />,
        label: formattedDate
      },
      {
        icon: getPostTypeIcon(),
        label: getPostTypeLabel()
      },
      {
        icon: <Heart className="h-4 w-4" />,
        label: `${localLikeCount} ${localLikeCount === 1 ? 'like' : 'likes'}`
      },
    ];

    // Truncate description intelligently at word boundary
    const description = post.content.length > 150
      ? post.content.substring(0, 150).split(' ').slice(0, -1).join(' ') + '...'
      : post.content;

    return (
      <div className="mb-4">
        <AnimatedHikeCard
          title={business!.name}
          images={images}
          stats={stats}
          description={description}
          href={`/business/${post.businessId}`}
          className="max-w-full"
        />
      </div>
    );
  }

  return (
    <article className="frosted-panel border border-white/30 rounded-2xl p-6 group apple-hover-depth transition-all duration-300" data-testid={`post-${post.id}`}>
      {/* Post Content */}
      <div className="relative z-10">
        <div className="flex items-start space-x-4 mb-4">
          {/* Futuristic Avatar with Metallic Border */}
          <div className="flex-shrink-0">
            <div className="metallic-chrome w-12 h-12 rounded-full flex items-center justify-center shine-sweep-hover">
              <i className={`${getPostIcon()} text-gray-900 text-lg relative z-10`}></i>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* User Info Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="elite-post-author font-serif font-bold text-lg mb-1 text-gray-900" style={{ color: '#0a0a0a', textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)' }}>
                  Local Business
                </h4>
                <time className="elite-post-timestamp text-sm text-gray-700" style={{ color: '#404040', textShadow: '0 1px 2px rgba(255, 255, 255, 0.4)' }}>
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
              <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="whitespace-pre-wrap leading-relaxed text-gray-900 font-medium" style={{ color: '#1a1a1a' }}>{post.content}</p>
              </div>
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
        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <div className="flex space-x-3">
            <button
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending || !isAuthenticated}
              className={`frosted-panel px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                isLiked ? 'metallic-gold text-white' : 'hover:shadow-md'
              } metallic-button-press`}
              data-testid={`button-like-post-${post.id}`}
            >
              <i className={`${isLiked ? "fas fa-heart" : "far fa-heart"} text-sm ${isLiked ? 'text-white' : 'text-gray-900'}`}></i>
              <span className={`text-sm font-semibold ${isLiked ? 'text-white' : 'text-gray-900'}`}>{localLikeCount}</span>
            </button>

            <button
              className="frosted-panel px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-md flex items-center gap-2 metallic-button-press"
              data-testid={`button-comment-post-${post.id}`}
            >
              <i className="far fa-comment text-sm text-gray-900"></i>
              <span className="text-sm font-semibold text-gray-900">{post.commentCount || 0}</span>
            </button>

            <button
              onClick={sharePost}
              className="frosted-panel px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-md flex items-center gap-2 metallic-button-press"
              data-testid={`button-share-post-${post.id}`}
            >
              <i className="fas fa-share text-sm text-gray-900"></i>
              <span className="text-sm font-semibold text-gray-900">{post.shareCount || 0}</span>
            </button>
          </div>

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !isAuthenticated}
            className={`p-3 rounded-lg transition-all duration-300 metallic-button-press ${
              isSaved ? 'metallic-teal text-white' : 'frosted-panel hover:shadow-md'
            }`}
            data-testid={`button-save-post-${post.id}`}
          >
            <i className={`${isSaved ? "fas fa-bookmark" : "far fa-bookmark"} text-base ${isSaved ? 'text-white' : 'text-gray-900'}`}></i>
          </button>
        </div>
      </div>
    </article>
  );
}
