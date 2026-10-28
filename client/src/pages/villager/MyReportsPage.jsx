import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import {
  ClipboardList,
  PlusCircle,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const MyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      const res = await reportService.getMyReports();
      if (res.success) {
        setReports(res.data);
      }
    } catch (err) {
      console.error('Failed to load user reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const filteredReports = statusFilter
    ? reports.filter((r) => r.status === statusFilter)
    : reports;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Water Safety Reports</h1>
          <p className="text-xs text-text-secondary mt-1">
            Track reports you have submitted regarding water quality, unusual odor or color, and damaged infrastructure.
          </p>
        </div>

        <Link to="/submit-report">
          <Button variant="primary" icon={PlusCircle}>
            Submit New Report
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg border border-surface-border shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-secondary uppercase">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-surface-border rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
          >
            <option value="">All Statuses ({reports.length})</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="action_required">Action Required</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="text-xs text-brand-700 hover:underline"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Reports Feed */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-lg border border-surface-border p-8">
          <EmptyState
            icon={ClipboardList}
            title="No Reports Found"
            message={
              statusFilter
                ? 'No reports found matching the selected status.'
                : 'You have not submitted any water-quality reports yet.'
            }
            action={
              <Link to="/submit-report">
                <Button variant="primary" icon={PlusCircle} size="sm">
                  Report a Water Problem
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report._id}
              className="bg-white rounded-lg border border-surface-border p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-text-primary capitalize">
                    {report.category?.replace(/_/g, ' ')}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {report.village}
                      {report.sourceId?.name ? ` • Source: ${report.sourceId.name}` : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Observed: {new Date(report.observedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Reported: {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Badge status={report.status} size="sm" />
              </div>

              {/* Description */}
              <p className="text-xs text-text-primary bg-slate-50 p-3 rounded border border-surface-border leading-relaxed">
                {report.description}
              </p>

              {/* Attached Photo if available */}
              {report.photoUrl && (
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-text-secondary block mb-1">
                    Supporting Photo:
                  </span>
                  <img
                    src={report.photoUrl}
                    alt="Supporting observation"
                    className="w-36 h-28 object-cover rounded border border-surface-border"
                  />
                </div>
              )}

              {/* Public Staff Response */}
              {report.publicResponse && (
                <div className="bg-teal-50 border border-brand-200 rounded p-3 text-xs space-y-1">
                  <div className="font-semibold text-brand-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-700" />
                    <span>Response from Village Health Team:</span>
                  </div>
                  <p className="text-text-primary leading-relaxed">{report.publicResponse}</p>
                </div>
              )}

              {/* Resolution Details */}
              {report.resolutionDetails && (
                <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs space-y-1">
                  <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                    <span>Resolution Notes:</span>
                  </div>
                  <p className="text-text-primary leading-relaxed">{report.resolutionDetails}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;

