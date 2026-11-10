import api from './api';

export const attendanceService = {
  async getAttendance(params = {}) {
    const res = await api.get('/attendance', { params });
    return res.data;
  },

  async markAttendance(record) {
    const res = await api.post('/attendance/mark', record);
    return res.data;
  },

  async updateAttendance(id, updateData) {
    const res = await api.put(`/attendance/${id}`, updateData);
    return res.data;
  },

  async getAnalytics(params = {}) {
    const res = await api.get('/attendance/analytics', { params });
    return res.data;
  },

  async getCalculator(subjectId) {
    const res = await api.get(`/attendance/calculator/${subjectId}`);
    return res.data;
  },

  async getTodayDashboard() {
    const res = await api.get('/attendance/dashboard-summary');
    return res.data;
  },

  async resetAttendance() {
    const res = await api.post('/attendance/reset');
    return res.data;
  },

  async generateLeaveLetter(data) {
    const res = await api.post('/attendance/generate-leave-letter', data);
    return res.data;
  },
};
