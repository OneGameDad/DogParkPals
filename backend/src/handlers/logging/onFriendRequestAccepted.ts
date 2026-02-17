import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleFriendRequestAcceptedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.FriendRequestAccepted) return;

  const { friendshipId, requesterId, addresseeId } = event.payload;
  typeSafeLogger.logUserAction('Friend request accepted (event bus)', {
    friendshipId,
    requesterId,
    addresseeId,
  });
}
