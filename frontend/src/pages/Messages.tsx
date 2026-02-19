import React from 'react';
import { useTranslation } from 'react-i18next';
import ChatLayout from '../components/chat/ChatLayout';
import { Header } from '../components/layout';

const Messages = () => {
    const { t } = useTranslation();

    return (
        <div className="container mx-auto px-4 py-6 h-full flex flex-col min-h-0 overflow-hidden">
            <div className="mb-4">
                <Header text={t('messages')} level="h1" />
            </div>

            <div className="flex-1 h-full min-h-0 overflow-hidden relative">
                <ChatLayout />
            </div>
        </div>
    );
};

export default Messages;
