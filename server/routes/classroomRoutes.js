import express from 'express';
import multer from 'multer';
import {
  getAuthUrl,
  handleOAuthCallback,
  exchangeAuthCode,
  getConnectionStatus,
  syncClassroom,
  disconnectClassroom,
  submitAssignmentToClassroom,
  unsubmitAssignmentFromClassroom,
  getSubmissionDetails,
} from '../controllers/classroomController.js';
import { protect } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max attachment
});

const router = express.Router();

// OAuth callback accessed by Google redirect
router.get('/callback', handleOAuthCallback);

// Protected endpoints
router.get('/auth-url', protect, getAuthUrl);
router.post('/exchange-code', protect, exchangeAuthCode);
router.get('/status', protect, getConnectionStatus);
router.post('/sync', protect, syncClassroom);
router.post('/disconnect', protect, disconnectClassroom);

// Direct Google Classroom Submissions
router.post('/submit', protect, upload.single('file'), submitAssignmentToClassroom);
router.post('/unsubmit', protect, unsubmitAssignmentFromClassroom);
router.get('/submission-details/:assignmentId', protect, getSubmissionDetails);

export default router;
