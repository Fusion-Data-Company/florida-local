import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Business } from "@shared/schema";
import BusinessCard from "./business-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function SpotlightShowcase() {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const { data: spotlights, isLoading } = useQuery<{daily: Business[], weekly: Business[], monthly: Business[]}>({
    queryKey: ['/api/businesses/spotlight'],
  });

  const activeBusinesses = spotlights?.[activeTab] || [];

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
            Discover featured entrepreneurs and their inspiring stories.
          </p>
        </div>

        {/* Spotlight Tabs */}
        <div className="flex justify-center mb-12">
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
                Monthly
              </Button>
            </div>
          </div>
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
      </div>
    </section>
  );
}
