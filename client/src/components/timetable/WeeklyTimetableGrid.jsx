import React, { useState } from 'react';
import { Clock, MapPin, User, Calendar, Edit2, Trash2, Plus, Sparkles, AlertTriangle } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatTime12h, WORK_DAYS, DAYS_OF_WEEK } from '../../utils/dateUtils';

const WeeklyTimetableGrid = ({
  timetable = [],
  subjects = [],
  onEditClass,
  onDeleteClass,
  onAddClass,
  onAddDateException,
}) => {
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [activeView, setActiveView] = useState('weekly'); // 'weekly' or 'daily'
  const [activeDay, setActiveDay] = useState(
    DAYS_OF_WEEK[new Date().getDay()] || 'Monday'
  );

  // Timetable Conflict Detector (overlapping slots on same day)
  const conflicts = [];
  const dayGroups = {};
  timetable.forEach((slot) => {
    if (!dayGroups[slot.day]) dayGroups[slot.day] = [];
    dayGroups[slot.day].push(slot);
  });

  Object.entries(dayGroups).forEach(([day, slots]) => {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const s1 = slots[i];
        const s2 = slots[j];
        if (s1.startTime < s2.endTime && s2.startTime < s1.endTime) {
          conflicts.push({ s1, s2, day });
        }
      }
    }
  });

  // Filter timetable
  const filtered = timetable.filter((slot) => {
    if (selectedSubject !== 'ALL') {
      const subId = slot.subjectId?._id || slot.subjectId;
      if (subId !== selectedSubject) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Timetable Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Timetable Schedule Conflicts Detected ({conflicts.length})</span>
          </div>
          <div className="text-xs space-y-1 pl-6">
            {conflicts.map((c, idx) => (
              <p key={idx}>
                <strong>{c.day}:</strong> Overlapping classes between{' '}
                <span className="font-semibold underline">
                  {c.s1.subjectId?.name || 'Class 1'} ({c.s1.startTime} - {c.s1.endTime})
                </span>{' '}
                and{' '}
                <span className="font-semibold underline">
                  {c.s2.subjectId?.name || 'Class 2'} ({c.s2.startTime} - {c.s2.endTime})
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* View controls & filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border">
        {/* Toggle between Weekly View and Daily View */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-dark-surface rounded-xl">
          <button
            onClick={() => setActiveView('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'weekly'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Weekly Grid
          </button>
          <button
            onClick={() => setActiveView('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'daily'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Daily View
          </button>
        </div>

        {/* Filter by subject */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter Course:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface px-3 py-1.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Subjects ({subjects.length})</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.name} {sub.code ? `(${sub.code})` : ''}
              </option>
            ))}
          </select>

          <Button size="xs" variant="primary" onClick={onAddClass} leftIcon={Plus}>
            Add Class Slot
          </Button>
        </div>
      </div>

      {/* Daily View Day Selector Tabs */}
      {activeView === 'daily' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {WORK_DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeDay === day
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {/* DAILY VIEW */}
      {activeView === 'daily' && (
        <div className="space-y-3">
          {filtered.filter((s) => s.day === activeDay).length === 0 ? (
            <Card className="text-center py-10">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No classes on {activeDay}
              </p>
              <Button size="xs" variant="outline" className="mt-3" onClick={onAddClass}>
                Add Class for {activeDay}
              </Button>
            </Card>
          ) : (
            filtered
              .filter((s) => s.day === activeDay)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((slot) => {
                const sub = slot.subjectId;
                return (
                  <Card
                    key={slot._id}
                    className="p-4 sm:p-5 flex items-center justify-between border-l-4"
                    style={{ borderLeftColor: sub?.color || '#4F46E5' }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-mono">
                          {formatTime12h(slot.startTime)} - {formatTime12h(slot.endTime)}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">
                          {slot.classType || 'Lecture'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {sub?.name || 'Class'}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        {slot.room && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {slot.room}
                          </span>
                        )}
                        {(slot.faculty || sub?.faculty) && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> {slot.faculty || sub?.faculty}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditClass(slot)}
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-surface"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteClass(slot._id)}
                        className="p-2 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                );
              })
          )}
        </div>
      )}

      {/* WEEKLY GRID VIEW */}
      {activeView === 'weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {WORK_DAYS.map((day) => {
            const dayClasses = filtered
              .filter((s) => s.day === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div
                key={day}
                className="bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border rounded-2xl p-3 flex flex-col min-h-[300px]"
              >
                {/* Day Header */}
                <div className="pb-2.5 mb-2.5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    {day.substring(0, 3)}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                    {dayClasses.length}
                  </span>
                </div>

                {/* Day Slots */}
                <div className="flex-1 space-y-2.5">
                  {dayClasses.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center p-4">
                      <p className="text-[11px] text-slate-400 font-medium">No classes</p>
                    </div>
                  ) : (
                    dayClasses.map((slot) => {
                      const sub = slot.subjectId;
                      return (
                        <div
                          key={slot._id}
                          className="p-2.5 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/70 dark:bg-dark-surface/60 hover:shadow-xs transition-shadow group relative"
                          style={{
                            borderLeftWidth: '3px',
                            borderLeftColor: sub?.color || '#4F46E5',
                          }}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">
                              {formatTime12h(slot.startTime)}
                            </span>
                            <span className="text-[9px] uppercase font-semibold text-slate-400">
                              {slot.classType || 'Lecture'}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {sub?.name || 'Class'}
                          </p>

                          {slot.room && (
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-2.5 h-2.5" /> {slot.room}
                            </p>
                          )}

                          {/* Quick action buttons on hover */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-dark-card/90 rounded px-1 shadow-xs">
                            <button
                              onClick={() => onEditClass(slot)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              title="Edit"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onDeleteClass(slot._id)}
                              className="text-slate-400 hover:text-rose-500"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeeklyTimetableGrid;
