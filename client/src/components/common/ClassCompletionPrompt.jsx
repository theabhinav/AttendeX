import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Check, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { attendanceService } from '../../services/attendanceService';
import { formatDateISO } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const ClassCompletionPrompt = () => {
  const { activePrompt, setActivePrompt, markAsRead } = useNotifications();
  const [loading, setLoading] = useState(false);

  if (!activePrompt) return null;

  const { title, message, data } = activePrompt;
  const subjectName = data?.subjectName || 'Class';
  const subjectId = data?.subjectId;
  const classId = data?.classId;

  const handleMark = async (status) => {
    try {
      setLoading(true);
      await attendanceService.markAttendance({
        subjectId,
        scheduledClassId: classId,
        date: formatDateISO(),
        status,
        notes: `Marked via post-class prompt as ${status}`,
      });

      toast.success(
        status === 'Present'
          ? `Marked Present for ${subjectName}!`
          : status === 'Absent'
          ? `Marked Absent for ${subjectName}.`
          : `Marked as Pending for ${subjectName}.`
      );

      await markAsRead(activePrompt._id);
      setActivePrompt(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    await markAsRead(activePrompt._id);
    setActivePrompt(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full px-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white dark:bg-dark-card border border-brand-200 dark:border-brand-900 rounded-2xl p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                Class Ended
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {title || 'Lecture Completed'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {message || `Did you attend today's ${subjectName} class?`}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons: Present, Absent, Pending */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            disabled={loading}
            onClick={() => handleMark('Present')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Present</span>
          </button>
          <button
            disabled={loading}
            onClick={() => handleMark('Absent')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Absent</span>
          </button>
          <button
            disabled={loading}
            onClick={() => handleMark('Pending')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Later</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassCompletionPrompt;
