import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthError } from '../utils/errors';
import { isTokenBlacklisted } from '../utils/tokenBlacklist';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: number;
  email: string;
  role?: string;
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token = req.cookies.authToken;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }

    if (!token) {
      throw AuthError('No authentication token provided');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (isTokenBlacklisted(token)) {
      throw AuthError('Invalid authentication token');
    }

    // Verify user still exists and is not deleted
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw AuthError('User account has been deleted');
    }
    if (user.username === 'deleted_user') {
      throw AuthError('This account cannot be used');
    }

    req.userId = decoded.userId;
    req.user = { id: decoded.userId, role: decoded.role };

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

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token = req.cookies.authToken;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }

    if (!token) {
      return next();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next();
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
      if (isTokenBlacklisted(token)) {
        return next(AuthError('Invalid authentication token'));
      }

      // Verify user still exists and is not deleted
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (user && user.username === 'deleted_user') {
        return next(AuthError('This account cannot be used'));
      }
      if (!user) {
        return next();
      }

      req.userId = decoded.userId;
      req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch {
    next();
  }
};
