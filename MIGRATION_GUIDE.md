# FastAPI to Express Migration Guide

## Overview

This guide explains the migration from FastAPI (Python) backend to Express.js (Node.js) backend for the SocialVibe application.

## What Changed

### Backend Framework
- **Before:** FastAPI (Python) + Motor (async MongoDB driver)
- **After:** Express.js (Node.js) + Mongoose (MongoDB ODM)

### File Structure Comparison

**FastAPI Structure:**
```
backend/
├── server.py          # Main server + all routes
├── models.py          # Pydantic models
├── auth.py            # Auth utilities
├── cloudinary_service.py
└── requirements.txt
```

**Express Structure:**
```
backend_express/
├── server.js          # Main server
├── models/            # Mongoose models
│   ├── User.js
│   ├── Post.js
│   └── Notification.js
├── routes/            # Organized routes
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   ├── notifications.js
│   └── hashtags.js
├── middleware/
│   └── auth.js        # JWT middleware
├── utils/
│   ├── cloudinary.js
│   └── helpers.js
└── package.json
```

## Features Preserved

✅ **All features maintained with 100% parity:**

1. **Authentication**
   - Signup with username, email, password
   - Login with JWT tokens
   - Password hashing with bcrypt
   - Protected routes with JWT middleware

2. **User Management**
   - User profiles
   - Follow/unfollow users
   - Search users
   - Suggested users
   - Avatar upload

3. **Posts**
   - Create posts with text/images
   - Like/unlike posts
   - Comments on posts
   - Personalized feed
   - Explore page
   - User posts

4. **Save/Bookmark**
   - Save posts
   - Unsave posts
   - View saved posts

5. **Hashtags**
   - Automatic hashtag extraction
   - Trending hashtags
   - Posts by hashtag

6. **Notifications**
   - Like notifications
   - Comment notifications
   - Follow notifications
   - Mark as read

7. **Image Uploads**
   - Cloudinary integration
   - Avatar uploads
   - Post image uploads

## Database Compatibility

### Schema Preservation

The MongoDB schema remains **identical** between FastAPI and Express:

**Users Collection:**
- All fields preserved: `id`, `username`, `email`, `password_hash`, `bio`, `avatar`, `followers`, `following`, `saved_posts`, `created_at`
- UUIDs used (not MongoDB ObjectIds)

**Posts Collection:**
- All fields preserved: `id`, `author_id`, `author_username`, `author_avatar`, `text`, `image_url`, `hashtags`, `likes`, `comments`, `created_at`
- Comments embedded the same way

**Notifications Collection:**
- All fields preserved: `id`, `user_id`, `actor_id`, `actor_username`, `actor_avatar`, `type`, `post_id`, `text`, `read`, `created_at`

### Indexes Added

The Express backend adds database indexes for improved performance:
- User indexes: `username`, `email`, `id`
- Post indexes: `id`, `author_id`, `hashtags`, `created_at`
- Notification indexes: `user_id + created_at`, `id`

## API Endpoints - Complete Mapping

All endpoints remain **identical** - no changes needed in frontend:

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Login |
| `/api/auth/me` | GET | Get current user |

### Users
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/:username` | GET | Get user profile |
| `/api/users/me` | PUT | Update profile |
| `/api/users/:userId/follow` | POST | Follow user |
| `/api/users/:userId/unfollow` | POST | Unfollow user |
| `/api/users/search?q=query` | GET | Search users |
| `/api/users/suggested` | GET | Suggested users |
| `/api/users/upload-avatar` | POST | Upload avatar |

### Posts
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/posts` | POST | Create post |
| `/api/posts/upload-image` | POST | Upload image |
| `/api/posts/feed` | GET | Get feed |
| `/api/posts/explore` | GET | Explore posts |
| `/api/posts/user/:username` | GET | User posts |
| `/api/posts/:postId/like` | POST | Like post |
| `/api/posts/:postId/unlike` | POST | Unlike post |
| `/api/posts/:postId/comments` | POST | Add comment |
| `/api/posts/:postId/comments` | GET | Get comments |
| `/api/posts/:postId/save` | POST | Save post |
| `/api/posts/:postId/unsave` | POST | Unsave post |
| `/api/posts/saved` | GET | Get saved posts |
| `/api/posts/hashtag/:tag` | GET | Posts by hashtag |

