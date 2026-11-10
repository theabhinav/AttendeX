import api from './api';

export const classroomService = {
  async getAuthUrl() {
    const res = await api.get('/classroom/auth-url');
    return res.data;
  },

  async exchangeCode(code, redirectUri) {
    const res = await api.post('/classroom/exchange-code', { code, redirectUri });
    return res.data;
  },

  async getStatus() {
    const res = await api.get('/classroom/status');
    return res.data;
  },

  async syncClassroom() {
    const res = await api.post('/classroom/sync');
    return res.data;
  },

  async disconnect() {
    const res = await api.post('/classroom/disconnect');
    return res.data;
  },

  async submitAssignment(formData) {
    const res = await api.post('/classroom/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async unsubmitAssignment(assignmentId) {
    const res = await api.post('/classroom/unsubmit', { assignmentId });
    return res.data;
  },

  async getSubmissionDetails(assignmentId) {
    const res = await api.get(`/classroom/submission-details/${assignmentId}`);
    return res.data;
  },
};

export default classroomService;
