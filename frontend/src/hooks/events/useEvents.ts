import { useState, useCallback, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import type { Event } from '../../types';

export const useLocationEvents = (
    fetcher: () => Promise<Event[]>
) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetcher();
            setEvents(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch events');
        } finally {
            setLoading(false);
        }
    }, [fetcher]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return { events, loading, error, refetch: fetchEvents };
};

export const useParkEvents = (parkId: string | undefined) => {
    return useLocationEvents(
        useCallback(async () => {
            if (!parkId) return [];
            return await eventService.getEventsByPark(Number(parkId));
        }, [parkId])
    );
};

export const useOrganizationEvents = (organizationId: string | undefined) => {
    return useLocationEvents(
        useCallback(async () => {
            if (!organizationId) return [];
            return await eventService.getEventsByOrganization(Number(organizationId));
        }, [organizationId])
    );
};

export const useUpcomingEvents = () => {
    return useLocationEvents(
        useCallback(async () => {
            return await eventService.getUpcomingEvents();
        }, [])
    );
};

export const useCreateEvent = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createEvent = async (eventData: any) => {
        try {
            setLoading(true);
            setError(null);
            const newEvent = await eventService.createEvent(eventData);
            return newEvent;
        } catch (err: any) {
            setError(err.message || 'Failed to create event');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { createEvent, loading, error };
};

export const useEventAttendance = (eventId: number) => {
    const [attendees, setAttendees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAttendees = useCallback(async () => {
        try {
            setLoading(true);
            const data = await eventService.getEventAttendees(eventId);
            setAttendees(data);
        } catch (err: any) {
            // Cannot view private attendees
            console.error('Failed to fetch attendees:', err);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        setAttendees([]);
        setError(null);
        fetchAttendees();
    }, [fetchAttendees]);
    const attendEvent = async () => {
        try {
            setActionLoading(true);
            setError(null);
            await eventService.attendEvent(eventId);
            await fetchAttendees();
        } catch (err: any) {
            setError(err.message || 'Failed to attend event');
            throw err;
        } finally {
            setActionLoading(false);
        }
    };

    const cancelAttendance = async () => {
        try {
            setActionLoading(true);
            setError(null);
            await eventService.cancelAttendance(eventId);
            await fetchAttendees();
        } catch (err: any) {
            setError(err.message || 'Failed to cancel attendance');
            throw err;
        } finally {
            setActionLoading(false);
        }
    };

    return { attendees, loading, actionLoading, error, attendEvent, cancelAttendance, refetchAttendees: fetchAttendees };
};

export const useDeleteEvent = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteEvent = async (eventId: number) => {
        try {
            setLoading(true);
            setError(null);
            await eventService.deleteEvent(eventId);
            return true;
        } catch (err: any) {
            setError(err.message || 'Failed to delete event');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { deleteEvent, loading, error };
};
