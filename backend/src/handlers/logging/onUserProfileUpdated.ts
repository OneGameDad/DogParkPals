import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleUserProfileUpdatedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.UserProfileUpdated) return;

  const { userId, fields, updatedBy } = event.payload;
  typeSafeLogger.logUserAction('User profile updated (event bus)', {
    userId,
    fields,
    updatedBy,
  });
}
