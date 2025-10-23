import { CheckCircle, Shield, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  type?: 'gmb' | 'premium' | 'elite';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Verified Business Badge Component
 *
 * Displays verification status with three tiers:
 * - GMB: Google My Business connected & verified
 * - Premium: GMB + active engagement metrics
 * - Elite: Premium + top performer status
 */
export function VerifiedBadge({
  type = 'gmb',
  size = 'md',
  showLabel = false,
  className
}: VerifiedBadgeProps) {

  const config = {
    gmb: {
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      textColor: 'text-green-700',
      label: 'GMB Verified',
      tooltip: 'This business is verified through Google My Business with confirmed location, hours, and contact information.',
    },
    premium: {
      icon: Shield,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      textColor: 'text-blue-700',
      label: 'Premium Verified',
      tooltip: 'Premium verified business with GMB connection, active engagement, and excellent customer reviews.',
    },
    elite: {
      icon: Star,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      textColor: 'text-purple-700',
      label: 'Elite Verified',
      tooltip: 'Elite status: Top-performing business with GMB verification, outstanding reviews, and exceptional engagement metrics.',
    },
  };

  const selected = config[type];
  const Icon = selected.icon;

  const sizeClasses = {
    sm: {
      icon: 'h-3 w-3',
      badge: 'h-5 px-1.5 text-xs',
      text: 'text-xs',
    },
    md: {
      icon: 'h-4 w-4',
      badge: 'h-6 px-2 text-xs',
      text: 'text-sm',
    },
    lg: {
      icon: 'h-5 w-5',
      badge: 'h-7 px-3 text-sm',
      text: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  if (showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              className={cn(
                `bg-gradient-to-r ${selected.color} text-white border-0 gap-1.5 cursor-help hover:shadow-lg transition-all duration-300`,
                sizes.badge,
                className
              )}
            >
              <Icon className={sizes.icon} />
              <span className={sizes.text}>{selected.label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs bg-white dark:bg-gray-900 border-2"
            style={{ borderColor: type === 'gmb' ? '#10b981' : type === 'premium' ? '#06b6d4' : '#a855f7' }}
          >
            <div className="flex items-start gap-2">
              <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{
                color: type === 'gmb' ? '#10b981' : type === 'premium' ? '#06b6d4' : '#a855f7'
              }} />
              <div>
                <p className="font-semibold mb-1">{selected.label}</p>
                <p className="text-sm text-muted-foreground">{selected.tooltip}</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Icon-only version with tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              `inline-flex items-center justify-center rounded-full bg-gradient-to-r ${selected.color} p-1 cursor-help hover:shadow-lg transition-all duration-300 hover:scale-110`,
              className
            )}
          >
            <Icon className={cn(sizes.icon, "text-white")} />
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs bg-white dark:bg-gray-900 border-2"
          style={{ borderColor: type === 'gmb' ? '#10b981' : type === 'premium' ? '#06b6d4' : '#a855f7' }}
        >
          <div className="flex items-start gap-2">
            <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{
              color: type === 'gmb' ? '#10b981' : type === 'premium' ? '#06b6d4' : '#a855f7'
            }} />
            <div>
              <p className="font-semibold mb-1">{selected.label}</p>
              <p className="text-sm text-muted-foreground">{selected.tooltip}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Helper function to determine verification tier based on business data
 */
export function getVerificationTier(business: {
  gmbConnected?: boolean;
  averageRating?: number;
  totalReviews?: number;
  monthlyEngagement?: number;
  isSpotlightFeatured?: boolean;
}): 'gmb' | 'premium' | 'elite' | null {
  if (!business.gmbConnected) {
    return null; // Not verified
  }

  // Elite tier: GMB + high ratings + high engagement + spotlight
  if (
    business.averageRating && business.averageRating >= 4.5 &&
    business.totalReviews && business.totalReviews >= 50 &&
    business.monthlyEngagement && business.monthlyEngagement >= 1000 &&
    business.isSpotlightFeatured
  ) {
    return 'elite';
  }

  // Premium tier: GMB + good ratings + active
  if (
    business.averageRating && business.averageRating >= 4.0 &&
    business.totalReviews && business.totalReviews >= 20 &&
    business.monthlyEngagement && business.monthlyEngagement >= 500
  ) {
    return 'premium';
  }

  // Basic GMB verification
  return 'gmb';
}
