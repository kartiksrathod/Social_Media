const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');
const { uploadToCloudinary } = require('../utils/cloudinary');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to format user to public format
const userToPublic = (user, currentUserId = null) => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    bio: user.bio || '',
    avatar: user.avatar,
    followers: user.followers,
    following: user.following,
    followers_count: user.followers.length,
    following_count: user.following.length,
    is_following: currentUserId ? user.followers.includes(currentUserId) : false
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

    const result = await uploadToCloudinary(req.file.buffer, 'avatars');

    // Update user avatar
    await User.updateOne(
      { id: req.userId },
      { $set: { avatar: result.url } }
    );

    res.json({ url: result.url });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ detail: 'Image upload failed' });
  }
});

// PUT /api/users/me - Update profile (must come before /:username)
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { bio, avatar } = req.body;
    const updateData = {};

    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

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

// GET /api/users/search - Search users
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

// GET /api/users/suggested - Get suggested users
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

// POST /api/users/upload-avatar - Upload avatar
router.post('/upload-avatar', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'avatars');

    // Update user avatar
    await User.updateOne(
      { id: req.userId },
      { $set: { avatar: result.url } }
    );

    res.json({ url: result.url });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ detail: 'Image upload failed' });
  }
});

module.exports = router;
