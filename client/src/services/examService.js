import api from './api';

export const examService = {
  async getExams(params = {}) {
    const res = await api.get('/exams', { params });
    return res.data;
  },

  async createExam(data) {
    const res = await api.post('/exams', data);
    return res.data;
  },

  async updateExam(id, updateData) {
    const res = await api.put(`/exams/${id}`, updateData);
    return res.data;
  },

  async deleteExam(id) {
    const res = await api.delete(`/exams/${id}`);
    return res.data;
  },
};
