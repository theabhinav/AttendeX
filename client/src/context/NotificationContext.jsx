import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { subscribeUserToPush } from '../utils/webPush';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [activePrompt, setActivePrompt] = useState(null); // When a class ends, prompt to mark attendance

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationService.getNotifications({ limit: 20 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);

      // Check if there is an unread CLASS_COMPLETED notification to prompt
      const classCompletedNotif = data.notifications?.find(
        (n) => n.type === 'CLASS_COMPLETED' && !n.readStatus && n.data?.classId
      );
      if (classCompletedNotif && !activePrompt) {
        setActivePrompt(classCompletedNotif);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err?.message);
    }
  }, [isAuthenticated, activePrompt]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 45000); // 45s refresh
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readStatus: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (activePrompt?._id === id) {
        setActivePrompt(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
      setUnreadCount(0);
      setActivePrompt(null);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const enablePushNotifications = async () => {
    try {
      const { publicKey } = await notificationService.getVapidPublicKey();
      if (!publicKey) {
        toast.error('Web Push is not configured on the server');
        return false;
      }
      const subscription = await subscribeUserToPush(publicKey);
      if (subscription) {
        await notificationService.subscribeWebPush(subscription);
        setPushSubscribed(true);
        toast.success('Push notifications enabled successfully!');
        return true;
      }
    } catch (err) {
      console.error('Push subscription failed:', err);
      toast.error(err.message || 'Could not enable push notifications');
      return false;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        pushSubscribed,
        activePrompt,
        setActivePrompt,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        enablePushNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
