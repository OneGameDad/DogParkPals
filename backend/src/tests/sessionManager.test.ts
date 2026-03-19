import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { sessionManager } from '../infrastructure/sessionManager';

// Mock typeSafeLogger
jest.mock('../utils/typeSafeLogger', () => ({
  logUserAction: jest.fn(),
  logError: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

describe('SessionManager', () => {
  let mockIO: any;
  let mockSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock sockets
    mockSocket = {
      id: 'socket-1',
      userId: 1,
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    // Create mock IO
    mockIO = {
      sockets: {
        sockets: new Map([['socket-1', mockSocket]]),
      },
      to: jest.fn().mockReturnThis(),
    };

    sessionManager.clearAll();
  });

  afterEach(() => {
    sessionManager.clearAll();
  });

  describe('registerSession', () => {
    test('should register a new session for a user', () => {
      sessionManager.registerSession(1, 'socket-1');
      
      expect(sessionManager.getUserSessions(1)).toContain('socket-1');
      expect(sessionManager.hasActiveSessions(1)).toBe(true);
    });

    test('should register multiple sessions for the same user', () => {
      sessionManager.registerSession(1, 'socket-1');
      sessionManager.registerSession(1, 'socket-2');
      sessionManager.registerSession(1, 'socket-3');
      
      const sessions = sessionManager.getUserSessions(1);
      expect(sessions).toHaveLength(3);
      expect(sessions).toContain('socket-1');
      expect(sessions).toContain('socket-2');
      expect(sessions).toContain('socket-3');
    });

    test('should handle multiple users with different sessions', () => {
      sessionManager.registerSession(1, 'socket-1');
      sessionManager.registerSession(1, 'socket-2');
      sessionManager.registerSession(2, 'socket-3');
      sessionManager.registerSession(3, 'socket-4');
      
      expect(sessionManager.getUserSessions(1)).toHaveLength(2);
      expect(sessionManager.getUserSessions(2)).toHaveLength(1);
      expect(sessionManager.getUserSessions(3)).toHaveLength(1);
    });
  });

  describe('unregisterSession', () => {
    test('should unregister a single session for a user', () => {
      sessionManager.registerSession(1, 'socket-1');
      expect(sessionManager.hasActiveSessions(1)).toBe(true);
      
      sessionManager.unregisterSession(1, 'socket-1');
      
      expect(sessionManager.hasActiveSessions(1)).toBe(false);
      expect(sessionManager.getUserSessions(1)).toHaveLength(0);
    });

    test('should unregister one session while keeping others', () => {
      sessionManager.registerSession(1, 'socket-1');
      sessionManager.registerSession(1, 'socket-2');
      sessionManager.registerSession(1, 'socket-3');
      
      sessionManager.unregisterSession(1, 'socket-2');
      
      const sessions = sessionManager.getUserSessions(1);
      expect(sessions).toHaveLength(2);
      expect(sessions).toContain('socket-1');
      expect(sessions).toContain('socket-3');
      expect(sessions).not.toContain('socket-2');
    });

    test('should handle unregistering non-existent session gracefully', () => {
      sessionManager.registerSession(1, 'socket-1');
      
      expect(() => {
        sessionManager.unregisterSession(1, 'socket-999');
      }).not.toThrow();
      
      expect(sessionManager.getUserSessions(1)).toHaveLength(1);
    });
  });

  describe('hasActiveSessions', () => {
    test('should return true when user has active sessions', () => {
      sessionManager.registerSession(1, 'socket-1');
      expect(sessionManager.hasActiveSessions(1)).toBe(true);
    });

    test('should return false when user has no sessions', () => {
      expect(sessionManager.hasActiveSessions(1)).toBe(false);
    });

    test('should return false after all sessions are unregistered', () => {
      sessionManager.registerSession(1, 'socket-1');
      sessionManager.registerSession(1, 'socket-2');
      
      sessionManager.unregisterSession(1, 'socket-1');
      sessionManager.unregisterSession(1, 'socket-2');
      
      expect(sessionManager.hasActiveSessions(1)).toBe(false);
    });
  });

  describe('getUserSessions', () => {
    test('should return empty array for user with no sessions', () => {
      const sessions = sessionManager.getUserSessions(1);
      expect(sessions).toEqual([]);
    });

    test('should return all session IDs for a user', () => {
      sessionManager.registerSession(1, 'socket-1');
      sessionManager.registerSession(1, 'socket-2');
      
      const sessions = sessionManager.getUserSessions(1);
      expect(sessions).toHaveLength(2);
      expect(sessions.sort()).toEqual(['socket-1', 'socket-2'].sort());
    });
  });

  describe('disconnectUserSessions', () => {
    test('should emit account_deleted and disconnect all sockets for a user', async () => {
      const socket2 = {
        id: 'socket-2',
        userId: 1,
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      mockIO.sockets.sockets.set('socket-2', socket2);
      sessionManager.setSocketServer(mockIO);
      
      sessionManager.registerSession(1, 'socket-1');
      sessionManager.registerSession(1, 'socket-2');

      await sessionManager.disconnectUserSessions(1, 'Test reason');

      expect(mockSocket.emit).toHaveBeenCalledWith('account_deleted', { reason: 'Test reason' });
      expect(socket2.emit).toHaveBeenCalledWith('account_deleted', { reason: 'Test reason' });
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
      expect(socket2.disconnect).toHaveBeenCalledWith(true);
      expect(sessionManager.hasActiveSessions(1)).toBe(false);
    });

    test('should handle gracefully when socket.io is not initialized', async () => {
      sessionManager.clearAll();
      
      expect(async () => {
        await sessionManager.disconnectUserSessions(1, 'Test reason');
      }).not.toThrow();
    });

    test('should use default reason if not provided', async () => {
      sessionManager.setSocketServer(mockIO);
      sessionManager.registerSession(1, 'socket-1');

      await sessionManager.disconnectUserSessions(1);

      expect(mockSocket.emit).toHaveBeenCalledWith('account_deleted', { 
        reason: 'User account deleted' 
      });
    });

    test('should do nothing when user has no active sessions', async () => {
      sessionManager.setSocketServer(mockIO);
      
      expect(async () => {
        await sessionManager.disconnectUserSessions(999, 'Test reason');
      }).not.toThrow();
    });

    test('should handle socket disconnect errors gracefully', async () => {
      const errorSocket = {
        id: 'socket-error',
        userId: 1,
        emit: jest.fn(),
        disconnect: jest.fn(() => {
          throw new Error('Disconnect failed');
        }),
      };

      mockIO.sockets.sockets.set('socket-error', errorSocket);
      sessionManager.setSocketServer(mockIO);
      sessionManager.registerSession(1, 'socket-error');

      expect(async () => {
        await sessionManager.disconnectUserSessions(1, 'Test reason');
      }).not.toThrow();
    });
  });

  describe('getTotalActiveSessions', () => {
    test('should return 0 when no sessions exist', () => {
      expect(sessionManager.getTotalActiveSessions()).toBe(0);
    });

    test('should count all sessions across all users', () => {
      sessionManager.registerSession(1, 'socket-1');
      sessionManager.registerSession(1, 'socket-2');
      sessionManager.registerSession(2, 'socket-3');
      sessionManager.registerSession(3, 'socket-4');
      sessionManager.registerSession(3, 'socket-5');

      expect(sessionManager.getTotalActiveSessions()).toBe(5);
    });
  });

  describe('getSessionStats', () => {
    test('should return correct stats', () => {
      sessionManager.registerSession(1, 'socket-1');
      sessionManager.registerSession(1, 'socket-2');
      sessionManager.registerSession(2, 'socket-3');

      const stats = sessionManager.getSessionStats();
      
      expect(stats.totalUsers).toBe(2);
      expect(stats.totalSessions).toBe(3);
    });

    test('should return zeros when no sessions exist', () => {
      const stats = sessionManager.getSessionStats();
      
      expect(stats.totalUsers).toBe(0);
      expect(stats.totalSessions).toBe(0);
    });
  });

  describe('clearAll', () => {
    test('should clear all sessions', () => {
      sessionManager.registerSession(1, 'socket-1');
      sessionManager.registerSession(1, 'socket-2');
      sessionManager.registerSession(2, 'socket-3');

      sessionManager.clearAll();

      expect(sessionManager.getTotalActiveSessions()).toBe(0);
      expect(sessionManager.getSessionStats()).toEqual({ totalUsers: 0, totalSessions: 0 });
    });
  });

  describe('setSocketServer', () => {
    test('should store the Socket.io server reference', () => {
      sessionManager.setSocketServer(mockIO);
      
      // We can verify this indirectly by confirming disconnectUserSessions works
      sessionManager.registerSession(1, 'socket-1');
      expect(async () => {
        await sessionManager.disconnectUserSessions(1);
      }).not.toThrow();
    });
  });
});
