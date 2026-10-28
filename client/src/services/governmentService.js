import api from './api';

export const governmentService = {
  getConfiguration: () => api.get('/government/configuration'),
  submitReport: (reportId) => api.post('/government/submit-report', { reportId }),
  getDepartments: () => api.get('/government/departments'),
  createDepartment: (data) => api.post('/government/departments', data),
  updateDepartment: (id, data) => api.patch(`/government/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/government/departments/${id}`),
};
