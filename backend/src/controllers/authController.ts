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

      res.status(200).json({ token, user: sanitizeUser(user) });
    } catch (error) {
      if (isAppError(error)) {
        return next(error);
      }
      return next(toAppError(error, { message: 'Failed to login', code: 'LOGIN_FAILED', statusCode: 500 }));
    }
  },

  logout: async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(204).send();
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(204).send();
    }

    try {
      const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
      const expSeconds = typeof decoded.exp === 'number' ? decoded.exp : Math.floor(Date.now() / 1000);
      blacklistToken(token, expSeconds);
    } catch {
      // If token invalid/expired, treat logout as idempotent
    }

    res.status(204).send();
  },
};

export default authController;
