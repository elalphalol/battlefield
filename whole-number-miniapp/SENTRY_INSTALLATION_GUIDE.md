# Sentry Installation Guide for BATTLEFIELD

This guide covers setting up Sentry for both the Next.js frontend and Express backend of your BATTLEFIELD app deployed on Vercel.

---

## 🎯 Overview

Sentry provides real-time error tracking and monitoring for both frontend and backend. This setup will:
- Track JavaScript/React errors in the Next.js app
- Monitor API errors in the Express backend
- Capture performance metrics
- Track user sessions and replay errors

---

## 📦 Part 1: Frontend Setup (Next.js)

### Step 1: Install Sentry Wizard

Run the Sentry wizard in your `whole-number-miniapp` directory:

```bash
cd whole-number-miniapp
npx @sentry/wizard@latest -i nextjs
```

The wizard will:
- Install required dependencies (`@sentry/nextjs`)
- Create configuration files
- Set up source maps
- Configure environment variables

### Step 2: Manual Installation (Alternative)

If you prefer manual installation:

```bash
cd whole-number-miniapp
npm install @sentry/nextjs --save
```

### Step 3: Create Sentry Configuration Files

Create `sentry.client.config.ts` in the root of `whole-number-miniapp`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions (adjust in production)
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // Capture 10% of all sessions
  replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
  
  // Environment
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "development",
  
  // Ignore specific errors (optional)
  ignoreErrors: [
    // Browser extensions
    "Non-Error promise rejection captured",
    // Network errors
    "NetworkError",
    "Failed to fetch",
  ],
  
  // Additional configuration
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

Create `sentry.server.config.ts` in the root of `whole-number-miniapp`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Environment
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "development",
  
  // Don't send errors in development
  enabled: process.env.NODE_ENV === "production",
});
```

Create `sentry.edge.config.ts` in the root of `whole-number-miniapp` (for Edge Runtime):

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "development",
});
```

### Step 4: Update Next.js Configuration

Update `next.config.ts` to include Sentry:

```typescript
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // Your existing Next.js config
  // ...
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Additional config options
  silent: true, // Suppresses all logs
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Source maps configuration
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
};

// Wrap the config with Sentry
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
```

### Step 5: Environment Variables for Frontend

Add these to your Vercel project (Settings → Environment Variables):

```bash
# Required
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id

# For source maps upload (build-time only)
SENTRY_AUTH_TOKEN=your-auth-token-here
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

---

## 🔧 Part 2: Backend Setup (Express)

### Step 1: Install Sentry for Node.js

```bash
cd backend
npm install @sentry/node @sentry/profiling-node --save
```

### Step 2: Update `server.ts`

Add Sentry initialization at the **very top** of your `server.ts`:

```typescript
// Import Sentry FIRST, before any other imports
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Initialize Sentry BEFORE any other code
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Profiling
  profilesSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV || "development",
  
  // Server name
  serverName: process.env.RAILWAY_SERVICE_NAME || "battlefield-backend",
  
  integrations: [
    nodeProfilingIntegration(),
  ],
});

// Now import other dependencies
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// ... rest of your imports

dotenv.config();

const app = express();

// Sentry request handler MUST be the first middleware
app.use(Sentry.Handlers.requestHandler());

// Optional: Sentry tracing middleware
app.use(Sentry.Handlers.tracingHandler());

// Your existing middleware
app.use(cors());
app.use(express.json());

// Your routes here
// ...

// Sentry error handler MUST be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

// Optional: fallback error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 3: Environment Variables for Backend

Add to your backend environment (Railway, etc.):

```bash
SENTRY_DSN=https://your-backend-dsn@sentry.io/your-backend-project-id
NODE_ENV=production
```

---

## 🎨 Part 3: Setting Up Sentry Projects

