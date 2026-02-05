import { useTranslation } from 'react-i18next';
import UserCard from './UserCard';
import type { User } from '../../types';

interface UserListProps {
    users: User[];
    currentUserId?: number;
    onUserClick: (user: User) => void;
    emptyMessage?: string;
    showChevron?: boolean;
}

export default function UserList({
    users,
    currentUserId,
    onUserClick,
    emptyMessage,
    showChevron = true
}: UserListProps) {
    const { t } = useTranslation();

    const safeUsers = Array.isArray(users) ? users : [];

    const filteredUsers = safeUsers.filter(user => user.id !== currentUserId);

    if (filteredUsers.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                {emptyMessage || t('findFriends.noUsersFound')}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {filteredUsers.map(user => (
                <UserCard
                    key={user.id}
                    user={user}
                    onClick={onUserClick}
                    showChevron={showChevron}
                />
            ))}
        </div>
    );
}
