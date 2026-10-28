import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sourceService } from '../../services/sourceService';
import { useAuth } from '../../context/AuthContext';
import {
  MapPin,
  Search,
  Filter,
  Eye,
  PlusCircle,
  Activity,
  Layers,
} from 'lucide-react';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import WaterSourceMap from '../../components/maps/WaterSourceMap';

export const PublicSourcesPage = () => {
  const { isRole } = useAuth();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [village, setVillage] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'map'

  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await sourceService.getAll({
        page,
        limit: 15,
        search,
        village,
        status,
        type,
      });
      if (res.success) {
        setSources(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      console.error('Failed to load water sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [page, village, status, type]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSources();
  };

  const columns = [
    {
      header: 'Source Name',
      accessor: 'name',
      cell: (row) => (
        <div>
          <Link
            to={`/sources/${row._id}`}
            className="font-semibold text-brand-700 hover:underline block"
          >
            {row.name}
          </Link>
          <span className="text-[11px] text-text-secondary capitalize">
            {row.type?.replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Village / Locality',
      accessor: 'village',
      cell: (row) => (
        <div>
          <span className="font-medium">{row.village}</span>
          {row.address && (
            <span className="text-[11px] text-text-secondary block truncate max-w-xs">
              {row.address}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Operational Status',
      accessor: 'status',
      cell: (row) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Last Tested',
      accessor: 'lastTestedAt',
      cell: (row) => (
        <span className="text-xs text-text-secondary">
          {row.lastTestedAt ? new Date(row.lastTestedAt).toLocaleDateString() : 'No tests on record'}
        </span>
      ),
    },
    {
      header: 'Coordinates',
      accessor: 'coordinates',
      cell: (row) => (
        <span className="text-xs text-text-secondary font-mono">
          {row.coordinates?.latitude
            ? `${row.coordinates.latitude.toFixed(3)}, ${row.coordinates.longitude.toFixed(3)}`
            : 'Unspecified'}
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: '_id',
      align: 'right',
      cell: (row) => (
        <Link
          to={`/sources/${row._id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-700 bg-teal-50 hover:bg-teal-100 rounded border border-brand-200 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Details</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Water Source Directory</h1>
          <p className="text-xs text-text-secondary mt-1">
            Registered drinking-water points, public hand pumps, wells, and communal storage tanks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isRole(['health_worker', 'admin']) && (
            <Link
              to={isRole('admin') ? '/admin/sources/new' : '/health-worker/sources/new'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold bg-brand-700 hover:bg-brand-800 text-white transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register New Source</span>
            </Link>
          )}

          <div className="bg-white border border-surface-border rounded p-0.5 flex items-center">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'table' ? 'bg-brand-700 text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'map' ? 'bg-brand-700 text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Interactive Map
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-surface-border shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by source name, locality, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-surface-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
            />
          </div>

          <select
            value={village}
            onChange={(e) => {
              setVillage(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-surface-border rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
          >
            <option value="">All Villages</option>
            <option value="Rampur">Rampur</option>
            <option value="Sunderpur">Sunderpur</option>
            <option value="Devgarh">Devgarh</option>
            <option value="Bheemtal">Bheemtal</option>
            <option value="Central District">Central District</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-surface-border rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="under_inspection">Under Inspection</option>
            <option value="temporarily_unavailable">Temporarily Unavailable</option>
          </select>

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-surface-border rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
          >
            <option value="">All Source Types</option>
            <option value="hand_pump">Hand Pump</option>
            <option value="borewell">Borewell</option>
            <option value="open_well">Open Well</option>
            <option value="public_tap">Public Tap</option>
            <option value="water_tank">Water Tank</option>
          </select>

          <Button type="submit" size="sm" variant="primary">
            Search
          </Button>
        </form>
      </div>

      {/* Main View Area */}
      {viewMode === 'table' ? (
        <div>
          <Table
            columns={columns}
            data={sources}
            loading={loading}
            emptyMessage="No registered water sources found matching your criteria."
          />
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={15}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      ) : (
        <WaterSourceMap sources={sources} height="560px" />
      )}
    </div>
  );
};

export default PublicSourcesPage;

