import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sourceService } from '../../services/sourceService';
import { testService } from '../../services/testService';
import { reportService } from '../../services/reportService';
import { riskService } from '../../services/riskService';
import {
  FlaskConical,
  ClipboardList,
  AlertTriangle,
  PlusCircle,
  MapPin,
  CheckCircle2,
  Clock,
  Eye,
  Shield,
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const HealthWorkerDashboard = () => {
  const { user } = useAuth();
  const [sourcesCount, setSourcesCount] = useState(0);
  const [tests, setTests] = useState([]);
  const [reports, setReports] = useState([]);
  const [riskFlags, setRiskFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        setLoading(true);
        const [srcRes, testRes, repRes, flagRes] = await Promise.all([
          sourceService.getAll({ village: user?.village, limit: 1 }),
          testService.getAll({ limit: 5 }),
          reportService.getAll({ status: 'submitted', limit: 5 }),
          riskService.getFlags({ status: 'pending_review', limit: 5 }),
        ]);

        if (srcRes.success) setSourcesCount(srcRes.meta?.total || 0);
        if (testRes.success) setTests(testRes.data);
        if (repRes.success) setReports(repRes.data);
        if (flagRes.success) setRiskFlags(flagRes.data);
      } catch (err) {
        console.error('Failed to load health worker dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerData();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Shortcuts */}
      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
            Health Operations & Field Testing
          </span>
          <h1 className="text-2xl font-bold text-text-primary mt-0.5">
            Health Worker Workspace
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Logged in as: <strong className="text-text-primary">{user?.name}</strong> • Assigned Sector:{' '}
            <strong className="text-text-primary">{user?.village}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/health-worker/tests/new">
            <Button variant="primary" icon={FlaskConical}>
              Record Water Test
            </Button>
          </Link>
          <Link to="/health-worker/sources/new">
            <Button variant="secondary" icon={PlusCircle}>
              Register Source
            </Button>
          </Link>
          <Link to="/health-worker/alerts/new">
            <Button variant="outline" icon={AlertTriangle}>
              Draft Advisory
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Sector Sources"
          value={sourcesCount}
          subtext={`Monitored in ${user?.village || 'Area'}`}
          icon={MapPin}
        />
        <StatCard
          title="Open Reports"
          value={reports.length}
          subtext="Submitted awaiting triage"
          icon={ClipboardList}
        />
        <StatCard
          title="Pending Risk Flags"
          value={riskFlags.length}
          subtext="Rule violations to inspect"
          icon={AlertTriangle}
        />
        <StatCard
          title="Recent Tests"
          value={tests.length}
          subtext="Logged in system"
          icon={FlaskConical}
        />
      </div>

      {/* Active Risk Flags Banner */}
      {riskFlags.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 p-5 shadow-xs space-y-3 border-l-4 border-l-status-danger">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-status-danger" />
              <h3 className="font-bold text-sm text-text-primary">
                Immediate Water Risk Flags Requiring Follow-Up ({riskFlags.length})
              </h3>
            </div>
            <Link to="/admin/risk-rules" className="text-xs font-semibold text-brand-700 hover:underline">
              Rule Guidelines
            </Link>
          </div>

          <div className="space-y-2">
            {riskFlags.map((flag) => (
              <div
                key={flag._id}
                className="bg-red-50/50 p-3 rounded border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-red-900">
                    {flag.sourceId?.name || 'Water Source'} ({flag.sourceId?.village}):{' '}
                  </span>
                  <span className="text-text-primary">{flag.explanation}</span>
                  <div className="text-[11px] text-red-800 font-medium mt-0.5">
                    Action: {flag.recommendation}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge status={flag.severity} size="xs" />
                  <Link
                    to={`/sources/${flag.sourceId?._id}`}
                    className="text-xs font-semibold text-brand-700 hover:underline"
                  >
                    View Source
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Open Reports & Recent Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Reports */}
        <div className="bg-white rounded-xl border border-surface-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-brand-700" />
              <h3 className="font-bold text-sm text-text-primary">Open Community Reports</h3>
            </div>
            <Link to="/health-worker/reports" className="text-xs font-semibold text-brand-700 hover:underline">
              Review All Reports
            </Link>
          </div>

          {loading ? (
            <Skeleton className="h-36 w-full" />
          ) : reports.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All Caught Up"
              message="No new unreviewed community reports pending in your sector."
            />
          ) : (
            <div className="divide-y divide-surface-border">
              {reports.map((report) => (
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
                  <div className="flex items-center justify-between text-[11px] text-text-secondary pt-1">
                    <span>
                      Locality: <strong>{report.village}</strong>
                    </span>
                    <Link
                      to={`/health-worker/reports/${report._id}`}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      Review & Resolve →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Water Tests */}
        <div className="bg-white rounded-xl border border-surface-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-brand-700" />
              <h3 className="font-bold text-sm text-text-primary">Recent Water Tests</h3>
            </div>
            <Link to="/health-worker/tests" className="text-xs font-semibold text-brand-700 hover:underline">
              View History
            </Link>
          </div>

          {loading ? (
            <Skeleton className="h-36 w-full" />
          ) : tests.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="No Tests Recorded"
              message="Click 'Record Water Test' to log measurements."
            />
          ) : (
            <div className="divide-y divide-surface-border">
              {tests.map((test) => (
                <div key={test._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-text-primary">
                        {test.sourceId?.name || 'Water Source'}
                      </span>
                      <Badge status={test.verificationStatus} size="xs" />
                    </div>
                    <p className="text-[11px] text-text-secondary">
                      Tested on {new Date(test.testedAt).toLocaleDateString()} by {test.testerName || 'Staff'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {test.parameters?.map((p, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono"
                        >
                          {p.parameter.toUpperCase()}: {p.value} {p.unit}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={`/sources/${test.sourceId?._id}`}
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
    </div>
  );
};

export default HealthWorkerDashboard;

