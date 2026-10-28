import api from './api';

export const analyticsService = {
  getSummary: () => api.get('/analytics/summary'),
  getWaterTests: (params) => api.get('/analytics/water-tests', { params }),
  getReports: () => api.get('/analytics/reports'),
  getAlerts: () => api.get('/analytics/alerts'),
  getVillages: () => api.get('/analytics/villages'),
};

