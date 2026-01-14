import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://98335a6193b809a5ce95f15b3d67ecd3@o4510706963251200.ingest.us.sentry.io/4510706977603585",

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Environment
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "development",
});
