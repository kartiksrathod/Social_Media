const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');
const { extractHashtags, extractMentions, postToPublic } = require('../utils/helpers');

const router = express.Router();

// POST /api/collaborations/invite - Create post with collaboration invite
router.post('/invite', authenticateToken, async (req, res) => {
  try {
    const { text, image_url, images, video_url, image_tags, visibility, collaborator_username } = req.body;

    if (!text) {
      return res.status(400).json({ detail: 'Post text is required' });
    }

    if (!collaborator_username) {
      return res.status(400).json({ detail: 'Collaborator username is required' });
    }

    const user = await User.findOne({ id: req.userId });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Find collaborator
    const collaborator = await User.findOne({ username: collaborator_username.toLowerCase() });
    if (!collaborator) {
      return res.status(404).json({ detail: 'Collaborator not found' });
    }

    // Prevent self-collaboration
    if (collaborator.id === user.id) {
      return res.status(400).json({ detail: 'Cannot collaborate with yourself' });
    }

    // Extract hashtags and mentions from text
    const hashtags = extractHashtags(text);
    const mentions = extractMentions(text);

    // Create post with pending collaboration
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
      visibility: visibility || 'public',
      is_collaborative: true,
      collaborator_id: collaborator.id,
      collaborator_username: collaborator.username,
      collaborator_avatar: collaborator.avatar,
      collaboration_status: 'pending'
    });

    await post.save();

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');

    // Send collaboration invite notification
    const notification = new Notification({
      user_id: collaborator.id,
      actor_id: user.id,
      actor_username: user.username,
      actor_avatar: user.avatar,
      type: 'collab_invite',
      post_id: post.id,
      text: 'invited you to collaborate on a post'
    });
    await notification.save();

    // Emit real-time notification
    const targetSocketId = userSockets.get(collaborator.id);
    if (targetSocketId) {
      io.to(targetSocketId).emit('new_notification', notification);
    }

    // Create notifications for mentioned users
    if (mentions.length > 0) {
      for (const mentionedUsername of mentions) {
        const mentionedUser = await User.findOne({ username: mentionedUsername.toLowerCase() });
        if (mentionedUser && mentionedUser.id !== user.id && mentionedUser.id !== collaborator.id) {
          const mentionNotification = new Notification({
            user_id: mentionedUser.id,
            actor_id: user.id,
            actor_username: user.username,
            actor_avatar: user.avatar,
            type: 'mention',
            post_id: post.id,
            text: text.substring(0, 100)
          });
          await mentionNotification.save();

          const mentionSocketId = userSockets.get(mentionedUser.id);
          if (mentionSocketId) {
            io.to(mentionSocketId).emit('new_notification', mentionNotification);
          }
        }
      }
    }

    // Create notifications for tagged users in photos (only author can tag)
    if (image_tags && image_tags.length > 0) {
      for (const tag of image_tags) {
        if (tag.user_id !== user.id && tag.user_id !== collaborator.id) {
          const tagNotification = new Notification({
            user_id: tag.user_id,
            actor_id: user.id,
            actor_username: user.username,
            actor_avatar: user.avatar,
            type: 'photo_tag',
            post_id: post.id,
            text: 'tagged you in a photo'
          });
          await tagNotification.save();

          const tagSocketId = userSockets.get(tag.user_id);
          if (tagSocketId) {
            io.to(tagSocketId).emit('new_notification', tagNotification);
          }
        }
      }
    }

    res.status(201).json(postToPublic(post, req.userId, user.saved_posts));
  } catch (error) {
    console.error('Create collaborative post error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/collaborations/:postId/accept - Accept collaboration invite
router.post('/:postId/accept', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.postId });
    
    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    // Verify user is the collaborator
    if (post.collaborator_id !== req.userId) {
      return res.status(403).json({ detail: 'You are not the invited collaborator' });
    }

    // Verify collaboration is pending
    if (post.collaboration_status !== 'pending') {
      return res.status(400).json({ detail: 'Collaboration invite is not pending' });
    }

    // Update collaboration status
    post.collaboration_status = 'accepted';
    await post.save();

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');

    // Notify the original author
    const notification = new Notification({
      user_id: post.author_id,
      actor_id: req.userId,
      actor_username: post.collaborator_username,
      actor_avatar: post.collaborator_avatar,
      type: 'collab_accepted',
      post_id: post.id,
      text: 'accepted your collaboration invite'
    });
    await notification.save();

    // Emit real-time notification
    const targetSocketId = userSockets.get(post.author_id);
    if (targetSocketId) {
      io.to(targetSocketId).emit('new_notification', notification);
    }

    const user = await User.findOne({ id: req.userId });
    res.json(postToPublic(post, req.userId, user.saved_posts));
  } catch (error) {
    console.error('Accept collaboration error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/collaborations/:postId/reject - Reject collaboration invite
router.post('/:postId/reject', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.postId });
    
    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    // Verify user is the collaborator
    if (post.collaborator_id !== req.userId) {
      return res.status(403).json({ detail: 'You are not the invited collaborator' });
    }

    // Verify collaboration is pending
    if (post.collaboration_status !== 'pending') {
      return res.status(400).json({ detail: 'Collaboration invite is not pending' });
    }

    // Update collaboration status
    post.collaboration_status = 'rejected';
    
    // Remove collaborative fields (convert to regular post)
    post.is_collaborative = false;
    post.collaborator_id = null;
    post.collaborator_username = null;
    post.collaborator_avatar = null;
    
    await post.save();

    res.json({ message: 'Collaboration invite rejected' });
  } catch (error) {
    console.error('Reject collaboration error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/collaborations/pending - Get pending collaboration invites
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const posts = await Post.find({
      collaborator_id: req.userId,
      collaboration_status: 'pending'
    }).sort({ created_at: -1 });

    const user = await User.findOne({ id: req.userId });
    const publicPosts = posts.map(post => postToPublic(post, req.userId, user.saved_posts));

    res.json(publicPosts);
  } catch (error) {
    console.error('Get pending collaborations error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

module.exports = router;
