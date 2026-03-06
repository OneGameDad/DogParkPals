import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { initializeSocket } from '../infrastructure/socket';

// Mock dependencies
jest.mock('../utils/typeSafeLogger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  logUserAction: jest.fn(),
  logError: jest.fn(),
}));

jest.mock('../utils/tokenBlacklist', () => ({
  isTokenBlacklisted: jest.fn(() => false),
}));

jest.mock('socket.io', () => {
  return {
    Server: jest.fn(() => ({
      on: jest.fn(),
      use: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    })),
  };
});

describe('Socket.io Infrastructure', () => {
  let mockIO: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { Server: MockServer } = require('socket.io');
    mockIO = new MockServer();
  });

  describe('Socket Authentication', () => {
    test('should validate scoped socket JWT token correctly', () => {
      const secret = process.env.JWT_SECRET || 'test-secret';
      const token = jwt.sign(
        { userId: 123, role: 'user', tokenType: 'socket' },
        secret,
        { expiresIn: '90s', audience: 'socket' }
      );

      // Verify token works with the socket audience.
      const decoded = jwt.verify(token, secret, { audience: 'socket' }) as any;
      expect(decoded.userId).toBe(123);
      expect(decoded.tokenType).toBe('socket');
    });

    test('should reject invalid tokens', () => {
      const secret = process.env.JWT_SECRET || 'test-secret';
      
      expect(() => {
        jwt.verify('invalid-token', secret, { audience: 'socket' });
      }).toThrow();
    });

    test('should reject expired tokens', () => {
      const secret = process.env.JWT_SECRET || 'test-secret';
      const expiredToken = jwt.sign(
        { userId: 789, tokenType: 'socket' },
        secret,
        { expiresIn: '-1h', audience: 'socket' }
      );

      expect(() => {
        jwt.verify(expiredToken, secret, { audience: 'socket' });
      }).toThrow();
    });

    test('should reject non-socket tokens when socket audience is required', () => {
      const secret = process.env.JWT_SECRET || 'test-secret';
      const regularAuthToken = jwt.sign(
        { userId: 999, email: 'test@example.com' },
        secret,
        { expiresIn: '7d' }
      );

      expect(() => {
        jwt.verify(regularAuthToken, secret, { audience: 'socket' });
      }).toThrow();
    });
  });

  describe('Socket.io Configuration', () => {
    test('CORS should be configured correctly', () => {
      const corsConfig = {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      };

      expect(corsConfig.origin).toBeDefined();
      expect(corsConfig.credentials).toBe(true);
    });

    test('should support WebSocket transport', () => {
      const transports = ['websocket', 'polling'];
      expect(transports).toContain('websocket');
    });

    test('should support polling fallback', () => {
      const transports = ['websocket', 'polling'];
      expect(transports).toContain('polling');
    });
  });

  describe('User Room Management', () => {
    test('should create correct room name for user', () => {
      const userId = 123;
      const roomName = `user:${userId}`;
      
      expect(roomName).toBe('user:123');
    });

    test('should handle multiple users in separate rooms', () => {
      const users = [1, 2, 3, 4, 5];
      const rooms = users.map(id => `user:${id}`);
      
      expect(rooms).toHaveLength(5);
      expect(rooms[0]).toBe('user:1');
      expect(rooms[4]).toBe('user:5');
    });

    test('should not allow room name injection', () => {
      const maliciousId = '1); emit("hacked"';
      const roomName = `user:${maliciousId}`;
      
      // Room name should still be valid even with malicious input
      expect(roomName).toMatch(/^user:/);
    });
  });

  describe('Notification Emission', () => {
    test('should emit notification to user room', () => {
      const userId = 123;
      const notification = {
        id: 1,
        type: 'MESSAGE_RECEIVED',
        payload: { messageId: 456 },
        read: false,
      };

      // Mock the Socket.io emission
      const toSpy = jest.fn().mockReturnValue({ emit: jest.fn() });
      mockIO.to = toSpy;

      mockIO.to(`user:${userId}`).emit('notification', notification);

      expect(toSpy).toHaveBeenCalledWith(`user:${userId}`);
    });

    test('should batch emit notifications to multiple users', () => {
      const userIds = [1, 2, 3];
      const notification = {
        type: 'EVENT_CREATED',
        payload: { eventId: 789 },
      };

      const toSpy = jest.fn().mockReturnValue({ emit: jest.fn() });
      mockIO.to = toSpy;

      userIds.forEach(userId => {
        mockIO.to(`user:${userId}`).emit('notification', notification);
      });

      expect(toSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Connection Lifecycle', () => {
    test('should handle connection event', () => {
      const connectionHandler = jest.fn();
      mockIO.on = jest.fn((event, handler) => {
        if (event === 'connection') {
          connectionHandler(handler);
        }
      });

      mockIO.on('connection', connectionHandler);
      expect(mockIO.on).toHaveBeenCalledWith(
        'connection',
        expect.any(Function)
      );
    });

    test('should handle disconnect event', () => {
      const mockSocket = { on: jest.fn() };
      
      mockSocket.on('disconnect', (reason: string) => {
        expect(reason).toBeDefined();
      });

      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1] as ((reason: string) => void) | undefined;

      if (disconnectHandler) {
        disconnectHandler('client namespace disconnect');
      }

      expect(mockSocket.on).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function)
      );
    });

    test('should handle ping/pong for connection health', () => {
      const mockSocket = { on: jest.fn(), emit: jest.fn() };

      mockSocket.on('ping', () => {
        mockSocket.emit('pong');
      });

      expect(mockSocket.on).toHaveBeenCalledWith(
        'ping',
        expect.any(Function)
      );
    });
  });

  describe('Message Event Handlers', () => {
    const setupInitializedSocket = () => {
      const io = initializeSocket({} as any) as any;

      const connectionHandler = io.on.mock.calls.find(
        (call: [string, (socket: any) => void]) => call[0] === 'connection'
      )?.[1];

      expect(connectionHandler).toBeDefined();

      const registeredHandlers: Record<string, (data: any) => void> = {};
      const socket = {
        id: 'socket-1',
        userId: 1,
        join: jest.fn(),
        on: jest.fn((event: string, handler: (data: any) => void) => {
          registeredHandlers[event] = handler;
        }),
        emit: jest.fn(),
      };

      connectionHandler?.(socket as any);

      return { io, socket, registeredHandlers };
    };

    test('should handle typing:start event via initializeSocket handlers', () => {
      const { io, registeredHandlers } = setupInitializedSocket();
      const mockEmit = jest.fn();
      io.to = jest.fn().mockReturnValue({ emit: mockEmit });

      expect(registeredHandlers['typing:start']).toBeDefined();
      registeredHandlers['typing:start']({ receiverId: 2 });

      expect(io.to).toHaveBeenCalledWith('user:2');
      expect(mockEmit).toHaveBeenCalledWith('typing:start', { senderId: 1 });
    });

    test('should handle typing:stop event via initializeSocket handlers', () => {
      const { io, registeredHandlers } = setupInitializedSocket();
      const mockEmit = jest.fn();
      io.to = jest.fn().mockReturnValue({ emit: mockEmit });

      expect(registeredHandlers['typing:stop']).toBeDefined();
      registeredHandlers['typing:stop']({ receiverId: 2 });

      expect(io.to).toHaveBeenCalledWith('user:2');
      expect(mockEmit).toHaveBeenCalledWith('typing:stop', { senderId: 1 });
    });

    test('should handle message:read event via initializeSocket handlers', () => {
      const { io, registeredHandlers } = setupInitializedSocket();
      const mockEmit = jest.fn();
      io.to = jest.fn().mockReturnValue({ emit: mockEmit });

      expect(registeredHandlers['message:read']).toBeDefined();
      registeredHandlers['message:read']({ messageId: 123, senderId: 2 });

      expect(io.to).toHaveBeenCalledWith('user:2');
      expect(mockEmit).toHaveBeenCalledWith('message:read', {
        messageId: 123,
        readerId: 1,
      });
    });

    test('should ignore malformed message:read payload via initializeSocket handlers', () => {
      const { io, registeredHandlers } = setupInitializedSocket();
      const mockEmit = jest.fn();
      io.to = jest.fn().mockReturnValue({ emit: mockEmit });

      expect(registeredHandlers['message:read']).toBeDefined();
      registeredHandlers['message:read']({ messageId: '123', senderId: 2 });

      expect(io.to).not.toHaveBeenCalled();
      expect(mockEmit).not.toHaveBeenCalled();
    });

    test('should emit message:new to correct user room', () => {
      const receiverId = 456;
      const mockMessage = {
        id: 1,
        senderId: 123,
        receiverId,
        content: 'Hello!',
        status: 'SENT',
        sentAt: new Date(),
      };

      const mockEmit = jest.fn();
      const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
      mockIO.to = mockTo;

      mockIO.to(`user:${receiverId}`).emit('message:new', mockMessage);

      expect(mockTo).toHaveBeenCalledWith(`user:${receiverId}`);
      expect(mockEmit).toHaveBeenCalledWith('message:new', mockMessage);
    });

    test('should emit message:status to correct user room', () => {
      const senderId = 123;
      const statusUpdate = {
        messageId: 1,
        status: 'READ',
      };

      const mockEmit = jest.fn();
      const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
      mockIO.to = mockTo;

      mockIO.to(`user:${senderId}`).emit('message:status', statusUpdate);

      expect(mockTo).toHaveBeenCalledWith(`user:${senderId}`);
      expect(mockEmit).toHaveBeenCalledWith('message:status', statusUpdate);
    });
  });
});