### Step 1: Create Sentry Account
1. Go to [sentry.io](https://sentry.io)
2. Sign up or log in
3. Create an organization (if you don't have one)

### Step 2: Create Projects

Create **two separate projects** in Sentry:

#### Project 1: Frontend (Next.js)
- Platform: **Next.js**
- Project Name: `battlefield-frontend` or similar
- Copy the DSN → use as `NEXT_PUBLIC_SENTRY_DSN`

#### Project 2: Backend (Express)
- Platform: **Express**
- Project Name: `battlefield-backend` or similar
- Copy the DSN → use as `SENTRY_DSN` in backend

### Step 3: Generate Auth Token

For source maps (frontend only):
1. Go to Settings → Auth Tokens
2. Create new token with scope: `project:releases`
3. Copy token → use as `SENTRY_AUTH_TOKEN`

---

## 🚀 Part 4: Deploy to Vercel

### Step 1: Add Environment Variables to Vercel

Go to your Vercel project → Settings → Environment Variables:

```
NEXT_PUBLIC_SENTRY_DSN=https://...    (All environments)
SENTRY_AUTH_TOKEN=sntrys_...          (Production only)
SENTRY_ORG=your-org-slug              (Production only)
SENTRY_PROJECT=battlefield-frontend   (Production only)
```

### Step 2: Redeploy

```bash
git add .
git commit -m "Add Sentry monitoring"
git push origin main
```

Vercel will automatically redeploy with Sentry enabled.

---

## 🧪 Part 5: Testing Sentry Integration

### Test Frontend Error Tracking

Add a test button to any page:

```tsx
<button onClick={() => {
  throw new Error("Sentry frontend test error");
}}>
  Test Sentry Frontend
</button>
```

### Test Backend Error Tracking

Add a test endpoint in `server.ts`:

```typescript
app.get('/api/test-sentry', (req, res) => {
  throw new Error("Sentry backend test error");
});
```

Visit: `https://your-backend-url/api/test-sentry`

### Verify in Sentry Dashboard
1. Go to sentry.io
2. Check Issues tab
3. You should see your test errors appear within seconds

---

## 📊 Part 6: Advanced Configuration (Optional)

### Custom Error Boundaries

Create `app/components/ErrorBoundary.tsx`:

```tsx
'use client';

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  );
}
```

Use name `error.tsx` in any route folder.

### Custom Context and Tags

```typescript
import * as Sentry from "@sentry/nextjs";

// Set user context
Sentry.setUser({
  id: userId,
  username: username,
  army: "bulls" // or "bears"
});

// Set custom tags
Sentry.setTag("army", "bulls");
Sentry.setTag("feature", "trading");

// Add breadcrumbs
Sentry.addBreadcrumb({
  message: "User opened trading panel",
  level: "info",
  data: { position: "long" }
});

// Capture custom events
Sentry.captureMessage("High leverage trade attempted", "warning");
```

### Filter Sensitive Data

Update `sentry.server.config.ts`:

```typescript
Sentry.init({
  // ... other config
  
  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    
    // Don't send certain errors
    if (event.exception?.values?.[0]?.value?.includes("wallet")) {
      return null;
    }
    
    return event;
  },
});
```

---

## 📋 Quick Reference: Commands

```bash
# Frontend Sentry setup
cd whole-number-miniapp
npx @sentry/wizard@latest -i nextjs

# Backend Sentry setup
cd backend
npm install @sentry/node @sentry/profiling-node --save

# Test the installation locally
npm run dev  # Frontend
npm run dev  # Backend

# Deploy
git add .
git commit -m "Add Sentry integration"
git push
```

---

## 🔍 Troubleshooting

### Source Maps Not Uploading
- Check `SENTRY_AUTH_TOKEN` is set in Vercel
- Verify token has `project:releases` scope
- Check build logs for Sentry upload status

### Errors Not Appearing
- Verify DSN is correct
- Check environment variables are set
- Ensure `enabled: true` in production config
- Check network tab for Sentry requests

### Too Many Events
- Reduce `tracesSampleRate` from 1.0 to 0.1 (10%)
- Reduce `replaysSessionSampleRate` to 0.01 (1%)
- Add more filters in `ignoreErrors`

---

## 🎯 Performance Tips

### Production Settings

```typescript
// Adjust these for production to reduce quota usage
{
  tracesSampleRate: 0.1,        // 10% of transactions
  replaysSessionSampleRate: 0.01, // 1% of sessions
  replaysOnErrorSampleRate: 1.0,  // 100% of errors
}
```

### Monitor Your Quota
- Check Sentry dashboard → Stats
- Set up quota alerts
- Adjust sample rates as needed

---

## 📚 Additional Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Express Docs](https://docs.sentry.io/platforms/node/guides/express/)
- [Sentry Vercel Integration](https://vercel.com/integrations/sentry)
- [Source Maps Guide](https://docs.sentry.io/platforms/javascript/sourcemaps/)

---

## ✅ Checklist

- [ ] Create Sentry account and organization
- [ ] Create frontend project in Sentry
- [ ] Create backend project in Sentry
- [ ] Install `@sentry/nextjs` in frontend
- [ ] Install `@sentry/node` in backend
- [ ] Create Sentry config files
- [ ] Update `next.config.ts`
- [ ] Update `server.ts` with Sentry middleware
- [ ] Add environment variables to Vercel
- [ ] Add environment variables to Railway/backend host
- [ ] Deploy and test frontend errors
- [ ] Deploy and test backend errors
- [ ] Verify errors appear in Sentry dashboard
- [ ] Configure alerts and notifications
- [ ] Adjust sample rates for production

---

**Ready to start?** Begin with Part 1 (Frontend Setup) and work your way through each section!
