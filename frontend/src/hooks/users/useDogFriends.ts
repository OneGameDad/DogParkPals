import { useFetch } from '../useFetch';
import api from '../../services/api';
import { useSubmit } from '../useSubmit';
import type { Dog, User } from '../../types';

interface DogFriendResponse {
    users: User[];
    dogs: Dog[];
}

export const useDogFriends = (dogId?: number) => {
    const { data, loading, error, refetch } = useFetch<DogFriendResponse>(
        dogId ? `/api/friends?dogId=${dogId}` : null
    );

    const friends = data?.dogs || [];

    const { submit: submitRemove } = useSubmit({
        successMessage: 'Friend removed',
        errorMessage: 'Failed to remove friend'
    });

    const removeFriend = async (friendDogId: number) => {
        if (!dogId) return false;

        const result = await submitRemove(async () => {
            await api.delete('/api/friends', { dogId, friendDogId });
            refetch();
            return true;
        });
        return !!result;
    };

    return { friends, loading, error, removeFriend, refetch };
};
