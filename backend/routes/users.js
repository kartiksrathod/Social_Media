const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { processAvatar, validateImageFile } = require('../utils/imageProcessor');
const multer = require('multer');

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Helper to format user to public format
const userToPublic = (user, currentUserId = null, currentUser = null) => {
  return {
    id: user.id,
    username: user.username,
    name: user.name || '',
    email: user.email,
    bio: user.bio || '',
    avatar: user.avatar,
    avatar_url: user.avatar,
    created_at: user.created_at,
    followers: user.followers,
    following: user.following,
    followers_count: user.followers.length,
    following_count: user.following.length,
    is_following: currentUserId ? user.followers.includes(currentUserId) : false,
    is_close_friend: currentUser ? currentUser.close_friends.includes(user.id) : false
  };
};

// GET /api/users/search - Search users (must come before /:username)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ detail: 'Search query required' });
    }

    const users = await User.find(
      { username: { $regex: q, $options: 'i' } }
    ).limit(20);

    res.json(users.map(user => userToPublic(user, req.userId)));
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/users/suggested - Get suggested users (must come before /:username)
router.get('/suggested', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ id: req.userId });
    const excludeIds = [req.userId, ...currentUser.following];

    const users = await User.find(
      { id: { $nin: excludeIds } }
    ).limit(5);

    res.json(users.map(user => userToPublic(user, req.userId)));
  } catch (error) {
    console.error('Suggested users error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/users/upload-avatar - Upload avatar (must come before /:username)
router.post('/upload-avatar', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }

    // Validate image file
    validateImageFile(req.file);

    // Process and compress avatar (smaller dimensions for avatars)
    const processed = await processAvatar(req.file.buffer);
    
    console.log(`Avatar compression: ${(processed.originalSize / 1024).toFixed(1)}KB -> ${(processed.size / 1024).toFixed(1)}KB (${processed.compressionRatio} saved)`);

    // Upload compressed avatar to Cloudinary
    const result = await uploadToCloudinary(processed.buffer, 'avatars', {
      width: processed.width,
      height: processed.height,
      format: processed.format
    });

    // Update user avatar
    await User.updateOne(
      { id: req.userId },
      { $set: { avatar: result.url } }
    );

    res.json({ 
      url: result.url,
      width: result.width,
      height: result.height,
      format: result.format,
      compressionRatio: processed.compressionRatio
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ detail: error.message || 'Image upload failed' });
  }
});

