import { useAuth } from '../useAuth';
import api from '../../services/api';

export function useParkCheckIn(parkId: string | undefined, checkIns: any[]) {
    const { user, isAuthenticated } = useAuth();

    const isCheckedIn = checkIns.some(c => c.userId === user?.id);

    const toggleCheckIn = async () => {
        if (!isAuthenticated) {
            throw new Error('Please log in to check in');
        }

        try {
            if (isCheckedIn) {
                await api.post(`/api/parks/${parkId}/check-out`);
            } else {
                await api.post(`/api/parks/${parkId}/check-in`);
            }
            return true;
        } catch (err) {
            throw err;
        }
    };

    return {
        isCheckedIn,
        toggleCheckIn
    };
}
