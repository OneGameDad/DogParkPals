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

  // Initial load - fetch first page
  const loadMessages = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      // For initial load, don't pass lastMessageId
      const response = await fetchFn(undefined, initialPageSize);
      
      setMessages(response.data);
      setHasMore(response.cursor.hasMore);
      
      // Store the last message ID for cursor pagination
      if (response.data.length > 0) {
        lastMessageIdRef.current = response.data[response.data.length - 1].id;
      }

      hasInitialLoadRef.current = true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load messages');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, initialPageSize, isLoading, hasMore, onError]);

  // Load more for infinite scroll - uses cursor pagination
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !lastMessageIdRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchFn(lastMessageIdRef.current, initialPageSize);
      
      // Append new messages to existing ones
      setMessages(prev => [...prev, ...response.data]);
      setHasMore(response.cursor.hasMore);

      // Update cursor for next load
      if (response.data.length > 0) {
        lastMessageIdRef.current = response.data[response.data.length - 1].id;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load more messages');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, initialPageSize, isLoading, hasMore, onError]);

  // Refresh messages - resets to initial load
  const refresh = useCallback(async () => {
    lastMessageIdRef.current = undefined;
    hasInitialLoadRef.current = false;
    setMessages([]);
    setHasMore(true);
    setError(null);
    // Create a new fetch to bypass the guard clause checks
    setIsLoading(true);
    try {
      const response = await fetchFn(undefined, initialPageSize);
      setMessages(response.data);
      setHasMore(response.cursor.hasMore);
      if (response.data.length > 0) {
        lastMessageIdRef.current = response.data[response.data.length - 1].id;
      }
      hasInitialLoadRef.current = true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh messages');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, initialPageSize, onError]);

  // Initial load on mount
  useEffect(() => {
    if (!hasInitialLoadRef.current) {
      loadMessages();
    }
  }, []);

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
