import Notification from '../models/Notification.js';
import PushSubscription from '../models/PushSubscription.js';
import User from '../models/User.js';
import { getVapidPublicKey } from '../services/notificationService.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { limit = 30 } = req.query;
    const userId = req.user._id;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({
      userId,
      readStatus: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.updateOne(
      { _id: id, userId: req.user._id },
      { $set: { readStatus: true } }
    );
    res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, readStatus: false },
      { $set: { readStatus: true } }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

export const getVapidKey = (req, res) => {
  const publicKey = getVapidPublicKey();
  res.status(200).json({ success: true, publicKey });
};

export const subscribeWebPush = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys) {
      return res.status(400).json({ success: false, message: 'Invalid subscription object.' });
    }

    await PushSubscription.findOneAndUpdate(
      { userId: req.user._id, endpoint },
      { userId: req.user._id, endpoint, keys },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'Push subscription registered.' });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const { reminderMinutes, classCompletionReminder, notificationsEnabled } = req.body;

    const updates = {};
    if (reminderMinutes !== undefined) updates.reminderMinutes = reminderMinutes;
    if (classCompletionReminder !== undefined) updates.classCompletionReminder = classCompletionReminder;
    if (notificationsEnabled !== undefined) updates.notificationsEnabled = notificationsEnabled;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-passwordHash');

    res.status(200).json({ success: true, message: 'Notification preferences updated.', user });
  } catch (error) {
    next(error);
  }
};

