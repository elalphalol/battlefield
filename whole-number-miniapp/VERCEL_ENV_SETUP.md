# 🔧 Vercel Environment Variable Setup

## Critical: Set Production URL

The Frame metadata needs the correct production URL. Here's how to set it:

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select your project: **battlefield-roan**
3. Go to **Settings** → **Environment Variables**

### Step 2: Add/Update NEXT_PUBLIC_APP_URL

Add this environment variable:

```
Variable Name: NEXT_PUBLIC_APP_URL
Value: https://battlefield-roan.vercel.app
Environment: Production, Preview, Development (select all)
```

### Step 3: Redeploy

After adding the variable:
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. OR just push a new commit (it will auto-deploy)

### Why This Matters

The `NEXT_PUBLIC_APP_URL` is used in:
- `app/layout.tsx` - Frame metadata (fc:frame:image, fc:frame:button:target)
- `app/api/frame/route.ts` - Frame API responses
- `app/providers.tsx` - WalletConnect metadata

### Verify It's Working

After redeployment, check:
1. Visit: https://battlefield-roan.vercel.app
2. View page source (Ctrl+U)
3. Look for: `<meta property="fc:frame:image" content="https://battlefield-roan.vercel.app/opengraph-image.jpg" />`
4. Should show correct URL, not localhost

### Test the Frame

Once URL is correct:
1. Go to: https://warpcast.com/~/developers/frames
2. Enter: `https://battlefield-roan.vercel.app`
3. Should validate and show preview
4. Share URL in a cast - Frame should appear

---

**Current Status**: Environment variable needs to be set in Vercel dashboard
