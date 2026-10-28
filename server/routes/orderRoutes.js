import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';

const router = Router();

// All order operations require authentication
router.use(authenticate);

// Farmer order operations
router.post('/', authorize('farmer'), createOrder);
router.get('/my', authorize('farmer'), getMyOrders);

// Admin order operations
router.get('/', authorize('admin'), getAllOrders);
router.put('/:id/status', authorize('admin'), updateOrderStatus);

export default router;
