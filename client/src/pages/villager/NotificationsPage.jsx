import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, CheckCheck, Clock, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

export const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
          <p className="text-xs text-text-secondary mt-1">
            Status updates regarding your reports, local water-quality test results, and safety advisories.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={markAllAsRead}
            icon={CheckCheck}
          >
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-surface-border shadow-xs overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Bell}
              title="No Notifications"
              message="You are completely caught up. When your reports are reviewed or alerts are issued, they will appear here."
            />
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {notifications.map((n) => {
              const isUnread = !n.readAt;

              return (
                <div
                  key={n._id}
                  className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                    isUnread ? 'bg-teal-50/40' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-xs ${
                          isUnread ? 'font-bold text-brand-900' : 'font-semibold text-text-primary'
                        }`}
                      >
                        {n.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-brand-700 inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-1 text-[10px] text-text-secondary pt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => markAsRead(n._id)}
                      className="text-xs font-semibold text-brand-700 hover:underline shrink-0 p-1"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

