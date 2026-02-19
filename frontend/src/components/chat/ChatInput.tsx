import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../common';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: (e: React.FormEvent) => void;
    disabled?: boolean;
}

const ChatInput = ({ value, onChange, onSend, disabled = false }: ChatInputProps) => {
    const { t } = useTranslation();

    return (
        <form onSubmit={onSend} className="p-4 bg-white border-t border-gray-200 flex space-x-2">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t('chat.typeMessage') || 'Type a message...'}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={disabled}
            />
            <Button
                text={disabled ? '...' : t('common.send')}
                type="submit"
                disabled={disabled || !value.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6"
            />
        </form>
    );
};

export default ChatInput;
