import type { DomainEventUnion } from '../../events/eventTypes';
import { EventTypes } from '../../events/eventTypes';
import typeSafeLogger from '../../utils/typeSafeLogger';

export async function handleDogDocumentUploadedLogging(event: DomainEventUnion) {
  if (event.type !== EventTypes.DogDocumentUploaded) return;

  const { dogId, vaccinationRecordUrl } = event.payload;
  typeSafeLogger.logUserAction('Dog document uploaded (event bus)', {
    dogId,
    vaccinationRecordUrl,
  });
}
