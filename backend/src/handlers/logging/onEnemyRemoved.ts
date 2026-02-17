import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleEnemyRemovedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.EnemyRemoved) return;

  const { ownerId, enemyUserId } = event.payload;
  typeSafeLogger.logUserAction('Enemy removed (event bus)', {
    ownerId,
    enemyUserId,
  });
}
