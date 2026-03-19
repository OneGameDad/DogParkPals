import { Server as SocketServer, Socket } from "socket.io";
import typeSafeLogger from "../utils/typeSafeLogger";

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

class SessionManager {
  private io: SocketServer | null = null;
  private userSessions: Map<number, Set<string>> = new Map(); // userId -> Set of socketIds

  /**
   * Initialize the session manager with a Socket.io server instance
   */
  setSocketServer(io: SocketServer): void {
    this.io = io;
  }

  /**
   * Register a socket connection for a user
   */
  registerSession(userId: number, socketId: string): void {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)?.add(socketId);
    typeSafeLogger.logUserAction("Session registered", { userId, socketId });
  }

  /**
   * Unregister a socket connection for a user
   */
  unregisterSession(userId: number, socketId: string): void {
    const sessions = this.userSessions.get(userId);
    if (sessions) {
      sessions.delete(socketId);
      if (sessions.size === 0) {
        this.userSessions.delete(userId);
      }
    }
    typeSafeLogger.logUserAction("Session unregistered", { userId, socketId });
  }

  /**
   * Get all active socket connections for a user
   */
  getUserSessions(userId: number): string[] {
    return Array.from(this.userSessions.get(userId) || []);
  }

  /**
   * Check if a user has any active sessions
   */
  hasActiveSessions(userId: number): boolean {
    return (this.userSessions.get(userId)?.size || 0) > 0;
  }

  /**
   * Disconnect all socket connections for a user (used on user deletion)
   * Emits a special "user_deleted" event and then forcibly disconnects
   */
  async disconnectUserSessions(userId: number, reason: string = "User account deleted"): Promise<void> {
    if (!this.io) {
      typeSafeLogger.warn("Socket.io server not initialized in SessionManager", { userId });
      return;
    }

    const socketIds = this.getUserSessions(userId);

    if (socketIds.length === 0) {
      typeSafeLogger.logUserAction("No active sessions to disconnect", { userId });
      return;
    }

    typeSafeLogger.logUserAction("Disconnecting user sessions", { userId, count: socketIds.length });

    // Get all socket adapters and disconnect each one
    for (const socketId of socketIds) {
      try {
        const socket = this.io.sockets.sockets.get(socketId) as AuthenticatedSocket | undefined;
        if (socket) {
          // Emit a notification to the client before disconnecting
          socket.emit("account_deleted", { reason });
          // Disconnect the socket
          socket.disconnect(true);
          typeSafeLogger.logUserAction("Socket disconnected", { userId, socketId });
        }
      } catch (error) {
        typeSafeLogger.logError("Failed to disconnect socket", error as Error, { userId, socketId });
      }
    }

    // Clear the user's sessions from memory
    this.userSessions.delete(userId);
    typeSafeLogger.logUserAction("All user sessions cleared", { userId });
  }

  /**
   * Clear all sessions (useful for testing or shutdown)
   */
  clearAll(): void {
    this.userSessions.clear();
    typeSafeLogger.info("All sessions cleared");
  }

  /**
   * Get total number of active sessions across all users
   */
  getTotalActiveSessions(): number {
    let total = 0;
    for (const sessions of this.userSessions.values()) {
      total += sessions.size;
    }
    return total;
  }

  /**
   * Get session statistics (for monitoring/debugging)
   */
  getSessionStats(): { totalUsers: number; totalSessions: number } {
    let totalSessions = 0;
    for (const sessions of this.userSessions.values()) {
      totalSessions += sessions.size;
    }
    return {
      totalUsers: this.userSessions.size,
      totalSessions,
    };
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
