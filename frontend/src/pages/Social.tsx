import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FriendFinder, DogFinder, FriendRequestList } from '../components/users';
import { useAuth } from '../hooks';
import { useUpcomingEvents } from '../hooks';
import { Loading, ErrorMessage, Button, Modal } from '../components/common';
import { Header } from '../components/layout';
import { EventList, CreateEventForm } from '../components/events';

const Social = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'people' | 'dogs' | 'events'>('people');
    const { events, loading: eventsLoading, error: eventsError, refetch } = useUpcomingEvents();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
                <button
                    className={`py-2 px-6 font-semibold focus:outline-none ${activeTab === 'events' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('events')}
                >
                    {t('social.events', 'Events')}
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

            {activeTab === 'events' && (
                <div className="flex flex-col gap-8 mb-12">
                    {eventsLoading && events.length === 0 ? <Loading /> : eventsError ? <ErrorMessage message={eventsError} /> : (
                        <>
                            <div className="flex justify-between items-center">
                                <div>
                                    <Header text={t('events.pageTitle', 'Upcoming Events')} level="h2" className="mb-2" />
                                    <p className="text-gray-600">
                                        {t('events.pageSubtitle', 'Discover dog-friendly events happening around you.')}
                                    </p>
                                </div>
                                <Button
                                    text={t('events.createButton', 'Create Event')}
                                    onClick={() => setIsCreateModalOpen(true)}
                                />
                            </div>

                            <div className="bg-white rounded-2xl shadow p-6">
                                <EventList events={events} loading={eventsLoading} onDelete={refetch} />
                            </div>

                            <Modal
                                isOpen={isCreateModalOpen}
                                onClose={() => setIsCreateModalOpen(false)}
                                title={t('events.createTitle', 'Create New Event')}
                            >
                                <CreateEventForm
                                    onCancel={() => setIsCreateModalOpen(false)}
                                    onSuccess={() => {
                                        setIsCreateModalOpen(false);
                                        refetch();
                                    }}
                                />
                            </Modal>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Social;
