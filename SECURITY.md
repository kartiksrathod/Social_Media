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

## Known Security Considerations

### Environment Variables
- **JWT_SECRET**: Must be a strong random string (32+ characters)
- **Cloudinary credentials**: Should be kept private and rotated periodically
- **MongoDB URL**: Should use authentication in production

### CORS Configuration
- Default development uses `CORS_ORIGINS=*`
- **Production MUST** specify exact allowed origins
- Example: `CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`

### Rate Limiting
Consider implementing rate limiting for:
- Login attempts (prevent brute force)
- File uploads (prevent abuse)
- API requests (prevent DoS)

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

- [ ] Use HTTPS everywhere
- [ ] Set strong JWT_SECRET (32+ random characters)
- [ ] Configure specific CORS_ORIGINS (no wildcards)
- [ ] Use MongoDB authentication
- [ ] Enable MongoDB encryption at rest
- [ ] Implement rate limiting
- [ ] Set up monitoring and alerts
- [ ] Regular security audits (`yarn audit`)
- [ ] Keep all dependencies updated
- [ ] Use environment variables for secrets
- [ ] Implement backup strategy
- [ ] Set up error logging (but not sensitive data)
- [ ] Configure Content Security Policy headers
- [ ] Implement input validation everywhere
- [ ] Use prepared statements for queries

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
