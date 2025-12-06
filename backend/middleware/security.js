const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const validator = require('validator');

/**
 * ===== API RATE LIMITING =====
 * Prevents abuse by limiting requests per IP
 */

// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health check
  skip: (req) => req.path === '/api/health'
});

// Strict rate limiter for auth endpoints - 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/signup attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false // Count successful requests too
});

// Brute-force protection for login - slows down repeated attempts
const loginSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // Allow 2 requests per windowMs at full speed
  delayMs: (used) => {
    // Add 500ms delay for each request after delayAfter
    const delayAfter = 2;
    return (used - delayAfter) * 500;
  },
  maxDelayMs: 5000, // Maximum delay of 5 seconds
});

// Create post rate limiter - 10 posts per hour
const postCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'You have reached the maximum number of posts per hour. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Message rate limiter - 50 messages per minute
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  message: {
    error: 'You are sending messages too quickly. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Upload rate limiter - 20 uploads per hour
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    error: 'Upload limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * ===== INPUT SANITIZATION =====
 * Prevents XSS and injection attacks
 */

// Sanitize user input to prevent XSS
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Escape HTML entities
        req.body[key] = validator.escape(req.body[key]);
      }
    });
  }

  // Sanitize query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = validator.escape(req.query[key]);
      }
    });
  }

  // Sanitize params
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = validator.escape(req.params[key]);
      }
    });
  }

  next();
};

// Validate email format
const validateEmail = (email) => {
  return validator.isEmail(email);
};

// Validate username format (alphanumeric + underscore, 3-20 chars)
const validateUsername = (username) => {
  return validator.matches(username, /^[a-zA-Z0-9_]{3,20}$/);
};

// Validate URL format
const validateURL = (url) => {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true
  });
};

// Strong password validation
const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0
  });
};

/**
 * ===== MONGODB INJECTION PREVENTION =====
 */
const mongoSanitizer = mongoSanitize({
  replaceWith: '_', // Replace prohibited characters with underscore
  onSanitize: ({ req, key }) => {
    console.warn(`Attempted MongoDB injection on key: ${key}`);
  }
});

/**
 * ===== HTTP PARAMETER POLLUTION PREVENTION =====
 */
const hppProtection = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit'] // Allow these params to appear multiple times
});

/**
 * ===== SECURITY HEADERS =====
 * Set various HTTP headers for security
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy (formerly Feature Policy)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * ===== REQUEST VALIDATION =====
 */

// Validate common request fields
const validateRequest = (validations) => {
  return async (req, res, next) => {
    const errors = [];

    for (const field in validations) {
      const value = req.body[field] || req.query[field] || req.params[field];
      const rules = validations[field];

      if (rules.required && !value) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value) {
        if (rules.type === 'email' && !validateEmail(value)) {
          errors.push(`${field} must be a valid email`);
        }
        if (rules.type === 'username' && !validateUsername(value)) {
          errors.push(`${field} must be 3-20 alphanumeric characters or underscore`);
        }
        if (rules.type === 'url' && !validateURL(value)) {
          errors.push(`${field} must be a valid URL`);
        }
        if (rules.type === 'password' && !validatePassword(value)) {
          errors.push(`${field} must be at least 8 characters with uppercase, lowercase, and number`);
        }
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must not exceed ${rules.maxLength} characters`);
        }
        if (rules.pattern && !validator.matches(value, rules.pattern)) {
          errors.push(`${field} format is invalid`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
};

/**
 * ===== BRUTE FORCE PROTECTION =====
 */

// Track failed login attempts
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

const bruteForceProtection = (req, res, next) => {
  const identifier = req.body.email || req.body.username || req.ip;
  const attempts = loginAttempts.get(identifier);

  if (attempts) {
    const { count, lockedUntil } = attempts;

    // Check if still locked out
    if (lockedUntil && Date.now() < lockedUntil) {
      const remainingTime = Math.ceil((lockedUntil - Date.now()) / 1000 / 60);
      return res.status(429).json({
        error: `Too many failed login attempts. Account locked for ${remainingTime} more minutes.`
      });
    }

    // Check if max attempts reached
    if (count >= MAX_ATTEMPTS) {
      const lockedUntil = Date.now() + LOCKOUT_TIME;
      loginAttempts.set(identifier, { count, lockedUntil });
      return res.status(429).json({
        error: `Too many failed login attempts. Account locked for 15 minutes.`
      });
    }
  }

  next();
};

// Record failed login attempt
const recordFailedLogin = (identifier) => {
  const attempts = loginAttempts.get(identifier) || { count: 0, lockedUntil: null };
  attempts.count += 1;
  loginAttempts.set(identifier, attempts);
};

// Clear login attempts on successful login
const clearLoginAttempts = (identifier) => {
  loginAttempts.delete(identifier);
};

// Clean up old login attempts every hour
setInterval(() => {
  const now = Date.now();
  for (const [identifier, attempts] of loginAttempts.entries()) {
    if (attempts.lockedUntil && now > attempts.lockedUntil + LOCKOUT_TIME) {
      loginAttempts.delete(identifier);
    }
  }
}, 60 * 60 * 1000);

module.exports = {
  // Rate limiters
  apiLimiter,
  authLimiter,
  loginSpeedLimiter,
  postCreationLimiter,
  messageLimiter,
  uploadLimiter,
  
  // Input sanitization
  sanitizeInput,
  validateEmail,
  validateUsername,
  validateURL,
  validatePassword,
  
  // Protection middleware
  mongoSanitizer,
  hppProtection,
  securityHeaders,
  
  // Request validation
  validateRequest,
  
  // Brute force protection
  bruteForceProtection,
  recordFailedLogin,
  clearLoginAttempts
};
