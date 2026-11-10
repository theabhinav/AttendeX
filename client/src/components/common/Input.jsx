import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      onRightIconClick,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-xs">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <LeftIcon className="h-4 w-4" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`block w-full rounded-xl border transition-all duration-200 text-sm bg-white dark:bg-dark-card text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
              LeftIcon ? 'pl-10' : 'pl-3.5'
            } ${RightIcon ? 'pr-10' : 'pr-3.5'} py-2.5 ${
              error
                ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
                : 'border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600'
            } ${className}`}
            {...props}
          />
          {RightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className={`absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 ${
                !onRightIconClick ? 'pointer-events-none' : 'cursor-pointer'
              }`}
            >
              <RightIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
