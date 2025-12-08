# SocialVibe - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies

```bash
# Backend
cd backend
yarn install

# Frontend  
cd frontend
yarn install
```

### 2. Setup Environment Files

#### Backend (`backend/.env`):
```bash
# Copy the example file
cp backend/.env.example backend/.env

# Then edit backend/.env and set:
# - JWT_SECRET (any random string for development)
# - MONGO_URL (default: mongodb://localhost:27017/socialvibe)
# - CLOUDINARY_* (optional, only needed for image uploads)
```

#### Frontend (`frontend/.env`):
```bash
# Copy the example file
cp frontend/.env.example frontend/.env

# The default REACT_APP_BACKEND_URL=http://localhost:8001/api should work
```

### 3. Start MongoDB

**Option A: Using Docker (Easiest)**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: Local MongoDB**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 4. Start Backend

```bash
cd backend
node server.js
# Or for auto-reload: yarn dev
```

### 5. Start Frontend

```bash
cd frontend
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
