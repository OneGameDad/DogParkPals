import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleOrganizationJoinRequestedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.OrganizationJoinRequested) return;

  const { organizationId, requesterId } = event.payload;
  typeSafeLogger.logUserAction('Organization join requested (event bus)', {
    organizationId,
    requesterId,
  });
}
