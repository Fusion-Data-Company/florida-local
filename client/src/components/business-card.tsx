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
    <div className={`group relative transition-all duration-700 transform hover:scale-[1.02] hover:-translate-y-6 card-rim-light shadow-luxury-multi ${ 
      spotlightType === 'daily' && spotlightPosition === 1 ? 'ring-4 ring-secondary/30 ring-offset-4 ring-offset-background' : ''
    } cursor-pointer`}
    style={{
      filter: 'drop-shadow(0 25px 60px rgba(0,0,0,0.15)) drop-shadow(0 0 0 rgba(0,0,0,0))'
    }}>
      
      {/* Fortune 500-Level Card Container */}
      <div className="relative rounded-[2rem] overflow-hidden shadow-2xl hover:shadow-[0_50px_100px_rgba(0,0,0,0.2)] transition-all duration-700"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
          backdropFilter: 'blur(30px) saturate(200%)',
          border: '3px solid rgba(255,255,255,0.3)',
          boxShadow: `
            0 32px 64px rgba(0,0,0,0.12),
            inset 0 1px 0 rgba(255,255,255,1),
            inset 0 -1px 0 rgba(0,0,0,0.05),
            0 0 0 1px rgba(255,255,255,0.1)
          `
        }}>
        
        {/* Premium Business Image with Enhanced Presentation */}
        <div className="relative h-64 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-115"
            style={{
              backgroundImage: `url(${business.coverImageUrl || getCategoryImage(business)})`,
              filter: 'contrast(1.1) saturate(1.25) brightness(1.1)'
            }}
          />
          
          {/* Miami Elite Light Overlays - Images Actually Visible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-black/5 to-transparent opacity-40"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-orange-400/12 mix-blend-soft-light"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/8 via-transparent to-cyan-400/6 mix-blend-overlay"></div>
          
          {/* Miami Luxury Frame Effect */}
          <div className="absolute inset-2 border-2 border-white/30 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 shadow-lg"></div>
          <div className="absolute inset-1 border border-cyan-400/40 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-80 transition-opacity duration-500"></div>
          
          {/* Luxury Noise Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}>
          </div>

          {/* Enhanced Badge Positioning */}
          <div className="absolute top-6 left-6 z-30 transform group-hover:scale-110 transition-transform duration-500">
            {getSpotlightBadge()}
          </div>
          
          {/* Sophisticated Rating Display */}
          <div className="absolute bottom-6 right-6 z-30 transform group-hover:scale-110 transition-transform duration-500">
            {business.rating && parseFloat(business.rating) > 0 && (
              <div className="relative px-4 py-3 rounded-2xl text-sm font-bold border-2 border-slate-200 shadow-lg backdrop-blur-25"
                   style={{
                     background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.90) 100%)',
                     boxShadow: '0 12px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,1)'
                   }}>
                <i className="fas fa-star text-secondary mr-2"></i>
                <span className="text-slate-900 font-black text-base">{parseFloat(business.rating).toFixed(1)}</span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-secondary/15 to-primary/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            )}
          </div>
          
          {/* Premium Shimmer Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-1200">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-[-120%] group-hover:translate-x-[420%] transition-transform duration-1200 ease-out"></div>
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div className="p-10 relative bg-gradient-to-b from-transparent to-white/40">
          
          {/* Fortune 500 Header Section */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1 pr-6">
              <h3 className="text-3xl font-black text-slate-900 font-serif leading-tight mb-3 group-hover:scale-105 transition-transform duration-500">
                {business.name}
              </h3>
              {business.tagline && (
                <p className="text-base text-primary font-bold uppercase tracking-wider opacity-90 mb-2">
                  {business.tagline}
                </p>
              )}
              <div className="h-1 w-16 bg-gradient-to-r from-secondary to-primary rounded-full opacity-60 group-hover:w-24 transition-all duration-500"></div>
            </div>

            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className={`relative p-4 rounded-2xl border-3 transition-all duration-500 hover:scale-115 hover:-translate-y-2 shadow-lg hover:shadow-2xl ${ 
                  isFollowing 
                    ? "text-accent border-accent/40 shadow-accent/20" 
                    : "text-muted-foreground hover:text-accent border-border/25 hover:border-accent/40"
                }`}
                style={{
                  background: isFollowing 
                    ? 'linear-gradient(135deg, rgba(255,20,147,0.15) 0%, rgba(255,20,147,0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                  backdropFilter: 'blur(25px)'
                }}
                data-testid={`button-follow-${business.id}`}
              >
                <i className={`${isFollowing ? "fas fa-heart" : "far fa-heart"} text-xl transition-all duration-500 ${ 
                  isFollowing ? 'animate-pulse text-accent scale-110' : 'group-hover:scale-125'
                }`}></i>
                {isFollowing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/25 to-primary/25 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                )}
              </Button>
            )}
          </div>

          {/* Enhanced Description */}
          <p className="text-muted-foreground mb-8 line-clamp-3 leading-relaxed text-lg font-light tracking-wide">
            {business.description || "A distinguished local business serving Florida's most discerning clientele with exceptional quality and unparalleled service."}
          </p>

          {/* Premium Location Display */}
          <div className="flex items-center text-base text-muted-foreground mb-10 p-4 rounded-2xl border-2 border-border/25"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.4) 100%)',
              backdropFilter: 'blur(15px)'
            }}>
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-secondary/70 mr-4 shadow-xl">
              <i className="fas fa-map-marker-alt text-secondary-foreground text-sm"></i>
            </div>
            <span className="text-luxury font-semibold text-lg">{business.location || "Miami, Florida"}</span>
          </div>

          {/* Fortune 500-Level Business Stats */}
          <div className="flex justify-between text-sm mb-10 gap-3">
            <div className="flex-1 text-center group relative">
              <div className="p-6 rounded-2xl border-2 border-border/25 transition-all duration-500 hover:scale-110 hover:shadow-xl hover:-translate-y-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
                  backdropFilter: 'blur(20px)'
                }}>
                <div className="font-black text-slate-900 text-3xl mb-2 group-hover:scale-115 transition-transform duration-500">
                  {business.followerCount || 0}
                </div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Followers</div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
            <div className="flex-1 text-center group relative mx-3">
              <div className="p-6 rounded-2xl border-2 border-border/25 transition-all duration-500 hover:scale-110 hover:shadow-xl hover:-translate-y-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
                  backdropFilter: 'blur(20px)'
                }}>
                <div className="font-black text-slate-900 text-3xl mb-2 group-hover:scale-115 transition-transform duration-500">
                  {business.postCount || 0}
                </div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Posts</div>
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/8 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
            <div className="flex-1 text-center group relative">
              <div className="p-6 rounded-2xl border-2 border-border/25 transition-all duration-500 hover:scale-110 hover:shadow-xl hover:-translate-y-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
                  backdropFilter: 'blur(20px)'
                }}>
                <div className="font-black text-slate-900 text-3xl mb-2 group-hover:scale-115 transition-transform duration-500">
                  {0}
                </div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Products</div>
                <div className="absolute inset-0 bg-gradient-to-br from-accent/8 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
          </div>

          {/* Premium Action Buttons */}
          <div className="flex gap-5">
            <Link href={`/business/${business.id}`} className="flex-1">
              <Button 
                className="w-full h-16 text-lg font-black relative overflow-hidden rounded-2xl transition-all duration-700 hover:scale-105 hover:-translate-y-2 shadow-xl hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, hsl(45, 95%, 72%) 0%, hsl(45, 85%, 65%) 25%, hsl(45, 95%, 75%) 50%, hsl(45, 85%, 60%) 75%, hsl(45, 95%, 70%) 100%)',
                  boxShadow: '0 12px 35px rgba(45, 80, 45, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.95)'
                }}
                data-testid={`button-view-profile-${business.id}`}
              >
                <span className="relative z-10 text-white drop-shadow-sm tracking-wide">View Profile</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-accent/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                {/* Enhanced metallic shine effect */}
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000 ease-out"></div>
              </Button>
            </Link>
            {isAuthenticated && (
              <Button 
                variant="outline" 
                className="px-8 h-16 border-3 border-border/40 hover:border-primary/70 transition-all duration-700 hover:scale-105 hover:-translate-y-2 rounded-2xl group relative overflow-hidden shadow-xl hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)',
                  backdropFilter: 'blur(25px)'
                }}
                data-testid={`button-message-${business.id}`}
              >
                <i className="fas fa-comment text-xl group-hover:text-primary transition-all duration-500 group-hover:scale-115"></i>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl"></div>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}