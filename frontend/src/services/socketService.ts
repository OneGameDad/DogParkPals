import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../constants';
import api from './api';

export interface Notification {
  id: number;
  type: string;
  payload: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Initialize and connect to Socket.io server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    try {
      // Get auth token for Socket.io
      this.token = await this.getSocketToken();
      
      if (!this.token) {
        console.warn('No auth token available, skipping socket connection');
        return;
      }

      // Create socket connection
      // Socket.io connects to the base URL (not /api endpoint)
      // Convert http/https to ws/wss for WebSocket protocol
      const baseUrl = API_BASE_URL.replace(/^http/, 'ws');
      
      this.socket = io(baseUrl, {
        auth: {
          token: this.token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventHandlers();
      
      console.log('Socket.io connection initiated');
    } catch (error) {
      console.error('Failed to connect socket:', error);
    }
  }

  /**
   * Get auth token from backend for Socket.io authentication
   */
  private async getSocketToken(): Promise<string | null> {
    try {
      const response = await api.get<{ token: string }>('/auth/socket-token');
      return response.token;
    } catch (error) {
      console.error('Failed to get socket token:', error);
      return null;
    }
  }

  /**
   * Setup event handlers for socket connections
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      
      // Auto-reconnect if server initiated disconnect or network issue
      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, try to reconnect
        setTimeout(() => this.connect(), 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Handle reconnection attempts
    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`Socket reconnection attempt ${attempt}`);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });
  }

  /**
   * Subscribe to notification events
   */
  onNotification(callback: (notification: Notification) => void): void {
    if (!this.socket) {
      console.warn('Socket not connected, cannot subscribe to notifications');
      return;
    }

    this.socket.on('notification', callback);
  }

  /**
   * Unsubscribe from notification events
   */
  offNotification(callback: (notification: Notification) => void): void {
    if (!this.socket) return;
    this.socket.off('notification', callback);
  }

  /**
   * Disconnect from socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
      console.log('Socket disconnected');
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get the socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
