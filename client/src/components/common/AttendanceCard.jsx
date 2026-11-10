import React from 'react';
import Card from './Card';
import Badge from './Badge';

const AttendanceCard = ({
  subject,
  percentage = 0,
  attended = 0,
  total = 0,
  safeBunks = 0,
  requiredClasses = 0,
  threshold = 75,
  onMarkAttendance,
  className = '',
}) => {
  const isAboveThreshold = percentage >= threshold;
  const isCritical = percentage < threshold - 10;

  return (
    <Card
      padding="p-4 sm:p-5"
      className={`border border-slate-200/90 dark:border-slate-800 space-y-3.5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 font-mono">
              {subject.code || 'SUBJ'}
            </span>
            {isAboveThreshold ? (
              <Badge variant="success" size="sm">
                Safe ({percentage.toFixed(1)}%)
              </Badge>
            ) : isCritical ? (
              <Badge variant="danger" size="sm">
                Shortage ({percentage.toFixed(1)}%)
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                Low ({percentage.toFixed(1)}%)
              </Badge>
            )}
          </div>
          <h4 className="text-sm font-semibold text-[#172033] dark:text-white truncate">
            {subject.name}
          </h4>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xl font-bold tracking-tight text-[#172033] dark:text-white">
            {percentage.toFixed(0)}%
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {attended}/{total} Classes
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isAboveThreshold
                ? 'bg-emerald-500'
                : isCritical
                ? 'bg-red-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Bottom Bunk Indicator & Quick Action */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        {isAboveThreshold ? (
          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
            {safeBunks > 0 ? `Can safely bunk ${safeBunks} class${safeBunks > 1 ? 'es' : ''}` : 'On the threshold limit'}
          </span>
        ) : (
          <span className="text-red-600 dark:text-red-400 font-medium">
            Attend next {requiredClasses} class{requiredClasses > 1 ? 'es' : ''} to recover
          </span>
        )}

        {onMarkAttendance && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onMarkAttendance(subject._id, 'Present')}
              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 transition-colors"
            >
              + Present
            </button>
            <button
              onClick={() => onMarkAttendance(subject._id, 'Absent')}
              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 transition-colors"
            >
              + Absent
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AttendanceCard;
