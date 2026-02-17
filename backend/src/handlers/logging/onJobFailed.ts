import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleJobFailedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.JobFailed) return;

  const { jobName, errorMessage, errorStack, context } = event.payload;
  const error = new Error(errorMessage);
  if (errorStack) {
    error.stack = errorStack;
  }

  typeSafeLogger.logError('Job failed (event bus)', error, {
    jobName,
    context,
  });
}
