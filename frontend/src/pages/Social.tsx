import { useTranslation } from 'react-i18next';
import { FriendFinder, RelationshipManager } from '../components/users';
import { useAuth, useFriends, useEnemies } from '../hooks';

const Social = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();

    const { friends, loading: friendsLoading, error: friendsError, removeFriend } = useFriends(currentUser?.id);
    const { enemies, loading: enemiesLoading, error: enemiesError, removeEnemy } = useEnemies(currentUser?.id);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">{t('social', 'Social')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
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
        </div>
    );
};

export default Social;
