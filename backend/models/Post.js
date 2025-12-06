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
  images: [{
    type: String
  }],
  video_url: {
    type: String,
    default: null
  },
  hashtags: [{
    type: String
  }],
  mentions: [{
    type: String
  }],
  image_tags: [{
    image_index: {
      type: Number,
      required: true
    },
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
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
    avatar: {
      type: String,
      default: null
    }
  }],
  likes: [{
    type: String
  }],
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
  comments: [commentSchema],
  comment_count: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  edited_at: {
    type: Date,
    default: null
  },
  // Repost fields
  is_repost: {
    type: Boolean,
    default: false
  },
  original_post_id: {
    type: String,
    default: null
  },
  repost_text: {
    type: String,
    default: null
  },
  repost_count: {
    type: Number,
    default: 0
  },
  visibility: {
    type: String,
    enum: ['public', 'close_friends'],
    default: 'public'
  },
  // Collaborative post fields
  is_collaborative: {
    type: Boolean,
    default: false
  },
  collaborator_id: {
    type: String,
    default: null
  },
  collaborator_username: {
    type: String,
    default: null
  },
  collaborator_avatar: {
    type: String,
    default: null
  },
  collaboration_status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: null
  },
  // Poll fields
  is_poll: {
    type: Boolean,
    default: false
  },
  poll: {
    question: {
      type: String,
      default: null
    },
    options: [{
      id: {
        type: String,
        required: true
      },
      text: {
        type: String,
        required: true
      },
      votes: [{
        user_id: {
          type: String,
          required: true
        },
        voted_at: {
          type: Date,
          default: Date.now
        }
      }]
    }],
    settings: {
      allow_multiple: {
        type: Boolean,
        default: false
      },
      is_anonymous: {
        type: Boolean,
        default: false
      },
      expires_at: {
        type: Date,
        default: null
      }
    },
    total_votes: {
      type: Number,
      default: 0
    }
  }
}, {
  collection: 'posts',
  timestamps: false
});

// Indexes for performance
postSchema.index({ id: 1 });
postSchema.index({ author_id: 1 });
postSchema.index({ collaborator_id: 1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ created_at: -1 });

module.exports = mongoose.model('Post', postSchema);
