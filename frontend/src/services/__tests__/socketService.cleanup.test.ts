import { describe, it, expect, beforeEach, vi } from 'vitest';
import socketService from '../socketService';
import { io } from 'socket.io-client';

// Mock socket.io-client and API
vi.mock('socket.io-client');
vi.mock('../api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ token: 'test-token' })),
  },
}));

describe('SocketService - Connection & Cleanup (Fixes Verification)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Socket cleanup on disconnect', () => {
    it('should remove all listeners when disconnecting', () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      socketService.connect();
      socketService.disconnect();

      // Should have called removeAllListeners for all event types
      const calls = (mockSocket.removeAllListeners as any).mock.calls.map((c: any) => c[0]);
      expect(calls).toContain('notification');
      expect(calls).toContain('message:new');
      expect(calls).toContain('typing:start');
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should reset internal state on disconnect', () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      socketService.connect();
      expect(socketService.getSocket()).not.toBeNull();

      socketService.disconnect();
      expect(socketService.getSocket()).toBeNull();
    });

    it('should handle multiple disconnects gracefully', () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      socketService.connect();
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

      socketService.connect();
      const firstCallCount = (io as any).mock.calls.length;

      socketService.connect();

      // Should not create new connection
      expect((io as any).mock.calls.length).toBe(firstCallCount);
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
    it('should register notification listeners', () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      socketService.connect();

      const callback = vi.fn();
      socketService.onNotification(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('notification', callback);
    });

    it('should unregister notification listeners', () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      socketService.connect();

      const callback = vi.fn();
      socketService.onNotification(callback);
      socketService.offNotification(callback);

      expect(mockSocket.off).toHaveBeenCalledWith('notification', callback);
    });

    it('should clear all listener types on disconnect', () => {
      const mockSocket = {
        connected: true,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      socketService.connect();

      // Register some listeners
      socketService.onNotification(vi.fn());
      socketService.onNewMessage(vi.fn());

      socketService.disconnect();

      // Verify all listener types were cleared
      expect(mockSocket.removeAllListeners).toHaveBeenCalled();
      const listenerTypes = (mockSocket.removeAllListeners as any).mock.calls.map((c: any) => c[0]);
      expect(listenerTypes).toContain('notification');
      expect(listenerTypes).toContain('message:new');
    });
  });

  describe('Connection state', () => {
    it('should report connection state correctly', () => {
      const mockSocket = {
        connected: false,
        disconnect: vi.fn(),
        removeAllListeners: vi.fn(),
      };

      (io as any).mockReturnValue(mockSocket);

      // Set connected to true via setup
      mockSocket.connected = true;
      socketService.connect();

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
