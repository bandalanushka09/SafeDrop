import React, { forwardRef } from 'react';

export const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      options = [],
      className = '',
      id,
      required = false,
      placeholder = 'Select an option',
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name || Math.random().toString(36).substring(2, 7);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
            {label} {required && <span className="text-status-danger">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded bg-white text-text-primary text-sm border px-3 py-2 transition-colors focus:outline-none focus:ring-1 ${
            error
              ? 'border-status-danger focus:border-status-danger focus:ring-status-danger'
              : 'border-surface-border focus:border-brand-700 focus:ring-brand-700'
          } disabled:bg-slate-50 disabled:text-text-secondary disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>
        {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-text-secondary">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;

