import { useAuth } from '../useAuth';
import { useFetch } from '../useFetch';
import api from '../../services/api';
import type { Park } from '../../types';

export function useParkFavorite(parkId: string | undefined) {
    const { user, isAuthenticated } = useAuth();

    const {
        data: favoriteParks,
        loading: loadingFavorites,
        refetch
    } = useFetch<Park[]>(
        user ? `/api/parks/favorites/${user.id}` : null
    );

    const isFavorite = favoriteParks?.some(p => p.id === Number(parkId)) || false;

    const toggleFavorite = async () => {
        if (!isAuthenticated || !user) {
            throw new Error('Please log in to favorite parks');
        }

        try {
            if (isFavorite) {
                await api.delete(`/api/parks/favorites/${user.id}/${parkId}`);
            } else {
                await api.post(`/api/parks/favorites/${user.id}/${parkId}`);
            }
            await refetch();
            return true;
        } catch (err) {
            throw err;
        }
    };

    return {
        isFavorite,
        toggleFavorite,
        loading: loadingFavorites
    };
}
