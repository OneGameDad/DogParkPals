import express from 'express';
import authController from '../controllers/authController';
import { authLimiter } from '../middlewares/rateLimitMiddleware';

const router = express.Router();

router.post('/auth/login', authLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/auth/logout', (req, res) => authController.logout(req, res));

export default router;
