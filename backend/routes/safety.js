const express = require('express');
const Block = require('../models/Block');
const Report = require('../models/Report');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ============================================
// BLOCK ROUTES
// ============================================

// POST /api/safety/block - Block a user
router.post('/block', authenticateToken, async (req, res) => {
  try {
    const { user_id, reason } = req.body;

    if (!user_id) {
      return res.status(400).json({ detail: 'User ID is required' });
    }

    // Can't block yourself
    if (user_id === req.userId) {
      return res.status(400).json({ detail: 'You cannot block yourself' });
    }

    const blocker = await User.findOne({ id: req.userId });
    const blocked = await User.findOne({ id: user_id });

    if (!blocked) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Check if already blocked
    const existingBlock = await Block.findOne({
      blocker_id: req.userId,
      blocked_id: user_id
    });

    if (existingBlock) {
      return res.status(400).json({ detail: 'User already blocked' });
    }

    const block = new Block({
      blocker_id: req.userId,
      blocked_id: user_id,
      blocker_username: blocker.username,
      blocked_username: blocked.username,
      reason: reason || ''
    });

    await block.save();

    // Remove follow relationships
    await User.updateOne(
      { id: req.userId },
      { $pull: { following: user_id, followers: user_id } }
    );
    await User.updateOne(
      { id: user_id },
      { $pull: { following: req.userId, followers: req.userId } }
    );

    res.json({
      message: 'User blocked successfully',
      block: {
        id: block.id,
        blocked_id: user_id,
        blocked_username: blocked.username,
        created_at: block.created_at
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ detail: 'Failed to block user' });
  }
});

// DELETE /api/safety/block/:userId - Unblock a user
router.delete('/block/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const block = await Block.findOneAndDelete({
      blocker_id: req.userId,
      blocked_id: userId
    });

    if (!block) {
      return res.status(404).json({ detail: 'Block not found' });
    }

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ detail: 'Failed to unblock user' });
  }
});

// GET /api/safety/blocks - Get list of blocked users
router.get('/blocks', authenticateToken, async (req, res) => {
  try {
    const blocks = await Block.find({ blocker_id: req.userId })
      .sort({ created_at: -1 })
      .lean();

    // Get full user details for blocked users
    const blockedUserIds = blocks.map(b => b.blocked_id);
    const blockedUsers = await User.find({ id: { $in: blockedUserIds } })
      .select('id username name avatar bio')
      .lean();

    const blockedUsersMap = {};
    blockedUsers.forEach(user => {
      blockedUsersMap[user.id] = user;
    });

    const blocksWithDetails = blocks.map(block => ({
      ...block,
      blocked_user: blockedUsersMap[block.blocked_id] || null
    }));

    res.json({ data: blocksWithDetails });
  } catch (error) {
    console.error('Get blocks error:', error);
    res.status(500).json({ detail: 'Failed to get blocked users' });
  }
});

// GET /api/safety/is-blocked/:userId - Check if a user is blocked
router.get('/is-blocked/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const block = await Block.findOne({
      blocker_id: req.userId,
      blocked_id: userId
    });

    res.json({ is_blocked: !!block });
  } catch (error) {
    console.error('Check block error:', error);
    res.status(500).json({ detail: 'Failed to check block status' });
  }
});

// ============================================
// REPORT ROUTES
// ============================================

