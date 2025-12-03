const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  conversation_id: {
    type: String,
    required: true
  },
  sender_id: {
    type: String,
    required: true
  },
  sender_username: {
    type: String,
    required: true
  },
  sender_avatar: {
    type: String,
    default: null
  },
  text: {
    type: String,
    required: true
  },
  media_url: {
    type: String,
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'messages',
  timestamps: false
});

// Indexes for performance
messageSchema.index({ id: 1 });
messageSchema.index({ conversation_id: 1 });
messageSchema.index({ created_at: 1 });

module.exports = mongoose.model('Message', messageSchema);
