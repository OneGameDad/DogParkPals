import api from '../../services/api';
import { useSubmit } from '../useSubmit';

export const useDogEnemyActions = () => {
    const { submit: submitAddEnemy, isSubmitting: addEnemyLoading, error: addEnemyError } = useSubmit({
        successMessage: 'Dog enemy added!',
        errorMessage: 'Failed to add dog enemy'
    });

    const addDogEnemy = async (ownerDogId: number, enemyDogId: number) => {
        const result = await submitAddEnemy(async () => {
            await api.post(`/api/dogs/${ownerDogId}/enemies`, { ownerDogId, enemyDogId });
            return true;
        });
        return !!result;
    };

    return {
        addDogEnemy,
        addEnemyLoading,
        addEnemyError,
    };
};
