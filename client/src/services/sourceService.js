import api from './api';

export const sourceService = {
  getAll: (params) => api.get('/water-sources', { params }),
  getById: (id) => api.get(`/water-sources/${id}`),
  create: (data) => api.post('/water-sources', data),
  update: (id, data) => api.patch(`/water-sources/${id}`, data),
  delete: (id) => api.delete(`/water-sources/${id}`),
};

