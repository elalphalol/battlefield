# Share Image Generation Solutions

## The Problem
@vercel/og is not working on our Vercel deployment despite:
- ✅ Package installed correctly
- ✅ Route working (test endpoint responds)
- ✅ Simple ImageResponse tested
- ❌ All image generation returns blank page

This appears to be a Vercel/Next.js 16 configuration issue that would require deep debugging.

## Quick Fix (Recommended): Text-Only Sharing

**Pros:**
- ✅ Works immediately (already functional)
- ✅ No dependencies or external services
- ✅ No costs
- ✅ Users can still share wins/losses

**Cons:**
- ❌ No visual preview on social media
- ❌ Less engaging than images

**Implementation:** Already done! Just remove the image URL from copy

---

## Option 1: Cloudinary (Free Tier Available)

### Setup Steps:

1. **Sign up for Cloudinary**
   - Go to https://cloudinary.com
   - Free tier: 25 GB storage, 25 GB bandwidth/month
   - Create account

2. **Get API Keys**
   - Dashboard → Settings → API Keys
   - Copy: Cloud Name, API Key, API Secret

3. **Create Template Image**
   - Upload a base Battlefield template
   - Use text overlays via URL transformations

4. **Generate Dynamic URLs**
   ```javascript
   const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/` +
     `l_text:Arial_80_bold:${encodeURIComponent(username)},co_white,g_north,y_100/` +
     `l_text:Arial_120_bold:${encodeURIComponent(`+${pnl}%`)},co_rgb:22c55e,g_center/` +
     `battlefield_template.jpg`;
   ```

**Cost:** Free for most use cases, $0.01/1000 transformations on paid plan

---

## Option 2: Imgix (Professional, Paid)

### Setup Steps:

1. **Sign up for Imgix**
   - Go to https://imgix.com
   - 14-day free trial, then $10/month minimum

2. **Upload Template**
   - Create source (S3, web folder, etc.)
   - Upload base template image

3. **Generate URLs**
   ```javascript
   const imgixUrl = `https://your-source.imgix.net/template.jpg?` +
     `txt=${encodeURIComponent(username)}&txt-size=80&txt-color=fff&txt-pos=top` +
     `&txt=${encodeURIComponent(`+${pnl}%`)}&txt-size=120&txt-color=22c55e`;
   ```

**Cost:** $10/month minimum

---

## Option 3: Canvas API (Server-Side)

### Setup Steps:

1. **Install canvas package**
   ```bash
   npm install canvas
   ```

2. **Create API endpoint**
   ```javascript
   import { createCanvas } from 'canvas';
   
   export async function GET(request: Request) {
     const canvas = createCanvas(1200, 630);
     const ctx = canvas.getContext('2d');
     
     // Draw background
     ctx.fillStyle = '#14532d';
     ctx.fillRect(0, 0, 1200, 630);
     
     // Draw text
     ctx.fillStyle = '#fbbf24';
     ctx.font = 'bold 60px Arial';
     ctx.fillText('BATTLEFIELD', 400, 100);
     
     // Return as PNG
     return new Response(canvas.toBuffer('image/png'), {
       headers: { 'Content-Type': 'image/png' }
     });
   }
   ```

**Pros:** Self-hosted, no external dependencies
**Cons:** Requires node canvas (may have deployment issues)

---

## Option 4: Static Template + No Dynamic Image

### The Simplest Working Solution

1. **Create single static share image**
   - Design in Figma/Photoshop
   - Generic "Share your Battlefield wins!" image
   - Upload to `/public/share-template.jpg`

2. **Use same image for all shares**
   ```javascript
   const imageUrl = `${window.location.origin}/share-template.jpg`;
   ```

3. **Text shows the actual trade details**

**Pros:**
- ✅ Works immediately
- ✅ No external services
- ✅ No costs
- ✅ Still shows preview image on social

**Cons:**
- ❌ Not personalized per trade

---

## Recommended Approach: Disable Images For Now

Given the time investment vs. value:

1. **Remove image generation**
2. **Keep text sharing working**  
3. **Add images later** when we have time to debug @vercel/og properly

Users can still brag about wins - they just won't have fancy image previews.

---

## If You Want To Proceed With External Service:

Let me know which option you prefer and I'll implement it:
- **Cloudinary** = Best balance of features/cost
- **Static image** = Quickest to implement
- **Just text** = Already working, no changes needed
