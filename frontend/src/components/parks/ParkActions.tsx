import { useTranslation } from 'react-i18next';

interface ParkActionsProps {
    isCheckedIn: boolean;
    isFavorite: boolean;
    onCheckInToggle: () => void;
    onFavoriteToggle: () => void;
    loading?: boolean;
}

export default function ParkActions({
    isCheckedIn,
    isFavorite,
    onCheckInToggle,
    onFavoriteToggle,
    loading
}: ParkActionsProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 sticky top-4">
            <div className="flex gap-4 mb-6">
                <button
                    onClick={onCheckInToggle}
                    disabled={loading}
                    className={`flex-1 font-bold py-3 px-4 rounded-xl transition-colors shadow-sm ${isCheckedIn
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isCheckedIn ? t('parkDetails.checkOut', 'Check Out') : t('parkDetails.checkIn', 'Check In')}
                </button>

                <button
                    onClick={onFavoriteToggle}
                    disabled={loading}
                    className={`w-14 h-12 flex items-center justify-center rounded-xl border-2 transition-all ${isFavorite
                        ? 'border-red-500 bg-red-50 text-red-500'
                        : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-300'
                        } disabled:opacity-50`}
                    title={isFavorite ? t('parkDetails.unfavorite', "Remove from favorites") : t('parkDetails.favorite', "Add to favorites")}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill={isFavorite ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                </button>
            </div>

            <p className="text-xs text-center text-gray-500">
                {t('parkDetails.visitingHelper', 'Let others know you and your dog are visiting!')}
            </p>
        </div>
    );
}
