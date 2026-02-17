import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleEventCreatedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.EventCreated) return;

  const { eventId, organizerId, parkId, organizationId } = event.payload;
  typeSafeLogger.logUserAction('Event created (event bus)', {
    eventId,
    organizerId,
    parkId,
    organizationId,
  });
}
