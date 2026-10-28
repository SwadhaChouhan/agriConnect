import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import {
  createConsultation,
  getMyConsultations,
  getAllConsultations,
  replyToConsultation,
} from '../controllers/consultationController.js';

const router = Router();

// All consultation endpoints require authentication
router.use(authenticate);

// Farmer routes
router.post('/', authorize('farmer'), createConsultation);
router.get('/my', authorize('farmer'), getMyConsultations);

// Admin routes
router.get('/', authorize('admin'), getAllConsultations);
router.put('/:id/reply', authorize('admin'), replyToConsultation);

export default router;
