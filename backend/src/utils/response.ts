import type { Request } from 'express';

export interface ErrorResponseBody {
  error: string;
  code: string;
  details?: unknown;
  requestId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
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

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
};

export const buildPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> => {
  return {
    data,
    pagination: buildPaginationMeta(page, limit, total),
  };
};
