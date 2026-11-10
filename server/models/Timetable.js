import mongoose from 'mongoose';
import { DAYS, CLASS_TYPES } from '../config/constants.js';

const timetableSchema = new mongoose.Schema(
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
    },
    day: {
      type: String,
      required: true,
      enum: DAYS,
      index: true,
    },
    startTime: {
      type: String,
      required: true, // format 'HH:mm'
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true, // format 'HH:mm'
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    room: {
      type: String,
      trim: true,
      default: '',
    },
    faculty: {
      type: String,
      trim: true,
      default: '',
    },
    classType: {
      type: String,
      enum: CLASS_TYPES,
      default: 'Lecture',
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveUntil: {
      type: Date,
      default: null,
    },
    // Temporary overrides / extra classes
    isTemporary: {
      type: Boolean,
      default: false,
    },
    temporaryDate: {
      type: String, // 'YYYY-MM-DD'
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Cancelled', 'Rescheduled'],
      default: 'Active',
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

timetableSchema.index({ userId: 1, day: 1, startTime: 1 });

export default mongoose.model('Timetable', timetableSchema);

