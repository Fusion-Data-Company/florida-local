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
        1: { icon: "fas fa-trophy", text: "Daily #1", className: "bg-primary text-primary-foreground" },
        2: { icon: "fas fa-star", text: "Daily #2", className: "bg-secondary text-secondary-foreground" },
        3: { icon: "fas fa-fire", text: "Daily #3", className: "bg-accent text-accent-foreground" },
      },
      weekly: {
        1: { icon: "fas fa-crown", text: "Weekly #1", className: "bg-yellow-500 text-white" },
        2: { icon: "fas fa-medal", text: "Weekly #2", className: "bg-gray-400 text-white" },
        3: { icon: "fas fa-award", text: "Weekly #3", className: "bg-orange-500 text-white" },
        4: { icon: "fas fa-star", text: "Weekly #4", className: "bg-blue-500 text-white" },
        5: { icon: "fas fa-thumbs-up", text: "Weekly #5", className: "bg-green-500 text-white" },
      },
      monthly: {
        1: { icon: "fas fa-gem", text: "Monthly Winner", className: "bg-purple-600 text-white" },
      },
    };

    const badge = badges[spotlightType]?.[spotlightPosition as keyof typeof badges[typeof spotlightType]];
    if (!badge) return null;

    return (
      <Badge className={badge.className}>
        <i className={`${badge.icon} mr-1`}></i> {badge.text}
      </Badge>
    );
  };

  return (
    <div className={`bg-card rounded-xl overflow-hidden shadow-lg border border-border hover-lift ${
      spotlightType === 'daily' && spotlightPosition === 1 ? 'spotlight-glow' : ''
    }`}>
      {/* Business Image */}
      <div 
        className="h-48 bg-cover bg-center relative"
        style={{
          backgroundImage: business.coverImageUrl 
            ? `url(${business.coverImageUrl})` 
            : 'linear-gradient(135deg, hsl(198 93% 60%) 0%, hsl(25 75% 47%) 100%)'
        }}
      >
        <div className="absolute top-4 left-4">
          {getSpotlightBadge()}
        </div>
        <div className="absolute bottom-4 right-4">
          {business.rating && parseFloat(business.rating) > 0 && (
            <div className="bg-black/50 text-white px-2 py-1 rounded-md text-sm">
              <i className="fas fa-star text-yellow-400 mr-1"></i>
              {parseFloat(business.rating).toFixed(1)}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold">{business.name}</h3>
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isPending}
              className={isFollowing ? "text-accent" : "text-muted-foreground hover:text-accent"}
              data-testid={`button-follow-${business.id}`}
            >
              <i className={isFollowing ? "fas fa-heart" : "far fa-heart"}></i>
            </Button>
          )}
        </div>
        
        <p className="text-muted-foreground mb-4 line-clamp-3">
          {business.description || business.tagline || "A local business serving the community."}
        </p>
        
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <i className="fas fa-map-marker-alt mr-2 text-secondary"></i>
          <span>{business.location || "Florida"}</span>
        </div>
        
        {/* Business Stats */}
        <div className="flex justify-between text-sm mb-4">
          <div className="text-center">
            <div className="font-bold text-primary">{business.followerCount || 0}</div>
            <div className="text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-secondary">{business.postCount || 0}</div>
            <div className="text-muted-foreground">Posts</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-accent">{0}</div>
            <div className="text-muted-foreground">Products</div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link href={`/business/${business.id}`} className="flex-1">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-all" data-testid={`button-view-profile-${business.id}`}>
              View Profile
            </Button>
          </Link>
          {isAuthenticated && (
            <Button 
              variant="outline" 
              size="sm" 
              className="px-3"
              data-testid={`button-message-${business.id}`}
            >
              <i className="fas fa-comment"></i>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
