import api from './api';

export const reportService = {
  getAll: (params) => api.get('/reports', { params }),
  getStats: () => api.get('/reports/stats'),
  getMyReports: () => api.get('/reports/mine'),
  getById: (id) => api.get(`/reports/${id}`),
  create: (data) => api.post('/reports', data),
  createPublic: (data) => api.post('/reports/public', data),
  track: (referenceId, phone) =>
    api.get('/reports/track', { params: { referenceId, ...(phone ? { phone } : {}) } }),
  checkDuplicate: (params) => api.get('/reports/duplicate-check', { params }),
  updateStatus: (id, data) => api.patch(`/reports/${id}/status`, data),
  assign: (id, reviewerId) => api.patch(`/reports/${id}/assign`, { reviewerId }),
  addNote: (id, note) => api.post(`/reports/${id}/notes`, { note }),
};
