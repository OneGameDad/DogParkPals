import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpcomingEvents } from '../hooks';
import { Loading, ErrorMessage, Button, Modal } from '../components/common';
import { Header } from '../components/layout';
import { EventList, CreateEventForm } from '../components/events';

const Events = () => {
    const { t } = useTranslation();
    const { events, loading, error, refetch } = useUpcomingEvents();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (loading && events.length === 0) return <Loading />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Header text={t('events.pageTitle', 'Upcoming Events')} level="h1" className="mb-2" />
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
                <EventList events={events} loading={loading} onDelete={refetch} />
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
        </div>
    );
};

export default Events;
