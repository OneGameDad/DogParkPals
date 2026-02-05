import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useUserSearch, useFriendActions, useFriends, useEnemies } from '../../hooks';
import { Loading, ErrorMessage, InputText } from '../common';
import Header from '../layout/Header';
import UserList from './UserList';
import UserProfileModal from './UserProfileModal';
import type { User } from '../../types';

const FriendFinder = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const { searchQuery, setSearchQuery, users, loading, error } = useUserSearch();

    const {
        addFriend,
        addEnemy,
        isRequestSent,
        actionLoading,
        actionError,
        clearError
    } = useFriendActions();

    // Fetch friends and enemies to determine relationship status
    // Note: This might fetch on every mount, but it ensures we have latest data.
    // In the future we will use react-query to share this state
    const { friends, removeFriend } = useFriends(currentUser?.id);
    const { enemies, removeEnemy } = useEnemies(currentUser?.id);

    const handleUserClick = (user: User) => {
        clearError();
        setSelectedUser(user);
    };

    const handleCloseModal = () => {
        setSelectedUser(null);
        clearError();
    };

    // Action Handlers
    const handleAddFriend = async (userId: number) => {
        await addFriend(userId);
        handleCloseModal();
    };

    const handleAddEnemy = async (userId: number) => {
        const success = await addEnemy(userId);
        if (success) handleCloseModal();
    };

    const handleRemoveFriend = async (userId: number) => {
        const success = await removeFriend(userId);
        if (success) handleCloseModal();
    };

    const handleRemoveEnemy = async (userId: number) => {
        const success = await removeEnemy(userId);
        if (success) handleCloseModal();
    };

    const isFriend = selectedUser ? friends.some((f: User) => f.id === selectedUser.id) : false;
    const isEnemy = selectedUser ? enemies.some((e: User) => e.id === selectedUser.id) : false;

    const showLoading = loading && (!users || users.length === 0);
    const showError = error;

    return (
        <div className="bg-white rounded-lg shadow-md p-8 min-h-[500px] mb-8">
            <Header
                text={t('findFriends.title')}
                level="h2"
                className="text-center mb-6"
            />

            <div className="mb-8">
                <InputText
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={t('findFriends.searchPlaceholder')}
                    label={t('findFriends.searchLabel')}
                    name="search"
                />
            </div>

            {
                showLoading ? (
                    <Loading message={t('findFriends.loading')} />
                ) : showError ? (
                    <ErrorMessage message={t('findFriends.failedToLoad')} />
                ) : (
                    <UserList
                        users={users}
                        currentUserId={currentUser?.id}
                        onUserClick={handleUserClick}
                    />
                )
            }

            <UserProfileModal
                user={selectedUser}
                onClose={handleCloseModal}
                onAddFriend={!isFriend && !isEnemy ? handleAddFriend : undefined}
                onAddEnemy={!isEnemy ? handleAddEnemy : undefined}
                onRemoveFriend={isFriend ? handleRemoveFriend : undefined}
                onRemoveEnemy={isEnemy ? handleRemoveEnemy : undefined}

                isRequestSent={selectedUser ? isRequestSent(selectedUser.id) : false}
                loading={actionLoading}
                error={actionError}
            />
        </div >
    );
};

export default FriendFinder;
