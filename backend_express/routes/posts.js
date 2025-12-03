const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { extractHashtags, extractMentions, postToPublic } = require('../utils/helpers');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/posts - Create new post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { text, image_url, images } = req.body;

    if (!text) {
      return res.status(400).json({ detail: 'Post text is required' });
    }

    const user = await User.findOne({ id: req.userId });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Extract hashtags and mentions from text
    const hashtags = extractHashtags(text);
    const mentions = extractMentions(text);

    const post = new Post({
      author_id: user.id,
      author_username: user.username,
      author_avatar: user.avatar,
      text,
      image_url: image_url || null,
      images: images || [],
      hashtags,
      mentions,
      likes: [],
      comments: []
    });

    await post.save();

    // Create notifications for mentioned users
    if (mentions.length > 0) {
      for (const mentionedUsername of mentions) {
        const mentionedUser = await User.findOne({ username: mentionedUsername.toLowerCase() });
        if (mentionedUser && mentionedUser.id !== user.id) {
          const notification = new Notification({
            user_id: mentionedUser.id,
            actor_id: user.id,
            actor_username: user.username,
            actor_avatar: user.avatar,
            type: 'mention',
            post_id: post.id,
            text: text.substring(0, 100)
          });
          await notification.save();
        }
      }
    }

    res.status(201).json(postToPublic(post, req.userId, user.saved_posts));
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/posts/upload-image - Upload post image
router.post('/upload-image', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'posts');
    res.json({ url: result.url });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ detail: 'Image upload failed' });
  }
});

// GET /api/posts/feed - Get personalized feed
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const user = await User.findOne({ id: req.userId });

    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const followingIds = [...user.following, user.id];

    const posts = await Post.find({ author_id: { $in: followingIds } })
      .sort({ created_at: -1 })
      .limit(limit);

    res.json(posts.map(post => postToPublic(post, req.userId, user.saved_posts)));
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/posts/explore - Get all posts
router.get('/explore', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const user = await User.findOne({ id: req.userId });

    const posts = await Post.find({})
      .sort({ created_at: -1 })
      .limit(limit);

    res.json(posts.map(post => postToPublic(post, req.userId, user.saved_posts)));
  } catch (error) {
    console.error('Get explore error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/posts/user/:username - Get user posts
router.get('/user/:username', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const currentUser = await User.findOne({ id: req.userId });
    const targetUser = await User.findOne({ username: req.params.username });

    if (!targetUser) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const posts = await Post.find({ author_id: targetUser.id })
      .sort({ created_at: -1 })
      .limit(limit);

    res.json(posts.map(post => postToPublic(post, req.userId, currentUser.saved_posts)));
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/posts/:postId/like - Like post
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findOne({ id: postId });

    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    if (post.likes.includes(req.userId)) {
      return res.status(400).json({ detail: 'Post already liked' });
    }

    await Post.updateOne(
      { id: postId },
      { $push: { likes: req.userId } }
    );

    // Create notification if not own post
    if (post.author_id !== req.userId) {
      const user = await User.findOne({ id: req.userId });
      const notification = new Notification({
        user_id: post.author_id,
        actor_id: req.userId,
        actor_username: user.username,
        actor_avatar: user.avatar,
        type: 'like',
        post_id: postId
      });
      await notification.save();
    }

    res.json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/posts/:postId/unlike - Unlike post
router.post('/:postId/unlike', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findOne({ id: postId });

    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    if (!post.likes.includes(req.userId)) {
      return res.status(400).json({ detail: 'Post not liked' });
    }

    await Post.updateOne(
      { id: postId },
      { $pull: { likes: req.userId } }
    );

    res.json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/posts/:postId/comments - Add comment
router.post('/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ detail: 'Comment text is required' });
    }

    const post = await Post.findOne({ id: postId });
    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    const user = await User.findOne({ id: req.userId });
    const comment = {
      user_id: user.id,
      username: user.username,
      avatar: user.avatar,
      text,
      created_at: new Date()
    };

    await Post.updateOne(
      { id: postId },
      { $push: { comments: comment } }
    );

    // Create notification if not own post
    if (post.author_id !== req.userId) {
      const notification = new Notification({
        user_id: post.author_id,
        actor_id: req.userId,
        actor_username: user.username,
        actor_avatar: user.avatar,
        type: 'comment',
        post_id: postId,
        text: text
      });
      await notification.save();
    }

    res.json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/posts/:postId/comments - Get comments
router.get('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findOne({ id: postId });

    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    res.json(post.comments || []);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/posts/:postId/save - Save post
router.post('/:postId/save', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findOne({ id: postId });

    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    const user = await User.findOne({ id: req.userId });

    if (user.saved_posts.includes(postId)) {
      return res.status(400).json({ detail: 'Post already saved' });
    }

    await User.updateOne(
      { id: req.userId },
      { $push: { saved_posts: postId } }
    );

    res.json({ message: 'Post saved successfully' });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/posts/:postId/unsave - Unsave post
router.post('/:postId/unsave', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const user = await User.findOne({ id: req.userId });

    if (!user.saved_posts.includes(postId)) {
      return res.status(400).json({ detail: 'Post not saved' });
    }

    await User.updateOne(
      { id: req.userId },
      { $pull: { saved_posts: postId } }
    );

    res.json({ message: 'Post unsaved successfully' });
  } catch (error) {
    console.error('Unsave post error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/posts/saved - Get saved posts (must be before /:postId routes)
router.get('/saved', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const user = await User.findOne({ id: req.userId });

    if (!user.saved_posts || user.saved_posts.length === 0) {
      return res.json([]);
    }

    const posts = await Post.find({ id: { $in: user.saved_posts } })
      .sort({ created_at: -1 })
      .limit(limit);

    res.json(posts.map(post => postToPublic(post, req.userId, user.saved_posts)));
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/posts/hashtag/:tag - Get posts by hashtag
router.get('/hashtag/:tag', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const tag = req.params.tag.toLowerCase().replace(/^#/, '');
    const user = await User.findOne({ id: req.userId });

    const posts = await Post.find({ hashtags: tag })
      .sort({ created_at: -1 })
      .limit(limit);

    res.json(posts.map(post => postToPublic(post, req.userId, user.saved_posts)));
  } catch (error) {
    console.error('Get hashtag posts error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

module.exports = router;
