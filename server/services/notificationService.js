import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import Notification from '../models/Notification.js';

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

// If VAPID keys are missing, generate valid keys automatically for seamless out-of-the-box operation
if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  try {
    const generated = webpush.generateVAPIDKeys();
    vapidKeys = generated;
    console.log('[Web Push] Auto-generated dynamic VAPID keys for session.');
  } catch (e) {
    console.warn('[Web Push] Could not auto-generate VAPID keys:', e.message);
  }
}

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@attendx.app',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  } catch (err) {
    console.warn('[Web Push] setVapidDetails warning:', err.message);
  }
}

export const getVapidPublicKey = () => vapidKeys.publicKey || '';

/**
 * Sends a notification: persists in database and sends Web Push if subscribed
 */
export const sendNotification = async ({
  userId,
  title,
  message,
  type = 'SYSTEM',
  data = {},
}) => {
  try {
    // 1. Create DB notification
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      data,
      scheduledAt: new Date(),
    });

    // 2. Fetch user's push subscriptions
    const subscriptions = await PushSubscription.find({ userId });

    if (subscriptions.length > 0 && vapidKeys.publicKey) {
      const payload = JSON.stringify({
        title,
        body: message,
        type,
        data,
        notificationId: notification._id,
      });

      const pushPromises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payload
          );
        } catch (err) {
          // If subscription expired or gone (410/404), remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await PushSubscription.deleteOne({ _id: sub._id });
          }
        }
      });

      await Promise.allSettled(pushPromises);
      notification.deliveredAt = new Date();
      await notification.save();
    }

    return notification;
  } catch (error) {
    console.error('[Notification Service] Error sending notification:', error);
    return null;
  }
};

