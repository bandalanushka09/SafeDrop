import api from './api';

export const adminService = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, accountStatus) => api.patch(`/admin/users/${id}`, { accountStatus }),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getVillages: () => api.get('/villages'),
  createVillage: (data) => api.post('/villages', data),
  deleteVillage: (id) => api.delete(`/villages/${id}`),
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.patch('/settings', data),
};

