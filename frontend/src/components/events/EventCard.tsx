import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Event } from '../../types';
import { Button } from '../common';
import { useEventAttendance, useDeleteEvent } from '../../hooks';
import { useAuth } from '../../hooks';
import { toast } from 'react-hot-toast';

interface EventCardProps {
    event: Event;
    showAttendanceActions?: boolean;
    onDelete?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, showAttendanceActions = true, onDelete }) => {
    const { t } = useTranslation();
    const { user } = useAuth();

    // We use the useEventAttendance hook to manage attendees easily
    const { attendees, loading, actionLoading, attendEvent, cancelAttendance } = useEventAttendance(event.id);
    const { deleteEvent, loading: deleting } = useDeleteEvent();

    const isAttending = user && attendees.some((a) => a.id === user.id);
    const isOrganizer = user && event.organizerId === user.id;
    const isPast = new Date(event.endTime) < new Date();

    const handleAttendToggle = async () => {
        if (isAttending) {
            await cancelAttendance();
        } else {
            await attendEvent();
        }
    };

    const handleDelete = async () => {
        if (window.confirm(t('events.deleteConfirm', 'Are you sure you want to delete this event?'))) {
            try {
                await deleteEvent(event.id);
                toast.success(t('events.deleteSuccess', 'Event deleted successfully'));
                if (onDelete) {
                    onDelete();
                }
            } catch (err) {
                toast.error(t('events.deleteError', 'Failed to delete event'));
            }
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-gray-800">{event.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${event.private === 'PRIVATE' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                        {event.private === 'PRIVATE' ? t('common.private', 'Private') : t('common.public', 'Public')}
                    </span>
                    {isPast && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {t('events.past', 'Past')}
                        </span>
                    )}
                </div>

                <div className="text-sm text-gray-600 mt-2 space-y-1">
                    <p className="flex items-center gap-1.5">
                        <span className="text-gray-400">📅</span>
                        {new Date(event.date).toLocaleDateString()}
                    </p>
                    <p className="flex items-center gap-1.5">
                        <span className="text-gray-400">🕒</span>
                        {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {event.description && (
                        <p className="line-clamp-2 mt-2 text-gray-700">{event.description}</p>
                    )}
                </div>

                {showAttendanceActions && !loading && attendees.length > 0 && (
                    <div className="mt-3 text-xs text-gray-500">
                        {attendees.length} {attendees.length === 1 ? t('events.attendee', 'attendee') : t('events.attendees', 'attendees')}
                    </div>
                )}
            </div>

            {showAttendanceActions && user && !isOrganizer && !isPast && (
                <div className="mt-4 sm:mt-0 w-full sm:w-auto">
                    <Button
                        text={isAttending ? t('events.cancelAttendance', 'Cancel Attendance') : t('events.attend', 'Attend')}
                        onClick={handleAttendToggle}
                        disabled={actionLoading}
                        variant={isAttending ? 'secondary' : 'primary'}
                        fullWidth={false}
                    />
                </div>
            )}
            {showAttendanceActions && isOrganizer && (
                <div className="mt-4 sm:mt-0 w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">
                        {t('events.youAreOrganizer', 'You are the organizer')}
                    </span>
                    <Button
                        text={deleting ? t('events.deletingEvent', 'Deleting...') : t('events.deleteEvent', 'Delete')}
                        onClick={handleDelete}
                        disabled={deleting}
                        variant="danger"
                    />
                </div>
            )}
        </div>
    );
};

export default EventCard;
