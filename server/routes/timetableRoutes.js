import express from 'express';
import {
  getTimetable,
  createClass,
  updateClass,
  deleteClass,
  scanTimetable,
  parseTimetableText,
  confirmTimetable,
  importTimetable,
  exportTimetable,
  exportICS,
  addDateException,
  getClassmateSchedule,
  importClassmateSchedule,
} from '../controllers/timetableController.js';
import { protect } from '../middleware/auth.js';
import { uploadTimetable } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/', getTimetable);
router.post('/', createClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

// AI & Import / Export
router.post('/scan', uploadTimetable.single('file'), scanTimetable);
router.post('/parse-text', parseTimetableText);
router.post('/confirm', confirmTimetable);
router.post('/import', importTimetable);
router.get('/export', exportTimetable);
router.get('/export-ics', exportICS);

// Automatic College & Branch Classmate Timetable Discovery
router.get('/classmate-schedule', getClassmateSchedule);
router.post('/import-classmate-schedule', importClassmateSchedule);

// Temporary Date Exceptions
router.post('/exception', addDateException);

export default router;

