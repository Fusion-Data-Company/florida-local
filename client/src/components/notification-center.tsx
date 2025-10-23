import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, X, Check, Heart, MessageCircle, ShoppingBag, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "order" | "message" | "follow" | "like" | "comment" | "spotlight";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  businessId?: string;
  orderId?: string;
}

const NotificationIcon = ({ type }: { type: Notification["type"] }) => {
  const iconClass = "w-4 h-4";

  switch (type) {
    case "order":
      return <ShoppingBag className={iconClass} />;
    case "message":
      return <MessageCircle className={iconClass} />;
    case "follow":
      return <Users className={iconClass} />;
    case "like":
      return <Heart className={iconClass} />;
    case "comment":
      return <MessageCircle className={iconClass} />;
    case "spotlight":
      return <Star className={iconClass} />;
    default:
      return <Bell className={iconClass} />;
  }
};

const getNotificationColor = (type: Notification["type"]) => {
  switch (type) {
    case "order":
      return "from-emerald-500/20 to-green-500/20 border-emerald-500/30";
    case "message":
      return "from-blue-500/20 to-cyan-500/20 border-blue-500/30";
    case "follow":
      return "from-purple-500/20 to-pink-500/20 border-purple-500/30";
    case "like":
      return "from-rose-500/20 to-pink-500/20 border-rose-500/30";
    case "comment":
      return "from-cyan-500/20 to-teal-500/20 border-cyan-500/30";
    case "spotlight":
      return "from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
    default:
      return "from-slate-500/20 to-gray-500/20 border-slate-500/30";
  }
};

export default function NotificationCenter() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Fetch notifications (mock data for now - replace with real API)
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    // Mock data until API is ready
    queryFn: async () => {
      // TODO: Replace with real API call
      // return await apiRequest('GET', '/api/notifications');

      // Mock notifications for demonstration
      return [
        {
          id: "1",
          type: "order",
          title: "New Order",
          message: "You received a new order for Premium Product",
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
          link: "/orders/1",
          orderId: "1"
        },
        {
          id: "2",
          type: "follow",
          title: "New Follower",
          message: "Sarah Johnson started following your business",
          isRead: false,
          createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
          businessId: "business-1"
        },
        {
          id: "3",
          type: "spotlight",
          title: "Spotlight Achievement",
          message: "Your business is now in the top 3 for daily spotlight!",
          isRead: false,
          createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
          link: "/florida-elite"
        },
        {
          id: "4",
          type: "message",
          title: "New Message",
          message: "Mike Anderson sent you a message",
          isRead: true,
          createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
          link: "/messages"
        },
        {
          id: "5",
          type: "like",
          title: "Post Liked",
          message: "Emma Davis liked your recent post",
          isRead: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
          businessId: "business-1"
        }
      ] as Notification[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // TODO: Replace with real API call
      // await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
      console.log("Marking notification as read:", notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // TODO: Replace with real API call
      // await apiRequest('PUT', '/api/notifications/read-all');
      console.log("Marking all notifications as read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "All notifications marked as read",
      });
    },
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Play notification sound for new unread notifications
  useEffect(() => {
    if (unreadCount > 0 && !open) {
      // Optional: Add sound notification here
      // const audio = new Audio('/notification-sound.mp3');
      // audio.play().catch(() => {});
    }
  }, [unreadCount, open]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative rounded-full hover:scale-110 transition-all duration-300"
          style={{
            width: '52px',
            height: '52px',
            padding: 0,
            background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.08) 50%, rgba(168, 85, 247, 0.15) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '2px solid rgba(168, 85, 247, 0.4)',
            borderTop: '2px solid rgba(168, 85, 247, 0.6)',
            borderLeft: '2px solid rgba(168, 85, 247, 0.5)',
            boxShadow: '0 8px 32px rgba(168, 85, 247, 0.35), inset 0 3px 6px rgba(168, 85, 247, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.1), 0 0 30px rgba(168, 85, 247, 0.3)',
            position: 'relative',
            overflow: 'visible',
            zIndex: 1
          }}
        >
          <Bell className="w-6 h-6 text-purple-400" style={{ position: 'relative', zIndex: 1 }} />
          {unreadCount > 0 && (
            <Badge
              className="absolute h-6 w-6 flex items-center justify-center p-0 text-xs font-bold border-2 border-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                top: '-8px',
                right: '-8px',
                zIndex: 9999,
                pointerEvents: 'none',
                transform: 'translateZ(100px)',
                color: 'white'
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 p-0 overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
          zIndex: 60
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div>
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Bell className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900 mb-1">No notifications yet</p>
              <p className="text-xs text-slate-500">We'll notify you when something new happens</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "relative px-4 py-3 transition-all duration-200",
                    !notification.isRead && "bg-cyan-50/50",
                    "hover:bg-slate-50 cursor-pointer group"
                  )}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsReadMutation.mutate(notification.id);
                    }
                    if (notification.link) {
                      setOpen(false);
                      // Navigate to link
                      window.location.href = notification.link;
                    }
                  }}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border",
                        "bg-gradient-to-br",
                        getNotificationColor(notification.type)
                      )}
                    >
                      <NotificationIcon type={notification.type} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {notification.title}
                        </p>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-cyan-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-slate-200 px-4 py-2">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              <Button
                variant="ghost"
                className="w-full text-sm text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
              >
                View all notifications
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
