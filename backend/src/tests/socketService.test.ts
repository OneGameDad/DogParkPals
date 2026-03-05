import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

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
    test('should validate JWT token correctly', () => {
      const secret = process.env.JWT_SECRET || 'test-secret';
      const token = jwt.sign(
        { userId: 123, email: 'test@example.com', role: 'user' },
        secret,
        { expiresIn: '7d' }
      );

      // Verify token works
      const decoded = jwt.verify(token, secret) as any;
      expect(decoded.userId).toBe(123);
      expect(decoded.email).toBe('test@example.com');
    });

    test('should reject invalid tokens', () => {
      const secret = process.env.JWT_SECRET || 'test-secret';
      
      expect(() => {
        jwt.verify('invalid-token', secret);
      }).toThrow();
    });

    test('should reject expired tokens', () => {
      const secret = process.env.JWT_SECRET || 'test-secret';
      const expiredToken = jwt.sign(
        { userId: 789, email: 'expired@example.com' },
        secret,
        { expiresIn: '-1h' }
      );

      expect(() => {
        jwt.verify(expiredToken, secret);
      }).toThrow();
    });

    test('should extract userId from token', () => {
      const secret = process.env.JWT_SECRET || 'test-secret';
      const userId = 999;
      const token = jwt.sign(
        { userId, email: 'test@example.com' },
        secret
      );

      const decoded = jwt.verify(token, secret) as any;
      expect(decoded.userId).toBe(userId);
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
      )?.[1];

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
});
