import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../../constants';

interface UserPresence {
	userId: number;
	lastSeenAt: Date | null;
	isOnline: boolean;
	heartbeatIntervalSeconds: number;
	offlineTimeoutSeconds: number;
}

interface UseUserPresenceOptions {
	userId: number | undefined;
	enabled?: boolean;
	pollingInterval?: number; // in milliseconds
}

export const useUserPresence = ({ 
	userId, 
	enabled = true, 
	pollingInterval = 30000 // default 30 seconds
}: UseUserPresenceOptions) => {
	const [presence, setPresence] = useState<UserPresence | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const mountedRef = useRef(true);

	const fetchPresence = useCallback(async () => {
		if (!userId || !enabled) return;

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`${API_BASE_URL}/users/presence/${userId}`, {
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch presence: ${response.statusText}`);
			}

			const data = await response.json();
			
			if (mountedRef.current) {
				setPresence(data);
			}
		} catch (err) {
			if (mountedRef.current) {
				setError(err instanceof Error ? err.message : 'Unknown error');
				setPresence(null);
			}
		} finally {
			if (mountedRef.current) {
				setLoading(false);
			}
		}
	}, [userId, enabled]);

	useEffect(() => {
		mountedRef.current = true;

		// Fetch immediately on mount or when dependencies change
		if (userId && enabled) {
			fetchPresence();
		}

		// Set up polling interval
		if (userId && enabled && pollingInterval > 0) {
			intervalRef.current = setInterval(fetchPresence, pollingInterval);
		}

		// Cleanup
		return () => {
			mountedRef.current = false;
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [userId, enabled, pollingInterval, fetchPresence]);

	return {
		presence,
		isOnline: presence?.isOnline ?? false,
		lastSeenAt: presence?.lastSeenAt,
		loading,
		error,
		refetch: fetchPresence
	};
};
