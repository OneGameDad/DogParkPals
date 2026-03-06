import { useFetch } from '../useFetch';
import api from '../../services/api';
import { useSubmit } from '../useSubmit';
import type { Dog } from '../../types';

interface DogEnemyRelationship {
    id: number;
    ownerId: number;
    ownerDogId: number;
    enemyDogId: number;
    enemyDog: Dog;
    ownerDog: Dog;
}

export const useDogEnemies = (dogId?: number) => {
    const { data, loading, error, refetch } = useFetch<DogEnemyRelationship[]>(
        dogId ? `/api/dogs/${dogId}/enemies` : ''
    );

    const enemies = data?.map((r: DogEnemyRelationship) => r.enemyDog) || [];

    const { submit: submitRemove } = useSubmit({
        successMessage: 'Enemy removed',
        errorMessage: 'Failed to remove enemy'
    });

    const removeEnemy = async (enemyDogId: number) => {
        if (!dogId) return false;

        const result = await submitRemove(async () => {
            await api.delete(`/api/dogs/${dogId}/enemies`, { ownerDogId: dogId, enemyDogId });
            refetch();
            return true;
        });
        return !!result;
    };

    return { enemies, loading, error, removeEnemy, refetch };
};
