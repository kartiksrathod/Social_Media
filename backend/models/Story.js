const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const storySchema = new mongoose.Schema({
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
  username: {
    type: String,
    required: true
  },
  user_avatar: {
    type: String,
    default: null
  },
  media_url: {
    type: String,
    required: true
  },
  media_type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  views: [{
    user_id: String,
    viewed_at: {
      type: Date,
      default: Date.now
    }
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date,
    required: true
  }
}, {
  collection: 'stories',
  timestamps: false
});

// Indexes for performance
storySchema.index({ id: 1 });
storySchema.index({ user_id: 1 });
storySchema.index({ expires_at: 1 });
storySchema.index({ created_at: -1 });

// Virtual property to check if story is expired
storySchema.virtual('is_expired').get(function() {
  return Date.now() > this.expires_at;
});

module.exports = mongoose.model('Story', storySchema);
