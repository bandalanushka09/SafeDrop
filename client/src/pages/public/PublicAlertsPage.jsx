import React, { useState, useEffect } from 'react';
import { alertService } from '../../services/alertService';
import { AlertTriangle, MapPin, Calendar, Clock, ShieldAlert } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const PublicAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [villageFilter, setVillageFilter] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await alertService.getAll({
        isPublic: 'true',
        severity: severityFilter,
        village: villageFilter,
      });
      if (res.success) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, villageFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Water Safety Advisories</h1>
        <p className="text-xs text-text-secondary mt-1">
          Official precautionary guidance issued by village administrators and public health personnel.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-surface-border shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="text-xs border border-surface-border rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium</option>
          <option value="low">Low (Routine Notice)</option>
        </select>

        <select
          value={villageFilter}
          onChange={(e) => setVillageFilter(e.target.value)}
          className="text-xs border border-surface-border rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
        >
          <option value="">All Affected Villages</option>
          <option value="Rampur">Rampur</option>
          <option value="Sunderpur">Sunderpur</option>
          <option value="Devgarh">Devgarh</option>
          <option value="Bheemtal">Bheemtal</option>
          <option value="Central District">Central District</option>
        </select>

        {(severityFilter || villageFilter) && (
          <button
            onClick={() => {
              setSeverityFilter('');
              setVillageFilter('');
            }}
            className="text-xs text-brand-700 hover:underline px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Alert Feed */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-lg border border-surface-border p-6">
          <EmptyState
            icon={ShieldAlert}
            title="No Active Water Advisories"
            message="No public water-quality alerts are currently active for the selected locality. Routine monitoring continues."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const isCritical = alert.severity === 'critical' || alert.severity === 'high';
            const borderCol = isCritical ? 'border-l-status-danger' : 'border-l-status-warning';

            return (
              <div
                key={alert._id}
                className={`bg-white rounded-lg border border-surface-border border-l-4 ${borderCol} p-5 shadow-xs space-y-3`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-text-primary">{alert.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <strong>Locality:</strong> {alert.affectedVillage}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(alert.publishedAt || alert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge status={alert.severity} size="sm" />
                </div>

                <p className="text-xs text-text-secondary leading-relaxed bg-slate-50 p-3 rounded border border-surface-border">
                  {alert.message}
                </p>

                <div className="bg-teal-50/60 border border-brand-200 rounded p-3 text-xs">
                  <div className="font-semibold text-brand-800 uppercase tracking-wider text-[11px] mb-1">
                    Recommended Community Action:
                  </div>
                  <div className="text-text-primary leading-relaxed font-medium">
                    {alert.recommendedAction}
                  </div>
                </div>

                {alert.supportingReference && (
                  <p className="text-[11px] text-text-secondary italic">
                    Source reference: {alert.supportingReference}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PublicAlertsPage;

