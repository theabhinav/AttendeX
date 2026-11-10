import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Timetable from '../models/Timetable.js';
import Attendance from '../models/Attendance.js';
import Notification from '../models/Notification.js';
import PushSubscription from '../models/PushSubscription.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name',
      'profilePicture',
      'collegeName',
      'universityName',
      'collegeLocation',
      'course',
      'branch',
      'academicYear',
      'semester',
      'section',
      'batch',
      'attendanceThreshold',
      'targetCGPA',
      'currentCGPA',
      'reminderMinutes',
      'classCompletionReminder',
      'notificationsEnabled',
      'theme',
      'isOnboarded',
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new passwords.',
      });
    }

    const user = await User.findById(req.user._id);

    if (user.passwordHash) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match.',
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Clean up all related user data
    await Promise.all([
      User.deleteOne({ _id: userId }),
      Subject.deleteMany({ userId }),
      Timetable.deleteMany({ userId }),
      Attendance.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      PushSubscription.deleteMany({ userId }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Your account and all associated attendance data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

