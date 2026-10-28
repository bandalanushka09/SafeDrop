import React, { forwardRef } from 'react';

export const Textarea = forwardRef(
  (
    {
      label,
      error,
      helperText,
      rows = 4,
      className = '',
      id,
      required = false,
      ...props
    },
    ref
  ) => {
    const areaId = id || props.name || Math.random().toString(36).substring(2, 7);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={areaId} className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
            {label} {required && <span className="text-status-danger">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          rows={rows}
          className={`w-full rounded bg-white text-text-primary text-sm border px-3 py-2 transition-colors focus:outline-none focus:ring-1 ${
            error
              ? 'border-status-danger focus:border-status-danger focus:ring-status-danger'
              : 'border-surface-border focus:border-brand-700 focus:ring-brand-700'
          } disabled:bg-slate-50 disabled:text-text-secondary disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-text-secondary">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;

