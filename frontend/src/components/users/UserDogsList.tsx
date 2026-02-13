import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks';
import { Picture } from '../common';
import type { Dog } from '../../types';

interface UserDogsListProps {
    userId: number;
    dogs?: Dog[];
    editable?: boolean;
}

const UserDogsList: React.FC<UserDogsListProps> = ({ userId, dogs: propDogs, editable = false }) => {
    const { t } = useTranslation();
    const { data: fetchedDogs, loading, error } = useFetch<Dog[]>(
        propDogs !== undefined ? '' : `/api/dogs/owner/${userId}`
    );

    const dogs = propDogs !== undefined ? propDogs : fetchedDogs;

    if (loading) return <div className="text-center text-sm text-gray-500">{t('profile.loading') || 'Loading dogs...'}</div>;
    if (error) return null;

    if (!dogs || dogs.length === 0) {
        return <div className="text-center text-sm text-gray-500 italic">{t('profile.noDogs') || 'No dogs added yet.'}</div>;
    }

    // Editable view (own profile) - larger cards with links
    if (editable) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {dogs.map((dog) => (
                    <Link
                        key={dog.id}
                        to={`/dog/${dog.id}`}
                        className="flex flex-col items-center p-4 border rounded-lg hover:shadow-lg transition-shadow"
                    >
                        <div className="mb-3">
                            <Picture
                                location={dog.profilePictureUrl || '/imgs/exampledogpic.jpg'}
                                size={96}
                                shape="circle"
                                alt={dog.name}
                            />
                        </div>
                        <span className="font-semibold text-gray-800">{dog.name}</span>
                    </Link>
                ))}
            </div>
        );
    }

    // Read-only view (other user's profile) - compact display
    return (
        <div className="flex flex-wrap justify-center gap-4">
            {dogs.map((dog) => (
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
