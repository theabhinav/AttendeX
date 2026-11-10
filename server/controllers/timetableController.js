import Timetable from '../models/Timetable.js';
import Subject from '../models/Subject.js';
import User from '../models/User.js';
import { processTimetableDocument, parseTimetableFromRawText } from '../services/aiScannerService.js';

export const getTimetable = async (req, res, next) => {
  try {
    const { day, subjectId } = req.query;
    const filter = { userId: req.user._id, status: { $ne: 'Cancelled' } };

    if (day) filter.day = day;
    if (subjectId) filter.subjectId = subjectId;

    const timetable = await Timetable.find(filter)
      .populate('subjectId')
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({ success: true, timetable });
  } catch (error) {
    next(error);
  }
};

export const createClass = async (req, res, next) => {
  try {
    const {
      subjectId,
      day,
      startTime,
      endTime,
      room,
      faculty,
      classType,
      isTemporary,
      temporaryDate,
    } = req.body;

    const subject = await Subject.findOne({ _id: subjectId, userId: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const newClass = await Timetable.create({
      userId: req.user._id,
      subjectId,
      day,
      startTime,
      endTime,
      room: room || '',
      faculty: faculty || subject.faculty || '',
      classType: classType || 'Lecture',
      isTemporary: !!isTemporary,
      temporaryDate: temporaryDate || null,
    });

    const populated = await newClass.populate('subjectId');
    res.status(201).json({ success: true, class: populated });
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      day,
      startTime,
      endTime,
      room,
      faculty,
      classType,
      status,
    } = req.body;

    const classItem = await Timetable.findOne({ _id: id, userId: req.user._id });
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Class slot not found.' });
    }

    if (day) classItem.day = day;
    if (startTime) classItem.startTime = startTime;
    if (endTime) classItem.endTime = endTime;
    if (room !== undefined) classItem.room = room;
    if (faculty !== undefined) classItem.faculty = faculty;
    if (classType) classItem.classType = classType;
    if (status) classItem.status = status;

    await classItem.save();
    const populated = await classItem.populate('subjectId');

    res.status(200).json({ success: true, class: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classItem = await Timetable.findOne({ _id: id, userId: req.user._id });

    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Class slot not found.' });
    }

    await Timetable.deleteOne({ _id: id });
    res.status(200).json({ success: true, message: 'Class slot removed successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * AI Timetable Scanner: Processes image or PDF and returns structured preview
 */
export const scanTimetable = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a timetable image (JPG, PNG) or PDF document.',
      });
    }

    const studentGroup = (req.body?.studentGroup || req.query?.studentGroup || '').trim();
    const extractedData = await processTimetableDocument(req.file, studentGroup);

    res.status(200).json({
      success: true,
      message: 'Timetable extracted successfully. Please review and confirm below.',
      data: extractedData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Parse Timetable from pasted text or ERP string
 */
export const parseTimetableText = async (req, res, next) => {
  try {
    const { text, studentGroup } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide timetable text to parse.',
      });
    }

    const extractedData = parseTimetableFromRawText(text, studentGroup || '');
    extractedData.extractionEngine = 'Text & Table Schedule Parser';

    res.status(200).json({
      success: true,
      message: 'Timetable text parsed successfully. Please verify below.',
      data: extractedData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm & Activate AI Extracted Timetable
 */
export const confirmTimetable = async (req, res, next) => {
  try {
    const { subjects, replaceExisting = true } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No subjects provided to confirm.',
      });
    }

    const userId = req.user._id;

    if (replaceExisting) {
      // Clear previous timetable entries for this user
      await Timetable.deleteMany({ userId });
    }

    const createdClasses = [];
    const colorPalette = [
      '#4F46E5', '#2563EB', '#0D9488', '#059669',
      '#D97706', '#E11D48', '#7C3AED', '#DB2777'
    ];

    let colorIdx = 0;

    for (const sub of subjects) {
      const subName = (sub.name || 'Untitled Subject').trim();
      const code = (sub.code || '').trim().toUpperCase();
      const faculty = (sub.faculty || '').trim();

      // Find or create subject
      let subjectDoc = await Subject.findOne({ userId, name: subName });
      if (!subjectDoc) {
        subjectDoc = await Subject.create({
          userId,
          name: subName,
          code,
          faculty,
          color: colorPalette[colorIdx % colorPalette.length],
        });
        colorIdx++;
      } else {
        if (code) subjectDoc.code = code;
        if (faculty) subjectDoc.faculty = faculty;
        await subjectDoc.save();
      }

      // Create class slots
      if (Array.isArray(sub.classes)) {
        for (const cls of sub.classes) {
          const newSlot = await Timetable.create({
            userId,
            subjectId: subjectDoc._id,
            day: cls.day,
            startTime: cls.startTime,
            endTime: cls.endTime,
            room: cls.room || '',
            faculty: cls.faculty || faculty,
            classType: cls.type || 'Lecture',
          });
          createdClasses.push(newSlot);
        }
      }
    }

    const activeTimetable = await Timetable.find({ userId, status: 'Active' })
      .populate('subjectId')
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      message: `Successfully confirmed and activated timetable with ${createdClasses.length} class slots!`,
      timetable: activeTimetable,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Import timetable from JSON
 */
export const importTimetable = async (req, res, next) => {
  try {
    const { timetableJson, replaceExisting = true } = req.body;
    let data = timetableJson;

    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    if (!data || !Array.isArray(data.subjects)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timetable JSON format. Expected { subjects: [...] }',
      });
    }

    // Reuse confirm logic
    req.body.subjects = data.subjects;
    req.body.replaceExisting = replaceExisting;
    return confirmTimetable(req, res, next);
  } catch (error) {
    next(error);
  }
};

/**
 * Export full timetable to JSON
 */
export const exportTimetable = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const subjects = await Subject.find({ userId });
    const timetable = await Timetable.find({ userId, status: 'Active' });

    const exportData = {
      exportDate: new Date().toISOString(),
      student: {
        college: req.user.collegeName,
        course: req.user.course,
        branch: req.user.branch,
        semester: req.user.semester,
      },
      subjects: subjects.map((sub) => {
        const classes = timetable
          .filter((t) => t.subjectId.toString() === sub._id.toString())
          .map((t) => ({
            day: t.day,
            startTime: t.startTime,
            endTime: t.endTime,
            room: t.room,
            type: t.classType,
            faculty: t.faculty || sub.faculty,
          }));

        return {
          name: sub.name,
          code: sub.code,
          faculty: sub.faculty,
          classes,
        };
      }),
    };

    res.status(200).json({ success: true, data: exportData });
  } catch (error) {
    next(error);
  }
};

