# Deploy Redis Session Store Update to Hostinger

## 📋 What Was Fixed

This update resolves two issues:
1. **MemoryStore Warning**: Replaced in-memory session storage with Redis for production-ready session management
2. **Prisma sessionId Error**: Fixed analytics and recommendations tracking endpoints that were passing session objects instead of session ID strings

### Changes Made:
- ✅ Updated `src/main.ts` to use Redis session store with `connect-redis`
- ✅ Fixed `src/modules/analytics/analytics.controller.ts` to validate sessionId type
- ✅ Fixed `src/modules/recommendations/recommendations.controller.ts` to validate sessionId type
- ✅ Installed `connect-redis` package

## 🚀 Quick Deployment Steps

### Step 1: SSH into Your Hostinger VPS
```bash
ssh root@your-vps-ip
# Or if you have a specific user:
ssh NodePress@nodepress.co.uk
```

### Step 2: Navigate to Application Directory
```bash
cd /var/www/NodePress
```

### Step 3: Pull Latest Changes
```bash
git pull origin main
# Or your branch name
```

### Step 4: Install New Dependencies
```bash
npm install
```

### Step 5: Rebuild the Application
```bash
npm run build
```

### Step 6: Restart PM2 Application
```bash
# If logged in as root:
sudo -u NodePress pm2 restart NodePress

# If logged in as NodePress user:
pm2 restart NodePress

# Or restart all PM2 processes:
pm2 restart all
```

### Step 7: Verify Redis Connection
```bash
# Check PM2 logs to confirm Redis connected:
pm2 logs NodePress --lines 50

# You should see:
# "🔴 Redis session store connected successfully"
```

### Step 8: Check Application Status
```bash
pm2 status
pm2 logs NodePress
```

---

## 🔍 Verification

### Check if Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

### Check Redis Session Keys
```bash
redis-cli
> KEYS NodePress:session:*
> exit
```

### Test the Application
Visit your site and check:
- No more MemoryStore warning in logs
- Sessions persist across server restarts
- Login sessions work correctly

---

## 🛠️ Troubleshooting

### If Redis Connection Fails:

1. **Check Redis Status:**
   ```bash
   systemctl status redis-server
   ```

2. **Start Redis if Stopped:**
   ```bash
   sudo systemctl start redis-server
   sudo systemctl enable redis-server
   ```

3. **Check Redis Configuration:**
   ```bash
   cat /var/www/NodePress/.env | grep REDIS
   ```

4. **View Application Logs:**
   ```bash
   pm2 logs NodePress --lines 100
   ```

### If Build Fails:

```bash
# Clear node_modules and reinstall:
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📋 One-Line Deployment Command

For quick updates, you can run all steps in one command:

```bash
cd /var/www/NodePress && \
git pull && \
npm install && \
npm run build && \
sudo -u NodePress pm2 restart NodePress && \
pm2 logs NodePress --lines 20
```

---

## ✅ Expected Result

After restart, you should see in the logs:
```
🔴 Redis session store connected successfully
```

And the MemoryStore warning should be **gone**.

---

## 🔐 Security Note

The session store is now using Redis, which means:
- ✅ Sessions persist across server restarts
- ✅ Sessions are shared across multiple PM2 instances
- ✅ Better performance and scalability
- ✅ No memory leaks from MemoryStore