// POST /api/safety/report - Report a post, comment, or user
router.post('/report', authenticateToken, async (req, res) => {
  try {
    const { type, target_id, reason, description } = req.body;

    if (!type || !target_id || !reason) {
      return res.status(400).json({ 
        detail: 'Type, target_id, and reason are required' 
      });
    }

    if (!['post', 'comment', 'user'].includes(type)) {
      return res.status(400).json({ detail: 'Invalid report type' });
    }

    const validReasons = [
      'spam', 'harassment', 'hate_speech', 'violence',
      'misinformation', 'nudity', 'illegal', 'other'
    ];

    if (!validReasons.includes(reason)) {
      return res.status(400).json({ detail: 'Invalid reason' });
    }

    const reporter = await User.findOne({ id: req.userId });

    // Check if already reported by this user
    const existingReport = await Report.findOne({
      reporter_id: req.userId,
      type,
      target_id
    });

    if (existingReport) {
      return res.status(400).json({ detail: 'You have already reported this' });
    }

    // Get target username if reporting a user
    let targetUsername = '';
    if (type === 'user') {
      const targetUser = await User.findOne({ id: target_id });
      if (!targetUser) {
        return res.status(404).json({ detail: 'User not found' });
      }
      targetUsername = targetUser.username;
    } else if (type === 'post') {
      const post = await Post.findOne({ id: target_id });
      if (post) {
        targetUsername = post.author_username;
      }
    } else if (type === 'comment') {
      const comment = await Comment.findOne({ id: target_id });
      if (comment) {
        targetUsername = comment.author_username;
      }
    }

    const report = new Report({
      reporter_id: req.userId,
      reporter_username: reporter.username,
      type,
      target_id,
      target_username: targetUsername,
      reason,
      description: description || '',
      status: 'pending'
    });

    await report.save();

    res.json({
      message: 'Report submitted successfully',
      report: {
        id: report.id,
        type: report.type,
        reason: report.reason,
        status: report.status,
        created_at: report.created_at
      }
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ detail: 'Failed to submit report' });
  }
});

// GET /api/safety/reports/my - Get user's submitted reports
router.get('/reports/my', authenticateToken, async (req, res) => {
  try {
    const reports = await Report.find({ reporter_id: req.userId })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    res.json({ data: reports });
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({ detail: 'Failed to get reports' });
  }
});

// GET /api/safety/reports/count/:type/:targetId - Get report count for content
router.get('/reports/count/:type/:targetId', authenticateToken, async (req, res) => {
  try {
    const { type, targetId } = req.params;

    const count = await Report.countDocuments({
      type,
      target_id: targetId,
      status: { $in: ['pending', 'reviewing'] }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get report count error:', error);
    res.status(500).json({ detail: 'Failed to get report count' });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// GET /api/safety/admin/reports - Get all reports (admin only)
router.get('/admin/reports', authenticateToken, async (req, res) => {
  try {
    // Simple admin check - in production, use proper role-based auth
    const adminUser = await User.findOne({ id: req.userId });
    
    // For now, check if user email contains 'admin' or username is 'admin'
    // In production, add an 'is_admin' field to User model
    const isAdmin = adminUser.email.includes('admin') || 
                    adminUser.username === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ detail: 'Admin access required' });
    }

    const { status, type, limit = 50, skip = 0 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const reports = await Report.find(query)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await Report.countDocuments(query);

    // Get counts by status
    const statusCounts = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts = {
      pending: 0,
      reviewing: 0,
      resolved: 0,
      dismissed: 0
    };

    statusCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    res.json({
      data: reports,
      total,
      counts,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('Get admin reports error:', error);
    res.status(500).json({ detail: 'Failed to get reports' });
  }
});

// PATCH /api/safety/admin/reports/:reportId - Update report status (admin only)
router.patch('/admin/reports/:reportId', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, admin_notes } = req.body;

    // Simple admin check
    const adminUser = await User.findOne({ id: req.userId });
    const isAdmin = adminUser.email.includes('admin') || 
                    adminUser.username === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ detail: 'Admin access required' });
    }

    if (!['pending', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ detail: 'Invalid status' });
    }

    const updateData = { status };
    if (admin_notes) updateData.admin_notes = admin_notes;

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolved_by = req.userId;
      updateData.resolved_at = new Date();
    }

    const report = await Report.findOneAndUpdate(
      { id: reportId },
      updateData,
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ detail: 'Report not found' });
    }

    res.json({
      message: 'Report updated successfully',
      report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ detail: 'Failed to update report' });
  }
});

// DELETE /api/safety/admin/reports/:reportId - Delete report (admin only)
router.delete('/admin/reports/:reportId', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;

    // Simple admin check
    const adminUser = await User.findOne({ id: req.userId });
    const isAdmin = adminUser.email.includes('admin') || 
                    adminUser.username === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ detail: 'Admin access required' });
    }

    const report = await Report.findOneAndDelete({ id: reportId });

    if (!report) {
      return res.status(404).json({ detail: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ detail: 'Failed to delete report' });
  }
});

module.exports = router;
