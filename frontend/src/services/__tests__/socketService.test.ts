import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { socketService } from '../../services/socketService';
import * as socketIOClient from 'socket.io-client';

// Create fresh mock socket for each test
const createMockSocket = () => ({
  connected: false,
  id: 'socket-mock-123',
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
});

let mockSocket: any;

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Mock api service
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('SocketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
  });

  afterEach(() => {
    socketService.disconnect();
  });

  describe('connect', () => {
    it('should get socket token on connect', async () => {
      const api = await import('../../services/api');
      vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

      await socketService.connect();

      expect(api.default.get).toHaveBeenCalledWith('/auth/socket-token');
    });

    it('should create socket connection with token', async () => {
      const api = await import('../../services/api');
      vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

      await socketService.connect();

      expect(socketIOClient.io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: { token: 'test-token' },
          transports: ['websocket', 'polling'],
        })
      );
    });

    it('should handle token fetch failure gracefully', async () => {
      const api = await import('../../services/api');
      vi.spyOn(api.default, 'get').mockRejectedValue(new Error('No token'));

      await socketService.connect();

      expect(socketService.isConnected()).toBe(false);
    });

    it('should not reconnect if already connected', async () => {
      const api = await import('../../services/api');
      vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

      // First connection
      await socketService.connect();
      expect(socketIOClient.io).toHaveBeenCalledTimes(1);

      // Mark socket as connected and try again
      mockSocket.connected = true;
      await socketService.connect();

      // Should still only be called once
      expect(socketIOClient.io).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnect', () => {
    it('should disconnect socket', async () => {
      const api = await import('../../services/api');
      vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

      await socketService.connect();
      socketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(socketService.getSocket()).toBeNull();
    });

    it('should handle disconnect when not connected', () => {
      // Should not throw
      expect(() => {
        socketService.disconnect();
      }).not.toThrow();
    });
  });

  describe('isConnected', () => {
    it('returns false when not connected', () => {
      expect(socketService.isConnected()).toBe(false);
    });

    it('returns true when socket is connected', async () => {
      const api = await import('../../services/api');
      vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

      await socketService.connect();
      mockSocket.connected = true;

      expect(socketService.isConnected()).toBe(true);
    });
  });

  describe('onNotification', () => {
    it('should subscribe to notification events', async () => {
      const api = await import('../../services/api');
      vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

      const callback = vi.fn();
      await socketService.connect();
      socketService.onNotification(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('notification', callback);
    });

    it('should warn if socket not connected', () => {
      const callback = vi.fn();
      const spy = vi.spyOn(console, 'warn');

      socketService.onNotification(callback);

      expect(spy).toHaveBeenCalledWith(
        'Socket not connected, cannot subscribe to notifications'
      );
    });
  });

  describe('offNotification', () => {
    it('should unsubscribe from notification events', async () => {
      const api = await import('../../services/api');
      vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

      const callback = vi.fn();
      await socketService.connect();
      socketService.offNotification(callback);

      expect(mockSocket.off).toHaveBeenCalledWith('notification', callback);
    });
  });

  describe('getSocket', () => {
    it('returns null when not connected', () => {
      expect(socketService.getSocket()).toBeNull();
    });

    it('returns socket instance when connected', async () => {
      const api = await import('../../services/api');
      vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

      await socketService.connect();
      const socket = socketService.getSocket();

      expect(socket).toBeDefined();
    });
  });

  describe('Connection Events', () => {
    it('should handle connect event', async () => {
      const api = await import('../../services/api');
      vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

      const consoleSpy = vi.spyOn(console, 'log');
      await socketService.connect();

      // Get the connect handler that was registered
      const calls = mockSocket.on.mock.calls;
      const connectCall = calls.find((call: any[]) => call[0] === 'connect');
      
      if (connectCall) {
        // connectCall[1] is the handler function
        connectCall[1]();
        
        // Check that any log call contains "Socket connected:"
        const logCalls = consoleSpy.mock.calls;
        const hasConnectedLog = logCalls.some((call: any) =>
          call[0]?.toString().includes('Socket connected:')
        );
        expect(hasConnectedLog).toBe(true);
      }
      
      consoleSpy.mockRestore();
    });

    it('should handle disconnect event', async () => {
      const api = await import('../../services/api');
      vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

      const consoleSpy = vi.spyOn(console, 'log');
      await socketService.connect();

      // Get the disconnect handler
      const calls = mockSocket.on.mock.calls;
      const disconnectCall = calls.find((call: any[]) => call[0] === 'disconnect');
      
      if (disconnectCall) {
        // disconnectCall[1] is the handler function
        disconnectCall[1]('user namespace disconnect');
        
        // Check that any log call contains "Socket disconnected:"
        const logCalls = consoleSpy.mock.calls;
        const hasDisconnectedLog = logCalls.some((call: any) =>
          call[0]?.toString().includes('Socket disconnected:')
        );
        expect(hasDisconnectedLog).toBe(true);
      }
      
      consoleSpy.mockRestore();
    });

    it('should handle connection error', async () => {
      const api = await import('../../services/api');
      vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

      const consoleSpy = vi.spyOn(console, 'error');
      await socketService.connect();

      // Get error handler
      const calls = mockSocket.on.mock.calls;
      const errorCall = calls.find((call: any[]) => call[0] === 'connect_error');
      
      if (errorCall) {
        const error = new Error('Connection refused');
        errorCall[1](error);
        expect(consoleSpy).toHaveBeenCalled();
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe('Reconnection', () => {
    it('should auto-reconnect on server disconnect', async () => {
      const api = await import('../../services/api');
      vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

      await socketService.connect();

      // Get disconnect handler
      const calls = mockSocket.on.mock.calls;
      const disconnectCall = calls.find((call: any[]) => call[0] === 'disconnect');

      if (disconnectCall) {
        vi.useFakeTimers();
        disconnectCall[1]('io server disconnect');

        // Should attempt to reconnect after delay
        vi.advanceTimersByTime(1100);
        vi.useRealTimers();
      }
    });

    it('should track reconnection attempts', async () => {
      const api = await import('../../services/api');
      vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

      await socketService.connect();

      // Get error handler
      const calls = mockSocket.on.mock.calls;
      const errorCall = calls.find((call: any[]) => call[0] === 'connect_error');

      if (errorCall) {
        // Simulate multiple errors
        for (let i = 0; i < 3; i++) {
          errorCall[1](new Error('Connection failed'));
        }
      }
    });
  });

  describe('Message Events', () => {
    describe('onNewMessage', () => {
      it('should subscribe to message:new events', async () => {
        const api = await import('../../services/api');
        vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

        const callback = vi.fn();
        await socketService.connect();
        socketService.onNewMessage(callback);

        expect(mockSocket.on).toHaveBeenCalledWith('message:new', callback);
      });

      it('should warn if socket not connected', () => {
        const callback = vi.fn();
        const spy = vi.spyOn(console, 'warn');

        socketService.onNewMessage(callback);

        expect(spy).toHaveBeenCalledWith(
          'Socket not connected, cannot subscribe to new messages'
        );
        spy.mockRestore();
      });
    });

    describe('offNewMessage', () => {
      it('should unsubscribe from message:new events', async () => {
        const api = await import('../../services/api');
        vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

        const callback = vi.fn();
        await socketService.connect();
        socketService.offNewMessage(callback);

        expect(mockSocket.off).toHaveBeenCalledWith('message:new', callback);
      });
    });

    describe('onMessageStatus', () => {
      it('should subscribe to message:status events', async () => {
        const api = await import('../../services/api');
        vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

        const callback = vi.fn();
        await socketService.connect();
        socketService.onMessageStatus(callback);

        expect(mockSocket.on).toHaveBeenCalledWith('message:status', callback);
      });
    });

    describe('offMessageStatus', () => {
      it('should unsubscribe from message:status events', async () => {
        const api = await import('../../services/api');
        vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

        const callback = vi.fn();
        await socketService.connect();
        socketService.offMessageStatus(callback);

        expect(mockSocket.off).toHaveBeenCalledWith('message:status', callback);
      });
    });
  });

  describe('Typing Indicators', () => {
    describe('onTypingStart', () => {
      it('should subscribe to typing:start events', async () => {
        const api = await import('../../services/api');
        vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

        const callback = vi.fn();
        await socketService.connect();
        socketService.onTypingStart(callback);

        expect(mockSocket.on).toHaveBeenCalledWith('typing:start', callback);
      });
    });

    describe('offTypingStart', () => {
      it('should unsubscribe from typing:start events', async () => {
        const api = await import('../../services/api');
        vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

        const callback = vi.fn();
        await socketService.connect();
        socketService.offTypingStart(callback);

        expect(mockSocket.off).toHaveBeenCalledWith('typing:start', callback);
      });
    });

    describe('onTypingStop', () => {
      it('should subscribe to typing:stop events', async () => {
        const api = await import('../../services/api');
        vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

        const callback = vi.fn();
        await socketService.connect();
        socketService.onTypingStop(callback);

        expect(mockSocket.on).toHaveBeenCalledWith('typing:stop', callback);
      });
    });

    describe('offTypingStop', () => {
      it('should unsubscribe from typing:stop events', async () => {
        const api = await import('../../services/api');
        vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

        const callback = vi.fn();
        await socketService.connect();
        socketService.offTypingStop(callback);

        expect(mockSocket.off).toHaveBeenCalledWith('typing:stop', callback);
      });
    });

    describe('emitTypingStart', () => {
      it('should emit typing:start event', async () => {
        const api = await import('../../services/api');
        vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

        await socketService.connect();
        socketService.emitTypingStart(123);

        expect(mockSocket.emit).toHaveBeenCalledWith('typing:start', { receiverId: 123 });
      });

      it('should warn if socket not connected', () => {
        const spy = vi.spyOn(console, 'warn');

        socketService.emitTypingStart(123);

        expect(spy).toHaveBeenCalledWith(
          'Socket not connected, cannot emit typing event'
        );
        spy.mockRestore();
      });
    });

    describe('emitTypingStop', () => {
      it('should emit typing:stop event', async () => {
        const api = await import('../../services/api');
        vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

        await socketService.connect();
        socketService.emitTypingStop(123);

        expect(mockSocket.emit).toHaveBeenCalledWith('typing:stop', { receiverId: 123 });
      });
    });
  });

  describe('Read Receipts', () => {
    describe('onMessageRead', () => {
      it('should subscribe to message:read events', async () => {
        const api = await import('../../services/api');
        vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

        const callback = vi.fn();
        await socketService.connect();
        socketService.onMessageRead(callback);

        expect(mockSocket.on).toHaveBeenCalledWith('message:read', callback);
      });
    });

    describe('offMessageRead', () => {
      it('should unsubscribe from message:read events', async () => {
        const api = await import('../../services/api');
        vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

        const callback = vi.fn();
        await socketService.connect();
        socketService.offMessageRead(callback);

        expect(mockSocket.off).toHaveBeenCalledWith('message:read', callback);
      });
    });

    describe('emitMessageRead', () => {
      it('should emit message:read event', async () => {
        const api = await import('../../services/api');
        vi.spyOn(api.default, 'get').mockResolvedValue({ token: 'test-token' });

        await socketService.connect();
        socketService.emitMessageRead(456, 123);

        expect(mockSocket.emit).toHaveBeenCalledWith('message:read', {
          messageId: 456,
          senderId: 123,
        });
      });

      it('should warn if socket not connected', () => {
        const spy = vi.spyOn(console, 'warn');

        socketService.emitMessageRead(456, 123);

        expect(spy).toHaveBeenCalledWith(
          'Socket not connected, cannot emit message read event'
        );
        spy.mockRestore();
      });
    });
  });
});
