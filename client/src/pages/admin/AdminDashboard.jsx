import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import { adminService } from '../../services/adminService';
import {
  Users,
  MapPin,
  FlaskConical,
  ClipboardList,
  AlertTriangle,
  Sliders,
  History,
  TrendingUp,
  BarChart2,
  FileText,
  Shield,
  Building2,
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import SourceStatusChart from '../../components/charts/SourceStatusChart';
import TestsOverTimeChart from '../../components/charts/TestsOverTimeChart';
import ReportsByCategoryChart from '../../components/charts/ReportsByCategoryChart';
import ReportsByStatusChart from '../../components/charts/ReportsByStatusChart';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import { reportService } from '../../services/reportService';

export const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [testTrends, setTestTrends] = useState([]);
  const [reportStats, setReportStats] = useState({ byStatus: [], byCategory: [] });
  const [concernStats, setConcernStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [sumRes, testRes, repRes, logRes, concernRes] = await Promise.all([
          analyticsService.getSummary(),
          analyticsService.getWaterTests(),
          analyticsService.getReports(),
          adminService.getAuditLogs({ limit: 5 }),
          reportService.getStats(),
        ]);

        if (sumRes.success) setSummary(sumRes.data);
        if (testRes.success) setTestTrends(testRes.data.testsOverTime);
        if (repRes.success) setReportStats(repRes.data);
        if (logRes.success) setRecentLogs(logRes.data);
        if (concernRes.success) setConcernStats(concernRes.data);
      } catch (err) {
        console.error('Failed to load admin metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
            System Administration & Governance
          </span>
          <h1 className="text-2xl font-bold text-text-primary mt-0.5">
            SafeDrop Executive Control Panel
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            System-wide operational telemetry, data verification, role permissions, and risk threshold configuration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/users">
            <Button variant="secondary" icon={Users}>
              Users
            </Button>
          </Link>
          <Link to="/admin/risk-rules">
            <Button variant="secondary" icon={Sliders}>
              Risk Rules
            </Button>
          </Link>
          <Link to="/admin/alerts/new">
            <Button variant="primary" icon={AlertTriangle}>
              Publish Advisory
            </Button>
          </Link>
          <Link to="/admin/reports">
            <Button variant="secondary" icon={FileText}>
              Water Concern Reports
            </Button>
          </Link>
          <Link to="/admin/government-departments">
            <Button variant="secondary" icon={Building2}>
              Department Routing
            </Button>
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Water Concern Report Operations</h2>
            <p className="text-xs text-text-secondary">Live report workflow and official-submission status counts.</p>
          </div>
          <Link to="/admin/reports" className="text-xs font-semibold text-brand-700 hover:underline">Manage Reports</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {[
            ['Total Reports', concernStats?.total],
            ['New', concernStats?.NEW],
            ['Under Review', concernStats?.UNDER_REVIEW],
            ['Assigned', concernStats?.ASSIGNED],
            ['In Progress', concernStats?.IN_PROGRESS],
            ['Resolved', concernStats?.RESOLVED],
            ['High Priority', concernStats?.highPriority],
            ['Government Submission Pending', concernStats?.governmentPending],
            ['Government Submission Confirmed', concernStats?.governmentConfirmed],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-surface-border bg-white p-3 shadow-xs">
              <p className="text-[11px] font-semibold uppercase leading-snug text-text-secondary">{label}</p>
              <p className="mt-1 text-xl font-bold text-text-primary">{value ?? '—'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Telemetry Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Water Sources"
          value={summary?.sources?.total || 0}
          subtext={`${summary?.sources?.active || 0} Active • ${summary?.sources?.underInspection || 0} Inspected`}
          icon={MapPin}
        />
        <StatCard
          title="Recorded Tests"
          value={summary?.tests?.total || 0}
          subtext={`${summary?.tests?.verified || 0} Verified • ${summary?.tests?.pending || 0} Pending`}
          icon={FlaskConical}
        />
        <StatCard
          title="Community Reports"
          value={summary?.reports?.total || 0}
          subtext={`${summary?.reports?.open || 0} Open • ${summary?.reports?.resolved || 0} Resolved`}
          icon={ClipboardList}
        />
        <StatCard
          title="Platform Users"
          value={summary?.users?.total || 0}
          subtext={`${summary?.users?.byRole?.villager || 0} Villagers • ${summary?.users?.byRole?.health_worker || 0} Workers`}
          icon={Users}
        />
      </div>

      {/* Analytics Charts Grid (Recharts with real database aggregations) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Records Over Time */}
        <div className="bg-white rounded-xl border border-surface-border p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <div>
              <h3 className="font-bold text-sm text-text-primary">Water Tests Conducted</h3>
              <p className="text-[11px] text-text-secondary">Monthly test volume & verification rate</p>
            </div>
            <Link to="/admin/tests" className="text-xs font-semibold text-brand-700 hover:underline">
              Inspect Tests →
            </Link>
          </div>
          <TestsOverTimeChart data={testTrends} />
        </div>

        {/* Community Reports by Issue Category */}
        <div className="bg-white rounded-xl border border-surface-border p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <div>
              <h3 className="font-bold text-sm text-text-primary">Reports by Category</h3>
              <p className="text-[11px] text-text-secondary">Community observation distribution</p>
            </div>
            <Link to="/admin/reports" className="text-xs font-semibold text-brand-700 hover:underline">
              Manage Reports →
            </Link>
          </div>
          <ReportsByCategoryChart data={reportStats.byCategory} />
        </div>
      </div>

      {/* Second Row Charts: Status Distribution & Report Resolution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-surface-border p-5 shadow-xs space-y-3">
          <div className="pb-2 border-b border-surface-border">
            <h3 className="font-bold text-sm text-text-primary">Report Status Breakdown</h3>
            <p className="text-[11px] text-text-secondary">Submitted, In-review, and Resolved</p>
          </div>
          <ReportsByStatusChart data={reportStats.byStatus} />
        </div>

        {/* Recent System Activity / Audit Logs */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-surface-border p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <div>
              <h3 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                <History className="w-4 h-4 text-brand-700" />
                <span>Recent System Audit Activity</span>
              </h3>
              <p className="text-[11px] text-text-secondary">Cryptographically attributable event logs</p>
            </div>
            <Link to="/admin/audit-logs" className="text-xs font-semibold text-brand-700 hover:underline">
              Full Audit Trail →
            </Link>
          </div>

          {loading ? (
            <Skeleton className="h-44 w-full" />
          ) : recentLogs.length === 0 ? (
            <p className="text-xs text-text-secondary py-6 text-center">No audit activity logged yet.</p>
          ) : (
            <div className="divide-y divide-surface-border">
              {recentLogs.map((log) => (
                <div key={log._id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-text-primary font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                      {log.action}
                    </span>
                    <p className="text-text-secondary text-[11px]">
                      By <strong>{log.actorName || 'System'}</strong> on {log.entityType} ({log.entityId})
                    </p>
                  </div>
                  <span className="text-[11px] text-text-secondary shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
