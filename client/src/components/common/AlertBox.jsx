import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export const AlertBox = ({
  type = 'info', // 'info' | 'warning' | 'error' | 'success'
  title,
  children,
  className = '',
}) => {
  const styles = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: <Info className="w-5 h-5 text-status-info shrink-0" />,
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-status-warning shrink-0" />,
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-900',
      icon: <AlertCircle className="w-5 h-5 text-status-danger shrink-0" />,
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />,
    },
  };

  const current = styles[type] || styles.info;

  return (
    <div
      className={`border rounded-lg p-4 flex items-start gap-3 text-sm ${current.container} ${className}`}
      role="alert"
    >
      {current.icon}
      <div className="flex-1">
        {title && <h5 className="font-semibold text-sm mb-1 leading-snug">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-95">{children}</div>
      </div>
    </div>
  );
};

export default AlertBox;

