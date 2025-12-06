const { doubleCsrf } = require('csrf-csrf');
const cookieParser = require('cookie-parser');

/**
 * ===== CSRF PROTECTION =====
 * Protects against Cross-Site Request Forgery attacks
 * Uses double-submit cookie pattern
 */

// Configure CSRF protection
const {
  generateToken, // Generate a CSRF token
  doubleCsrfProtection, // Middleware to validate CSRF tokens
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'your-csrf-secret-key-change-in-production',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
    httpOnly: true,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  size: 64, // Size of the token
  getTokenFromRequest: (req) => {
    // Check header first, then body
    return req.headers['x-csrf-token'] || req.body._csrf;
  },
});

/**
 * Middleware to generate and send CSRF token
 * This should be called on routes that need to provide a token
 */
const csrfTokenGenerator = (req, res, next) => {
  const token = generateToken(req, res);
  req.csrfToken = token;
  next();
};

/**
 * Endpoint to get CSRF token
 * Frontend should call this before making state-changing requests
 */
const getCsrfToken = (req, res) => {
  const token = generateToken(req, res);
  res.json({ csrfToken: token });
};

/**
 * Routes that should be exempt from CSRF protection
 * Typically used for public APIs or webhooks
 */
const csrfExemptPaths = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/signup',
];

/**
 * Conditional CSRF protection middleware
 * Skips protection for exempt paths and GET requests
 */
const conditionalCsrfProtection = (req, res, next) => {
  // Skip CSRF for exempt paths
  if (csrfExemptPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Apply CSRF protection for state-changing methods
  doubleCsrfProtection(req, res, next);
};

/**
 * Error handler for CSRF validation failures
 */
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN' || err.message.includes('CSRF')) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'Your session may have expired. Please refresh the page and try again.'
    });
  }
  next(err);
};

module.exports = {
  cookieParser,
  csrfTokenGenerator,
  getCsrfToken,
  doubleCsrfProtection,
  conditionalCsrfProtection,
  csrfErrorHandler,
};
