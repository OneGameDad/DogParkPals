import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleDogPhotoDeletedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.DogPhotoDeleted) return;

  const { dogId, previousUrl } = event.payload;
  typeSafeLogger.logUserAction('Dog photo deleted (event bus)', {
    dogId,
    previousUrl,
  });
}
