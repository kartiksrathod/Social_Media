const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/messages/conversations - Create or get existing conversation
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const { participant_id } = req.body;

    if (!participant_id) {
      return res.status(400).json({ detail: 'Participant ID is required' });
    }

    if (participant_id === req.userId) {
      return res.status(400).json({ detail: 'Cannot create conversation with yourself' });
    }

    // Check if participant exists
    const participant = await User.findOne({ id: participant_id });
    if (!participant) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: [req.userId, participant_id] }
    });

    if (existingConversation) {
      // Get participant info
      const participantInfo = await User.findOne({ id: participant_id });
      return res.json({
        id: existingConversation.id,
        participants: existingConversation.participants,
        participant_info: {
          id: participantInfo.id,
          username: participantInfo.username,
          avatar: participantInfo.avatar
        },
        last_message: existingConversation.last_message,
        last_message_at: existingConversation.last_message_at,
        created_at: existingConversation.created_at
      });
    }

    // Create new conversation
    const conversation = new Conversation({
      participants: [req.userId, participant_id],
      last_message: null,
      last_message_at: new Date()
    });

    await conversation.save();

    const participantInfo = await User.findOne({ id: participant_id });
    res.status(201).json({
      id: conversation.id,
      participants: conversation.participants,
      participant_info: {
        id: participantInfo.id,
        username: participantInfo.username,
        avatar: participantInfo.avatar
      },
      last_message: conversation.last_message,
      last_message_at: conversation.last_message_at,
      created_at: conversation.created_at
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/messages/conversations - Get all user conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId
    }).sort({ last_message_at: -1 });

    // Enrich with participant info
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participants.find(id => id !== req.userId);
        const otherUser = await User.findOne({ id: otherUserId });

        // Get unread count
        const unreadCount = await Message.countDocuments({
          conversation_id: conv.id,
          sender_id: { $ne: req.userId },
          read: false
        });

        return {
          id: conv.id,
          participants: conv.participants,
          participant_info: otherUser ? {
            id: otherUser.id,
            username: otherUser.username,
            avatar: otherUser.avatar
          } : null,
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          unread_count: unreadCount,
          created_at: conv.created_at
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/messages - Send message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { conversation_id, text, media_url } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ detail: 'Conversation ID is required' });
    }

    if (!text && !media_url) {
      return res.status(400).json({ detail: 'Message text or media is required' });
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findOne({ id: conversation_id });
    if (!conversation) {
      return res.status(404).json({ detail: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.userId)) {
      return res.status(403).json({ detail: 'You are not a participant in this conversation' });
    }

    const user = await User.findOne({ id: req.userId });
    
    const message = new Message({
      conversation_id,
      sender_id: user.id,
      sender_username: user.username,
      sender_avatar: user.avatar,
      text: text || '',
      media_url: media_url || null,
      read: false
    });

    await message.save();

    // Update conversation last_message
    await Conversation.updateOne(
      { id: conversation_id },
      {
        last_message: text || '[Media]',
        last_message_at: new Date()
      }
    );

    const messageData = {
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      sender_username: message.sender_username,
      sender_avatar: message.sender_avatar,
      text: message.text,
      media_url: message.media_url,
      read: message.read,
      created_at: message.created_at
    };

    // Emit socket event to conversation room
    const io = req.app.get('io');
    if (io) {
      io.to(conversation_id).emit('new_message', messageData);
    }

    res.status(201).json(messageData);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/messages/:conversationId - Get messages for conversation
router.get('/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findOne({ id: conversationId });
    if (!conversation) {
      return res.status(404).json({ detail: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.userId)) {
      return res.status(403).json({ detail: 'You are not a participant in this conversation' });
    }

    const messages = await Message.find({ conversation_id: conversationId })
      .sort({ created_at: 1 })
      .limit(limit);

    res.json(messages.map(msg => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      sender_username: msg.sender_username,
      sender_avatar: msg.sender_avatar,
      text: msg.text,
      media_url: msg.media_url,
      read: msg.read,
      created_at: msg.created_at
    })));
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// PUT /api/messages/:conversationId/read - Mark all messages in conversation as read
router.put('/:conversationId/read', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findOne({ id: conversationId });
    if (!conversation) {
      return res.status(404).json({ detail: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.userId)) {
      return res.status(403).json({ detail: 'You are not a participant in this conversation' });
    }

    // Mark all messages from other user as read
    await Message.updateMany(
      {
        conversation_id: conversationId,
        sender_id: { $ne: req.userId },
        read: false
      },
      { $set: { read: true } }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

module.exports = router;
