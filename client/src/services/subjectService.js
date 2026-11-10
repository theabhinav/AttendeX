import api from './api';

export const subjectService = {
  async getSubjects() {
    const res = await api.get('/subjects');
    return res.data;
  },

  async createSubject(subjectData) {
    const res = await api.post('/subjects', subjectData);
    return res.data;
  },

  async updateSubject(id, subjectData) {
    const res = await api.put(`/subjects/${id}`, subjectData);
    return res.data;
  },

  async deleteSubject(id) {
    const res = await api.delete(`/subjects/${id}`);
    return res.data;
  },
};
