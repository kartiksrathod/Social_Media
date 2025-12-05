const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const commentSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  post_id: {
    type: String,
    required: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  text: {
    type: String,
    required: true,
    maxlength: 500
  },
  parent_comment_id: {
    type: String,
    default: null,
    index: true
  },
  likes: [{
    type: String  // Array of user IDs who liked
  }],
  like_count: {
    type: Number,
    default: 0
  },
  reactions: [{
    user_id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry'],
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  mentioned_user_ids: [{
    type: String
  }],
  reply_count: {
    type: Number,
    default: 0
  },
  is_edited: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'comments',
  timestamps: false
});

// Indexes for performance
commentSchema.index({ id: 1 });
commentSchema.index({ post_id: 1, created_at: -1 });
commentSchema.index({ post_id: 1, parent_comment_id: 1 });
commentSchema.index({ user_id: 1 });

module.exports = mongoose.model('Comment', commentSchema);
