import { api } from './api';
import type { Messages, User } from '../types';

export interface UnreadCountResponse {
    count: number;
}

export const messageService = {
    // Get all messages for the current user (inbox style, not conversation specific)
    getAllMessages: async (): Promise<Messages[]> => {
        return api.get<Messages[]>('/api/messages');
    },

    // Get conversation with a specific friend
    getConversation: async (friendId: number, page: number = 1, limit: number = 20): Promise<Messages[]> => {
        return api.get<Messages[]>(`/api/messages/${friendId}?page=${page}&limit=${limit}`);
    },

    // Send a message to a friend
    sendMessage: async (senderId: number, friendId: number, content: string): Promise<Messages> => {
        return api.post<Messages>(`/api/messages/${friendId}`, { senderId, receiverId: friendId, content });
    },

    // Mark a message as read (or other status)
    updateStatus: async (messageId: number, status: 'READ' | 'DELIVERED' | 'ARCHIVED'): Promise<Messages> => {
        return api.patch<Messages>(`/api/messages/${messageId}/status`, { status });
    },

    // Delete a message
    deleteMessage: async (messageId: number): Promise<void> => {
        return api.delete<void>(`/api/messages/${messageId}`);
    },

    // Get unread messages (all)
    getUnreadMessages: async (): Promise<Messages[]> => {
        return api.get<Messages[]>('/api/messages/unread');
    },

    // Get count of unread messages
    getUnreadCount: async (): Promise<UnreadCountResponse> => {
        return api.get<UnreadCountResponse>('/api/messages/unread/count');
    },
};
