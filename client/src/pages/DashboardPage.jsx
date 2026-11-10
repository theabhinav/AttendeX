import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceService } from '../services/attendanceService';
import OverviewCards from '../components/dashboard/OverviewCards';
import UpcomingClassCountdown from '../components/dashboard/UpcomingClassCountdown';
import AttendanceWarnings from '../components/dashboard/AttendanceWarnings';
import TodayTimetable from '../components/dashboard/TodayTimetable';
import SubjectAttendanceList from '../components/dashboard/SubjectAttendanceList';
import TodayTodoWidget from '../components/dashboard/TodayTodoWidget';
import Button from '../components/common/Button';
import VoiceAssistantModal from '../components/voice/VoiceAssistantModal';
import { Sparkles, Calendar, Plus, RefreshCw, Upload, Bot, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const res = await attendanceService.getTodayDashboard();
      setData(res.today);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Greeting based on current time
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  const analytics = data?.analytics || {};
  const classes = data?.classes || [];
  const upcomingClass = data?.upcomingClass || null;
  const subjects = analytics.subjects || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {user?.collegeName ? `${user.collegeName} • ` : ''}
            {user?.course ? `${user.course} ` : ''}
            {user?.branch ? `(${user.branch})` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-card transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link to="/tasks">
            <Button size="sm" variant="secondary" leftIcon={CheckSquare}>
              Tasks
            </Button>
          </Link>
          <Link to="/chat">
            <Button size="sm" variant="secondary" leftIcon={Bot}>
              AttendX AI
            </Button>
          </Link>
          <Link to="/timetable">
            <Button size="sm" variant="primary" leftIcon={Upload}>
              Scan Timetable
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Attendance Overview Cards */}
      <OverviewCards analytics={analytics} />

      {/* Low Attendance Warnings (if any) */}
      <AttendanceWarnings
        subjects={subjects}
        threshold={user?.attendanceThreshold || 75}
      />

      {/* Next Class with Live Countdown Timer */}
      <UpcomingClassCountdown upcomingClass={upcomingClass} />

      {/* Today's Schedule & Action Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TodayTimetable classes={classes} onAttendanceMarked={() => loadDashboard(true)} />
        </div>
        <div>
          <TodayTodoWidget onOpenVoiceAssistant={() => setVoiceModalOpen(true)} />
        </div>
      </div>

      {/* Subject-wise Attendance Cards */}
      <SubjectAttendanceList
        subjects={subjects}
        threshold={user?.attendanceThreshold || 75}
      />

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onTaskActionSuccess={() => loadDashboard(true)}
      />
    </div>
  );
};

export default DashboardPage;
