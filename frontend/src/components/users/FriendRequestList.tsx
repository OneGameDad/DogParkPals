import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch';
import { useFriendActions } from '../../hooks/users/useFriendActions';
import { Loading, ErrorMessage, Button, Picture } from '../common';
import type { User, Dog } from '../../types';
import { getDogPhotoUrl, getUserPhotoUrl } from '../../constants';

interface FriendRequestListProps {
    userId?: number;
    dogId?: number;
}

interface FriendshipRequest {
    id: number;
    requesterId: number | null;
    addresseeId: number | null;
    requesterDogId: number | null;
    addresseeDogId: number | null;
    status: 'PENDING';
    requester?: User;
    requesterDog?: Dog;
}

const FriendRequestList = ({ userId, dogId }: FriendRequestListProps) => {
    const { t } = useTranslation();
    const endpoint = userId
        ? `/api/friends/requests?userId=${userId}`
        : dogId
            ? `/api/friends/requests?dogId=${dogId}`
            : '';

    const { data: requests, loading, error, refetch } = useFetch<FriendshipRequest[]>(endpoint);
    const { acceptRequest, declineRequest, actionLoading } = useFriendActions();

    const handleAccept = async (requestId: number) => {
        const success = await acceptRequest(requestId);
        if (success) refetch();
    };

    const handleDecline = async (requestId: number) => {
        const success = await declineRequest(requestId);
        if (success) refetch();
    };

    if (loading) return <Loading message={t('common.loading')} />;
    if (error) return <ErrorMessage message={t('common.error')} />;
    if (!requests || requests.length === 0) return null;

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-yellow-400">
            <h3 className="text-xl font-bold mb-4">{t('friends.pendingRequests') || 'Pending Requests'}</h3>
            <div className="space-y-4">
                {requests.map((req) => {
                    const name = req.requesterDog ? req.requesterDog.name : req.requester?.username || 'Unknown';
                    const pic = req.requesterDog
                        ? getDogPhotoUrl(req.requesterDog.id, req.requesterDog.profilePictureUrl)
                        : getUserPhotoUrl(req.requester?.id, req.requester?.profilePictureUrl);
                    const type = req.requesterDog ? 'Dog' : 'User';

                    return (
                        <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <Picture location={pic} size={48} shape="circle" alt={name} />
                                <div>
                                    <p className="font-semibold">{name}</p>
                                    <p className="text-sm text-gray-500">{type} Request</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    text={t('common.accept') || 'Accept'}
                                    onClick={() => handleAccept(req.id)}
                                    disabled={actionLoading}
                                    className="bg-green-600 hover:bg-green-700 text-sm px-3 py-1"
                                />
                                <Button
                                    text={t('common.decline') || 'Decline'}
                                    onClick={() => handleDecline(req.id)}
                                    disabled={actionLoading}
                                    className="bg-red-600 hover:bg-red-700 text-sm px-3 py-1"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FriendRequestList;
