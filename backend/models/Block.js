const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Block Model
 * Represents a user blocking another user
 */
const blockSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  blocker_id: {
    type: String,
    required: true,
    index: true
  },
  blocked_id: {
    type: String,
    required: true,
    index: true
  },
  blocker_username: {
    type: String,
    required: true
  },
  blocked_username: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'blocks',
  timestamps: false
});

// Compound index for efficient queries
blockSchema.index({ blocker_id: 1, blocked_id: 1 }, { unique: true });
blockSchema.index({ blocked_id: 1 });

module.exports = mongoose.model('Block', blockSchema);
