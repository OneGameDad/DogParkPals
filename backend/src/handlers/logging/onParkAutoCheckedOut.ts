import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleParkAutoCheckedOutLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.ParkAutoCheckedOut) return;

  const { checkInId, checkedOutAt } = event.payload;
  typeSafeLogger.logUserAction('Park auto check-out (event bus)', {
    checkInId,
    checkedOutAt,
  });
}
