import api from './api';

export const assignmentService = {
  async getAssignments(params = {}) {
    const res = await api.get('/assignments', { params });
    return res.data;
  },

  async createAssignment(data) {
    const res = await api.post('/assignments', data);
    return res.data;
  },

  async updateAssignment(id, updateData) {
    const res = await api.put(`/assignments/${id}`, updateData);
    return res.data;
  },

  async deleteAssignment(id) {
    const res = await api.delete(`/assignments/${id}`);
    return res.data;
  },
};
