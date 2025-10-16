import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Business } from "@shared/types";
import BusinessCard from "./business-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Heart, Trophy, TrendingUp, Calendar } from "lucide-react";
import GlowHero from "@/components/ui/glow-hero";
import { LiquidGlassHeaderCard, GlassFilter } from "@/components/ui/liquid-glass";

export default function SpotlightShowcase() {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showVoting, setShowVoting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: spotlights, isLoading, refetch } = useQuery<{daily: Business[], weekly: Business[], monthly: Business[]}>({
    queryKey: ['/api/businesses/spotlight'],
  });

  // Get eligible businesses for monthly voting
  const { data: eligibleBusinesses } = useQuery<Business[]>({
    queryKey: ['/api/spotlight/eligible/monthly'],
    enabled: showVoting && activeTab === 'monthly',
  });

  // Get current month vote counts
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: voteCounts } = useQuery<Array<{ businessId: string, voteCount: number }>>({
    queryKey: ['/api/spotlight/votes', currentMonth],
    enabled: showVoting && activeTab === 'monthly',
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (businessId: string) => 
      apiRequest('POST', '/api/spotlight/vote', { businessId }),
    onSuccess: () => {
      toast({
        title: "Vote Recorded!",
        description: "Your vote for the monthly spotlight has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/spotlight/votes', currentMonth] });
    },
    onError: (error: any) => {
      toast({
        title: "Vote Failed",
        description: error.message || "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const activeBusinesses = spotlights?.[activeTab] || [];

  const getSpotlightDescription = () => {
    switch (activeTab) {
      case 'daily':
        return 'Updated every 24 hours using our AI algorithm (30% engagement + 25% recency + 20% reviews + 15% growth + 10% community)';
      case 'weekly':
        return 'Updated weekly with merit-based selection ensuring category diversity and regional representation';
      case 'monthly':
        return 'Selected through community voting (70%) combined with admin curation (30%) for exceptional businesses';
      default:
        return '';
    }
  };

  const handleVote = async (businessId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to vote for the monthly spotlight.",
        variant: "destructive",
      });
      return;
    }
    await voteMutation.mutateAsync(businessId);
  };

  return (
    <section className="py-12 lg:py-20 relative overflow-hidden spotlight-section gradient-shift">
      {/* Glass Filter for Liquid Glass Effect */}
      <GlassFilter />

      {/* Floating Gradient Orbs - Limited to 2 for performance */}
      <div className="absolute top-10 right-20 w-96 h-96 gradient-iridescent float-dynamic rounded-full opacity-[0.08] blur-3xl will-change-transform premium-pop stagger-1"></div>
      <div className="absolute bottom-10 left-20 w-80 h-80 gradient-iridescent float-gentle rounded-full opacity-[0.08] blur-3xl will-change-transform premium-pop stagger-2"></div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header - LIQUID GLASS CARD */}
        <div className="text-center mb-16 entrance-fade-up">
          <div className="max-w-4xl mx-auto mb-8">
            <LiquidGlassHeaderCard
              title="Community Spotlight"
              subtitle="Celebrating the businesses that make Florida communities thrive. Discover featured entrepreneurs selected by our intelligent promotion algorithms."
            />
          </div>
          <div className="mt-8 flex justify-center gap-4 entrance-scale-fade stagger-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="metallic-chrome flex items-center gap-2 shine-sweep-hover metallic-button-press group border-white/50 hover:shadow-lg"
              data-testid="button-refresh-spotlight"
            >
              <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform duration-300 text-gray-900" />
              <span className="relative z-10 text-gray-900">Refresh Spotlights</span>
            </Button>
            {activeTab === 'monthly' && (
              <Button
                onClick={() => setShowVoting(!showVoting)}
                className={`flex items-center gap-2 metallic-button-press group transition-all duration-300 ${
                  showVoting ? 'metallic-teal text-white' : 'metallic-chrome text-gray-900'
                } shine-sweep-hover`}
                data-testid="button-toggle-voting"
              >
                <Heart className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10">{showVoting ? 'Hide Voting' : 'Vote for Monthly'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Spotlight Tabs - FUTURISTIC METALLIC */}
        <div className="flex justify-center mb-8">
          <div className="glass-card-futuristic rounded-2xl p-2 inline-flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setActiveTab('daily')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-400 group relative overflow-hidden ${
                activeTab === 'daily' ? 'futuristic-tab active metallic-chrome' : 'futuristic-tab'
              }`}
              data-testid="tab-daily-spotlight"
            >
              <Trophy className={`w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300 ${activeTab === 'daily' ? 'text-gray-900' : 'text-gray-700'}`} />
              <span className={`relative z-10 ${activeTab === 'daily' ? 'text-gray-900' : 'text-gray-700'}`}>Daily</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab('weekly')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-400 group relative overflow-hidden ${
                activeTab === 'weekly' ? 'futuristic-tab active metallic-chrome' : 'futuristic-tab'
              }`}
              data-testid="tab-weekly-spotlight"
            >
              <Calendar className={`w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300 ${activeTab === 'weekly' ? 'text-gray-900' : 'text-gray-700'}`} />
              <span className={`relative z-10 ${activeTab === 'weekly' ? 'text-gray-900' : 'text-gray-700'}`}>Weekly</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab('monthly')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-400 group relative overflow-hidden ${
                activeTab === 'monthly' ? 'futuristic-tab active metallic-chrome' : 'futuristic-tab'
              }`}
              data-testid="tab-monthly-spotlight"
            >
              <Heart className={`w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300 ${activeTab === 'monthly' ? 'text-gray-900' : 'text-gray-700'}`} />
              <span className={`relative z-10 ${activeTab === 'monthly' ? 'text-gray-900' : 'text-gray-700'}`}>Monthly</span>
            </Button>
          </div>
        </div>

        {/* Algorithm Description */}
        <div className="text-center mb-8">
          <Badge className="glass-panel border-border/30 px-6 py-3 text-sm font-medium text-luxury">
            {getSpotlightDescription()}
          </Badge>
        </div>

        {/* Spotlight Grid - ELITE LUXURY */}
        <div className="relative rounded-3xl p-8 mb-16 spotlight-grid-container">
          <div className="relative z-10 grid md:grid-cols-3 gap-8">
          {isLoading ? (
            // Loading skeletons with luxury styling
            [...Array(activeTab === 'daily' ? 3 : activeTab === 'weekly' ? 5 : 1)].map((_, i) => (
              <div key={i} className="glass-panel rounded-2xl overflow-hidden card-rim-light transform-3d-float">
                <Skeleton className="h-48 w-full gradient-iridescent" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4 gradient-iridescent" />
                  <Skeleton className="h-4 w-full gradient-iridescent" />
                  <Skeleton className="h-4 w-2/3 gradient-iridescent" />
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-16 gradient-iridescent" />
                    <Skeleton className="h-8 w-16 gradient-iridescent" />
                    <Skeleton className="h-8 w-16 gradient-iridescent" />
                  </div>
                </div>
              </div>
            ))
          ) : activeBusinesses.length > 0 ? (
            activeBusinesses.map((business: Business, index: number) => (
              <div key={business.id} className="transform-3d-float">
                <BusinessCard 
                  business={business} 
                  spotlightType={activeTab}
                  spotlightPosition={index + 1}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full spotlight-empty-state">
              <div className="relative z-10 text-center">
                <div className="relative inline-block mb-6">
                  <i className="fas fa-star text-6xl spotlight-empty-icon"></i>
                </div>
                <h3 className="text-2xl font-bold mb-4 spotlight-empty-title text-white" style={{textShadow: '0 2px 6px rgba(0,0,0,0.35)'}}>No spotlight businesses yet</h3>
                <p className="text-white max-w-md mx-auto" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
                  Check back soon to see featured businesses in this category.
                </p>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Monthly Voting Interface - ELITE LUXURY */}
        {showVoting && activeTab === 'monthly' && (
          <div className="mt-16 relative backdrop-elite rounded-3xl p-8 card-rim-light voting-section-container">
            <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <h3 className="text-3xl font-bold flex items-center justify-center gap-3 gradient-text text-luxury font-serif filter-luxury-glow">
                  <Heart className="w-8 h-8 text-accent" />
                  Vote for Monthly Spotlight
                </h3>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-accent to-transparent"></div>
              </div>
              <p className="text-white max-w-2xl mx-auto leading-relaxed" style={{textShadow: '0 1px 2px rgba(0,0,0,0.25)'}}>
                Help choose next month's featured business! Your vote counts for 70% of the selection process.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eligibleBusinesses?.map((business) => {
                const voteCount = voteCounts?.find(v => v.businessId === business.id)?.voteCount || 0;
                return (
                  <div 
                    key={business.id} 
                    className="relative transform-3d-card float-dynamic rounded-2xl p-6 miami-hover-lift miami-card-glow transition-all duration-300 voting-business-card"
                  >
                    <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-4">
                      {business.logoUrl ? (
                        <div className="relative">
                          <img 
                            src={business.logoUrl} 
                            alt={business.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                          />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-accent/10"></div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center border border-border/30">
                          <span className="text-lg font-bold gradient-text-primary">
                            {business.name?.charAt(0) || 'B'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{business.name}</h4>
                        <p className="text-sm text-slate-700 font-medium">{business.category}</p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-6 line-clamp-2 leading-relaxed">
                      {business.tagline || business.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm vote-counter-badge px-3 py-2 rounded-lg">
                        <Heart className="w-4 h-4 text-accent" />
                        <span className="text-slate-900 font-bold">{voteCount} votes</span>
                      </div>
                      
                      <Button
                        onClick={() => handleVote(business.id)}
                        disabled={voteMutation.isPending}
                        size="sm"
                        className="flex items-center gap-2 btn-vote-metallic hover-lift group px-4 py-2 rounded-lg"
                        data-testid={`button-vote-${business.id}`}
                      >
                        {voteMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
                            <span className="relative z-10">Voting...</span>
                          </>
                        ) : (
                          <>
                            <Heart className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                            <span className="relative z-10">Vote</span>
                          </>
                        )}
                      </Button>
                    </div>
                    </div>
                  </div>
                );
              })}
              {eligibleBusinesses?.length === 0 && (
                <div className="col-span-full spotlight-empty-state">
                  <div className="relative z-10 text-center">
                    <div className="relative inline-block mb-6">
                      <Heart className="w-16 h-16 spotlight-empty-icon mx-auto" />
                    </div>
                    <p className="text-muted-foreground text-lg font-medium">No businesses are currently eligible for voting.</p>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}