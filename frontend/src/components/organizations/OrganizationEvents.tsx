
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Event } from '../../types';
import { Button } from '../common';

interface OrganizationEventsProps {
    events: Event[];
    canCreateEvent: boolean;
}

const OrganizationEvents: React.FC<OrganizationEventsProps> = ({ events, canCreateEvent }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                    {t('organizations.events', 'Events')}
                </h2>
                {canCreateEvent && (
                    <Button
                        text={t('organizations.createEvent', 'Create Event')}
                        onClick={() => {
                            // TODO: Navigate to create event page
                            console.log('Navigate to create event');
                        }}
                        size="sm"
                    />
                )}
            </div>

            {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <p>{t('organizations.noEvents', 'No upcoming events.')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800">{event.title}</h3>
                                    <div className="text-sm text-gray-500 mt-1 space-y-1">
                                        <p>
                                            📅 {new Date(event.date).toLocaleDateString()} • 🕒 {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        {event.description && (
                                            <p className="line-clamp-2">{event.description}</p>
                                        )}
                                    </div>
                                </div>
                                {/* Add event specific actions or status here */}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${event.private === 'PRIVATE' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                    {event.private === 'PRIVATE' ? t('common.private', 'Private') : t('common.public', 'Public')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrganizationEvents;
