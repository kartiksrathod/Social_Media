const express = require('express');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications - Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await Notification.find({ user_id: req.userId })
      .sort({ created_at: -1 })
      .limit(limit);

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/notifications/:notificationId/read - Mark notification as read
router.post('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await Notification.updateOne(
      { id: notificationId, user_id: req.userId },
      { $set: { read: true } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ detail: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/notifications/read-all - Mark all notifications as read
router.post('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.userId, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

module.exports = router;
