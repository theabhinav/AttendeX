import api from './api';

export const taskService = {
  /**
   * Fetch tasks with filters, search, and sorting
   */
  async getTasks(params = {}) {
    const res = await api.get('/tasks', { params });
    return res.data;
  },

  /**
   * Get task overview summary metrics
   */
  async getSummary() {
    const res = await api.get('/tasks/summary');
    return res.data;
  },

  /**
   * Create a new task manually
   */
  async createTask(taskData) {
    const res = await api.post('/tasks', taskData);
    return res.data;
  },

  /**
   * Update task details
   */
  async updateTask(id, taskData) {
    const res = await api.put(`/tasks/${id}`, taskData);
    return res.data;
  },

  /**
   * Fast toggle completed status
   */
  async toggleTask(id) {
    const res = await api.patch(`/tasks/${id}/toggle`);
    return res.data;
  },

  /**
   * Delete a task
   */
  async deleteTask(id) {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  },

  /**
   * Bulk clear completed tasks
   */
  async clearCompleted() {
    const res = await api.delete('/tasks/completed/clear');
    return res.data;
  },

  /**
   * Process voice or natural language text command with Gemini AI
   */
  async processVoiceCommand(commandText, clientContext = {}) {
    const res = await api.post('/tasks/voice-command', { commandText, clientContext });
    return res.data;
  },

  /**
   * Execute confirmed voice action directly
   */
  async executeVoiceAction(actionData) {
    const res = await api.post('/tasks/voice-execute', actionData);
    return res.data;
  },
};

export default taskService;

