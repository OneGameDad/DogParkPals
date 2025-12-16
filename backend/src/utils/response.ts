import type { Request } from 'express';

export interface ErrorResponseBody {
  error: string;
  code: string;
  details?: unknown;
  requestId?: string;
}

export const buildErrorResponse = (
  req: Request,
  { error, code, details }: { error: string; code: string; details?: unknown }
): ErrorResponseBody => {
  const body: ErrorResponseBody = { error, code };
  const headers = req.headers || {};
  const requestId = (req as any).requestId ?? (headers['x-request-id'] as string | undefined);
  if (requestId) body.requestId = requestId;
  if (details !== undefined) body.details = details;
  return body;
};
