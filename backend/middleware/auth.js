const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';

// Middleware to verify JWT token and extract user ID
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ detail: 'Authorization token required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    const userId = payload.sub; // Extract user ID from 'sub' claim
    
    // Fetch user details from database
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    
    // Set both req.userId (for backward compatibility) and req.user (for comments route)
    req.userId = userId;
    req.user = {
      user_id: user.id,
      username: user.username,
      avatar: user.avatar
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ detail: 'Could not validate credentials' });
  }
};

module.exports = { authenticateToken };
