import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type WebSocketStatus = "connected" | "connecting" | "disconnected" | "error";

interface WebSocketStatusIndicatorProps {
  status: WebSocketStatus;
  onReconnect?: () => void;
  variant?: "badge" | "icon" | "full";
  showDetails?: boolean;
  lastMessageTime?: Date;
  className?: string;
}

/**
 * WebSocket Status Indicator Component
 *
 * Displays real-time WebSocket connection status with visual feedback.
 * Includes reconnection capability and detailed connection info.
 *
 * @param status - Current connection status
 * @param onReconnect - Callback for manual reconnection
 * @param variant - Display variant (badge, icon, full)
 * @param showDetails - Show detailed connection info
 * @param lastMessageTime - Timestamp of last received message
 * @param className - Additional Tailwind classes
 */
export default function WebSocketStatusIndicator({
  status,
  onReconnect,
  variant = "badge",
  showDetails = false,
  lastMessageTime,
  className = ""
}: WebSocketStatusIndicatorProps) {

  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          icon: Wifi,
          label: "Connected",
          color: "emerald",
          bgClass: "bg-emerald-100",
          textClass: "text-emerald-700",
          borderClass: "border-emerald-300",
          iconColor: "text-emerald-600",
          pulseColor: "bg-emerald-500",
        };
      case "connecting":
        return {
          icon: RefreshCw,
          label: "Connecting",
          color: "blue",
          bgClass: "bg-blue-100",
          textClass: "text-blue-700",
          borderClass: "border-blue-300",
          iconColor: "text-blue-600",
          pulseColor: "bg-blue-500",
        };
      case "disconnected":
        return {
          icon: WifiOff,
          label: "Disconnected",
          color: "gray",
          bgClass: "bg-gray-100",
          textClass: "text-gray-700",
          borderClass: "border-gray-300",
          iconColor: "text-gray-600",
          pulseColor: "bg-gray-500",
        };
      case "error":
        return {
          icon: AlertCircle,
          label: "Connection Error",
          color: "red",
          bgClass: "bg-red-100",
          textClass: "text-red-700",
          borderClass: "border-red-300",
          iconColor: "text-red-600",
          pulseColor: "bg-red-500",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Icon variant - small icon with pulse
  if (variant === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`relative inline-flex items-center ${className}`}>
              <Icon
                className={`w-4 h-4 ${config.iconColor} ${
                  status === "connecting" ? "animate-spin" : ""
                }`}
              />
              {status === "connected" && (
                <motion.span
                  className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${config.pulseColor} rounded-full`}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs font-medium">{config.label}</p>
            {lastMessageTime && status === "connected" && (
              <p className="text-xs text-gray-400 mt-1">
                Last update: {formatTimeAgo(lastMessageTime)}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Badge variant - compact badge with icon
  if (variant === "badge") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`
                flex items-center gap-1.5 px-2 py-1
                ${config.bgClass} ${config.textClass} ${config.borderClass}
                ${className}
              `}
            >
              {status === "connected" && (
                <motion.span
                  className={`w-2 h-2 ${config.pulseColor} rounded-full`}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.6, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
              <Icon
                className={`w-3.5 h-3.5 ${
                  status === "connecting" ? "animate-spin" : ""
                }`}
              />
              <span className="text-xs font-medium">{config.label}</span>
            </Badge>
          </TooltipTrigger>
          {showDetails && (
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-1">
                <p className="text-xs font-semibold">{config.label}</p>
                {lastMessageTime && status === "connected" && (
                  <p className="text-xs text-gray-400">
                    Last activity: {formatTimeAgo(lastMessageTime)}
                  </p>
                )}
                {(status === "disconnected" || status === "error") && onReconnect && (
                  <p className="text-xs text-gray-400">
                    Click to reconnect
                  </p>
                )}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full variant - detailed status card
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-center justify-between
        px-4 py-3 rounded-lg border
        ${config.bgClass} ${config.borderClass}
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Icon with pulse */}
        <div className="relative">
          <div
            className={`
              w-10 h-10 rounded-full
              flex items-center justify-center
              bg-white shadow-sm
            `}
          >
            <Icon
              className={`w-5 h-5 ${config.iconColor} ${
                status === "connecting" ? "animate-spin" : ""
              }`}
            />
          </div>
          {status === "connected" && (
            <motion.span
              className={`absolute -top-0.5 -right-0.5 w-3 h-3 ${config.pulseColor} rounded-full border-2 border-white`}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.6, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </div>

        {/* Status info */}
        <div>
          <h4 className={`text-sm font-semibold ${config.textClass}`}>
            {config.label}
          </h4>
          {showDetails && (
            <p className="text-xs text-gray-600 mt-0.5">
              {status === "connected" && "Real-time updates active"}
              {status === "connecting" && "Establishing connection..."}
              {status === "disconnected" && "Connection lost"}
              {status === "error" && "Unable to connect"}
            </p>
          )}
          {lastMessageTime && status === "connected" && (
            <p className="text-xs text-gray-500 mt-1">
              Last update: {formatTimeAgo(lastMessageTime)}
            </p>
          )}
        </div>
      </div>

      {/* Reconnect button */}
      {(status === "disconnected" || status === "error") && onReconnect && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReconnect}
          className="ml-4"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reconnect
        </Button>
      )}

      {/* Connection success checkmark */}
      {status === "connected" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * WebSocket Status Bar Component
 *
 * Sticky status bar for top/bottom of page
 */
interface WebSocketStatusBarProps {
  status: WebSocketStatus;
  onReconnect?: () => void;
  position?: "top" | "bottom";
  autoHide?: boolean;
  className?: string;
}

export function WebSocketStatusBar({
  status,
  onReconnect,
  position = "top",
  autoHide = true,
  className = ""
}: WebSocketStatusBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide when connected
  useEffect(() => {
    if (autoHide && status === "connected") {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [status, autoHide]);

  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          bg: "bg-emerald-600",
          text: "Real-time updates active",
          icon: CheckCircle2,
        };
      case "connecting":
        return {
          bg: "bg-blue-600",
          text: "Connecting to real-time updates...",
          icon: RefreshCw,
        };
      case "disconnected":
        return {
          bg: "bg-gray-600",
          text: "Real-time updates disconnected",
          icon: WifiOff,
        };
      case "error":
        return {
          bg: "bg-red-600",
          text: "Connection error - real-time updates unavailable",
          icon: AlertCircle,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? -50 : 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === "top" ? -50 : 50 }}
          className={`
            fixed ${position === "top" ? "top-0" : "bottom-0"} left-0 right-0
            ${config.bg} text-white
            py-2 px-4
            z-50
            shadow-lg
            ${className}
          `}
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon
                className={`w-5 h-5 ${
                  status === "connecting" ? "animate-spin" : ""
                }`}
              />
              <span className="text-sm font-medium">{config.text}</span>
            </div>

            {(status === "disconnected" || status === "error") && onReconnect && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onReconnect}
                className="bg-white/20 hover:bg-white/30 border-white/30"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}

            {status === "connected" && autoHide && (
              <button
                onClick={() => setIsVisible(false)}
                className="text-white/80 hover:text-white text-sm"
              >
                Dismiss
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook for managing WebSocket connection status
 */
export function useWebSocketStatus(url?: string) {
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastMessageTime, setLastMessageTime] = useState<Date | undefined>();

  useEffect(() => {
    if (!url) return;

    setStatus("connecting");

    // TODO: Replace with actual WebSocket connection
    // const ws = new WebSocket(url);

    // Mock connection
    setTimeout(() => {
      setStatus("connected");
      setLastMessageTime(new Date());
    }, 1000);

    // ws.onopen = () => {
    //   setStatus("connected");
    // };

    // ws.onmessage = () => {
    //   setLastMessageTime(new Date());
    // };

    // ws.onerror = () => {
    //   setStatus("error");
    // };

    // ws.onclose = () => {
    //   setStatus("disconnected");
    // };

    // return () => {
    //   ws.close();
    // };
  }, [url]);

  const reconnect = () => {
    setStatus("connecting");
    // Reconnection logic here
  };

  return {
    status,
    lastMessageTime,
    reconnect,
  };
}

// Helper function
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
