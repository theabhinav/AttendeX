import api from './api';

export const notificationService = {
  async getNotifications(params = {}) {
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  async markAsRead(id) {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },

  async getVapidPublicKey() {
    const res = await api.get('/notifications/vapid-public-key');
    return res.data;
  },

  async subscribeWebPush(subscription) {
    const res = await api.post('/notifications/subscribe', subscription);
    return res.data;
  },

  async updatePreferences(preferences) {
    const res = await api.put('/notifications/preferences', preferences);
    return res.data;
  },
};
