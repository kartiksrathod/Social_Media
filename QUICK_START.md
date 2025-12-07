# SocialVibe - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### 1. Install Dependencies

```bash
# Backend
cd /app/backend
yarn install

# Frontend
cd /app/frontend
yarn install
```

### 2. Configure Environment Variables

#### Backend (`/app/backend/.env`):
```env
# MongoDB Connection
MONGO_URL=mongodb://localhost:27017/socialvibe

# JWT Configuration
JWT_SECRET=your-secret-key-here
CSRF_SECRET=your-csrf-secret-here

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=8001
CORS_ORIGINS=*
```

#### Frontend (`/app/frontend/.env`):
```env
REACT_APP_BACKEND_URL=https://your-backend-url.com/api
WDS_SOCKET_PORT=443
```

### 3. Start Services

```bash
# Start MongoDB
sudo supervisorctl start mongodb

# Start Backend (Node.js)
cd /app/backend
node server.js

# Start Frontend
cd /app/frontend
yarn start
```

---

## 🔗 Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001/api
- **MongoDB:** mongodb://localhost:27017

---

## 🛠️ Development Commands

### Backend:
```bash
cd /app/backend

# Start with auto-reload
yarn dev

# Start normally
yarn start
```

### Frontend:
```bash
cd /app/frontend

# Start development server
yarn start

# Build for production
yarn build
```

---

## 📦 Key Features

- **Authentication:** JWT-based user authentication
- **Real-time:** WebSocket support for live updates
- **Image Upload:** Cloudinary integration with Sharp optimization
- **Social Features:** Posts, comments, stories, messages, notifications
- **Performance:** Virtual scrolling, lazy loading, image optimization
- **Mobile:** Responsive design with mobile-first approach
- **Security:** Rate limiting, CSRF protection, input sanitization

---

## 🐛 Troubleshooting

### Backend not starting?
```bash
# Check if port 8001 is in use
netstat -tlnp | grep 8001

# Check logs
tail -f /var/log/supervisor/backend_node.err.log
```

### Frontend build errors?
```bash
# Clear cache and reinstall
cd /app/frontend
rm -rf node_modules yarn.lock
yarn install
```

### Database connection issues?
```bash
# Check MongoDB status
sudo supervisorctl status mongodb

# Check MongoDB logs
tail -f /var/log/mongodb.err.log
```

---

## 📚 Documentation

- **Main README:** `/app/README.md`
- **Deployment Guide:** `/app/DEPLOYMENT_READY.md`
- **Setup Guide:** `/app/docs/SETUP_GUIDE.md`
- **Backend README:** `/app/backend/README.md`
- **Frontend README:** `/app/frontend/README.md`

---

## 🔐 Important Security Notes

**Before deploying to production:**
1. Change all secret keys in `.env` files
2. Configure restrictive CORS policy
3. Add your Cloudinary credentials
4. Use HTTPS only
5. Set up proper monitoring

---

**Need help?** Check the documentation files or review the code comments.
