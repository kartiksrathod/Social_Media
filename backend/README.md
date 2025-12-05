# SocialVibe Backend

Express.js backend server for SocialVibe social media platform.

## Features

- **RESTful API** - Well-structured REST endpoints
- **Real-time Communication** - WebSocket support via Socket.IO
- **Authentication** - JWT-based auth with bcrypt password hashing
- **File Uploads** - Image and video uploads with Cloudinary
- **Database** - MongoDB with Mongoose ODM
- **Validation** - Request validation with express-validator
- **CORS** - Configurable cross-origin resource sharing

## Tech Stack

- Node.js >= 18.0.0
- Express.js 4.x
- MongoDB with Mongoose
- Socket.IO for WebSockets
- JWT for authentication
- Cloudinary for media storage
- Bcrypt for password hashing
- Multer for file uploads

## Project Structure

```
backend/
├── models/              # Mongoose models
│   ├── User.js
│   ├── Post.js
│   ├── Comment.js
│   ├── Notification.js
│   ├── Message.js
│   ├── Conversation.js
│   └── Story.js
├── routes/              # API route handlers
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   ├── comments.js
│   ├── notifications.js
│   ├── messages.js
│   ├── stories.js
│   ├── hashtags.js
│   └── collaborations.js
├── middleware/          # Custom middleware
│   └── auth.js         # JWT authentication
├── utils/               # Utility functions
│   └── cloudinary.js   # Cloudinary configuration
├── server.js            # Application entry point
├── package.json
├── .env.example         # Environment variables template
└── README.md
```

## Installation

### 1. Install Dependencies

```bash
cd backend
yarn install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# MongoDB Connection
MONGO_URL=mongodb://localhost:27017/socialvibe
DB_NAME=socialvibe

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server Configuration
PORT=8001
CORS_ORIGINS=*
```

### 3. Start MongoDB

Ensure MongoDB is running:

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongodb

# Windows
net start MongoDB
```

### 4. Start the Server

```bash
# Development mode with auto-reload
yarn dev

# Production mode
yarn start
```

The server will start on `http://localhost:8001`

## API Endpoints

### Authentication

```
POST   /api/auth/signup        - Register new user
POST   /api/auth/login         - Login user
GET    /api/auth/me            - Get current user
PUT    /api/auth/profile       - Update profile
POST   /api/auth/upload-avatar - Upload avatar
```

### Users

```
GET    /api/users/:username           - Get user profile
GET    /api/users/search              - Search users
POST   /api/users/follow/:userId      - Follow user
POST   /api/users/unfollow/:userId    - Unfollow user
GET    /api/users/:userId/followers   - Get followers
GET    /api/users/:userId/following   - Get following
POST   /api/users/close-friends/add   - Add to close friends
DELETE /api/users/close-friends/remove - Remove from close friends
GET    /api/users/close-friends       - List close friends
```

### Posts

```
GET    /api/posts/feed               - Get user feed
GET    /api/posts/explore            - Get explore feed
GET    /api/posts/user/:username     - Get user posts
POST   /api/posts                    - Create post
POST   /api/posts/upload-images      - Upload images
POST   /api/posts/upload-video       - Upload video
PUT    /api/posts/:postId            - Update post
DELETE /api/posts/:postId            - Delete post
POST   /api/posts/:postId/like       - Like/unlike post
POST   /api/posts/:postId/react      - React to post
DELETE /api/posts/:postId/react/:type - Remove reaction
POST   /api/posts/:postId/save       - Save post
POST   /api/posts/:postId/unsave     - Unsave post
GET    /api/posts/saved              - Get saved posts
```

### Comments

```
GET    /api/comments/:postId              - Get post comments
GET    /api/comments/:commentId/replies   - Get comment replies
POST   /api/comments                      - Create comment
PUT    /api/comments/:commentId           - Edit comment
DELETE /api/comments/:commentId           - Delete comment
POST   /api/comments/:commentId/like      - Like comment
DELETE /api/comments/:commentId/like      - Unlike comment
POST   /api/comments/:commentId/react     - React to comment
DELETE /api/comments/:commentId/react/:type - Remove reaction
```

### Collaborative Posts

```
POST   /api/collaborations/invite          - Create post with invite
POST   /api/collaborations/:postId/accept  - Accept collaboration
POST   /api/collaborations/:postId/reject  - Reject collaboration
GET    /api/collaborations/pending         - Get pending invites
```

### Notifications

