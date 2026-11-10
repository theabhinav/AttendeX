import mongoose from 'mongoose';
import { ATTENDANCE_STATUS } from '../config/constants.js';

const changeHistorySchema = new mongoose.Schema(
  {
    previousStatus: {
      type: String,
      enum: ATTENDANCE_STATUS,
    },
    newStatus: {
      type: String,
      enum: ATTENDANCE_STATUS,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    scheduledClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable',
      default: null,
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUS,
      required: true,
      default: 'Present',
    },
    notes: {
      type: String,
      default: '',
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    changeHistory: [changeHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate marks for same scheduled slot on same day
attendanceSchema.index(
  { userId: 1, scheduledClassId: 1, date: 1 },
  { unique: true, partialFilterExpression: { scheduledClassId: { $type: 'objectId' } } }
);

export default mongoose.model('Attendance', attendanceSchema);

