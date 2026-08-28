import api from './api';

const notificationService = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markRead: (id)     => api.patch(`/notifications/${id}/read`),
  markAllRead: ()    => api.patch('/notifications/read-all'),
  generate: (expiryThresholdDays = 90) => api.post('/notifications/generate', { expiryThresholdDays }),
};

export default notificationService;
