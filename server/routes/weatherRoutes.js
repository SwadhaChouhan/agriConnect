import { Router } from 'express';
import { getWeather } from '../controllers/weatherController.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();

/**
 * GET /api/weather?location=Indore
 * Protected route — requires valid JWT token
 */
router.get('/', authenticate, getWeather);

export default router;
