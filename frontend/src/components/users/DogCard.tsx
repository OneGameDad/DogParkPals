import { useTranslation } from 'react-i18next';
import { Picture } from '../common';
import type { Dog } from '../../types';
import { getDogPhotoUrl } from '../../constants';

interface DogCardProps {
    dog: Dog;
    onClick?: (dog: Dog) => void;
    onRemove?: (dog: Dog) => void;
}

const DogCard = ({ dog, onClick, onRemove }: DogCardProps) => {
    const { t } = useTranslation();

    return (
        <div
            className="relative flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer group"
            onClick={() => onClick?.(dog)}
        >
            <Picture
                location={getDogPhotoUrl(dog.id, dog.profilePictureUrl)}
                size={64}
                shape="circle"
                alt={dog.name}
            />
            <div className="flex-1">
                <h3 className="font-semibold text-lg">{dog.name}</h3>
                <p className="text-gray-500 text-sm">{dog.breed.replace(/_/g, ' ')}</p>
                <div className="flex gap-2 text-xs text-gray-400 mt-1">
                    <span>{dog.gender}</span>
                    <span>•</span>
                    <span>{dog.size}</span>
                </div>
            </div>
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(dog);
                    }}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default DogCard;
