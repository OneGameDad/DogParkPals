import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Park } from '../../types';
import { Picture, Badge } from '../common';
import { DEFAULT_IMAGES } from '../../constants';

interface ParkCardProps {
    park: Park;
}

const ParkCard: React.FC<ParkCardProps> = ({ park }) => {
    const { t } = useTranslation();

    return (
        <Link
            to={`/parks/${park.id}`}
            className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100"
        >
            <div className="flex p-4 gap-4">
                <div className="flex-shrink-0">
                    <Picture
                        location={park.profilePictureUrl || DEFAULT_IMAGES.parkCard}
                        size={100}
                        shape="square"
                        alt={park.name}
                    />
                </div>

                <div className="flex flex-col justify-between flex-grow overflow-hidden">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 truncate mb-1">
                            {park.name}
                        </h3>

                        <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                            {park.description || t('parks.noDescription', 'No description available')}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto">
                        {park.amenities && park.amenities.slice(0, 3).map((amenity) => (
                            <Badge
                                key={amenity}
                                text={amenity.replace(/_/g, ' ')}
                            />
                        ))}
                        {park.amenities && park.amenities.length > 3 && (
                            <Badge
                                text={`+${park.amenities.length - 3}`}
                                variant="gray"
                            />
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ParkCard;
