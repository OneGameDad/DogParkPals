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

export interface CursorPaginationMeta {
  hasMore: boolean;
  lastMessageId: number | null;
  limit: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  cursor: CursorPaginationMeta;
}

export const buildCursorPaginationMeta = (
  data: Array<{ id: number }>,
  limit: number,
  hasMore: boolean
): CursorPaginationMeta => {
  const lastMessageId = data.length > 0 ? data[data.length - 1].id : null;
  return {
    hasMore,
    lastMessageId,
    limit,
  };
};

export const buildCursorPaginatedResponse = <T extends { id: number }>(
  data: T[],
  limit: number,
  hasMore: boolean
): CursorPaginatedResponse<T> => {
  return {
    data,
    cursor: buildCursorPaginationMeta(data, limit, hasMore),
  };
};
