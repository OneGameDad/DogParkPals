import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach} from "vitest";
import { useInfiniteScroll } from "../useInfiniteScroll";
import type { CursorPaginatedMessagesResponse, Messages } from '../../types';

describe('useInfiniteScroll - Live Chat Pagination', () => {
  let mockMessages: Messages[];
  let mockFetchFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create mock messages 1-100
    mockMessages = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      senderId: 1,
      receiverId: 2,
      content: `Message ${i + 1}`,
      sentAt: new Date().toISOString(),
      status: 'SENT' as const,
    }));

    mockFetchFn = vi.fn();
  });

  describe('Initial Load', () => {
    test('should load initial messages on mount', async () => {
      const firstPageMessages = mockMessages.slice(0, 50);
      
      mockFetchFn.mockResolvedValueOnce({
        data: firstPageMessages,
        cursor: {
          hasMore: true,
          lastMessageId: 50,
          limit: 50,
        },
      } as CursorPaginatedMessagesResponse);

      const { result } = renderHook(() => useInfiniteScroll(mockFetchFn));

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.messages).toEqual(firstPageMessages);
      expect(result.current.hasMore).toBe(true);
      expect(mockFetchFn).toHaveBeenCalledTimes(1);
      expect(mockFetchFn).toHaveBeenCalledWith(undefined, 50);
    });

    test('should set hasMore to false when no more messages', async () => {
      const allMessages = mockMessages.slice(0, 30); // Less than page size
      
      mockFetchFn.mockResolvedValueOnce({
        data: allMessages,
        cursor: {
          hasMore: false,
          lastMessageId: 30,
          limit: 50,
        },
      } as CursorPaginatedMessagesResponse);

      const { result } = renderHook(() => useInfiniteScroll(mockFetchFn));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(false);
      expect(result.current.messages.length).toBe(30);
    });

    test('should handle initial load error', async () => {
      const error = new Error('Network error');
      mockFetchFn.mockRejectedValueOnce(error);

      const onError = vi.fn();
      const { result } = renderHook(() => useInfiniteScroll(mockFetchFn, { onError }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.messages).toEqual([]);
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('Infinite Scroll - Load More', () => {
    test('should load next page using cursor pagination', async () => {
      const firstPage = mockMessages.slice(0, 50);
      const secondPage = mockMessages.slice(50, 100);

      // First call - initial load
      mockFetchFn.mockResolvedValueOnce({
        data: firstPage,
        cursor: {
          hasMore: true,
          lastMessageId: 50,
          limit: 50,
        },
      } as CursorPaginatedMessagesResponse);

      const { result } = renderHook(() => useInfiniteScroll(mockFetchFn));

      await waitFor(() => {
        expect(result.current.messages.length).toBe(50);
      });

      // Second call - load more
      mockFetchFn.mockResolvedValueOnce({
        data: secondPage,
        cursor: {
          hasMore: false,
          lastMessageId: 100,
          limit: 50,
        },
      } as CursorPaginatedMessagesResponse);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.messages.length).toBe(100);
      expect(result.current.messages).toEqual([...firstPage, ...secondPage]);
      expect(result.current.hasMore).toBe(false);

      // Verify cursor pagination was used (lastMessageId = 50)
      expect(mockFetchFn).toHaveBeenCalledWith(50, 50);
    });

    test('should not load more when hasMore is false', async () => {
      mockFetchFn.mockResolvedValueOnce({
        data: mockMessages.slice(0, 30),
        cursor: {
          hasMore: false,
          lastMessageId: 30,
          limit: 50,
        },
      } as CursorPaginatedMessagesResponse);

      const { result } = renderHook(() => useInfiniteScroll(mockFetchFn));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loadMore();
      });

      // Should still be only 1 call (initial load)
      expect(mockFetchFn).toHaveBeenCalledTimes(1);
    });

    test('should not load more when already loading', async () => {
      const slowFetch = vi.fn(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            data: mockMessages.slice(0, 50),
            cursor: { hasMore: true, lastMessageId: 50, limit: 50 },
          }), 100)
        )
      );

      const { result } = renderHook(() => useInfiniteScroll(slowFetch));

      // Trigger loadMore while initial load is still in progress
      await act(async () => {
        result.current.loadMore();
      });

      // Should still be only 1 call (initial load only, loadMore was ignored)
      expect(slowFetch).toHaveBeenCalledTimes(1);
    });

    test('should handle load more error gracefully', async () => {
      const firstPage = mockMessages.slice(0, 50);
      mockFetchFn.mockResolvedValueOnce({
        data: firstPage,
        cursor: {
          hasMore: true,
          lastMessageId: 50,
          limit: 50,
        },
      } as CursorPaginatedMessagesResponse);

      const { result } = renderHook(() => useInfiniteScroll(mockFetchFn));

      await waitFor(() => {
        expect(result.current.messages.length).toBe(50);
      });

      // Next load fails
      const error = new Error('Cursor pagination failed');
      mockFetchFn.mockRejectedValueOnce(error);

      await act(async () => {
        await result.current.loadMore();
      });

      // Existing messages should still be there, but hasMore remains true (for retry)
      expect(result.current.messages.length).toBe(50);
      expect(result.current.error).toEqual(error);
      expect(result.current.hasMore).toBe(true); // Still true so user can retry
    });
  });

  describe('Refresh', () => {
    test('should reset and reload messages', async () => {
      const firstPage = mockMessages.slice(0, 50);
      const refreshedPage = mockMessages.slice(0, 40); // Simulating fewer messages after refresh

      // Initial load
      mockFetchFn.mockResolvedValueOnce({
        data: firstPage,
        cursor: { hasMore: true, lastMessageId: 50, limit: 50 },
      } as CursorPaginatedMessagesResponse);

      const { result } = renderHook(() => useInfiniteScroll(mockFetchFn));

      await waitFor(() => {
        expect(result.current.messages.length).toBe(50);
      });

      // Refresh - should reset and reload
      mockFetchFn.mockResolvedValueOnce({
        data: refreshedPage,
        cursor: { hasMore: true, lastMessageId: 40, limit: 50 },
      } as CursorPaginatedMessagesResponse);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.messages).toEqual(refreshedPage);
      expect(result.current.hasMore).toBe(true);
      expect(mockFetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Add Message', () => {
    test('should add new message to the end', async () => {
      const initialMessages = mockMessages.slice(0, 50);
      mockFetchFn.mockResolvedValueOnce({
        data: initialMessages,
        cursor: { hasMore: true, lastMessageId: 50, limit: 50 },
      } as CursorPaginatedMessagesResponse);

      const { result } = renderHook(() => useInfiniteScroll(mockFetchFn));

      await waitFor(() => {
        expect(result.current.messages.length).toBe(50);
      });

      const newMessage: Messages = {
        id: 101,
        senderId: 2,
        receiverId: 1,
        content: 'New message',
        sentAt: new Date().toISOString(),
        status: 'SENT',
      };

      act(() => {
        result.current.addMessage(newMessage);
      });

      expect(result.current.messages.length).toBe(51);
      expect(result.current.messages[50]).toEqual(newMessage);
    });
  });

  describe('Real-time Chat Scenario', () => {
    test('should handle complete live chat flow', async () => {
      const initialMessages = mockMessages.slice(0, 50);

      // Step 1: Initial load
      mockFetchFn.mockResolvedValueOnce({
        data: initialMessages,
        cursor: { hasMore: true, lastMessageId: 50, limit: 50 },
      } as CursorPaginatedMessagesResponse);

      const { result } = renderHook(() => useInfiniteScroll(mockFetchFn));

      await waitFor(() => {
        expect(result.current.messages.length).toBe(50);
      });

      // Step 2: User scrolls up, load more older messages
      mockFetchFn.mockResolvedValueOnce({
        data: mockMessages.slice(50, 100),
        cursor: { hasMore: false, lastMessageId: 100, limit: 50 },
      } as CursorPaginatedMessagesResponse);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.messages.length).toBe(100);
      expect(result.current.hasMore).toBe(false);

      // Step 3: New message received in real-time
      const liveMessage: Messages = {
        id: 101,
        senderId: 2,
        receiverId: 1,
        content: 'Live message!',
        sentAt: new Date().toISOString(),
        status: 'SENT',
      };

      act(() => {
        result.current.addMessage(liveMessage);
      });

      expect(result.current.messages[100]).toEqual(liveMessage);
      expect(result.current.messages.length).toBe(101);

      // Step 4: Refresh to get latest messages
      mockFetchFn.mockResolvedValueOnce({
        data: [liveMessage, mockMessages.slice(0, 49)].flat(),
        cursor: { hasMore: true, lastMessageId: 50, limit: 50 },
      } as CursorPaginatedMessagesResponse);

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.messages.length).toBe(50);
      });
      expect(result.current.messages[0]).toEqual(liveMessage);
    });
  });

  describe('Custom Page Size', () => {
    test('should respect custom initial page size', async () => {
      const customPageMessages = mockMessages.slice(0, 25); // Custom size
      
      mockFetchFn.mockResolvedValueOnce({
        data: customPageMessages,
        cursor: { hasMore: true, lastMessageId: 25, limit: 25 },
      } as CursorPaginatedMessagesResponse);

      const { result } = renderHook(() => 
        useInfiniteScroll(mockFetchFn, { initialPageSize: 25 })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchFn).toHaveBeenCalledWith(undefined, 25);
      expect(result.current.messages.length).toBe(25);
    });
  });
});
