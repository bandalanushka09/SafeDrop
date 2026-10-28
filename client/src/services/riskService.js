import api from './api';

export const riskService = {
  getRules: () => api.get('/risk/rules'),
  createRule: (data) => api.post('/risk/rules', data),
  updateRule: (id, data) => api.patch(`/risk/rules/${id}`, data),
  getFlags: (params) => api.get('/risk/flags', { params }),
  getFlagById: (id) => api.get(`/risk/flags/${id}`),
  reviewFlag: (id, data) => api.patch(`/risk/flags/${id}/review`, data),
};

