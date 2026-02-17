import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleDogOwnershipAddedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.DogOwnershipAdded) return;

  const { dogId, userId } = event.payload;
  typeSafeLogger.logUserAction('Dog ownership added (event bus)', {
    dogId,
    userId,
  });
}
