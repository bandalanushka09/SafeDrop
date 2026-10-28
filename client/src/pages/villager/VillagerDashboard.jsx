import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sourceService } from '../../services/sourceService';
import { reportService } from '../../services/reportService';
import { alertService } from '../../services/alertService';
import {
  Droplets,
  PlusCircle,
  MapPin,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Eye,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const VillagerDashboard = () => {
  const { user } = useAuth();
  const [sources, setSources] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [sourceRes, reportRes, alertRes] = await Promise.all([
          sourceService.getAll({ village: user?.village, limit: 5 }),
          reportService.getMyReports(),
          alertService.getAll({ village: user?.village, isPublic: 'true', limit: 3 }),
        ]);

        if (sourceRes.success) setSources(sourceRes.data);
        if (reportRes.success) setMyReports(reportRes.data);
        if (alertRes.success) setAlerts(alertRes.data);
      } catch (err) {
        console.error('Failed to load villager dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
            Community Resident Portal
          </span>
          <h1 className="text-2xl font-bold text-text-primary mt-0.5">
            Welcome, {user?.name || 'Resident'}
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Registered Locality: <strong className="text-text-primary">{user?.village || 'General Area'}</strong>.
            Stay informed about drinking-water safety and report suspected contamination.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/submit-report">
            <Button variant="primary" icon={PlusCircle}>
              Report Water Issue
            </Button>
          </Link>
          <Link to="/map">
            <Button variant="secondary" icon={MapPin}>
              Water Map
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Advisories Banner if present */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-status-warning">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2 className="text-base font-bold text-text-primary">
              Active Safety Advisories in {user?.village || 'Your Locality'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className="bg-amber-50/60 rounded-lg border border-amber-200 p-4 space-y-2 border-l-4 border-l-status-warning"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-xs text-text-primary">{alert.title}</h4>
                  <Badge status={alert.severity} size="xs" />
                </div>
                <p className="text-xs text-text-secondary line-clamp-2">{alert.message}</p>
                <div className="text-[11px] font-medium text-brand-800 pt-1 border-t border-amber-200/60">
                  Recommended: {alert.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: My Reports & Local Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: My Recent Reports */}
        <div className="bg-white rounded-xl border border-surface-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-brand-700" />
              <h3 className="font-bold text-sm text-text-primary">My Submitted Reports</h3>
            </div>
            <Link to="/my-reports" className="text-xs font-semibold text-brand-700 hover:underline">
              View All ({myReports.length})
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : myReports.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No Reports Filed"
              message="You haven't reported any water-safety issues yet."
              action={
                <Link to="/submit-report">
                  <Button size="sm" variant="outline" icon={PlusCircle}>
                    Submit a Report
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-surface-border">
              {myReports.slice(0, 4).map((report) => (
                <div key={report._id} className="py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-text-primary capitalize">
                      {report.category?.replace(/_/g, ' ')}
                    </span>
                    <Badge status={report.status} size="xs" />
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2">
                    {report.description}
                  </p>
                  {report.publicResponse && (
                    <div className="text-[11px] text-brand-800 bg-teal-50 p-2 rounded border border-brand-100">
                      <strong>Staff Response:</strong> {report.publicResponse}
                    </div>
                  )}
                  <div className="text-[10px] text-text-secondary pt-0.5">
                    Filed on {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Local Registered Water Sources */}
        <div className="bg-white rounded-xl border border-surface-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-700" />
              <h3 className="font-bold text-sm text-text-primary">
                Water Sources in {user?.village || 'Area'}
              </h3>
            </div>
            <Link to="/sources" className="text-xs font-semibold text-brand-700 hover:underline">
              Explore All Sources
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : sources.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No Sources Listed"
              message="No water points currently registered under this village name."
            />
          ) : (
            <div className="divide-y divide-surface-border">
              {sources.map((source) => (
                <div key={source._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/sources/${source._id}`}
                        className="font-semibold text-xs text-brand-700 hover:underline"
                      >
                        {source.name}
                      </Link>
                      <Badge status={source.status} size="xs" />
                    </div>
                    <p className="text-[11px] text-text-secondary capitalize">
                      {source.type?.replace(/_/g, ' ')} • {source.address || source.village}
                    </p>
                    {source.lastTestedAt && (
                      <p className="text-[10px] text-text-secondary">
                        Last tested: {new Date(source.lastTestedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Link
                    to={`/sources/${source._id}`}
                    className="p-1.5 text-text-secondary hover:text-brand-700 hover:bg-slate-100 rounded transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prevention Quick Guidance Box */}
      <div className="bg-slate-50 rounded-xl border border-surface-border p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-700" />
            <span>Water Treatment Best Practice</span>
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            Boil drinking water vigorously for at least 1 full minute, or treat with certified chlorine tablets, especially following heavy rainfall or when using open well water.
          </p>
        </div>
        <Link
          to="/water-safety-guide"
          className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded text-xs font-semibold transition-colors shrink-0"
        >
          View Treatment Guide →
        </Link>
      </div>
    </div>
  );
};

export default VillagerDashboard;

