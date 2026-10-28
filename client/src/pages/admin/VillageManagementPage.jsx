import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { Building, PlusCircle, Trash2, MapPin, Users } from 'lucide-react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';

export const VillageManagementPage = () => {
  const { showToast } = useToast();
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    district: 'Central District',
    population: '',
    primaryContact: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchVillages = async () => {
    try {
      setLoading(true);
      const res = await adminService.getVillages();
      if (res.success) setVillages(res.data);
    } catch (err) {
      console.error('Failed to load villages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVillages();
  }, []);

  const handleSaveVillage = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminService.createVillage({
        ...formData,
        population: formData.population ? Number(formData.population) : 0,
      });
      showToast(`Village "${formData.name}" added successfully.`);
      setIsModalOpen(false);
      setFormData({ name: '', district: 'Central District', population: '', primaryContact: '' });
      fetchVillages();
    } catch (err) {
      showToast(err.message || 'Failed to add village', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: 'Village / Locality',
      accessor: 'name',
      cell: (row) => <span className="font-semibold text-text-primary text-xs">{row.name}</span>,
    },
    {
      header: 'District / Block',
      accessor: 'district',
      cell: (row) => <span className="text-xs text-text-secondary">{row.district}</span>,
    },
    {
      header: 'Estimated Population',
      accessor: 'population',
      cell: (row) => (
        <span className="text-xs text-text-secondary font-mono">
          {row.population ? row.population.toLocaleString() : 'Unrecorded'}
        </span>
      ),
    },
    {
      header: 'Panchayat Contact',
      accessor: 'primaryContact',
      cell: (row) => (
        <span className="text-xs text-text-secondary">{row.primaryContact || '—'}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'active',
      cell: (row) => (
        <Badge
          status={row.active !== false ? 'active' : 'deactivated'}
          text={row.active !== false ? 'Active' : 'Inactive'}
          size="xs"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Village & Locality Directory</h1>
          <p className="text-xs text-text-secondary mt-1">
            Maintain recognized administrative divisions, districts, and local contact points for source tagging.
          </p>
        </div>

        <Button variant="primary" icon={PlusCircle} onClick={() => setIsModalOpen(true)}>
          Add Village / Locality
        </Button>
      </div>

      <Table
        columns={columns}
        data={villages}
        loading={loading}
        emptyMessage="No villages registered in system."
      />

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add Administrative Village"
        >
          <form onSubmit={handleSaveVillage} className="space-y-4">
            <Input
              label="Village / Locality Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rampur"
              required
            />

            <Input
              label="District / Block"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              placeholder="e.g. East Block"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Estimated Population"
                type="number"
                value={formData.population}
                onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                placeholder="2500"
              />

              <Input
                label="Primary Contact (Phone / Desk)"
                value={formData.primaryContact}
                onChange={(e) => setFormData({ ...formData, primaryContact: e.target.value })}
                placeholder="+91 98765 00000"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                Save Village
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default VillageManagementPage;

