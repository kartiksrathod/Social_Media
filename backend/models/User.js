const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: null
  },
  followers: [{
    type: String
  }],
  following: [{
    type: String
  }],
  saved_posts: [{
    type: String
  }],
  close_friends: [{
    type: String
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'users',
  timestamps: false
});

// Index for faster queries
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ id: 1 });

module.exports = mongoose.model('User', userSchema);
