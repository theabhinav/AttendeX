import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getVapidKey,
  subscribeWebPush,
  updatePreferences,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.get('/vapid-public-key', getVapidKey);
router.post('/subscribe', subscribeWebPush);
router.put('/preferences', updatePreferences);

export default router;

