import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Slash,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

const AttendanceCalendar = ({ records = [], onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Calendar dates generation
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map records by date string 'YYYY-MM-DD'
  const recordMap = new Map();
  records.forEach((r) => {
    if (!recordMap.has(r.date)) {
      recordMap.set(r.date, []);
    }
    recordMap.get(r.date).push(r);
  });

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            {monthName}
          </h3>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
          </span>
          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Cancelled/Holiday
          </span>
        </div>

        {/* Month Arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-surface"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-surface"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
        {daysOfWeek.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Day Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells before day 1 */}
        {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-14 sm:h-20 rounded-xl bg-transparent" />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
            dayNum
          ).padStart(2, '0')}`;
          const dayRecords = recordMap.get(dateStr) || [];

          const hasPresent = dayRecords.some((r) => r.status === 'Present');
          const hasAbsent = dayRecords.some((r) => r.status === 'Absent');
          const hasPending = dayRecords.some((r) => r.status === 'Pending');
          const hasHoliday = dayRecords.some((r) => r.status === 'Holiday' || r.status === 'Cancelled');

          // Highlight today
          const isToday =
            new Date().toDateString() === new Date(year, month, dayNum).toDateString();

          return (
            <div
              key={dayNum}
              onClick={() => onSelectDate(dateStr, dayRecords)}
              className={`h-14 sm:h-20 rounded-xl p-2 border transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.02] hover:shadow-xs ${
                isToday
                  ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20'
                  : 'border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/40 hover:bg-slate-100/60 dark:hover:bg-dark-surface'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    isToday
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {dayNum}
                </span>
                {dayRecords.length > 0 && (
                  <span className="text-[9px] font-semibold text-slate-400">
                    {dayRecords.length}
                  </span>
                )}
              </div>

              {/* Status Indicator Dots */}
              <div className="flex items-center gap-1 flex-wrap">
                {hasPresent && (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-500"
                    title="Present recorded"
                  />
                )}
                {hasAbsent && (
                  <span
                    className="w-2 h-2 rounded-full bg-rose-500"
                    title="Absent recorded"
                  />
                )}
                {hasPending && (
                  <span
                    className="w-2 h-2 rounded-full bg-amber-500"
                    title="Pending resolution"
                  />
                )}
                {hasHoliday && (
                  <span
                    className="w-2 h-2 rounded-full bg-slate-400"
                    title="Holiday / Cancelled"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default AttendanceCalendar;
