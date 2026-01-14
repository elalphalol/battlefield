import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  // Exclude backend folder from build
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/backend/**', '**/node_modules/**'],
    };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.coinbase.com',
      },
      {
        protocol: 'https',
        hostname: 'blockchain.info',
      },
    ],
  },
  // Enable experimental features for Frames
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Headers for Frame security and .well-known
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
      {
        source: '/.well-known/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry organization and project
  org: "hjdd",
  project: "battlefield-frontend",

  // Suppress logs unless in CI
  silent: !process.env.CI,

  // Source maps configuration
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
