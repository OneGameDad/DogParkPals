import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleDogPhotoUploadedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.DogPhotoUploaded) return;

  const { dogId, profilePictureUrl } = event.payload;
  typeSafeLogger.logUserAction('Dog photo uploaded (event bus)', {
    dogId,
    profilePictureUrl,
  });
}
