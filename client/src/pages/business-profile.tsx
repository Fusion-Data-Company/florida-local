import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Business, Product, Post } from "@shared/types";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AIBusinessDashboard from "@/components/ai-business-dashboard";
import MagicEliteProductCard from "@/components/magic-elite-product-card";
import { UserPlus, UserMinus, MessageCircle, Edit3, Clock, MapPin, Phone, Globe, Star, Music2, PlayCircle } from "lucide-react";
import { getSpotifyTrackId, getYouTubeId } from "@/lib/media";
import { GMBVerificationBadge, GMBConnectionFlow, GMBReviewsSection, GMBDataAttribution } from "@/components/gmb-integration";
import AIInsightsPanel from "@/components/ai-insights-panel";

export default function BusinessProfile() {
  const { id } = useParams() as { id: string };
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'posts' | 'analytics' | 'products' | 'reviews' | 'about'>('posts');

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
  const { data: followStatus } = useQuery<{ isFollowing: boolean }>({
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
    setLocation(`/business/${id}/edit`);
  };

  if (isLoading) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light"
        data-surface-intensity="delicate"
        data-surface-tone="warm"
      >
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
      </div>
    );
  }

  if (!business) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light"
        data-surface-intensity="delicate"
        data-surface-tone="warm"
      >
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Business Not Found</h1>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === business?.ownerId;

  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light"
      data-surface-intensity="delicate"
      data-surface-tone="warm"
    >

      {/* Business Header */}
      <div className="relative">
        {/* Magic MCP Elite Cover Image */}
        <div 
          className="h-96 md:h-[500px] bg-cover bg-center relative overflow-hidden magic-glow-intense"
          style={{
            backgroundImage: business.coverImageUrl 
              ? `linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%), url(${business.coverImageUrl})` 
              : 'linear-gradient(135deg, var(--fl-teal-lagoon) 0%, var(--fl-sunset-gold) 100%)'
          }}
        >
          {/* Magic MCP Floating Particles */}
          <div className="absolute inset-0">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          {/* Elite Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Premium Frame Effect */}
          <div className="absolute inset-4 border-2 border-white/20 rounded-3xl pointer-events-none opacity-60" />
        </div>

        {/* Business Info Overlay */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-20 z-10">
            <div 
              className="business-profile-header elite-business-card p-8 rounded-3xl overflow-hidden relative group magic-shadow-luxury"
              style={{
                background: `
                  linear-gradient(145deg, 
                    rgba(255,255,255,0.95) 0%, 
                    rgba(255,255,255,0.85) 100%)
                `,
                backdropFilter: 'blur(30px) saturate(200%)',
                border: '3px solid rgba(255,255,255,0.3)',
                boxShadow: `
                  0 32px 64px rgba(0,0,0,0.12),
                  0 0 40px rgba(0, 139, 139, 0.2),
                  0 0 80px rgba(212, 175, 55, 0.15),
                  inset 0 1px 0 rgba(255,255,255,1)
                `
              }}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 marble-content">
                {/* Logo */}
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  {business.logoUrl ? (
                    <img 
                      src={business.logoUrl} 
                      alt={business.name} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <i className="fas fa-store text-primary text-2xl"></i>
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
                        <GMBVerificationBadge business={business} />
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
                          onClick={() => window.location.href = '/api/login'}
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
                <div className="mt-6 pt-6 border-t border-border marble-content">
                  <p className="text-foreground leading-relaxed">{business.description}</p>
                </div>
              )}

              {/* Contact Info & Hours */}
              <div className="mt-6 pt-6 border-t border-border marble-content">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Contact Information</h3>
                    {business.phone ? (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>{business.phone}</span>
                      </div>
                    ) : null}
                    {business.website ? (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Visit Website
                        </a>
                      </div>
                    ) : null}
                    {business.address ? (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{business.address}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Business Hours */}
                  {business.operatingHours && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Business Hours
                      </h3>
                      <div className="space-y-1 text-sm">
                        {Object.entries(business.operatingHours as any).map(([day, hours]: [string, any]) => {
                          return (
                            <div key={day} className="flex justify-between">
                              <span className="capitalize">{day}:</span>
                              <span className={hours?.isClosed ? 'text-muted-foreground' : ''}>
                                {hours?.isClosed ? 'Closed' : `${hours?.open} - ${hours?.close}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* GMB Data Attribution */}
                <GMBDataAttribution business={business} />
              </div>
            </div>
          </div>
        </div>
        
        {/* GMB Connection Flow - Only for owners */}
        {isOwner && (
          <div className="container mx-auto px-4">
            <GMBConnectionFlow business={business} isOwner={isOwner} />
          </div>
        )}
      </div>

      {/* Media Strip: Spotify / YouTube */}
      <div className="container mx-auto px-4">
        {(() => {
          const social = (business as any).socialLinks as any || {};
          const spotifyId = getSpotifyTrackId(social?.spotifyTrackUrl);
          const youtubeId = getYouTubeId(social?.youtubeUrl);
          if (!spotifyId && !youtubeId) return null;
          return (
            <div className="grid md:grid-cols-2 gap-6 my-8 business-profile-media rounded-2xl p-6">
              {spotifyId && (
                <div className="rounded-2xl overflow-hidden border marble-content">
                  <div className="flex items-center gap-2 p-3 text-sm font-medium"><Music2 className="h-4 w-4" /> Featured Track</div>
                  <iframe
                    src={`https://open.spotify.com/embed/track/${spotifyId}`}
                    width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              )}
              {youtubeId && (
                <div className="rounded-2xl overflow-hidden border marble-content">
                  <div className="flex items-center gap-2 p-3 text-sm font-medium"><PlayCircle className="h-4 w-4" /> Featured Video</div>
                  <div className="relative w-full" style={{paddingTop:'56.25%'}}>
                    <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${youtubeId}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8">
        <div className="business-profile-tabs flex space-x-1 mb-8 overflow-x-auto rounded-2xl p-4">
          <Button 
            variant={activeTab === 'posts' ? 'default' : 'outline'} 
            className="whitespace-nowrap marble-content" 
            onClick={() => setActiveTab('posts')}
            data-testid="tab-posts"
          >
            Posts ({posts.length})
          </Button>
          {isOwner && (
            <Button 
              variant={activeTab === 'analytics' ? 'fl-teal' : 'outline'} 
              className="whitespace-nowrap marble-content" 
              onClick={() => setActiveTab('analytics')}
              data-testid="tab-analytics"
            >
              🧠 AI Analytics
            </Button>
          )}
          <Button 
            variant={activeTab === 'products' ? 'default' : 'outline'} 
            className="whitespace-nowrap marble-content" 
            onClick={() => setActiveTab('products')}
            data-testid="tab-products"
          >
            Products ({products.length})
          </Button>
          <Button 
            variant={activeTab === 'reviews' ? 'default' : 'outline'} 
            className="whitespace-nowrap marble-content" 
            onClick={() => setActiveTab('reviews')}
            data-testid="tab-reviews"
          >
            Reviews
          </Button>
          <Button 
            variant={activeTab === 'about' ? 'default' : 'outline'} 
            className="whitespace-nowrap marble-content" 
            onClick={() => setActiveTab('about')}
            data-testid="tab-about"
          >
            About
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.length > 0 ? (
              posts.map((post: any) => (
                <Card key={post.id} className="business-profile-post-card hover-lift">
                  <CardContent className="p-4 marble-content">
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
        )}

        {activeTab === 'analytics' && isOwner && (
          <div className="space-y-6">
            {/* AI Insights Panel - NEW! */}
            <AIInsightsPanel businessId={business.id} className="entrance-fade-up" />

            {/* Existing AI Business Dashboard */}
            <AIBusinessDashboard businessId={business.id} />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.length > 0 ? (
              products.map((product: any, index) => (
                <div key={product.id} className="magic-glow-intense">
                  <MagicEliteProductCard product={product} index={index} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 bg-gradient-to-br from-background via-muted/20 to-background rounded-2xl border border-border shadow-lg">
                <i className="fas fa-box text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">No products listed yet.</p>
                {isOwner && (
                  <Button variant="fl-gold" className="mt-4 px-6 py-3 shadow-[0_8px_30px_rgba(212,175,55,0.25)]" data-testid="button-add-first-product">
                    Add Your First Product
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <GMBReviewsSection businessId={business.id} isOwner={isOwner} />
        )}

        {activeTab === 'about' && (
          <div className="max-w-4xl">
            <Card className="business-profile-about-card">
              <CardContent className="p-6 marble-content">
                <h3 className="text-xl font-semibold mb-4">About {business.name}</h3>
                
                {business.description ? (
                  <p className="text-foreground leading-relaxed mb-6">{business.description}</p>
                ) : (
                  <p className="text-muted-foreground mb-6">No description available.</p>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Business Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Business Details</h4>
                    {business.category && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <Badge variant="secondary">{business.category}</Badge>
                      </div>
                    )}
                    {business.location && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="text-foreground">{business.location}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="text-foreground">
                        {business.createdAt ? new Date(business.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Statistics</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Followers:</span>
                      <span className="font-semibold text-primary">{business.followerCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Posts:</span>
                      <span className="font-semibold text-secondary">{business.postCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Products Listed:</span>
                      <span className="font-semibold text-accent">{products.length}</span>
                    </div>
                    {business.rating && parseFloat(business.rating) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Average Rating:</span>
                        <span className="font-semibold text-yellow-500">
                          <i className="fas fa-star mr-1"></i>
                          {parseFloat(business.rating).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
