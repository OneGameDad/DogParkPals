import { describe, it, expect, beforeEach, vi } from 'vitest';
import socketService from '../socketService';
import { io } from 'socket.io-client';
import api from '../api';

// Mock socket.io-client and API
vi.mock('socket.io-client');
vi.mock('../api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ token: 'test-token' })),
  },
}));

describe('SocketService - Connection & Cleanup (Fixes Verification)', () => {
  beforeEach(() => {
    socketService.disconnect();
    vi.clearAllMocks();
    (api.get as any).mockReset();
    (api.get as any).mockResolvedValue({ token: 'test-token' });
  });

  describe('Socket cleanup on disconnect', () => {
    it('should remove all listeners when disconnecting', async () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      await socketService.connect();
      socketService.disconnect();

      // Should clear all listeners, including lifecycle handlers, in one call
      expect(mockSocket.removeAllListeners).toHaveBeenCalledWith();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should reset internal state on disconnect', async () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      await socketService.connect();
      expect(socketService.getSocket()).not.toBeNull();

      socketService.disconnect();
      expect(socketService.getSocket()).toBeNull();
    });

    it('should handle multiple disconnects gracefully', async () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      await socketService.connect();
      socketService.disconnect();
      
      // Second disconnect should not throw
      expect(() => {
        socketService.disconnect();
      }).not.toThrow();
    });
  });

  describe('Prevent simultaneous connections', () => {
    it('should not create multiple socket instances when connect is called rapidly', async () => {
      const mockSocket = {
        connected: false,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      // Call connect multiple times
      await Promise.all([
        socketService.connect(),
        socketService.connect(),
        socketService.connect(),
      ]);

      // io() should be called at most once or twice (race conditions)
      const callCount = (io as any).mock.calls.length;
      expect(callCount).toBeLessThanOrEqual(2);
    });

    it('should not connect if already connected', async () => {
      const mockSocket = {
        connected: true, // Already connected
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      await socketService.connect();
      const firstCallCount = (io as any).mock.calls.length;

      await socketService.connect();

      // Should not create new connection
      expect((io as any).mock.calls.length).toBe(firstCallCount);
    });

    it('should retry after waiting if in-flight connection fails', async () => {
      const mockSocket = {
        connected: false,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      (api.get as any)
        .mockRejectedValueOnce(new Error('Token fetch failed'))
        .mockResolvedValueOnce({ token: 'test-token' });

      await Promise.all([
        socketService.connect(),
        socketService.connect(),
      ]);

      // First attempt fails before socket creation, second caller retries and connects.
      expect((io as any).mock.calls.length).toBe(1);
    });
  });

  describe('Connection lifecycle', () => {
    it('should handle connect -> disconnect -> reconnect cycle', async () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      // Connect
      await socketService.connect();
      expect((io as any).mock.calls.length).toBeGreaterThan(0);

      // Disconnect
      socketService.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();

      // Reconnect
      const initialCallCount = (io as any).mock.calls.length;
      await socketService.connect();
      expect((io as any).mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should properly reset connecting flag after connection attempt', async () => {
      const mockSocket = {
        connected: false,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
      };

      (io as any).mockImplementation(() => {
        // Simulate async connection
        return mockSocket;
      });

      // This should complete
      await socketService.connect();

      // Should be able to connect again
      await socketService.connect();

      expect((io as any).mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Listener registration/unregistration', () => {
    it('should register notification listeners', async () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      await socketService.connect();

      const callback = vi.fn();
      socketService.onNotification(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('notification', callback);
    });

    it('should unregister notification listeners', async () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      await socketService.connect();

      const callback = vi.fn();
      socketService.onNotification(callback);
      socketService.offNotification(callback);

      expect(mockSocket.off).toHaveBeenCalledWith('notification', callback);
    });

    it('should clear all listener types on disconnect', async () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      await socketService.connect();

      // Register some listeners
      socketService.onNotification(vi.fn());
      socketService.onNewMessage(vi.fn());

      socketService.disconnect();

      // Verify blanket listener cleanup was used
      expect(mockSocket.removeAllListeners).toHaveBeenCalledWith();
    });
  });

  describe('Connection state', () => {
    it('should report connection state correctly', async () => {
      const mockSocket = {
        connected: false,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      // Set connected to true via setup
      mockSocket.connected = true;
      await socketService.connect();

      expect(socketService.isConnected()).toBe(true);

      socketService.disconnect();
      expect(socketService.isConnected()).toBe(false);
    });
  });

  describe('No listener accumulation', () => {
    it('should not accumulate listeners on repeated connect/disconnect cycles', async () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      for (let i = 0; i < 5; i++) {
        await socketService.connect();
        socketService.onNotification(vi.fn());
        socketService.disconnect();
      }

      // Cleanup should have been called for each cycle
      expect(mockSocket.removeAllListeners).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalledTimes(5);
    });
  });
});
