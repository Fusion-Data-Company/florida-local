import { useEffect, useState } from "react";
import { X, Bell, Heart, MessageSquare, UserPlus, Star, ShoppingBag, TrendingUp, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface LiveNotification {
  id: string;
  type: "like" | "comment" | "follow" | "order" | "review" | "spotlight" | "achievement";
  title: string;
  message: string;
  timestamp: Date;
  avatar?: string;
  actionUrl?: string;
}

interface LiveNotificationToastProps {
  notification: LiveNotification;
  onDismiss: (id: string) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  duration?: number;
}

/**
 * Live Notification Toast Component
 *
 * Animated toast notification that appears for real-time events.
 * Features smooth entrance/exit animations and auto-dismiss.
 *
 * @param notification - The notification data to display
 * @param onDismiss - Callback when notification is dismissed
 * @param position - Screen position (default: top-right)
 * @param duration - Auto-dismiss duration in ms (default: 5000)
 */
export default function LiveNotificationToast({
  notification,
  onDismiss,
  position = "top-right",
  duration = 5000
}: LiveNotificationToastProps) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(notification.id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [notification.id, onDismiss, duration, isHovered]);

  const getIcon = () => {
    switch (notification.type) {
      case "like":
        return <Heart className="w-5 h-5 text-red-500 fill-red-500" />;
      case "comment":
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case "follow":
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case "order":
        return <ShoppingBag className="w-5 h-5 text-purple-500" />;
      case "review":
        return <Star className="w-5 h-5 text-amber-500 fill-amber-500" />;
      case "spotlight":
        return <TrendingUp className="w-5 h-5 text-pink-500" />;
      case "achievement":
        return <Award className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case "like":
        return "from-red-50 to-pink-50 border-red-200";
      case "comment":
        return "from-blue-50 to-cyan-50 border-blue-200";
      case "follow":
        return "from-green-50 to-emerald-50 border-green-200";
      case "order":
        return "from-purple-50 to-pink-50 border-purple-200";
      case "review":
        return "from-amber-50 to-yellow-50 border-amber-200";
      case "spotlight":
        return "from-pink-50 to-purple-50 border-pink-200";
      case "achievement":
        return "from-emerald-50 to-teal-50 border-emerald-200";
      default:
        return "from-gray-50 to-gray-100 border-gray-200";
    }
  };

  const handleClick = () => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`
        relative overflow-hidden rounded-xl border-2 shadow-2xl backdrop-blur-sm
        bg-gradient-to-br ${getColors()}
        ${notification.actionUrl ? "cursor-pointer hover:shadow-3xl" : ""}
        transition-shadow duration-300
      `}
      style={{ width: "380px", maxWidth: "calc(100vw - 32px)" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
        }}
      />

      {/* Progress bar */}
      {!isHovered && duration > 0 && (
        <motion.div
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: duration / 1000, ease: "linear" }}
        />
      )}

      <div className="relative p-4 flex items-start gap-3">
        {/* Avatar or Icon */}
        <div className="flex-shrink-0">
          {notification.avatar ? (
            <img
              src={notification.avatar}
              alt=""
              className="w-12 h-12 rounded-full border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center">
              {getIcon()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 mb-1">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {formatTimeAgo(notification.timestamp)}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(notification.id);
          }}
          className="
            flex-shrink-0 w-6 h-6 rounded-full
            flex items-center justify-center
            hover:bg-white/60 transition-colors
          "
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Live Notification Container Component
 *
 * Manages multiple notification toasts with proper positioning and stacking.
 */
interface LiveNotificationContainerProps {
  notifications: LiveNotification[];
  onDismiss: (id: string) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  maxNotifications?: number;
}

export function LiveNotificationContainer({
  notifications,
  onDismiss,
  position = "top-right",
  maxNotifications = 3
}: LiveNotificationContainerProps) {

  const getPositionClasses = () => {
    switch (position) {
      case "top-right":
        return "top-4 right-4";
      case "top-left":
        return "top-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
    }
  };

  const visibleNotifications = notifications.slice(0, maxNotifications);

  return (
    <div
      className={`fixed ${getPositionClasses()} z-[100] flex flex-col gap-3 pointer-events-none`}
      style={{ maxWidth: "calc(100vw - 32px)" }}
    >
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <LiveNotificationToast
              notification={notification}
              onDismiss={onDismiss}
              position={position}
            />
          </div>
        ))}
      </AnimatePresence>

      {/* Show count if more notifications exist */}
      {notifications.length > maxNotifications && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="
            px-4 py-2 rounded-lg
            bg-gray-900/90 backdrop-blur-sm
            text-white text-sm font-medium text-center
            pointer-events-auto
          "
        >
          +{notifications.length - maxNotifications} more notifications
        </motion.div>
      )}
    </div>
  );
}

/**
 * Hook for managing live notifications
 */
export function useLiveNotifications() {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);

  const addNotification = (notification: Omit<LiveNotification, "id" | "timestamp">) => {
    const newNotification: LiveNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };

    setNotifications((prev) => [newNotification, ...prev]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
  };
}

// Helper function
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
