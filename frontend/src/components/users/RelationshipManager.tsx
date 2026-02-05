import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loading, ErrorMessage, InputText } from '../common';
import Header from '../layout/Header';
import UserList from './UserList';
import UserProfileModal from './UserProfileModal';
import type { User } from '../../types';

interface RelationshipManagerProps {
    title: string;
    searchPlaceholder: string;
    emptyMessage: string;
    users: User[];
    loading: boolean;
    error: Error | null;
    onRemove: (userId: number) => Promise<boolean>;
    type: 'friend' | 'enemy';
}

const RelationshipManager = ({
    title,
    searchPlaceholder,
    emptyMessage,
    users,
    loading,
    error,
    onRemove,
    type
}: RelationshipManagerProps) => {
    const { t } = useTranslation();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter((user: User) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
    };

    const handleCloseModal = () => {
        setSelectedUser(null);
    };

    const handleRemove = async (userId: number) => {
        const success = await onRemove(userId);
        return success;
    };

    if (loading) {
        return <Loading message={t(`${type === 'friend' ? 'friends' : 'enemies'}.loading`)} />;
    }

    if (error) {
        return <ErrorMessage message={error.message} />;
    }

    // Determine props for UserProfileModal
    const modalProps = type === 'friend'
        ? { onRemoveFriend: handleRemove }
        : { onRemoveEnemy: handleRemove };

    return (
        <div className="bg-white rounded-lg shadow-md p-8 min-h-[500px]">
            <Header
                text={title}
                level="h2"
                className="text-center mb-6"
            />

            <div className="mb-6">
                <InputText
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder={searchPlaceholder}
                />
            </div>

            <UserList
                users={filteredUsers}
                onUserClick={handleUserClick}
                showChevron={false}
                emptyMessage={emptyMessage}
            />

            <UserProfileModal
                user={selectedUser}
                onClose={handleCloseModal}
                {...modalProps}
            />
        </div>
    );
};

export default RelationshipManager;
