import { api } from './api';
import type { Messages, User, PaginatedMessagesResponse, CursorPaginatedMessagesResponse, UnreadCountResponse } from '../types';

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

    // Cursor-based pagination endpoints for real-time chat (better for infinite scroll)
    getAllMessagesCursor: async (lastMessageId?: number, limit: number = 50): Promise<CursorPaginatedMessagesResponse> => {
        const query = new URLSearchParams();
        if (lastMessageId) query.append('lastMessageId', lastMessageId.toString());
        query.append('limit', limit.toString());
        return api.get<CursorPaginatedMessagesResponse>(`/api/messages/cursor?${query.toString()}`);
    },

    // Get conversation with a specific friend (cursor-based pagination)
    getConversationCursor: async (friendId: number, lastMessageId?: number, limit: number = 50): Promise<CursorPaginatedMessagesResponse> => {
        const query = new URLSearchParams();
        if (lastMessageId) query.append('lastMessageId', lastMessageId.toString());
        query.append('limit', limit.toString());
        return api.get<CursorPaginatedMessagesResponse>(`/api/messages/${friendId}/cursor?${query.toString()}`);
    },

    // Get unread messages (cursor-based pagination)
    getUnreadMessagesCursor: async (lastMessageId?: number, limit: number = 50): Promise<CursorPaginatedMessagesResponse> => {
        const query = new URLSearchParams();
        if (lastMessageId) query.append('lastMessageId', lastMessageId.toString());
        query.append('limit', limit.toString());
        return api.get<CursorPaginatedMessagesResponse>(`/api/messages/unread/cursor?${query.toString()}`);
    },
};

export default messageService;
