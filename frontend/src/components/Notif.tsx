import React from 'react';
import { useTranslation } from 'react-i18next';

// Notification types:
// friendRequest = '{name} wants to be friends'
// messageReceived = 'You received a message from {name}'
// eventCreated = '{name} created a new event'
// parkAdded = 'Park "{parkName}" was added'
// friendAccepted = 'You and {name} are now friends'

interface NotificationItem {
  id: string;
  messageType: string;
  variables?: Record<string, string | number>;
}

interface NotifHandle {
  addNotification: (messageType: string, variables?: Record<string, string | number>) => void;
}

const Notif = React.forwardRef<NotifHandle>((props, ref) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const addNotification = (messageType: string, variables?: Record<string, string | number>) => {
    const id = Date.now().toString();
    setNotifications([...notifications, { id, messageType, variables }]);
  };

  React.useImperativeHandle(ref, () => ({
    addNotification,
  }));

  return (
    <div className="space-y-3 fixed top-4 right-4 w-96 max-w-full">
      {notifications.map(notif => {
        const template = t(`notifications.${notif.messageType}`);
        const message = Object.entries(notif.variables || {}).reduce((text, [key, value]) => {
          return text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
        }, template);

        return (
          <div key={notif.id} className="bg-pink-50 border border-pink-200 text-black-800 rounded-lg p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg"></span>
              <p>{message}</p>
            </div>
            <button
              onClick={() => removeNotification(notif.id)}
              className="text-lg font-bold hover:opacity-70 cursor-pointer"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
});

Notif.displayName = 'Notif';
export default Notif;