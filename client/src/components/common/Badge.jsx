import React from 'react';

export const Badge = ({ status = '', text, size = 'sm', className = '' }) => {
  const norm = String(status).toLowerCase().trim();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['active', 'resolved', 'verified', 'healthy'].includes(norm)) {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (['under_inspection', 'under_review', 'action_required', 'medium', 'warning', 'pending_review', 'investigating'].includes(norm)) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (['critical', 'critical_review', 'rejected', 'deactivated', 'suspended', 'high', 'high_priority'].includes(norm)) {
    colorClasses = 'bg-red-50 text-red-800 border-red-200';
  } else if (['informational', 'info', 'low', 'pending', 'submitted', 'draft'].includes(norm)) {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
  } else if (norm === 'admin') {
    colorClasses = 'bg-teal-50 text-brand-800 border-brand-200';
  } else if (norm === 'health_worker') {
    colorClasses = 'bg-indigo-50 text-indigo-800 border-indigo-200';
  } else if (norm === 'villager') {
    colorClasses = 'bg-slate-100 text-slate-800 border-slate-200';
  }

  const sizeClasses = size === 'xs' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2.5 py-0.5';

  const label = text || status.replace(/_/g, ' ').toUpperCase();

  return (
    <span
      className={`inline-flex items-center font-medium border rounded uppercase tracking-wider ${sizeClasses} ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
};

export default Badge;

