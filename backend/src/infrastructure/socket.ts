import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { isTokenBlacklisted } from "../utils/tokenBlacklist";
import typeSafeLogger from "../utils/typeSafeLogger";

interface JwtPayload {
  userId: number;
  email?: string;
  role?: string;
  tokenType?: string;
}

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

export function initializeSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
    // Enable fallback to long-polling if WebSocket fails
    transports: ["websocket", "polling"],
  });

  // Authentication middleware for Socket.io
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      // Get token from handshake auth or query
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        typeSafeLogger.warn("Socket connection attempt without token", {
          socketId: socket.id,
        });
        return next(new Error("Authentication required"));
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        typeSafeLogger.error("JWT_SECRET not configured");
        return next(new Error("Server configuration error"));
      }

      // Verify that this is a dedicated socket token, not the main session token.
      const decoded = jwt.verify(token as string, secret, {
        audience: "socket",
      }) as JwtPayload;

      if (decoded.tokenType !== "socket" || !decoded.userId) {
        typeSafeLogger.warn("Socket connection attempt with invalid token scope", {
          socketId: socket.id,
        });
        return next(new Error("Invalid token"));
      }

      // Check if token is blacklisted
      if (isTokenBlacklisted(token as string)) {
        typeSafeLogger.warn("Socket connection attempt with blacklisted token", {
          socketId: socket.id,
          userId: decoded.userId,
        });
        return next(new Error("Invalid token"));
      }

      // Attach userId to socket
      socket.userId = decoded.userId;

      typeSafeLogger.info("Socket authenticated", {
        socketId: socket.id,
        userId: decoded.userId,
      });

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        typeSafeLogger.warn("Invalid JWT token in socket connection", {
          socketId: socket.id,
          error: error.message,
        });
        return next(new Error("Invalid token"));
      }
      if (error instanceof jwt.TokenExpiredError) {
        typeSafeLogger.warn("Expired JWT token in socket connection", {
          socketId: socket.id,
        });
        return next(new Error("Token expired"));
      }
      typeSafeLogger.error("Socket authentication error", {
        socketId: socket.id,
        error,
      });
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId;

    typeSafeLogger.info("User connected via socket", {
      socketId: socket.id,
      userId,
    });

    // Join user to their personal room for targeted notifications
    if (userId) {
      socket.join(`user:${userId}`);
      typeSafeLogger.debug("User joined personal room", {
        socketId: socket.id,
        userId,
        room: `user:${userId}`,
      });
    }

    // Handle typing indicator
    socket.on("typing:start", (data: { receiverId: number }) => {
      typeSafeLogger.debug("User started typing", {
        socketId: socket.id,
        userId,
        receiverId: data.receiverId,
      });
      io.to(`user:${data.receiverId}`).emit("typing:start", {
        senderId: userId,
      });
    });

    socket.on("typing:stop", (data: { receiverId: number }) => {
      typeSafeLogger.debug("User stopped typing", {
        socketId: socket.id,
        userId,
        receiverId: data.receiverId,
      });
      io.to(`user:${data.receiverId}`).emit("typing:stop", {
        senderId: userId,
      });
    });

    // Handle message read receipt
    socket.on("message:read", (data: { messageId: number; senderId: number }) => {
      typeSafeLogger.debug("Message read receipt", {
        socketId: socket.id,
        userId,
        messageId: data.messageId,
        senderId: data.senderId,
      });
      io.to(`user:${data.senderId}`).emit("message:read", {
        messageId: data.messageId,
        readerId: userId,
      });
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      typeSafeLogger.info("User disconnected", {
        socketId: socket.id,
        userId,
        reason,
      });
    });

    // Optional: Handle ping/pong for connection health
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  typeSafeLogger.info("Socket.io initialized");

  return io;
}
