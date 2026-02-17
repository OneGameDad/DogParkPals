import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleUserProfilePictureDeletedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.UserProfilePictureDeleted) return;

  const { userId, previousUrl } = event.payload;
  typeSafeLogger.logUserAction('User profile picture deleted (event bus)', {
    userId,
    previousUrl,
  });
}
