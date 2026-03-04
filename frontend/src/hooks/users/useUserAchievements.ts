import { useFetch } from '../useFetch';
import type { Achievements, UserAchievement } from '../../types';

export interface UserAchievementWithDetails extends UserAchievement {
    achievement: Achievements;
}

export const useUserAchievements = (userId?: number) => {
    const { data, loading, error, refetch } = useFetch<UserAchievementWithDetails[]>(
        userId ? `/api/achievements/user/${userId}` : null
    );

    return {
        achievements: data || [],
        loading,
        error,
        refetch,
    };
};
