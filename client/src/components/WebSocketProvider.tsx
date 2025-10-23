import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface WebSocketContextValue {
  socket: Socket | null;
  connected: boolean;
  onlineUsers: Map<string, "online" | "away" | "offline">;
  typingUsers: Map<string, string[]>;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return context;
}

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, "online" | "away" | "offline">>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    // Only initialize socket if authenticated
    if (!isAuthenticated || !user) {
      // Disconnect if already connected
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Don't create a new socket if one already exists
    if (socketRef.current) {
      return;
    }

    console.log("Initializing WebSocket connection...");

    // Create single socket instance
    // Authentication is handled via session cookies, not client-provided data
    const socket = io({
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true, // Important: send cookies for session auth
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("✅ WebSocket connected");
      setConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ WebSocket disconnected:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error.message);
      setConnected(false);
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

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up WebSocket connection...");
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, user, toast]);

  const value: WebSocketContextValue = {
    socket: socketRef.current,
    connected,
    onlineUsers,
    typingUsers,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
