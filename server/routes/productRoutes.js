import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';

const router = Router();

// All marketplace product routes require an authenticated user
router.use(authenticate);

// Public browsing for all authenticated users (farmers and admins)
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin only: Product stock & inventory management
router.post('/', authorize('admin'), createProduct);
router.put('/:id', authorize('admin'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

export default router;
