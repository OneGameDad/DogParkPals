import express from 'express';
import searchService, { SearchFilters } from '../services/searchService';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError, isAppError } from '../utils/errors';
import { parseValidation } from '../utils/validator';
import {
  advancedSearchSchema,
  searchByTypeSchema,
} from '../utils/validationSchemas';

const searchController = {
  /**
   * Advanced search across all entity types
   * GET /api/search?q=<query>&type=<type>&limit=<limit>&offset=<offset>
   */
  advancedSearch: async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      typeSafeLogger.logRequest('Received advanced search request', {
        method: req.method,
        path: req.path,
        query: req.query,
      });

      // Convert query object to plain object (req.query has null prototype)
      const queryData = JSON.parse(JSON.stringify(req.query));
      const { q, type, limit, offset } = parseValidation(advancedSearchSchema, queryData);
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const filters: SearchFilters = {
        type: type as any,
        limit: limit ? parseInt(limit as string, 10) : 10,
        offset: offset ? parseInt(offset as string, 10) : 0,
      };

      const results = await searchService.search(q as string, filters, userId, userRole);

      typeSafeLogger.logUserAction('Advanced search completed', {
        query: q,
        type,
        resultCount: results.total,
      });

      res.status(200).json(results);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, {
          message: 'Failed to perform search',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        })
      );
    }
  },

  /**
   * Search by specific entity type
   * GET /api/search/<type>?q=<query>&limit=<limit>&offset=<offset>
   */
  searchByType: async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      typeSafeLogger.logRequest('Received search by type request', {
        method: req.method,
        path: req.path,
        type: req.params.type,
      });

      const { type, q, limit, offset } = parseValidation(searchByTypeSchema, {
        type: req.params.type,
        q: req.query.q,
        limit: req.query.limit,
        offset: req.query.offset,
      });

      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 10;
      const parsedOffset = offset ? parseInt(offset as string, 10) : 0;

      const results = await searchService.searchByType(
        q as string,
        type as 'PARK' | 'USER' | 'DOG' | 'ORGANIZATION' | 'EVENT',
        parsedLimit,
        parsedOffset,
        userId,
        userRole
      );

      typeSafeLogger.logUserAction('Search by type completed', {
        type,
        query: q,
        resultCount: results.length,
      });

      res.status(200).json({
        type,
        query: q,
        results,
        count: results.length,
      });
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(
        toAppError(error, {
          message: 'Failed to perform search',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        })
      );
    }
  },
};

export default searchController;
