import express from 'express';
import {
  getAttendance,
  markAttendance,
  updateAttendance,
  getAnalytics,
  getCalculator,
  getTodayDashboardSummary,
  resetAttendance,
  generateLeaveApplication,
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAttendance);
router.post('/mark', markAttendance);
router.put('/:id', updateAttendance);
router.post('/reset', resetAttendance);
router.post('/generate-leave-letter', generateLeaveApplication);
router.get('/analytics', getAnalytics);
router.get('/calculator/:subjectId', getCalculator);
router.get('/dashboard-summary', getTodayDashboardSummary);

export default router;

