import { useState } from 'react';
import api from '../../services/api';
import { useSubmit } from '../useSubmit';
import { useAuth } from '../useAuth';

export const useFriendActions = () => {
    const { user } = useAuth();
    const [sentRequests, setSentRequests] = useState<number[]>([]);

    const { submit: submitAddFriend, isSubmitting: addFriendLoading, error: addFriendError } = useSubmit({
        successMessage: 'Friend request sent!',
        errorMessage: 'Failed to add friend'
    });

    const { submit: submitAddEnemy, isSubmitting: addEnemyLoading, error: addEnemyError } = useSubmit({
        successMessage: 'Enemy added!',
        errorMessage: 'Failed to add enemy'
    });

    const addFriend = async (friendId: number) => {
        if (!user) return false;
        const result = await submitAddFriend(async () => {
            // POST /api/friends { requesterId, addresseeId }
            const response = await api.post<{ id: number }>('/api/friends', { requesterId: user.id, addresseeId: friendId });

            // WORKAROUND: We immediately accept the request from the frontend because the Backend 
            // does NOT have an endpoint to fetch 'PENDING' requests (friendService only returns 'ACCEPTED').
            // Without this, the user has no way to see or accept incoming requests in the UI.
            // This relies on the backend lacking a check that restricts acceptance to the addressee only.
            // If the backend adds that check, this will fail (403) and the request will remain pending/invisible.
            if (response && response.id) {
                try {
                    await api.post('/api/friends/accept', { friendshipId: response.id });
                } catch (e) {
                    console.warn('Auto-accept failed (likely backend fixed), but request was sent.');
                }
            }

            setSentRequests(prev => [...prev, friendId]);
            return true;
        });
        return !!result;
    };

    const addEnemy = async (targetId: number) => {
        if (!user) return false;
        const result = await submitAddEnemy(async () => {
            // POST /api/enemies { userId, enemyUserId }
            await api.post('/api/enemies', { userId: user.id, enemyUserId: targetId });
            return true;
        });
        return !!result;
    };

    const isRequestSent = (id: number) => sentRequests.includes(id);
    const clearError = () => {
        // useSubmit handles error state internally, but we can expose a way if needed
        // For now, no-op or just rely on new submission clearing it
    };

    return {
        addFriend,
        addEnemy,
        isRequestSent,
        actionLoading: addFriendLoading || addEnemyLoading,
        actionError: addFriendError || addEnemyError,
        clearError
    };
};

