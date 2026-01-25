import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyPassword } from '../utils/password';
import userService from '../services/userServices';
import { AuthError, NotFoundError, toAppError, isAppError } from '../utils/errors';
import { parseValidation } from '../utils/validator';
import { loginSchema } from '../utils/validationSchemas';
import typeSafeLogger from '../utils/typeSafeLogger';
import { sanitizeUser } from '../utils/userSanitizer';
import { blacklistToken } from '../utils/tokenBlacklist';

const authController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      typeSafeLogger.logRequest('Login attempt', { method: req.method, path: req.path });
      const { email, password } = parseValidation(loginSchema, req.body);

      const user = await userService.getUserByEmail(email);
      if (!user) {
        throw NotFoundError('User not found');
      }

      const isValidPassword = await verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        throw AuthError('Invalid credentials');
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, secret, { expiresIn: '7d' });
      typeSafeLogger.logUserAction('User logged in', { userId: user.id, email: user.email });

      // Set httpOnly cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({ user: sanitizeUser(user) });
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(toAppError(error, { message: 'Failed to login', code: 'LOGIN_FAILED', statusCode: 500 }));
    }
  },

  logout: async (req: Request, res: Response) => {
    const token = req.cookies.authToken;
    
    if (token) {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        try {
          const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
          const expSeconds = typeof decoded.exp === 'number' ? decoded.exp : Math.floor(Date.now() / 1000);
          blacklistToken(token, expSeconds);
        } catch {
          // If token invalid/expired, treat logout as idempotent
        }
      }
    }

    // Clear the cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.status(204).send();
  },

  googleCallback: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // User is attached to req by passport
      const user = req.user as any;
      
      if (!user) {
        throw AuthError('Google authentication failed');
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        secret,
        { expiresIn: '7d' }
      );

      typeSafeLogger.logUserAction('User logged in via Google', { userId: user.id, email: user.email });

      // Set httpOnly cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend without token in URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/google/callback`);
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(toAppError(error, { message: 'Google authentication failed', code: 'GOOGLE_AUTH_FAILED', statusCode: 500 }));
    }
  },
};

export default authController;
