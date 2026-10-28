import React from 'react';

export const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-lg border border-surface-border p-5 shadow-sm flex items-start justify-between ${className}`}
    >
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-bold text-text-primary mt-1 tracking-tight">{value}</h4>
        {subtext && <p className="text-xs text-text-secondary mt-1">{subtext}</p>}
        {trend && (
          <p
            className={`text-xs font-medium mt-2 ${
              trend.isPositive ? 'text-status-success' : 'text-status-danger'
            }`}
          >
            {trend.text}
          </p>
        )}
      </div>
      {Icon && (
        <div className="p-2.5 rounded-lg bg-teal-50 text-brand-700 border border-brand-100 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export default StatCard;

