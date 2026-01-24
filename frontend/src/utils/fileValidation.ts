import type { UploadCategory } from '../constants';
import { UPLOAD_RULES } from '../constants';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateFile = (
  file: File | null | undefined,
  category: UploadCategory
): ValidationResult => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  const rules = UPLOAD_RULES[category];
  if (!rules) {
    return { valid: false, error: 'Invalid upload category' };
  }

  if (!rules.types.find(t => t === file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed types: ${rules.types.join(', ')}` 
    };
  }

  const maxSizeBytes = rules.maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `File size exceeds ${rules.maxSizeMB}MB limit` 
    };
  }

  return { valid: true };
};
