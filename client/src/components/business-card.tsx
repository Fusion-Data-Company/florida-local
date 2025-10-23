import { Link } from "wouter";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Business } from "@shared/types";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge, getVerificationTier } from "@/components/ui/verified-badge";
import { CheckCircle2 } from "lucide-react";

// Professional Stock Images
import elegantRestaurant1 from "@/assets/stock_images/elegant_restaurant_f_aa323e17.jpg";
import elegantRestaurant2 from "@/assets/stock_images/elegant_restaurant_f_cc520cc1.jpg";
import elegantRestaurant3 from "@/assets/stock_images/elegant_restaurant_f_f8ca8e07.jpg";
import elegantRestaurantInterior from "@/assets/stock_images/elegant_restaurant_i_5b327bb1.jpg";
import fineDiningFood from "@/assets/stock_images/fine_dining_food_pre_6c60b0bf.jpg";
import gourmetCubanSandwich from "@/assets/stock_images/gourmet_cuban_sandwi_e0346f8d.jpg";

import luxurySpaWellness1 from "@/assets/stock_images/luxury_spa_wellness__78221b18.jpg";
import luxurySpaWellness2 from "@/assets/stock_images/luxury_spa_wellness__9285aa1d.jpg";
import luxuryWellnessSpa1 from "@/assets/stock_images/luxury_wellness_spa__482737df.jpg";
import luxuryWellnessSpa2 from "@/assets/stock_images/luxury_wellness_spa__8f194a3c.jpg";
import sunsetYogaStudio from "@/assets/stock_images/sunset_yoga_studio_p_c38ab4c1.jpg";
import yogaMeditation1 from "@/assets/stock_images/yoga_meditation_peac_cbdd7863.jpg";
import yogaMeditation2 from "@/assets/stock_images/yoga_meditation_peac_dd325b82.jpg";
import yogaMeditationWell from "@/assets/stock_images/yoga_meditation_well_a72e6325.jpg";

import beachWeddingCeremony1 from "@/assets/stock_images/beach_wedding_ceremo_313889d0.jpg";
import beachWeddingCeremony2 from "@/assets/stock_images/beach_wedding_ceremo_59009157.jpg";
import beachWeddingCeremony3 from "@/assets/stock_images/beach_wedding_ceremo_b81563df.jpg";
import elegantWeddingDecor from "@/assets/stock_images/elegant_wedding_deco_caf9a8bc.jpg";

import artisanCeramicPottery from "@/assets/stock_images/artisan_ceramic_pott_6f7a6640.jpg";
import luxuryTravelExperience from "@/assets/stock_images/luxury_travel_experi_f2b67257.jpg";
import modernLuxuryHotel from "@/assets/stock_images/modern_luxury_hotel__f6015919.jpg";
import premiumBrandIdentity from "@/assets/stock_images/premium_brand_identi_88f6d862.jpg";
import premiumPhotography from "@/assets/stock_images/premium_photography__509b059a.jpg";
import professionalPhotography1 from "@/assets/stock_images/professional_photogr_7ec7b11b.jpg";
import professionalPhotography2 from "@/assets/stock_images/professional_photogr_afdb1a59.jpg";
import professionalPhotography3 from "@/assets/stock_images/professional_photogr_d7e01cb5.jpg";

interface BusinessCardProps {
  business: Business;
  spotlightType?: 'daily' | 'weekly' | 'monthly';
  spotlightPosition?: number;
}

