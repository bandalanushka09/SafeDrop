import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Users, Search, Shield, Activity, User, Edit2, ShieldAlert } from 'lucide-react';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';

export const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Selected user for role/status editing modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalRole, setModalRole] = useState('');
  const [modalStatus, setModalStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({
        page,
        limit: 15,
        role: roleFilter,
        status: statusFilter,
        search,
      });
      if (res.success) {
        setUsers(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setModalRole(user.role);
    setModalStatus(user.accountStatus);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSaving(true);
      if (modalRole !== selectedUser.role) {
        await adminService.updateUserRole(selectedUser._id, modalRole);
      }
      if (modalStatus !== selectedUser.accountStatus) {
        await adminService.updateUserStatus(selectedUser._id, modalStatus);
      }
      showToast(`User ${selectedUser.name} updated successfully.`);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: 'User Name / Email',
      accessor: 'name',
      cell: (row) => (
        <div>
          <span className="font-semibold text-text-primary block">{row.name}</span>
          <span className="text-[11px] text-text-secondary">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Assigned Village',
      accessor: 'village',
      cell: (row) => <span className="text-xs text-text-secondary">{row.village || 'General Area'}</span>,
    },
    {
      header: 'Role',
      accessor: 'role',
      cell: (row) => <Badge status={row.role} size="sm" />,
    },
    {
      header: 'Account Status',
      accessor: 'accountStatus',
      cell: (row) => <Badge status={row.accountStatus} size="sm" />,
    },
    {
      header: 'Registered',
      accessor: 'createdAt',
      cell: (row) => (
        <span className="text-xs text-text-secondary">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: '_id',
      align: 'right',
      cell: (row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleOpenEdit(row)}
          icon={Edit2}
        >
          Edit Access
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
        <p className="text-xs text-text-secondary mt-1">
          Review registered accounts, assign health worker or administrator privileges, and manage account statuses.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-surface-border shadow-xs flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs px-3 py-1.5 border border-surface-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
          />
        </form>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs border border-surface-border rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
        >
          <option value="">All Roles</option>
          <option value="villager">Villager</option>
          <option value="health_worker">Health Worker</option>
          <option value="admin">Administrator</option>
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
          <option value="suspended">Suspended</option>
          <option value="deactivated">Deactivated</option>
        </select>

        {(roleFilter || statusFilter || search) && (
          <button
            onClick={() => {
              setRoleFilter('');
              setStatusFilter('');
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
          data={users}
          loading={loading}
          emptyMessage="No users found matching search criteria."
        />
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={15}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Edit Role & Status Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`Edit Account: ${selectedUser.name}`}
          subtitle={`Email: ${selectedUser.email}`}
        >
          <form onSubmit={handleSaveUser} className="space-y-4">
            <Select
              label="Assigned System Role"
              value={modalRole}
              onChange={(e) => setModalRole(e.target.value)}
              placeholder=""
              options={[
                { value: 'villager', label: 'Villager (Community Member - Report only)' },
                { value: 'health_worker', label: 'Health Worker (Water Testing & Report Review)' },
                { value: 'admin', label: 'System Administrator (Full Oversight)' },
              ]}
              required
            />

            <Select
              label="Account Access Status"
              value={modalStatus}
              onChange={(e) => setModalStatus(e.target.value)}
              placeholder=""
              options={[
                { value: 'active', label: 'Active (Permitted Sign-in)' },
                { value: 'suspended', label: 'Suspended (Temporary lock)' },
                { value: 'deactivated', label: 'Deactivated (Revoked)' },
              ]}
              required
            />

            {selectedUser.role === 'admin' && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                Notice: The backend prohibits removing or suspending the final active administrator to prevent lockout.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
              <Button variant="secondary" onClick={() => setSelectedUser(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UserManagementPage;

