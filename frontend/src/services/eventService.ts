import api from './api';
import type { Event } from '../types';

export const eventService = {
    createEvent: async (eventData: any) => {
        return await api.post<Event>('/api/events', eventData);
    },

    getEventById: async (eventId: number) => {
        return await api.get<Event>(`/api/events/${eventId}`);
    },

    getAllEvents: async () => {
        return await api.get<Event[]>('/api/events');
    },

    getUpcomingEvents: async () => {
        return await api.get<Event[]>('/api/events/upcoming');
    },

    getEventsByOrganization: async (organizationId: number) => {
        return await api.get<Event[]>(`/api/events/organization/${organizationId}`);
    },

    getEventsByPark: async (parkId: number) => {
        return await api.get<Event[]>(`/api/events/park/${parkId}`);
    },

    getEventsByOrganizer: async (organizerId: number) => {
        return await api.get<Event[]>(`/api/events/organizer/${organizerId}`);
    },

    attendEvent: async (eventId: number) => {
        return await api.post(`/api/events/${eventId}/attend`);
    },

    cancelAttendance: async (eventId: number) => {
        return await api.delete(`/api/events/${eventId}/attend`);
    },

    getEventAttendees: async (eventId: number) => {
        return await api.get<any[]>(`/api/events/${eventId}/attendees`);
    },

    deleteEvent: async (eventId: number) => {
        return await api.delete(`/api/events/${eventId}`);
    }
};
