import Attendance from '../models/Attendance.js';
import Subject from '../models/Subject.js';
import Timetable from '../models/Timetable.js';
import {
  getOverallAnalytics,
  calculateSafeBunks,
  calculateClassesNeeded,
} from '../services/attendanceAnalyticsService.js';
import { DAYS } from '../config/constants.js';

export const getAttendance = async (req, res, next) => {
  try {
    const { subjectId, date, month, year } = req.query;
    const filter = { userId: req.user._id };

    if (subjectId) filter.subjectId = subjectId;
    if (date) filter.date = date;
    if (month && year) {
      // Regex match for YYYY-MM
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      filter.date = new RegExp(`^${prefix}`);
    }

    const records = await Attendance.find(filter)
      .populate('subjectId scheduledClassId')
      .sort({ date: -1, markedAt: -1 });

    res.status(200).json({ success: true, records });
  } catch (error) {
    next(error);
  }
};

export const markAttendance = async (req, res, next) => {
  try {
    const { subjectId, scheduledClassId, date, status, notes } = req.body;

    if (!subjectId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Subject, date, and status are required.',
      });
    }

    const userId = req.user._id;

    // Check if record already exists for this scheduled class & date
    let existingRecord = null;
    if (scheduledClassId) {
      existingRecord = await Attendance.findOne({
        userId,
        scheduledClassId,
        date,
      });
    } else {
      existingRecord = await Attendance.findOne({
        userId,
        subjectId,
        date,
        scheduledClassId: null,
      });
    }

    if (existingRecord) {
      // Update existing record with change history
      if (existingRecord.status !== status) {
        existingRecord.changeHistory.push({
          previousStatus: existingRecord.status,
          newStatus: status,
          changedAt: new Date(),
          reason: notes || 'Updated status',
        });
        existingRecord.status = status;
        if (notes) existingRecord.notes = notes;
        await existingRecord.save();
      }

      const populated = await existingRecord.populate('subjectId scheduledClassId');
      return res.status(200).json({
        success: true,
        message: `Attendance updated to ${status}.`,
        record: populated,
      });
    }

    // Create new attendance record
    const newRecord = await Attendance.create({
      userId,
      subjectId,
      scheduledClassId: scheduledClassId || null,
      date,
      status,
      notes: notes || '',
      markedAt: new Date(),
    });

    const populated = await newRecord.populate('subjectId scheduledClassId');

    res.status(201).json({
      success: true,
      message: `Marked as ${status}.`,
      record: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, reason } = req.body;

    const record = await Attendance.findOne({ _id: id, userId: req.user._id });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    if (status && status !== record.status) {
      record.changeHistory.push({
        previousStatus: record.status,
        newStatus: status,
        changedAt: new Date(),
        reason: reason || notes || 'Manual modification',
      });
      record.status = status;
    }

    if (notes !== undefined) record.notes = notes;
    await record.save();

    const populated = await record.populate('subjectId scheduledClassId');

    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully.',
      record: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await getOverallAnalytics(
      req.user._id,
      req.user.attendanceThreshold || 75
    );
    res.status(200).json({ success: true, analytics });
  } catch (error) {
    next(error);
  }
};

