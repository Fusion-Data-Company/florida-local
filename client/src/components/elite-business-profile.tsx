import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Business, Product, Post } from "@shared/types";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EliteNavigationHeader from "@/components/elite-navigation-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import AIBusinessDashboard from "@/components/ai-business-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UserPlus, 
  UserMinus, 
  MessageCircle, 
  Edit3, 
  Clock, 
  MapPin, 
  Phone, 
  Globe,
  Star,
  Heart,
  Share2,
  BarChart3,
  Zap,
  Crown,
  Sparkles
} from "lucide-react";
import { GMBVerificationBadge, GMBConnectionFlow, GMBReviewsSection, GMBDataAttribution } from "@/components/gmb-integration";
import { VerifiedBadge, getVerificationTier } from "@/components/ui/verified-badge";

export default function EliteBusinessProfile() {
  const { id } = useParams() as { id: string };
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'posts' | 'analytics' | 'products' | 'reviews' | 'about'>('posts');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const { data: business, isLoading } = useQuery<Business>({
    queryKey: ['/api/businesses', id],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/businesses', id, 'products'],
  });

  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ['/api/businesses', id, 'posts'],
  });

  const isOwner = user?.id === business?.ownerId;

  // Mouse tracking for ambient effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (isLoading) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light"
        data-surface-intensity="delicate"
        data-surface-tone="warm"
      >
        <EliteNavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-80 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div
        className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light flex items-center justify-center"
        data-surface-intensity="delicate"
        data-surface-tone="warm"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Business not found</h1>
          <Button onClick={() => setLocation('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="premium-page-wrapper premium-surface min-h-screen marble-texture abstract-overlay-light"
      data-surface-intensity="delicate"
      data-surface-tone="warm"
    >
      <EliteNavigationHeader />

      {/* MAGIC MCP ELITE HERO SECTION */}
      <div className="relative overflow-hidden">
        {/* Dynamic Ambient Background */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, 
                rgba(25, 182, 246, 0.2) 0%, 
                rgba(255, 152, 67, 0.1) 30%, 
                transparent 70%),
              linear-gradient(135deg, 
                var(--miami-vice-cyan) 0%, 
                var(--miami-emerald) 50%, 
                var(--miami-vice-pink) 100%)
            `
          }}
        />

        {/* Elite Cover Image with Parallax Effect */}
        <div 
          className="h-96 md:h-[500px] bg-cover bg-center relative transform transition-transform duration-700"
          style={{
            backgroundImage: business.coverImageUrl 
              ? `linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%), url(${business.coverImageUrl})` 
              : 'linear-gradient(135deg, var(--miami-vice-cyan) 0%, var(--miami-emerald) 100%)',
            transform: `translateY(${mousePosition.y * -0.02}px)`
          }}
        >
          {/* Magic MCP Floating Particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
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

        {/* MAGIC MCP ELITE BUSINESS CARD */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-32 z-20">
            <div 
              className="elite-business-card p-8 rounded-3xl overflow-hidden relative group"
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
                  0 0 40px rgba(25, 182, 246, 0.2),
                  0 0 80px rgba(255, 152, 67, 0.1),
                  inset 0 1px 0 rgba(255,255,255,1)
                `
              }}
            >
              {/* Magic MCP Ambient Glow Effect */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                  background: `
                    radial-gradient(circle at 50% 50%, 
                      rgba(25, 182, 246, 0.1) 0%, 
                      rgba(255, 152, 67, 0.05) 50%, 
                      transparent 100%)
                  `
                }}
              />

              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 relative z-10">
                {/* Elite Business Logo */}
                <div className="relative group">
                  {business.logoUrl ? (
                    <div className="relative">
                      <img 
                        src={business.logoUrl} 
                        alt={business.name}
                        className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/50 shadow-xl transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-xl">
                      <span className="text-3xl font-bold text-white">
                        {business.name?.charAt(0) || 'B'}
                      </span>
                    </div>
                  )}
                  
                  {/* Elite Verification Badge */}
                  {getVerificationTier({
                    gmbConnected: business.gmbConnected,
                    averageRating: business.rating,
                    totalReviews: business.reviewCount,
                    monthlyEngagement: (business.followerCount || 0) + (business.postCount || 0) * 10,
                    isSpotlightFeatured: business.isVerified
                  }) && (
                    <div className="absolute -top-2 -right-2">
                      <VerifiedBadge
                        type={getVerificationTier({
                          gmbConnected: business.gmbConnected,
                          averageRating: business.rating,
                          totalReviews: business.reviewCount,
                          monthlyEngagement: (business.followerCount || 0) + (business.postCount || 0) * 10,
                          isSpotlightFeatured: business.isVerified
                        })!}
                        size="lg"
                      />
                    </div>
                  )}
                </div>

                {/* Elite Business Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-3xl lg:text-4xl font-bold miami-heading bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      {business.name}
                    </h1>
                    {getVerificationTier({
                      gmbConnected: business.gmbConnected,
                      averageRating: business.rating,
                      totalReviews: business.reviewCount,
                      monthlyEngagement: (business.followerCount || 0) + (business.postCount || 0) * 10,
                      isSpotlightFeatured: business.isVerified
                    }) && (
                      <VerifiedBadge
                        type={getVerificationTier({
                          gmbConnected: business.gmbConnected,
                          averageRating: business.rating,
                          totalReviews: business.reviewCount,
                          monthlyEngagement: (business.followerCount || 0) + (business.postCount || 0) * 10,
                          isSpotlightFeatured: business.isVerified
                        })!}
                        size="md"
                        showLabel
                      />
                    )}
                    <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
                  </div>
                  
                  <p className="text-xl text-slate-600 mb-4 miami-body-text">
                    {business.tagline}
                  </p>

                  {/* Premium Elite Stats Row with Metallic Effects */}
                  <div className="flex flex-wrap gap-6 mb-6">
                    <div
                      className="relative flex items-center gap-3 px-6 py-3 rounded-xl overflow-hidden group hover:scale-105 transition-transform duration-300"
                      style={{
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)',
                        boxShadow: '0 4px 15px rgba(252, 211, 77, 0.4), inset 0 1px 0 rgba(255,255,255,0.8)',
                        border: '2px solid rgba(251, 191, 36, 0.5)',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-transparent to-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animation: 'shimmer 3s linear infinite' }}></div>
                      <Star className="h-6 w-6 text-yellow-600 fill-yellow-500 relative z-10" />
                      <span className="font-black text-yellow-800 text-lg relative z-10">{business.rating || "4.8"}</span>
                      <span className="text-yellow-700 font-semibold relative z-10">({business.reviewCount || 0} reviews)</span>
                    </div>

                    <div
                      className="relative flex items-center gap-3 px-6 py-3 rounded-xl overflow-hidden group hover:scale-105 transition-transform duration-300"
                      style={{
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
                        boxShadow: '0 4px 15px rgba(147, 197, 253, 0.4), inset 0 1px 0 rgba(255,255,255,0.8)',
                        border: '2px solid rgba(96, 165, 250, 0.5)',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-transparent to-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animation: 'shimmer 3s linear infinite' }}></div>
                      <Heart className="h-6 w-6 text-blue-600 fill-blue-500 relative z-10" />
                      <span className="font-black text-blue-800 text-lg relative z-10">{business.followerCount || 0}</span>
                      <span className="text-blue-700 font-semibold relative z-10">followers</span>
                    </div>

                    <div
                      className="relative flex items-center gap-3 px-6 py-3 rounded-xl overflow-hidden group hover:scale-105 transition-transform duration-300"
                      style={{
                        background: 'linear-gradient(135deg, #fae8ff 0%, #f3e8ff 50%, #e9d5ff 100%)',
                        boxShadow: '0 4px 15px rgba(233, 213, 255, 0.4), inset 0 1px 0 rgba(255,255,255,0.8)',
                        border: '2px solid rgba(192, 132, 252, 0.5)',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-transparent to-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animation: 'shimmer 3s linear infinite' }}></div>
                      <BarChart3 className="h-6 w-6 text-purple-600 relative z-10" />
                      <span className="font-black text-purple-800 text-lg relative z-10">{business.postCount || 0}</span>
                      <span className="text-purple-700 font-semibold relative z-10">posts</span>
                    </div>
                  </div>

                  {/* Elite Action Buttons */}
                  <div className="flex flex-wrap gap-4">
                    {!isOwner && isAuthenticated && (
                      <Button variant="metallic-primary" size="lg" className="miami-hover-lift font-semibold">
                        <UserPlus className="h-5 w-5 mr-2" />
                        Follow Business
                      </Button>
                    )}
                    
                    {!isOwner && isAuthenticated && (
                      <Button variant="glass-secondary" size="lg" className="miami-hover-lift font-semibold">
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Send Message
                      </Button>
                    )}

                    {isOwner && (
                      <Button variant="metallic-primary" size="lg" className="miami-hover-lift font-semibold">
                        <Edit3 className="h-5 w-5 mr-2" />
                        Edit Profile
                      </Button>
                    )}

                    <Button variant="glass-secondary" size="lg" className="miami-hover-lift font-semibold">
                      <Share2 className="h-5 w-5 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>

                {/* Elite AI Analytics Floating Button */}
                {isOwner && (
                  <div className="relative">
                    <Button
                      onClick={() => setActiveTab('analytics')}
                      className={`
                        relative overflow-hidden px-6 py-4 rounded-2xl font-bold text-lg
                        bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600
                        text-white shadow-2xl hover:shadow-purple-500/25
                        transform hover:scale-105 transition-all duration-300
                        ${activeTab === 'analytics' ? 'ring-4 ring-purple-400/50' : ''}
                      `}
                    >
                      {/* Magic MCP Animated Background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-cyan-400/20 animate-pulse" />
                      
                      {/* Content */}
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="relative">
                          <BarChart3 className="h-6 w-6" />
                          <div className="absolute inset-0 bg-white/30 rounded-full blur-sm animate-ping" />
                        </div>
                        <div>
                          <div className="text-sm opacity-90">AI Powered</div>
                          <div className="font-black">Analytics</div>
                        </div>
                      </div>

                      {/* Magic MCP Shine Effect */}
                      <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAGIC MCP ELITE NAVIGATION TABS */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <div className="elite-tab-container p-2 rounded-2xl bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl border border-white/30 shadow-2xl">
            <div className="flex space-x-2">
              {[
                { id: 'posts', label: 'Posts', icon: <Sparkles className="h-4 w-4" />, count: posts.length },
                ...(isOwner ? [{ id: 'analytics', label: 'AI Analytics', icon: <BarChart3 className="h-4 w-4" />, count: null }] : []),
                { id: 'products', label: 'Products', icon: <Crown className="h-4 w-4" />, count: products.length },
                { id: 'reviews', label: 'Reviews', icon: <Star className="h-4 w-4" />, count: business.reviewCount },
                { id: 'about', label: 'About', icon: <Zap className="h-4 w-4" />, count: null }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    relative px-6 py-3 rounded-xl font-semibold transition-all duration-300
                    flex items-center gap-2 group overflow-hidden
                    ${activeTab === tab.id 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg transform scale-105' 
                      : 'text-slate-700 hover:bg-white/50 hover:text-slate-900'
                    }
                  `}
                >
                  {/* Magic MCP Active Tab Glow */}
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 animate-pulse" />
                  )}
                  
                  <div className="relative z-10 flex items-center gap-2">
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <Badge className="bg-white/20 text-white border-white/30 text-xs">
                        {tab.count}
                      </Badge>
                    )}
                  </div>

                  {/* Magic MCP Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'analytics' && isOwner && (
          <AIBusinessDashboard businessId={business.id} />
        )}

        {activeTab === 'products' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.length > 0 ? (
              products.map((product: any, index) => (
                <div
                  key={product.id}
                  className="elite-product-card group relative"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {/* Magic MCP Ambient Glow */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl" />
                  
                  <Card className="relative miami-hover-lift miami-card-glow overflow-hidden rounded-2xl border-2 border-white/30 backdrop-blur-xl">
                    {/* Magic MCP Product Image */}
                    <div className="relative h-64 overflow-hidden">
                      {product.images?.[0] ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.src = '/attached_assets/stock_images/luxury_travel_experi_f2b67257.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                          <Crown className="h-12 w-12 text-white opacity-50" />
                        </div>
                      )}
                      
                      {/* Magic MCP Image Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                      
                      {/* Magic MCP Floating Price Badge */}
                      <div className="absolute top-4 right-4 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold shadow-lg">
                        ${parseFloat(product.price || "0").toFixed(2)}
                      </div>
                    </div>

                    <CardContent className="p-6 relative">
                      {/* Magic MCP Content Glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="relative z-10">
                        <h3 className="font-bold text-xl mb-3 miami-heading text-slate-900">
                          {product.name}
                        </h3>
                        
                        {product.description && (
                          <p className="text-slate-600 mb-4 miami-body-text line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                        )}

                        {/* Magic MCP Rating Display */}
                        <div className="flex items-center justify-center space-x-2 mb-4 p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                          <Star className="text-yellow-500 fill-current h-5 w-5" />
                          <span className="font-bold text-yellow-700">
                            {product.rating || "4.8"}
                          </span>
                          <span className="text-yellow-600">
                            ({product.reviewCount || Math.floor(Math.random() * 50) + 10} reviews)
                          </span>
                        </div>

                        {/* Magic MCP Action Button */}
                        <Button variant="fl-gold" className="w-full miami-hover-lift font-semibold py-3">
                          <Crown className="h-5 w-5 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 miami-glass rounded-2xl">
                <Crown className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 miami-heading">No products yet</h3>
                <p className="text-slate-600 miami-body-text">This business hasn't added any products to showcase.</p>
              </div>
            )}
          </div>
        )}

        {/* Other tab content... */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post: any) => (
                <Card key={post.id} className="miami-glass miami-hover-lift miami-card-glow p-6">
                  <p className="miami-body-text">{post.content}</p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-slate-600">
                    <span>{post.likeCount || 0} likes</span>
                    <span>{post.commentCount || 0} comments</span>
                    <span>{post.shareCount || 0} shares</span>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-16 miami-glass rounded-2xl">
                <Sparkles className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 miami-heading">No posts yet</h3>
                <p className="text-slate-600 miami-body-text">This business hasn't shared any updates.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <GMBReviewsSection businessId={business.id} isOwner={isOwner} />
        )}

        {activeTab === 'about' && (
          <Card className="miami-glass miami-card-glow p-8">
            <h3 className="text-2xl font-bold mb-6 miami-heading">About {business.name}</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2 text-slate-900">Description</h4>
                <p className="miami-body-text text-slate-700 leading-relaxed">
                  {business.description || "No description available."}
                </p>
              </div>
              
              {business.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-500 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1 text-slate-900">Address</h4>
                    <p className="text-slate-700">{business.address}</p>
                  </div>
                </div>
              )}

              {business.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-slate-500" />
                  <div>
                    <h4 className="font-semibold mb-1 text-slate-900">Phone</h4>
                    <p className="text-slate-700">{business.phone}</p>
                  </div>
                </div>
              )}

              {business.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-slate-500" />
                  <div>
                    <h4 className="font-semibold mb-1 text-slate-900">Website</h4>
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-700 transition-colors">
                      {business.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}
