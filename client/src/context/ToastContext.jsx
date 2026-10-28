import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bg = 'bg-white border-brand-700 text-text-primary';
          let icon = <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />;

          if (toast.type === 'error') {
            bg = 'bg-white border-status-danger text-text-primary';
            icon = <AlertCircle className="w-5 h-5 text-status-danger shrink-0" />;
          } else if (toast.type === 'warning') {
            bg = 'bg-white border-status-warning text-text-primary';
            icon = <AlertTriangle className="w-5 h-5 text-status-warning shrink-0" />;
          } else if (toast.type === 'info') {
            bg = 'bg-white border-status-info text-text-primary';
            icon = <Info className="w-5 h-5 text-status-info shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto border-l-4 rounded shadow-md p-3.5 flex items-start justify-between gap-3 text-sm bg-white border border-surface-border ${bg}`}
              role="alert"
            >
              <div className="flex items-start gap-2.5">
                {icon}
                <div className="leading-snug">{toast.message}</div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-text-secondary hover:text-text-primary p-0.5 rounded transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

