import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { History, Shield, Filter, Clock, Search } from 'lucide-react';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAuditLogs({
        page,
        limit: 25,
        action: actionFilter,
        entityType: entityFilter,
      });
      if (res.success) {
        setLogs(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      cell: (row) => (
        <span className="text-xs text-text-secondary font-mono">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Actor',
      accessor: 'actorName',
      cell: (row) => (
        <div>
          <span className="font-semibold text-xs text-text-primary block">
            {row.actorName || 'System'}
          </span>
          <span className="text-[10px] text-text-secondary capitalize">
            {row.actorRole?.replace(/_/g, ' ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Action Taken',
      accessor: 'action',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-text-primary bg-slate-100 px-2 py-0.5 rounded">
          {row.action}
        </span>
      ),
    },
    {
      header: 'Target Entity',
      accessor: 'entityType',
      cell: (row) => (
        <div>
          <span className="text-xs font-medium text-text-primary block">{row.entityType}</span>
          <span className="text-[10px] text-text-secondary font-mono truncate block max-w-xs">
            ID: {row.entityId}
          </span>
        </div>
      ),
    },
    {
      header: 'Safe Metadata',
      accessor: 'safeMetadata',
      cell: (row) => (
        <span className="text-[11px] font-mono text-text-secondary max-w-xs block truncate">
          {row.safeMetadata ? JSON.stringify(row.safeMetadata) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">System Audit Trail</h1>
        <p className="text-xs text-text-secondary mt-1">
          Immutable event log tracking administrative role updates, source archiving, alert publications, and test recordings.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-surface-border shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs border border-surface-border rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
        >
          <option value="">All Entities</option>
          <option value="User">User</option>
          <option value="WaterSource">Water Source</option>
          <option value="WaterTest">Water Test</option>
          <option value="CommunityReport">Community Report</option>
          <option value="SafetyAlert">Safety Alert</option>
          <option value="RiskRule">Risk Rule</option>
          <option value="RiskFlag">Risk Flag</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs border border-surface-border rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
        >
          <option value="">All Actions</option>
          <option value="USER_REGISTERED">User Registered</option>
          <option value="USER_ROLE_ASSIGNED">Role Assigned</option>
          <option value="USER_STATUS_UPDATED">User Status Updated</option>
          <option value="WATER_SOURCE_CREATED">Source Created</option>
          <option value="WATER_SOURCE_UPDATED">Source Updated</option>
          <option value="WATER_SOURCE_ARCHIVED">Source Archived</option>
          <option value="WATER_TEST_RECORDED">Test Recorded</option>
          <option value="SAFETY_ALERT_PUBLISHED">Alert Published</option>
        </select>

        {(entityFilter || actionFilter) && (
          <button
            onClick={() => {
              setEntityFilter('');
              setActionFilter('');
            }}
            className="text-xs text-brand-700 hover:underline px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      <Table
        columns={columns}
        data={logs}
        loading={loading}
        emptyMessage="No audit log records found matching search filters."
      />

      <Pagination
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={25}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};

export default AuditLogsPage;

