import express from 'express';
import authController from '../controllers/authController';
import { authLimiter } from '../middlewares/rateLimitMiddleware';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/login', authLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/logout', requireAuth, (req, res) => authController.logout(req, res));

export default router;
