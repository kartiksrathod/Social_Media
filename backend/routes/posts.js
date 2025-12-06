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
    const { text, image_url, images, video_url, image_tags, visibility } = req.body;

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
      video_url: video_url || null,
      hashtags,
      mentions,
      image_tags: image_tags || [],
      likes: [],
      comments: [],
      visibility: visibility || 'public'
    });

    await post.save();

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');

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

          // Emit real-time notification
          const targetSocketId = userSockets.get(mentionedUser.id);
          if (targetSocketId) {
            io.to(targetSocketId).emit('new_notification', notification);
          }
        }
      }
    }

    // Create notifications for tagged users in photos
    if (image_tags && image_tags.length > 0) {
      for (const tag of image_tags) {
        if (tag.user_id !== user.id) {
          const notification = new Notification({
            user_id: tag.user_id,
            actor_id: user.id,
            actor_username: user.username,
            actor_avatar: user.avatar,
            type: 'photo_tag',
            post_id: post.id,
            text: 'tagged you in a photo'
          });
          await notification.save();

          // Emit real-time notification
          const targetSocketId = userSockets.get(tag.user_id);
          if (targetSocketId) {
            io.to(targetSocketId).emit('new_notification', notification);
          }
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

// POST /api/posts/upload-video - Upload post video
router.post('/upload-video', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }

    // Validate file size (max 50MB for videos)
    if (req.file.size > 50 * 1024 * 1024) {
      return res.status(400).json({ detail: 'Video file too large. Maximum size is 50MB' });
    }

    // Validate file type
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!validVideoTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ detail: 'Invalid video format. Supported formats: MP4, WebM, MOV, AVI' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'videos', { resource_type: 'video' });
    res.json({ url: result.url });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ detail: 'Video upload failed' });
  }
});

