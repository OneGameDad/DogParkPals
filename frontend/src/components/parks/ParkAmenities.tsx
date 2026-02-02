import { useTranslation } from 'react-i18next';
import { Header } from '../layout';
import { Badge } from '../common';
import { formatAmenity } from '../../utils/formatters';

interface ParkAmenitiesProps {
    amenities?: string[];
}

export default function ParkAmenities({ amenities }: ParkAmenitiesProps) {
    const { t } = useTranslation();

    return (
        <div className="mb-8">
            <Header text={t('parkDetails.amenities', 'Amenities')} level="h3" className="mb-4" />
            {amenities && amenities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity) => (
                        <Badge
                            key={amenity}
                            text={formatAmenity(amenity)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 italic">
                    No specific amenities listed.
                </p>
            )}
        </div>
    );
}
