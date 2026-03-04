import { useTranslation } from 'react-i18next';
import { Header } from '../layout';
import { Picture } from '../common';
import { formatTime, getUserInitials } from '../../utils/formatters';
import type { CheckIn } from '../../types';
import { getUserPhotoUrl, DEFAULT_IMAGES } from '../../constants';

interface CheckInListProps {
    checkIns: CheckIn[];
    loading?: boolean;
}

export default function CheckInList({ checkIns, loading }: CheckInListProps) {
    const { t } = useTranslation();

    return (
        <div className="mb-10">
            <div className="flex justify-between items-center mb-6">
                <Header text={t('parkDetails.checkedInUsers', "Who's here?")} level="h2" />
                <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium">
                    {checkIns.length} visiting now
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : checkIns.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {checkIns.map((checkIn) => {
                        const username = checkIn.user?.username || 'Unknown';
                        const photoUrl = getUserPhotoUrl(checkIn.user?.id, checkIn.user?.profilePictureUrl);

                        return (
                            <div
                                key={checkIn.id}
                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-gray-100"
                            >
                                {photoUrl !== DEFAULT_IMAGES.userProfile ? (
                                    <Picture
                                        location={photoUrl}
                                        size={56}
                                        shape="circle"
                                        alt={username}
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold text-lg">
                                        {getUserInitials(username)}
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-lg font-bold text-gray-800 truncate">
                                        {username}
                                    </p>
                                    <p className="text-sm text-gray-500 font-medium truncate">
                                        {checkIn.dog?.name ? `with ${checkIn.dog.name}` : 'visiting'}
                                    </p>
                                    <p className="text-xs text-blue-400 mt-1">
                                        Checked in {formatTime(checkIn.checkedInAt)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-10 bg-gray-50 rounded-xl text-center border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 text-lg">
                        {t('parkDetails.noOneCheckedIn', 'No one checked in right now. Be the first!')}
                    </p>
                </div>
            )}
        </div>
    );
}
