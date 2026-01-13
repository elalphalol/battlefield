# 🔍 Preview & Testing Guide - Before Deploying to Production

## Overview
This guide shows you how to test changes locally and preview them before pushing to GitHub/Vercel production.

---

## 🏠 Method 1: Local Development (Best for Testing)

### Step 1: Run Frontend Locally
```bash
cd whole-number-miniapp
npm run dev
```
- Open: http://localhost:3000
- Changes update instantly (hot reload)
- Test all features before committing

### Step 2: Run Backend Locally
```bash
cd whole-number-miniapp/backend
npm run dev
```
- Backend runs on: http://localhost:3001
- Test API endpoints locally

### Step 3: Test Full Stack Locally
**Make sure both are running:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

**Environment Variables for Local Testing:**
```bash
# whole-number-miniapp/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Benefits:**
✅ Fastest way to test changes
✅ No deployment needed
✅ Full debugging capabilities
✅ Free - no cloud costs

---

## 🌿 Method 2: Git Branches + Vercel Preview Deployments

### Step 1: Create a Test Branch
```bash
# Create a new branch for testing
git checkout -b test-my-changes

# Make your changes, then commit
git add .
git commit -m "Testing new feature"

# Push to GitHub
git push origin test-my-changes
```

### Step 2: Automatic Preview Deployment
**What happens:**
1. Vercel detects your new branch push
2. Automatically creates a **preview deployment**
3. Gives you a unique URL like: `battlefield-roan-git-test-my-changes-yourname.vercel.app`

### Step 3: Test the Preview
- Vercel sends you a deployment link via GitHub PR or Vercel dashboard
- Test the preview URL (not production!)
- If good → merge to main
- If issues → fix and push again to same branch

### Step 4: Merge to Production (When Ready)
```bash
# Switch back to main branch
git checkout main

# Merge your tested branch
git merge test-my-changes

# Push to production
git push origin main
```

**Benefits:**
✅ Test in real production-like environment
✅ Get shareable preview URL
✅ No risk to production users
✅ Easy to roll back

---

## 📋 Method 3: Vercel Dashboard Preview

### View All Deployments
1. Go to: https://vercel.com/dashboard
2. Click your project: **battlefield-roan**
3. Go to **Deployments** tab
4. See all deployments:
   - 🟢 **Production** (from main branch)
   - 🟡 **Preview** (from other branches)

### Inspect Each Deployment
- Click any deployment to see:
  - URL to visit
  - Build logs
  - Environment variables used
  - Performance metrics

---

## 🔄 Complete Workflow: Local → Preview → Production

### Recommended Development Flow:

#### 1. **Local Testing First** (Required)
```bash
# Run locally
cd whole-number-miniapp
npm run dev
```
- Test changes at http://localhost:3000
- Fix any bugs locally
- Make sure everything works

#### 2. **Create Test Branch** (Recommended)
```bash
git checkout -b feature/my-new-feature
git add .
git commit -m "Add new feature"
git push origin feature/my-new-feature
```

#### 3. **Test Vercel Preview** (Recommended)
- Vercel auto-deploys your branch
- Test at preview URL
- Share with team/testers if needed

#### 4. **Deploy to Production** (When confident)
```bash
git checkout main
git merge feature/my-new-feature
git push origin main
```
- This triggers production deployment
- Users see your changes

---

## 🎯 Quick Testing Checklist

### Before Pushing to Production:

#### Local Tests:
- [ ] Frontend runs without errors (`npm run dev`)
- [ ] Backend runs without errors (`cd backend && npm run dev`)
- [ ] All pages load correctly
- [ ] Trading panel works (open/close positions)
- [ ] Leaderboard displays
- [ ] User profiles load
- [ ] Wallet connection works
- [ ] No console errors in browser (F12)

#### Preview Deployment Tests:
- [ ] Preview URL works
- [ ] Environment variables correct
- [ ] Database connection works
- [ ] API endpoints respond
- [ ] Farcaster frame validates

#### Production Checklist:
- [ ] All tests passed on preview
- [ ] No breaking changes
- [ ] Git commit messages clear
- [ ] Team notified (if applicable)

---

## 🚀 Vercel Preview URLs Explained

### URL Structure:
```
Production:  https://battlefield-roan.vercel.app
Preview:     https://battlefield-roan-git-[branch-name]-[username].vercel.app
Commit:      https://battlefield-roan-[commit-hash]-[username].vercel.app
```

### Example:
```
Main Branch:     https://battlefield-roan.vercel.app
Feature Branch:  https://battlefield-roan-git-feature-newui-elalphalol.vercel.app
Specific Commit: https://battlefield-roan-a1b2c3d-elalphalol.vercel.app
```

---

## 🔧 Testing Specific Features

### Test 1: API Connection
Visit your preview URL and open browser console (F12):
```javascript
// Should see:
🔧 API URL: https://your-backend-url.railway.app
```

### Test 2: Database Connection
Visit: `https://your-preview-url.vercel.app/api/health`
Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-01-12..."
}
```

### Test 3: Farcaster Frame
1. Go to: https://warpcast.com/~/developers/frames
2. Enter your preview URL
3. Should validate with no errors

---

## 🛡️ Safety Features

### Vercel Automatic Rollback
If production deployment fails:
- Vercel automatically rolls back to last working version
- Users never see broken site
- You get notified of the failure

### Environment Variables Per Branch
You can set different variables for:
- **Production** (main branch)
- **Preview** (all other branches)
- **Development** (local only)

This means preview can use test database while production uses real one!

---

## 💡 Pro Tips

### 1. Use Preview for Team Review
```bash
# Push to branch
git push origin feature/new-design

