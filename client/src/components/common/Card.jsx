import React from 'react';

const Card = ({
  children,
  className = '',
  hoverEffect = false,
  padding = 'p-6',
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border rounded-2xl shadow-subtle dark:shadow-premium-dark transition-all duration-200 ${padding} ${
        hoverEffect ? 'hover:shadow-premium hover:-translate-y-0.5 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
