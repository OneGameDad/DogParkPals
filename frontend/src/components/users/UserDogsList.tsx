import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks';
import { Picture } from '../common';

interface UserDogsListProps {
    userId: number;
}

const UserDogsList: React.FC<UserDogsListProps> = ({ userId }) => {
    const { t } = useTranslation();
    const { data: dogs, loading, error } = useFetch(`/api/dogs/owner/${userId}`);

    if (loading) return <div className="text-center text-sm text-gray-500">{t('profile.loading') || 'Loading dogs...'}</div>;
    if (error) return null;

    if (!dogs || dogs.length === 0) {
        return <div className="text-center text-sm text-gray-500 italic">{t('profile.noDogs') || 'No dogs added yet.'}</div>;
    }

    return (
        <div className="flex flex-wrap justify-center gap-4">
            {dogs.map((dog: any) => (
                <div key={dog.id} className="flex flex-col items-center">
                    <Picture
                        location={dog.profilePictureUrl}
                        size={50}
                        shape="circle"
                        alt={dog.name}
                        className="mb-1"
                    />
                    <span className="text-xs font-medium text-gray-700">{dog.name}</span>
                </div>
            ))}
        </div>
    );
};

export default UserDogsList;
