import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUserAchievements } from '../../hooks/users/useUserAchievements';
import { Loading, ErrorMessage } from '../common';
import { Header } from '../layout';

interface Props {
    userId: number;
}

export const UserAchievementsList: React.FC<Props> = ({ userId }) => {
    const { t } = useTranslation();
    const { achievements, loading, error } = useUserAchievements(userId);

    if (loading) {
        return <Loading message={t('profile.loadingAchievements', 'Loading achievements...')} />;
    }

    if (error) {
        return <ErrorMessage message={t('profile.errorAchievements', 'Failed to load achievements')} />;
    }

    if (!achievements.length) {
        return (
            <div className="text-gray-500 italic mt-4">
                {t('profile.noAchievements', 'No achievements earned yet.')}
            </div>
        );
    }

    return (
        <div className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {achievements.map(({ achievement, dateEarned }) => (
                    <div
                        key={achievement.id}
                        className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-200 text-center transition-transform hover:scale-105"
                        title={achievement.description || achievement.name}
                    >
                        <div className="text-4xl mb-2">
                            {achievement.badgeUrl ? (
                                <img
                                    src={achievement.badgeUrl}
                                    alt={achievement.name}
                                    className="w-12 h-12 object-contain"
                                    onError={(e) => {
                                        // Fallback to emoji if badge url fails to load or isn't a valid url
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML += '🏆';
                                    }}
                                />
                            ) : (
                                '🏆'
                            )}
                        </div>
                        <h4 className="font-semibold text-sm text-gray-800 break-words w-full">
                            {achievement.name}
                        </h4>
                        <span className="text-xs text-gray-500 mt-1">
                            {new Date(dateEarned).toLocaleDateString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
