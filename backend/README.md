# SocialVibe Express Backend

MERN Stack backend for SocialVibe social media application.

## Tech Stack

- **Express.js** - Web framework
- **MongoDB** - Database (via Mongoose)
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Cloudinary** - Image uploads
- **Multer** - File upload handling

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend_express
yarn install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret key for JWT tokens
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### 3. Start the Server

**Development mode with auto-reload:**
```bash
yarn dev
```

**Production mode:**
```bash
yarn start
```

The server will run on `http://localhost:8001` by default.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/me` - Update profile
- `POST /api/users/:userId/follow` - Follow user
- `POST /api/users/:userId/unfollow` - Unfollow user
- `GET /api/users/search?q=query` - Search users
- `GET /api/users/suggested` - Get suggested users
- `POST /api/users/upload-avatar` - Upload avatar

### Posts
- `POST /api/posts` - Create post
- `POST /api/posts/upload-image` - Upload post image
- `GET /api/posts/feed` - Get personalized feed
- `GET /api/posts/explore` - Get all posts
- `GET /api/posts/user/:username` - Get user posts
- `POST /api/posts/:postId/like` - Like post
- `POST /api/posts/:postId/unlike` - Unlike post
- `POST /api/posts/:postId/comments` - Add comment
- `GET /api/posts/:postId/comments` - Get comments
- `POST /api/posts/:postId/save` - Save post
- `POST /api/posts/:postId/unsave` - Unsave post
- `GET /api/posts/saved` - Get saved posts

### Hashtags
- `GET /api/hashtags/trending` - Get trending hashtags
- `GET /api/posts/hashtag/:tag` - Get posts by hashtag

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications/:notificationId/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read

## Project Structure

```
backend_express/
├── models/              # Mongoose models
│   ├── User.js
│   ├── Post.js
│   └── Notification.js
├── routes/             # API routes
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   └── notifications.js
├── middleware/         # Middleware functions
│   └── auth.js
├── utils/              # Helper utilities
│   ├── cloudinary.js
│   └── helpers.js
├── server.js           # Main server file
├── package.json
└── .env
```

## Features

✅ User authentication (signup/login with JWT)
✅ User profiles with follow/unfollow
✅ Create posts with text and images
✅ Like and comment on posts
✅ Save/bookmark posts
✅ Hashtag extraction and trending
✅ Notifications for likes, comments, follows
✅ Image uploads via Cloudinary
✅ Search users
✅ Personalized feed

## Migration Notes

This backend is a complete migration from FastAPI (Python) to Express.js (Node.js) with:

1. **Full feature parity** - All endpoints and functionality preserved
2. **Same data structure** - Compatible with existing MongoDB data
3. **Same API contracts** - Frontend can connect without changes
4. **Improved performance** - Native JavaScript async/await
5. **Better ecosystem** - Access to npm packages

## Database Collections

- **users** - User accounts and profiles
- **posts** - User posts with hashtags and comments
- **notifications** - User notifications

All collections use UUID (v4) for IDs instead of MongoDB ObjectId for better compatibility.
