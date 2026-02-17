import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleBackupStartedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.BackupStarted) return;

  const { backupId, target, storage } = event.payload;
  typeSafeLogger.info('Backup started (event bus)', {
    backupId,
    target,
    storage,
  });
}
