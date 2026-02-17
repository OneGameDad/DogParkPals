import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleFriendRequestSentLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.FriendRequestSent) return;

  const { friendshipId, requesterId, addresseeId } = event.payload;
  typeSafeLogger.logUserAction('Friend request sent (event bus)', {
    friendshipId,
    requesterId,
    addresseeId,
  });
}
