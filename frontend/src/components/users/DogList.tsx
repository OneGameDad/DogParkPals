import { useTranslation } from 'react-i18next';
import DogCard from './DogCard';
import type { Dog } from '../../types';

interface DogListProps {
    dogs: Dog[] | undefined;
    emptyMessage?: string;
    onDogClick?: (dog: Dog) => void;
    onRemove?: (dog: Dog) => void;
}

const DogList = ({ dogs, emptyMessage, onDogClick, onRemove }: DogListProps) => {
    const { t } = useTranslation();

    if (!dogs || dogs.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <p>{emptyMessage || t('dogList.noDogs')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-4">
            {dogs.map((dog) => (
                <DogCard
                    key={dog.id}
                    dog={dog}
                    onClick={onDogClick}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
};

export default DogList;
