import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Server as HTTPServer } from "http";
import { redis, redisSubscriber } from "./redis";
import { logger, trackEvent } from "./monitoring";
import { storage } from "./storage";
import { initializeSession } from "./session";
import { config } from "./config";
import passport from "passport";

export let io: SocketIOServer;

interface AuthenticatedSocket extends SocketIOServer {
  userId?: string;
  businessId?: string;
}

// Wrap session middleware for Socket.IO
function wrap(middleware: any) {
  return (socket: any, next: any) => middleware(socket.request, {}, next);
}

export async function initWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? (process.env.REPLIT_DOMAINS || '').split(',').map(d => `https://${d.trim()}`)
        : true,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Get session middleware and wrap it for Socket.IO
  const { middleware: sessionMiddleware } = await initializeSession(config);
  io.use(wrap(sessionMiddleware));
  io.use(wrap(passport.initialize()));
  io.use(wrap(passport.session()));

  // Handle late Redis availability - attach adapter when Redis becomes ready
  const attachRedisAdapter = () => {
    if (redis.status === "ready" && redisSubscriber.status === "ready") {
      try {
        io.adapter(createAdapter(redis, redisSubscriber));
        logger.info("✅ Socket.IO using Redis adapter");
      } catch (error) {
        logger.error("Failed to attach Redis adapter", { error });
      }
    }
  };

  // Try to attach adapter immediately if Redis is already ready
  attachRedisAdapter();

  // Listen for Redis ready events to attach adapter later if needed
  redis.on("ready", () => {
    logger.info("Redis became ready, attempting to attach adapter");
    attachRedisAdapter();
  });

  // CRITICAL SECURITY FIX: Verify session and extract userId from verified session
  io.use(async (socket: any, next) => {
    try {
      // Get the request object which has session and user data from passport
      const req = socket.request;

      // Check if user is authenticated via session
      if (!req.user || !req.isAuthenticated || !req.isAuthenticated()) {
        logger.warn("WebSocket connection rejected: Not authenticated");
        return next(new Error("Authentication required"));
      }

      // Extract userId from verified session (NOT from client)
      const userId = req.user.claims?.sub;
      if (!userId) {
        logger.warn("WebSocket connection rejected: No user ID in session");
        return next(new Error("Invalid session"));
      }

      // Verify user exists in database
      const user = await storage.getUserById(userId);
      if (!user) {
        logger.warn("WebSocket connection rejected: User not found", { userId });
        return next(new Error("User not found"));
      }

      // Attach verified user info to socket
      socket.userId = userId;
      socket.user = user;

      logger.info("WebSocket authentication successful", { userId, socketId: socket.id });
      next();
    } catch (error) {
      logger.error("Socket authentication error", { error });
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", async (socket: any) => {
    logger.info("Socket connected", { 
      socketId: socket.id, 
      userId: socket.userId 
    });

    // Track connection
    trackEvent(socket.userId, "websocket_connected", {
      socketId: socket.id,
    });

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Join business rooms if owner
    const businesses = await storage.getBusinessesByOwner(socket.userId);
    for (const business of businesses) {
      socket.join(`business:${business.id}`);
      socket.businessId = business.id;
    }

    // Handle joining conversation rooms
    socket.on("join:conversation", async (conversationId: string) => {
      try {
        // Verify user has access to conversation
        const hasAccess = await storage.userHasAccessToConversation(
          socket.userId,
          conversationId
        );

        if (hasAccess) {
          socket.join(`conversation:${conversationId}`);
          
          logger.info("User joined conversation", { 
            userId: socket.userId, 
            conversationId 
          });
          
          // Notify others in conversation
          socket.to(`conversation:${conversationId}`).emit("user:joined", {
            userId: socket.userId,
            conversationId,
          });
        } else {
          logger.warn("User denied access to conversation", { 
            userId: socket.userId, 
            conversationId 
          });
        }
      } catch (error) {
        logger.error("Error joining conversation", { error, conversationId });
      }
    });

    // Handle leaving conversation rooms
    socket.on("leave:conversation", async (conversationId: string) => {
      try {
        socket.leave(`conversation:${conversationId}`);
        
        logger.info("User left conversation", { 
          userId: socket.userId, 
          conversationId 
        });
        
        // Notify others in conversation
        socket.to(`conversation:${conversationId}`).emit("user:left", {
          userId: socket.userId,
          conversationId,
        });
      } catch (error) {
        logger.error("Error leaving conversation", { error, conversationId });
      }
    });

    // Handle typing indicators
    socket.on("typing:start", (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:start", {
        userId: socket.userId,
        conversationId: data.conversationId,
      });
    });

    socket.on("typing:stop", (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:stop", {
        userId: socket.userId,
        conversationId: data.conversationId,
      });
    });

    // Handle online presence
    socket.on("presence:update", async (status: "online" | "away" | "offline") => {
      try {
        // Update user's online status
        await storage.updateUserOnlineStatus(socket.userId, status);

        // Broadcast to user's connections
        const connections = await storage.getUserConnections(socket.userId);
        for (const connectionId of connections) {
          io.to(`user:${connectionId}`).emit("presence:updated", {
            userId: socket.userId,
            status,
          });
        }
      } catch (error) {
        logger.error("Error updating presence", { error });
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      logger.info("Socket disconnected", { 
        socketId: socket.id, 
        userId: socket.userId 
      });

      // Update user's offline status
      await storage.updateUserOnlineStatus(socket.userId, "offline");

      // Notify connections
      const connections = await storage.getUserConnections(socket.userId);
      for (const connectionId of connections) {
        io.to(`user:${connectionId}`).emit("presence:updated", {
          userId: socket.userId,
          status: "offline",
        });
      }

      // Track disconnection
      trackEvent(socket.userId, "websocket_disconnected", {
        socketId: socket.id,
      });
    });
  });

  // Graceful shutdown handlers
  const gracefulShutdown = async () => {
    logger.info("WebSocket server shutting down gracefully...");
    
    // Close all connections
    io.close(() => {
      logger.info("✅ WebSocket server closed");
    });
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  logger.info("✅ WebSocket server initialized");
}

// Send notification to user
export function sendNotification(
  userId: string,
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }
) {
  io.to(`user:${userId}`).emit("notification", notification);
}

// Send message to conversation
export function sendMessage(
  conversationId: string,
  message: {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
  }
) {
  io.to(`conversation:${conversationId}`).emit("message:new", message);
}

// Broadcast business update
export function broadcastBusinessUpdate(
  businessId: string,
  update: {
    type: "profile" | "product" | "post" | "spotlight";
    data: any;
  }
) {
  io.to(`business:${businessId}`).emit("business:update", update);
}

// Broadcast order update
export function broadcastOrderUpdate(
  userId: string,
  order: {
    id: string;
    status: string;
    total: string;
  }
) {
  io.to(`user:${userId}`).emit("order:update", order);
}

// Get online users count
export async function getOnlineUsersCount(): Promise<number> {
  const sockets = await io.fetchSockets();
  return sockets.length;
}

// Get user's active sockets
export async function getUserSockets(userId: string): Promise<string[]> {
  const sockets = await io.in(`user:${userId}`).fetchSockets();
  return sockets.map(s => s.id);
}
