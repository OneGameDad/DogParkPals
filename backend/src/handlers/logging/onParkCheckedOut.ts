import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleParkCheckedOutLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.ParkCheckedOut) return;

  const { checkInId, userId, parkId } = event.payload;
  typeSafeLogger.logUserAction('Park check-out (event bus)', {
    checkInId,
    userId,
    parkId,
  });
}
