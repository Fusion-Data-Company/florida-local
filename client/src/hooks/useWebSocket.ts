import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface WebSocketHook {
  socket: Socket | null;
  connected: boolean;
  onlineUsers: Map<string, "online" | "away" | "offline">;
  typingUsers: Map<string, string[]>; // conversationId -> userIds
}

export function useWebSocket(): WebSocketHook {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, "online" | "away" | "offline">>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Initialize socket connection
    const socket = io({
      auth: {
        userId: user.claims.sub,
        token: user.access_token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("WebSocket connected");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    // Notification events
    socket.on("notification", (notification) => {
      toast({
        title: notification.title,
        description: notification.message,
      });
    });

    // Presence events
    socket.on("presence:updated", ({ userId, status }) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        next.set(userId, status);
        return next;
      });
    });

    // Typing events
    socket.on("typing:start", ({ userId, conversationId }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        const typing = next.get(conversationId) || [];
        if (!typing.includes(userId)) {
          next.set(conversationId, [...typing, userId]);
        }
        return next;
      });
    });

    socket.on("typing:stop", ({ userId, conversationId }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        const typing = next.get(conversationId) || [];
        next.set(conversationId, typing.filter(id => id !== userId));
        return next;
      });
    });

    // Message events
    socket.on("message:new", (message) => {
      // Trigger refetch in message queries
      window.dispatchEvent(new CustomEvent("new-message", { detail: message }));
    });

    // Business events
    socket.on("business:update", (update) => {
      // Trigger refetch in business queries
      window.dispatchEvent(new CustomEvent("business-update", { detail: update }));
    });

    // Order events
    socket.on("order:update", (order) => {
      toast({
        title: "Order Updated",
        description: `Order #${order.id.slice(-8)} is now ${order.status}`,
      });
      // Trigger refetch in order queries
      window.dispatchEvent(new CustomEvent("order-update", { detail: order }));
    });

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user, toast]);

  return {
    socket: socketRef.current,
    connected,
    onlineUsers,
    typingUsers,
  };
}

// Helper hooks for specific features
export function useTyping(conversationId: string) {
  const { socket } = useWebSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const startTyping = () => {
    if (!socket || !conversationId) return;
    
    socket.emit("typing:start", { conversationId });
    
    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (!socket || !conversationId) return;
    
    socket.emit("typing:stop", { conversationId });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [conversationId]);

  return { startTyping, stopTyping };
}

export function usePresence() {
  const { socket } = useWebSocket();

  const updatePresence = (status: "online" | "away" | "offline") => {
    if (!socket) return;
    socket.emit("presence:update", status);
  };

  // Auto-update presence on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence("away");
      } else {
        updatePresence("online");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Set initial online status
    updatePresence("online");

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [socket]);

  return { updatePresence };
}
