import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Business } from "@shared/schema";
import BusinessCard from "./business-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Heart, Trophy, TrendingUp, Calendar } from "lucide-react";

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
      apiRequest(`/api/spotlight/vote`, {
        method: 'POST',
        body: JSON.stringify({ businessId }),
      }),
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
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 gradient-text">
            Community Spotlight
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Celebrating the businesses that make Florida communities thrive. 
            Discover featured entrepreneurs selected by our intelligent promotion algorithms.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              className="flex items-center gap-2"
              data-testid="button-refresh-spotlight"
            >
              <TrendingUp className="w-4 h-4" />
              Refresh Spotlights
            </Button>
            {activeTab === 'monthly' && (
              <Button 
                onClick={() => setShowVoting(!showVoting)}
                variant={showVoting ? "default" : "outline"}
                className="flex items-center gap-2"
                data-testid="button-toggle-voting"
              >
                <Heart className="w-4 h-4" />
                {showVoting ? 'Hide Voting' : 'Vote for Monthly'}
              </Button>
            )}
          </div>
        </div>

        {/* Spotlight Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-card rounded-xl p-2 shadow-lg border border-border">
            <div className="flex space-x-1">
              <Button
                variant={activeTab === 'daily' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('daily')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'daily' ? 'spotlight-glow' : ''
                }`}
                data-testid="tab-daily-spotlight"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Daily
              </Button>
              <Button
                variant={activeTab === 'weekly' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('weekly')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'weekly' ? 'spotlight-glow' : ''
                }`}
                data-testid="tab-weekly-spotlight"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Weekly
              </Button>
              <Button
                variant={activeTab === 'monthly' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('monthly')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'monthly' ? 'spotlight-glow' : ''
                }`}
                data-testid="tab-monthly-spotlight"
              >
                <Heart className="w-4 h-4 mr-2" />
                Monthly
              </Button>
            </div>
          </div>
        </div>

        {/* Algorithm Description */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            {getSpotlightDescription()}
          </Badge>
        </div>

        {/* Spotlight Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {isLoading ? (
            // Loading skeletons
            [...Array(activeTab === 'daily' ? 3 : activeTab === 'weekly' ? 5 : 1)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden shadow-lg border border-border">
                <Skeleton className="h-48 w-full" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </div>
            ))
          ) : activeBusinesses.length > 0 ? (
            activeBusinesses.map((business: Business, index: number) => (
              <BusinessCard 
                key={business.id} 
                business={business} 
                spotlightType={activeTab}
                spotlightPosition={index + 1}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <i className="fas fa-star text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">No spotlight businesses yet</h3>
              <p className="text-muted-foreground">
                Check back soon to see featured businesses in this category.
              </p>
            </div>
          )}
        </div>

        {/* Monthly Voting Interface */}
        {showVoting && activeTab === 'monthly' && (
          <div className="mt-16 border-t pt-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
                <Heart className="w-6 h-6 text-red-500" />
                Vote for Monthly Spotlight
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Help choose next month's featured business! Your vote counts for 70% of the selection process.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eligibleBusinesses?.map((business) => {
                const voteCount = voteCounts?.find(v => v.businessId === business.id)?.voteCount || 0;
                return (
                  <div 
                    key={business.id} 
                    className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      {business.logoUrl ? (
                        <img 
                          src={business.logoUrl} 
                          alt={business.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {business.name?.charAt(0) || 'B'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{business.name}</h4>
                        <p className="text-sm text-muted-foreground">{business.category}</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {business.tagline || business.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Heart className="w-4 h-4" />
                        <span>{voteCount} votes</span>
                      </div>
                      
                      <Button
                        onClick={() => handleVote(business.id)}
                        disabled={voteMutation.isPending}
                        size="sm"
                        className="flex items-center gap-2"
                        data-testid={`button-vote-${business.id}`}
                      >
                        {voteMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                            Voting...
                          </>
                        ) : (
                          <>
                            <Heart className="w-4 h-4" />
                            Vote
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {eligibleBusinesses?.length === 0 && (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No businesses are currently eligible for voting.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