### Hashtags
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hashtags/trending` | GET | Trending hashtags |

### Notifications
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications` | GET | Get notifications |
| `/api/notifications/:id/read` | POST | Mark as read |
| `/api/notifications/read-all` | POST | Mark all as read |

## Migration Steps

### Step 1: Install Dependencies

```bash
cd /app/backend_express
yarn install
```

### Step 2: Configure Environment

The `.env` file is already configured with the same values as the FastAPI backend:
- MongoDB connection
- JWT secret
- Cloudinary credentials

### Step 3: Test the Express Backend

```bash
# Start Express server
cd /app/backend_express
node server.js
```

The server will run on port 8001 (same as FastAPI).

### Step 4: Verify with Existing Data

The Express backend will work with your **existing MongoDB data** - no migration needed!

### Step 5: Update Supervisor Configuration

To switch from FastAPI to Express backend:

1. Backup current supervisor config:
```bash
sudo cp /etc/supervisor/conf.d/backend.conf /etc/supervisor/conf.d/backend.conf.backup
```

2. Update backend command in supervisor config to use Node.js:
```bash
sudo nano /etc/supervisor/conf.d/backend.conf
```

Change:
```ini
command=uvicorn server:app --host 0.0.0.0 --port 8001
directory=/app/backend
```

To:
```ini
command=node server.js
directory=/app/backend_express
```

3. Reload supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart backend
```

### Step 6: Verify Everything Works

```bash
# Check backend status
sudo supervisorctl status backend

# Check logs
sudo tail -f /var/log/supervisor/backend.*.log

# Test health endpoint
curl http://localhost:8001/api/health
```

## No Frontend Changes Needed

The frontend **does not need any changes** because:

1. ✅ All API endpoints are identical
2. ✅ Request/response formats are the same
3. ✅ Authentication flow is identical (JWT tokens)
4. ✅ Error responses use same format (`{ detail: "message" }`)
5. ✅ CORS is configured identically

## Benefits of Express Backend

### 1. **Performance**
- Node.js event loop for async operations
- Native JavaScript - no Python/JS context switching
- Efficient JSON handling

### 2. **Ecosystem**
- Larger npm package ecosystem
- More middleware options
- Better TypeScript support (if needed later)

### 3. **Development**
- Unified JavaScript stack (frontend + backend)
- Easier for JavaScript developers
- Hot reload with nodemon

### 4. **Scalability**
- Better horizontal scaling
- Efficient connection pooling with Mongoose
- Lower memory footprint

## Testing Checklist

After migration, verify these features:

- [ ] Signup new user
- [ ] Login with existing user
- [ ] Create post with hashtags
- [ ] Like/unlike post
- [ ] Comment on post
- [ ] Follow/unfollow user
- [ ] Save/unsave post
- [ ] Search users
- [ ] View trending hashtags
- [ ] Upload avatar
- [ ] Upload post image
- [ ] View notifications
- [ ] Personalized feed
- [ ] Explore page

## Rollback Plan

If you need to rollback to FastAPI:

```bash
# Restore supervisor config
sudo cp /etc/supervisor/conf.d/backend.conf.backup /etc/supervisor/conf.d/backend.conf

# Restart services
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart backend
```

No database changes needed - both backends use the same schema!

## Support

Both backends are fully functional and can run side-by-side for testing:

- **FastAPI:** Port 8001 (current)
- **Express:** Can run on Port 8002 for testing

Simply change `PORT=8002` in `/app/backend_express/.env` for parallel testing.
