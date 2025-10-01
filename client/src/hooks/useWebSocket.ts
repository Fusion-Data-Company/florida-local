import { useEffect, useRef } from "react";
import { useWebSocketContext } from "@/components/WebSocketProvider";
import { Socket } from "socket.io-client";

interface WebSocketHook {
  socket: Socket | null;
  connected: boolean;
  onlineUsers: Map<string, "online" | "away" | "offline">;
  typingUsers: Map<string, string[]>;
}

export function useWebSocket(): WebSocketHook {
  const context = useWebSocketContext();
  
  return {
    socket: context.socket,
    connected: context.connected,
    onlineUsers: context.onlineUsers,
    typingUsers: context.typingUsers,
  };
}

export function useTyping(conversationId: string) {
  const { socket } = useWebSocketContext();
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
  const { socket } = useWebSocketContext();

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
