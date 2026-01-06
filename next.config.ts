import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: false, // Prevent forced refresh, preserve form data
  cacheOnNavigation: true,
  register: true,
  scope: '/',
});

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

// Note: next.config.ts requires export default (Next.js convention)
export default withSerwist(nextConfig);
