import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loading, ErrorMessage, InputText } from '../common';
import Header from '../layout/Header';
import DogList from './DogList';
import DogProfileModal from './DogProfileModal';
import { useDogSearch } from '../../hooks/users/useDogSearch';
import type { Dog } from '../../types';

const DogFinder = () => {
    const { t } = useTranslation();
    const { searchQuery, setSearchQuery, dogs, loading, error } = useDogSearch();
    const [selectedDog, setSelectedDog] = useState<Dog | null>(null);

    const handleDogClick = (dog: Dog) => {
        setSelectedDog(dog);
    };

    const handleCloseModal = () => {
        setSelectedDog(null);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-8 min-h-[500px]">
            <Header
                text={t('dogProfile.findDogs') || 'Find Dogs'}
                level="h2"
                className="text-center mb-6"
            />

            <div className="mb-8">
                <InputText
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={t('dogProfile.searchPlaceholder') || 'Search dogs by name or breed...'}
                    label={t('dogProfile.searchLabel') || 'Search Dogs'}
                />
            </div>

            {loading && !dogs ? (
                <Loading message={t('common.loading') || 'Loading...'} />
            ) : error ? (
                <ErrorMessage message={t('common.error') || 'Failed to load dogs'} />
            ) : (
                <DogList
                    dogs={dogs}
                    onDogClick={handleDogClick}
                    emptyMessage={t('dogProfile.noDogsFound') || 'No dogs found.'}
                />
            )}

            <DogProfileModal
                dog={selectedDog}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default DogFinder;
