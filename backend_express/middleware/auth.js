const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';

// Middleware to verify JWT token and extract user ID
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ detail: 'Authorization token required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    req.userId = payload.sub; // Extract user ID from 'sub' claim
    next();
  } catch (error) {
    return res.status(401).json({ detail: 'Could not validate credentials' });
  }
};

module.exports = { authenticateToken };
