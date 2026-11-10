import React from 'react';

const ProgressBar = ({
  value = 0,
  max = 100,
  threshold = 75,
  showLabel = false,
  size = 'md',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  // Color by threshold
  let fillColor = 'bg-brand-500';
  if (percentage >= threshold + 10) {
    fillColor = 'bg-emerald-500';
  } else if (percentage >= threshold) {
    fillColor = 'bg-blue-500';
  } else if (percentage >= threshold - 10) {
    fillColor = 'bg-amber-500';
  } else {
    fillColor = 'bg-rose-500';
  }

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold mb-1">
          <span className="text-slate-600 dark:text-slate-400">Progress</span>
          <span className="text-slate-900 dark:text-white">{percentage}%</span>
        </div>
      )}
      <div
        className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative ${heights[size]}`}
      >
        <div
          className={`${fillColor} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
        {/* Subtle marker for threshold */}
        {threshold > 0 && threshold < 100 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-900/30 dark:bg-white/40 z-10"
            style={{ left: `${threshold}%` }}
            title={`Required: ${threshold}%`}
          />
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
