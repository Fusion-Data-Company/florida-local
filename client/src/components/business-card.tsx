import { Link } from "wouter";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Business } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BusinessCardProps {
  business: Business;
  spotlightType?: 'daily' | 'weekly' | 'monthly';
  spotlightPosition?: number;
}

export default function BusinessCard({ business, spotlightType, spotlightPosition }: BusinessCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await apiRequest('DELETE', `/api/businesses/${business.id}/follow`);
      } else {
        await apiRequest('POST', `/api/businesses/${business.id}/follow`);
      }
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
      queryClient.invalidateQueries({ queryKey: ['/api/businesses/spotlight'] });
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing 
          ? `You unfollowed ${business.name}` 
          : `You are now following ${business.name}`,
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
        description: "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  const getSpotlightBadge = () => {
    if (!spotlightType || !spotlightPosition) return null;

    const badges = {
      daily: {
        1: { icon: "fas fa-trophy", text: "Daily #1", className: "metallic glow-secondary neon-glow" },
        2: { icon: "fas fa-star", text: "Daily #2", className: "glass-panel border-primary/50 glow-primary" },
        3: { icon: "fas fa-fire", text: "Daily #3", className: "glass-panel border-accent/50 glow-accent" },
      },
      weekly: {
        1: { icon: "fas fa-crown", text: "Weekly #1", className: "metallic glow-secondary neon-glow" },
        2: { icon: "fas fa-medal", text: "Weekly #2", className: "glass-panel border-secondary/50 glow-secondary" },
        3: { icon: "fas fa-award", text: "Weekly #3", className: "glass-panel border-accent/50 glow-accent" },
        4: { icon: "fas fa-star", text: "Weekly #4", className: "glass-panel border-primary/50 glow-primary" },
        5: { icon: "fas fa-thumbs-up", text: "Weekly #5", className: "glass-panel border-accent/50 glow-accent" },
      },
      monthly: {
        1: { icon: "fas fa-gem", text: "Monthly Winner", className: "metallic glow-secondary neon-glow" },
      },
    };

    const badge = badges[spotlightType]?.[spotlightPosition as keyof typeof badges[typeof spotlightType]];
    if (!badge) return null;

    return (
      <Badge className={`${badge.className} font-semibold`}>
        <i className={`${badge.icon} mr-1`}></i> {badge.text}
      </Badge>
    );
  };

  return (
    <div className={`glass-panel rounded-2xl overflow-hidden hover-lift card-rim-light ambient-particles transition-all duration-500 ${
      spotlightType === 'daily' && spotlightPosition === 1 ? 'spotlight-glow' : ''
    }`}>
      {/* Business Image */}
      <div 
        className="h-48 bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: business.coverImageUrl 
            ? `url(${business.coverImageUrl})` 
            : 'linear-gradient(135deg, hsl(198 93% 60%) 0%, hsl(25 75% 47%) 100%)'
        }}
      >
        {/* Luxury Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
        
        <div className="absolute top-4 left-4 z-10">
          {getSpotlightBadge()}
        </div>
        <div className="absolute bottom-4 right-4 z-10">
          {business.rating && parseFloat(business.rating) > 0 && (
            <div className="glass-panel text-foreground px-3 py-2 rounded-lg text-sm font-medium border border-border/20">
              <i className="fas fa-star text-secondary mr-1 glow-secondary"></i>
              <span className="gradient-text-gold">{parseFloat(business.rating).toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-luxury gradient-text-gold font-serif">{business.name}</h3>
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isPending}
              className={`hover-lift btn-press relative group ${
                isFollowing ? "text-accent neon-glow" : "text-muted-foreground hover:text-accent"
              }`}
              data-testid={`button-follow-${business.id}`}
            >
              <i className={`${isFollowing ? "fas fa-heart" : "far fa-heart"} transition-transform duration-300 group-hover:scale-110`}></i>
              {isFollowing && <div className="absolute inset-0 bg-accent/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>}
            </Button>
          )}
        </div>
        
        <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed text-sm">
          {business.description || business.tagline || "A premium local business serving Florida's discerning community."}
        </p>
        
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <i className="fas fa-map-marker-alt mr-2 text-secondary glow-secondary"></i>
          <span className="text-luxury">{business.location || "Miami, Florida"}</span>
        </div>
        
        {/* Business Stats */}
        <div className="flex justify-between text-sm mb-6">
          <div className="text-center group">
            <div className="font-bold text-primary text-lg gradient-text-cyan">{business.followerCount || 0}</div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Followers</div>
          </div>
          <div className="text-center group">
            <div className="font-bold text-secondary text-lg gradient-text-gold">{business.postCount || 0}</div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Posts</div>
          </div>
          <div className="text-center group">
            <div className="font-bold text-accent text-lg gradient-text-magenta">{0}</div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">Products</div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Link href={`/business/${business.id}`} className="flex-1">
            <Button className="w-full metallic hover-lift btn-press text-sm font-semibold transition-all duration-300 group relative overflow-hidden" data-testid={`button-view-profile-${business.id}`}>
              <span className="relative z-10">View Profile</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
          </Link>
          {isAuthenticated && (
            <Button 
              variant="outline" 
              size="sm" 
              className="px-4 glass-panel border-border/30 hover:border-primary/50 transition-all duration-300 hover-lift btn-press group relative"
              data-testid={`button-message-${business.id}`}
            >
              <i className="fas fa-comment group-hover:text-primary transition-colors duration-300"></i>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}