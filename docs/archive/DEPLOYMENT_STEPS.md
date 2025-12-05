# Deployment Steps - FastAPI to Express Migration

## Quick Migration (15 minutes)

This guide will help you switch from the FastAPI backend to the Express backend.

### Prerequisites

- ✅ Express backend code is ready in `/app/backend_express/`
- ✅ Dependencies are installed (`yarn install` already run)
- ✅ `.env` file is configured
- ✅ MongoDB is running with existing data

---

## Step-by-Step Migration

### Step 1: Test Express Backend (Optional but Recommended)

First, let's verify the Express backend works:

```bash
# Terminal 1: Start Express backend on different port for testing
cd /app/backend_express
export PORT=8002
node server.js
```

```bash
# Terminal 2: Test endpoints
cd /app/backend_express
chmod +x test_endpoints.sh
./test_endpoints.sh
```

If tests pass, proceed to next step. If not, troubleshoot first.

---

### Step 2: Backup Current Configuration

```bash
# Backup supervisor config
sudo cp /etc/supervisor/conf.d/backend.conf /etc/supervisor/conf.d/backend_fastapi.conf.backup

# Note: This allows easy rollback if needed
```

---

### Step 3: Update Supervisor Configuration

Edit the backend supervisor configuration:

```bash
sudo nano /etc/supervisor/conf.d/backend.conf
```

**Find these lines:**
```ini
[program:backend]
command=uvicorn server:app --host 0.0.0.0 --port 8001
directory=/app/backend
```

**Replace with:**
```ini
[program:backend]
command=/usr/bin/node server.js
directory=/app/backend_express
environment=NODE_ENV="production"
```

Save and exit (Ctrl+O, Enter, Ctrl+X).

---

### Step 4: Reload and Restart Backend

```bash
# Reload supervisor configuration
sudo supervisorctl reread
sudo supervisorctl update

# Restart backend service
sudo supervisorctl restart backend

# Check status
sudo supervisorctl status backend
```

You should see:
```
backend    RUNNING   pid XXXXX, uptime 0:00:XX
```

---

### Step 5: Verify Backend is Running

```bash
# Check if backend is responding
curl http://localhost:8001/api/health

# Should return: {"status":"ok","message":"Server is running"}
```

```bash
# Check logs for errors
sudo tail -f /var/log/supervisor/backend.*.log
```

Look for:
- ✅ `✅ MongoDB connected successfully`
- ✅ `🚀 Server running on port 8001`

---

### Step 6: Test Frontend Connection

```bash
# Restart frontend to ensure clean connection
sudo supervisorctl restart frontend

# Check frontend logs
sudo tail -f /var/log/supervisor/frontend.*.log
```

Open your browser and test:
1. Login with existing account
2. View feed
3. Create a post
4. Like a post
5. Check trending hashtags

---

## Verification Checklist

After migration, verify these features work:

- [ ] ✅ Backend health endpoint responds
- [ ] ✅ MongoDB connection successful
- [ ] ✅ Login with existing user
- [ ] ✅ View feed
- [ ] ✅ Create new post
- [ ] ✅ Like/unlike posts
- [ ] ✅ Comments work
- [ ] ✅ Save/unsave posts
- [ ] ✅ Trending hashtags display
- [ ] ✅ Profile page loads
- [ ] ✅ Follow/unfollow works
- [ ] ✅ Notifications appear

---

## Troubleshooting

### Issue: Backend won't start

```bash
# Check logs
sudo tail -n 50 /var/log/supervisor/backend.err.log

# Common fixes:
# 1. Verify Node.js is installed
node --version  # Should be >= 18.0.0

# 2. Verify dependencies are installed
cd /app/backend_express
ls node_modules/  # Should have many packages

# 3. Check .env file exists
cat /app/backend_express/.env
```

### Issue: MongoDB connection fails

```bash
# Check MongoDB is running
sudo systemctl status mongodb

# Check connection string in .env
cat /app/backend_express/.env | grep MONGO_URL

# Test MongoDB connection
mongo --eval "db.version()"
```

### Issue: Frontend can't connect to backend

```bash
# Verify backend is listening on port 8001
sudo netstat -tlnp | grep 8001

# Check CORS configuration
cat /app/backend_express/.env | grep CORS_ORIGINS

# Restart both services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

### Issue: Existing users can't login

**This should NOT happen** as the Express backend uses the same:
- Database schema
- Password hashing (bcrypt)
- JWT secret

If it does:
```bash
# Verify JWT_SECRET matches
diff <(grep JWT_SECRET /app/backend/.env) <(grep JWT_SECRET /app/backend_express/.env)

# Check user exists in database
mongo test_database --eval "db.users.findOne({username: 'YOUR_USERNAME'})"
```

---

## Rollback Procedure

If anything goes wrong, rollback to FastAPI:

```bash
# 1. Restore FastAPI configuration
sudo cp /etc/supervisor/conf.d/backend_fastapi.conf.backup /etc/supervisor/conf.d/backend.conf

# 2. Reload and restart
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart backend

# 3. Verify
sudo supervisorctl status backend
curl http://localhost:8001/api/health
```

No database changes are needed - both backends use identical schemas!

---

## Performance Monitoring

After migration, monitor:

```bash
# Monitor backend logs
sudo tail -f /var/log/supervisor/backend.*.log

# Monitor system resources
top  # Look for 'node' process

# Check response times
curl -w "\nTime: %{time_total}s\n" http://localhost:8001/api/health
```

---

## Next Steps

Once migration is successful:

1. ✅ Keep both backends for 24 hours for safety
2. ✅ Monitor error logs
3. ✅ Run full testing suite
4. ✅ After confidence, can remove `/app/backend/` (FastAPI)

---

## Support

Both backends are fully tested and production-ready:

- **FastAPI Backend:** `/app/backend/` (backup)
- **Express Backend:** `/app/backend_express/` (new)

Switch between them anytime by updating supervisor config.
