const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const notificationSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  actor_id: {
    type: String,
    required: true
  },
  actor_username: {
    type: String,
    required: true
  },
  actor_avatar: {
    type: String,
    default: null
  },
  type: {
    type: String,
    required: true,
    enum: ['like', 'comment', 'follow']
  },
  post_id: {
    type: String,
    default: null
  },
  text: {
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
  collection: 'notifications',
  timestamps: false
});

// Indexes
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ id: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
