import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  message = 'There are currently no items to display.',
  action,
}) => {
  return (
    <div className="text-center py-12 px-4 flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-text-secondary mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-secondary max-w-sm mb-4 leading-relaxed">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;

