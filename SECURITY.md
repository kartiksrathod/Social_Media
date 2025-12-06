# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of SocialVibe seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please DO NOT:
- Open a public GitHub issue about the vulnerability
- Disclose the vulnerability publicly before it has been addressed

### Please DO:
1. **Email us** at security@socialvibe.com with details about the vulnerability
2. **Include the following information:**
   - Type of vulnerability (XSS, CSRF, SQL injection, etc.)
   - Full paths of source file(s) related to the vulnerability
   - Location of the affected source code (tag/branch/commit/direct URL)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue, including how an attacker might exploit it

### What to Expect:
- **Acknowledgment:** We'll acknowledge your email within 48 hours
- **Communication:** We'll keep you informed about our progress
- **Fix Timeline:** We aim to release a fix within 90 days
- **Credit:** With your permission, we'll publicly thank you for the report

## Security Best Practices

### For Users
1. **Keep credentials secure:**
   - Use strong, unique passwords
   - Never share your password or JWT token
   - Log out when using shared devices

2. **Be cautious with links:**
   - Verify URLs before clicking
   - Report suspicious accounts or content

3. **Enable two-factor authentication** (when available)

### For Developers

1. **Environment Variables:**
   - Never commit `.env` files
   - Use `.env.example` templates
   - Rotate secrets regularly
   - Use strong JWT secrets (32+ characters)

2. **Dependencies:**
   - Regularly run `yarn audit`
   - Keep dependencies up to date
   - Review security advisories

3. **Code Practices:**
   - Validate all user inputs
   - Sanitize data before database queries
   - Use parameterized queries
   - Implement rate limiting
   - Enable CORS properly
   - Never log sensitive information

4. **Authentication:**
   - Use bcrypt for password hashing (10+ rounds)
   - Implement JWT expiration
   - Validate tokens on every request
   - Use HTTPS in production

5. **File Uploads:**
   - Validate file types and sizes
   - Use secure file storage (Cloudinary)
   - Scan uploads for malware
   - Implement upload rate limits

## Implemented Security Features ✅

### 1. Input Sanitization & Validation
- **XSS Prevention**: All user inputs are sanitized using `validator.escape()`
- **HTML Entity Escaping**: Prevents script injection in body, query params, and URL params
- **Email Validation**: RFC-compliant email format validation
- **Username Validation**: Alphanumeric + underscore, 3-20 characters
- **Password Strength**: Minimum 8 characters with uppercase, lowercase, and numbers
- **URL Validation**: Strict HTTP/HTTPS protocol validation

### 2. MongoDB Injection Prevention
- **express-mongo-sanitize**: Automatically removes prohibited characters from user input
- Replaces `$` and `.` operators that could be used for injection attacks
- Logs all sanitization attempts for security monitoring

### 3. CSRF Protection
- **Double-Submit Cookie Pattern**: Uses `csrf-csrf` library
- CSRF tokens required for all state-changing operations (POST, PUT, DELETE, PATCH)
- Automatic token generation via `/api/csrf-token` endpoint
- Exempt paths: health check, login, signup
- 24-hour token expiration
- Tokens transmitted via HTTP-only cookies and validated from headers

**Frontend Integration:**
```javascript
// Get CSRF token before state-changing requests
const response = await fetch('/api/csrf-token');
const { csrfToken } = await response.json();

// Include token in request headers
headers: {
  'X-CSRF-Token': csrfToken
}
```

### 4. Security Headers (via Helmet)
- **Content-Security-Policy (CSP)**: Restricts resource loading sources
  - `default-src 'self'`
  - `img-src 'self' data: https: blob:`
  - `connect-src 'self' ws: wss:`
  - Prevents inline script execution
- **X-Frame-Options: DENY**: Prevents clickjacking attacks
- **X-Content-Type-Options: nosniff**: Prevents MIME type sniffing
- **X-XSS-Protection**: Enables browser XSS filtering
- **Referrer-Policy**: Controls referrer information leakage
- **Permissions-Policy**: Disables geolocation, microphone, camera by default

### 5. HTTP Parameter Pollution (HPP) Prevention
- Prevents parameter pollution attacks
- Whitelisted parameters: `sort`, `fields`, `page`, `limit`
- Blocks duplicate parameter manipulation attempts

### 6. Brute Force Protection
- **In-Memory Tracking**: Tracks failed login attempts per IP/username
- **Lockout Mechanism**: 5 max attempts before 15-minute account lock
- **Progressive Delays**: Adds 500ms delay per failed attempt (max 5 seconds)
- **Auto Cleanup**: Old attempts cleaned up hourly
- **Clear on Success**: Failed attempt counter resets on successful login

