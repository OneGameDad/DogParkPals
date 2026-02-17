import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleBackupFailedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.BackupFailed) return;

  const { backupId, target, storage, errorMessage, errorStack } = event.payload;
  const error = new Error(errorMessage);
  if (errorStack) {
    error.stack = errorStack;
  }

  typeSafeLogger.logError('Backup failed (event bus)', error, {
    backupId,
    target,
    storage,
  });
}
