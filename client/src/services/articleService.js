import api from './api';

export const articleService = {
  getAll: (params) => api.get('/articles', { params }),
  getBySlug: (slug) => api.get(`/articles/${slug}`),
  create: (data) => api.post('/articles', data),
  update: (id, data) => api.patch(`/articles/${id}`, data),
  delete: (id) => api.delete(`/articles/${id}`),
};