### 7. Authentication & Authorization
- **JWT Tokens**: HS256 algorithm with configurable expiration
- **Bcrypt Password Hashing**: Cost factor of 12 for strong encryption
- **Bearer Token Authentication**: Standard Authorization header format
- **Token Validation**: Every protected route validates JWT signature and expiration
- **User Context**: Token payload includes minimal user data to reduce token size

### 8. Request Size Limiting
- **JSON Payload Limit**: 10MB maximum
- **URL-Encoded Data**: 10MB maximum
- Prevents memory exhaustion attacks

## Known Security Considerations

### Environment Variables
- **JWT_SECRET**: Must be a strong random string (32+ characters) - CHANGE IN PRODUCTION
- **CSRF_SECRET**: Must be a strong random string (32+ characters) - CHANGE IN PRODUCTION
- **Cloudinary credentials**: Should be kept private and rotated periodically
- **MongoDB URL**: Should use authentication in production

### CORS Configuration
- Default development uses `CORS_ORIGINS=*`
- **Production MUST** specify exact allowed origins
- Example: `CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`

### Rate Limiting ✅ IMPLEMENTED
The application includes comprehensive rate limiting:

**General API Rate Limiting:**
- 100 requests per 15 minutes per IP
- Applies to all `/api` routes
- Returns `429 Too Many Requests` when exceeded

**Authentication Rate Limiting:**
- 5 login/signup attempts per 15 minutes per IP
- Progressive speed limiting after 2 failed login attempts
- Account lockout after 5 failed attempts (15-minute lockout)
- Automatic cleanup of old login attempts

**Content Creation Rate Limiting:**
- Post creation: 10 posts per hour per IP
- Message sending: 50 messages per minute per IP
- File uploads: 20 uploads per hour per IP

**Rate Limit Headers:**
All rate-limited responses include standard rate limit headers:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in window
- `RateLimit-Reset`: Time when limit resets

### HTTPS
- **Always use HTTPS in production**
- HTTP should only be used in local development
- Configure SSL certificates properly

## Security Updates

We will announce security updates through:
- GitHub Security Advisories
- Release notes
- Email notifications (for critical issues)

## Vulnerability Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 2**: Acknowledgment sent
3. **Day 7**: Initial assessment completed
4. **Day 30**: Fix developed and tested
5. **Day 60**: Fix deployed to production
6. **Day 90**: Public disclosure (if necessary)

## Security Checklist for Production

### Pre-Deployment (Critical)
- [ ] Use HTTPS everywhere (redirect HTTP to HTTPS)
- [ ] Set strong JWT_SECRET (32+ random characters, cryptographically secure)
- [ ] Set strong CSRF_SECRET (32+ random characters, cryptographically secure)
- [ ] Configure specific CORS_ORIGINS (no wildcards - list exact domains)
- [ ] Use MongoDB authentication with strong password
- [ ] Enable MongoDB encryption at rest
- [ ] Change default MongoDB port (27017)

### Configuration
- [x] Rate limiting implemented (API, auth, posts, messages, uploads)
- [x] Input sanitization implemented (XSS prevention)
- [x] CSRF protection enabled
- [x] Security headers configured (Helmet)
- [x] MongoDB injection prevention active
- [x] HPP protection enabled
- [x] Brute force protection active
- [ ] Set up monitoring and alerts (logs, metrics, uptime)
- [ ] Configure error logging service (Sentry, LogRocket)
- [ ] Set up SSL/TLS certificates (Let's Encrypt recommended)

### Ongoing Maintenance
- [ ] Regular security audits (`yarn audit` weekly)
- [ ] Keep all dependencies updated (automated with Dependabot)
- [ ] Review access logs for suspicious activity
- [ ] Rotate secrets quarterly (JWT_SECRET, CSRF_SECRET, API keys)
- [ ] Test backup restoration monthly
- [ ] Review and update CSP headers as needed
- [ ] Penetration testing (annual or after major releases)

### Environment Variables Checklist
```bash
# Required in production .env
JWT_SECRET=<64-char-random-string>
CSRF_SECRET=<64-char-random-string>
MONGO_URL=mongodb://<user>:<pass>@<host>:<port>/<db>?authSource=admin
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
NODE_ENV=production
PORT=8001
```

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

## Contact

For security concerns, contact: security@socialvibe.com

For general questions: support@socialvibe.com

---

Thank you for helping keep SocialVibe and its users safe!
