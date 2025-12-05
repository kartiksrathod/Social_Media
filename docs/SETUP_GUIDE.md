# SocialVibe Setup Guide

Complete guide to set up SocialVibe for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** version 18.0.0 or higher
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify: `node --version`

- **Yarn** package manager
  - Install: `npm install -g yarn`
  - Verify: `yarn --version`

- **MongoDB** version 5.0 or higher
  - macOS: `brew install mongodb-community`
  - Ubuntu: `sudo apt-get install mongodb`
  - Windows: Download from [mongodb.com](https://www.mongodb.com/try/download/community)
  - Verify: `mongod --version`

- **Git**
  - Verify: `git --version`

- **Cloudinary Account** (for media uploads)
  - Sign up at [cloudinary.com](https://cloudinary.com)
  - Free tier available

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/socialvibe.git
cd socialvibe
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
yarn install
```

This will install all required Node.js packages (~2-3 minutes).

#### Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# MongoDB Connection
MONGO_URL=mongodb://localhost:27017/socialvibe
DB_NAME=socialvibe

# JWT Configuration (IMPORTANT: Use a strong secret in production)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-recommended
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Cloudinary Configuration
# Get these from your Cloudinary dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Server Configuration
PORT=8001
CORS_ORIGINS=*
```

**Getting Cloudinary Credentials:**
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Paste into your `.env` file

#### Start MongoDB

Make sure MongoDB is running:

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongodb

# Linux (init.d)
sudo service mongodb start

# Windows
net start MongoDB

# Or run manually
mongod --dbpath /path/to/data/directory
```

Verify MongoDB is running:

```bash
mongo --eval "db.version()"
```

#### Test Backend

Start the backend server:

```bash
yarn start
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 8001
💬 WebSocket server ready
```

Test the health endpoint:

```bash
curl http://localhost:8001/api/health
```

Expected response:
```json
{"status":"ok","message":"Server is running"}
```

### 3. Frontend Setup

Open a new terminal window/tab.

#### Install Dependencies

```bash
cd frontend
yarn install
```

This will install all React dependencies (~3-5 minutes).

#### Configure Environment Variables

Create a `.env` file in the frontend directory:

```bash
cp .env.example .env
```

The default configuration should work for local development:

```env
REACT_APP_BACKEND_URL=http://localhost:8001/api
```

**Note:** If you're running backend on a different port, update the URL accordingly.

#### Start Frontend

```bash
yarn start
```

The React development server will start and automatically open your browser to `http://localhost:3000`.

You should see the SocialVibe landing page!

### 4. Verify Everything Works

#### Backend Checklist

- [ ] MongoDB is running (`mongo --eval "db.version()"`)
- [ ] Backend server started without errors
- [ ] Health check returns success (`curl http://localhost:8001/api/health`)
- [ ] No error logs in terminal

#### Frontend Checklist

- [ ] Frontend server started without errors
- [ ] Browser opens to `http://localhost:3000`
- [ ] Landing page loads correctly
- [ ] No console errors in browser DevTools (F12)

### 5. Create Your First Account

1. Click "Get Started" or "Sign Up"
2. Fill in the registration form:
   - Username (unique, 3-20 characters)
   - Email (valid email format)
   - Password (minimum 6 characters)
3. Click "Sign Up"
4. You'll be redirected to the home feed

## Common Issues & Solutions

### MongoDB Connection Failed

**Error:** `MongoNetworkError: connect ECONNREFUSED`

**Solutions:**
1. Check if MongoDB is running:
   ```bash
   # macOS
   brew services list | grep mongodb
   
   # Linux
   sudo systemctl status mongodb
   
   # Or try connecting manually
   mongo
   ```

2. Verify MONGO_URL in backend `.env`:
   ```env
   MONGO_URL=mongodb://localhost:27017/socialvibe
   ```

3. Try connecting with authentication if required:
   ```env
   MONGO_URL=mongodb://username:password@localhost:27017/socialvibe
   ```

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::8001`

**Solutions:**
1. Find the process using the port:
   ```bash
   # macOS/Linux
   lsof -i :8001
   
   # Windows
   netstat -ano | findstr :8001
   ```

2. Kill the process:
   ```bash
   # macOS/Linux
   kill -9 <PID>
   
   # Windows
   taskkill /PID <PID> /F
   ```

3. Or use a different port in backend `.env`:
   ```env
   PORT=8002
   ```
   And update frontend `.env`:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8002/api
   ```

### Cloudinary Upload Fails

**Error:** `Cloudinary configuration not found`

**Solutions:**
1. Verify credentials in backend `.env`
2. Check Cloudinary dashboard for correct values
3. Ensure no extra spaces in `.env` values
4. Restart backend after updating `.env`

### Frontend Can't Connect to Backend

**Error:** `Network Error` or `ERR_CONNECTION_REFUSED`

**Solutions:**
1. Verify backend is running (`curl http://localhost:8001/api/health`)
2. Check REACT_APP_BACKEND_URL in frontend `.env`
3. Ensure CORS_ORIGINS in backend `.env` allows frontend origin
4. Restart both servers after `.env` changes

### CORS Issues

**Error:** `Access to fetch at ... has been blocked by CORS policy`

**Solutions:**
1. For development, use wildcard in backend `.env`:
   ```env
   CORS_ORIGINS=*
   ```

2. For production, specify exact origins:
   ```env
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

## Development Workflow

### Running Both Servers

Keep two terminal windows open:

**Terminal 1 - Backend:**
```bash
cd backend
yarn start
# Or for auto-reload on changes:
yarn dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

### Making Changes

- **Backend changes:** Server auto-reloads with nodemon (in dev mode)
- **Frontend changes:** Hot reload automatically updates browser
- **Environment changes:** Require manual restart

### Database Management

**View data:**
```bash
mongo socialvibe
db.users.find().pretty()
db.posts.find().pretty()
```

**Clear database:**
```bash
mongo socialvibe
db.dropDatabase()
```

**Create indexes (if needed):**
```bash
mongo socialvibe
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })
```

## Testing

### Backend Testing

```bash
cd backend
yarn test
```

### Frontend Testing

```bash
cd frontend
yarn test
```

### Manual Testing Checklist

- [ ] Sign up new user
- [ ] Log in
- [ ] Create post (text only)
- [ ] Create post with image
- [ ] Like/unlike post
- [ ] Add emoji reaction
- [ ] Comment on post
- [ ] Reply to comment
- [ ] Follow another user
- [ ] Search for users
- [ ] View profile
- [ ] Edit profile
- [ ] Toggle dark mode
- [ ] Save/unsave post
- [ ] Create story
- [ ] Send direct message

## Next Steps

1. **Explore the app:** Try all features to understand functionality
2. **Read the docs:** Check `DESIGN_SYSTEM.md` for UI guidelines
3. **Start developing:** See `CONTRIBUTING.md` for development guidelines
4. **Deploy:** See `docs/DEPLOYMENT.md` when ready for production

## Getting Help

- **Issues:** [GitHub Issues](https://github.com/yourusername/socialvibe/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/socialvibe/discussions)
- **Email:** support@socialvibe.com

## Useful Commands

```bash
# Check all service status
# Backend
curl http://localhost:8001/api/health

# Frontend
curl http://localhost:3000

# View backend logs
cd backend
tail -f *.log

# View MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log  # macOS
tail -f /var/log/mongodb/mongod.log           # Linux

# Clear yarn cache (if issues)
yarn cache clean

# Reinstall dependencies (if issues)
rm -rf node_modules yarn.lock
yarn install
```

---

Happy coding! 🚀
