import api from './api';

export const testService = {
  getAll: (params) => api.get('/water-tests', { params }),
  getById: (id) => api.get(`/water-tests/${id}`),
  create: (data) => api.post('/water-tests', data),
  update: (id, data) => api.patch(`/water-tests/${id}`, data),
  getBySource: (sourceId) => api.get(`/water-tests/source/${sourceId}`),
};

