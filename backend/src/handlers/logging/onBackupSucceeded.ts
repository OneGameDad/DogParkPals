import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleBackupSucceededLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.BackupSucceeded) return;

  const { backupId, target, storage, sizeBytes, durationMs } = event.payload;
  typeSafeLogger.logUserAction('Backup succeeded (event bus)', {
    backupId,
    target,
    storage,
    sizeBytes,
    durationMs,
  });
}
