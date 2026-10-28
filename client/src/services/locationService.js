import api from './api';

export const locationService = {
  search: (q) => api.get('/location/search', { params: { q } }),
  reverse: (latitude, longitude) =>
    api.get('/location/reverse', { params: { latitude, longitude } }),
  getStates: () => api.get('/location/states'),
};
