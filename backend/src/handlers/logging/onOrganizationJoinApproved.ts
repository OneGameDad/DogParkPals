import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleOrganizationJoinApprovedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.OrganizationJoinApproved) return;

  const { organizationId, userId, role } = event.payload;
  typeSafeLogger.logUserAction('Organization join approved (event bus)', {
    organizationId,
    userId,
    role,
  });
}
