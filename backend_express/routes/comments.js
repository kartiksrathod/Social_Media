const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

// Extract mentions from text
function extractMentions(text) {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)]; // Remove duplicates
}

// Create a comment or reply
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { post_id, text, parent_comment_id } = req.body;
    const { user_id, username, avatar } = req.user;

    // Validation
    if (!post_id || !text) {
      return res.status(400).json({ detail: 'post_id and text are required' });
    }

    if (text.length > 500) {
      return res.status(400).json({ detail: 'Comment text cannot exceed 500 characters' });
    }

    // Check if post exists
    const post = await Post.findOne({ id: post_id });
    if (!post) {
      return res.status(404).json({ detail: 'Post not found' });
    }

    // If this is a reply, check if parent comment exists
    let parentComment = null;
    if (parent_comment_id) {
      parentComment = await Comment.findOne({ id: parent_comment_id });
      if (!parentComment) {
        return res.status(404).json({ detail: 'Parent comment not found' });
      }
    }

    // Extract mentions
    const mentionedUsernames = extractMentions(text);
    const User = require('../models/User');
    const mentionedUsers = await User.find({ username: { $in: mentionedUsernames } });
    const mentioned_user_ids = mentionedUsers.map(u => u.id).filter(id => id !== user_id);

    // Create comment
    const comment = new Comment({
      post_id,
      user_id,
      username,
      avatar,
      text,
      parent_comment_id: parent_comment_id || null,
      mentioned_user_ids
    });

    await comment.save();

    // Update counts
    if (parent_comment_id && parentComment) {
      // This is a reply - update parent comment reply count
      await Comment.updateOne(
        { id: parent_comment_id },
        { $inc: { reply_count: 1 } }
      );

      // Create notification for parent comment author (if not self-reply)
      if (parentComment.user_id !== user_id) {
        const notification = new Notification({
          user_id: parentComment.user_id,
          actor_id: user_id,
          actor_username: username,
          actor_avatar: avatar,
          type: 'comment_reply',
          post_id: post_id,
          comment_id: comment.id,
          text: `replied to your comment: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
        });
        await notification.save();

        // Emit WebSocket event for real-time notification
        if (req.app.get('io')) {
          req.app.get('io').to(parentComment.user_id).emit('notification', {
            ...notification.toObject(),
            id: notification.id
          });
        }
      }
    } else {
      // This is a top-level comment - update post comment count
      await Post.updateOne(
        { id: post_id },
        { $inc: { comment_count: 1 } }
      );

      // Create notification for post author (if not self-comment)
      if (post.author_id !== user_id) {
        const notification = new Notification({
          user_id: post.author_id,
          actor_id: user_id,
          actor_username: username,
          actor_avatar: avatar,
          type: 'comment',
          post_id: post_id,
          comment_id: comment.id,
          text: `commented: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
        });
        await notification.save();

        // Emit WebSocket event for real-time notification
        if (req.app.get('io')) {
          req.app.get('io').to(post.author_id).emit('notification', {
            ...notification.toObject(),
            id: notification.id
          });
        }
      }
    }

    res.status(201).json({
      ...comment.toObject(),
      id: comment.id
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ detail: 'Failed to create comment' });
  }
});

// Get all comments for a post
router.get('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 20, offset = 0, sort = 'newest' } = req.query;
    const { user_id } = req.user;

    // Determine sort criteria
    let sortCriteria = { created_at: -1 }; // Default: newest first
    if (sort === 'most_liked') {
      sortCriteria = { like_count: -1, created_at: -1 };
    } else if (sort === 'most_replied') {
      sortCriteria = { reply_count: -1, created_at: -1 };
    }

    // Get top-level comments (parent_comment_id is null)
    const comments = await Comment.find({ 
      post_id: postId, 
      parent_comment_id: null 
    })
      .sort(sortCriteria)
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    // Get total count of top-level comments
    const total = await Comment.countDocuments({ 
      post_id: postId, 
      parent_comment_id: null 
    });

    // Format comments with user like status and reaction data
    const formattedComments = comments.map(comment => {
      const reactionSummary = {};
      comment.reactions.forEach(r => {
        reactionSummary[r.type] = (reactionSummary[r.type] || 0) + 1;
      });
      const userReaction = comment.reactions.find(r => r.user_id === user_id);

      return {
        ...comment.toObject(),
        id: comment.id,
        has_liked: comment.likes.includes(user_id),
        user_reaction: userReaction ? userReaction.type : null,
        reaction_summary: reactionSummary
      };
    });

    res.json({
      comments: formattedComments,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ detail: 'Failed to fetch comments' });
  }
});

