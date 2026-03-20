import { useFetch } from '../useFetch';
import api from '../../services/api';
import { useSubmit } from '../useSubmit';
import type { User } from '../../types';
// Define interface for the API response which includes the relationship details
interface EnemyRelationship {
    id: number;
    ownerId: number;
    enemyUserId: number | null;
    enemyUser: User | null;
}

export const useEnemies = (userId?: number) => {
    // Backend endpoint is /api/enemies for current user context if used with session, 
    // but controller getEnemy uses /api/enemies/:userId
    const { data: relationships, loading, error, refetch } = useFetch<EnemyRelationship[]>(userId ? `/api/enemies/${userId}` : '');

    // Transform relationship objects to User objects
    const enemies = relationships
        ?.map((r: EnemyRelationship): User | null => r.enemyUser)
        .filter((enemy: User | null): enemy is User => enemy !== null) || [];

    const { submit: submitRemove } = useSubmit({
        successMessage: 'Enemy removed',
        errorMessage: 'Failed to remove enemy'
    });

    const removeEnemy = async (enemyId: number) => {
        if (!userId) return false;

        const result = await submitRemove(async () => {
            // DELETE /api/enemies with body { userId, enemyUserId }
            await api.delete('/api/enemies', { userId, enemyUserId: enemyId });
            refetch();
            return true;
        });
        return !!result;
    };

    return { enemies: enemies || [], loading, error, removeEnemy };
};
