import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "spotlight" | "order" | "message";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Polling placeholder - in production, use WebSockets or Server-Sent Events
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll every 30 seconds
    initialData: [],
  });

  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  const markAsRead = async (notificationId: string) => {
    // TODO: Implement mark as read API call
    console.log("Mark as read:", notificationId);
  };

  const markAllAsRead = async () => {
    // TODO: Implement mark all as read API call
    console.log("Mark all as read");
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
