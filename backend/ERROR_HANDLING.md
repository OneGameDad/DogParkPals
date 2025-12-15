# Error Handling Guide

This guide explains the unified error handling architecture and how to implement it consistently across new services, controllers, and routes.

## Overview

The backend uses a centralized error handling system with:
- **AppError class** — typed errors with status codes, codes, and optional details
- **Global error middleware** — catches all errors and returns standardized responses
- **Zod validation** — declarative request validation with automatic `AppError` throwing
- **Error helpers** — factory functions for common HTTP error semantics

## Core Concepts

### 1. AppError Class

The `AppError` class is the foundation of error handling:

```typescript
// From src/utils/errors.ts
class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;
}
```

**Properties:**
- `statusCode` — HTTP status code (400, 404, 500, etc.)
- `code` — machine-readable error code (e.g., `VALIDATION_ERROR`, `NOT_FOUND`)
- `details` — optional object with additional context (field errors, reasons, etc.)

### 2. Error Helpers

Use these factory functions instead of creating `AppError` directly:

```typescript
import { 
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  UpstreamError,
  toAppError
} from '../utils/errors';

// Validation failure with field details
throw ValidationError('Validation failed', { email: ['Invalid format'], age: ['Must be 18+'] });

// Not found (auto 404)
throw NotFoundError('User not found');

// Duplicate key (auto 409)
throw ConflictError('Email already in use');

// Unauthorized (auto 401)
throw AuthError('Token expired');

// Forbidden (auto 403)
throw ForbiddenError('Not allowed to delete this resource');

// Rate limit (auto 429)
throw RateLimitError('Too many requests');

// Upstream service error (auto 502/504)
throw UpstreamError('Payment service unavailable', {}, 502);

// Convert unknown error to AppError with fallback
toAppError(unknownError, { 
  message: 'Failed to process request', 
  code: 'INTERNAL_ERROR', 
  statusCode: 500 
});
```

### 3. Zod Validation Schemas

Define request schemas in `src/utils/validationSchemas.ts`:

```typescript
import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  authorId: z.number().positive('Invalid author ID'),
});

export type CreatePostRequest = z.infer<typeof createPostSchema>;
```

### 4. Validation Helper

Use `parseValidation()` in controllers to validate and automatically throw `AppError`:

```typescript
import { parseValidation } from '../utils/validator';
import { createPostSchema } from '../utils/validationSchemas';

const { title, content, authorId } = parseValidation(createPostSchema, req.body);
// If invalid, throws AppError with 400 and field-level details automatically
```

## How to Add Error Handling to New Features

### Step 1: Define Validation Schema (if needed)

Add to `src/utils/validationSchemas.ts`:

```typescript
export const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(10).optional(),
  published: z.boolean().optional(),
});

export type UpdatePostRequest = z.infer<typeof updatePostSchema>;
```

### Step 2: Write Controller Actions

Controllers should **only handle the happy path** and forward all errors to the global middleware:

```typescript
import { parseValidation } from '../utils/validator';
import { updatePostSchema } from '../utils/validationSchemas';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { toAppError } from '../utils/errors';

const postController = {
  updatePost: async (req, res, next) => {
    try {
      // Validate input (throws AppError automatically on failure)
      const { title, content, published } = parseValidation(updatePostSchema, req.body);
      const postId = parseInt(req.params.id);

      // Fetch resource
      const post = await postService.getPostById(postId);
      
      // Check authorization
      if (post.authorId !== req.userId) {
        throw ForbiddenError('Cannot edit posts by other users');
      }

      // Validate business logic
      if (post.published && !title) {
        throw ValidationError('Published posts must have a title', { title: ['Required for published posts'] });
      }

      // Call service and respond
      const updated = await postService.updatePost(postId, { title, content, published });
      res.status(200).json(updated);
    } catch (error) {
      // Forward ALL errors to global middleware
      next(toAppError(error, {
        message: 'Failed to update post',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      }));
    }
  },
};
```

**Key principles:**
- ✅ Validate input with `parseValidation()`
- ✅ Check resources exist before accessing
- ✅ Throw specific errors for business logic violations
- ✅ Wrap all logic in try/catch
- ✅ Forward all errors via `next(toAppError())`
- ❌ Never use `res.status().json()` for errors
- ❌ Don't manually build error responses

### Step 3: Handle Prisma Errors (in Services)

Services should throw `AppError` for known Prisma failures:

```typescript
import { Prisma } from '@prisma/client';
import { NotFoundError, ConflictError } from '../utils/errors';

const postService = {
  deletePost: async (postId: number) => {
    try {
      return await prisma.post.delete({ where: { id: postId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found
          throw NotFoundError('Post not found');
        }
        if (error.code === 'P2003') {
          // Foreign key constraint
          throw ConflictError('Cannot delete post with active comments');
        }
      }
      throw error; // Re-throw, will be caught by controller
    }
  },
};
```

**Pre-mapped Prisma codes:**
- `P2000` → 400 `VALUE_OUT_OF_RANGE`
- `P2001` → 404 `NOT_FOUND`
- `P2002` → 409 `UNIQUE_CONSTRAINT`
- `P2003` → 400 `FOREIGN_KEY_CONSTRAINT`
- `P2004` → 409 `CONSTRAINT_FAILED`

(See `src/utils/errors.ts` for automatic mapping via `toAppError()`)

### Step 4: Create Routes

Routes are simple — just call controllers:

```typescript
import express from 'express';
import postController from '../controllers/postController';

const router = express.Router();

router.put('/posts/:id', postController.updatePost);

export default router;
```

The global error middleware automatically handles errors thrown by controllers.

### Step 5: Write Tests