export const getCalculator = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const userId = req.user._id;
    const threshold = req.user.attendanceThreshold || 75;

    const subject = await Subject.findOne({ _id: subjectId, userId });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const records = await Attendance.find({ userId, subjectId });
    const attended = records.filter((r) => r.status === 'Present').length;
    const missed = records.filter((r) => r.status === 'Absent').length;
    const conducted = attended + missed;
    const currentPct = conducted > 0 ? Math.round((attended / conducted) * 1000) / 10 : 0;

    const safeBunks = calculateSafeBunks(attended, conducted, threshold);
    const neededForThreshold = calculateClassesNeeded(attended, conducted, threshold);

    // Multi-target calculations
    const targets = [
      { percentage: 75, needed: calculateClassesNeeded(attended, conducted, 75), safeBunks: calculateSafeBunks(attended, conducted, 75) },
      { percentage: 80, needed: calculateClassesNeeded(attended, conducted, 80), safeBunks: calculateSafeBunks(attended, conducted, 80) },
      { percentage: 85, needed: calculateClassesNeeded(attended, conducted, 85), safeBunks: calculateSafeBunks(attended, conducted, 85) },
      { percentage: 90, needed: calculateClassesNeeded(attended, conducted, 90), safeBunks: calculateSafeBunks(attended, conducted, 90) },
    ];

    let message = '';
    if (currentPct >= threshold) {
      message = `You can safely miss up to ${safeBunks} consecutive classes while maintaining at least ${threshold}% attendance.`;
    } else {
      message = `Your attendance is currently ${currentPct}%. You need to attend the next ${neededForThreshold} consecutive classes to reach ${threshold}%.`;
    }

    res.status(200).json({
      success: true,
      data: {
        subject: {
          _id: subject._id,
          name: subject.name,
          code: subject.code,
        },
        attended,
        missed,
        conducted,
        currentPct,
        threshold,
        safeBunks,
        neededForThreshold,
        targets,
        message,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Real-time summary for student dashboard: today's timetable + current status + today's attendance
 */
export const getTodayDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
    const todayDateStr = now.toISOString().split('T')[0];

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // 1. Get today's classes
    const classes = await Timetable.find({
      userId,
      day: currentDay,
      status: 'Active',
    })
      .populate('subjectId')
      .sort({ startTime: 1 });

    // 2. Fetch today's marked attendance
    const todayAttendance = await Attendance.find({
      userId,
      date: todayDateStr,
    });

    const attendanceMap = new Map();
    todayAttendance.forEach((att) => {
      if (att.scheduledClassId) {
        attendanceMap.set(att.scheduledClassId.toString(), att);
      }
    });

    // 3. Attach status
    const scheduledWithStatus = classes.map((cls) => {
      const [startH, startM] = cls.startTime.split(':').map(Number);
      const [endH, endM] = cls.endTime.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      let timeStatus = 'upcoming';
      if (currentMinutes >= startMin && currentMinutes <= endMin) {
        timeStatus = 'ongoing';
      } else if (currentMinutes > endMin) {
        timeStatus = 'completed';
      }

      const marked = attendanceMap.get(cls._id.toString());

      return {
        _id: cls._id,
        subject: cls.subjectId,
        startTime: cls.startTime,
        endTime: cls.endTime,
        room: cls.room,
        faculty: cls.faculty || cls.subjectId?.faculty,
        classType: cls.classType,
        timeStatus,
        attendanceStatus: marked ? marked.status : 'Pending',
        attendanceRecordId: marked ? marked._id : null,
      };
    });

    // 4. Overall stats
    const analytics = await getOverallAnalytics(userId, req.user.attendanceThreshold || 75);

    // 5. Find upcoming next class
    const upcomingClass = scheduledWithStatus.find(
      (c) => c.timeStatus === 'upcoming' || c.timeStatus === 'ongoing'
    );

    res.status(200).json({
      success: true,
      today: {
        day: currentDay,
        date: todayDateStr,
        classes: scheduledWithStatus,
        upcomingClass: upcomingClass || null,
        analytics,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset all attendance records for current user (preserves timetable and subjects)
 */
export const resetAttendance = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const delRes = await Attendance.deleteMany({ userId });
    await Subject.updateMany({ userId }, { $set: { attendedClasses: 0, totalConducted: 0 } });

    res.status(200).json({
      success: true,
      message: `Reset complete! Cleared ${delRes.deletedCount} attendance records while preserving your timetable.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * AI-Generated Formal Leave / On-Duty (OD) Application for College Authority
 */
export const generateLeaveApplication = async (req, res, next) => {
  try {
    const user = req.user;
    const {
      reasonType = 'Medical Leave',
      startDate,
      endDate,
      subjectNames = [],
      details = '',
      authorityTitle = 'The Head of Department',
    } = req.body;

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'AI key not configured on server.' });
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

    const prompt = `
You are an expert college academic administrative secretary.
Draft an official, highly professional, polished formal Leave / On-Duty (OD) Application for a college student to submit to their institution's authority.

STUDENT DETAILS:
- Name: ${user.name}
- Email: ${user.email}
- College: ${user.collegeName || 'College/University'}
- Course & Branch: ${user.course || 'Degree'} ${user.branch ? `(${user.branch})` : ''}
- Semester & Section: Semester ${user.semester || 1}, Section ${user.section || 'A'}
- Roll Number / Batch: ${user.batch || 'Batch 2026'}

APPLICATION PARTICULARS:
- Addressed To: ${authorityTitle}
- Subject Line: Application for ${reasonType} from ${startDate} to ${endDate || startDate}
- Missed / Affected Dates: ${startDate} to ${endDate || startDate}
- Subjects Affected: ${Array.isArray(subjectNames) && subjectNames.length > 0 ? subjectNames.join(', ') : 'All scheduled lectures and practical sessions'}
- Core Reason / Context: ${details || 'Unavoidable circumstances as per institutional leave guidelines.'}

FORMAT GUIDELINES:
1. Include Date, Authority Address block, Respectful Salutation, Clear Subject line.
2. Body Paragraph 1: State student identity and dates requested.
3. Body Paragraph 2: Explain reason respectfully, mentioning the attached documentation (e.g. medical certificate or event participation proof).
4. Body Paragraph 3: State willingness to cover missed academic syllabus and complete assignments.
5. Formal Closing: "Yours sincerely", Student Name, Roll/Reg details, and Signature line.
6. Return only the clean formatted letter in professional markdown text.
`;

    const result = await model.generateContent(prompt);
    const letter = result.response.text();

    res.status(200).json({
      success: true,
      letter,
      studentName: user.name,
      college: user.collegeName,
    });
  } catch (error) {
    next(error);
  }
};

