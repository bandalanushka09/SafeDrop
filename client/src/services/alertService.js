import api from './api';

export const alertService = {
  getAll: (params) => api.get('/alerts', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  create: (data) => api.post('/alerts', data),
  update: (id, data) => api.patch(`/alerts/${id}`, data),
  publish: (id) => api.post(`/alerts/${id}/publish`),
  close: (id, reason) => api.post(`/alerts/${id}/close`, { closeReason: reason }),
};

