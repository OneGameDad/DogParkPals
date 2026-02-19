import React from 'react';
import { formatTime } from '../../utils/formatters';
import type { Messages } from '../../types';

interface MessageBubbleProps {
    message: Messages;
    isMe: boolean;
}

const MessageBubble = ({ message, isMe }: MessageBubbleProps) => {
    return (
        <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${isMe
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none'
                    }`}
            >
                <p className="break-words">{message.content}</p>
                <p className={`text-xs mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {formatTime(message.sentAt)}
                </p>
            </div>
        </div>
    );
};

export default MessageBubble;
