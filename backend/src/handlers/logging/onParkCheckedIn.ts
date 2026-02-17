import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleParkCheckedInLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.ParkCheckedIn) return;

  const { checkInId, userId, parkId, dogId } = event.payload;
  typeSafeLogger.logUserAction('Park check-in (event bus)', {
    checkInId,
    userId,
    parkId,
    dogId,
  });
}
