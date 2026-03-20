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

export interface NotifContainerHandle {
  addNotification: (messageType: string, variables?: Record<string, string | number>) => void;
}

const NotifContainer = React.forwardRef<NotifContainerHandle>((_props, ref) => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const notificationMapRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeNotification = (id: string) => {
    // Clear the timeout if it exists
    const timeoutId = notificationMapRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      notificationMapRef.current.delete(id);
    }
    
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const addNotification = (messageType: string, variables?: Record<string, string | number>) => {
    // Create a unique ID based on timestamp + random to prevent duplicates
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    
    // Set auto-dismiss timeout
    const timeoutId = setTimeout(() => removeNotification(id), 5000);
    notificationMapRef.current.set(id, timeoutId);
    
    setNotifications(prev => [...prev, { 
      id, 
      messageType, 
      variables,
    }]);
    
  };

  React.useImperativeHandle(ref, () => ({
    addNotification,
  }));

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      notificationMapRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      notificationMapRef.current.clear();
    };
  }, []);

  return (
    <div className="space-y-3 fixed top-4 right-4 w-96 max-w-full z-50">
      {notifications.map(notif => {
        const camelMessageType = notif.messageType
          .split('_')
          .map((word, index) =>
            index === 0
              ? word.toLowerCase()
              : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join('');
        const keyCandidates = [
          `notifications.${notif.messageType}`,
          `notifications.${camelMessageType}`,
        ];
        const translationKey =
          keyCandidates.find((key) => i18n.exists(key)) || 'notifications.generic';
        const template = t(translationKey, 'You have a new notification');
        const message = Object.entries(notif.variables || {}).reduce((text, [key, value]) => {
          return text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
        }, template);

        return (
          <div key={notif.id} className="bg-pink-50 border border-pink-200 text-gray-800 rounded-lg p-4 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 flex-1">
              <p className="text-sm">{message}</p>
            </div>
            <button
              onClick={() => removeNotification(notif.id)}
              className="text-xl font-bold hover:opacity-70 cursor-pointer flex-shrink-0 h-6 w-6 flex items-center justify-center"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
});

NotifContainer.displayName = 'NotifContainer';
export default NotifContainer;
