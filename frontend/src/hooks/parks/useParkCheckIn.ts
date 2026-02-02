import { useState } from 'react';
import { useAuth } from '../useAuth';
import api from '../../services/api';

export function useParkCheckIn(parkId: string | undefined, checkIns: any[]) {
    const { user, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isCheckedIn = checkIns.some(c => c.userId === user?.id);

    const toggleCheckIn = async () => {
        if (!isAuthenticated) {
            throw new Error('Please log in to check in');
        }

        setLoading(true);
        setError(null);

        try {
            if (isCheckedIn) {
                await api.post(`/api/parks/${parkId}/check-out`);
            } else {
                await api.post(`/api/parks/${parkId}/check-in`);
            }
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update check-in';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        isCheckedIn,
        toggleCheckIn,
        loading,
        error
    };
}
