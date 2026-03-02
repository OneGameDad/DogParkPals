import React from 'react';
import { useTranslation } from 'react-i18next';
import EventCard from './EventCard';
import type { Event } from '../../types';
import { Loading } from '../common';

interface EventListProps {
    events: Event[];
    loading?: boolean;
    emptyMessage?: string;
    showAttendanceActions?: boolean;
    onDelete?: () => void;
}

const EventList: React.FC<EventListProps> = ({
    events,
    loading = false,
    emptyMessage,
    showAttendanceActions = true,
    onDelete
}) => {
    const { t } = useTranslation();

    if (loading) {
        return <Loading />;
    }

    if (!events || events.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p>{emptyMessage || t('events.noEvents', 'No upcoming events.')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {events.map((event) => (
                <EventCard
                    key={event.id}
                    event={event}
                    showAttendanceActions={showAttendanceActions}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

export default EventList;
