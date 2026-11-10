import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    submissionLink: {
      type: String,
      default: '',
      trim: true,
    },
    source: {
      type: String,
      enum: ['manual', 'google_classroom'],
      default: 'manual',
    },
    googleClassroomId: {
      type: String,
      sparse: true,
      index: true,
    },
    googleCourseId: {
      type: String,
      default: '',
    },
    googleCourseName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Assignment', assignmentSchema);

