import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { BarChart2, TrendingUp, Layers, MapPin, Calendar } from 'lucide-react';
import ParameterTrendChart from '../../components/charts/ParameterTrendChart';
import TestsOverTimeChart from '../../components/charts/TestsOverTimeChart';
import ReportsByCategoryChart from '../../components/charts/ReportsByCategoryChart';
import ReportsByStatusChart from '../../components/charts/ReportsByStatusChart';
import Table from '../../components/common/Table';
import Skeleton from '../../components/common/Skeleton';

export const AnalyticsPage = () => {
  const [testTrends, setTestTrends] = useState([]);
  const [paramTrends, setParamTrends] = useState([]);
  const [selectedParam, setSelectedParam] = useState('ph');
  const [villageStats, setVillageStats] = useState([]);
  const [reportStats, setReportStats] = useState({ byStatus: [], byCategory: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [testsRes, repRes, vilRes] = await Promise.all([
          analyticsService.getWaterTests({ parameter: selectedParam }),
          analyticsService.getReports(),
          analyticsService.getVillages(),
        ]);

        if (testsRes.success) {
          setTestTrends(testsRes.data.testsOverTime);
          setParamTrends(testsRes.data.parameterTrends);
        }
        if (repRes.success) setReportStats(repRes.data);
        if (vilRes.success) setVillageStats(vilRes.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedParam]);

  const villageColumns = [
    {
      header: 'Village / Locality',
      accessor: 'village',
      cell: (row) => <span className="font-semibold text-text-primary text-xs">{row.village}</span>,
    },
    {
      header: 'Monitored Sources',
      accessor: 'sourcesCount',
      cell: (row) => <span className="font-mono text-xs">{row.sourcesCount}</span>,
    },
    {
      header: 'Active Sources',
      accessor: 'activeSources',
      cell: (row) => (
        <span className="font-mono text-xs text-status-success font-medium">
          {row.activeSources}
        </span>
      ),
    },
    {
      header: 'Total Citizen Reports',
      accessor: 'reportsCount',
      cell: (row) => <span className="font-mono text-xs">{row.reportsCount}</span>,
    },
    {
      header: 'Open Unresolved Issues',
      accessor: 'openReports',
      cell: (row) => (
        <span
          className={`font-mono text-xs font-bold ${
            row.openReports > 0 ? 'text-status-warning' : 'text-slate-500'
          }`}
        >
          {row.openReports}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">System Analytics & Trends</h1>
        <p className="text-xs text-text-secondary mt-1">
          Longitudinal water quality trends, community reporting activity, and village-level operational oversight.
        </p>
      </div>

      {/* Row 1: Parameter Trends (Interactive) */}
      <div className="bg-white rounded-xl border border-surface-border p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-surface-border">
          <div>
            <h3 className="font-bold text-sm text-text-primary">
              Water Quality Measurement Trend Over Time
            </h3>
            <p className="text-[11px] text-text-secondary">
              Aggregated monthly averages from verified and reviewed testing records
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-text-secondary">Parameter:</span>
            <select
              value={selectedParam}
              onChange={(e) => setSelectedParam(e.target.value)}
              className="text-xs border border-surface-border rounded px-2.5 py-1 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-700"
            >
              <option value="ph">pH Value (Acidity / Alkalinity)</option>
              <option value="turbidity">Turbidity (NTU Cloudiness)</option>
              <option value="tds">Total Dissolved Solids (mg/L)</option>
              <option value="chlorine">Free Residual Chlorine (mg/L)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ParameterTrendChart data={paramTrends} parameter={selectedParam} />
        )}
      </div>

      {/* Row 2: Tests Over Time & Reports by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-surface-border p-5 shadow-xs space-y-3">
          <div className="pb-2 border-b border-surface-border">
            <h3 className="font-bold text-sm text-text-primary">Test Records Logged Over Time</h3>
            <p className="text-[11px] text-text-secondary">Monthly volume of verified vs unverified tests</p>
          </div>
          <TestsOverTimeChart data={testTrends} />
        </div>

        <div className="bg-white rounded-xl border border-surface-border p-5 shadow-xs space-y-3">
          <div className="pb-2 border-b border-surface-border">
            <h3 className="font-bold text-sm text-text-primary">Reports by Observation Category</h3>
            <p className="text-[11px] text-text-secondary">Distribution of water quality and infrastructure issues</p>
          </div>
          <ReportsByCategoryChart data={reportStats.byCategory} />
        </div>
      </div>

      {/* Row 3: Village-Level Summary Table */}
      <div className="bg-white rounded-xl border border-surface-border p-5 shadow-xs space-y-4">
        <div className="pb-2 border-b border-surface-border">
          <h3 className="font-bold text-sm text-text-primary">Village-Level Operational Distribution</h3>
          <p className="text-[11px] text-text-secondary">
            Comparative summary of water points, operational statuses, and citizen complaint volumes
          </p>
        </div>

        <Table
          columns={villageColumns}
          data={villageStats}
          loading={loading}
          emptyMessage="No village-level records available."
        />
      </div>
    </div>
  );
};

export default AnalyticsPage;

