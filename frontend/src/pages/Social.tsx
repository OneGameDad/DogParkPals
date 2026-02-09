import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FriendFinder, RelationshipManager, DogFinder, FriendRequestList } from '../components/users';
import { useAuth, useFriends, useEnemies } from '../hooks';

const Social = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'people' | 'dogs'>('people');

    const { friends, loading: friendsLoading, error: friendsError, removeFriend } = useFriends(currentUser?.id);
    const { enemies, loading: enemiesLoading, error: enemiesError, removeEnemy } = useEnemies(currentUser?.id);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">{t('social.title', 'Social')}</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
                <button
                    className={`py-2 px-6 font-semibold focus:outline-none ${activeTab === 'people' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('people')}
                >
                    {t('social.people') || 'People'}
                </button>
                <button
                    className={`py-2 px-6 font-semibold focus:outline-none ${activeTab === 'dogs' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('dogs')}
                >
                    {t('social.dogs') || 'Dogs'}
                </button>
            </div>

            {activeTab === 'people' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Pending Requests */}
                    <div className="md:col-span-2">
                        {currentUser && <FriendRequestList userId={currentUser.id} />}
                    </div>

                    {/* Left Column: Management (My Friends, My Enemies) */}
                    <div className="space-y-8">
                        <RelationshipManager
                            title={t('friends.title')}
                            searchPlaceholder={t('friends.searchPlaceholder') || 'Search friends...'}
                            emptyMessage={t('friends.noFriends') || 'No friends yet'}
                            users={friends}
                            loading={friendsLoading}
                            error={friendsError}
                            onRemove={removeFriend}
                            type="friend"
                        />
                        <RelationshipManager
                            title={t('enemies.title')}
                            searchPlaceholder={t('enemies.searchPlaceholder') || 'Search enemies...'}
                            emptyMessage={t('enemies.noEnemies') || 'No enemies yet'}
                            users={enemies}
                            loading={enemiesLoading}
                            error={enemiesError}
                            onRemove={removeEnemy}
                            type="enemy"
                        />
                    </div>

                    {/* Right Column: Discovery (Find Friends) */}
                    <div className="space-y-8">
                        <FriendFinder />
                    </div>
                </div>
            )}

            {activeTab === 'dogs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Left Column: Placeholder for Dog Relationships? For now empty or info */}
                    {/* We could duplicate RelationshipManager if we had Dog Friends list ready */}
                    <div className="space-y-8">
                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                            <h3 className="text-lg font-semibold text-blue-800 mb-2">Dog Social</h3>
                        </div>
                    </div>

                    {/* Right Column: Discovery (Find Dogs) */}
                    <div className="space-y-8">
                        <DogFinder />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Social;
