import api from './api';

export const chatService = {
  async getConversations() {
    const res = await api.get('/chat/conversations');
    return res.data;
  },

  async createConversation(title = 'New Academic Chat') {
    const res = await api.post('/chat/conversations', { title });
    return res.data;
  },

  async getConversationMessages(id) {
    const res = await api.get(`/chat/conversations/${id}`);
    return res.data;
  },

  async sendMessage(id, message) {
    const res = await api.post(`/chat/conversations/${id}/message`, { message });
    return res.data;
  },

  async renameConversation(id, title) {
    const res = await api.put(`/chat/conversations/${id}`, { title });
    return res.data;
  },

  async deleteConversation(id) {
    const res = await api.delete(`/chat/conversations/${id}`);
    return res.data;
  },
};
