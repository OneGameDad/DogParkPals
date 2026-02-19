import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import type { User } from '../../types';
import UserList from '../users/UserList';
import { Loading, ErrorMessage } from '../common';

interface ConversationListProps {
    currentUserId: number;
    activeFriendId: number | null;
    onSelectFriend: (friendId: number) => void;
}

const ConversationList = ({ currentUserId, activeFriendId, onSelectFriend }: ConversationListProps) => {
    const { t } = useTranslation();
    const [friends, setFriends] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                setLoading(true);
                const response = await api.get<{ users: User[], dogs: any[] }>('/api/friends');
                setFriends(response.users || []);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch friends for chat:', err);
                setError(t('chat.failedToLoadFriends') || 'Failed to load friends list');
            } finally {
                setLoading(false);
            }
        };

        if (currentUserId) {
            fetchFriends();
        }
    }, [currentUserId, t]);

    if (loading) return <Loading message={t('common.loading')} />;

    if (error) return <ErrorMessage message={error} />;

    const emptyStateMessage = (
        <>
            <p>{t('chat.noFriends') || 'No friends found.'}</p>
            <p className="text-sm mt-2">{t('chat.addFriendsToChat') || 'Add friends to start chatting!'}</p>
        </>
    );

    return (
        <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">{t('chat.conversations') || 'Conversations'}</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                <UserList
                    users={friends}
                    activeUserId={activeFriendId || undefined}
                    onUserClick={(user) => onSelectFriend(user.id)}
                    emptyMessage={emptyStateMessage}
                    showChevron={false}
                />
            </div>
        </div>
    );
};

export default ConversationList;
