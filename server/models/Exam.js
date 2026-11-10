import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
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
    examType: {
      type: String,
      enum: ['Mid-Term', 'End-Term', 'Quiz', 'Lab Viva', 'Practical', 'Class Test'],
      default: 'Mid-Term',
    },
    examDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    startTime: {
      type: String, // HH:mm
      default: '09:00',
    },
    endTime: {
      type: String, // HH:mm
      default: '12:00',
    },
    room: {
      type: String,
      default: '',
      trim: true,
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    syllabusTopics: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Completed'],
      default: 'Upcoming',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Exam', examSchema);

