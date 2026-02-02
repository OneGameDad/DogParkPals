import { Picture } from '../common';
import { DEFAULT_IMAGES } from '../../constants';

interface ParkHeroProps {
    name: string;
    imageUrl?: string;
}

export default function ParkHero({ name, imageUrl }: ParkHeroProps) {
    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="h-64 sm:h-80 md:h-96 w-full relative">
                <Picture
                    location={imageUrl || DEFAULT_IMAGES.parkHero}
                    alt={name}
                    className="w-full h-full object-cover"
                    shape="rect"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 sm:p-8">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
                        {name}
                    </h1>
                </div>
            </div>
        </div>
    );
}