```
GET    /api/notifications        - Get notifications
PUT    /api/notifications/read   - Mark all as read
PUT    /api/notifications/:id    - Mark one as read
```

### Messages

```
POST   /api/messages/conversations           - Create/get conversation
GET    /api/messages/conversations           - List conversations
POST   /api/messages                         - Send message
GET    /api/messages/:conversationId         - Get messages
PUT    /api/messages/:conversationId/read    - Mark as read
```

### Stories

```
POST   /api/stories/upload       - Upload story media
POST   /api/stories              - Create story
GET    /api/stories              - Get all stories
GET    /api/stories/user/:userId - Get user stories
POST   /api/stories/:storyId/view - View story
DELETE /api/stories/:storyId     - Delete story
```

### Hashtags

```
GET    /api/hashtags/trending        - Get trending hashtags
GET    /api/posts/hashtag/:tag       - Get posts by hashtag
```

### Health Check

```
GET    /api/health               - Server health check
```

## WebSocket Events

### Client -> Server

```javascript
// Register user for notifications
socket.emit('register', userId);

// Join conversation for messages
socket.emit('join_conversation', conversationId);

// Join post room for comment updates
socket.emit('join_post_room', postId);

// Typing indicators
socket.emit('typing', { conversationId, userId, username });
socket.emit('stop_typing', { conversationId, userId });
```

### Server -> Client

```javascript
// Notifications
socket.on('new_notification', (notification) => {});

// Messages
socket.on('new_message', (message) => {});
socket.on('user_typing', ({ userId, username }) => {});
socket.on('user_stop_typing', ({ userId }) => {});

// Comments
socket.on('new_comment', (comment) => {});
socket.on('edit_comment', (comment) => {});
socket.on('delete_comment', ({ commentId, is_soft_delete }) => {});
socket.on('comment_reaction', ({ commentId, reaction_summary }) => {});
```

## Database Models

### User
- id, username, email, password, bio, avatar
- followers, following, close_friends
- Timestamps

### Post
- id, user_id, username, avatar, text, images, video_url
- likes, reactions, comment_count, visibility
- is_collaborative, collaborator details
- image_tags (coordinate-based tagging)
- Timestamps

### Comment
- id, post_id, user_id, username, avatar, text
- parent_comment_id (for replies)
- likes, reactions, reply_count
- mentioned_user_ids
- Timestamps

### Notification
- id, user_id, actor_id, type, post_id, comment_id
- is_read, created_at

### Message & Conversation
- Conversation: participants, last_message
- Message: conversation_id, sender_id, text, is_read

### Story
- id, user_id, username, avatar
- media_url, media_type
- views array, expires_at

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|----------|
| MONGO_URL | MongoDB connection string | Yes | - |
| DB_NAME | Database name | Yes | - |
| JWT_SECRET | Secret key for JWT tokens | Yes | - |
| JWT_ALGORITHM | JWT algorithm | No | HS256 |
| JWT_EXPIRATION_HOURS | Token expiration time | No | 24 |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | Yes | - |
| CLOUDINARY_API_KEY | Cloudinary API key | Yes | - |
| CLOUDINARY_API_SECRET | Cloudinary API secret | Yes | - |
| PORT | Server port | No | 8001 |
| CORS_ORIGINS | Allowed CORS origins | No | * |

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token authentication
- Protected routes with auth middleware
- Input validation with express-validator
- CORS configuration
- Environment-based configuration

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message description"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Development

### Running in Development Mode

```bash
yarn dev
```

This uses nodemon for auto-reloading on file changes.

### Debugging

```bash
# Enable debug logs
DEBUG=* yarn start
```

### Testing

```bash
yarn test
```

## Production Deployment

### Environment Setup

1. Set strong JWT_SECRET (32+ random characters)
2. Use production MongoDB URL
3. Configure CORS_ORIGINS (comma-separated URLs)
4. Set NODE_ENV=production

### Start Server

```bash
NODE_ENV=production yarn start
```

### Process Management

Use PM2 for production:

```bash
npm install -g pm2
pm2 start server.js --name socialvibe-backend
pm2 startup
pm2 save
```

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB is running
sudo systemctl status mongodb

# Test connection
mongo --eval "db.version()"
```

### Port Already in Use

```bash
# Find process using port 8001
lsof -i :8001

# Kill process
kill -9 <PID>
```

### Cloudinary Upload Failures

- Verify credentials in .env
- Check Cloudinary dashboard for limits
- Ensure file sizes are within limits

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE)
