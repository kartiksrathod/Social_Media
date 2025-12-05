const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';
const JWT_EXPIRATION_HOURS = parseInt(process.env.JWT_EXPIRATION_HOURS || '24');

// Helper function to create JWT token
const createAccessToken = (userId) => {
  const expiresIn = `${JWT_EXPIRATION_HOURS}h`;
  return jwt.sign({ sub: userId }, JWT_SECRET, { 
    algorithm: JWT_ALGORITHM,
    expiresIn 
  });
};

// POST /api/auth/signup - Create new user
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ detail: 'All fields are required' });
    }

    // Check if username exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ detail: 'Username already registered' });
    }

    // Check if email exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ detail: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      email,
      password_hash,
      bio: '',
      avatar: null,
      followers: [],
      following: [],
      saved_posts: []
    });

    await newUser.save();

    // Create access token
    const access_token = createAccessToken(newUser.id);

    res.status(201).json({ 
      access_token,
      token_type: 'bearer'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ detail: 'Username and password are required' });
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ detail: 'Invalid username or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ detail: 'Invalid username or password' });
    }

    // Create access token
    const access_token = createAccessToken(user.id);

    res.json({ 
      access_token,
      token_type: 'bearer'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.userId }).select('-password_hash -_id -__v');
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      followers: user.followers,
      following: user.following,
      followers_count: user.followers.length,
      following_count: user.following.length,
      is_following: false
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

module.exports = router;
