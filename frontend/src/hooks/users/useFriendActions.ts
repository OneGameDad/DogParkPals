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

    const { submit: submitAccept, isSubmitting: acceptLoading } = useSubmit({
        successMessage: 'Friend request accepted!',
        errorMessage: 'Failed to accept request'
    });

    const { submit: submitDecline, isSubmitting: declineLoading } = useSubmit({
        successMessage: 'Friend request declined',
        errorMessage: 'Failed to decline request'
    });

    const addFriend = async (targetId: number, isDog: boolean = false, requesterDogId?: number) => {
        if (!user) return false;

        const result = await submitAddFriend(async () => {
            const payload: any = {};

            if (isDog) {
                // Dog-to-Dog friendship
                if (!requesterDogId) {
                    console.error('Requester Dog ID is required for dog friendships');
                    return false;
                }
                payload.requesterDogId = requesterDogId;
                payload.addresseeDogId = targetId;
            } else {
                // User-to-User friendship
                payload.requesterId = user.id;
                payload.addresseeId = targetId;
            }

            // POST /api/friends
            await api.post<{ id: number }>('/api/friends', payload);

            setSentRequests(prev => [...prev, targetId]);
            return true;
        });
        return !!result;
    };

    const addEnemy = async (targetId: number, isDog: boolean = false, requesterDogId?: number) => {
        if (!user) return false;
        const result = await submitAddEnemy(async () => {
            const payload: any = { userId: user.id, enemyUserId: targetId };

            await api.post('/api/enemies', payload);
            return true;
        });
        return !!result;
    };

    const acceptRequest = async (requestId: number) => {
        const result = await submitAccept(async () => {
            await api.post('/api/friends/accept', { friendshipId: requestId });
            return true;
        });
        return !!result;
    };

    const declineRequest = async (requestId: number) => {
        const result = await submitDecline(async () => {
            await api.post('/api/friends/decline', { friendshipId: requestId });
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
        acceptRequest,
        declineRequest,
        isRequestSent,
        actionLoading: addFriendLoading || addEnemyLoading || acceptLoading || declineLoading,
        actionError: addFriendError || addEnemyError,
        clearError
    };
};

