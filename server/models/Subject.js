import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: '',
    },
    faculty: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      default: '#4F46E5', // indigo default
    },
    targetThreshold: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

subjectSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('Subject', subjectSchema);

