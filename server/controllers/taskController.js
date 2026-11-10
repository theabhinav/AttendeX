import Task from '../models/Task.js';
import { processVoiceCommand } from '../services/voiceAssistantService.js';

export const taskController = {
  /**
   * Get all tasks with flexible filtering, search, and sorting
   * GET /api/tasks
   */
  async getTasks(req, res, next) {
    try {
      const userId = req.user._id;
      const { category, priority, status = 'all', search, sort = 'dueDate_asc' } = req.query;

      const query = { userId };

      // Category filter
      if (category && category !== 'ALL') {
        query.category = category;
      }

      // Priority filter
      if (priority && priority !== 'ALL') {
        query.priority = priority;
      }

      // Status filter
      const todayStr = new Date().toISOString().split('T')[0];
      if (status === 'completed') {
        query.completed = true;
      } else if (status === 'pending') {
        query.completed = false;
      } else if (status === 'today') {
        query.completed = false;
        query.dueDate = todayStr;
      } else if (status === 'upcoming') {
        query.completed = false;
        query.dueDate = { $gt: todayStr };
      } else if (status === 'overdue') {
        query.completed = false;
        query.dueDate = { $lt: todayStr, $ne: null };
      }

      // Keyword search
      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ title: regex }, { description: regex }];
      }

      // Sorting
      let sortOptions = {};
      if (sort === 'newest') {
        sortOptions = { createdAt: -1 };
      } else if (sort === 'priority') {
        // High -> Medium -> Low
        sortOptions = { priority: 1, dueDate: 1 };
      } else if (sort === 'dueDate_desc') {
        sortOptions = { dueDate: -1, dueTime: -1 };
      } else {
        // Default: earliest deadline first
        sortOptions = { dueDate: 1, dueTime: 1, createdAt: -1 };
      }

      const tasks = await Task.find(query).sort(sortOptions);

      res.status(200).json({
        success: true,
        count: tasks.length,
        tasks,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get overall task summary metrics for dashboard and widgets
   * GET /api/tasks/summary
   */
  async getSummary(req, res, next) {
    try {
      const userId = req.user._id;
      const todayStr = new Date().toISOString().split('T')[0];

      const allTasks = await Task.find({ userId });

      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter((t) => t.completed).length;
      const pendingTasks = allTasks.filter((t) => !t.completed).length;
      const overdueTasks = allTasks.filter(
        (t) => !t.completed && t.dueDate && t.dueDate < todayStr
      ).length;
      const todayTasks = allTasks.filter(
        (t) => !t.completed && t.dueDate === todayStr
      ).length;
      const highPriorityCount = allTasks.filter(
        (t) => !t.completed && t.priority === 'High'
      ).length;

      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      res.status(200).json({
        success: true,
        summary: {
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          todayTasks,
          highPriorityCount,
          completionRate,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Create a task manually
   * POST /api/tasks
   */
  async createTask(req, res, next) {
    try {
      const userId = req.user._id;
      const {
        title,
        description,
        category,
        priority,
        dueDate,
        dueTime,
        reminderEnabled,
        reminderMinutes,
        subjectId,
        source,
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Task title is required.',
        });
      }

      const task = await Task.create({
        userId,
        title: title.trim(),
        description: description ? description.trim() : '',
        category: category || 'Academics',
        priority: priority || 'Medium',
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : true,
        reminderMinutes: reminderMinutes || 30,
        subjectId: subjectId || null,
        source: source || 'manual',
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully!',
        task,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update task
   * PUT /api/tasks/:id
   */
  async updateTask(req, res, next) {
    try {
      const userId = req.user._id;
      const { id } = req.params;

      const task = await Task.findOne({ _id: id, userId });
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found or unauthorized',
        });
      }

      const fields = [
        'title',
        'description',
        'category',
        'priority',
        'dueDate',
        'dueTime',
        'completed',
        'reminderEnabled',
        'reminderMinutes',
        'subjectId',
      ];

      fields.forEach((f) => {
        if (req.body[f] !== undefined) {
          task[f] = req.body[f];
        }
      });

      if (req.body.completed !== undefined) {
        task.completedAt = req.body.completed ? new Date() : null;
      }

      await task.save();

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        task,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Fast toggle completed state
   * PATCH /api/tasks/:id/toggle
   */
  async toggleTask(req, res, next) {
    try {
      const userId = req.user._id;
      const { id } = req.params;

      const task = await Task.findOne({ _id: id, userId });
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found or unauthorized',
        });
      }

      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date() : null;
      await task.save();

      res.status(200).json({
        success: true,
        message: task.completed ? 'Task completed!' : 'Task reopened',
        task,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete single task
   * DELETE /api/tasks/:id
   */
  async deleteTask(req, res, next) {
    try {
      const userId = req.user._id;
      const { id } = req.params;

      const deleted = await Task.findOneAndDelete({ _id: id, userId });
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Task not found or unauthorized',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Bulk delete completed tasks
   * DELETE /api/tasks/completed/clear
   */
  async clearCompleted(req, res, next) {
    try {
      const userId = req.user._id;
      const result = await Task.deleteMany({ userId, completed: true });

      res.status(200).json({
        success: true,
        message: `Cleared ${result.deletedCount} completed tasks.`,
        deletedCount: result.deletedCount,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Process voice/text command with AI Intent Parsing
   * POST /api/tasks/voice-command
   */
  async processVoice(req, res, next) {
    try {
      const userId = req.user._id;
      const { commandText, clientContext } = req.body;

      if (!commandText || !commandText.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Voice or text command is required.',
        });
      }

      const result = await processVoiceCommand(userId, commandText.trim(), clientContext);

      // AUTOMATIC TASK EXECUTION IN DATABASE:
      // When a user asks to add or complete a task by voice, persist it directly to MongoDB
      let savedTask = null;
      let executed = false;

      if (result.intent === 'CREATE_TASK' && result.task && result.task.title) {
        savedTask = await Task.create({
          userId,
          title: result.task.title.trim(),
          description: result.task.description || '',
          category: result.task.category || 'Academics',
          priority: result.task.priority || 'Medium',
          dueDate: result.task.dueDate || null,
          dueTime: result.task.dueTime || null,
          source: 'voice_assistant',
        });
        executed = true;
        result.message = `Task '${savedTask.title}' added successfully!`;
      } else if (result.intent === 'COMPLETE_TASK' && result.matchedTaskId) {
        savedTask = await Task.findOneAndUpdate(
          { _id: result.matchedTaskId, userId },
          { completed: true, completedAt: new Date() },
          { new: true }
        );
        if (savedTask) {
          executed = true;
          result.message = `Marked '${savedTask.title}' as completed!`;
        }
      } else if (result.intent === 'UPDATE_TASK' && result.matchedTaskId) {
        const updatePayload = {};
        if (result.task?.title) updatePayload.title = result.task.title;
        if (result.task?.dueDate !== undefined) updatePayload.dueDate = result.task.dueDate;
        if (result.task?.dueTime !== undefined) updatePayload.dueTime = result.task.dueTime;
        if (result.task?.priority) updatePayload.priority = result.task.priority;
        if (result.task?.category) updatePayload.category = result.task.category;

        savedTask = await Task.findOneAndUpdate(
          { _id: result.matchedTaskId, userId },
          updatePayload,
          { new: true }
        );
        if (savedTask) {
          executed = true;
          result.message = `Updated task '${savedTask.title}'.`;
        }
      }

      res.status(200).json({
        success: true,
        executed,
        ...result,
        task: savedTask || result.task,
      });
    } catch (err) {
      console.error('[VoiceCommandError]', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to process voice command',
        intent: 'HELP',
        speechResponse: "Sorry, I couldn't understand that command. Please try speaking clearly or typing your task.",
        speechHindi: "माफ़ कीजिए, मैं समझ नहीं पाया। कृपया दोबारा बोलें।",
      });
    }
  },

  /**
   * Execute confirmed voice action directly in database
   * POST /api/tasks/voice-execute
   */
  async executeVoiceAction(req, res, next) {
    try {
      const userId = req.user._id;
      const { intent, task: taskData, matchedTaskId, bulkCompleted } = req.body;

      let resultMessage = 'Action completed';
      let affectedTask = null;

      if (intent === 'CREATE_TASK') {
        if (!taskData || !taskData.title) {
          return res.status(400).json({ success: false, message: 'Valid task title is required' });
        }

        affectedTask = await Task.create({
          userId,
          title: taskData.title.trim(),
          description: taskData.description || '',
          category: taskData.category || 'Academics',
          priority: taskData.priority || 'Medium',
          dueDate: taskData.dueDate || null,
          dueTime: taskData.dueTime || null,
          source: 'voice_assistant',
        });
        resultMessage = `Task '${affectedTask.title}' added successfully!`;
      } else if (intent === 'COMPLETE_TASK') {
        if (!matchedTaskId) {
          return res.status(400).json({ success: false, message: 'No matching task found to complete' });
        }

        affectedTask = await Task.findOneAndUpdate(
          { _id: matchedTaskId, userId },
          { completed: true, completedAt: new Date() },
          { new: true }
        );
        resultMessage = `Marked '${affectedTask?.title || 'task'}' as completed!`;
      } else if (intent === 'DELETE_TASK') {
        if (bulkCompleted) {
          const deleteRes = await Task.deleteMany({ userId, completed: true });
          resultMessage = `Deleted ${deleteRes.deletedCount} completed tasks.`;
        } else if (matchedTaskId) {
          affectedTask = await Task.findOneAndDelete({ _id: matchedTaskId, userId });
          resultMessage = `Deleted task '${affectedTask?.title || 'task'}'.`;
        } else {
          return res.status(400).json({ success: false, message: 'No task specified for deletion' });
        }
      } else if (intent === 'UPDATE_TASK') {
        if (!matchedTaskId) {
          return res.status(400).json({ success: false, message: 'No matching task found to update' });
        }

        const updatePayload = {};
        if (taskData.title) updatePayload.title = taskData.title;
        if (taskData.dueDate !== undefined) updatePayload.dueDate = taskData.dueDate;
        if (taskData.dueTime !== undefined) updatePayload.dueTime = taskData.dueTime;
        if (taskData.priority) updatePayload.priority = taskData.priority;
        if (taskData.category) updatePayload.category = taskData.category;

        affectedTask = await Task.findOneAndUpdate(
          { _id: matchedTaskId, userId },
          updatePayload,
          { new: true }
        );
        resultMessage = `Updated task '${affectedTask?.title || 'task'}'.`;
      }

      res.status(200).json({
        success: true,
        message: resultMessage,
        task: affectedTask,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Stream natural, ultra-realistic Hindi / Indian English speech audio
   * GET /api/tasks/tts?text=...&lang=hi
   */
  async streamTTS(req, res) {
    try {
      const { text, lang = 'hi' } = req.query;
      if (!text || !text.trim()) {
        return res.status(400).send('Text parameter is required');
      }

      const cleanText = text.trim();
      const langCode = lang === 'en' ? 'en-IN' : 'hi';

      // Split into chunks if text is long (Google TTS limit is ~200 chars)
      const maxChunkLength = 180;
      let chunks = [];

      if (cleanText.length <= maxChunkLength) {
        chunks = [cleanText];
      } else {
        const sentences = cleanText.split(/([।!?.,\n]+)/);
        let cur = '';
        for (const part of sentences) {
          if ((cur + part).length <= maxChunkLength) {
            cur += part;
          } else {
            if (cur.trim()) chunks.push(cur.trim());
            cur = part;
          }
        }
        if (cur.trim()) chunks.push(cur.trim());
      }

      if (chunks.length === 0) {
        chunks = [cleanText.slice(0, maxChunkLength)];
      }

      const audioBuffers = [];
      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${langCode}&client=tw-ob`;
        const response = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: 'https://translate.google.com/',
          },
        });

        if (response.ok) {
          const ab = await response.arrayBuffer();
          audioBuffers.push(Buffer.from(ab));
        }
      }

      if (audioBuffers.length === 0) {
        return res.status(500).send('Unable to generate audio stream');
      }

      const combinedAudio = Buffer.concat(audioBuffers);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', combinedAudio.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(combinedAudio);
    } catch (err) {
      console.error('[TTSError]', err);
      return res.status(500).send('TTS processing failed');
    }
  },
};

export default taskController;

