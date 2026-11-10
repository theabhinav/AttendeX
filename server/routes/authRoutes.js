import express from 'express';
import {
  register,
  login,
  googleAuth,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected account routes
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

export default router;

