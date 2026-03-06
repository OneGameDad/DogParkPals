import { useFetch } from '../useFetch';
import type { User } from '../../types';

export const useDogOwners = (dogId?: number) => {
    const { data, loading, error, refetch } = useFetch<User[]>(
        dogId ? `/api/dogs/${dogId}/owners` : ''
    );

    const owners = data || [];

    return { owners, loading, error, refetch };
};
