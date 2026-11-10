import api from './api';

export const userService = {
  async getProfile() {
    const res = await api.get('/users/profile');
    return res.data;
  },

  async updateProfile(profileData) {
    const res = await api.put('/users/profile', profileData);
    return res.data;
  },

  async changePassword(currentPassword, newPassword) {
    const res = await api.put('/users/password', { currentPassword, newPassword });
    return res.data;
  },

  async deleteAccount(password) {
    const res = await api.delete('/users/account', { data: { password } });
    return res.data;
  },
};
