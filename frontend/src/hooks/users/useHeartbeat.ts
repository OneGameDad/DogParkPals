import { useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../../constants';

interface UseHeartbeatOptions {
	enabled?: boolean;
	interval?: number; // in milliseconds
}

export const useHeartbeat = ({ 
	enabled = true, 
	interval = 120000 // default 2 minutes (120 seconds)
}: UseHeartbeatOptions = {}) => {
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const sendHeartbeat = useCallback(async () => {
		try {
			await fetch(`${API_BASE_URL}/users/presence/heartbeat`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			});
		} catch (error) {
			console.error('Failed to send heartbeat:', error);
		}
	}, []);

	useEffect(() => {
		if (!enabled) return;

		// Send immediately on mount
		sendHeartbeat();

		// Set up interval
		intervalRef.current = setInterval(sendHeartbeat, interval);

		// Cleanup
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [enabled, interval, sendHeartbeat]);
};
