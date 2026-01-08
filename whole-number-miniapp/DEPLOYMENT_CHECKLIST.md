# 🚀 Deployment Checklist - Whole Number War Mini App

## ✅ Completed Steps

- [x] Created Next.js 14 project with TypeScript
- [x] Installed all dependencies (OnchainKit, Wagmi, Farcaster SDK)
- [x] Configured Next.js for Frames
- [x] Set up providers (OnchainKit, Wagmi, QueryClient)
- [x] Created layout with Frame metadata
- [x] Converted strategy logic to TypeScript
- [x] Created MiniKit utilities for Farcaster integration
- [x] Built wallet connection component
- [x] Created BTC price fetching hook with fallbacks
- [x] Built main page with full functionality
- [x] **Tested successfully in browser** ✨
  - ✅ Live BTC price: $91,181.90
  - ✅ Coordinate: 181
  - ✅ Beams working: 226 BROKEN, 113 & 086 INTACT
  - ✅ Market direction: NEUTRAL
  - ✅ Recommendations displayed correctly
  - ✅ Wallet connect button ready
  - ✅ Share to Farcaster button working

## 📋 Before Deployment - Action Items

### 1. Get Coinbase API Key (REQUIRED)
- [ ] Go to https://portal.cdp.coinbase.com/
- [ ] Sign in or create account
- [ ] Create a new project
- [ ] Copy your API key
- [ ] Replace in `.env.local`: `NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_actual_key`

### 2. Create OG Image (REQUIRED for Frame)
- [ ] Create 1200x630px PNG image
- [ ] Include "⚔️ WHOLE NUMBER WAR" branding
- [ ] Add BTC price visualization
- [ ] Use dark theme (slate/yellow colors)
- [ ] Save as `public/opengraph-image.png`

**Quick OG Image Option:**
You can use Canva, Figma, or even screenshot the app and add text overlay!

### 3. Push to GitHub
```bash
cd "C:\Users\pouni\OneDrive\Documents\pounish.com\Mini Apps\whole-number-miniapp"
git init
git add .
git commit -m "Initial commit - Whole Number War Farcaster Mini App"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 4. Deploy to Vercel
- [ ] Go to https://vercel.com
- [ ] Sign in with GitHub
- [ ] Click "New Project"
- [ ] Import your repository
- [ ] **Don't click Deploy yet!**

### 5. Configure Environment Variables in Vercel
In Vercel project settings, add these:

**Required:**
- [ ] `NEXT_PUBLIC_ONCHAINKIT_API_KEY` = your actual Coinbase API key
- [ ] `NEXT_PUBLIC_CHAIN_ID` = 8453
- [ ] `NEXT_PUBLIC_APP_URL` = https://your-project.vercel.app

**Optional:**
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` = get from https://cloud.walletconnect.com/

### 6. Deploy!
- [ ] Click "Deploy" in Vercel
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Visit your deployed URL
- [ ] Test the app works

### 7. Test in Warpcast
- [ ] Open Warpcast app or desktop
- [ ] Create a test cast with your URL
- [ ] Verify Frame preview appears
- [ ] Click to open mini app
- [ ] Test wallet connection
- [ ] Test "Share to Farcaster" button

### 8. Validate Frame
- [ ] Go to https://warpcast.com/~/developers/frames
- [ ] Enter your deployed URL
- [ ] Check for any warnings
- [ ] Fix any issues

## 🔮 Optional Enhancements

### Phase 2 Features (can add later)
- [ ] Add paper trading with position tracking
- [ ] Create smart contract leaderboard on Base
- [ ] Add historical price chart
- [ ] Implement alert system
- [ ] Add NFT badges for achievements
- [ ] Create social feed of positions

## 📊 Success Metrics

After deployment, monitor:
- Frame click-through rate in Warpcast
- Wallet connection rate
- Share button usage
- BTC price API reliability
- Page load performance

## 🐛 Known Issues

1. **MiniKit deprecated warning**: Framework SDK is moving to `@farcaster/miniapp-sdk`. We're using openUrl workaround for now. Consider migrating in future.

2. **Frame context detection**: MiniKit will only fully initialize when running inside Warpcast. This is expected behavior.

3. **Wallet connection**: Requires OnchainKit API key to function. Free tier available from Coinbase.

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify all environment variables are set
3. Test API key at https://portal.cdp.coinbase.com/
4. Validate Frame metadata with Warpcast validator

## 🎉 Launch Checklist

Before announcing to community:
- [ ] Coinbase API key configured
- [ ] OG image created and deployed
- [ ] Tested in actual Warpcast app
- [ ] Wallet connection works
- [ ] BTC price updates live
- [ ] Share button works
- [ ] Mobile responsive verified
- [ ] Performance optimized (under 3s load)
- [ ] Frame validator shows no errors

---

**Current Status**: ✅ App built and tested locally  
**Next Step**: Get Coinbase API key and create OG image  
**Estimated Time to Deploy**: 30-60 minutes  

🚀 **You're almost there! Just need API key and OG image to deploy!**
