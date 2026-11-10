import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatTime12h, formatDateISO } from '../../utils/dateUtils';
import { attendanceService } from '../../services/attendanceService';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const TodayTimetable = ({ classes = [], onAttendanceMarked }) => {
  const [loadingId, setLoadingId] = useState(null);

  const handleMark = async (classItem, status) => {
    try {
      setLoadingId(`${classItem._id}-${status}`);
      await attendanceService.markAttendance({
        subjectId: classItem.subject?._id,
        scheduledClassId: classItem._id,
        date: formatDateISO(),
        status,
        notes: `Marked directly from Today's Timetable`,
      });

      toast.success(`Marked as ${status} for ${classItem.subject?.name}`);
      if (onAttendanceMarked) onAttendanceMarked();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update attendance');
    } finally {
      setLoadingId(null);
    }
  };

  const getTimeStatusBadge = (timeStatus) => {
    switch (timeStatus) {
      case 'ongoing':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Ongoing
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Completed
          </span>
        );
      case 'upcoming':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
            Upcoming
          </span>
        );
    }
  };

  const getAttendanceBadge = (status) => {
    switch (status) {
      case 'Present':
        return <Badge variant="success">Present</Badge>;
      case 'Absent':
        return <Badge variant="danger">Absent</Badge>;
      case 'Pending':
      default:
        return <Badge variant="warning">Not Marked</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Today's Scheduled Classes
          </h3>
          <p className="text-xs text-slate-500">
            {classes.length} {classes.length === 1 ? 'class' : 'classes'} on today's schedule
          </p>
        </div>
        <Link to="/timetable">
          <Button variant="ghost" size="xs">
            Full Weekly Timetable
          </Button>
        </Link>
      </div>

      {classes.length === 0 ? (
        <Card className="text-center py-10">
          <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-2">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No classes scheduled for today!
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Enjoy your free day or add an extra lecture from the timetable manager.
          </p>
          <div className="mt-4">
            <Link to="/timetable">
              <Button size="sm" variant="secondary">
                Manage Timetable
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {classes.map((item) => (
            <Card
              key={item._id}
              className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4"
              style={{
                borderLeftColor: item.subject?.color || '#4F46E5',
              }}
            >
              {/* Class Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getTimeStatusBadge(item.timeStatus)}
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {item.classType || 'Lecture'}
                  </span>
                  {item.subject?.code && (
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {item.subject.code}
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {item.subject?.name || 'Class Session'}
                </h4>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand-500" />
                    {formatTime12h(item.startTime)} - {formatTime12h(item.endTime)}
                  </span>
                  {item.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {item.room}
                    </span>
                  )}
                  {item.faculty && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" /> {item.faculty}
                    </span>
                  )}
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-dark-border">
                <div>{getAttendanceBadge(item.attendanceStatus)}</div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={!!loadingId}
                    onClick={() => handleMark(item, 'Present')}
                    title="Mark Present"
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      item.attendanceStatus === 'Present'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Present</span>
                  </button>

                  <button
                    disabled={!!loadingId}
                    onClick={() => handleMark(item, 'Absent')}
                    title="Mark Absent"
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      item.attendanceStatus === 'Absent'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Absent</span>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodayTimetable;
