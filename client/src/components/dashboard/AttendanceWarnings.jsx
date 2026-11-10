import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AttendanceWarnings = ({ subjects = [], threshold = 75 }) => {
  const lowSubjects = subjects.filter((s) => s.conducted > 0 && s.percentage < threshold);

  if (lowSubjects.length === 0) return null;

  return (
    <div className="space-y-3">
      {lowSubjects.map((sub) => {
        const needed = sub.neededForThreshold || 1;
        return (
          <div
            key={sub._id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold">
                  Low Attendance Warning: {sub.name} ({sub.code || 'Course'})
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300/80 mt-0.5">
                  Your attendance is currently <strong>{sub.percentage}%</strong> (target is {threshold}%).
                  You need to attend the next <strong>{needed} consecutive {needed === 1 ? 'class' : 'classes'}</strong> to recover.
                </p>
              </div>
            </div>

            <Link
              to={`/calculator?subjectId=${sub._id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
            >
              <span>Calculate Safe Bunks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default AttendanceWarnings;
