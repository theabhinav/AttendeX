import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    // College Details
    collegeName: {
      type: String,
      trim: true,
      default: '',
    },
    universityName: {
      type: String,
      trim: true,
      default: '',
    },
    collegeLocation: {
      type: String,
      trim: true,
      default: '',
    },
    course: {
      type: String,
      trim: true,
      default: '',
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    academicYear: {
      type: String,
      default: '',
    },
    semester: {
      type: Number,
      default: 1,
    },
    section: {
      type: String,
      trim: true,
      default: '',
    },
    batch: {
      type: String,
      trim: true,
      default: '',
    },
    // Attendance & Academic Target Preferences
    attendanceThreshold: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },
    targetCGPA: {
      type: Number,
      default: 8.5,
      min: 0,
      max: 10,
    },
    currentCGPA: {
      type: Number,
      default: 7.5,
      min: 0,
      max: 10,
    },
    reminderMinutes: {
      type: Number,
      default: 15,
      enum: [0, 5, 10, 15, 30],
    },
    classCompletionReminder: {
      type: Boolean,
      default: true,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    googleClassroom: {
      isConnected: {
        type: Boolean,
        default: false,
      },
      email: {
        type: String,
        default: '',
      },
      accessToken: {
        type: String,
        default: '',
      },
      refreshToken: {
        type: String,
        default: '',
      },
      expiryDate: {
        type: Number,
        default: null,
      },
      lastSyncedAt: {
        type: Date,
        default: null,
      },
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('User', userSchema);

