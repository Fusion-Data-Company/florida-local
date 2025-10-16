import { useQuery } from "@tanstack/react-query";
import { Business } from "@shared/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  TrendingUp,
  Flame,
  Zap,
  ArrowUp,
  Star,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

interface TrendingBusiness extends Business {
  trendScore: number;
  trendPercentage: number;
  viewsGrowth: number;
  followersGrowth: number;
  engagement24h: number;
}

interface TrendingBusinessesProps {
  limit?: number;
  variant?: 'compact' | 'full';
}

export default function TrendingBusinesses({
  limit = 5,
  variant = 'compact'
}: TrendingBusinessesProps) {
  const { data: trendingBusinesses = [], isLoading } = useQuery<TrendingBusiness[]>({
    queryKey: ['/api/businesses/trending', limit],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getTrendIcon = (score: number) => {
    if (score > 80) return <Flame className="h-4 w-4 text-white" />;
    if (score > 60) return <Zap className="h-4 w-4 text-white" />;
    return <TrendingUp className="h-4 w-4 text-white" />;
  };

  const getTrendMetallic = (score: number) => {
    if (score > 80) return "metallic-gold";
    if (score > 60) return "metallic-bronze";
    return "metallic-teal";
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (trendingBusinesses.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No trending businesses yet</p>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        {trendingBusinesses.map((business, index) => (
          <motion.div
            key={business.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="apple-hover-depth"
          >
            <Link href={`/business/${business.id}`}>
              <Card className="frosted-panel hover:shadow-xl transition-all duration-300 cursor-pointer group border border-white/30">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Rank & Trend Icon */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="text-base font-bold text-gray-700">
                        #{index + 1}
                      </div>
                      <div className={`p-1.5 rounded-full ${getTrendMetallic(business.trendScore)} shine-sweep-hover`}>
                        {getTrendIcon(business.trendScore)}
                      </div>
                    </div>

                    {/* Business Logo */}
                    <Avatar className="h-10 w-10 border-2 border-white/50 shadow-md flex-shrink-0">
                      <AvatarImage src={business.logoUrl} />
                      <AvatarFallback className="metallic-chrome text-gray-900 font-bold">
                        {business.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Business Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate text-gray-900 group-hover:text-blue-600 transition-colors">
                        {business.name}
                      </h4>
                      <p className="text-xs text-gray-700 truncate font-medium">
                        {business.category}
                      </p>
                      {business.rating && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-semibold text-gray-700">{business.rating}</span>
                        </div>
                      )}
                    </div>

                    {/* Trend Badge */}
                    <Badge className={`${getTrendMetallic(business.trendScore)} text-white px-2 py-1 shine-sweep-hover flex-shrink-0`}>
                      <ArrowUp className="h-3 w-3 mr-0.5" />
                      {business.trendPercentage}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    );
  }

  // Full variant with more details
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trendingBusinesses.map((business, index) => (
        <motion.div
          key={business.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Link href={`/business/${business.id}`}>
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden">
              {/* Trending Badge Ribbon */}
              <div className="relative">
                <div className={`absolute top-4 -left-12 rotate-[-45deg] w-40 py-1 text-center bg-gradient-to-r ${getTrendColor(business.trendScore)} text-white text-xs font-bold shadow-lg z-10`}>
                  {business.trendScore > 80 ? 'ON FIRE' : business.trendScore > 60 ? 'HOT' : 'TRENDING'}
                </div>

                {/* Business Cover/Background */}
                <div className="h-32 bg-gradient-to-br from-purple-500 to-pink-500 relative">
                  {business.coverImageUrl && (
                    <img
                      src={business.coverImageUrl}
                      alt={business.name}
                      className="w-full h-full object-cover opacity-80"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                  {/* Trend Score */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-3">
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full bg-gradient-to-r ${getTrendColor(business.trendScore)}`}>
                        {getTrendIcon(business.trendScore)}
                      </div>
                      <span className="text-xs font-bold mt-1">{business.trendScore}</span>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 relative -mt-8">
                {/* Business Logo */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-16 w-16 border-4 border-white shadow-xl">
                    <AvatarImage src={business.logoUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-bold">
                      {business.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h3 className="font-bold text-lg group-hover:text-purple-600 transition-colors mb-1">
                      {business.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{business.category}</p>
                  </div>
                </div>

                {/* Tagline */}
                {business.tagline && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {business.tagline}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-900">Views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">{business.viewsGrowth}%</span>
                      <ArrowUp className="h-3 w-3 text-green-600" />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-900">Growth</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">{business.trendPercentage}%</span>
                      <ArrowUp className="h-3 w-3 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Rating */}
                {business.rating && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{business.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({business.reviewCount} reviews)
                      </span>
                    </div>
                    <Badge variant="outline">
                      {business.followerCount || 0} followers
                    </Badge>
                  </div>
                )}

                {/* 24h Engagement */}
                <div className="mt-3 p-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-900">
                      {business.engagement24h} engagements in 24h
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
