# Deploy to Server - Safe Commands

## ✅ All GitHub Checks Passing!

The build errors have been fixed. All checks are now passing:
- ✅ Backend Build: Successful
- ✅ Frontend Build: Successful  
- ✅ Build Status: Successful

---

## 🚀 Safe Deployment Commands

Copy and paste these commands on your server. **No data will be lost.**

### Option 1: Quick Deploy (Your Original Commands + Migration)

```bash
cd /var/www/WordPress-Node
git pull
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
cd admin
rm -rf node_modules/.vite dist
npm install
npm run build
cd ..
pm2 restart nodepress
sudo systemctl reload nginx
pm2 status
```

### Option 2: Use the Deployment Script

```bash
cd /var/www/WordPress-Node
chmod +x deploy-server.sh
./deploy-server.sh
```

---

## 📋 What Each Command Does (Safe - No Data Loss)

| Command | What It Does | Safe? |
|---------|--------------|-------|
| `cd /var/www/WordPress-Node` | Navigate to app directory | ✅ Yes |
| `git pull` | Download latest code | ✅ Yes |
| `npm install` | Install backend packages | ✅ Yes |
| `npx prisma migrate deploy` | **Add CertificateTemplate table** | ✅ Yes - Only adds new table |
| `npx prisma generate` | Generate Prisma client | ✅ Yes |
| `npm run build` | Build backend | ✅ Yes |
| `cd admin` | Go to admin folder | ✅ Yes |
| `rm -rf node_modules/.vite dist` | Clean build cache | ✅ Yes - Only temp files |
| `npm install` | Install admin packages | ✅ Yes |
| `npm run build` | Build admin frontend | ✅ Yes |
| `cd ..` | Return to root | ✅ Yes |
| `pm2 restart nodepress` | Restart app | ✅ Yes |
| `sudo systemctl reload nginx` | Reload web server | ✅ Yes |
| `pm2 status` | Check status | ✅ Yes |

---

## 🛡️ Your Data is 100% Safe

### What Gets Updated:
- ✅ Code files (new features)
- ✅ One new database table: `CertificateTemplate`
- ✅ Application restart

### What Stays Unchanged:
- ✅ All existing courses
- ✅ All existing products
- ✅ All existing users
- ✅ All existing orders
- ✅ All existing certificates
- ✅ All existing content
- ✅ All existing settings

---

## 🔍 Post-Deployment Verification

After deployment, test these features:

### 1. Course Pricing (Fixed)
```
1. Go to: https://your-domain.com/admin/lms/courses
2. Edit any course
3. Change Price Type: FREE → PAID
4. Set Price: $99.00
5. Save
6. Refresh page
7. ✅ Price should be saved correctly
```

### 2. Product Variants (Fixed)
```
1. Go to: https://your-domain.com/admin/shop/products
2. Edit any product
3. Enable "Has Variants"
4. Select sizes: S, M, L, XL
5. Generate Variants
6. Save Changes
7. Refresh page
8. ✅ All 4 variants should exist
```

### 3. Certificate Templates (New Feature)
```
1. Go to: https://your-domain.com/admin/lms/certificate-templates
2. Click "New Template"
3. Enter name: "Test Template"
4. Change colors
5. Save
6. ✅ Template should appear in list
```

---

## 📊 Changes Being Deployed

**Commit 1:** `a432a1b`
- Fix: Course pricing bug
- Fix: Product variants bug
- Feature: Certificate customization system

**Commit 2:** `22c6678`
- Fix: Icon library compatibility
- Add: Deployment scripts

**Total Changes:**
- 22 files modified
- 2,631 lines added
- 96 lines removed

---

## ⚠️ Important Notes

1. **Database Migration**: The migration only **adds** a new table, it doesn't modify existing data
2. **Downtime**: Minimal (only during PM2 restart, ~2-3 seconds)
3. **Rollback**: If needed, you can rollback with `git reset --hard HEAD~2`
4. **Backup**: Optional but recommended before deployment

---

## 🆘 If Something Goes Wrong

### Check Logs
```bash
pm2 logs nodepress --lines 50
```

### Check Status
```bash
pm2 status
systemctl status nginx
```

### Restart Services
```bash
pm2 restart nodepress
sudo systemctl restart nginx
```

### Rollback (if needed)
```bash
cd /var/www/WordPress-Node
git reset --hard a432a1b~1  # Go back before changes
npm install
npm run build
cd admin
npm install
npm run build
cd ..
pm2 restart nodepress
```

---

## ✨ Ready to Deploy!

All checks are passing. Your deployment is safe and ready to go! 🚀

**Recommended:** Run the commands during low-traffic hours for minimal impact.

**Estimated Time:** 3-5 minutes total

