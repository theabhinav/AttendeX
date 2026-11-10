import React from 'react';
import Card from './Card';
import Badge from './Badge';

const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-slate-500 dark:text-slate-400',
  iconBg = 'bg-slate-100 dark:bg-slate-800',
  badge,
  badgeVariant = 'default',
  trend,
  trendType = 'neutral', // 'positive' | 'negative' | 'neutral'
  className = '',
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      hoverEffect={!!onClick}
      padding="p-5"
      className={`relative overflow-hidden ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
              {value}
            </h3>
            {badge && (
              <Badge variant={badgeVariant} size="sm">
                {badge}
              </Badge>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={`w-10 h-10 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          {subtext && <span className="truncate">{subtext}</span>}
          {trend && (
            <span
              className={`font-semibold shrink-0 ml-auto ${
                trendType === 'positive'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trendType === 'negative'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

export default StatCard;
