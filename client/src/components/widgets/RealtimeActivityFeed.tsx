import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShoppingCart,
  Store,
  Star,
  TrendingUp,
  Users,
  Heart,
  MessageSquare,
  Award,
  Sparkles,
  Package,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityItem {
  id: string;
  type: 'order' | 'signup' | 'review' | 'spotlight_vote' | 'follow' | 'product' | 'milestone';
  message: string;
  businessName?: string;
  userName?: string;
  timestamp: Date;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}

interface RealtimeActivityFeedProps {
  variant?: 'sidebar' | 'full';
  maxItems?: number;
  autoRefresh?: boolean;
}

export function RealtimeActivityFeed({
  variant = 'sidebar',
  maxItems = 10,
  autoRefresh = true,
}: RealtimeActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize with some sample data
    loadInitialActivities();

    // Set up WebSocket connection if available
    if (autoRefresh) {
      connectWebSocket();
    }

    return () => {
      // Cleanup WebSocket connection
      disconnectWebSocket();
    };
  }, [autoRefresh]);

  const loadInitialActivities = async () => {
    try {
      const response = await fetch('/api/activity/recent', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const formattedActivities = formatActivities(data.activities || []);
        setActivities(formattedActivities);
      } else {
        // Use mock data if API not available
        setActivities(getMockActivities());
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities(getMockActivities());
    }
  };

  const connectWebSocket = () => {
    try {
      // Check if WebSocket connection exists
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected for activity feed');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'activity') {
            addNewActivity(data.activity);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect after 5 seconds
        if (autoRefresh) {
          setTimeout(connectWebSocket, 5000);
        }
      };

      // Store WebSocket instance for cleanup
      (window as any).__activityWS = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const disconnectWebSocket = () => {
    const ws = (window as any).__activityWS;
    if (ws) {
      ws.close();
      delete (window as any).__activityWS;
    }
  };

  const addNewActivity = (activityData: any) => {
    const newActivity = formatActivity(activityData);
    setActivities((prev) => {
      const updated = [newActivity, ...prev];
      return updated.slice(0, maxItems);
    });
  };

  const formatActivity = (data: any): ActivityItem => {
    const activityMap = {
      order: {
        icon: <ShoppingCart className="h-4 w-4" />,
        color: 'text-green-600 bg-green-50 dark:bg-green-950/30',
      },
      signup: {
        icon: <Store className="h-4 w-4" />,
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
      },
      review: {
        icon: <Star className="h-4 w-4" />,
        color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30',
      },
      spotlight_vote: {
        icon: <Award className="h-4 w-4" />,
        color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
      },
      follow: {
        icon: <Users className="h-4 w-4" />,
        color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/30',
      },
      product: {
        icon: <Package className="h-4 w-4" />,
        color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
      },
      milestone: {
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30',
      },
    };

    const config = activityMap[data.type as keyof typeof activityMap] || activityMap.order;

    return {
      id: data.id || `activity-${Date.now()}-${Math.random()}`,
      type: data.type,
      message: data.message,
      businessName: data.businessName,
      userName: data.userName,
      timestamp: new Date(data.timestamp || Date.now()),
      icon: config.icon,
      color: config.color,
      badge: data.badge,
    };
  };

  const formatActivities = (data: any[]): ActivityItem[] => {
    return data.map(formatActivity);
  };

  const getMockActivities = (): ActivityItem[] => {
    const now = Date.now();
    return [
      {
        id: '1',
        type: 'order',
        message: 'New order placed at Miami Beach Coffee',
        businessName: 'Miami Beach Coffee',
        timestamp: new Date(now - 2000),
        icon: <ShoppingCart className="h-4 w-4" />,
        color: 'text-green-600 bg-green-50 dark:bg-green-950/30',
        badge: '$45.00',
      },
      {
        id: '2',
        type: 'signup',
        message: 'Sunshine Yoga Studio joined the marketplace',
        businessName: 'Sunshine Yoga Studio',
        timestamp: new Date(now - 120000),
        icon: <Store className="h-4 w-4" />,
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
      },
      {
        id: '3',
        type: 'review',
        message: 'Sarah M. left a 5-star review',
        businessName: 'Ocean View Restaurant',
        userName: 'Sarah M.',
        timestamp: new Date(now - 300000),
        icon: <Star className="h-4 w-4" />,
        color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30',
        badge: '⭐⭐⭐⭐⭐',
      },
      {
        id: '4',
        type: 'spotlight_vote',
        message: '15 new votes for Tampa Tech Hub',
        businessName: 'Tampa Tech Hub',
        timestamp: new Date(now - 480000),
        icon: <Award className="h-4 w-4" />,
        color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
        badge: '+15 votes',
      },
      {
        id: '5',
        type: 'product',
        message: 'New product added: Handcrafted Jewelry',
        businessName: 'Artisan Corner',
        timestamp: new Date(now - 600000),
        icon: <Package className="h-4 w-4" />,
        color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
      },
      {
        id: '6',
        type: 'milestone',
        message: 'Florida Fitness reached 1,000 followers!',
        businessName: 'Florida Fitness',
        timestamp: new Date(now - 900000),
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30',
        badge: '🎉 Milestone',
      },
      {
        id: '7',
        type: 'follow',
        message: 'John D. started following your business',
        userName: 'John D.',
        timestamp: new Date(now - 1200000),
        icon: <Users className="h-4 w-4" />,
        color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/30',
      },
      {
        id: '8',
        type: 'order',
        message: 'Large order from corporate client',
        businessName: 'Local Catering Co.',
        timestamp: new Date(now - 1500000),
        icon: <ShoppingCart className="h-4 w-4" />,
        color: 'text-green-600 bg-green-50 dark:bg-green-950/30',
        badge: '$850.00',
      },
    ];
  };

  const getTimeAgo = (timestamp: Date): string => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (variant === 'sidebar') {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Live Activity
            </CardTitle>
            {isConnected && (
              <Badge variant="outline" className="text-xs">
                <span className="relative flex h-2 w-2 mr-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Real-time marketplace activity
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <ScrollArea className="h-[400px] px-4">
            <AnimatePresence mode="popLayout">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="mb-4 last:mb-0"
                >
                  <div className="flex gap-3 items-start">
                    <div className={`p-2 rounded-lg ${activity.color} flex-shrink-0`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight mb-1">
                        {activity.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{getTimeAgo(activity.timestamp)}</span>
                        {activity.badge && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {activity.badge}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // Full variant for dashboard
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>
              See what's happening across Florida Local Elite right now
            </CardDescription>
          </div>
          {isConnected && (
            <Badge className="bg-green-500 text-white">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Live Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="flex gap-4 items-start p-4 rounded-lg border border-border/50 hover:border-border transition-colors bg-card hover:shadow-sm">
                    <div className={`p-3 rounded-xl ${activity.color} flex-shrink-0`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium leading-tight">
                          {activity.message}
                        </p>
                        {activity.badge && (
                          <Badge variant="secondary" className="whitespace-nowrap">
                            {activity.badge}
                          </Badge>
                        )}
                      </div>
                      {activity.businessName && (
                        <p className="text-sm text-muted-foreground mb-1">
                          {activity.businessName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {getTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
