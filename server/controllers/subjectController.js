import Subject from '../models/Subject.js';
import Timetable from '../models/Timetable.js';
import Attendance from '../models/Attendance.js';

export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ userId: req.user._id }).sort({ name: 1 });
    res.status(200).json({ success: true, subjects });
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const { name, code, faculty, color, targetThreshold } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject name is required.' });
    }

    const existing = await Subject.findOne({
      userId: req.user._id,
      name: name.trim(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A subject with this name already exists in your account.',
      });
    }

    const subject = await Subject.create({
      userId: req.user._id,
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : '',
      faculty: faculty ? faculty.trim() : '',
      color: color || '#4F46E5',
      targetThreshold: targetThreshold || null,
    });

    res.status(201).json({ success: true, subject });
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, faculty, color, targetThreshold } = req.body;

    const subject = await Subject.findOne({ _id: id, userId: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    if (name) subject.name = name.trim();
    if (code !== undefined) subject.code = code.trim().toUpperCase();
    if (faculty !== undefined) subject.faculty = faculty.trim();
    if (color !== undefined) subject.color = color;
    if (targetThreshold !== undefined) subject.targetThreshold = targetThreshold;

    await subject.save();

    res.status(200).json({ success: true, subject });
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findOne({ _id: id, userId: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    await Subject.deleteOne({ _id: id });
    await Timetable.deleteMany({ subjectId: id });
    await Attendance.deleteMany({ subjectId: id });

    res.status(200).json({
      success: true,
      message: 'Subject and associated timetable entries deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

