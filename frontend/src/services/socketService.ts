import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../constants';
import api from './api';
import type { MessageStatus, Messages } from '../types';

export interface Notification {
  id: number;
  type: string;
  payload: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export interface MessageStatusUpdate {
  messageId: number;
  status: MessageStatus;
}

export interface TypingIndicator {
  senderId: number;
}

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false; // Prevent multiple simultaneous connection attempts

  /**
   * Initialize and connect to Socket.io server
   */
  async connect(): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('Connection already in progress, waiting...');
      // Wait for the current connection attempt to complete
      const maxWaitTime = 10000; // 10 seconds max timeout
      const startTime = Date.now();
      while (this.isConnecting && Date.now() - startTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.isConnecting = true;

    try {
      // Get auth token for Socket.io
      this.token = await this.getSocketToken();
      
      if (!this.token) {
        console.warn('No auth token available, skipping socket connection');
        this.isConnecting = false;
        return;
      }

      // Create socket connection
      // Socket.io handles protocol upgrade from HTTP to WebSocket internally
      this.socket = io(API_BASE_URL, {
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
    } finally {
      this.isConnecting = false;
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
   * Subscribe to new message events
   */
  onNewMessage(callback: (message: Messages) => void): void {
    if (!this.socket) {
      console.warn('Socket not connected, cannot subscribe to new messages');
      return;
    }

    this.socket.on('message:new', callback);
  }

  /**
   * Unsubscribe from new message events
   */
  offNewMessage(callback: (message: Messages) => void): void {
    if (!this.socket) return;
    this.socket.off('message:new', callback);
  }

  /**
   * Subscribe to message status updates
   */
  onMessageStatus(callback: (update: MessageStatusUpdate) => void): void {
    if (!this.socket) {
      console.warn('Socket not connected, cannot subscribe to message status');
      return;
    }

    this.socket.on('message:status', callback);
  }

  /**
   * Unsubscribe from message status updates
   */
  offMessageStatus(callback: (update: MessageStatusUpdate) => void): void {
    if (!this.socket) return;
    this.socket.off('message:status', callback);
  }

  /**
   * Subscribe to typing start events
   */
  onTypingStart(callback: (data: TypingIndicator) => void): void {
    if (!this.socket) {
      console.warn('Socket not connected, cannot subscribe to typing events');
      return;
    }

    this.socket.on('typing:start', callback);
  }

  /**
   * Unsubscribe from typing start events
   */
  offTypingStart(callback: (data: TypingIndicator) => void): void {
    if (!this.socket) return;
    this.socket.off('typing:start', callback);
  }

  /**
   * Subscribe to typing stop events
   */
  onTypingStop(callback: (data: TypingIndicator) => void): void {
    if (!this.socket) {
      console.warn('Socket not connected, cannot subscribe to typing events');
      return;
    }

    this.socket.on('typing:stop', callback);
  }

  /**
   * Unsubscribe from typing stop events
   */
  offTypingStop(callback: (data: TypingIndicator) => void): void {
    if (!this.socket) return;
    this.socket.off('typing:stop', callback);
  }

  /**
   * Subscribe to message read events
   */
  onMessageRead(callback: (data: { messageId: number; readerId: number }) => void): void {
    if (!this.socket) {
      console.warn('Socket not connected, cannot subscribe to message read events');
      return;
    }

    this.socket.on('message:read', callback);
  }

  /**
   * Unsubscribe from message read events
   */
  offMessageRead(callback: (data: { messageId: number; readerId: number }) => void): void {
    if (!this.socket) return;
    this.socket.off('message:read', callback);
  }

  /**
   * Emit typing start event
   */
  emitTypingStart(receiverId: number): void {
    if (!this.socket) {
      console.warn('Socket not connected, cannot emit typing event');
      return;
    }

    this.socket.emit('typing:start', { receiverId });
  }

  /**
   * Emit typing stop event
   */
  emitTypingStop(receiverId: number): void {
    if (!this.socket) {
      console.warn('Socket not connected, cannot emit typing event');
      return;
    }

    this.socket.emit('typing:stop', { receiverId });
  }

  /**
   * Emit message read event
   */
  emitMessageRead(messageId: number, senderId: number): void {
    if (!this.socket) {
      console.warn('Socket not connected, cannot emit message read event');
      return;
    }

    this.socket.emit('message:read', { messageId, senderId });
  }

  /**
   * Disconnect from socket and clear all listeners
   */
  disconnect(): void {
    if (this.socket) {
      // Remove all listeners to prevent accumulation
      this.socket.removeAllListeners('notification');
      this.socket.removeAllListeners('message:new');
      this.socket.removeAllListeners('message:status');
      this.socket.removeAllListeners('typing:start');
      this.socket.removeAllListeners('typing:stop');
      this.socket.removeAllListeners('message:read');
      this.socket.removeAllListeners('account_deleted');
      
      // Disconnect the socket
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
      this.reconnectAttempts = 0;
      console.log('Socket disconnected and all listeners cleared');
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
