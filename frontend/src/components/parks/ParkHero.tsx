interface ParkHeroProps {
    name: string;
}

export default function ParkHero({ name }: ParkHeroProps) {
    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800">
                {name}
            </h1>
        </div>
    );
}
