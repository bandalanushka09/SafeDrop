import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { testService } from '../../services/testService';
import { useAuth } from '../../context/AuthContext';
import { FlaskConical, PlusCircle, Search, Calendar, MapPin, Eye } from 'lucide-react';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';

export const TestHistoryPage = () => {
  const { isRole } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [villageFilter, setVillageFilter] = useState('');

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await testService.getAll({
        page,
        limit: 15,
        status: statusFilter,
        village: villageFilter,
      });
      if (res.success) {
        setTests(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      console.error('Failed to load tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [page, statusFilter, villageFilter]);

  const columns = [
    {
      header: 'Source / Locality',
      accessor: 'sourceId',
      cell: (row) => (
        <div>
          <Link
            to={`/sources/${row.sourceId?._id}`}
            className="font-semibold text-brand-700 hover:underline block"
          >
            {row.sourceId?.name || 'Water Source'}
          </Link>
          <span className="text-[11px] text-text-secondary">
            {row.sourceId?.village} • {row.sourceId?.type?.replace(/_/g, ' ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Test Date',
      accessor: 'testedAt',
      cell: (row) => (
        <span className="text-xs text-text-secondary">
          {new Date(row.testedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Tester / Method',
      accessor: 'testerName',
      cell: (row) => (
        <div>
          <span className="text-xs font-medium text-text-primary block">
            {row.testerName || 'Staff Tester'}
          </span>
          <span className="text-[11px] text-text-secondary capitalize">
            {row.testingMethod?.replace(/_/g, ' ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Key Parameters',
      accessor: 'parameters',
      cell: (row) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {row.parameters?.slice(0, 3).map((p, idx) => (
            <span
              key={idx}
              className="text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono"
            >
              {p.parameter.toUpperCase()}: {p.value} {p.unit}
            </span>
          ))}
          {row.parameters?.length > 3 && (
            <span className="text-[10px] text-text-secondary font-medium self-center">
              +{row.parameters.length - 3} more
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Verification Status',
      accessor: 'verificationStatus',
      cell: (row) => <Badge status={row.verificationStatus} size="sm" />,
    },
    {
      header: 'Details',
      accessor: '_id',
      align: 'right',
      cell: (row) => (
        <Link
          to={`/sources/${row.sourceId?._id}`}
          className="p-1.5 text-text-secondary hover:text-brand-700 rounded transition-colors inline-block"
        >
          <Eye className="w-4 h-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Water Testing Records</h1>
          <p className="text-xs text-text-secondary mt-1">
            Historical measurements, laboratory tests, and chemical parameters for monitored sources.
          </p>
        </div>

        {isRole(['health_worker', 'admin']) && (
          <Link to="/health-worker/tests/new">
            <Button variant="primary" icon={PlusCircle}>
              Record New Test
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-surface-border shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs border border-surface-border rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
        >
          <option value="">All Verification Statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={villageFilter}
          onChange={(e) => {
            setVillageFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs border border-surface-border rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
        >
          <option value="">All Villages</option>
          <option value="Rampur">Rampur</option>
          <option value="Sunderpur">Sunderpur</option>
          <option value="Devgarh">Devgarh</option>
          <option value="Bheemtal">Bheemtal</option>
          <option value="Central District">Central District</option>
        </select>

        {(statusFilter || villageFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setVillageFilter('');
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
          data={tests}
          loading={loading}
          emptyMessage="No water-quality test records matching criteria."
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

export default TestHistoryPage;