// PUT /api/posts/:postId - Edit post
router.put('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text, images, image_tags, visibility } = req.body;

    if (!text) {
      return res.status(400).json({ detail: 'Post text is required' });
    }

    const post = await Post.findOne({ id: postId });

    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    // Check if user is the author
    if (post.author_id !== req.userId) {
      return res.status(403).json({ detail: 'You can only edit your own posts' });
    }

    // Extract hashtags and mentions from updated text
    const hashtags = extractHashtags(text);
    const mentions = extractMentions(text);

    // Get old tags to detect new ones
    const oldTags = post.image_tags || [];
    const newTags = image_tags || [];

    // Update post
    post.text = text;
    post.hashtags = hashtags;
    post.mentions = mentions;
    post.edited_at = new Date();
    
    if (images !== undefined) {
      post.images = images;
    }

    if (image_tags !== undefined) {
      post.image_tags = image_tags;
    }

    if (visibility !== undefined) {
      post.visibility = visibility;
    }

    await post.save();

    // Create notifications for newly tagged users
    if (newTags.length > 0) {
      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      const user = await User.findOne({ id: req.userId });
      
      const oldTaggedUserIds = oldTags.map(tag => tag.user_id);
      
      for (const tag of newTags) {
        if (tag.user_id !== user.id && !oldTaggedUserIds.includes(tag.user_id)) {
          const notification = new Notification({
            user_id: tag.user_id,
            actor_id: user.id,
            actor_username: user.username,
            actor_avatar: user.avatar,
            type: 'photo_tag',
            post_id: post.id,
            text: 'tagged you in a photo'
          });
          await notification.save();

          // Emit real-time notification
          const targetSocketId = userSockets.get(tag.user_id);
          if (targetSocketId) {
            io.to(targetSocketId).emit('new_notification', notification);
          }
        }
      }
    }

    const user = await User.findOne({ id: req.userId });
    res.json(postToPublic(post, req.userId, user.saved_posts));
  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// DELETE /api/posts/:postId - Delete post
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findOne({ id: postId });

    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    // Check if user is the author
    if (post.author_id !== req.userId) {
      return res.status(403).json({ detail: 'You can only delete your own posts' });
    }

    // Delete post
    await Post.deleteOne({ id: postId });

    // Delete associated notifications
    await Notification.deleteMany({ post_id: postId });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/posts/feed - Get personalized feed
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const user = await User.findOne({ id: req.userId });

    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const followingIds = [...user.following, user.id];

    // Include posts where user is author OR collaborator (with accepted status)
    const posts = await Post.find({
      $or: [
        { author_id: { $in: followingIds } },
        { collaborator_id: { $in: followingIds }, collaboration_status: 'accepted' }
      ]
    })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // Filter posts based on visibility
    // Get all users to check close friends status
    const allAuthors = await User.find({ id: { $in: followingIds } });
    const authorsMap = new Map(allAuthors.map(author => [author.id, author]));

    const filteredPosts = posts.filter(post => {
      // Show public posts to everyone
      if (post.visibility === 'public') {
        return true;
      }
      
      // Show close_friends posts only to close friends (or the author themselves)
      if (post.visibility === 'close_friends') {
        if (post.author_id === req.userId) {
          return true; // Author can always see their own posts
        }
        
        const author = authorsMap.get(post.author_id);
        if (author && author.close_friends.includes(req.userId)) {
          return true;
        }
        
        return false;
      }
      
      return true;
    });

    // Populate original posts for reposts
    const postsWithOriginal = await Promise.all(filteredPosts.map(async (post) => {
      if (post.is_repost && post.original_post_id) {
        const originalPost = await Post.findOne({ id: post.original_post_id });
        return postToPublic(post, req.userId, user.saved_posts, originalPost);
      }
      return postToPublic(post, req.userId, user.saved_posts);
    }));

    res.json(postsWithOriginal);
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

    // Only show public posts in explore (don't show close friends posts)
    const posts = await Post.find({ visibility: 'public' })
      .sort({ created_at: -1 })
      .limit(limit);

    // Populate original posts for reposts
    const postsWithOriginal = await Promise.all(posts.map(async (post) => {
      if (post.is_repost && post.original_post_id) {
        const originalPost = await Post.findOne({ id: post.original_post_id });
        return postToPublic(post, req.userId, user.saved_posts, originalPost);
      }
      return postToPublic(post, req.userId, user.saved_posts);
    }));

    res.json(postsWithOriginal);
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

    // Include posts where user is author OR accepted collaborator
    const posts = await Post.find({
      $or: [
        { author_id: targetUser.id },
        { collaborator_id: targetUser.id, collaboration_status: 'accepted' }
      ]
    })
      .sort({ created_at: -1 })
      .limit(limit);

    // Filter posts based on visibility
    const filteredPosts = posts.filter(post => {
      // Show public posts to everyone
      if (post.visibility === 'public') {
        return true;
      }
      
      // Show close_friends posts only to close friends (or the author themselves)
      if (post.visibility === 'close_friends') {
        if (targetUser.id === req.userId) {
          return true; // Author can always see their own posts
        }
        
        if (targetUser.close_friends.includes(req.userId)) {
          return true;
        }
        
        return false;
      }
      
      return true;
    });

    // Populate original posts for reposts
    const postsWithOriginal = await Promise.all(filteredPosts.map(async (post) => {
      if (post.is_repost && post.original_post_id) {
        const originalPost = await Post.findOne({ id: post.original_post_id });
        return postToPublic(post, req.userId, currentUser.saved_posts, originalPost);
      }
      return postToPublic(post, req.userId, currentUser.saved_posts);
    }));

    res.json(postsWithOriginal);
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

      // Emit real-time notification
      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      const targetSocketId = userSockets.get(post.author_id);
      if (targetSocketId) {
        io.to(targetSocketId).emit('new_notification', notification);
      }
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

      // Emit real-time notification
      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      const targetSocketId = userSockets.get(post.author_id);
      if (targetSocketId) {
        io.to(targetSocketId).emit('new_notification', notification);
      }
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

// DELETE /api/posts/:postId/comments/:commentId - Delete comment
router.delete('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findOne({ id: postId });

    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) {
      return res.status(404).json({ detail: 'Comment not found' });
    }

    // Check if user is the comment author or post author
    if (comment.user_id !== req.userId && post.author_id !== req.userId) {
      return res.status(403).json({ detail: 'You can only delete your own comments' });
    }

    await Post.updateOne(
      { id: postId },
      { $pull: { comments: { id: commentId } } }
    );

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
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

// POST /api/posts/:postId/repost - Simple repost (share to feed)
router.post('/:postId/repost', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const originalPost = await Post.findOne({ id: postId });

    if (!originalPost) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    const user = await User.findOne({ id: req.userId });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Check if user already reposted this post
    const existingRepost = await Post.findOne({
      author_id: req.userId,
      is_repost: true,
      original_post_id: postId
    });

    if (existingRepost) {
      return res.status(400).json({ detail: 'You have already reposted this post' });
    }

    // Create repost
    const repost = new Post({
      author_id: user.id,
      author_username: user.username,
      author_avatar: user.avatar,
      text: originalPost.text,
      image_url: originalPost.image_url,
      images: originalPost.images,
      video_url: originalPost.video_url,
      hashtags: originalPost.hashtags,
      mentions: originalPost.mentions,
      is_repost: true,
      original_post_id: postId,
      repost_text: null,
      likes: [],
      comments: []
    });

    await repost.save();

    // Increment repost count on original post
    await Post.updateOne(
      { id: postId },
      { $inc: { repost_count: 1 } }
    );

    // Create notification for original author
    if (originalPost.author_id !== req.userId) {
      const notification = new Notification({
        user_id: originalPost.author_id,
        actor_id: req.userId,
        actor_username: user.username,
        actor_avatar: user.avatar,
        type: 'repost',
        post_id: postId
      });
      await notification.save();

      // Emit real-time notification
      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      const targetSocketId = userSockets.get(originalPost.author_id);
      if (targetSocketId) {
        io.to(targetSocketId).emit('new_notification', notification);
      }
    }

    res.status(201).json(postToPublic(repost, req.userId, user.saved_posts));
  } catch (error) {
    console.error('Repost error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/posts/:postId/quote - Quote post (repost with commentary)
router.post('/:postId/quote', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ detail: 'Quote text is required' });
    }

    const originalPost = await Post.findOne({ id: postId });

    if (!originalPost) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    const user = await User.findOne({ id: req.userId });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Extract hashtags and mentions from quote text
    const hashtags = extractHashtags(text);
    const mentions = extractMentions(text);

    // Create quote post
    const quotePost = new Post({
      author_id: user.id,
      author_username: user.username,
      author_avatar: user.avatar,
      text: originalPost.text,
      image_url: originalPost.image_url,
      images: originalPost.images,
      video_url: originalPost.video_url,
      hashtags: [...hashtags, ...originalPost.hashtags],
      mentions: [...mentions, ...originalPost.mentions],
      is_repost: true,
      original_post_id: postId,
      repost_text: text,
      likes: [],
      comments: []
    });

    await quotePost.save();

    // Increment repost count on original post
    await Post.updateOne(
      { id: postId },
      { $inc: { repost_count: 1 } }
    );

    // Create notification for original author
    if (originalPost.author_id !== req.userId) {
      const notification = new Notification({
        user_id: originalPost.author_id,
        actor_id: req.userId,
        actor_username: user.username,
        actor_avatar: user.avatar,
        type: 'repost',
        post_id: postId,
        text: text.substring(0, 100)
      });
      await notification.save();

      // Emit real-time notification
      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      const targetSocketId = userSockets.get(originalPost.author_id);
      if (targetSocketId) {
        io.to(targetSocketId).emit('new_notification', notification);
      }
    }

    // Create notifications for mentioned users in quote text
    if (mentions.length > 0) {
      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      
      for (const mentionedUsername of mentions) {
        const mentionedUser = await User.findOne({ username: mentionedUsername.toLowerCase() });
        if (mentionedUser && mentionedUser.id !== user.id) {
          const notification = new Notification({
            user_id: mentionedUser.id,
            actor_id: user.id,
            actor_username: user.username,
            actor_avatar: user.avatar,
            type: 'mention',
            post_id: quotePost.id,
            text: text.substring(0, 100)
          });
          await notification.save();

          // Emit real-time notification
          const targetSocketId = userSockets.get(mentionedUser.id);
          if (targetSocketId) {
            io.to(targetSocketId).emit('new_notification', notification);
          }
        }
      }
    }

    res.status(201).json(postToPublic(quotePost, req.userId, user.saved_posts));
  } catch (error) {
    console.error('Quote post error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// DELETE /api/posts/:postId/unrepost - Remove repost
router.delete('/:postId/unrepost', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Find the repost made by current user
    const repost = await Post.findOne({
      author_id: req.userId,
      is_repost: true,
      original_post_id: postId
    });

    if (!repost) {
      return res.status(404).json({ detail: 'Repost not found' });
    }

    // Delete the repost
    await Post.deleteOne({ id: repost.id });

    // Decrement repost count on original post
    await Post.updateOne(
      { id: postId },
      { $inc: { repost_count: -1 } }
    );

    res.json({ message: 'Repost removed successfully' });
  } catch (error) {
    console.error('Unrepost error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/posts/:postId/reposted-by - Check if user reposted this post
router.get('/:postId/reposted-by', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    
    const repost = await Post.findOne({
      author_id: req.userId,
      is_repost: true,
      original_post_id: postId
    });

    res.json({ reposted: !!repost });
  } catch (error) {
    console.error('Check repost error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/posts/:postId/react - Add or change reaction
router.post('/:postId/react', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { type } = req.body;

    const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry'];
    if (!type || !validReactions.includes(type)) {
      return res.status(400).json({ detail: 'Invalid reaction type. Valid types: like, love, laugh, wow, sad, angry' });
    }

    const post = await Post.findOne({ id: postId });
    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    // Initialize reactions array if it doesn't exist
    if (!post.reactions) {
      post.reactions = [];
    }

    // Check if user already reacted
    const existingReactionIndex = post.reactions.findIndex(r => r.user_id === req.userId);

    if (existingReactionIndex !== -1) {
      // User already reacted - update reaction type
      post.reactions[existingReactionIndex].type = type;
      post.reactions[existingReactionIndex].created_at = new Date();
    } else {
      // Add new reaction
      post.reactions.push({
        user_id: req.userId,
        type: type,
        created_at: new Date()
      });

      // Create notification for post author (only for new reactions, not changes)
      if (post.author_id !== req.userId) {
        const user = await User.findOne({ id: req.userId });
        const notification = new Notification({
          user_id: post.author_id,
          actor_id: req.userId,
          actor_username: user.username,
          actor_avatar: user.avatar,
          type: 'reaction',
          post_id: postId,
          text: type
        });
        await notification.save();

        // Emit real-time notification
        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        const targetSocketId = userSockets.get(post.author_id);
        if (targetSocketId) {
          io.to(targetSocketId).emit('new_notification', notification);
        }
      }
    }

    await post.save();

    const user = await User.findOne({ id: req.userId });
    res.json(postToPublic(post, req.userId, user.saved_posts));
  } catch (error) {
    console.error('React error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// DELETE /api/posts/:postId/react - Remove reaction
router.delete('/:postId/react', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findOne({ id: postId });

    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    // Initialize reactions array if it doesn't exist
    if (!post.reactions) {
      post.reactions = [];
    }

    // Check if user has reacted
    const hasReacted = post.reactions.some(r => r.user_id === req.userId);
    if (!hasReacted) {
      return res.status(400).json({ detail: 'You have not reacted to this post' });
    }

    // Remove user's reaction
    post.reactions = post.reactions.filter(r => r.user_id !== req.userId);
    await post.save();

    const user = await User.findOne({ id: req.userId });
    res.json(postToPublic(post, req.userId, user.saved_posts));
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/posts/:postId/reactions - Get reaction details
router.get('/:postId/reactions', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findOne({ id: postId });

    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    const reactions = post.reactions || [];
    
    // Count reactions by type
    const reactionCounts = {
      like: 0,
      love: 0,
      laugh: 0,
      wow: 0,
      sad: 0,
      angry: 0
    };

    // Get user details for each reaction
    const reactionsWithUsers = [];
    
    for (const reaction of reactions) {
      reactionCounts[reaction.type]++;
      
      const user = await User.findOne({ id: reaction.user_id });
      if (user) {
        reactionsWithUsers.push({
          user_id: reaction.user_id,
          username: user.username,
          avatar: user.avatar,
          type: reaction.type,
          created_at: reaction.created_at
        });
      }
    }

    res.json({
      total: reactions.length,
      counts: reactionCounts,
      reactions: reactionsWithUsers
    });
  } catch (error) {
    console.error('Get reactions error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

module.exports = router;
