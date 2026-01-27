import express from 'express';
import searchController from '../controllers/searchController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

// Search requires authentication for proper authorization filtering
router.use(requireAuth);

// Advanced search across all types
// GET /api/search?q=<query>&type=<type>&limit=<limit>&offset=<offset>
router.get('/', (req, res, next) => searchController.advancedSearch(req, res, next));

// Search by specific type
// GET /api/search/<type>?q=<query>&limit=<limit>&offset=<offset>
router.get('/:type', (req, res, next) => searchController.searchByType(req, res, next));

export default router;
