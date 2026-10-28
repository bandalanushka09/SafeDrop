import React, { useState, useEffect } from 'react';
import { sourceService } from '../../services/sourceService';
import { useToast } from '../../context/ToastContext';
import { MapPin, PlusCircle, Edit2, Archive, Search, Eye } from 'lucide-react';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';

export const SourceManagementPage = () => {
  const { showToast } = useToast();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [villageFilter, setVillageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'hand_pump',
    village: 'Rampur',
    address: '',
    latitude: '',
    longitude: '',
    description: '',
    status: 'active',
    servingPopulation: '',
  });
  const [saving, setSaving] = useState(false);

  // Archive confirm dialog
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await sourceService.getAll({
        page,
        limit: 15,
        village: villageFilter,
        status: statusFilter,
        type: typeFilter,
        search,
        includeArchived: 'true',
      });
      if (res.success) {
        setSources(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      console.error('Failed to load sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [page, villageFilter, statusFilter, typeFilter]);

  const handleOpenCreate = () => {
    setEditingSource(null);
    setFormData({
      name: '',
      type: 'hand_pump',
      village: 'Rampur',
      address: '',
      latitude: '',
      longitude: '',
      description: '',
      status: 'active',
      servingPopulation: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (src) => {
    setEditingSource(src);
    setFormData({
      name: src.name,
      type: src.type,
      village: src.village,
      address: src.address || '',
      latitude: src.coordinates?.latitude || '',
      longitude: src.coordinates?.longitude || '',
      description: src.description || '',
      status: src.status,
      servingPopulation: src.servingPopulation || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveSource = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingSource) {
        await sourceService.update(editingSource._id, formData);
        showToast(`Water source "${formData.name}" updated successfully.`);
      } else {
        await sourceService.create(formData);
        showToast(`Water source "${formData.name}" created successfully.`);
      }
      setIsModalOpen(false);
      fetchSources();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    try {
      setArchiving(true);
      await sourceService.delete(archiveTarget._id);
      showToast(`Water source archived and deactivated.`);
      setArchiveTarget(null);
      fetchSources();
    } catch (err) {
      showToast(err.message || 'Failed to archive', 'error');
    } finally {
      setArchiving(false);
    }
  };

  const columns = [
    {
      header: 'Source Name',
      accessor: 'name',
      cell: (row) => (
        <div>
          <span className="font-semibold text-text-primary block">{row.name}</span>
          <span className="text-[11px] text-text-secondary capitalize">
            {row.type?.replace(/_/g, ' ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Village / Address',
      accessor: 'village',
      cell: (row) => (
        <div>
          <span className="font-medium text-xs text-text-primary">{row.village}</span>
          <span className="text-[11px] text-text-secondary block truncate max-w-xs">{row.address}</span>
        </div>
      ),
    },
    {
      header: 'Operational Status',
      accessor: 'status',
      cell: (row) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Population Served',
      accessor: 'servingPopulation',
      cell: (row) => (
        <span className="text-xs text-text-secondary font-mono">
          {row.servingPopulation || 0} residents
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: '_id',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(row)} icon={Edit2}>
            Edit
          </Button>
          {!row.isArchived && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setArchiveTarget(row)}
              className="text-status-danger hover:bg-red-50"
              icon={Archive}
            >
              Archive
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Water Source Management</h1>
          <p className="text-xs text-text-secondary mt-1">
            Register, update, and manage operational statuses and coordinates for public water points.
          </p>
        </div>

        <Button variant="primary" icon={PlusCircle} onClick={handleOpenCreate}>
          Register Water Source
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-surface-border shadow-xs flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchSources();
          }}
          className="flex-1 min-w-[200px]"
        >
          <input
            type="text"
            placeholder="Search source name, address, village..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs px-3 py-1.5 border border-surface-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
          />
        </form>

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

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs border border-surface-border rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="under_inspection">Under Inspection</option>
          <option value="temporarily_unavailable">Temporarily Unavailable</option>
          <option value="deactivated">Deactivated</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs border border-surface-border rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
        >
          <option value="">All Types</option>
          <option value="hand_pump">Hand Pump</option>
          <option value="borewell">Borewell</option>
          <option value="open_well">Open Well</option>
          <option value="public_tap">Public Tap</option>
          <option value="water_tank">Water Tank</option>
        </select>
      </div>

      {/* Table */}
      <div>
        <Table
          columns={columns}
          data={sources}
          loading={loading}
          emptyMessage="No water sources recorded."
        />
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={15}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSource ? `Edit Source: ${editingSource.name}` : 'Register New Water Source'}
        >
          <form onSubmit={handleSaveSource} className="space-y-4">
            <Input
              label="Source Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Primary School Borewell #2"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Source Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder=""
                options={[
                  { value: 'hand_pump', label: 'Hand Pump' },
                  { value: 'borewell', label: 'Deep Borewell' },
                  { value: 'open_well', label: 'Open Well' },
                  { value: 'public_tap', label: 'Public Piped Tap' },
                  { value: 'water_tank', label: 'Water Storage Tank' },
                  { value: 'community_supply', label: 'Community Supply Line' },
                  { value: 'other', label: 'Other Source' },
                ]}
                required
              />

              <Input
                label="Village / Locality"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                required
              />
            </div>

            <Input
              label="Address / Descriptive Location"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Near West Gate, Behind Panchayat Office"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Latitude"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="19.076"
              />

              <Input
                label="Longitude"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="73.023"
              />

              <Input
                label="Est. Population"
                type="number"
                value={formData.servingPopulation}
                onChange={(e) => setFormData({ ...formData, servingPopulation: e.target.value })}
                placeholder="350"
              />
            </div>

            <Select
              label="Operational Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              placeholder=""
              options={[
                { value: 'active', label: 'Active (In Service)' },
                { value: 'under_inspection', label: 'Under Inspection (Sampled / Maintenance)' },
                { value: 'temporarily_unavailable', label: 'Temporarily Unavailable' },
                { value: 'deactivated', label: 'Deactivated / Decommissioned' },
              ]}
              required
            />

            <Textarea
              label="Notes & Description"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Installation details, aquifer depth, structural condition..."
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                {editingSource ? 'Update Water Source' : 'Register Source'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Archive Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchiveConfirm}
        title="Archive Water Source"
        message={`Are you sure you want to archive "${archiveTarget?.name}"? Historical test records will be retained, but this source will be marked as deactivated in public directories.`}
        confirmText="Archive Source"
        loading={archiving}
      />
    </div>
  );
};

export default SourceManagementPage;

