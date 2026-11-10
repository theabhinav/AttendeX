import Assignment from '../models/Assignment.js';

export const getAssignments = async (req, res, next) => {
  try {
    const { status, priority, subjectId, source } = req.query;
    const filter = { userId: req.user._id };

    if (status && status !== 'ALL') filter.status = status;
    if (priority && priority !== 'ALL') filter.priority = priority;
    if (subjectId && subjectId !== 'ALL') filter.subjectId = subjectId;
    if (source && source !== 'ALL') filter.source = source;

    const assignments = await Assignment.find(filter)
      .populate('subjectId', 'name code color')
      .sort({ dueDate: 1, priority: -1 });

    res.status(200).json({ success: true, assignments });
  } catch (error) {
    next(error);
  }
};

export const createAssignment = async (req, res, next) => {
  try {
    const { title, subjectId, dueDate, priority, description, submissionLink } = req.body;

    if (!title || !subjectId || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, subject, and due date are required.',
      });
    }

    const assignment = await Assignment.create({
      userId: req.user._id,
      title: title.trim(),
      subjectId,
      dueDate,
      priority: priority || 'Medium',
      description: (description || '').trim(),
      submissionLink: (submissionLink || '').trim(),
    });

    const populated = await assignment.populate('subjectId', 'name code color');
    res.status(201).json({ success: true, assignment: populated });
  } catch (error) {
    next(error);
  }
};

export const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findOne({ _id: id, userId: req.user._id });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const allowed = ['title', 'subjectId', 'dueDate', 'priority', 'status', 'description', 'submissionLink'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        assignment[key] = req.body[key];
      }
    }

    await assignment.save();
    const populated = await assignment.populate('subjectId', 'name code color');

    res.status(200).json({ success: true, assignment: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Assignment.deleteOne({ _id: id, userId: req.user._id });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    res.status(200).json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

