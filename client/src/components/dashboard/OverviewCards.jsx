import React from 'react';
import {
  Percent,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import Card from '../common/Card';

const OverviewCards = ({ analytics }) => {
  const {
    overallPercentage = 0,
    totalConducted = 0,
    totalAttended = 0,
    totalMissed = 0,
    threshold = 75,
    trend = 'Stable',
  } = analytics || {};

  const isSafe = overallPercentage >= threshold;

  const getTrendIcon = () => {
    if (trend === 'Improving') {
      return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
    }
    if (trend === 'Declining') {
      return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />;
    }
    return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Overall Attendance % */}
      <Card className="relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Overall Attendance
          </span>
          <div
            className={`h-8 w-8 rounded-xl flex items-center justify-center ${
              isSafe
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
            }`}
          >
            <Percent className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {overallPercentage}%
          </span>
          <span className="text-xs text-slate-400">Target: {threshold}%</span>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
          {getTrendIcon()}
          <span
            className={
              trend === 'Improving'
                ? 'text-emerald-600 dark:text-emerald-400'
                : trend === 'Declining'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-500'
            }
          >
            {trend} trend
          </span>
        </div>
      </Card>

      {/* 2. Total Classes Conducted */}
      <Card className="group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Conducted Classes
          </span>
          <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {totalConducted}
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Total academic sessions held
        </p>
      </Card>

      {/* 3. Classes Attended */}
      <Card className="group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Classes Attended
          </span>
          <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {totalAttended}
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Marked as Present
        </p>
      </Card>

      {/* 4. Classes Missed */}
      <Card className="group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Classes Missed
          </span>
          <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
            <XCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            {totalMissed}
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Marked as Absent
        </p>
      </Card>
    </div>
  );
};

export default OverviewCards;
