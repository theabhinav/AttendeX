import React, { useState, useEffect } from 'react';
import { Clock, MapPin, User, ArrowRight, PlayCircle, Sparkles } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { formatTime12h, getCountdown } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';

const UpcomingClassCountdown = ({ upcomingClass }) => {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!upcomingClass) return;

    const updateTimer = () => {
      const cd = getCountdown(upcomingClass.startTime);
      setCountdown(cd || (upcomingClass.timeStatus === 'ongoing' ? 'Ongoing now' : 'Starting soon'));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000); // 30 sec update
    return () => clearInterval(interval);
  }, [upcomingClass]);

  if (!upcomingClass) {
    return (
      <Card className="bg-gradient-to-br from-brand-600/5 to-indigo-600/10 border-brand-200/50 dark:border-brand-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              No More Classes Today
            </span>
          </div>
          <Badge variant="success" size="sm">
            All Done
          </Badge>
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2">
          You have no more scheduled lectures for today!
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Review your attendance analytics or calculate safe bunks for upcoming days.
        </p>
      </Card>
    );
  }

  const { subject, startTime, endTime, room, faculty, classType, timeStatus } = upcomingClass;

  return (
    <Card className="bg-gradient-to-r from-brand-600 to-indigo-700 text-white shadow-xl shadow-brand-500/15 border-transparent">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {timeStatus === 'ongoing' ? 'Current Class' : 'Next Scheduled Class'}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 text-white backdrop-blur-xs">
          {countdown}
        </span>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-white">
            {subject?.name || 'Class Session'}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-indigo-100 mt-1.5">
            <span className="font-semibold text-white">
              {formatTime12h(startTime)} - {formatTime12h(endTime)}
            </span>
            {room && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {room}
              </span>
            )}
            {faculty && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {faculty}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-semibold uppercase">
              {classType || 'Lecture'}
            </span>
          </div>
        </div>

        <Link
          to="/timetable"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-brand-700 text-xs font-bold hover:bg-indigo-50 transition-colors shadow-xs shrink-0"
        >
          <span>View Timetable</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};

export default UpcomingClassCountdown;
