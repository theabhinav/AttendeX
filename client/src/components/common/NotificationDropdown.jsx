import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock, AlertTriangle, Calendar, BellRing } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import Button from './Button';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    enablePushNotifications,
    pushSubscribed,
  } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'CLASS_REMINDER':
        return <Clock className="w-4 h-4 text-brand-500" />;
      case 'CLASS_COMPLETED':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'LOW_ATTENDANCE':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-card border border-transparent hover:border-slate-200 dark:hover:border-dark-border transition-all"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span className="text-xs bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Web Push Prompt if not subscribed */}
          {!pushSubscribed && (
            <div className="px-4 py-2.5 bg-brand-50/70 dark:bg-brand-950/40 border-b border-brand-100 dark:border-brand-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Enable device push alerts
                </span>
              </div>
              <Button size="xs" variant="primary" onClick={enablePushNotifications}>
                Enable
              </Button>
            </div>
          )}

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-border">
            {notifications.length === 0 ? (
              <div className="py-8 text-center px-4">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No notifications yet
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  We'll alert you before classes and when it's time to mark attendance.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.readStatus && markAsRead(notif._id)}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 cursor-pointer ${
                    !notif.readStatus ? 'bg-slate-50/60 dark:bg-slate-800/30' : ''
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {notif.title}
                      </p>
                      {!notif.readStatus && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                      {new Date(notif.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
