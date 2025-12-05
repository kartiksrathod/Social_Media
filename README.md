# 🌟 SocialVibe - Modern Social Media Platform

A full-featured social media platform built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring real-time updates, rich media sharing, and advanced social features.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.0.0-blue.svg)

## ✨ Features

### Core Features
- 🔐 **Authentication & Authorization** - JWT-based secure authentication
- 📝 **Posts** - Create, edit, delete posts with text, images, and videos
- 💬 **Comments & Replies** - Nested comment system with full CRUD operations
- ❤️ **Reactions** - 6 emoji reactions (like, love, laugh, wow, sad, angry)
- 🔔 **Real-time Notifications** - WebSocket-powered instant notifications
- 👥 **Follow System** - Follow/unfollow users, view followers/following
- 🔍 **Search** - Search users, posts, and hashtags
- 📱 **Responsive Design** - Mobile-first design with Tailwind CSS

### Advanced Features
- 👥 **Collaborative Posts** - Co-author posts with another user (max 2 authors)
- ⭐ **Close Friends** - Share posts exclusively with close friends
- 🏷️ **Photo Tagging** - Tag users in images with coordinate-based tags
- @ **Mentions** - @mention users in posts and comments with autocomplete
- #️⃣ **Hashtags** - Trending hashtags and hashtag-based discovery
- 📖 **Stories** - 24-hour stories with images and videos
- 💾 **Saved Posts** - Bookmark posts for later viewing
- 💬 **Direct Messaging** - Real-time private messaging with typing indicators
- 🌙 **Dark Mode** - System-wide dark mode with persistence
- 📊 **Comment Sorting** - Sort by newest, most liked, or most replied

## 🚀 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Cloudinary** - Media storage and CDN
- **Multer** - File upload handling

### Frontend
- **React 19** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.IO Client** - WebSocket client
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **date-fns** - Date utilities

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 5.0
- Yarn package manager
- Cloudinary account (for media uploads)

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/socialvibe.git
cd socialvibe
```

### 2. Backend Setup

```bash
cd backend
yarn install

# Create .env file
cp .env.example .env
# Edit .env with your credentials
```

**Configure `.env` file:**

```env
MONGO_URL=mongodb://localhost:27017/socialvibe
DB_NAME=socialvibe
JWT_SECRET=your-super-secret-jwt-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=8001
CORS_ORIGINS=*
```

### 3. Frontend Setup

```bash
cd ../frontend
yarn install

# Create .env file (optional - uses defaults)
cp .env.example .env
```

**Configure `.env` file:**

```env
REACT_APP_BACKEND_URL=http://localhost:8001/api
```

### 4. Start MongoDB

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongodb

# Windows
net start MongoDB
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
yarn start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api

## 📁 Project Structure

```
socialvibe/
├── backend/                 # Express.js backend
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   ├── server.js           # Entry point
│   ├── package.json
│   └── .env.example
├── frontend/               # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── lib/           # API client & utilities
│   │   ├── pages/         # Page components
│   │   └── App.js
│   ├── package.json
│   └── .env.example
├── docs/                  # Documentation
├── DESIGN_SYSTEM.md       # Design guidelines
└── README.md
```

## 🔌 API Documentation

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Posts
- `GET /api/posts/feed` - Get user feed
- `GET /api/posts/explore` - Get explore feed
- `POST /api/posts` - Create post
- `PUT /api/posts/:postId` - Update post
- `DELETE /api/posts/:postId` - Delete post
- `POST /api/posts/:postId/like` - Like/unlike post
- `POST /api/posts/:postId/react` - Add reaction
- `POST /api/posts/:postId/save` - Save/unsave post

### Comments
- `GET /api/comments/:postId` - Get post comments
- `POST /api/comments` - Create comment
- `PUT /api/comments/:commentId` - Edit comment
- `DELETE /api/comments/:commentId` - Delete comment
- `POST /api/comments/:commentId/like` - Like comment
- `POST /api/comments/:commentId/react` - React to comment

### Users
- `GET /api/users/:username` - Get user profile
- `GET /api/users/search` - Search users
- `POST /api/users/follow/:userId` - Follow user
- `POST /api/users/unfollow/:userId` - Unfollow user
- `POST /api/users/close-friends/add` - Add to close friends
- `DELETE /api/users/close-friends/remove` - Remove from close friends

### Messages
- `POST /api/messages/conversations` - Create conversation
- `GET /api/messages/conversations` - List conversations
- `POST /api/messages` - Send message
- `GET /api/messages/:conversationId` - Get messages

### WebSocket Events
- `new_notification` - New notification received
- `new_message` - New message in conversation
- `new_comment` - New comment on post
- `comment_reaction` - Reaction added to comment
- `user_typing` - User is typing

## 🎨 Design System

See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for comprehensive design guidelines including:
- Color palette
- Typography
- Component patterns
- Spacing system
- Animation guidelines

## 🧪 Testing

```bash
# Backend tests
cd backend
yarn test

# Frontend tests
cd frontend
yarn test
```

## 🚀 Deployment

### Production Build

**Backend:**
```bash
cd backend
NODE_ENV=production yarn start
```

**Frontend:**
```bash
cd frontend
yarn build
```

The build folder will contain optimized production files.

### Environment Variables for Production

Ensure these are set in your production environment:
- `MONGO_URL` - Production MongoDB connection string
- `JWT_SECRET` - Strong secret key (32+ characters)
- `CLOUDINARY_*` - Production Cloudinary credentials
- `CORS_ORIGINS` - Allowed frontend origins (comma-separated)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - [GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Radix UI for accessible components
- Tailwind CSS for styling utilities
- Socket.IO for real-time features
- Cloudinary for media management

## 📞 Support

For support, email support@socialvibe.com or open an issue on GitHub.

## 🗺️ Roadmap

- [ ] Voice/Video calls
- [ ] Group conversations
- [ ] Post analytics
- [ ] Advanced privacy controls
- [ ] Content moderation tools
- [ ] Mobile app (React Native)

---

Made with ❤️ by the SocialVibe Team
