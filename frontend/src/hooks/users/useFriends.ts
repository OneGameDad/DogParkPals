import { useFetch } from '../useFetch';
import api from '../../services/api';
import { useSubmit } from '../useSubmit';
import { useAuth } from '../useAuth';
import type { User } from '../../types';

interface FriendResponse {
    users: User[];
    dogs: any[]; // We only care about users for now
}

export const useFriends = (targetUserId?: number) => {
    const { user: currentUser } = useAuth();

    // logic: if targetUserId is provided, fetch their friends. If not, fetch current user's friends.
    const effectiveUserId = targetUserId || currentUser?.id;

    const { data, loading, error, refetch } = useFetch<FriendResponse>(
        effectiveUserId ? `/api/friends?userId=${effectiveUserId}` : null
    );

    const friends = data?.users || [];

    const { submit: submitRemove } = useSubmit({
        successMessage: 'Friend removed',
        errorMessage: 'Failed to remove friend'
    });

    const removeFriend = async (friendId: number) => {
        if (!effectiveUserId) return false;

        const result = await submitRemove(async () => {
            // DELETE /api/friends with body { userId, friendId }
            await api.delete('/api/friends', { userId: effectiveUserId, friendId: friendId });
            refetch();
            return true;
        });
        return !!result;
    };

    return { friends, loading, error, removeFriend };
};
