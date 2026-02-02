import { useEffect, useRef } from 'react';

interface UsePollingOptions {
    enabled?: boolean;
    interval?: number;
}

export function usePolling(
    callback: () => void,
    { enabled = true, interval = 30000 }: UsePollingOptions = {}
) {
    const savedCallback = useRef(callback);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!enabled) return;

        const id = setInterval(() => {
            savedCallback.current();
        }, interval);

        return () => clearInterval(id);
    }, [enabled, interval]);
}
