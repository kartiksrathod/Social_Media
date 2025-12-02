const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const commentSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4()
  },
  user_id: {
    type: String,
    required: true
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
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const postSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  author_id: {
    type: String,
    required: true
  },
  author_username: {
    type: String,
    required: true
  },
  author_avatar: {
    type: String,
    default: null
  },
  text: {
    type: String,
    required: true
  },
  image_url: {
    type: String,
    default: null
  },
  hashtags: [{
    type: String
  }],
  likes: [{
    type: String
  }],
  comments: [commentSchema],
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'posts',
  timestamps: false
});

// Indexes for performance
postSchema.index({ id: 1 });
postSchema.index({ author_id: 1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ created_at: -1 });

module.exports = mongoose.model('Post', postSchema);