// PUT /api/users/me - Update profile (must come before /:username)
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { bio, avatar, username, name } = req.body;
    const updateData = {};

    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (name !== undefined) updateData.name = name;
    
    // Handle username change with validation
    if (username !== undefined) {
      const trimmedUsername = username.trim();
      
      // Validate username
      if (!trimmedUsername) {
        return res.status(400).json({ detail: 'Username cannot be empty' });
      }
      
      if (trimmedUsername.length < 3) {
        return res.status(400).json({ detail: 'Username must be at least 3 characters' });
      }
      
      if (trimmedUsername.length > 30) {
        return res.status(400).json({ detail: 'Username must be less than 30 characters' });
      }
      
      // Check if username contains only valid characters
      if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
        return res.status(400).json({ detail: 'Username can only contain letters, numbers, and underscores' });
      }
      
      // Check if username is already taken by another user
      const existingUser = await User.findOne({ username: trimmedUsername });
      if (existingUser && existingUser.id !== req.userId) {
        return res.status(400).json({ detail: 'Username already taken' });
      }
      
      updateData.username = trimmedUsername;
    }

    const user = await User.findOneAndUpdate(
      { id: req.userId },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    res.json(userToPublic(user, req.userId));
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/users/:userId/follow - Follow user
router.post('/:userId/follow', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.userId) {
      return res.status(400).json({ detail: 'Cannot follow yourself' });
    }

    const currentUser = await User.findOne({ id: req.userId });
    const targetUser = await User.findOne({ id: userId });

    if (!targetUser) {
      return res.status(404).json({ detail: 'User not found' });
    }

    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ detail: 'Already following this user' });
    }

    // Add to following list
    await User.updateOne(
      { id: req.userId },
      { $push: { following: userId } }
    );

    // Add to followers list
    await User.updateOne(
      { id: userId },
      { $push: { followers: req.userId } }
    );

    // Create notification
    const notification = new Notification({
      user_id: userId,
      actor_id: req.userId,
      actor_username: currentUser.username,
      actor_avatar: currentUser.avatar,
      type: 'follow'
    });
    await notification.save();

    // Emit real-time notification
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const targetSocketId = userSockets.get(userId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('new_notification', notification);
    }

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/users/:userId/unfollow - Unfollow user
router.post('/:userId/unfollow', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.userId) {
      return res.status(400).json({ detail: 'Cannot unfollow yourself' });
    }

    const currentUser = await User.findOne({ id: req.userId });

    if (!currentUser.following.includes(userId)) {
      return res.status(400).json({ detail: 'Not following this user' });
    }

    // Remove from following list
    await User.updateOne(
      { id: req.userId },
      { $pull: { following: userId } }
    );

    // Remove from followers list
    await User.updateOne(
      { id: userId },
      { $pull: { followers: req.userId } }
    );

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/users/:userId/followers - Get user followers
router.get('/:userId/followers', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUser = await User.findOne({ id: userId });

    if (!targetUser) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const followers = await User.find({ id: { $in: targetUser.followers } });
    res.json(followers.map(user => userToPublic(user, req.userId)));
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/users/:userId/following - Get user following
router.get('/:userId/following', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUser = await User.findOne({ id: userId });

    if (!targetUser) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const following = await User.find({ id: { $in: targetUser.following } });
    res.json(following.map(user => userToPublic(user, req.userId)));
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/users/close-friends/add - Add user to close friends
router.post('/close-friends/add', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ detail: 'User ID required' });
    }

    if (user_id === req.userId) {
      return res.status(400).json({ detail: 'Cannot add yourself to close friends' });
    }

    const targetUser = await User.findOne({ id: user_id });
    if (!targetUser) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const currentUser = await User.findOne({ id: req.userId });

    if (currentUser.close_friends.includes(user_id)) {
      return res.status(400).json({ detail: 'User already in close friends' });
    }

    // Add to close friends list
    await User.updateOne(
      { id: req.userId },
      { $push: { close_friends: user_id } }
    );

    // Create notification
    const notification = new Notification({
      user_id: user_id,
      actor_id: req.userId,
      actor_username: currentUser.username,
      actor_avatar: currentUser.avatar,
      type: 'close_friend',
      text: 'added you to their close friends'
    });
    await notification.save();

    // Emit real-time notification
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const targetSocketId = userSockets.get(user_id);
    if (targetSocketId) {
      io.to(targetSocketId).emit('new_notification', notification);
    }

    res.json({ message: 'Successfully added to close friends' });
  } catch (error) {
    console.error('Add close friend error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// DELETE /api/users/close-friends/remove - Remove user from close friends
router.delete('/close-friends/remove', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ detail: 'User ID required' });
    }

    const currentUser = await User.findOne({ id: req.userId });

    if (!currentUser.close_friends.includes(user_id)) {
      return res.status(400).json({ detail: 'User not in close friends' });
    }

    // Remove from close friends list
    await User.updateOne(
      { id: req.userId },
      { $pull: { close_friends: user_id } }
    );

    res.json({ message: 'Successfully removed from close friends' });
  } catch (error) {
    console.error('Remove close friend error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/users/close-friends - Get current user's close friends list
router.get('/close-friends', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ id: req.userId });
    
    if (!currentUser) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const closeFriends = await User.find({ id: { $in: currentUser.close_friends } });
    res.json(closeFriends.map(user => userToPublic(user, req.userId)));
  } catch (error) {
    console.error('Get close friends error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/users/:userId/is-close-friend - Check if user is in close friends
router.get('/:userId/is-close-friend', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findOne({ id: req.userId });

    if (!currentUser) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const isCloseFriend = currentUser.close_friends.includes(userId);
    res.json({ is_close_friend: isCloseFriend });
  } catch (error) {
    console.error('Check close friend error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/users/:username - Get user profile (must come AFTER specific routes)
router.get('/:username', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    res.json(userToPublic(user, req.userId));
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

module.exports = router;
