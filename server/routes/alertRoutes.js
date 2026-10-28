import express from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js'; 
import { createAlert, getActiveAlerts } from '../controllers/alertController.js';

const router = express.Router();

router.get('/', authenticate, getActiveAlerts);
router.post('/', authenticate, authorize('admin'), createAlert);

export default router;