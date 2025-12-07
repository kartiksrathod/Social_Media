const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Report Model
 * Represents a report on a post, comment, or user
 */
const reportSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  reporter_id: {
    type: String,
    required: true,
    index: true
  },
  reporter_username: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['post', 'comment', 'user'],
    required: true,
    index: true
  },
  target_id: {
    type: String,
    required: true,
    index: true
  },
  target_username: {
    type: String,
    default: ''
  },
  reason: {
    type: String,
    enum: [
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'misinformation',
      'nudity',
      'illegal',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    default: 'pending',
    index: true
  },
  admin_notes: {
    type: String,
    default: ''
  },
  resolved_by: {
    type: String,
    default: null
  },
  resolved_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'reports',
  timestamps: false
});

// Indexes for efficient queries
reportSchema.index({ type: 1, target_id: 1 });
reportSchema.index({ status: 1, created_at: -1 });
reportSchema.index({ reporter_id: 1, target_id: 1, type: 1 });

module.exports = mongoose.model('Report', reportSchema);
