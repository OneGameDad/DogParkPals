# Authentication Guide for Developers

This guide explains how to implement authentication and protect routes in the DogParkPals backend.

## Overview

The application uses JWT (JSON Web Token) based authentication. Users receive a token upon login, which they include in subsequent requests to access protected resources.

## Current Authorization Notes

- User deletion endpoint: `DELETE /users/:id`
- Self-deletion is allowed for authenticated users.
- Cross-user deletion is restricted to users with role `ADMIN` or `DEVELOPER`.
- A non-privileged user deleting another account receives `403 Forbidden`.

## Architecture

### Components

1. **Auth Middleware** (`src/middlewares/authMiddleware.ts`) - Validates JWT tokens
2. **Auth Controller** (`src/controllers/authController.ts`) - Handles login/logout
3. **Protected Routes** - Routes that require authentication
4. **Public Routes** - Routes accessible without authentication

### Request Flow

```
Client Request
    ↓
[Public Route] → Controller → Response
    OR
[Protected Route] → Auth Middleware → Controller → Response
                         ↓ (if invalid)
                    401 Unauthorized
```

## Implementation Steps

### 1. Create Auth Middleware

Create `src/middlewares/authMiddleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthError } from '../utils/errors';

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

interface JwtPayload {
  userId: number;
  email: string;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AuthError('No authentication token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // Attach userId to request for use in controllers
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(AuthError('Invalid authentication token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(AuthError('Authentication token expired'));
    }
    return next(error);
  }
};

// Optional: Middleware for optional auth (attach userId if present, but don't require it)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without userId
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next();
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.userId = decoded.userId;
    
    next();
  } catch {
    // Token invalid, continue without userId
    next();
  }
};
```

### 2. Create Auth Controller

Create `src/controllers/authController.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyPassword } from '../utils/password';
import userService from '../services/userServices';
import { AuthError, NotFoundError } from '../utils/errors';
import { parseValidation } from '../utils/validator';
import { loginSchema } from '../utils/validationSchemas';
import typeSafeLogger from '../utils/typeSafeLogger';

const authController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest('Login attempt', { method: req.method, path: req.path });
      
      const { email, password } = parseValidation(loginSchema, req.body);

      // Find user by email
      const user = await userService.getUserByEmail(email);
      if (!user) {
        throw NotFoundError('User not found');
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        throw AuthError('Invalid credentials');
      }

      // Generate JWT token
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        secret,
        { expiresIn: '7d' } // Token expires in 7 days
      );

      typeSafeLogger.logUserAction('User logged in', { userId: user.id, email: user.email });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
};

export default authController;
```

### 3. Add Login Validation Schema

Add to `src/utils/validationSchemas.ts`:

```typescript
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});
```

### 4. Set Up Routes

#### Public Routes (No Authentication Required)

```typescript
// src/routes/authRouter.ts
import express from 'express';
import authController from '../controllers/authController';

const router = express.Router();

// Public: Anyone can login
router.post('/auth/login', (req, res, next) => authController.login(req, res, next));

export default router;
```

```typescript
// src/routes/userRouter.ts
import express from 'express';
import userController from '../controllers/userController';

const router = express.Router();

// Public: Anyone can create an account
router.post('/users', (req, res, next) => userController.createUser(req, res, next));

export default router;
```

#### Protected Routes (Authentication Required)

```typescript
// src/routes/userRouter.ts
import express from 'express';
import userController from '../controllers/userController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

// Public routes
router.post('/users', (req, res, next) => userController.createUser(req, res, next));

// Protected routes - Add requireAuth middleware before controller
router.get('/users/me', requireAuth, (req, res, next) => 
  userController.getCurrentUser(req, res, next)
);

router.patch('/users/me', requireAuth, (req, res, next) => 
  userController.updateCurrentUser(req, res, next)
);

router.delete('/users/me', requireAuth, (req, res, next) => 
  userController.deleteCurrentUser(req, res, next)
);

export default router;
```

#### Messages Routes (All Protected)