Test that errors are forwarded via `next()`:

```typescript
import { AppError, ForbiddenError } from '../utils/errors';

describe('Post Controller', () => {
  test('forwards forbidden error when user is not author', async () => {
    const mockReq = { body: { title: 'New' }, params: { id: '1' }, userId: 2 };
    const mockRes = { status: jest.fn(), json: jest.fn() };
    const mockNext = jest.fn();

    mockPostService.getPostById.mockResolvedValue({ id: 1, authorId: 1 });

    await postController.updatePost(mockReq as any, mockRes as any, mockNext as any);

    expect(mockNext).toHaveBeenCalledTimes(1);
    const forwardedError = mockNext.mock.calls[0][0];
    expect(forwardedError).toBeInstanceOf(AppError);
    expect((forwardedError as AppError).statusCode).toBe(403);
    expect((forwardedError as AppError).code).toBe('FORBIDDEN');
  });
});
```

## Error Response Format

The global middleware returns standardized responses:

**Success response (2xx):**
```json
{
  "id": 1,
  "title": "My Post",
  "content": "..."
}
```

**Client error (4xx):**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "title": ["Title is required"],
    "content": ["Must be at least 10 characters"]
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Server error (5xx):**
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

(Details are always hidden for 5xx to prevent leaking sensitive info)

## Common Patterns

### Pattern 1: Check Resource Exists

```typescript
const user = await userService.getUserById(userId);
if (!user) {
  throw NotFoundError(`User ${userId} not found`);
}
```

### Pattern 2: Check Authorization

```typescript
if (resource.ownerId !== req.userId) {
  throw ForbiddenError('You do not have permission to access this resource');
}
```

### Pattern 3: Check Duplicate

```typescript
const existing = await emailService.findByEmail(email);
if (existing) {
  throw ConflictError('Email already registered');
}
```

### Pattern 4: Complex Validation

```typescript
const { age, country } = parseValidation(registerSchema, req.body);

const errors: Record<string, string[]> = {};
if (age < 18 && !allowMinors) errors.age = ['Must be 18+ in this region'];
if (!supportedCountries.includes(country)) errors.country = ['Not supported'];

if (Object.keys(errors).length) {
  throw ValidationError('Registration not allowed in your region', errors);
}
```

### Pattern 5: Call External Service

```typescript
try {
  const payment = await paymentService.charge(amount);
} catch (error) {
  if (error instanceof PaymentTimeoutError) {
    throw UpstreamError('Payment service timed out', { originalError: error.message }, 504);
  }
  throw UpstreamError('Payment service unavailable', { originalError: error.message }, 502);
}
```

## Checklist for New Routes

- [ ] Define Zod schema in `validationSchemas.ts` (if accepting request body/params)
- [ ] Controller validates input with `parseValidation()`
- [ ] Controller throws specific errors (NotFoundError, ConflictError, etc.)
- [ ] Controller wrapped in try/catch that forwards to `next(toAppError())`
- [ ] Service methods throw AppError for known failures (Prisma, external APIs)
- [ ] Tests verify errors are forwarded via `next()` not returned inline
- [ ] No inline `res.status().json()` for error responses
- [ ] Routes simply call controllers (error handling is in controllers/middleware)

## File Reference

- `src/utils/errors.ts` — AppError class, helpers, Prisma mapping
- `src/utils/validator.ts` — parseValidation helper
- `src/utils/validationSchemas.ts` — Zod schemas (add new ones here)
- `src/middlewares/errorHandler.ts` — Global error middleware (do not modify for specific routes)
- `src/middlewares/requestId.ts` — Adds requestId to all responses for debugging

## Retry/Timeout Classification

For outbound service calls (APIs, databases, external services), classify errors to guide retry and circuit-breaker strategies:

```typescript
import { classifyError, createExternalServiceError } from '../utils/errorClassification';

const paymentService = {
  charge: async (amount: number) => {
    try {
      return await paymentAPI.charge(amount);
    } catch (error) {
      // Classify for retry logic
      const classified = classifyError(error);
      
      if (classified.isTimeout) {
        // Track timeout for circuit breaker
        circuitBreaker.recordTimeout();
      }
      
      if (!classified.isRetryable) {
        // Fail fast for permanent errors
        throw error;
      }
      
      // Retry transient errors with exponential backoff
      throw createExternalServiceError('PaymentAPI', 503, 'SERVICE_UNAVAILABLE', error);
    }
  },
};
```

**Classification levels:**
- `RETRYABLE` (5xx, 429) — Retry with exponential backoff
- `TIMEOUT` (408) — Circuit breaker + aggressive backoff
- `NON_RETRYABLE` (4xx except 429) — Fail fast, no retry

**Using classified errors:**
```typescript
const error = paymentError;
const classified = classifyError(error);

// Retry logic
if (classified.isRetryable) {
  await retry(operation, {
    maxAttempts: 3,
    backoff: (attempt) => 100 * Math.pow(2, attempt), // exponential
  });
}

// Circuit breaker
if (classified.isTimeout) {
  circuitBreaker.trip(); // open circuit after threshold
}

// Logging
logger.error('External call failed', {
  service: classified.code,
  retryable: classified.isRetryable,
  statusCode: classified.statusCode,
});
```

## Questions?

If you're uncertain about error handling in a new feature:
1. Check `src/controllers/userController.ts` for the reference implementation
2. Look at `src/tests/userController.test.ts` for test patterns
3. Review `src/tests/errorHandler.test.ts` for middleware behavior
4. Check `src/tests/errorClassification.test.ts` for retry/timeout classification
5. Reference `src/utils/errorClassification.ts` for available classifications