// Professional Image Mapping System
const getCategoryImage = (business: Business): string => {
  const category = business.category?.toLowerCase() || '';
  const tags = ((business as any).tags as string[]) || [];
  const name = business.name?.toLowerCase() || '';
  const description = business.description?.toLowerCase() || '';
  
  // Restaurant & Food Categories
  if (category.includes('restaurant') || category.includes('food') || category.includes('dining') ||
      tags.some(tag => ['restaurant', 'food', 'dining', 'culinary', 'cuisine', 'chef'].includes(tag.toLowerCase())) ||
      name.includes('restaurant') || name.includes('kitchen') || name.includes('bistro') ||
      description.includes('food') || description.includes('dining') || description.includes('restaurant')) {
    const restaurantImages = [elegantRestaurant1, elegantRestaurant2, elegantRestaurant3, elegantRestaurantInterior, fineDiningFood, gourmetCubanSandwich];
    return restaurantImages[Math.floor(Math.random() * restaurantImages.length)];
  }
  
  // Wellness & Spa Categories
  if (category.includes('wellness') || category.includes('spa') || category.includes('health') || category.includes('fitness') ||
      tags.some(tag => ['wellness', 'spa', 'massage', 'yoga', 'meditation', 'health', 'fitness', 'beauty'].includes(tag.toLowerCase())) ||
      name.includes('spa') || name.includes('wellness') || name.includes('yoga') || name.includes('fitness') ||
      description.includes('wellness') || description.includes('spa') || description.includes('massage')) {
    const wellnessImages = [luxurySpaWellness1, luxurySpaWellness2, luxuryWellnessSpa1, luxuryWellnessSpa2, sunsetYogaStudio, yogaMeditation1, yogaMeditation2, yogaMeditationWell];
    return wellnessImages[Math.floor(Math.random() * wellnessImages.length)];
  }
  
  // Wedding & Event Planning
  if (category.includes('wedding') || category.includes('event') || category.includes('planning') ||
      tags.some(tag => ['wedding', 'event', 'planning', 'ceremony', 'celebration', 'party'].includes(tag.toLowerCase())) ||
      name.includes('wedding') || name.includes('event') || name.includes('planner') ||
      description.includes('wedding') || description.includes('event') || description.includes('ceremony')) {
    const weddingImages = [beachWeddingCeremony1, beachWeddingCeremony2, beachWeddingCeremony3, elegantWeddingDecor];
    return weddingImages[Math.floor(Math.random() * weddingImages.length)];
  }
  
  // Photography & Creative Services
  if (category.includes('photography') || category.includes('creative') || category.includes('art') ||
      tags.some(tag => ['photography', 'photographer', 'creative', 'art', 'design', 'visual'].includes(tag.toLowerCase())) ||
      name.includes('photo') || name.includes('creative') || name.includes('studio') ||
      description.includes('photography') || description.includes('creative') || description.includes('photo')) {
    const photographyImages = [professionalPhotography1, professionalPhotography2, professionalPhotography3, premiumPhotography];
    return photographyImages[Math.floor(Math.random() * photographyImages.length)];
  }
  
  // Hospitality & Travel
  if (category.includes('hotel') || category.includes('travel') || category.includes('hospitality') ||
      tags.some(tag => ['hotel', 'travel', 'hospitality', 'accommodation', 'tourism'].includes(tag.toLowerCase())) ||
      name.includes('hotel') || name.includes('resort') || name.includes('travel') ||
      description.includes('hotel') || description.includes('travel') || description.includes('accommodation')) {
    return modernLuxuryHotel;
  }
  
  // Arts & Crafts
  if (category.includes('art') || category.includes('craft') || category.includes('handmade') ||
      tags.some(tag => ['art', 'craft', 'handmade', 'artisan', 'pottery', 'ceramic'].includes(tag.toLowerCase())) ||
      name.includes('art') || name.includes('craft') || name.includes('studio') ||
      description.includes('handmade') || description.includes('artisan') || description.includes('craft')) {
    return artisanCeramicPottery;
  }
  
  // Premium/Luxury Default
  const premiumDefaults = [luxuryTravelExperience, premiumBrandIdentity, elegantRestaurant1, luxuryWellnessSpa1];
  return premiumDefaults[Math.floor(Math.random() * premiumDefaults.length)];
};

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
        1: { icon: "fas fa-trophy", text: "Daily #1", className: "metallic shadow-md" },
        2: { icon: "fas fa-star", text: "Daily #2", className: "glass-panel border-primary/50 shadow-sm" },
        3: { icon: "fas fa-fire", text: "Daily #3", className: "glass-panel border-accent/50 shadow-sm" },
      },
      weekly: {
        1: { icon: "fas fa-crown", text: "Weekly #1", className: "metallic shadow-md" },
        2: { icon: "fas fa-medal", text: "Weekly #2", className: "glass-panel border-secondary/50 shadow-sm" },
        3: { icon: "fas fa-award", text: "Weekly #3", className: "glass-panel border-accent/50 shadow-sm" },
        4: { icon: "fas fa-star", text: "Weekly #4", className: "glass-panel border-primary/50 shadow-sm" },
        5: { icon: "fas fa-thumbs-up", text: "Weekly #5", className: "glass-panel border-accent/50 shadow-sm" },
      },
      monthly: {
        1: { icon: "fas fa-gem", text: "Monthly Winner", className: "metallic shadow-md" },
      },
    };

    const badge = badges[spotlightType]?.[spotlightPosition as keyof typeof badges[typeof spotlightType]];
    if (!badge) return null;

    return (
      <Badge className={`${badge.className} font-bold text-sm px-3 py-2 rounded-xl border-2`}>
        <i className={`${badge.icon} mr-2`}></i> {badge.text}
      </Badge>
    );
  };

  return (
    <div className={`group relative cursor-pointer ${ 
      spotlightType === 'daily' && spotlightPosition === 1 ? 'ring-4 ring-secondary/30 ring-offset-4 ring-offset-background' : ''
    }`}>
      
      {/* Premium Luxury Card Container with Marble & Metallic Border */}
      <div className="business-card-luxury">
        
        {/* Premium Business Image with Enhanced Presentation */}
        <div className="business-card-image-wrapper business-card-content">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{
              backgroundImage: `url(${business.coverImageUrl || getCategoryImage(business)})`,
              filter: 'contrast(1.08) saturate(1.2) brightness(1.05)'
            }}
          />
          
          {/* Subtle Elite Overlays - Images Clear & Visible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/12 via-transparent to-transparent opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-secondary/6 mix-blend-soft-light"></div>
          
          {/* Metallic Border Frame on Hover */}
          <div className="business-card-image-frame"></div>
          
          {/* Enhanced Badge Positioning */}
          <div className="absolute top-5 left-5 z-30 transform transition-transform duration-400 group-hover:scale-105">
            {getSpotlightBadge()}
          </div>
          
          {/* Luxury Rating Display */}
          <div className="absolute bottom-5 right-5 z-30">
            {business.rating && parseFloat(business.rating) > 0 && (
              <div className="luxury-badge-container flex items-center gap-2">
                <i className="fas fa-star text-secondary text-base"></i>
                <span className="text-slate-900 font-black text-base">{parseFloat(business.rating).toFixed(1)}</span>
              </div>
            )}
          </div>
          
          {/* Premium Shimmer Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-1200">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-[-120%] group-hover:translate-x-[420%] transition-transform duration-1200 ease-out"></div>
          </div>
        </div>

        {/* Luxury Content Area */}
        <div className="p-8 relative business-card-content">
          
          {/* Premium Header Section */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="business-name-luxury text-3xl">
                  {business.name}
                </h3>
                {getVerificationTier({
                  gmbConnected: business.gmbConnected,
                  averageRating: business.rating ? parseFloat(business.rating) : undefined,
                  totalReviews: business.reviewCount,
                  monthlyEngagement: (business.followerCount || 0) + (business.postCount || 0) * 10,
                  isSpotlightFeatured: business.isVerified
                }) && (
                  <VerifiedBadge
                    type={getVerificationTier({
                      gmbConnected: business.gmbConnected,
                      averageRating: business.rating ? parseFloat(business.rating) : undefined,
                      totalReviews: business.reviewCount,
                      monthlyEngagement: (business.followerCount || 0) + (business.postCount || 0) * 10,
                      isSpotlightFeatured: business.isVerified
                    })!}
                    size="sm"
                    showLabel
                  />
                )}
              </div>
              {business.tagline && (
                <p className="text-sm text-primary font-semibold uppercase tracking-wide opacity-80 mb-2">
                  {business.tagline}
                </p>
              )}
              <div className="h-0.5 w-14 bg-gradient-to-r from-secondary via-primary to-transparent rounded-full opacity-70 group-hover:w-20 transition-all duration-400"></div>
            </div>

            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className={`relative p-3 rounded-xl transition-all duration-400 hover:scale-110 info-badge-glass ${ 
                  isFollowing 
                    ? "text-accent border-accent/30" 
                    : "text-muted-foreground hover:text-accent"
                }`}
                data-testid={`button-follow-${business.id}`}
              >
                <i className={`${isFollowing ? "fas fa-heart" : "far fa-heart"} text-lg transition-all duration-400 ${ 
                  isFollowing ? 'text-accent' : ''
                }`}></i>
              </Button>
            )}
          </div>

          {/* Refined Description */}
          <p className="text-muted-foreground mb-6 line-clamp-2 leading-relaxed text-base font-light">
            {business.description || "A distinguished local business serving Florida's most discerning clientele with exceptional quality and unparalleled service."}
          </p>

          {/* Premium Location Display */}
          <div className="flex items-center text-sm text-muted-foreground mb-6 info-badge-glass">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-secondary/90 to-secondary/70 mr-3 shadow-md">
              <i className="fas fa-map-marker-alt text-white text-xs"></i>
            </div>
            <span className="font-semibold">{business.location || "Miami, Florida"}</span>
          </div>

          {/* Luxury Business Stats */}
          <div className="flex justify-between text-sm mb-6 gap-2">
            <div className="flex-1 text-center group">
              <div className="stat-card-glass">
                <div className="font-black text-slate-900 text-2xl mb-1">
                  {business.followerCount || 0}
                </div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">Followers</div>
              </div>
            </div>
            <div className="flex-1 text-center group">
              <div className="stat-card-glass">
                <div className="font-black text-slate-900 text-2xl mb-1">
                  {business.postCount || 0}
                </div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">Posts</div>
              </div>
            </div>
            <div className="flex-1 text-center group">
              <div className="stat-card-glass">
                <div className="font-black text-slate-900 text-2xl mb-1">
                  {0}
                </div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide font-semibold">Products</div>
              </div>
            </div>
          </div>

          {/* Luxury Action Buttons */}
          <div className="flex gap-3">
            <Link href={`/business/${business.id}`} className="flex-1">
              <Button 
                className="btn-luxury-action w-full h-14 text-base font-bold relative overflow-hidden"
                data-testid={`button-view-profile-${business.id}`}
              >
                <span className="relative z-10 tracking-wide">View Profile</span>
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:left-full transition-all duration-700 ease-out"></div>
              </Button>
            </Link>
            {isAuthenticated && (
              <Button 
                variant="outline" 
                className="btn-glass-secondary px-6 h-14"
                data-testid={`button-message-${business.id}`}
              >
                <i className="fas fa-comment text-lg transition-all duration-400"></i>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}