import express from 'express';
import { protect } from '../middleware/auth.js';
import { taskController } from '../controllers/taskController.js';

const router = express.Router();

// Public audio TTS stream for ultra-natural native Hindi/English speech playback
router.get('/tts', taskController.streamTTS);

// All task CRUD and voice execution routes require authentication
router.use(protect);

router.get('/', taskController.getTasks);
router.get('/summary', taskController.getSummary);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.patch('/:id/toggle', taskController.toggleTask);
router.delete('/completed/clear', taskController.clearCompleted);
router.delete('/:id', taskController.deleteTask);

// Voice Assistant AI endpoints
router.post('/voice-command', taskController.processVoice);
router.post('/voice-execute', taskController.executeVoiceAction);

export default router;

