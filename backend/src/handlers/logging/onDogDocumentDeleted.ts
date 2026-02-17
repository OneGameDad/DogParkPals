import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleDogDocumentDeletedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.DogDocumentDeleted) return;

  const { dogId, previousUrl } = event.payload;
  typeSafeLogger.logUserAction('Dog document deleted (event bus)', {
    dogId,
    previousUrl,
  });
}
