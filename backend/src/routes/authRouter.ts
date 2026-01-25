import express from 'express';
import authController from '../controllers/authController';
import { authLimiter } from '../middlewares/rateLimitMiddleware';
import { requireAuth } from '../middlewares/authMiddleware';
import passport from '../services/googleAuthService';

const router = express.Router();

router.post('/login', authLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/logout', requireAuth, (req, res) => authController.logout(req, res));

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res, next) => authController.googleCallback(req, res, next)
);

export default router;
