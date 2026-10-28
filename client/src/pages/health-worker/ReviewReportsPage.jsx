import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import { ClipboardList, Search, Filter, Eye, CheckCircle2 } from 'lucide-react';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';

export const ReviewReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportService.getAll({
        page,
        limit: 15,
        status: statusFilter,
        category: categoryFilter,
        search,
      });
      if (res.success) {
        setReports(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      console.error('Failed to load reports for review:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  const columns = [
    {
      header: 'Issue Category',
      accessor: 'category',
      cell: (row) => (
        <div>
          <Link
            to={`/health-worker/reports/${row._id}`}
            className="font-semibold text-brand-700 hover:underline block capitalize"
          >
            {row.category?.replace(/_/g, ' ')}
          </Link>
          <span className="block font-mono text-[10px] text-text-secondary">
            {row.referenceId || 'No reference'}
          </span>
        </div>
      ),
    },
    {
      header: 'Locality / Source',
      accessor: 'village',
      cell: (row) => (
        <div>
          <span className="font-medium text-xs text-text-primary block">{row.village}</span>
          <span className="text-[11px] text-text-secondary truncate block max-w-xs">
            {[row.taluka, row.district, row.state].filter(Boolean).join(', ') || row.locationDescription || 'General area'}
          </span>
        </div>
      ),
    },
    {
      header: 'Concern Types',
      accessor: 'concerns',
      cell: (row) => (
        <span className="text-xs text-text-secondary">
          {(row.concerns || [row.category]).map((concern) => concern?.replace(/_/g, ' ')).filter(Boolean).join(', ')}
        </span>
      ),
    },
    {
      header: 'Water Source / Risk',
      accessor: 'waterSourceName',
      cell: (row) => (
        <div>
          <span className="block text-xs text-text-primary">{row.waterSourceName || row.sourceId?.name || 'Not specified'}</span>
          <span className="text-[11px] text-text-secondary">{row.sourceId?.riskLevel?.replace(/_/g, ' ') || 'Risk unknown'}</span>
        </div>
      ),
    },
    {
      header: 'Reported By',
      accessor: 'reporterId',
      cell: (row) => (
        <span className="text-xs text-text-secondary">
          {row.fullName || row.reporterId?.name || 'Community Member'}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: 'createdAt',
      cell: (row) => (
        <span className="text-xs text-text-secondary">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Official Submission',
      accessor: 'officialSubmissionStatus',
      cell: (row) => (
        <span className="text-xs text-text-secondary">
          {row.officialSubmissionStatus?.replace(/_/g, ' ') || 'Not prepared'}
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: '_id',
      align: 'right',
      cell: (row) => (
        <Link
          to={`/health-worker/reports/${row._id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-700 bg-teal-50 hover:bg-teal-100 rounded border border-brand-200 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Review</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Community Report Review</h1>
        <p className="text-xs text-text-secondary mt-1">
          Review, investigate, assign, and update statuses of community water problem observations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-surface-border shadow-xs flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search report description, village..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs px-3 py-1.5 border border-surface-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs border border-surface-border rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted (New)</option>
          <option value="under_review">Under Review</option>
          <option value="action_required">Action Required</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs border border-surface-border rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
        >
          <option value="">All Issue Categories</option>
          <option value="unusual_color">Unusual Color</option>
          <option value="unusual_odor">Unusual Odor</option>
          <option value="visible_debris">Visible Debris</option>
          <option value="suspected_contamination">Suspected Contamination</option>
          <option value="damaged_infrastructure">Damaged Infrastructure</option>
          <option value="sewage_leakage">Sewage Leakage</option>
          <option value="supply_interruption">Supply Interruption</option>
          <option value="illness_cluster">Illness Cluster</option>
        </select>

        {(statusFilter || categoryFilter || search) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setCategoryFilter('');
              setSearch('');
            }}
            className="text-xs text-brand-700 hover:underline px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div>
        <Table
          columns={columns}
          data={reports}
          loading={loading}
          emptyMessage="No community reports matching criteria."
        />
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={15}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
};

export default ReviewReportsPage;
