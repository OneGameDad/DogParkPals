import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleUserProfilePictureUploadedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.UserProfilePictureUploaded) return;

  const { userId, profilePictureUrl } = event.payload;
  typeSafeLogger.logUserAction('User profile picture uploaded (event bus)', {
    userId,
    profilePictureUrl,
  });
}
