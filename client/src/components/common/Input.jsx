import React, { forwardRef } from 'react';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      type = 'text',
      className = '',
      id,
      required = false,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 7);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
            {label} {required && <span className="text-status-danger">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`w-full rounded bg-white text-text-primary text-sm border px-3 py-2 transition-colors focus:outline-none focus:ring-1 ${
              Icon ? 'pl-9' : ''
            } ${
              error
                ? 'border-status-danger focus:border-status-danger focus:ring-status-danger'
                : 'border-surface-border focus:border-brand-700 focus:ring-brand-700'
            } disabled:bg-slate-50 disabled:text-text-secondary disabled:cursor-not-allowed ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-text-secondary">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

