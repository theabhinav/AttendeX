import React from 'react';
import Card from './Card';
import Button from './Button';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className = '',
}) => {
  return (
    <Card className={`text-center py-12 px-6 ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mx-auto flex items-center justify-center mb-3.5 border border-slate-200/60 dark:border-slate-700/60">
          <Icon className="w-6 h-6" />
        </div>
      )}

      <h3 className="text-sm font-semibold text-[#172033] dark:text-white mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4 leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button
          size="sm"
          variant="primary"
          onClick={onAction}
          leftIcon={ActionIcon}
        >
          {actionLabel}
        </Button>
      )}
    </Card>
  );
};

export default EmptyState;
