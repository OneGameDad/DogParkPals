import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useFriendActions, useFriends, useEnemies, useFetch } from '../../hooks';
import { Loading, ErrorMessage, Pagination, FilterTabs } from '../common';
import { SearchBar } from '../features';
import Header from '../layout/Header';
import UserList from './UserList';
import UserProfileModal from './UserProfileModal';
import type { User } from '../../types';
import { useEntitySearch } from '../../hooks/search/useEntitySearch';
import { usePagination } from '../../hooks/search/usePagination';
import { useDebounce } from '../../hooks/useDebounce';

const PAGE_SIZE = 10;

type RelationshipFilter = 'all' | 'friends' | 'enemies';

const FriendFinder = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 400);
    const [activeFilter, setActiveFilter] = useState<RelationshipFilter>('all');

    // Base data
    const { data: baseUsers, loading: initialLoading, error: fetchError } = useFetch<User[]>('/users');

    // Advanced search hook
    const { results: searchResults, loading: rawSearchLoading, error: rawSearchError, isSearching } = useEntitySearch<User>('USER', debouncedQuery);
    const searchLoading = initialLoading || rawSearchLoading;
    const searchError = fetchError ?? rawSearchError;

    const {
        addFriend,
        addEnemy,
        isRequestSent,
        actionLoading,
        actionError,
        clearError
    } = useFriendActions();

    // Relationships Data
    const { friends, removeFriend, loading: friendsLoading } = useFriends(currentUser?.id);
    const { enemies, removeEnemy, loading: enemiesLoading } = useEnemies(currentUser?.id);

    // Combine data sources
    const processedUsers = useMemo(() => {
        let sourceData: User[] = [];

        if (activeFilter === 'friends') {
            sourceData = friends;
        } else if (activeFilter === 'enemies') {
            sourceData = enemies;
        } else {
            // 'all'
            sourceData = isSearching ? searchResults : (baseUsers || []);
        }

        // Apply local search filtering for friends/enemies tabs, since they don't use server search
        if (activeFilter !== 'all' && debouncedQuery && sourceData.length > 0) {
            const lowerQuery = debouncedQuery.toLowerCase();
            return sourceData.filter(user =>
                user.username.toLowerCase().includes(lowerQuery) ||
                (user.first_name?.toLowerCase().includes(lowerQuery)) ||
                (user.last_name?.toLowerCase().includes(lowerQuery))
            );
        }

        return sourceData;
    }, [activeFilter, friends, enemies, searchResults, baseUsers, isSearching, debouncedQuery]);

    // Pagination
    const { offset, setOffset, paginatedItems } = usePagination(processedUsers, PAGE_SIZE);

    // Reset pagination when search or filter changes
    useEffect(() => {
        setOffset(0);
    }, [searchQuery, activeFilter, setOffset]);

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
        const success = await addFriend(userId);
        if (success) handleCloseModal();
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

    const isFriend = (user: User) => friends.some((f: User) => Boolean(f) && f.id === user.id);
    const isEnemy = (user: User) => enemies.some((e: User) => Boolean(e) && e.id === user.id);

    const selectedIsFriend = selectedUser ? isFriend(selectedUser) : false;
    const selectedIsEnemy = selectedUser ? isEnemy(selectedUser) : false;

    const isLoading = searchLoading || friendsLoading || enemiesLoading;
    const currentError = searchError;

    // Determine empty message based on filter
    const getEmptyMessage = () => {
        if (searchQuery) return t('findFriends.noResults', 'No users found matching your search.');
        if (activeFilter === 'friends') return t('friends.noFriends', 'No friends yet');
        if (activeFilter === 'enemies') return t('enemies.noEnemies', 'No enemies yet');
        return t('findFriends.startSearching', 'Search to find users');
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-8 min-h-[500px] mb-8 w-full">
            <Header
                text={t('findFriends.title', 'User Directory')}
                level="h2"
                className="text-center mb-6"
            />

            <div className="mb-6 w-full max-w-2xl mx-auto">
                <SearchBar
                    onSearch={setSearchQuery}
                    placeholder={t('findFriends.searchPlaceholder', 'Search users...')}
                />
            </div>

            <FilterTabs<RelationshipFilter>
                tabs={[
                    { id: 'all', label: t('social.allUsers', 'All Users') },
                    { id: 'friends', label: t('friends.title', 'My Friends') },
                    { id: 'enemies', label: t('enemies.title', 'My Enemies') }
                ]}
                activeTab={activeFilter}
                onChange={setActiveFilter}
            />

            {isLoading && processedUsers.length === 0 ? (
                <Loading message={t('findFriends.loading', 'Loading...')} />
            ) : currentError ? (
                <ErrorMessage message={currentError.message || t('findFriends.failedToLoad', 'Failed to load users')} />
            ) : (
                <>
                    <UserList
                        users={paginatedItems}
                        currentUserId={currentUser?.id}
                        onUserClick={handleUserClick}
                        emptyMessage={getEmptyMessage()}
                        showChevron={true}
                    />

                    {processedUsers.length > 0 && (
                        <Pagination
                            offset={offset}
                            pageSize={PAGE_SIZE}
                            total={processedUsers.length}
                            onPageChange={setOffset}
                            className="mt-6"
                        />
                    )}
                </>
            )}

            <UserProfileModal
                user={selectedUser}
                onClose={handleCloseModal}
                onAddFriend={!selectedIsFriend ? handleAddFriend : undefined}
                onAddEnemy={!selectedIsEnemy ? handleAddEnemy : undefined}
                onRemoveFriend={selectedIsFriend ? handleRemoveFriend : undefined}
                onRemoveEnemy={selectedIsEnemy ? handleRemoveEnemy : undefined}
                isRequestSent={selectedUser ? isRequestSent(selectedUser.id) : false}
                loading={actionLoading}
                error={actionError}
            />
        </div>
    );
};

export default FriendFinder;
