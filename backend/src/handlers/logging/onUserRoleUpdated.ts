import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleUserRoleUpdatedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.UserRoleUpdated) return;

  const { targetUserId, role, adminUserId } = event.payload;
  typeSafeLogger.logUserAction('User role updated (event bus)', {
    targetUserId,
    role,
    adminUserId,
  });
}
