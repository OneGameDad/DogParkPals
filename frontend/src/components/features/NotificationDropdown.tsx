import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../context/NotificationContext';

const NotificationDropdown: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { notifications, unreadCount, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full focus:outline-none transition-colors"
                aria-label="Notifications"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="font-semibold text-gray-800 text-sm">{t('notifications.title', 'Notifications')}</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                {t('notifications.markAllRead', 'Mark all read')}
                            </button>
                        )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                {t('notifications.empty', 'No notifications yet')}
                            </div>
                        ) : (
                            notifications.slice(0, 20).map((notif) => {
                                const messageType = notif.type
                                    .split('_')
                                    .map((word: string, index: number) =>
                                        index === 0
                                            ? word.toLowerCase()
                                            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                    )
                                    .join('');
                                const keyCandidates = [
                                    `notifications.${notif.type}`,
                                    `notifications.${messageType}`,
                                ];
                                const translationKey =
                                    keyCandidates.find((key) => i18n.exists(key)) || 'notifications.generic';
                                const template = t(translationKey, 'You have a new notification');
                                const message = Object.entries(notif.payload || {}).reduce(
                                    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
                                    template
                                );
                                return (
                                    <div
                                        key={notif.id}
                                        className={`px-4 py-3 border-b border-gray-50 text-sm hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50' : ''}`}
                                    >
                                        <p className="text-gray-700">{message}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(notif.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
