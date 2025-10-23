import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageSquare, UserPlus, Star, ShoppingBag, TrendingUp, Award, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "like" | "comment" | "follow" | "order" | "review" | "spotlight" | "achievement";
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  targetName?: string;
  timestamp: Date;
  isNew?: boolean;
}

interface RealtimeActivityFeedProps {
  businessId?: string;
  maxItems?: number;
  showNewBadge?: boolean;
  autoScroll?: boolean;
  className?: string;
}

/**
 * Realtime Activity Feed Component
 *
 * Displays live updates of business activities with WebSocket integration.
 * Features smooth animations for new items and auto-scroll capability.
 *
 * @param businessId - Filter activities by business (optional)
 * @param maxItems - Maximum number of items to display (default: 20)
 * @param showNewBadge - Show "NEW" badge on fresh items (default: true)
 * @param autoScroll - Auto-scroll to new items (default: false)
 * @param className - Additional Tailwind classes
 */
export default function RealtimeActivityFeed({
  businessId,
  maxItems = 20,
  showNewBadge = true,
  autoScroll = false,
  className = ""
}: RealtimeActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // TODO: Replace with actual WebSocket endpoint
    // const ws = new WebSocket(`wss://your-domain.com/ws/activities${businessId ? `?businessId=${businessId}` : ''}`);

    // Mock WebSocket connection
    setIsConnected(true);

    // Simulate initial data
    const mockActivities: ActivityItem[] = [
      {
        id: "1",
        type: "like",
        userId: "user1",
        userName: "Sarah Johnson",
        action: "liked your post",
        targetName: "Summer Special Announcement",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
      },
      {
        id: "2",
        type: "follow",
        userId: "user2",
        userName: "Michael Chen",
        action: "started following you",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: "3",
        type: "review",
        userId: "user3",
        userName: "Emma Rodriguez",
        action: "left a 5-star review",
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        id: "4",
        type: "order",
        userId: "user4",
        userName: "David Thompson",
        action: "placed an order",
        targetName: "$125.00",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        id: "5",
        type: "spotlight",
        userId: "user5",
        userName: "Lisa Martinez",
        action: "voted for your business in",
        targetName: "Best Local Shop",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
    ];

    setActivities(mockActivities);

    // Simulate real-time updates
    const interval = setInterval(() => {
      const types: ActivityItem["type"][] = ["like", "comment", "follow", "order", "review", "spotlight"];
      const names = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley"];
      const actions = {
        like: "liked your post",
        comment: "commented on your post",
        follow: "started following you",
        order: "placed an order",
        review: "left a review",
        spotlight: "voted for your business",
      };

      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomName = names[Math.floor(Math.random() * names.length)];

      const newActivity: ActivityItem = {
        id: `activity-${Date.now()}`,
        type: randomType,
        userId: `user-${Date.now()}`,
        userName: randomName,
        action: actions[randomType],
        targetName: randomType === "order" ? `$${Math.floor(Math.random() * 200 + 50)}.00` : undefined,
        timestamp: new Date(),
        isNew: true,
      };

      setActivities((prev) => {
        const updated = [newActivity, ...prev];
        return updated.slice(0, maxItems);
      });

      // Remove "new" badge after 3 seconds
      setTimeout(() => {
        setActivities((prev) =>
          prev.map((item) =>
            item.id === newActivity.id ? { ...item, isNew: false } : item
          )
        );
      }, 3000);
    }, 8000); // New activity every 8 seconds

    // Cleanup
    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [businessId, maxItems]);

  // Auto-scroll to new items
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [activities, autoScroll]);

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case "order":
        return <ShoppingBag className="w-4 h-4 text-purple-500" />;
      case "review":
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
      case "spotlight":
        return <TrendingUp className="w-4 h-4 text-pink-500" />;
      case "achievement":
        return <Award className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getIconBg = (type: ActivityItem["type"]) => {
    switch (type) {
      case "like":
        return "bg-red-100";
      case "comment":
        return "bg-blue-100";
      case "follow":
        return "bg-green-100";
      case "order":
        return "bg-purple-100";
      case "review":
        return "bg-amber-100";
      case "spotlight":
        return "bg-pink-100";
      case "achievement":
        return "bg-emerald-100";
    }
  };

  return (
    <Card className={`entrance-fade-up ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>Real-time updates as they happen</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Live
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={feedRef}
          className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar"
        >
          <AnimatePresence mode="popLayout">
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  New activities will appear here in real-time
                </p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    delay: index * 0.05,
                  }}
                  layout
                  className={`
                    relative flex items-start gap-3 p-3 rounded-lg
                    border border-gray-200
                    hover:border-blue-300 hover:shadow-md
                    transition-all duration-300
                    ${activity.isNew ? "bg-blue-50 border-blue-300" : "bg-white"}
                  `}
                >
                  {/* New indicator pulse */}
                  {activity.isNew && showNewBadge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 z-10"
                    >
                      <Badge
                        variant="outline"
                        className="bg-blue-500 text-white border-blue-600 text-xs px-1.5 py-0 animate-pulse"
                      >
                        NEW
                      </Badge>
                    </motion.div>
                  )}

                  {/* Avatar with icon badge */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-10 h-10 border-2 border-white shadow">
                      {activity.userAvatar ? (
                        <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                          {activity.userName.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div
                      className={`
                        absolute -bottom-1 -right-1
                        w-6 h-6 rounded-full
                        flex items-center justify-center
                        ${getIconBg(activity.type)}
                        border-2 border-white shadow-sm
                      `}
                    >
                      {getIcon(activity.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-relaxed">
                        <span className="font-semibold text-gray-900">
                          {activity.userName}
                        </span>
                        {" "}
                        <span className="text-gray-600">{activity.action}</span>
                        {activity.targetName && (
                          <>
                            {" "}
                            <span className="font-medium text-gray-900">
                              {activity.targetName}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Activity counter */}
        {activities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-center text-muted-foreground">
              Showing {activities.length} {activities.length === 1 ? "activity" : "activities"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact Realtime Activity Widget
 *
 * Smaller version for dashboard widgets
 */
interface RealtimeActivityWidgetProps {
  businessId?: string;
  maxItems?: number;
  className?: string;
}

export function RealtimeActivityWidget({
  businessId,
  maxItems = 5,
  className = ""
}: RealtimeActivityWidgetProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(true);

    // Mock data
    const mockActivities: ActivityItem[] = [
      {
        id: "1",
        type: "like",
        userId: "user1",
        userName: "Sarah J.",
        action: "liked your post",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
      },
      {
        id: "2",
        type: "follow",
        userId: "user2",
        userName: "Michael C.",
        action: "started following",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: "3",
        type: "order",
        userId: "user3",
        userName: "Emma R.",
        action: "placed an order",
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
      },
    ];

    setActivities(mockActivities);
  }, [businessId, maxItems]);

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "like":
        return <Heart className="w-3 h-3 text-red-500 fill-red-500" />;
      case "comment":
        return <MessageSquare className="w-3 h-3 text-blue-500" />;
      case "follow":
        return <UserPlus className="w-3 h-3 text-green-500" />;
      case "order":
        return <ShoppingBag className="w-3 h-3 text-purple-500" />;
      case "review":
        return <Star className="w-3 h-3 text-amber-500 fill-amber-500" />;
      case "spotlight":
        return <TrendingUp className="w-3 h-3 text-pink-500" />;
      default:
        return <Zap className="w-3 h-3 text-gray-500" />;
    }
  };

  return (
    <Card className={`entrance-fade-up ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            Live Activity
          </h4>
          {isConnected && (
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {activities.slice(0, maxItems).map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 text-sm"
              >
                <div className="flex-shrink-0">{getIcon(activity.type)}</div>
                <p className="flex-1 text-gray-700 truncate">
                  <span className="font-medium">{activity.userName}</span>{" "}
                  <span className="text-gray-500">{activity.action}</span>
                </p>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true }).replace(" ago", "")}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
