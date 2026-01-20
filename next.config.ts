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
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  // Redirect old routes to Market Intelligence section
  async redirects() {
    return [
      // Story 17.3: Visualization redirect
      {
        source: '/visualization',
        destination: '/market-intelligence/visualization',
        permanent: true, // 308 status code for SEO
      },
      // Story 17.4: Questions redirect
      {
        source: '/questions',
        destination: '/market-intelligence/questions',
        permanent: true, // 308 status code for SEO
      },
      // Story 17.4: Questions detail page redirect (preserves ID param)
      {
        source: '/questions/:id',
        destination: '/market-intelligence/questions/:id',
        permanent: true,
      },
    ];
  },
};

// Note: next.config.ts requires export default (Next.js convention)
export default withSerwist(nextConfig);
