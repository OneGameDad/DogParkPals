import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
    enabled?: boolean;
    interval?: number;
}

/**
 * A hook for polling that prevents overlapping requests by waiting for the 
 * previous promise to resolve before scheduling the next one.
 */
export function usePolling(
    callback: () => Promise<void> | void,
    { enabled = true, interval = 3000 }: UsePollingOptions = {}
) {
    const savedCallback = useRef(callback);
    const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef(true);

    // Keep callback ref up to date
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Handle unmounting
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
        };
    }, []);

    const poll = useCallback(async () => {
        if (!isMountedRef.current || !enabled) return;

        try {
            // Execute the callback (can be async)
            await savedCallback.current();
        } catch (error) {
            console.error('Polling error:', error);
        } finally {
            // Only schedule next poll if still mounted and enabled
            if (isMountedRef.current && enabled) {
                timeoutIdRef.current = setTimeout(poll, interval);
            }
        }
    }, [enabled, interval]);

    useEffect(() => {
        if (enabled) {
            poll();
        } else if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
        }

        return () => {
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
        };
    }, [enabled, poll]);
}
