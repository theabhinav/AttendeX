import React from 'react';

const PageHeader = ({
  title,
  description,
  badge,
  badgeVariant = 'primary',
  breadcrumbs,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 ${className}`}>
      <div className="space-y-1">
        {breadcrumbs && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033] dark:text-white font-manrope">
            {title}
          </h1>
          {badge && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-red-50 text-[#E63946] border border-red-200/80 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60">
              {badge}
            </span>
          )}
        </div>

        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
