import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import { getUsers, deleteUser } from '../controllers/userController.js';

const router = Router();

// All user management routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// GET /api/users - Fetch all users
router.get('/', getUsers);

// DELETE /api/users/:id - Delete a user by ID
router.delete('/:id', deleteUser);

export default router;
