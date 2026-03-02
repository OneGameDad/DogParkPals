import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from '../common';
import { EventList, CreateEventForm } from '../events';
import { useOrganizationEvents } from '../../hooks';

interface OrganizationEventsProps {
    organizationId: number;
    canCreateEvent: boolean;
}

const OrganizationEvents: React.FC<OrganizationEventsProps> = ({ organizationId, canCreateEvent }) => {
    const { t } = useTranslation();
    const { events, loading, refetch } = useOrganizationEvents(organizationId.toString());
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                    {t('organizations.events', 'Events')}
                </h2>
                {canCreateEvent && (
                    <Button
                        text={t('organizations.createEvent', 'Create Event')}
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                    />
                )}
            </div>

            <EventList events={events} loading={loading} onDelete={refetch} />

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={t('events.createTitle', 'Create New Event')}
            >
                <CreateEventForm
                    organizationId={organizationId}
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

export default OrganizationEvents;
