import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sessionManager } from '../infrastructure/sessionManager';

// Mock dependencies
jest.mock('../utils/typeSafeLogger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  logUserAction: jest.fn(),
  logError: jest.fn(),
}));

describe('Socket.io Session Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionManager.clearAll();
  });

  describe('Session Registration and Unregistration Flow', () => {
    test('should register multiple sessions for a user connecting on different tabs', () => {
      const userId = 123;
      
      // User connects on tab 1
      sessionManager.registerSession(userId, 'socket-1-tab1');
      expect(sessionManager.getUserSessions(userId)).toHaveLength(1);
      
      // User connects on tab 2
      sessionManager.registerSession(userId, 'socket-1-tab2');
      expect(sessionManager.getUserSessions(userId)).toHaveLength(2);
      
      // User connects on tab 3
      sessionManager.registerSession(userId, 'socket-1-tab3');
      expect(sessionManager.getUserSessions(userId)).toHaveLength(3);
      
      expect(sessionManager.hasActiveSessions(userId)).toBe(true);
    });

    test('should handle user closing one tab and reconnecting', () => {
      const userId = 456;
      
      // User is on 2 tabs
      sessionManager.registerSession(userId, 'socket-1');
      sessionManager.registerSession(userId, 'socket-2');
      expect(sessionManager.getUserSessions(userId)).toHaveLength(2);
      
      // User closes tab 1 (disconnects socket 1)
      sessionManager.unregisterSession(userId, 'socket-1');
      expect(sessionManager.getUserSessions(userId)).toHaveLength(1);
      expect(sessionManager.hasActiveSessions(userId)).toBe(true);
      
      // User opens new tab and reconnects
      sessionManager.registerSession(userId, 'socket-3');
      const sessions = sessionManager.getUserSessions(userId);
      expect(sessions).toHaveLength(2);
      expect(sessions).toContain('socket-2');
      expect(sessions).toContain('socket-3');
    });

    test('should clear all sessions when user closes all tabs', () => {
      const userId = 789;
      
      // User is on 2 tabs
      sessionManager.registerSession(userId, 'socket-a');
      sessionManager.registerSession(userId, 'socket-b');
      expect(sessionManager.hasActiveSessions(userId)).toBe(true);
      
      // User closes all tabs
      sessionManager.unregisterSession(userId, 'socket-a');
      sessionManager.unregisterSession(userId, 'socket-b');
      
      expect(sessionManager.hasActiveSessions(userId)).toBe(false);
      expect(sessionManager.getUserSessions(userId)).toHaveLength(0);
    });
  });

  describe('Multi-user Session Tracking', () => {
    test('should track separate sessions for multiple concurrent users', () => {
      // User 1 connects on 2 tabs
      sessionManager.registerSession(1, 'user1-tab1');
      sessionManager.registerSession(1, 'user1-tab2');
      
      // User 2 connects on 1 tab
      sessionManager.registerSession(2, 'user2-tab1');
      
      // User 3 connects on 3 tabs
      sessionManager.registerSession(3, 'user3-tab1');
      sessionManager.registerSession(3, 'user3-tab2');
      sessionManager.registerSession(3, 'user3-tab3');
      
      // Verify separate sessions for each user
      expect(sessionManager.getUserSessions(1)).toHaveLength(2);
      expect(sessionManager.getUserSessions(2)).toHaveLength(1);
      expect(sessionManager.getUserSessions(3)).toHaveLength(3);
      
      // Total sessions
      expect(sessionManager.getTotalActiveSessions()).toBe(6);
      
      // Stats
      const stats = sessionManager.getSessionStats();
      expect(stats.totalUsers).toBe(3);
      expect(stats.totalSessions).toBe(6);
    });

    test('should isolate session disconnection for one user from others', () => {
      // Setup: 3 users with multiple sessions each
      sessionManager.registerSession(1, 's1-1');
      sessionManager.registerSession(1, 's1-2');
      sessionManager.registerSession(2, 's2-1');
      sessionManager.registerSession(2, 's2-2');
      sessionManager.registerSession(2, 's2-3');
      sessionManager.registerSession(3, 's3-1');
      
      const initialStats = sessionManager.getSessionStats();
      expect(initialStats.totalSessions).toBe(6);
      
      // User 2 closes one tab
      sessionManager.unregisterSession(2, 's2-2');
      
      // Verify only user 2's sessions changed
      expect(sessionManager.getUserSessions(1)).toHaveLength(2);
      expect(sessionManager.getUserSessions(2)).toHaveLength(2);
      expect(sessionManager.getUserSessions(3)).toHaveLength(1);
      
      const updatedStats = sessionManager.getSessionStats();
      expect(updatedStats.totalSessions).toBe(5);
    });
  });

  describe('Session Statistics Accuracy', () => {
    test('should maintain accurate stats through various operations', () => {
      let stats = sessionManager.getSessionStats();
      expect(stats).toEqual({ totalUsers: 0, totalSessions: 0 });
      
      // Add sessions
      sessionManager.registerSession(1, 's1');
      stats = sessionManager.getSessionStats();
      expect(stats).toEqual({ totalUsers: 1, totalSessions: 1 });
      
      sessionManager.registerSession(1, 's2');
      stats = sessionManager.getSessionStats();
      expect(stats).toEqual({ totalUsers: 1, totalSessions: 2 });
      
      sessionManager.registerSession(2, 's3');
      stats = sessionManager.getSessionStats();
      expect(stats).toEqual({ totalUsers: 2, totalSessions: 3 });
      
      sessionManager.registerSession(2, 's4');
      stats = sessionManager.getSessionStats();
      expect(stats).toEqual({ totalUsers: 2, totalSessions: 4 });
      
      // Remove sessions
      sessionManager.unregisterSession(1, 's1');
      stats = sessionManager.getSessionStats();
      expect(stats).toEqual({ totalUsers: 2, totalSessions: 3 });
      
      sessionManager.unregisterSession(1, 's2');
      stats = sessionManager.getSessionStats();
      expect(stats).toEqual({ totalUsers: 1, totalSessions: 2 });
      
      sessionManager.unregisterSession(2, 's3');
      stats = sessionManager.getSessionStats();
      expect(stats).toEqual({ totalUsers: 1, totalSessions: 1 });
      
      sessionManager.unregisterSession(2, 's4');
      stats = sessionManager.getSessionStats();
      expect(stats).toEqual({ totalUsers: 0, totalSessions: 0 });
    });
  });

  describe('Session Cleanup and Idle Scenarios', () => {
    test('should handle cleanup after extended idle', () => {
      const userId = 999;
      
      // User has multiple active sessions
      sessionManager.registerSession(userId, 'idle-socket-1');
      sessionManager.registerSession(userId, 'idle-socket-2');
      sessionManager.registerSession(userId, 'idle-socket-3');
      
      expect(sessionManager.hasActiveSessions(userId)).toBe(true);
      expect(sessionManager.getUserSessions(userId)).toHaveLength(3);
      
      // Simulate all sockets timing out/disconnecting
      sessionManager.unregisterSession(userId, 'idle-socket-1');
      sessionManager.unregisterSession(userId, 'idle-socket-2');
      sessionManager.unregisterSession(userId, 'idle-socket-3');
      
      // User should have no active sessions
      expect(sessionManager.hasActiveSessions(userId)).toBe(false);
      expect(sessionManager.getTotalActiveSessions()).toBe(0);
    });

    test('should handle rapid connect/disconnect cycles', () => {
      const userId = 111;
      
      // Simulate user rapidly connecting and disconnecting
      for (let i = 0; i < 5; i++) {
        const socketId = `rapid-socket-${i}`;
        sessionManager.registerSession(userId, socketId);
        expect(sessionManager.getUserSessions(userId)).toHaveLength(1);
        
        sessionManager.unregisterSession(userId, socketId);
        expect(sessionManager.hasActiveSessions(userId)).toBe(false);
      }
      
      // No orphaned sessions
      expect(sessionManager.getTotalActiveSessions()).toBe(0);
      expect(sessionManager.getSessionStats()).toEqual({ totalUsers: 0, totalSessions: 0 });
    });
  });

  describe('Concurrent User Scenarios', () => {
    test('should handle realistic multi-user concurrent operations', () => {
      const users = [1, 2, 3, 4, 5];
      
      // Each user connects on multiple tabs
      for (const userId of users) {
        for (let tab = 1; tab <= 3; tab++) {
          sessionManager.registerSession(userId, `user${userId}-tab${tab}`);
        }
      }
      
      const stats = sessionManager.getSessionStats();
      expect(stats.totalUsers).toBe(5);
      expect(stats.totalSessions).toBe(15);
      
      // One user closes a tab
      sessionManager.unregisterSession(2, 'user2-tab2');
      
      // Verify state
      expect(sessionManager.getUserSessions(2)).toHaveLength(2);
      const updatedStats = sessionManager.getSessionStats();
      expect(updatedStats.totalSessions).toBe(14);
      
      // One user logs out completely
      sessionManager.unregisterSession(4, 'user4-tab1');
      sessionManager.unregisterSession(4, 'user4-tab2');
      sessionManager.unregisterSession(4, 'user4-tab3');
      
      expect(sessionManager.hasActiveSessions(4)).toBe(false);
      const finalStats = sessionManager.getSessionStats();
      expect(finalStats.totalUsers).toBe(4);
      expect(finalStats.totalSessions).toBe(11);
    });
  });
});