// Get replies for a comment
router.get('/:commentId/replies', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { sort = 'newest' } = req.query;
    const { user_id } = req.user;

    // Determine sort criteria
    let sortCriteria = { created_at: 1 }; // Default: oldest first for replies (conversation flow)
    if (sort === 'newest') {
      sortCriteria = { created_at: -1 };
    } else if (sort === 'most_liked') {
      sortCriteria = { like_count: -1, created_at: 1 };
    } else if (sort === 'most_replied') {
      sortCriteria = { reply_count: -1, created_at: 1 };
    }

    // Get all replies for this comment
    const replies = await Comment.find({ 
      parent_comment_id: commentId 
    }).sort(sortCriteria);

    // Format replies with user like status and reaction data
    const formattedReplies = replies.map(reply => {
      const reactionSummary = {};
      reply.reactions.forEach(r => {
        reactionSummary[r.type] = (reactionSummary[r.type] || 0) + 1;
      });
      const userReaction = reply.reactions.find(r => r.user_id === user_id);

      return {
        ...reply.toObject(),
        id: reply.id,
        has_liked: reply.likes.includes(user_id),
        user_reaction: userReaction ? userReaction.type : null,
        reaction_summary: reactionSummary
      };
    });

    res.json({
      replies: formattedReplies
    });
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ detail: 'Failed to fetch replies' });
  }
});

// Edit a comment
router.put('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const { user_id } = req.user;

    if (!text) {
      return res.status(400).json({ detail: 'text is required' });
    }

    if (text.length > 500) {
      return res.status(400).json({ detail: 'Comment text cannot exceed 500 characters' });
    }

    // Find comment
    const comment = await Comment.findOne({ id: commentId });
    if (!comment) {
      return res.status(404).json({ detail: 'Comment not found' });
    }

    // Check if user is the comment author
    if (comment.user_id !== user_id) {
      return res.status(403).json({ detail: 'You can only edit your own comments' });
    }

    // Update comment
    comment.text = text;
    comment.is_edited = true;
    comment.updated_at = new Date();
    await comment.save();

    res.json({
      ...comment.toObject(),
      id: comment.id,
      has_liked: comment.likes.includes(user_id)
    });
  } catch (error) {
    console.error('Error editing comment:', error);
    res.status(500).json({ detail: 'Failed to edit comment' });
  }
});

// Delete a comment
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { user_id } = req.user;

    // Find comment
    const comment = await Comment.findOne({ id: commentId });
    if (!comment) {
      return res.status(404).json({ detail: 'Comment not found' });
    }

    // Check if user is the comment author
    if (comment.user_id !== user_id) {
      return res.status(403).json({ detail: 'You can only delete your own comments' });
    }

    // Check if comment has replies
    const replyCount = await Comment.countDocuments({ parent_comment_id: commentId });
    
    if (replyCount > 0) {
      // If has replies, replace text with [deleted] and mark as deleted
      comment.text = '[deleted]';
      comment.username = '[deleted]';
      comment.avatar = null;
      comment.is_edited = true;
      comment.updated_at = new Date();
      await comment.save();
    } else {
      // If no replies, delete completely
      await Comment.deleteOne({ id: commentId });

      // Update counts
      if (comment.parent_comment_id) {
        // This is a reply - decrement parent comment reply count
        await Comment.updateOne(
          { id: comment.parent_comment_id },
          { $inc: { reply_count: -1 } }
        );
      } else {
        // This is a top-level comment - decrement post comment count
        await Post.updateOne(
          { id: comment.post_id },
          { $inc: { comment_count: -1 } }
        );
      }
    }

    res.json({ detail: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ detail: 'Failed to delete comment' });
  }
});

// Like a comment
router.post('/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { user_id, username, avatar } = req.user;

    // Find comment
    const comment = await Comment.findOne({ id: commentId });
    if (!comment) {
      return res.status(404).json({ detail: 'Comment not found' });
    }

    // Check if user already liked
    const hasLiked = comment.likes.includes(user_id);

    if (hasLiked) {
      // Unlike
      comment.likes = comment.likes.filter(id => id !== user_id);
      comment.like_count = Math.max(0, comment.like_count - 1);
    } else {
      // Like
      comment.likes.push(user_id);
      comment.like_count += 1;

      // Create notification for comment author (if not self-like)
      if (comment.user_id !== user_id) {
        const notification = new Notification({
          user_id: comment.user_id,
          actor_id: user_id,
          actor_username: username,
          actor_avatar: avatar,
          type: 'comment_like',
          post_id: comment.post_id,
          comment_id: comment.id,
          text: 'liked your comment'
        });
        await notification.save();

        // Emit WebSocket event for real-time notification
        if (req.app.get('io')) {
          req.app.get('io').to(comment.user_id).emit('notification', {
            ...notification.toObject(),
            id: notification.id
          });
        }
      }
    }

    await comment.save();

    res.json({
      ...comment.toObject(),
      id: comment.id,
      has_liked: comment.likes.includes(user_id)
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ detail: 'Failed to like comment' });
  }
});