# Share preview URL with team
# Get feedback before merging to main
```

### 2. Test Breaking Changes Safely
```bash
# Create experimental branch
git checkout -b experiment/risky-change

# Push and test on preview
git push origin experiment/risky-change

# If it breaks, just delete the branch
# Production is never affected!
```

### 3. Keep Main Branch Stable
- **Never push directly to main**
- Always test on preview first
- Only merge when preview looks good

### 4. Use Git Tags for Releases
```bash
# After successful deployment
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
```

---

## 🔍 Debugging Preview Deployments

### Check Build Logs
1. Go to Vercel dashboard
2. Click deployment
3. View "Building" section
4. Look for errors

### Check Runtime Logs
1. Go to deployment
2. Click "Functions" tab
3. See real-time logs

### Check Environment Variables
1. Go to deployment
2. Click "Environment Variables"
3. Verify all required vars are set

---

## 📱 Testing on Different Devices

### Desktop Testing:
- Chrome DevTools (F12) → Device toolbar
- Test responsive design
- Test different screen sizes

### Mobile Testing:
1. Deploy to preview
2. Visit preview URL on phone
3. Test touch interactions
4. Test wallet connections (MetaMask mobile)

### Farcaster Testing:
1. Share preview URL in Warpcast
2. Test frame interaction
3. Test sign-in flow

---

## 🚦 When to Use Each Method

### Use Local Development When:
- ✅ Making frequent small changes
- ✅ Want instant feedback
- ✅ Debugging specific issues
- ✅ Working offline

### Use Preview Deployments When:
- ✅ Testing with real production environment
- ✅ Sharing with team/testers
- ✅ Testing environment-specific issues
- ✅ Before merging to production

### Push to Production When:
- ✅ All local tests pass
- ✅ Preview deployment works perfectly
- ✅ Team has reviewed changes
- ✅ Ready for users to see

---

## 🎬 Example Workflow

### Scenario: Adding a New Feature

```bash
# 1. Create branch
git checkout -b feature/new-trading-view

# 2. Make changes locally
# Edit files...

# 3. Test locally
npm run dev
# Visit http://localhost:3000
# Test feature works

# 4. Commit and push
git add .
git commit -m "Add new trading view"
git push origin feature/new-trading-view

# 5. Vercel auto-deploys preview
# Check email/GitHub for preview URL

# 6. Test preview deployment
# Visit preview URL
# Test with real data

# 7. If good, merge to main
git checkout main
git merge feature/new-trading-view
git push origin main

# 8. Production deploys automatically!
# Visit https://battlefield-roan.vercel.app
```

---

## ⚙️ Advanced: Custom Preview Environments

### Create Staging Environment
```bash
# Create staging branch
git checkout -b staging
git push origin staging
```

In Vercel settings:
1. Go to Settings → Git
2. Set **Production Branch** to `main`
3. `staging` branch gets its own permanent URL
4. Test there before merging to main

---

## 📊 Monitoring Deployments

### Vercel Analytics
- Go to Vercel dashboard → Analytics
- See:
  - Page views
  - Load times
  - Error rates
  - User locations

### Railway Logs (Backend)
- Go to Railway dashboard
- Click your backend service
- View "Logs" tab
- See API requests in real-time

---

## 🔒 Security Note

**Preview URLs are PUBLIC!**
- Anyone with the URL can access preview
- Don't share preview URLs publicly if testing sensitive features
- Use preview environment variables different from production

---

## 📚 Quick Reference

### Commands Cheat Sheet:
```bash
# Local development
npm run dev                    # Start frontend
cd backend && npm run dev      # Start backend

# Git workflow
git checkout -b feature/name   # New branch
git add .                      # Stage changes
git commit -m "message"        # Commit
git push origin feature/name   # Push to GitHub

# Merge to production
git checkout main              # Switch to main
git merge feature/name         # Merge feature
git push origin main           # Deploy to production
```

### Important URLs:
- **Local Frontend:** http://localhost:3000
- **Local Backend:** http://localhost:3001
- **Production:** https://battlefield-roan.vercel.app
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Railway Dashboard:** https://railway.app/dashboard

---

## ✅ Summary

**Best Practice: Three-Stage Testing**
1. 🏠 **Local** - Test on your computer first
2. 🔍 **Preview** - Test on Vercel preview deployment
3. 🚀 **Production** - Deploy to users when confident

This ensures users never see broken features!

---

**Happy Testing! 🎉**
