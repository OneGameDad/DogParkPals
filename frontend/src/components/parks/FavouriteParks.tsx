import { useTranslation } from 'react-i18next';
import { useAuth, useFetch } from '../../hooks';
import { Header } from '../layout';
import { BodyText } from '../common';
import { ParkCard } from './';
import type { Park } from '../../types';

const FavoriteParks = () => {
    const { t } = useTranslation();
    const { user } = useAuth();

    const { data: favoriteParks, loading: loadingFavorites } = useFetch<Park[]>(
        user ? `/api/parks/favorites/${user.id}` : null,
        { skip: !user }
    );

    if (!user) return null;

    return (
        <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <Header text={t('profile.favoriteParks', 'Favorite Parks')} level="h2" />
            </div>
            {loadingFavorites ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : !favoriteParks || favoriteParks.length === 0 ? (
                <BodyText text={t('profile.noFavoriteParks', 'No favorite parks yet.')} colour="text-gray-500" className="text-center py-4" />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {favoriteParks.map((park) => (
                        <ParkCard key={park.id} park={park} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FavoriteParks;
