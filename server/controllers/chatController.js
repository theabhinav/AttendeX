import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';
import { processAcademicChat } from '../services/geminiChatService.js';

/**
 * List all conversations for authenticated user
 */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const conversations = await ChatConversation.find({ userId }).sort({
      lastMessageAt: -1,
    });
    res.status(200).json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new conversation
 */
export const createConversation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const title = req.body?.title || 'New Academic Chat';

    const conversation = await ChatConversation.create({
      userId,
      title,
      lastMessageAt: new Date(),
    });

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all messages for a specific conversation
 */
export const getConversationMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await ChatConversation.findOne({ _id: id, userId });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const messages = await ChatMessage.find({ conversationId: id, userId }).sort({
      createdAt: 1,
    });

    res.status(200).json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message to AttendX AI and receive response
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message: userQuery } = req.body;
    const userId = req.user._id;

    if (!userQuery || !userQuery.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    // Ensure conversation exists or create one if default
    let conversation = await ChatConversation.findOne({ _id: id, userId });
    if (!conversation) {
      conversation = await ChatConversation.create({
        _id: id,
        userId,
        title: userQuery.substring(0, 35) + '...',
        lastMessageAt: new Date(),
      });
    }

    // 1. Save user message
    const userMsg = await ChatMessage.create({
      conversationId: conversation._id,
      userId,
      role: 'user',
      content: userQuery.trim(),
    });

    // 2. Fetch recent conversation history (last 10 messages)
    const history = await ChatMessage.find({
      conversationId: conversation._id,
      userId,
    })
      .sort({ createdAt: 1 })
      .limit(10);

    // 3. Process with Gemini AI & Tool Calling
    const aiResult = await processAcademicChat(userId, history, userQuery.trim());

    // 4. Save AI message
    const aiMsg = await ChatMessage.create({
      conversationId: conversation._id,
      userId,
      role: 'model',
      content: aiResult.text,
      toolCalls: aiResult.toolCalls || [],
    });

    // 5. Update conversation timestamp and title if it was first message
    conversation.lastMessageAt = new Date();
    if (conversation.title === 'New Academic Chat') {
      conversation.title = userQuery.substring(0, 35).trim() + (userQuery.length > 35 ? '...' : '');
    }
    await conversation.save();

    res.status(200).json({
      success: true,
      userMessage: userMsg,
      aiMessage: aiMsg,
      modelUsed: aiResult.model,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rename a conversation
 */
export const renameConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user._id;

    const conversation = await ChatConversation.findOneAndUpdate(
      { _id: id, userId },
      { $set: { title: title.trim() } },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    await Promise.all([
      ChatConversation.deleteOne({ _id: id, userId }),
      ChatMessage.deleteMany({ conversationId: id, userId }),
    ]);

    res.status(200).json({ success: true, message: 'Conversation deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

