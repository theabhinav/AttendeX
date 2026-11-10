import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      enum: [
        'Academics',
        'Assignments',
        'Coding / DSA',
        'Projects',
        'Exams',
        'Personal',
        'Other',
      ],
      default: 'Academics',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
      index: true,
    },
    dueDate: {
      type: String, // YYYY-MM-DD
      default: null,
      index: true,
    },
    dueTime: {
      type: String, // HH:mm format (24h) e.g. "19:00"
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    reminderEnabled: {
      type: Boolean,
      default: true,
    },
    reminderMinutes: {
      type: Number,
      default: 30, // 30 minutes before dueTime
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    source: {
      type: String,
      enum: ['manual', 'voice_assistant', 'ai_suggested'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for optimal querying by user, status, and deadline
taskSchema.index({ userId: 1, completed: 1, dueDate: 1 });
taskSchema.index({ userId: 1, category: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;

