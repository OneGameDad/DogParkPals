import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleOrganizationRoleUpdatedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.OrganizationRoleUpdated) return;

  const { organizationId, userId, role } = event.payload;
  typeSafeLogger.logUserAction('Organization role updated (event bus)', {
    organizationId,
    userId,
    role,
  });
}
