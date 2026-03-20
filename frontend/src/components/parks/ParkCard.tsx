import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Park } from '../../types';
import type { ParkSearchResult } from '../../services/searchService';
import { Badge } from '../common';
import { formatAmenity } from '../../utils/formatters';

interface ParkCardProps {
    park: Park | ParkSearchResult;
}

const ParkCard: React.FC<ParkCardProps> = ({ park }) => {
    const { t } = useTranslation();

    return (
        <Link
            to={`/parks/${park.id}`}
            className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100"
        >
            <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {park.name}
                </h3>

                <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                    {park.description || t('parks.noDescription', 'No description available')}
                </p>

                <div className="flex flex-wrap gap-2">
                    {park.amenities && park.amenities.slice(0, 3).map((amenity) => (
                        <Badge
                            key={amenity}
                            text={formatAmenity(amenity)}
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
        </Link>
    );
};

export default ParkCard;
