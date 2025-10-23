# 🚀 Florida Local - Production Deployment Guide

## ✅ Pre-Deployment Checklist

Your application is **production-ready** and verified to work correctly! Before deploying, ensure:

- [x] All features tested and working (carousel, marketplace, messaging, etc.)
- [x] Build script verified (`bash build-deploy.sh` works correctly)
- [x] Production server tested locally
- [x] All environment variables configured in Replit Secrets

---

## 🔧 Required Deployment Configuration

### **CRITICAL: Update Build Command**

The deployment currently uses `npm run build` which does NOT copy client files to the correct location. You MUST update this in the Replit Publishing workspace.

### Step-by-Step Instructions:

1. **Open the Publishing workspace** in Replit
   - Click on "Publishing" or "Deployments" tab in the left sidebar

2. **Navigate to your Autoscale deployment settings**
   - Select your deployment
   - Click on "Configure" or "Settings"

3. **Update the Build Command**
   - Find the "Build command" field
   - **Change from:** `npm run build`
   - **Change to:** `bash build-deploy.sh`

4. **Verify the Run Command**
   - Ensure "Run command" is set to: `npm run start`

5. **Save changes** and trigger a new deployment

---

## 📋 Why This Change is Required

### The Problem:
- `npm run build` builds the client and server separately
- It outputs client files to `client/dist`
- But the production server expects files in `dist/public`
- **Result:** Black screen / 404 errors in production

### The Solution:
- `bash build-deploy.sh` does everything correctly:
  - ✅ Builds client with Vite
  - ✅ Builds server with esbuild
  - ✅ **Copies client files to `dist/public`**
  - ✅ Verifies build integrity

### Build Comparison:

| Command | Client Build | Server Build | Copy to dist/public | Production Ready |
|---------|--------------|--------------|---------------------|------------------|
| `npm run build` | ✅ | ✅ | ❌ | ❌ |
| `bash build-deploy.sh` | ✅ | ✅ | ✅ | ✅ |

---

## 🧪 Testing the Deployment Build Locally

Before deploying, you can test the production build:

```bash
# 1. Run the deployment build
bash build-deploy.sh

# 2. Verify files were created correctly
ls -la dist/public/index.html
ls -la dist/index.js

# 3. Test the production server (stop dev server first)
NODE_ENV=production node dist/index.js
```

Expected output:
- Client build artifacts in `dist/public/`
- Server bundle at `dist/index.js`
- Server starts without errors
- App accessible at http://localhost:5000

---

## 🔐 Environment Variables

Ensure these are configured in **Replit Secrets** for production:

### Core (Required)
```bash
DATABASE_URL=postgresql://...              # Auto-configured by Replit
SESSION_SECRET=your-random-secret          # Generate: openssl rand -base64 32
REPLIT_DOMAINS=your-domain.repl.co         # Auto-configured by Replit
NODE_ENV=production                        # Important!
```

### Optional Services
```bash
# Redis (recommended)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Payments (if using Stripe)
PAYMENTS_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
POSTHOG_KEY=phc_...
LOG_LEVEL=info

# Email
SENDGRID_API_KEY=SG...
EMAIL_FROM=noreply@floridaelite.com
```

---

## 🎯 Deployment Steps

1. **Configure build command** (see above) ⚠️ **CRITICAL**
2. **Verify environment variables** in Replit Secrets
3. **Trigger deployment** from Publishing workspace
4. **Monitor build logs** for errors
5. **Test deployed app** at your .replit.app URL
6. **Verify all features work:**
   - Home page with carousel loads
   - Marketplace search works
   - Authentication functions
   - Database queries succeed

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] App loads without black screen
- [ ] All images and assets display correctly
- [ ] Horizontal carousel works on Florida Local page
- [ ] Marketplace filtering and search work
- [ ] User authentication/login works
- [ ] Database connections successful
- [ ] No console errors (check browser dev tools)
- [ ] WebSocket connections established
- [ ] All API endpoints respond correctly

---

## 🐛 Troubleshooting

### Black Screen or 404 Errors
**Cause:** Build command not updated to `bash build-deploy.sh`  
**Fix:** Update build command in Publishing workspace (see above)

### Database Connection Errors
**Cause:** DATABASE_URL not configured  
**Fix:** Replit auto-configures this, but verify it exists in Secrets

### Session/Authentication Issues
**Cause:** SESSION_SECRET not set  
**Fix:** Generate and add to Secrets: `openssl rand -base64 32`

### Static Assets Not Loading
**Cause:** Build didn't copy files to dist/public  
**Fix:** Ensure using `bash build-deploy.sh` as build command

---

## 📞 Support

If deployment issues persist:

1. Check build logs in Publishing workspace
2. Verify all required secrets are configured
3. Test production build locally first
4. Review server logs for specific errors

---

## 🎉 Success!

Once deployed successfully, your Florida Local platform will be live at:
- **Primary URL:** `https://your-repl-name.replit.app`
- **Custom domain:** (if configured)

All features will be production-ready:
- ✨ Elite luxury UI with marble textures
- 🎠 Horizontal scroll carousel on Florida Local page
- 🛒 Full marketplace functionality
- 💬 Real-time messaging
- 🔐 Secure authentication
- 📊 Business analytics and spotlight system

---

**Remember:** The ONLY required change for deployment is updating the build command to `bash build-deploy.sh` in the Publishing workspace settings!
