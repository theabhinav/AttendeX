import express from 'express';
import {
  getConversations,
  createConversation,
  getConversationMessages,
  sendMessage,
  renameConversation,
  deleteConversation,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversationMessages);
router.post('/conversations/:id/message', sendMessage);
router.put('/conversations/:id', renameConversation);
router.delete('/conversations/:id', deleteConversation);

export default router;

