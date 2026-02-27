import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FriendFinder, DogFinder, FriendRequestList } from '../components/users';
import { useAuth } from '../hooks';

const Social = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'people' | 'dogs'>('people');

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
                <div className="flex flex-col gap-8 mb-12">
                    {/* Pending Requests */}
                    <div>
                        {currentUser && <FriendRequestList userId={currentUser.id} />}
                    </div>

                    {/* Friend Finder (Now includes Friends/Enemies/All filtering) */}
                    <div>
                        <FriendFinder />
                    </div>
                </div>
            )}

            {activeTab === 'dogs' && (
                <div className="flex flex-col gap-8 mb-12">
                    {/* Discovery (Find Dogs) */}
                    <div>
                        <DogFinder />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Social;
