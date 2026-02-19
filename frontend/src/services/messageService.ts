import { api } from './api';
import type { Messages, User, PaginatedMessagesResponse, UnreadCountResponse } from '../types';

const messageService = {
    // Get all messages for the current user (inbox style, with pagination)
    getAllMessages: async (page: number = 1, limit: number = 50): Promise<PaginatedMessagesResponse> => {
        return api.get<PaginatedMessagesResponse>(`/api/messages?page=${page}&limit=${limit}`);
    },

    // Get conversation with a specific friend (with pagination)
    getConversation: async (friendId: number, page: number = 1, limit: number = 50): Promise<PaginatedMessagesResponse> => {
        return api.get<PaginatedMessagesResponse>(`/api/messages/${friendId}?page=${page}&limit=${limit}`);
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

    // Get unread messages (with pagination)
    getUnreadMessages: async (page: number = 1, limit: number = 50): Promise<PaginatedMessagesResponse> => {
        return api.get<PaginatedMessagesResponse>(`/api/messages/unread?page=${page}&limit=${limit}`);
    },

    // Get count of unread messages
    getUnreadCount: async (): Promise<UnreadCountResponse> => {
        return api.get<UnreadCountResponse>('/api/messages/unread/count');
    },
};

export default messageService;
