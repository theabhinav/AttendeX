import api from './api';

export const timetableService = {
  async getTimetable(params = {}) {
    const res = await api.get('/timetable', { params });
    return res.data;
  },

  async createClass(classData) {
    const res = await api.post('/timetable', classData);
    return res.data;
  },

  async updateClass(id, classData) {
    const res = await api.put(`/timetable/${id}`, classData);
    return res.data;
  },

  async deleteClass(id) {
    const res = await api.delete(`/timetable/${id}`);
    return res.data;
  },

  async scanTimetableFile(formData, onUploadProgress) {
    const res = await api.post('/timetable/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return res.data;
  },

  async parseTimetableText(text, studentGroup = '') {
    const res = await api.post('/timetable/parse-text', { text, studentGroup });
    return res.data;
  },

  async confirmTimetable(payload) {
    const res = await api.post('/timetable/confirm', payload);
    return res.data;
  },

  async importTimetable(jsonData) {
    const res = await api.post('/timetable/import', jsonData);
    return res.data;
  },

  async exportTimetable() {
    const res = await api.get('/timetable/export');
    return res.data;
  },

  async addDateException(payload) {
    const res = await api.post('/timetable/exception', payload);
    return res.data;
  },

  async downloadICS() {
    const res = await api.get('/timetable/export-ics', { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'attendx_timetable.ics');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
