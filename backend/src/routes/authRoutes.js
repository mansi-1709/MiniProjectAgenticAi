import express from 'express';
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllUsers,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

// Protected routes
router.get('/me', protect, getMe);

// Admin and Super Admin routes
router.get('/pending-users', protect, authorize('admin', 'super_admin'), getPendingUsers);
router.put('/approve-user/:userId', protect, authorize('admin', 'super_admin'), approveUser);
router.put('/reject-user/:userId', protect, authorize('admin', 'super_admin'), rejectUser);
router.get('/users', protect, authorize('admin', 'super_admin'), getAllUsers);

export default router;
