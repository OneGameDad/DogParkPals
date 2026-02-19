import React, { useRef, useEffect, useCallback } from 'react';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import messageService from '../services/messageService';
import type { Messages } from '../types';

interface LiveChatProps {
  friendId: number;
}

/**
 * LiveChat Component - Demonstrates infinite scroll pagination
 * 
 * Features:
 * - Initial load with offset pagination (page 1, limit 50)
 * - Infinite scroll with cursor pagination when scrolling up
 * - Real-time message addition
 * - Loading and error states
 * - Message refresh capability
 */
export const LiveChat: React.FC<LiveChatProps> = ({ friendId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize infinite scroll hook with cursor pagination
  const {
    messages,
    isLoading,
    hasMore,
    error,
    loadMore,
    refresh,
    addMessage,
  } = useInfiniteScroll(
    async (lastMessageId, limit) => {
      if (lastMessageId) {
        // Cursor-based pagination for infinite scroll
        return messageService.getConversationCursor(friendId, lastMessageId, limit);
      } else {
        // Initial load with offset pagination
        return messageService.getConversation(friendId, 1, limit);
      }
    },
    {
      initialPageSize: 50,
      onError: (error) => console.error('Failed to load messages:', error),
    }
  );

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle infinite scroll on scroll up
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop } = scrollContainerRef.current;

    // Load more when user scrolls to top and more messages available
    if (scrollTop === 0 && hasMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  const handleSendMessage = async (content: string) => {
    try {
      // In a real app, you'd get the currentUserId from auth context
      const currentUserId = 1; // Placeholder
      
      const newMessage = await messageService.sendMessage(
        currentUserId,
        friendId,
        content
      );

      // Add immediately to UI for better UX
      addMessage(newMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Live Chat</h2>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Load More Indicator */}
        {hasMore && messages.length > 0 && (
          <div className="text-center py-2">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {/* Initial Loading State */}
        {isLoading && messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        )}

        {/* Error State */}
        {error && messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <div className="text-red-500">
              <p>Failed to load messages</p>
              <p className="text-sm text-gray-500">{error.message}</p>
              <button
                onClick={refresh}
                className="mt-2 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="space-y-2">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}

        {/* Scroll to bottom anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <MessageInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
};

interface MessageBubbleProps {
  message: Messages;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isOwn = message.senderId === 1; // In real app, compare with current user

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`px-4 py-2 rounded-lg max-w-xs ${
          isOwn
            ? 'bg-blue-500 text-white'
            : 'bg-gray-300 text-gray-900'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <p className="text-xs mt-1 opacity-70">
          {new Date(message.sentAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
};

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled }) => {
  const [content, setContent] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSend(content.trim());
      setContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white border-t border-gray-200"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          disabled={disabled || isSending}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || isSending || !content.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
};

export default LiveChat;
