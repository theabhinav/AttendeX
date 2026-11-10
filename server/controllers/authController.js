import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'attendx_super_secret_jwt_key_2026_production',
    { expiresIn: '30d' }
  );
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      isOnboarded: false,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isOnboarded: user.isOnboarded,
        attendanceThreshold: user.attendanceThreshold,
        theme: user.theme,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        collegeName: user.collegeName,
        course: user.course,
        branch: user.branch,
        semester: user.semester,
        attendanceThreshold: user.attendanceThreshold,
        isOnboarded: user.isOnboarded,
        theme: user.theme,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { token: credentialToken, email: explicitEmail, name: explicitName } = req.body;

    // Decode mock or standard Google JWT payload
    let email = explicitEmail;
    let name = explicitName || 'Student';
    let googleId = 'google_' + Date.now();

    if (credentialToken) {
      try {
        const decoded = jwt.decode(credentialToken);
        if (decoded && decoded.email) {
          email = decoded.email;
          name = decoded.name || name;
          googleId = decoded.sub || googleId;
        }
      } catch (e) {
        // Fallback to explicit params
      }
    }

    if (!email) {
      email = `student_${Math.floor(Math.random() * 10000)}@attendx.app`;
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId,
        isOnboarded: false,
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        collegeName: user.collegeName,
        course: user.course,
        branch: user.branch,
        semester: user.semester,
        attendanceThreshold: user.attendanceThreshold,
        isOnboarded: user.isOnboarded,
        theme: user.theme,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, reset instructions have been simulated.',
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset token generated successfully.',
      resetToken, // for testing / development simplicity
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const {
      name,
      collegeName,
      universityName,
      collegeLocation,
      course,
      branch,
      academicYear,
      semester,
      section,
      batch,
      attendanceThreshold,
      reminderMinutes,
      classCompletionReminder,
      notificationsEnabled,
      theme,
    } = req.body;

    if (name) user.name = name.trim();
    if (collegeName !== undefined) user.collegeName = collegeName.trim();
    if (universityName !== undefined) user.universityName = universityName.trim();
    if (collegeLocation !== undefined) user.collegeLocation = collegeLocation.trim();
    if (course !== undefined) user.course = course.trim();
    if (branch !== undefined) user.branch = branch.trim();
    if (academicYear !== undefined) user.academicYear = academicYear.trim();
    if (semester !== undefined) user.semester = Number(semester);
    if (section !== undefined) user.section = section.trim();
    if (batch !== undefined) user.batch = batch.trim();
    if (attendanceThreshold !== undefined) user.attendanceThreshold = Number(attendanceThreshold);
    if (reminderMinutes !== undefined) user.reminderMinutes = Number(reminderMinutes);
    if (classCompletionReminder !== undefined) user.classCompletionReminder = Boolean(classCompletionReminder);
    if (notificationsEnabled !== undefined) user.notificationsEnabled = Boolean(notificationsEnabled);
    if (theme !== undefined) user.theme = theme;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        collegeName: user.collegeName,
        universityName: user.universityName,
        course: user.course,
        branch: user.branch,
        academicYear: user.academicYear,
        semester: user.semester,
        section: user.section,
        batch: user.batch,
        attendanceThreshold: user.attendanceThreshold,
        reminderMinutes: user.reminderMinutes,
        classCompletionReminder: user.classCompletionReminder,
        notificationsEnabled: user.notificationsEnabled,
        theme: user.theme,
        isOnboarded: user.isOnboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.passwordHash) {
      return res.status(400).json({ success: false, message: 'Cannot change password for social login.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete account and all associated user data
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await Promise.all([
      User.deleteOne({ _id: userId }),
      import('../models/Attendance.js').then((m) => m.default.deleteMany({ userId })),
      import('../models/Subject.js').then((m) => m.default.deleteMany({ userId })),
      import('../models/Timetable.js').then((m) => m.default.deleteMany({ userId })),
      import('../models/Notification.js').then((m) => m.default.deleteMany({ userId })),
      import('../models/PushSubscription.js').then((m) => m.default.deleteMany({ userId })),
    ]);

    res.status(200).json({ success: true, message: 'Account and all data deleted permanently.' });
  } catch (error) {
    next(error);
  }
};