// Unlike a comment (alternative endpoint)
router.delete('/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { user_id } = req.user;

    // Find comment
    const comment = await Comment.findOne({ id: commentId });
    if (!comment) {
      return res.status(404).json({ detail: 'Comment not found' });
    }

    // Remove like
    comment.likes = comment.likes.filter(id => id !== user_id);
    comment.like_count = Math.max(0, comment.like_count - 1);
    await comment.save();

    res.json({
      ...comment.toObject(),
      id: comment.id,
      has_liked: false
    });
  } catch (error) {
    console.error('Error unliking comment:', error);
    res.status(500).json({ detail: 'Failed to unlike comment' });
  }
});

// React to a comment (emoji reactions)
router.post('/:commentId/react', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reaction_type } = req.body;
    const { user_id, username, avatar } = req.user;

    // Validate reaction type
    const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry'];
    if (!reaction_type || !validReactions.includes(reaction_type)) {
      return res.status(400).json({ detail: 'Invalid reaction type' });
    }

    // Find comment
    const comment = await Comment.findOne({ id: commentId });
    if (!comment) {
      return res.status(404).json({ detail: 'Comment not found' });
    }

    // Check if user already reacted
    const existingReaction = comment.reactions.find(r => r.user_id === user_id);

    if (existingReaction) {
      if (existingReaction.type === reaction_type) {
        // Same reaction - remove it (toggle off)
        comment.reactions = comment.reactions.filter(r => r.user_id !== user_id);
      } else {
        // Different reaction - update it
        existingReaction.type = reaction_type;
        existingReaction.created_at = new Date();
      }
    } else {
      // New reaction - add it
      comment.reactions.push({
        user_id,
        type: reaction_type,
        created_at: new Date()
      });

      // Create notification for comment author (if not self-reaction)
      if (comment.user_id !== user_id) {
        const reactionEmojis = {
          like: '👍',
          love: '❤️',
          laugh: '😂',
          wow: '😮',
          sad: '😢',
          angry: '😡'
        };
        
        const notification = new Notification({
          user_id: comment.user_id,
          actor_id: user_id,
          actor_username: username,
          actor_avatar: avatar,
          type: 'comment_like',
          post_id: comment.post_id,
          comment_id: comment.id,
          text: `reacted ${reactionEmojis[reaction_type]} to your comment`
        });
        await notification.save();

        // Emit WebSocket event for real-time notification
        if (req.app.get('io')) {
          req.app.get('io').to(comment.user_id).emit('notification', {
            ...notification.toObject(),
            id: notification.id
          });
        }
      }
    }

    await comment.save();

    // Emit WebSocket event for real-time reaction update
    if (req.app.get('io')) {
      req.app.get('io').to(`post_${comment.post_id}`).emit('comment_reaction', {
        comment_id: commentId,
        user_id,
        reaction_type: existingReaction && existingReaction.type === reaction_type ? null : reaction_type,
        reactions: comment.reactions
      });
    }

    // Calculate reaction summary
    const reactionSummary = {};
    comment.reactions.forEach(r => {
      reactionSummary[r.type] = (reactionSummary[r.type] || 0) + 1;
    });

    const userReaction = comment.reactions.find(r => r.user_id === user_id);

    res.json({
      ...comment.toObject(),
      id: comment.id,
      has_liked: comment.likes.includes(user_id),
      user_reaction: userReaction ? userReaction.type : null,
      reaction_summary: reactionSummary
    });
  } catch (error) {
    console.error('Error reacting to comment:', error);
    res.status(500).json({ detail: 'Failed to react to comment' });
  }
});

// Remove reaction from a comment
router.delete('/:commentId/react/:reactionType', authenticateToken, async (req, res) => {
  try {
    const { commentId, reactionType } = req.params;
    const { user_id } = req.user;

    // Find comment
    const comment = await Comment.findOne({ id: commentId });
    if (!comment) {
      return res.status(404).json({ detail: 'Comment not found' });
    }

    // Remove user's reaction
    comment.reactions = comment.reactions.filter(r => r.user_id !== user_id);
    await comment.save();

    // Emit WebSocket event for real-time reaction update
    if (req.app.get('io')) {
      req.app.get('io').to(`post_${comment.post_id}`).emit('comment_reaction', {
        comment_id: commentId,
        user_id,
        reaction_type: null,
        reactions: comment.reactions
      });
    }

    // Calculate reaction summary
    const reactionSummary = {};
    comment.reactions.forEach(r => {
      reactionSummary[r.type] = (reactionSummary[r.type] || 0) + 1;
    });

    res.json({
      ...comment.toObject(),
      id: comment.id,
      has_liked: comment.likes.includes(user_id),
      user_reaction: null,
      reaction_summary: reactionSummary
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ detail: 'Failed to remove reaction' });
  }
});

module.exports = router;
