const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const conversationSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  participants: [{
    type: String,
    required: true
  }],
  last_message: {
    type: String,
    default: null
  },
  last_message_at: {
    type: Date,
    default: Date.now
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'conversations',
  timestamps: false
});

// Indexes for performance
conversationSchema.index({ id: 1 });
conversationSchema.index({ participants: 1 });
conversationSchema.index({ last_message_at: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