```typescript
// src/routes/messageRouter.ts
import express from 'express';
import messageController from '../controllers/messageController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

// All message routes require authentication
router.use(requireAuth); // Apply middleware to all routes in this router

router.post('/messages', (req, res, next) => 
  messageController.sendMessage(req, res, next)
);

router.get('/messages', (req, res, next) => 
  messageController.getMyMessages(req, res, next)
);

router.get('/messages/conversation/:userId', (req, res, next) => 
  messageController.getConversation(req, res, next)
);

router.delete('/messages/:id', (req, res, next) => 
  messageController.deleteMessage(req, res, next)
);

export default router;
```

### 5. Update Server Configuration

```typescript
// src/server.ts
import express from 'express';
import authRouter from './routes/authRouter';
import userRouter from './routes/userRouter';
import messageRouter from './routes/messageRouter';
import { requestIdMiddleware } from './middlewares/requestId';
import { errorHandler } from './middlewares/errorHandler';
import typeSafeLogger from './utils/typeSafeLogger';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Global middleware
app.use(requestIdMiddleware);
app.use(express.json());

// Public routes
app.get('/health', (_req, res) => {
  typeSafeLogger.info('Health check endpoint hit');
  res.json({ status: 'ok' });
});

// Route handlers
app.use(authRouter);
app.use(userRouter);
app.use(messageRouter); // All routes in this router require auth

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  typeSafeLogger.info('Server listening', { port: PORT });
});
```

### 6. Environment Configuration

Add to `.env`:

```bash
JWT_SECRET=your-secret-key-here-use-a-long-random-string
```

⚠️ **Important**: Use a strong, random secret in production. Generate one with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Using Authentication in Controllers

Once the `requireAuth` middleware runs, the `userId` is available on the request object:

```typescript
// Example: Protected controller method
const messageController = {
  sendMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.userId is guaranteed to exist because requireAuth ran first
      const senderId = req.userId!;
      const { receiverId, content } = parseValidation(sendMessageSchema, req.body);

      // User can only send messages as themselves
      const message = await messageService.createMessage(senderId, receiverId, content);

      res.status(201).json(message);
    } catch (error) {
      return next(error);
    }
  },

  getMyMessages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      
      // Get all messages where user is sender or receiver
      const messages = await messageService.getUserMessages(userId);

      res.json(messages);
    } catch (error) {
      return next(error);
    }
  },
};
```

## Quick Reference

### Route Protection Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| No middleware | Public endpoint | `POST /users`, `POST /auth/login` |
| `requireAuth` before controller | Single protected route | `router.get('/users/me', requireAuth, controller.get)` |
| `router.use(requireAuth)` | All routes in router protected | Apply once at top of router file |
| `optionalAuth` | Auth enhances but isn't required | Public feed that shows more if logged in |

### Testing Protected Routes

```bash
# Login to get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'

# Use token in protected request
curl http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Common Errors

| Status | Code | Meaning | Fix |
|--------|------|---------|-----|
| 401 | `AUTH_ERROR` | No token provided | Add `Authorization: Bearer <token>` header |
| 401 | `AUTH_ERROR` | Invalid token | Token malformed or wrong secret |
| 401 | `AUTH_ERROR` | Token expired | User needs to login again |
| 403 | `FORBIDDEN` | Insufficient permissions | User authenticated but lacks access rights |

## Security Best Practices

1. **Always use HTTPS in production** - Tokens sent over HTTP can be intercepted
2. **Use strong JWT secrets** - At least 32 random bytes
3. **Set reasonable token expiration** - Balance security vs. user convenience
4. **Don't store sensitive data in tokens** - Tokens are base64 encoded, not encrypted
5. **Validate token on every protected request** - Never trust client-side data
6. **Log authentication failures** - Monitor for suspicious activity
7. **Rate limit login attempts** - Prevent brute force attacks
8. **Hash passwords with bcrypt** - Already implemented in `userServices.ts`

## Dependencies

Install required packages:

```bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

## Integration with Error Handling

The authentication middleware integrates seamlessly with the existing error handling system:

- Throws `AuthError` (401) for auth failures
- Errors are caught by global `errorHandler` middleware
- Logs include `requestId` for tracing
- Client receives consistent error response format

See `ERROR_HANDLING.md` for more details on error handling patterns.
