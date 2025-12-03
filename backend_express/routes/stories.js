const express = require('express');
const Story = require('../models/Story');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { uploadToCloudinary } = require('../utils/cloudinary');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/stories/upload - Upload story media
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }

    // Detect media type
    const isVideo = req.file.mimetype.startsWith('video/');
    const isImage = req.file.mimetype.startsWith('image/');

    if (!isVideo && !isImage) {
      return res.status(400).json({ detail: 'Only images and videos are allowed' });
    }

    // Validate file size
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        detail: `File too large. Maximum size is ${isVideo ? '50MB' : '10MB'}` 
      });
    }

    const result = await uploadToCloudinary(
      req.file.buffer, 
      'stories',
      isVideo ? { resource_type: 'video' } : {}
    );

    res.json({ 
      url: result.url,
      media_type: isVideo ? 'video' : 'image'
    });
  } catch (error) {
    console.error('Upload story media error:', error);
    res.status(500).json({ detail: 'Media upload failed' });
  }
});

// POST /api/stories - Create new story
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { media_url, media_type } = req.body;

    if (!media_url || !media_type) {
      return res.status(400).json({ detail: 'Media URL and media type are required' });
    }

    if (!['image', 'video'].includes(media_type)) {
      return res.status(400).json({ detail: 'Media type must be either "image" or "video"' });
    }

    const user = await User.findOne({ id: req.userId });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Story expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = new Story({
      user_id: user.id,
      username: user.username,
      user_avatar: user.avatar,
      media_url,
      media_type,
      views: [],
      expires_at: expiresAt
    });

    await story.save();

    res.status(201).json({
      id: story.id,
      user_id: story.user_id,
      username: story.username,
      user_avatar: story.user_avatar,
      media_url: story.media_url,
      media_type: story.media_type,
      views_count: 0,
      created_at: story.created_at,
      expires_at: story.expires_at
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/stories - Get active stories from followed users and self
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.userId });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Get stories from user and people they follow
    const userIds = [user.id, ...user.following];
    const now = new Date();

    const stories = await Story.find({
      user_id: { $in: userIds },
      expires_at: { $gt: now }
    }).sort({ created_at: -1 });

    // Group stories by user
    const storiesByUser = {};
    stories.forEach(story => {
      if (!storiesByUser[story.user_id]) {
        storiesByUser[story.user_id] = {
          user_id: story.user_id,
          username: story.username,
          user_avatar: story.user_avatar,
          stories: [],
          has_viewed_all: true
        };
      }

      const hasViewed = story.views.some(v => v.user_id === req.userId);
      if (!hasViewed) {
        storiesByUser[story.user_id].has_viewed_all = false;
      }

      storiesByUser[story.user_id].stories.push({
        id: story.id,
        media_url: story.media_url,
        media_type: story.media_type,
        views_count: story.views.length,
        has_viewed: hasViewed,
        created_at: story.created_at,
        expires_at: story.expires_at
      });
    });

    // Convert to array and sort (unviewed first, then own stories, then by latest)
    const result = Object.values(storiesByUser).sort((a, b) => {
      // Own stories first
      if (a.user_id === user.id) return -1;
      if (b.user_id === user.id) return 1;
      // Then unviewed stories
      if (!a.has_viewed_all && b.has_viewed_all) return -1;
      if (a.has_viewed_all && !b.has_viewed_all) return 1;
      // Then by latest story
      return new Date(b.stories[0].created_at) - new Date(a.stories[0].created_at);
    });

    res.json(result);
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/stories/user/:userId - Get specific user's active stories
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();

    const stories = await Story.find({
      user_id: userId,
      expires_at: { $gt: now }
    }).sort({ created_at: 1 }); // Oldest first for viewing

    const result = stories.map(story => ({
      id: story.id,
      user_id: story.user_id,
      username: story.username,
      user_avatar: story.user_avatar,
      media_url: story.media_url,
      media_type: story.media_type,
      views_count: story.views.length,
      has_viewed: story.views.some(v => v.user_id === req.userId),
      created_at: story.created_at,
      expires_at: story.expires_at
    }));

    res.json(result);
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/stories/:storyId/view - Mark story as viewed
router.post('/:storyId/view', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const story = await Story.findOne({ id: storyId });

    if (!story) {
      return res.status(404).json({ detail: 'Story not found' });
    }

    // Check if already viewed
    const alreadyViewed = story.views.some(v => v.user_id === req.userId);
    if (alreadyViewed) {
      return res.json({ message: 'Story already viewed' });
    }

    // Add view
    await Story.updateOne(
      { id: storyId },
      { $push: { views: { user_id: req.userId, viewed_at: new Date() } } }
    );

    res.json({ message: 'Story viewed successfully' });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// DELETE /api/stories/:storyId - Delete story
router.delete('/:storyId', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const story = await Story.findOne({ id: storyId });

    if (!story) {
      return res.status(404).json({ detail: 'Story not found' });
    }

    // Check if user is the owner
    if (story.user_id !== req.userId) {
      return res.status(403).json({ detail: 'You can only delete your own stories' });
    }

    await Story.deleteOne({ id: storyId });
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Cleanup expired stories (called periodically)
router.delete('/cleanup/expired', async (req, res) => {
  try {
    const now = new Date();
    const result = await Story.deleteMany({ expires_at: { $lte: now } });
    res.json({ message: `Deleted ${result.deletedCount} expired stories` });
  } catch (error) {
    console.error('Cleanup expired stories error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

module.exports = router;
