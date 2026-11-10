import api from './api';

export const authService = {
  async register(userData) {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  async googleAuth(credentialToken) {
    const res = await api.post('/auth/google', { token: credentialToken });
    return res.data;
  },

  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token, password) {
    const res = await api.post('/auth/reset-password', { token, password });
    return res.data;
  },

  async getCurrentUser() {
    const res = await api.get('/users/profile');
    return res.data;
  },

  async updateProfile(profileData) {
    const res = await api.put('/auth/profile', profileData);
    return res.data;
  },

  async changePassword(currentPassword, newPassword) {
    const res = await api.put('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },

  async deleteAccount() {
    const res = await api.delete('/auth/account');
    return res.data;
  },
};
