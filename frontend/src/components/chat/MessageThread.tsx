import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { messageService } from '../../services/messageService';
import { usePolling } from '../../hooks/usePolling';
import type { Messages, User } from '../../types';
import { Loading, Picture } from '../common';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { api } from '../../services/api';
import { getUserInitials } from '../../utils/formatters';

interface MessageThreadProps {
    friendId: number;
    currentUserId: number;
}

const MessageThread = ({ friendId, currentUserId }: MessageThreadProps) => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<Messages[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [friend, setFriend] = useState<User | null>(null);
    const isNearBottomRef = useRef(true); // Default to true for initial load

    // Fetch friend details
    useEffect(() => {
        const fetchFriend = async () => {
            try {
                const user = await api.get<User>(`/users/id/${friendId}`);
                setFriend(user);
            } catch (err) {
                console.error('Failed to fetch friend details', err);
            }
        };
        if (friendId) fetchFriend();
    }, [friendId]);



    // ...

    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const MESSAGES_PER_PAGE = 10;

    // Fetch latest messages (for initial load and polling)
    const fetchLatestMessages = useCallback(async () => {
        try {
            // Always fetch page 1 (latest messages)
            const latestMessages = await messageService.getConversation(friendId, 1, MESSAGES_PER_PAGE);

            if (latestMessages.length < MESSAGES_PER_PAGE) {
                setHasMore(false);
            }

            setMessages((prev: Messages[]) => {
                if (prev.length === 0) return latestMessages;

                // Build a set of existing IDs for O(1) lookup
                const existingIds = new Set(prev.map((m: Messages) => m.id));

                // Find messages that aren't in our current list
                const newMessages = latestMessages.filter((m: Messages) => !existingIds.has(m.id));

                if (newMessages.length === 0) return prev;

                // Append new messages to the end
                return [...prev, ...newMessages];
            });

            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch messages', err);
            setLoading(false);
        }
    }, [friendId]);

    // Initial load - reset everything
    useEffect(() => {
        setLoading(true);
        setMessages([]);
        setPage(1);
        setHasMore(true);
        fetchLatestMessages();
    }, [friendId, fetchLatestMessages]);

    // Poll for changes
    usePolling(fetchLatestMessages, { interval: 3000, enabled: !!friendId });

    const [fetchingOlder, setFetchingOlder] = useState(false);

    // Load older messages (pagination)
    const loadOlderMessages = async () => {
        if (!hasMore || loading || fetchingOlder) return;

        setFetchingOlder(true);
        const nextPage = page + 1;
        try {
            // Capture current scroll BEFORE fetching
            const container = scrollContainerRef.current;
            const oldScrollHeight = container?.scrollHeight || 0;
            const oldScrollTop = container?.scrollTop || 0;

            const olderMessages = await messageService.getConversation(friendId, nextPage, MESSAGES_PER_PAGE);

            if (olderMessages.length < MESSAGES_PER_PAGE) {
                setHasMore(false);
            }

            if (olderMessages.length > 0) {
                setMessages((prev: Messages[]) => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const uniqueOlderMessages = olderMessages.filter(m => !existingIds.has(m.id));

                    if (uniqueOlderMessages.length === 0) return prev;

                    return [...uniqueOlderMessages, ...prev];
                });
                setPage(nextPage);

                requestAnimationFrame(() => {
                    if (scrollContainerRef.current) {
                        const newScrollHeight = scrollContainerRef.current.scrollHeight;
                        const heightDifference = newScrollHeight - oldScrollHeight;
                        scrollContainerRef.current.scrollTop = oldScrollTop + heightDifference;
                    }
                });
            }
        } catch (err) {
            console.error('Failed to load older messages', err);
        } finally {
            setFetchingOlder(false);
        }
    };

    // Handle scroll events
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

        // Check if near top to load more
        if (scrollTop < 50 && hasMore && messages.length >= MESSAGES_PER_PAGE) {
            loadOlderMessages();
        }

        // Consider "near bottom" if within 100px of the bottom
        isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };

    // Smart auto-scroll
    useEffect(() => {
        if (isNearBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            // Force scroll to bottom when sending a message
            isNearBottomRef.current = true;

            const sentMessage = await messageService.sendMessage(currentUserId, friendId, newMessage);
            setMessages((prev: Messages[]) => [...prev, sentMessage]);
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <Loading message={t('common.loading')} />;

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center space-x-3">
                <Picture
                    location={friend?.profilePictureUrl}
                    initials={friend ? getUserInitials(friend) : '?'}
                    alt={friend?.username || 'User'}
                    size="40px"
                    shape="circle"
                />
                <h2 className="text-lg font-bold text-gray-800">
                    {friend?.username || ''}
                </h2>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100"
            >
                {fetchingOlder && (
                    <div className="flex justify-center py-2">
                        <Loading message="" />
                    </div>
                )}
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">
                        {t('chat.noMessagesStartConversation') || 'No messages yet. Say hello!'}
                    </div>
                ) : (
                    messages.map(msg => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isMe={msg.senderId === currentUserId}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <ChatInput
                value={newMessage}
                onChange={setNewMessage}
                onSend={handleSendMessage}
                disabled={sending}
            />
        </div>
    );
};

export default MessageThread;
