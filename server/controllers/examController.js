import Exam from '../models/Exam.js';

export const getExams = async (req, res, next) => {
  try {
    const { status, subjectId } = req.query;
    const filter = { userId: req.user._id };

    if (status && status !== 'ALL') filter.status = status;
    if (subjectId && subjectId !== 'ALL') filter.subjectId = subjectId;

    const exams = await Exam.find(filter)
      .populate('subjectId', 'name code color')
      .sort({ examDate: 1, startTime: 1 });

    res.status(200).json({ success: true, exams });
  } catch (error) {
    next(error);
  }
};

export const createExam = async (req, res, next) => {
  try {
    const {
      title,
      subjectId,
      examType,
      examDate,
      startTime,
      endTime,
      room,
      totalMarks,
      syllabusTopics,
    } = req.body;

    if (!title || !subjectId || !examDate) {
      return res.status(400).json({
        success: false,
        message: 'Exam title, subject, and date are required.',
      });
    }

    const exam = await Exam.create({
      userId: req.user._id,
      title: title.trim(),
      subjectId,
      examType: examType || 'Mid-Term',
      examDate,
      startTime: startTime || '09:00',
      endTime: endTime || '12:00',
      room: (room || '').trim(),
      totalMarks: Number(totalMarks) || 100,
      syllabusTopics: Array.isArray(syllabusTopics) ? syllabusTopics : [],
    });

    const populated = await exam.populate('subjectId', 'name code color');
    res.status(201).json({ success: true, exam: populated });
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findOne({ _id: id, userId: req.user._id });

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam entry not found.' });
    }

    const allowed = [
      'title',
      'subjectId',
      'examType',
      'examDate',
      'startTime',
      'endTime',
      'room',
      'totalMarks',
      'syllabusTopics',
      'status',
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        exam[key] = req.body[key];
      }
    }

    await exam.save();
    const populated = await exam.populate('subjectId', 'name code color');

    res.status(200).json({ success: true, exam: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Exam.deleteOne({ _id: id, userId: req.user._id });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Exam entry not found.' });
    }

    res.status(200).json({ success: true, message: 'Exam entry removed successfully.' });
  } catch (error) {
    next(error);
  }
};