/**
 * Add temporary date-specific class or cancellation
 */
export const addDateException = async (req, res, next) => {
  try {
    const { classId, date, action, newStartTime, newEndTime, newRoom } = req.body;

    if (action === 'CANCEL') {
      // Mark as cancelled for this specific date
      const slot = await Timetable.findOne({ _id: classId, userId: req.user._id });
      if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

      // Create a temporary override slot marking it cancelled
      const override = await Timetable.create({
        userId: req.user._id,
        subjectId: slot.subjectId,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.room,
        isTemporary: true,
        temporaryDate: date,
        status: 'Cancelled',
      });

      return res.status(200).json({ success: true, message: `Class cancelled for ${date}`, override });
    }

    if (action === 'RESCHEDULE') {
      const slot = await Timetable.findOne({ _id: classId, userId: req.user._id });
      if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

      const override = await Timetable.create({
        userId: req.user._id,
        subjectId: slot.subjectId,
        day: slot.day,
        startTime: newStartTime || slot.startTime,
        endTime: newEndTime || slot.endTime,
        room: newRoom || slot.room,
        isTemporary: true,
        temporaryDate: date,
        status: 'Active',
      });

      return res.status(200).json({ success: true, message: `Class rescheduled for ${date}`, override });
    }

    res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Timetable as Standard iCalendar (.ics) for Google & Apple Calendar Sync
 */
export const exportICS = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const timetable = await Timetable.find({ userId, status: 'Active' }).populate('subjectId');

    const dayToIcalDay = {
      Monday: 'MO',
      Tuesday: 'TU',
      Wednesday: 'WE',
      Thursday: 'TH',
      Friday: 'FR',
      Saturday: 'SA',
      Sunday: 'SU',
    };

    const dayToOffset = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };

    // Reference week start (e.g. Next Monday)
    const baseDate = new Date();
    const currentDayIdx = baseDate.getDay() === 0 ? 7 : baseDate.getDay();
    const mondayDiff = 1 - currentDayIdx;
    baseDate.setDate(baseDate.getDate() + mondayDiff);

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AttendX//Smart Academic Timetable//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:AttendX College Timetable',
      'X-WR-TIMEZONE:Asia/Kolkata',
    ];

    timetable.forEach((slot, idx) => {
      const dayOffset = (dayToOffset[slot.day] || 1) - 1;
      const eventDate = new Date(baseDate);
      eventDate.setDate(baseDate.getDate() + dayOffset);

      const [startH, startM] = (slot.startTime || '09:00').split(':').map(Number);
      const [endH, endM] = (slot.endTime || '10:00').split(':').map(Number);

      const yyyy = eventDate.getFullYear();
      const mm = String(eventDate.getMonth() + 1).padStart(2, '0');
      const dd = String(eventDate.getDate()).padStart(2, '0');

      const dtStart = `${yyyy}${mm}${dd}T${String(startH).padStart(2, '0')}${String(startM).padStart(2, '0')}00`;
      const dtEnd = `${yyyy}${mm}${dd}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;

      const subName = slot.subjectId?.name || 'Class';
      const code = slot.subjectId?.code ? ` (${slot.subjectId.code})` : '';
      const faculty = slot.faculty || slot.subjectId?.faculty || 'Faculty';
      const icalDay = dayToIcalDay[slot.day] || 'MO';

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:attendx-${slot._id}-${idx}@attendx.app`);
      icsContent.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
      icsContent.push(`DTSTART:${dtStart}`);
      icsContent.push(`DTEND:${dtEnd}`);
      icsContent.push(`RRULE:FREQ=WEEKLY;BYDAY=${icalDay}`);
      icsContent.push(`SUMMARY:${subName}${code}`);
      icsContent.push(`LOCATION:${slot.room || 'Campus Room'}`);
      icsContent.push(`DESCRIPTION:${slot.classType || 'Lecture'} conducted by ${faculty}. Tracked via AttendX.`);
      icsContent.push('STATUS:CONFIRMED');
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    const result = icsContent.join('\r\n');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="attendx_timetable.ics"');
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Automatically discover if a classmate from the same College & Branch already uploaded a timetable
 */
export const getClassmateSchedule = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user.collegeName || !user.branch) {
      return res.status(200).json({
        success: true,
        found: false,
        message: 'Add college and branch in your profile to discover class timetables.',
      });
    }

    // Search for other students in the same college, course, branch, and semester
    const collegeRegex = new RegExp(`^${user.collegeName.trim()}$`, 'i');
    const branchRegex = new RegExp(`^${user.branch.trim()}$`, 'i');

    const potentialClassmates = await User.find({
      _id: { $ne: user._id },
      collegeName: { $regex: collegeRegex },
      branch: { $regex: branchRegex },
      semester: user.semester || 1,
    }).select('_id name section course batch');

    if (!potentialClassmates || potentialClassmates.length === 0) {
      return res.status(200).json({ success: true, found: false });
    }

    // Find the classmate who has the most comprehensive timetable
    let bestClassmate = null;
    let bestSlots = [];

    for (const classmate of potentialClassmates) {
      const slots = await Timetable.find({
        userId: classmate._id,
        status: { $ne: 'Cancelled' },
      }).populate('subjectId');

      if (slots && slots.length > bestSlots.length) {
        bestSlots = slots;
        bestClassmate = classmate;
      }
    }

    if (!bestClassmate || bestSlots.length === 0) {
      return res.status(200).json({ success: true, found: false });
    }

    // Extract unique subjects
    const subjectsMap = new Map();
    bestSlots.forEach((slot) => {
      if (slot.subjectId && !subjectsMap.has(slot.subjectId._id.toString())) {
        subjectsMap.set(slot.subjectId._id.toString(), {
          _id: slot.subjectId._id,
          name: slot.subjectId.name,
          code: slot.subjectId.code,
          faculty: slot.subjectId.faculty || slot.faculty,
          color: slot.subjectId.color,
          credits: slot.subjectId.credits,
        });
      }
    });

    const uniqueSubjects = Array.from(subjectsMap.values());

    res.status(200).json({
      success: true,
      found: true,
      collegeName: user.collegeName,
      branch: user.branch,
      semester: user.semester,
      contributorName: bestClassmate.name,
      contributorSection: bestClassmate.section,
      totalClasses: bestSlots.length,
      subjectsCount: uniqueSubjects.length,
      subjects: uniqueSubjects,
      sourceUserId: bestClassmate._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 1-Click Import Classmate's Schedule into Current Student's Account
 */
export const importClassmateSchedule = async (req, res, next) => {
  try {
    const { sourceUserId } = req.body;
    if (!sourceUserId) {
      return res.status(400).json({ success: false, message: 'Source user ID is required.' });
    }

    const sourceClassmate = await User.findById(sourceUserId);
    if (!sourceClassmate) {
      return res.status(404).json({ success: false, message: 'Classmate schedule not found.' });
    }

    // Fetch source subjects and timetable
    const sourceSubjects = await Subject.find({ userId: sourceUserId });
    const sourceSlots = await Timetable.find({
      userId: sourceUserId,
      status: { $ne: 'Cancelled' },
    });

    if (sourceSlots.length === 0) {
      return res.status(400).json({ success: false, message: 'No classes found in source schedule.' });
    }

    // Map source subjects to current student's subjects
    const subjectIdMapping = new Map();

    for (const srcSub of sourceSubjects) {
      // Check if current user already has this subject
      let existingSub = await Subject.findOne({
        userId: req.user._id,
        $or: [
          { name: { $regex: new RegExp(`^${srcSub.name.trim()}$`, 'i') } },
          ...(srcSub.code ? [{ code: { $regex: new RegExp(`^${srcSub.code.trim()}$`, 'i') } }] : []),
        ],
      });

      if (!existingSub) {
        existingSub = await Subject.create({
          userId: req.user._id,
          name: srcSub.name,
          code: srcSub.code,
          faculty: srcSub.faculty,
          credits: srcSub.credits || 3,
          color: srcSub.color,
          targetAttendance: req.user.attendanceThreshold || 75,
        });
      }

      subjectIdMapping.set(srcSub._id.toString(), existingSub._id);
    }

    const newSlots = [];
    for (const srcSlot of sourceSlots) {
      const mappedSubId = subjectIdMapping.get(srcSlot.subjectId.toString());
      if (mappedSubId) {
        newSlots.push({
          userId: req.user._id,
          subjectId: mappedSubId,
          day: srcSlot.day,
          startTime: srcSlot.startTime,
          endTime: srcSlot.endTime,
          room: srcSlot.room,
          faculty: srcSlot.faculty,
          classType: srcSlot.classType,
        });
      }
    }

    const inserted = await Timetable.insertMany(newSlots);

    res.status(200).json({
      success: true,
      message: `Successfully imported ${inserted.length} weekly classes from ${sourceClassmate.name}'s schedule!`,
      count: inserted.length,
      subjectsCount: subjectIdMapping.size,
    });
  } catch (error) {
    next(error);
  }
};

