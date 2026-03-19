import { useState, useCallback, useRef, useEffect } from 'react';
import type { CursorPaginatedMessagesResponse, Messages } from '../types';

interface UseInfiniteScrollOptions {
  initialPageSize?: number;
  onError?: (error: Error) => void;
}

export const useInfiniteScroll = (
  fetchFn: (lastMessageId?: number, limit?: number) => Promise<CursorPaginatedMessagesResponse>,
  options: UseInfiniteScrollOptions = {}
) => {
  const { initialPageSize = 50, onError } = options;

  const [messages, setMessages] = useState<Messages[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const lastMessageIdRef = useRef<number | undefined>(undefined);
  const hasInitialLoadRef = useRef(false);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  // Initial load - fetch first page
  const loadMessages = useCallback(async () => {
    if (isLoadingRef.current || !hasMoreRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // For initial load, don't pass lastMessageId
      const response = await fetchFn(undefined, initialPageSize);
      
      setMessages(response.data);
      hasMoreRef.current = response.cursor.hasMore;
      setHasMore(response.cursor.hasMore);
      
      // Store the last message ID for cursor pagination using cursor metadata
      if (response.cursor.lastMessageId != null) {
        lastMessageIdRef.current = response.cursor.lastMessageId;
      }

      hasInitialLoadRef.current = true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load messages');
      setError(error);
      onError?.(error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [fetchFn, initialPageSize, onError]);

  // Load more for infinite scroll - uses cursor pagination
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMoreRef.current || !lastMessageIdRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchFn(lastMessageIdRef.current, initialPageSize);
      
      // Append new messages to existing ones
      setMessages(prev => [...prev, ...response.data]);
      hasMoreRef.current = response.cursor.hasMore;
      setHasMore(response.cursor.hasMore);

      // Update cursor for next load
      if (response.data.length > 0 && response.data[response.data.length - 1].id != null) {
        lastMessageIdRef.current = response.data[response.data.length - 1].id;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load more messages');
      setError(error);
      onError?.(error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [fetchFn, initialPageSize, onError]);

  // Refresh messages - resets to initial load
  const refresh = useCallback(async () => {
    lastMessageIdRef.current = undefined;
    hasInitialLoadRef.current = false;
    isLoadingRef.current = true;
    hasMoreRef.current = true;
    setMessages([]);
    setHasMore(true);
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetchFn(undefined, initialPageSize);
      setMessages(response.data);
      hasMoreRef.current = response.cursor.hasMore;
      setHasMore(response.cursor.hasMore);
      if (response.data.length > 0 && response.data[response.data.length - 1].id != null) {
        lastMessageIdRef.current = response.data[response.data.length - 1].id;
      }
      hasInitialLoadRef.current = true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh messages');
      setError(error);
      onError?.(error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [fetchFn, initialPageSize, onError]);

  // Initial load on mount and when fetchFn/initialPageSize change
  useEffect(() => {
    if (!hasInitialLoadRef.current) {
      // First time: just load messages
      loadMessages();
      return;
    }
    // If fetchFn or initialPageSize change after initial load,
    // reset pagination state and reload messages
    lastMessageIdRef.current = undefined;
    hasInitialLoadRef.current = false;
    setMessages([]);
    setHasMore(true);
    setError(null);
    loadMessages();
  }, [fetchFn, initialPageSize, loadMessages]);

  return {
    messages,
    isLoading,
    hasMore,
    error,
    loadMore,
    refresh,
    addMessage: (message: Messages) => {
      setMessages(prev => [...prev, message]);
      lastMessageIdRef.current = message.id;
    },
  };
};

export default useInfiniteScroll;
