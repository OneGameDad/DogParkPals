import { useTranslation } from 'react-i18next';
import { Header } from '../layout';

interface ParkLocationMapProps {
    latitude: number;
    longitude: number;
    address: string;
}

export default function ParkLocationMap({
    latitude,
    longitude,
    address
}: ParkLocationMapProps) {
    const { t } = useTranslation();

    const mapUrl = `https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${longitude},${latitude}&z=14&l=map&size=400,200&pt=${longitude},${latitude},pm2rdm`;
    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <Header text={t('parkDetails.location', 'Location')} level="h4" className="mb-4" />

            <div className="rounded-lg overflow-hidden mb-3 border border-gray-200">
                <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative group"
                >
                    <img
                        src={mapUrl}
                        alt="Map location"
                        className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <span className="bg-white/90 px-3 py-1 rounded-full text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            {t('parkDetails.directions', 'Get Directions')} ↗
                        </span>
                    </div>
                </a>
            </div>

            <p className="text-sm text-gray-600">{address}</p>
        </div>
    );
}
