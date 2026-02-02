import { useState } from 'react';
import { useAuth } from '../useAuth';
import { useFetch } from '../useFetch';
import api from '../../services/api';
import type { Park } from '../../types';

export function useParkFavorite(parkId: string | undefined) {
    const { user, isAuthenticated } = useAuth();
    const [loadingAction, setLoadingAction] = useState(false);
    const [errorAction, setErrorAction] = useState<string | null>(null);

    const {
        data: favoriteParks,
        loading: loadingFavorites,
        refetch
    } = useFetch<Park[]>(
        user ? `/api/parks/favorites/${user.id}` : null,
        { skip: !user }
    );

    const isFavorite = favoriteParks?.some(p => p.id === Number(parkId)) || false;

    const toggleFavorite = async () => {
        if (!isAuthenticated || !user) {
            throw new Error('Please log in to favorite parks');
        }

        setLoadingAction(true);
        setErrorAction(null);

        try {
            if (isFavorite) {
                await api.delete(`/api/parks/favorites/${user.id}/${parkId}`);
            } else {
                await api.post(`/api/parks/favorites/${user.id}/${parkId}`);
            }
            await refetch();
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update favorite';
            setErrorAction(message);
            throw err;
        } finally {
            setLoadingAction(false);
        }
    };

    return {
        isFavorite,
        toggleFavorite,
        loading: loadingAction || loadingFavorites,
        error: errorAction
    };
}
