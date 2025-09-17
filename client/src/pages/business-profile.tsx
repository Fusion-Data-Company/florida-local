import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Business, Product, Post } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NavigationHeader from "@/components/navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, UserMinus, MessageCircle, Edit3 } from "lucide-react";

export default function BusinessProfile() {
  const { id } = useParams() as { id: string };
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: business, isLoading } = useQuery<Business>({
    queryKey: ['/api/businesses', id],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/businesses', id, 'products'],
  });

  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ['/api/businesses', id, 'posts'],
  });

  // Check if current user is following this business
  const { data: followStatus } = useQuery({
    queryKey: ['/api/businesses', id, 'following'],
    enabled: isAuthenticated && !!id && user?.id !== business?.ownerId,
  });

  const isFollowing = followStatus?.isFollowing || false;

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await apiRequest('DELETE', `/api/businesses/${id}/follow`);
      } else {
        await apiRequest('POST', `/api/businesses/${id}/follow`);
      }
    },
    onSuccess: () => {
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing 
          ? `You've unfollowed ${business?.name}` 
          : `You're now following ${business?.name}`,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/businesses', id, 'following'] });
      queryClient.invalidateQueries({ queryKey: ['/api/businesses', id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMessage = () => {
    setLocation('/messages');
  };

  const handleEditBusiness = () => {
    // TODO: Implement business editing modal/page
    toast({
      title: "Coming soon",
      description: "Business editing feature will be available soon.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Business Not Found</h1>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  const isOwner = user?.id === business?.ownerId;

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      {/* Business Header */}
      <div className="relative">
        {/* Cover Image */}
        <div 
          className="h-64 md:h-80 bg-cover bg-center relative"
          style={{
            backgroundImage: business.coverImageUrl 
              ? `url(${business.coverImageUrl})` 
              : 'linear-gradient(135deg, hsl(198 93% 60%) 0%, hsl(25 75% 47%) 100%)'
          }}
        >
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Business Info Overlay */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-20 z-10">
            <div className="bg-card rounded-xl shadow-lg border border-border p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Logo */}
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  {business.logoUrl ? (
                    <img 
                      src={business.logoUrl} 
                      alt={business.name} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <i className="fas fa-store text-white text-2xl"></i>
                  )}
                </div>

                {/* Business Details */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold">{business.name}</h1>
                      {business.tagline && (
                        <p className="text-muted-foreground text-lg">{business.tagline}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        {business.location && (
                          <span className="text-sm text-muted-foreground">
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {business.location}
                          </span>
                        )}
                        {business.category && (
                          <Badge variant="secondary">{business.category}</Badge>
                        )}
                        {business.isVerified && (
                          <Badge className="bg-primary text-primary-foreground">
                            <i className="fas fa-check-circle mr-1"></i>Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      {isOwner ? (
                        <Button 
                          variant="outline" 
                          onClick={handleEditBusiness}
                          data-testid="button-edit-business"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      ) : isAuthenticated ? (
                        <>
                          <Button 
                            onClick={() => followMutation.mutate()}
                            disabled={followMutation.isPending}
                            variant={isFollowing ? "outline" : "default"}
                            data-testid="button-follow-business"
                          >
                            {followMutation.isPending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            ) : isFollowing ? (
                              <UserMinus className="h-4 w-4 mr-2" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            {isFollowing ? "Unfollow" : "Follow"}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleMessage}
                            data-testid="button-message-business"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </>
                      ) : (
                        <Button 
                          onClick={() => setLocation('/api/login')}
                          data-testid="button-login-to-follow"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Login to Follow
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex space-x-8 mt-4">
                    <div className="text-center">
                      <div className="font-bold text-primary text-lg">{business.followerCount || 0}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-secondary text-lg">{business.postCount || 0}</div>
                      <div className="text-sm text-muted-foreground">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-accent text-lg">{products.length}</div>
                      <div className="text-sm text-muted-foreground">Products</div>
                    </div>
                    {business.rating && parseFloat(business.rating) > 0 && (
                      <div className="text-center">
                        <div className="font-bold text-yellow-500 text-lg">
                          <i className="fas fa-star mr-1"></i>
                          {parseFloat(business.rating).toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">Rating</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {business.description && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-foreground leading-relaxed">{business.description}</p>
                </div>
              )}

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid md:grid-cols-2 gap-4">
                  {business.phone && (
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-phone text-primary"></i>
                      <span>{business.phone}</span>
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-globe text-primary"></i>
                      <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Visit Website
                      </a>
                    </div>
                  )}
                  {business.address && (
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-map-marker-alt text-primary"></i>
                      <span>{business.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex space-x-1 mb-8 overflow-x-auto">
          <Button variant="default" className="whitespace-nowrap" data-testid="tab-posts">
            Posts ({posts.length})
          </Button>
          <Button variant="outline" className="whitespace-nowrap" data-testid="tab-products">
            Products ({products.length})
          </Button>
          <Button variant="outline" className="whitespace-nowrap" data-testid="tab-about">
            About
          </Button>
        </div>

        {/* Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.length > 0 ? (
            posts.map((post: any) => (
              <Card key={post.id} className="hover-lift">
                <CardContent className="p-4">
                  <p className="text-foreground mb-3">{post.content}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <div className="flex space-x-4">
                      <span><i className="fas fa-heart mr-1"></i>{post.likeCount || 0}</span>
                      <span><i className="fas fa-comment mr-1"></i>{post.commentCount || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <i className="fas fa-file-alt text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">No posts yet.</p>
              {isOwner && (
                <Button className="mt-4" data-testid="button-create-first-post">
                  Create Your First Post
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
