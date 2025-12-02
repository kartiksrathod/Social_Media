const express = require('express');
const Post = require('../models/Post');

const router = express.Router();

// GET /api/hashtags/trending - Get trending hashtags
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await Post.aggregate([
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    res.json(result.map(item => ({ tag: item._id, count: item.count })));
  } catch (error) {
    console.error('Get trending hashtags error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

module.exports = router;
