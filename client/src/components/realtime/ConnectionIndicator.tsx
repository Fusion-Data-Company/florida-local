import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConnectionIndicatorProps {
  variant?: 'badge' | 'icon-only';
  showLabel?: boolean;
}

export function ConnectionIndicator({
  variant = 'badge',
  showLabel = true
}: ConnectionIndicatorProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    let heartbeatInterval: NodeJS.Timeout;

    const connect = () => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

      try {
        const websocket = new WebSocket(wsUrl);

        websocket.onopen = () => {
          setIsConnected(true);
          setIsReconnecting(false);

          // Send heartbeat every 30 seconds
          heartbeatInterval = setInterval(() => {
            if (websocket.readyState === WebSocket.OPEN) {
              websocket.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);
        };

        websocket.onclose = () => {
          setIsConnected(false);
          clearInterval(heartbeatInterval);

          // Attempt to reconnect after 5 seconds
          setIsReconnecting(true);
          reconnectTimeout = setTimeout(() => {
            connect();
          }, 5000);
        };

        websocket.onerror = () => {
          setIsConnected(false);
        };

        setWs(websocket);
      } catch (error) {
        setIsConnected(false);
        setIsReconnecting(true);
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      clearInterval(heartbeatInterval);
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const getStatusInfo = () => {
    if (isReconnecting) {
      return {
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        label: "Reconnecting",
        color: "bg-yellow-500",
        badgeClass: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
        tooltip: "Attempting to reconnect to real-time updates...",
      };
    }

    if (isConnected) {
      return {
        icon: <Wifi className="h-3 w-3" />,
        label: "Live",
        color: "bg-green-500",
        badgeClass: "bg-green-500/10 text-green-700 border-green-500/30",
        tooltip: "Connected to real-time updates",
      };
    }

    return {
      icon: <WifiOff className="h-3 w-3" />,
      label: "Offline",
      color: "bg-red-500",
      badgeClass: "bg-red-500/10 text-red-700 border-red-500/30",
      tooltip: "Not connected to real-time updates",
    };
  };

  const status = getStatusInfo();

  if (variant === 'icon-only') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <motion.div
                className={`w-2 h-2 rounded-full ${status.color}`}
                animate={{
                  scale: isConnected && !isReconnecting ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: isConnected && !isReconnecting ? Infinity : 0,
                }}
              />
              {isConnected && !isReconnecting && (
                <motion.div
                  className={`absolute inset-0 rounded-full ${status.color} opacity-75`}
                  animate={{
                    scale: [1, 2, 2],
                    opacity: [0.75, 0, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{status.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${status.badgeClass} cursor-help transition-all duration-300`}
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <motion.div
                  className={`w-2 h-2 rounded-full ${status.color}`}
                  animate={{
                    scale: isConnected && !isReconnecting ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 2,
                    repeat: isConnected && !isReconnecting ? Infinity : 0,
                  }}
                />
                {isConnected && !isReconnecting && (
                  <motion.div
                    className={`absolute inset-0 rounded-full ${status.color} opacity-75`}
                    animate={{
                      scale: [1, 2, 2],
                      opacity: [0.75, 0, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                )}
              </div>
              {showLabel && (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={status.label}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className="text-xs font-semibold"
                  >
                    {status.label}
                  </motion.span>
                </AnimatePresence>
              )}
              {status.icon}
            </div>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{status.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
