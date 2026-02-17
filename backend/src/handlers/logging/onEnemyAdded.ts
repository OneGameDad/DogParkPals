import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleEnemyAddedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.EnemyAdded) return;

  const { enemyId, ownerId, enemyUserId } = event.payload;
  typeSafeLogger.logUserAction('Enemy added (event bus)', {
    enemyId,
    ownerId,
    enemyUserId,
  });
}
