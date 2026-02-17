import { z } from 'zod';
import { AppError } from './errors';

export const parseValidation = <T,>(schema: z.ZodSchema<T>, data: any): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    });

    throw new AppError('Validation failed', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details: fieldErrors,
    });
  }

  return result.data;
};
