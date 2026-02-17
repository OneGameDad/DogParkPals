import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleMessageSentLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.MessageSent) return;

  const { messageId, senderId, receiverId } = event.payload;
  typeSafeLogger.logUserAction('Message sent (event bus)', {
    messageId,
    senderId,
    receiverId,
  });
}
