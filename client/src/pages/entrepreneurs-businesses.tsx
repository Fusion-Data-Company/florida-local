import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PremiumGlassCard } from "@/components/premium-ui";
import {
  Building2,
  Users,
  Star,
  MapPin,
  TrendingUp,
  Award,
  Briefcase,
  ChevronRight,
  Sparkles,
  Target,
} from "lucide-react";
import type { Business } from "@shared/types";

interface Entrepreneur {
  id: string;
  name: string;
  title: string;
  bio: string;
  location: string;
  imageUrl: string;
  stats: {
    businesses: number;
    followers: number;
    revenue: number;
  };
  verified: boolean;
}

interface PremiumAdSlot {
  id: string;
  companyName: string;
  tagline: string;
  imageUrl: string;
  isPremium: boolean;
}

export default function EntrepreneursBusinesses() {
  const [, setLocation] = useLocation();

  // Fetch entrepreneurs
  const { data: entrepreneurs = [], isLoading: entrepreneursLoading } = useQuery<Entrepreneur[]>({
    queryKey: ['/api/entrepreneurs'],
  });

  // Fetch businesses
  const { data: businesses = [], isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ['/api/businesses/featured'],
  });

  // Fetch premium ad slots
  const { data: premiumSlots = [], isLoading: slotsLoading } = useQuery<PremiumAdSlot[]>({
    queryKey: ['/api/premium-slots'],
  });

  // Mock data for initial display
  const mockPremiumSlots: PremiumAdSlot[] = Array.from({ length: 9 }, (_, i) => ({
    id: `slot-${i + 1}`,
    companyName: "Your Company Here",
    tagline: "Advertise to thousands of local customers",
    imageUrl: "",
    isPremium: false,
  }));

  const displaySlots = premiumSlots.length > 0 ? premiumSlots : mockPremiumSlots;

  return (
    <div className="min-h-screen marble-texture abstract-overlay-light relative overflow-hidden">
      <div className="relative" style={{ zIndex: 10 }}>

        {/* HERO SECTION */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--fl-teal-lagoon)]/5 via-transparent to-[var(--fl-sunset-gold)]/5" />

          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-[var(--fl-sunset-gold)]" />
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[var(--fl-teal-lagoon)] via-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] bg-clip-text text-transparent">
                Entrepreneurs & Businesses
              </h1>
              <Sparkles className="h-8 w-8 text-[var(--fl-sunset-gold)]" />
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              Discover Florida's most innovative entrepreneurs and thriving businesses.
              Connect, collaborate, and grow together in our local community.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Badge className="bg-[var(--fl-teal-lagoon)] text-white px-6 py-2 text-sm">
                <Users className="h-4 w-4 mr-2" />
                {entrepreneurs.length || "50+"} Entrepreneurs
              </Badge>
              <Badge className="bg-[var(--fl-sunset-gold)] text-white px-6 py-2 text-sm">
                <Building2 className="h-4 w-4 mr-2" />
                {businesses.length || "100+"} Businesses
              </Badge>
              <Badge className="bg-[var(--fl-bronze)] text-white px-6 py-2 text-sm">
                <Star className="h-4 w-4 mr-2" />
                Premium Partners
              </Badge>
            </div>
          </div>
        </section>

        {/* PREMIUM ADVERTISING SLOTS - 9 SLOTS IN 3x3 GRID */}
        <section className="py-12 container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] bg-clip-text text-transparent">
              Premium Partners
            </h2>
            <p className="text-muted-foreground">Featured businesses reaching thousands of local customers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {displaySlots.map((slot) => (
              <PremiumGlassCard
                key={slot.id}
                className="group hover:shadow-[0_20px_45px_rgba(212,175,55,0.35)] transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="relative w-full aspect-square bg-gradient-to-br from-[var(--fl-teal-lagoon)] via-[var(--fl-sunset-gold)] to-[var(--fl-bronze)]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-6">
                        <h3 className="text-3xl font-bold text-white mb-2">YOUR COMPANY HERE</h3>
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <img
                            src="/florida-local/logo.svg"
                            alt="Florida Local"
                            className="h-12 w-auto"
                          />
                          <span className="text-xl font-bold text-white">THE FLORIDA LOCAL</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </PremiumGlassCard>
            ))}
          </div>
        </section>

        {/* ENTREPRENEURS CAROUSEL */}
        <section className="py-12 bg-gradient-to-b from-transparent via-[var(--fl-teal-lagoon)]/5 to-transparent">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[var(--fl-teal-lagoon)] to-[var(--fl-bronze)] bg-clip-text text-transparent">
                  Featured Entrepreneurs
                </h2>
                <p className="text-muted-foreground">Meet Florida's innovative business leaders</p>
              </div>
              <Button variant="outline">
                View All
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex space-x-6">
                {entrepreneursLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="inline-block w-[320px] animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-48 bg-muted rounded-lg mb-4" />
                        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))
                ) : entrepreneurs.length > 0 ? (
                  entrepreneurs.map((entrepreneur) => (
                    <PremiumGlassCard
                      key={entrepreneur.id}
                      className="inline-block w-[320px] hover:shadow-[0_20px_45px_rgba(0,139,139,0.35)] transition-all duration-300 cursor-pointer group"
                      onClick={() => setLocation(`/entrepreneur/${entrepreneur.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="relative mb-4">
                          <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-[var(--fl-teal-lagoon)]/30 group-hover:scale-110 transition-transform">
                            <AvatarImage src={entrepreneur.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entrepreneur.id}`} />
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-[var(--fl-teal-lagoon)] to-[var(--fl-bronze)] text-white">
                              {entrepreneur.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {entrepreneur.verified && (
                            <Badge className="absolute top-0 right-1/4 bg-blue-500 text-white">
                              <Award className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-xl font-bold text-center mb-1">{entrepreneur.name}</h3>
                        <p className="text-sm text-muted-foreground text-center mb-2">{entrepreneur.title}</p>

                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-4">
                          <MapPin className="h-3 w-3" />
                          {entrepreneur.location}
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                          <div className="text-center">
                            <p className="text-lg font-bold text-[var(--fl-teal-lagoon)]">{entrepreneur.stats?.businesses || 0}</p>
                            <p className="text-xs text-muted-foreground">Businesses</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-[var(--fl-sunset-gold)]">{entrepreneur.stats?.followers || 0}</p>
                            <p className="text-xs text-muted-foreground">Followers</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-[var(--fl-bronze)]">
                              ${entrepreneur.stats?.revenue ? (entrepreneur.stats.revenue / 1000).toFixed(0) + 'K' : '0'}
                            </p>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                          </div>
                        </div>
                      </CardContent>
                    </PremiumGlassCard>
                  ))
                ) : (
                  // Mock entrepreneurs
                  Array.from({ length: 8 }, (_, i) => ({
                    id: `mock-${i + 1}`,
                    name: `Entrepreneur ${i + 1}`,
                    title: "Business Owner",
                    location: "Florida",
                    imageUrl: "",
                    stats: { businesses: Math.floor(Math.random() * 5) + 1, followers: Math.floor(Math.random() * 1000) + 100, revenue: Math.floor(Math.random() * 500000) + 50000 },
                    verified: i % 3 === 0,
                  })).map((entrepreneur) => (
                    <PremiumGlassCard
                      key={entrepreneur.id}
                      className="inline-block w-[320px] hover:shadow-[0_20px_45px_rgba(0,139,139,0.35)] transition-all duration-300 cursor-pointer group"
                    >
                      <CardContent className="p-6">
                        <div className="relative mb-4">
                          <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-[var(--fl-teal-lagoon)]/30 group-hover:scale-110 transition-transform">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entrepreneur.id}`} />
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-[var(--fl-teal-lagoon)] to-[var(--fl-bronze)] text-white">
                              {entrepreneur.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {entrepreneur.verified && (
                            <Badge className="absolute top-0 right-1/4 bg-blue-500 text-white">
                              <Award className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-xl font-bold text-center mb-1">{entrepreneur.name}</h3>
                        <p className="text-sm text-muted-foreground text-center mb-2">{entrepreneur.title}</p>

                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-4">
                          <MapPin className="h-3 w-3" />
                          {entrepreneur.location}
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                          <div className="text-center">
                            <p className="text-lg font-bold text-[var(--fl-teal-lagoon)]">{entrepreneur.stats.businesses}</p>
                            <p className="text-xs text-muted-foreground">Businesses</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-[var(--fl-sunset-gold)]">{entrepreneur.stats.followers}</p>
                            <p className="text-xs text-muted-foreground">Followers</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-[var(--fl-bronze)]">
                              ${(entrepreneur.stats.revenue / 1000).toFixed(0)}K
                            </p>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                          </div>
                        </div>
                      </CardContent>
                    </PremiumGlassCard>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </section>

        {/* BUSINESSES CAROUSEL */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] bg-clip-text text-transparent">
                  Featured Businesses
                </h2>
                <p className="text-muted-foreground">Discover Florida's top-rated local businesses</p>
              </div>
              <Button variant="outline">
                View All
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex space-x-6">
                {businessesLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="inline-block w-[320px] animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-48 bg-muted rounded-lg mb-4" />
                        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))
                ) : businesses.length > 0 ? (
                  businesses.map((business) => (
                    <PremiumGlassCard
                      key={business.id}
                      className="inline-block w-[320px] hover:shadow-[0_20px_45px_rgba(212,175,55,0.35)] transition-all duration-300 cursor-pointer group"
                      onClick={() => setLocation(`/business/${business.id}`)}
                    >
                      <CardContent className="p-6">
                        <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-[var(--fl-sunset-gold)]/30 group-hover:scale-110 transition-transform">
                          <AvatarImage src={business.logoUrl || undefined} />
                          <AvatarFallback className="text-2xl bg-gradient-to-br from-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] text-white">
                            {business.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <h3 className="text-xl font-bold text-center mb-1">{business.name}</h3>
                        <p className="text-sm text-muted-foreground text-center mb-2">{business.category}</p>

                        <div className="flex items-center justify-center gap-1 mb-4">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{business.rating || 5.0}</span>
                          <span className="text-muted-foreground text-sm">({business.reviewCount || 0} reviews)</span>
                        </div>

                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-4">
                          <MapPin className="h-3 w-3" />
                          {business.location}
                        </div>

                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] hover:opacity-90 text-white"
                        >
                          View Business
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </PremiumGlassCard>
                  ))
                ) : (
                  // Mock businesses
                  Array.from({ length: 10 }, (_, i) => ({
                    id: `mock-biz-${i + 1}`,
                    name: `Business ${i + 1}`,
                    category: ["Restaurant", "Retail", "Services", "Tech", "Healthcare"][Math.floor(Math.random() * 5)],
                    location: "Florida",
                    rating: (Math.random() * 2 + 3).toFixed(1),
                    reviewCount: Math.floor(Math.random() * 200) + 10,
                  })).map((business) => (
                    <PremiumGlassCard
                      key={business.id}
                      className="inline-block w-[320px] hover:shadow-[0_20px_45px_rgba(212,175,55,0.35)] transition-all duration-300 cursor-pointer group"
                    >
                      <CardContent className="p-6">
                        <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-[var(--fl-sunset-gold)]/30 group-hover:scale-110 transition-transform">
                          <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${business.id}`} />
                          <AvatarFallback className="text-2xl bg-gradient-to-br from-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] text-white">
                            {business.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <h3 className="text-xl font-bold text-center mb-1">{business.name}</h3>
                        <p className="text-sm text-muted-foreground text-center mb-2">{business.category}</p>

                        <div className="flex items-center justify-center gap-1 mb-4">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{business.rating}</span>
                          <span className="text-muted-foreground text-sm">({business.reviewCount} reviews)</span>
                        </div>

                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-4">
                          <MapPin className="h-3 w-3" />
                          {business.location}
                        </div>

                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-[var(--fl-sunset-gold)] to-[var(--fl-bronze)] hover:opacity-90 text-white"
                        >
                          View Business
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </PremiumGlassCard>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </section>
      </div>
    </div>
  );
}
