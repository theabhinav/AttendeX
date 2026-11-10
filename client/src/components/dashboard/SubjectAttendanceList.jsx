import React from 'react';
import { BookOpen, ArrowRight, Calculator } from 'lucide-react';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import Badge from '../common/Badge';
import { Link } from 'react-router-dom';

const SubjectAttendanceList = ({ subjects = [], threshold = 75 }) => {
  if (subjects.length === 0) {
    return (
      <Card className="text-center py-8">
        <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          No subjects registered yet
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Upload your timetable to automatically populate your subjects.
        </p>
        <Link to="/timetable" className="inline-block mt-3">
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Scan Timetable →
          </span>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Subject-wise Attendance
          </h3>
          <p className="text-xs text-slate-500">
            Performance breakdown across all enrolled courses
          </p>
        </div>
        <Link
          to="/analytics"
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          <span>Detailed Analytics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((sub) => {
          const isSafe = sub.percentage >= threshold;
          return (
            <Card key={sub._id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color || '#4F46E5' }}
                      />
                      {sub.code && (
                        <span className="text-[11px] font-mono text-slate-500 uppercase">
                          {sub.code}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {sub.name}
                    </h4>
                    {sub.faculty && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{sub.faculty}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xl font-black ${
                        isSafe
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {sub.percentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {sub.attended} / {sub.conducted} classes
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <ProgressBar
                    value={sub.percentage}
                    max={100}
                    threshold={threshold}
                    size="sm"
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border flex items-center justify-between text-xs">
                {isSafe ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    Safe to miss {sub.safeBunks} {sub.safeBunks === 1 ? 'class' : 'classes'}
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                    Attend next {sub.neededForThreshold || 1} classes to reach {threshold}%
                  </span>
                )}

                <Link
                  to={`/calculator?subjectId=${sub._id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <Calculator className="w-3 h-3" />
                  <span>Bunk Math</span>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectAttendanceList;
